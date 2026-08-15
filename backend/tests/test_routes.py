import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.weather_client import WeatherAPIError
import app.routes as routes_module


class FakeStorage:
    def __init__(self):
        self.files = {}

    def upload_json(self, name, data):
        self.files[name] = data

    def list_files(self):
        return [
            {"name": name, "size": len(str(data)), "created_at": "2024-01-01T00:00:00Z"}
            for name, data in self.files.items()
        ]

    def get_json(self, name):
        return self.files.get(name)


@pytest.fixture
def fake_storage(monkeypatch):
    fake = FakeStorage()
    monkeypatch.setattr(routes_module, "storage", fake)
    return fake


@pytest.fixture
def client():
    return TestClient(app)


def _payload(**overrides):
    base = dict(latitude=12.97, longitude=77.59, start_date="2024-01-01", end_date="2024-01-05")
    base.update(overrides)
    return base


def test_store_weather_data_success(client, fake_storage, monkeypatch):
    async def fake_fetch(lat, lon, start, end):
        return {"daily": {"time": ["2024-01-01"], "temperature_2m_max": [20.0]}}

    monkeypatch.setattr(routes_module, "fetch_daily_weather", fake_fetch)

    response = client.post("/store-weather-data", json=_payload())

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["file"].startswith("weather_12.97_77.59_2024-01-01_2024-01-05_")
    assert body["file"] in fake_storage.files


def test_store_weather_data_upstream_failure(client, fake_storage, monkeypatch):
    async def fake_fetch(lat, lon, start, end):
        raise WeatherAPIError("Open-Meteo returned 500")

    monkeypatch.setattr(routes_module, "fetch_daily_weather", fake_fetch)

    response = client.post("/store-weather-data", json=_payload())

    assert response.status_code == 502
    assert response.json()["status"] == "error"


def test_store_weather_data_invalid_input_is_400(client, fake_storage):
    response = client.post("/store-weather-data", json=_payload(latitude=999))

    assert response.status_code == 400
    assert response.json()["status"] == "error"


def test_list_weather_files_reflects_storage(client, fake_storage):
    fake_storage.files["a.json"] = {"daily": {}}
    fake_storage.files["b.json"] = {"daily": {}}

    response = client.get("/list-weather-files")

    assert response.status_code == 200
    names = {f["name"] for f in response.json()["files"]}
    assert names == {"a.json", "b.json"}


def test_list_weather_files_empty_bucket(client, fake_storage):
    response = client.get("/list-weather-files")

    assert response.status_code == 200
    assert response.json()["files"] == []


def test_get_weather_file_content_found(client, fake_storage):
    fake_storage.files["weather_x.json"] = {"daily": {"time": ["2024-01-01"]}}

    response = client.get("/weather-file-content/weather_x.json")

    assert response.status_code == 200
    assert response.json() == {"daily": {"time": ["2024-01-01"]}}


def test_get_weather_file_content_not_found(client, fake_storage):
    response = client.get("/weather-file-content/does-not-exist.json")

    assert response.status_code == 404
    assert response.json() == {"status": "error", "message": "not found"}
