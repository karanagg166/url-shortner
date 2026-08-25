import os
from supabase import create_client

supabase_client = None


def init_supabase():
  global supabase_client
  url = os.getenv("SUPABASE_URL")
  key = os.getenv("SUPABASE_KEY")
  if url and key:
    supabase_client = create_client(url, key)
  return supabase_client


def get_supabase():
  return supabase_client
