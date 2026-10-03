"""Test Suite for Custom Slug / Custom Mapping Name & Availability System

Covers:
1. Valid custom mapping names (e.g. 'karan-resume', 'my-portfolio', 'project_123')
2. Invalid formats (too short, too long, special characters, spaces)
3. Reserved system keywords (e.g. 'api', 'dashboard', 'login', 'graphql')
4. Real-time availability endpoint (/api/urls/check-availability?slug=...)
5. Real-time availability path endpoint (/api/urls/check/{slug})
6. GraphQL query checkSlugAvailability
7. Creating URL with custom slug 'karan-resume'
8. Re-checking availability of 'karan-resume' (must report taken)
9. Creating duplicate custom slug fails with 400 Bad Request
10. Resolving custom slug redirects via HTTP 302 to destination URL
11. Cleanup test URL
"""

import asyncio
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

import httpx
from app.main import app
from app.services.url_service import UrlService
from app.core.redis import init_redis, close_redis


class CustomSlugUnitTest(unittest.IsolatedAsyncioTestCase):

    async def asyncSetUp(self):
        await init_redis()

    async def asyncTearDown(self):
        await close_redis()

    async def test_slug_format_validation(self):
        # Empty
        res = await UrlService.check_slug_availability("")
        self.assertFalse(res["available"])
        self.assertEqual(res["reason"], "invalid_format")

        # Too short (< 2 chars)
        res = await UrlService.check_slug_availability("a")
        self.assertFalse(res["available"])
        self.assertEqual(res["reason"], "invalid_format")

        # Too long (> 50 chars)
        res = await UrlService.check_slug_availability("a" * 51)
        self.assertFalse(res["available"])
        self.assertEqual(res["reason"], "invalid_format")

        # Invalid characters (spaces, special symbols)
        res = await UrlService.check_slug_availability("karan resume")
        self.assertFalse(res["available"])
        self.assertEqual(res["reason"], "invalid_format")

        res = await UrlService.check_slug_availability("karan@resume!")
        self.assertFalse(res["available"])
        self.assertEqual(res["reason"], "invalid_format")

    async def test_reserved_slugs(self):
        reserved_examples = ["api", "dashboard", "login", "register", "graphql", "health"]
        for slug in reserved_examples:
            res = await UrlService.check_slug_availability(slug)
            self.assertFalse(res["available"], f"Reserved slug '{slug}' should not be available")
            self.assertEqual(res["reason"], "reserved")


async def run_integration_tests():
    print("\n🚀 Running custom slug integration tests against FastAPI app...")
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Check availability of unique test slug
        test_slug = f"karan-resume-test-{os.urandom(3).hex()}"
        res = await client.get(f"/api/urls/check-availability?slug={test_slug}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert data["available"] is True
        assert data["slug"] == test_slug
        print(f"  ✓ Check availability for '{test_slug}' returned available: True")

        # 2. Check path-based availability
        res_path = await client.get(f"/api/urls/check/{test_slug}")
        assert res_path.status_code == 200
        assert res_path.json()["available"] is True
        print(f"  ✓ Path check '/api/urls/check/{test_slug}' succeeded")

        # 3. Check reserved slug via API
        res_reserved = await client.get("/api/urls/check-availability?slug=dashboard")
        assert res_reserved.status_code == 200
        data_res = res_reserved.json()
        assert data_res["available"] is False
        assert data_res["reason"] == "reserved"
        print("  ✓ Reserved keyword 'dashboard' correctly rejected as unavailable")

        # 4. GraphQL query checkSlugAvailability
        gql_query = """
        query CheckSlug($slug: String!) {
          checkSlugAvailability(slug: $slug) {
            available
            slug
            message
            reason
          }
        }
        """
        gql_res = await client.post("/graphql", json={"query": gql_query, "variables": {"slug": test_slug}})
        assert gql_res.status_code == 200
        gql_data = gql_res.json()
        assert "data" in gql_data
        assert gql_data["data"]["checkSlugAvailability"]["available"] is True
        print("  ✓ GraphQL checkSlugAvailability query returned available: True")

        # 5. Create short URL with custom mapping name
        create_res = await client.post(
            "/api/urls",
            json={
                "original_url": "https://karan.dev/resume",
                "custom_slug": test_slug,
                "title": "Karan's Resume",
            },
        )
        assert create_res.status_code == 201, f"Create failed: {create_res.text}"
        created = create_res.json()
        assert created["short_code"] == test_slug
        created_id = created["id"]
        print(f"  ✓ Created short URL with custom slug: {created['short_code']} (id: {created_id})")

        # 6. Verify availability check now reports TAKEN
        res_after = await client.get(f"/api/urls/check-availability?slug={test_slug}")
        assert res_after.status_code == 200
        data_after = res_after.json()
        assert data_after["available"] is False
        assert data_after["reason"] == "already_taken"
        print(f"  ✓ Verified '{test_slug}' is now reported as taken")

        # 7. Attempting duplicate creation must fail with 400
        dup_res = await client.post(
            "/api/urls",
            json={
                "original_url": "https://google.com",
                "custom_slug": test_slug,
            },
        )
        assert dup_res.status_code == 400
        print("  ✓ Duplicate custom slug correctly rejected with HTTP 400")

        # 8. Resolve custom slug redirects with 302
        resolve_res = await client.get(f"/api/urls/resolve/{test_slug}", follow_redirects=False)
        assert resolve_res.status_code == 302
        assert resolve_res.headers["location"] == "https://karan.dev/resume"
        print(f"  ✓ Resolved '{test_slug}' -> HTTP 302 to {resolve_res.headers['location']}")

        # 9. Cleanup test URL from DB
        from app.core.supabase import get_supabase
        supabase = get_supabase()
        if supabase:
            supabase.table("urls").delete().eq("id", created_id).execute()
        from app.core.redis import get_redis
        redis = get_redis()
        if redis:
            await redis.delete(f"url:{test_slug}")
            await redis.delete(f"url_id:{test_slug}")
            await redis.delete(f"clicks:{test_slug}")
        print("  ✓ Cleaned up test record")

        print("\n🎉 ALL CUSTOM SLUG INTEGRATION TESTS PASSED!")


if __name__ == "__main__":
    unittest.main(exit=False)
    asyncio.run(run_integration_tests())
