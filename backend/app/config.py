import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    gcs_bucket_name: str = os.environ["GCS_BUCKET_NAME"]
    allowed_origins: list[str] = [
        origin.strip()
        for origin in os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    ]
    max_range_days: int = 31
    open_meteo_base_url: str = "https://archive-api.open-meteo.com/v1/archive"


settings = Settings()
