import os

# Settings reads these eagerly at import time, so they must exist before
# any test imports app.config (directly or via app.schemas / app.routes).
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("SUPABASE_BUCKET_NAME", "test-bucket")
os.environ.setdefault("ALLOWED_ORIGINS", "http://localhost:5173")
