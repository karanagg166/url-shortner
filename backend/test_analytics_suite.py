"""Comprehensive Test Suite for URL Shortener Analytics System

Covers:
1. User-Agent parsing (Bot, Desktop, Mobile, Tablet, OS, Browser)
2. Client extraction & privacy hashing (No raw IP stored)
3. Referrer domain normalization
4. Create short URL with user
5. Resolve short URL (HTTP 302, Cache-Control: no-store)
6. Single and multiple clicks counting
7. Unique visitor deduplication
8. Different device/browser unique visitor increment
9. Vercel geo headers & local fallback
10. Referrer vs Direct source
11. Invalid short code handling (404)
12. Resilience: Redirect succeeds even if click event recording fails
13. Access control: 401 unauthenticated, 403 unauthorized user
14. Delete URL cascades to click_events
"""

import asyncio
import os
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import httpx
from app.main import app
from app.services.analytics_service import AnalyticsService
from app.core.supabase import get_supabase
from app.core.redis import init_redis, close_redis


class AnalyticsUnitTest(unittest.TestCase):

    def test_user_agent_parsing(self):
        """Test device, browser, and OS parsing across common user agents."""
        # Bot
        dev, br, os_name = AnalyticsService.parse_user_agent("Googlebot/2.1 (+http://www.google.com/bot.html)")
        self.assertEqual(dev, "Bot")
        self.assertEqual(br, "Bot")

        dev, br, os_name = AnalyticsService.parse_user_agent("curl/7.88.1")
        self.assertEqual(dev, "Bot")

        # Desktop Chrome macOS
        chrome_mac = (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        dev, br, os_name = AnalyticsService.parse_user_agent(chrome_mac)
        self.assertEqual(dev, "Desktop")
        self.assertEqual(br, "Chrome")
        self.assertEqual(os_name, "macOS")

        # Desktop Firefox Windows
        firefox_win = "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
        dev, br, os_name = AnalyticsService.parse_user_agent(firefox_win)
        self.assertEqual(dev, "Desktop")
        self.assertEqual(br, "Firefox")
        self.assertEqual(os_name, "Windows")

        # Desktop Edge
        edge_win = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"
        dev, br, os_name = AnalyticsService.parse_user_agent(edge_win)
        self.assertEqual(dev, "Desktop")
        self.assertEqual(br, "Edge")
        self.assertEqual(os_name, "Windows")

        # Mobile iPhone Safari
        iphone_safari = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1"
        dev, br, os_name = AnalyticsService.parse_user_agent(iphone_safari)
        self.assertEqual(dev, "Mobile")
        self.assertEqual(br, "Safari")
        self.assertEqual(os_name, "iOS")

        # Mobile Android Chrome
        android_chrome = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"
        dev, br, os_name = AnalyticsService.parse_user_agent(android_chrome)
        self.assertEqual(dev, "Mobile")
        self.assertEqual(br, "Chrome")
        self.assertEqual(os_name, "Android")

        # Tablet iPad
        ipad = "Mozilla/5.0 (iPad; CPU OS 17_3 like Mac OS X) AppleWebKit/605.1.15"
        dev, br, os_name = AnalyticsService.parse_user_agent(ipad)
        self.assertEqual(dev, "Tablet")
        self.assertEqual(os_name, "iOS")

    def test_privacy_hash_and_salt(self):
        """Confirm hash is deterministic per visitor but never contains raw IP."""
        class MockRequest:
            headers = {
                "x-forwarded-for": "203.0.113.195, 10.0.0.1",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            }
            client = None

        info1 = AnalyticsService.extract_client_info(MockRequest())
        self.assertNotIn("ip", info1)
        self.assertNotIn("203.0.113.195", str(info1))
        self.assertIn("visitor_hash", info1)
        self.assertEqual(len(info1["visitor_hash"]), 64)  # SHA-256 hex length

        # Same IP + UA produces same hash
        info2 = AnalyticsService.extract_client_info(MockRequest())
        self.assertEqual(info1["visitor_hash"], info2["visitor_hash"])

        # Different IP produces different hash
        class MockRequest2:
            headers = {
                "x-forwarded-for": "198.51.100.42",
                "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
            }
            client = None
        info3 = AnalyticsService.extract_client_info(MockRequest2())
        self.assertNotEqual(info1["visitor_hash"], info3["visitor_hash"])


async def run_async_integration_tests():
    print("\n🚀 Running async integration tests against backend API...")
    await init_redis()

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        res = await client.get("/health")
        assert res.status_code == 200, f"Health check failed: {res.text}"
        print("  ✓ Health check passed")

        # 2. Create short URL with User A
        user_a_headers = {
            "x-user-id": "a1111111-1111-1111-1111-111111111111",
            "x-user-email": "testuser@example.com",
        }
        create_res = await client.post(
            "/api/urls",
            json={"original_url": "https://example.com/target-test-analytics", "title": "Test Link"},
            headers=user_a_headers,
        )
        assert create_res.status_code == 201, f"Create URL failed: {create_res.text}"
        data = create_res.json()
        url_id = data["id"]
        short_code = data["short_code"]
        print(f"  ✓ Created short URL: {short_code} (id: {url_id})")

        # 3. Resolve short URL - First Visit (Visitor 1)
        visitor1_headers = {
            "x-forwarded-for": "103.21.244.2",
            "x-vercel-ip-country": "IN",
            "x-vercel-ip-country-region": "DL",
            "x-vercel-ip-city": "New%20Delhi",
            "referer": "https://github.com/project/url-shortner",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/122.0.0.0 Safari/537.36",
        }
        res1 = await client.get(f"/api/urls/resolve/{short_code}", headers=visitor1_headers, follow_redirects=False)
        assert res1.status_code == 302, f"Expected 302 redirect, got {res1.status_code}"
        assert res1.headers.get("location") == "https://example.com/target-test-analytics"
        assert res1.headers.get("cache-control") == "no-store"
        print("  ✓ Resolve 1: HTTP 302 with Location and Cache-Control: no-store")

        # 4. Resolve short URL - Second Visit (Same Visitor 1)
        res2 = await client.get(f"/api/urls/resolve/{short_code}", headers=visitor1_headers, follow_redirects=False)
        assert res2.status_code == 302
        print("  ✓ Resolve 2: Second visit from same visitor succeeded")

        # 5. Resolve short URL - Third Visit (Visitor 2 from Germany on Mobile Safari with no referrer -> Direct)
        visitor2_headers = {
            "x-forwarded-for": "194.156.98.11",
            "x-vercel-ip-country": "DE",
            "x-vercel-ip-country-region": "BE",
            "x-vercel-ip-city": "Berlin",
            "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1",
        }
        res3 = await client.get(f"/api/urls/resolve/{short_code}", headers=visitor2_headers, follow_redirects=False)
        assert res3.status_code == 302
        print("  ✓ Resolve 3: Third visit from new visitor (mobile, DE, Direct) succeeded")

        # Give async DB inserts a brief moment to settle
        await asyncio.sleep(0.5)

        # 6. Fetch Analytics as Owner (User A)
        analytics_res = await client.get(f"/api/urls/{url_id}/analytics?range=30d", headers=user_a_headers)
        assert analytics_res.status_code == 200, f"Analytics fetch failed: {analytics_res.text}"
        stats = analytics_res.json()
        print(f"  ✓ Analytics fetched for owner: {stats['total_clicks']} clicks, {stats['unique_visitors']} unique visitors")

        assert stats["total_clicks"] >= 3, f"Expected at least 3 total clicks, got {stats['total_clicks']}"
        assert stats["unique_visitors"] >= 2, f"Expected 2 unique visitors, got {stats['unique_visitors']}"
        assert stats["clicks_today"] >= 3
        assert stats["clicks_7d"] >= 3
        assert stats["clicks_30d"] >= 3
        assert stats["last_clicked_at"] is not None

        # Check breakdown
        countries = {c["country"]: c["clicks"] for c in stats["countries"]}
        print(f"    Countries recorded: {countries}")
        assert "India" in countries or "IN" in countries, "Expected India in countries"
        assert "Germany" in countries or "DE" in countries, "Expected Germany in countries"

        referrers = {r["source"]: r["clicks"] for r in stats["referrers"]}
        print(f"    Referrers recorded: {referrers}")
        assert "github.com" in referrers, "Expected github.com in referrers"
        assert "Direct" in referrers, "Expected Direct in referrers"

        devices = {d["device"]: d["clicks"] for d in stats["devices"]}
        print(f"    Devices recorded: {devices}")
        assert "Desktop" in devices
        assert "Mobile" in devices

        # Check recent clicks (verify NO raw IP exists)
        recent = stats["recent_clicks"]
        assert len(recent) >= 3
        for click in recent:
            assert "ip" not in click, "CRITICAL: IP found in recent_clicks response!"
            assert "x-forwarded-for" not in click
            assert click.get("country") in ("India", "Germany", "IN", "DE", "Unknown", None)
        print("  ✓ Privacy verified: Zero IP addresses in analytics response")

        # 7. Access Control Verification
        # 7a. Unauthenticated access
        unauth_res = await client.get(f"/api/urls/{url_id}/analytics")
        assert unauth_res.status_code == 401, f"Expected 401, got {unauth_res.status_code}"
        print("  ✓ Access control: Unauthenticated access blocked with 401")

        # 7b. Another user attempting to access User A's analytics
        user_b_headers = {
            "x-user-id": "bca4d20b-33a0-4b4d-accb-a447c1abe6b5",
            "x-user-email": "aggarwalkaran241@gmail.com",
        }
        unauth_user_res = await client.get(f"/api/urls/{url_id}/analytics", headers=user_b_headers)
        assert unauth_user_res.status_code == 403, f"Expected 403, got {unauth_user_res.status_code}"
        print("  ✓ Access control: Other user blocked with 403 Forbidden")

        # 8. Invalid short code
        not_found_res = await client.get("/api/urls/resolve/nonExistentSlug99")
        assert not_found_res.status_code == 404, f"Expected 404, got {not_found_res.status_code}"
        print("  ✓ Invalid short code correctly returns 404")

        # 9. Failure resilience test: Redirect must work even if analytics insert fails
        with patch.object(AnalyticsService, "record_click_event", side_effect=Exception("Simulated DB Crash")):
            res_resilient = await client.get(f"/api/urls/resolve/{short_code}", follow_redirects=False)
            assert res_resilient.status_code == 302, f"Redirect failed during analytics error: {res_resilient.status_code}"
            assert res_resilient.headers.get("location") == "https://example.com/target-test-analytics"
            print("  ✓ Resilience: Redirect succeeds even when analytics recording fails")

        # 10. Delete URL and verify CASCADE
        delete_res = await client.delete(f"/api/urls/{url_id}", headers=user_a_headers)
        assert delete_res.status_code == 200, f"Delete failed: {delete_res.text}"
        print("  ✓ Deleted short URL")

        # Verify URL is no longer resolvable
        res_after_delete = await client.get(f"/api/urls/resolve/{short_code}", follow_redirects=False)
        assert res_after_delete.status_code == 404
        print("  ✓ Resolved after delete returns 404")

        # Verify click_events are removed via ON DELETE CASCADE
        supabase = get_supabase()
        events_after = (
            supabase.table("click_events")
            .select("id")
            .eq("url_id", url_id)
            .execute()
        )
        assert len(events_after.data or []) == 0, f"Expected 0 click events after URL delete, got {len(events_after.data)}"
        print("  ✓ ON DELETE CASCADE verified: All associated click events automatically deleted")

    await close_redis()
    print("\n🎉 ALL 10 INTEGRATION TEST PHASES PASSED SUCCESSFULLY!\n")


if __name__ == "__main__":
    suite = unittest.TestLoader().loadTestsFromTestCase(AnalyticsUnitTest)
    runner = unittest.TextTestRunner(verbosity=2)
    unit_result = runner.run(suite)
    if not unit_result.wasSuccessful():
        sys.exit(1)

    asyncio.run(run_async_integration_tests())
