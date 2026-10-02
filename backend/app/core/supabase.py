import os
from supabase import create_client

supabase_client = None


def init_supabase():
  global supabase_client
  url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
  key = (
      os.getenv("SUPABASE_SERVICE_ROLE_KEY")
      or os.getenv("SUPABASE_PUBLISHABLE_KEY")
      or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
      or os.getenv("SUPABASE_ANON_KEY")
      or os.getenv("SUPABASE_KEY")
      or os.getenv("SUPABASE_SECRET_KEY")
  )
  if url and key:
    supabase_client = create_client(url, key)
  return supabase_client


def get_supabase():
  global supabase_client
  if supabase_client is None:
    init_supabase()
  return supabase_client
