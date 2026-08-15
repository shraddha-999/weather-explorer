from datetime import date

import httpx
import pytest

from app.weather_client import WeatherAPIError, fetch_daily_weather


@pytest.fixture
def anyio_backend():
    return "asyncio"


class FakeResponse:
    def __init__(self, status_code, payload=None, text=""):
        self.status_code = status_code
        self._payload = payload
        self.text = text

    def json(self):
        return self._payload


class FakeAsyncClient:
    def __init__(self, response=None, error=None, **kwargs):
        self._response = response
        self._error = error

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc):
        return False

    async def get(self, url, params=None):
        if self._error:
            raise self._error
        return self._response


@pytest.mark.anyio
async def test_fetch_daily_weather_returns_json_on_success(monkeypatch):
    fake_response = FakeResponse(200, payload={"daily": {"time": ["2024-01-01"]}})
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: FakeAsyncClient(response=fake_response))

    result = await fetch_daily_weather(12.97, 77.59, date(2024, 1, 1), date(2024, 1, 5))

    assert result == {"daily": {"time": ["2024-01-01"]}}


@pytest.mark.anyio
async def test_fetch_daily_weather_raises_on_non_200(monkeypatch):
    fake_response = FakeResponse(500, text="internal error")
    monkeypatch.setattr(httpx, "AsyncClient", lambda **kw: FakeAsyncClient(response=fake_response))

    with pytest.raises(WeatherAPIError, match="500"):
        await fetch_daily_weather(12.97, 77.59, date(2024, 1, 1), date(2024, 1, 5))


@pytest.mark.anyio
async def test_fetch_daily_weather_raises_on_network_error(monkeypatch):
    monkeypatch.setattr(
        httpx, "AsyncClient", lambda **kw: FakeAsyncClient(error=httpx.RequestError("boom"))
    )

    with pytest.raises(WeatherAPIError, match="could not reach Open-Meteo"):
        await fetch_daily_weather(12.97, 77.59, date(2024, 1, 1), date(2024, 1, 5))
