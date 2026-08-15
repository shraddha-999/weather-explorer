import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    supabase_url: str = os.environ["SUPABASE_URL"]
    supabase_key: str = os.environ["SUPABASE_KEY"]
    supabase_bucket_name: str = os.environ.get("SUPABASE_BUCKET_NAME", "weather-data")
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    max_range_days: int = 31
    open_meteo_base_url: str = "https://archive-api.open-meteo.com/v1/archive"


settings = Settings()
