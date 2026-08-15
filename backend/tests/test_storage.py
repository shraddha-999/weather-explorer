import json

import pytest

import app.storage as storage_module
from app.storage import WeatherStorage


class FakeBucket:
    def __init__(self):
        self.uploaded = {}
        self.list_options = None

    def upload(self, name, body, options):
        self.uploaded[name] = (body, options)

    def list(self, options=None):
        self.list_options = options
        return [
            {"name": "weather_b.json", "created_at": "2024-01-02T00:00:00Z", "metadata": {"size": 20}},
            {"name": "weather_a.json", "created_at": "2024-01-01T00:00:00Z", "metadata": {"size": 10}},
        ]

    def download(self, name):
        if name != "weather_a.json":
            raise Exception("not_found")
        return json.dumps({"daily": {"time": ["2024-01-01"]}}).encode("utf-8")


class FakeStorageClient:
    def __init__(self, bucket):
        self._bucket = bucket

    def from_(self, name):
        return self._bucket


class FakeSupabaseClient:
    def __init__(self, bucket):
        self.storage = FakeStorageClient(bucket)


@pytest.fixture
def storage_with_fake_bucket(monkeypatch):
    bucket = FakeBucket()
    monkeypatch.setattr(storage_module, "create_client", lambda url, key: FakeSupabaseClient(bucket))
    return WeatherStorage(), bucket


def test_upload_json_sends_correct_content_type(storage_with_fake_bucket):
    storage, bucket = storage_with_fake_bucket

    storage.upload_json("weather_x.json", {"a": 1})

    body, options = bucket.uploaded["weather_x.json"]
    assert json.loads(body) == {"a": 1}
    assert options["content-type"] == "application/json"


def test_list_files_requests_high_limit_sorted_by_recency(storage_with_fake_bucket):
    storage, bucket = storage_with_fake_bucket

    files = storage.list_files()

    assert bucket.list_options["limit"] == 1000
    assert bucket.list_options["sortBy"] == {"column": "created_at", "order": "desc"}
    assert files[0] == {"name": "weather_b.json", "size": 20, "created_at": "2024-01-02T00:00:00Z"}


def test_get_json_returns_parsed_content_when_present(storage_with_fake_bucket):
    storage, _ = storage_with_fake_bucket

    result = storage.get_json("weather_a.json")

    assert result == {"daily": {"time": ["2024-01-01"]}}


def test_get_json_returns_none_when_missing(storage_with_fake_bucket):
    storage, _ = storage_with_fake_bucket

    result = storage.get_json("does-not-exist.json")

    assert result is None
