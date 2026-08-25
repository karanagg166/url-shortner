"""Quick test to verify database, Supabase, and Redis connections."""
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv

load_dotenv()


def test_supabase():
    """Test Supabase Client connection."""
    url = os.getenv("SUPABASE_URL")
    key = (
        os.getenv("SUPABASE_SECRET_KEY")
        or os.getenv("SUPABASE_KEY")
        or os.getenv("SUPABASE_PUBLISHABLE_KEY")
    )

    if not url or not key:
        print("⚠️  SUPABASE_URL or SUPABASE_KEY not set in .env")
        return False

    try:
        from supabase import create_client

        supabase = create_client(url, key)
        # Test Auth service reachability
        supabase.auth.get_session()
        print(f"✅ Supabase connected successfully!")
        print(f"   URL: {url}")
        return True
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return False


def test_postgres():
    """Test PostgreSQL connection string if present."""
    url = os.getenv("DATABASE_URL")
    if not url:
        print("ℹ️  DATABASE_URL not set (skipping direct Postgres test)")
        return True

    try:
        import psycopg2

        conn = psycopg2.connect(url)
        cur = conn.cursor()
        cur.execute("SELECT version();")
        version = cur.fetchone()[0]
        cur.close()
        conn.close()
        print(f"✅ PostgreSQL direct connection connected!")
        print(f"   {version}")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL direct connection failed: {e}")
        return False


def test_redis():
    """Test Redis connection (Upstash or local/docker)."""
    import redis

    upstash_url = os.getenv("UPSTASH_REDIS_REST_URL")
    upstash_token = os.getenv("UPSTASH_REDIS_REST_TOKEN")
    redis_url = os.getenv("REDIS_URL")

    if upstash_url and upstash_token:
        host = upstash_url.replace("https://", "").replace("http://", "").split("/")[0]
        try:
            r = redis.Redis(
                host=host,
                port=6379,
                password=upstash_token,
                ssl=True,
                decode_responses=True,
            )
            pong = r.ping()
            print(f"✅ Upstash Redis connected via TLS! ({host}) PING → {pong}")
            return True
        except Exception as e:
            print(f"❌ Upstash Redis connection failed: {e}")
            return False
    elif redis_url:
        try:
            r = redis.from_url(redis_url, decode_responses=True)
            pong = r.ping()
            print(f"✅ Redis connected! PING → {pong}")
            return True
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            return False
    else:
        host = os.getenv("REDIS_HOST", "localhost")
        port = int(os.getenv("REDIS_PORT", "6379"))
        password = os.getenv("REDIS_PASSWORD", None)

        try:
            r = redis.Redis(host=host, port=port, password=password, decode_responses=True)
            pong = r.ping()
            print(f"✅ Local/Docker Redis connected! PING → {pong}")
            return True
        except Exception as e:
            print(f"❌ Redis connection failed: {e}")
            print(f"   (Is Redis running on {host}:{port}?)")
            return False


if __name__ == "__main__":
    print("🔍 Testing backend connections...\n")

    supabase_ok = test_supabase()
    print()
    redis_ok = test_redis()
    print()
    pg_ok = test_postgres()

    print("\n" + "─" * 45)
    print(f"Supabase Client: {'✅ OK' if supabase_ok else '❌ FAIL'}")
    print(f"Redis (Upstash): {'✅ OK' if redis_ok else '❌ FAIL'}")
    print(f"PostgreSQL DB:   {'✅ OK' if pg_ok else '❌ FAIL'}")
    print("─" * 45)

    sys.exit(0 if (supabase_ok and redis_ok) else 1)
