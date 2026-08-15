import json

from supabase import Client, create_client

from app.config import settings


class WeatherStorage:
    """Thin wrapper around the Supabase Storage bucket used to persist raw Open-Meteo responses.

    The Supabase client is created on first use, not at construction, so
    importing this module never requires Supabase credentials to be present -
    only calling one of the methods below does.
    """

    def __init__(self) -> None:
        self._client: Client | None = None

    def _bucket(self):
        if self._client is None:
            self._client = create_client(settings.supabase_url, settings.supabase_key)
        return self._client.storage.from_(settings.supabase_bucket_name)

    def upload_json(self, name: str, data: dict) -> None:
        self._bucket().upload(
            name,
            json.dumps(data).encode("utf-8"),
            {"content-type": "application/json"},
        )

    def list_files(self) -> list[dict]:
        return [
            {
                "name": obj["name"],
                "size": (obj.get("metadata") or {}).get("size", 0),
                "created_at": obj.get("created_at"),
            }
            for obj in self._bucket().list()
        ]

    def get_json(self, name: str) -> dict | None:
        # storage3 raises on a missing object rather than exposing an exists()
        # check, so a failed download is the not-found signal here.
        try:
            raw = self._bucket().download(name)
        except Exception:
            return None
        return json.loads(raw.decode("utf-8"))


storage = WeatherStorage()
