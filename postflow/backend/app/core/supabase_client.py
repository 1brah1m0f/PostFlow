import logging
from functools import lru_cache

from supabase import Client, create_client

from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_anon_client() -> Client:
    """Anon-key client. Respects RLS. Use only for JWT validation."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_ANON_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_ANON_KEY must be set")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)


@lru_cache(maxsize=1)
def get_admin_client() -> Client:
    """Service-role client. Bypasses RLS. Use for all DB/Storage ops in API and worker."""
    if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
