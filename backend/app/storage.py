import json

from google.cloud import storage as gcs

from app.config import settings


class WeatherStorage:
    """Thin wrapper around the GCS bucket used to persist raw Open-Meteo responses.

    The GCS client resolves credentials on first use, not at construction, so
    importing this module never requires GCP credentials to be present -
    only calling one of the methods below does.
    """

    def __init__(self) -> None:
        self._client: gcs.Client | None = None
        self._bucket = None

    def _get_bucket(self):
        if self._bucket is None:
            self._client = gcs.Client()
            self._bucket = self._client.bucket(settings.gcs_bucket_name)
        return self._bucket

    def upload_json(self, name: str, data: dict) -> None:
        bucket = self._get_bucket()
        blob = bucket.blob(name)
        blob.upload_from_string(json.dumps(data), content_type="application/json")

    def list_files(self) -> list[dict]:
        # list_blobs() paginates server-side via the GCS API instead of
        # fetching object bodies, so this stays cheap even as the bucket grows.
        bucket = self._get_bucket()
        return [
            {
                "name": blob.name,
                "size": blob.size or 0,
                "created_at": blob.time_created.isoformat() if blob.time_created else None,
            }
            for blob in self._client.list_blobs(bucket)
        ]

    def get_json(self, name: str) -> dict | None:
        bucket = self._get_bucket()
        blob = bucket.blob(name)
        if not blob.exists():
            return None
        return json.loads(blob.download_as_text())


storage = WeatherStorage()
