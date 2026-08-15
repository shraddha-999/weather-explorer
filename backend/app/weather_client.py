from datetime import date

import httpx

from app.config import settings

DAILY_VARIABLES = [
    "temperature_2m_max",
    "temperature_2m_min",
    "apparent_temperature_max",
    "apparent_temperature_min",
]


class WeatherAPIError(Exception):
    """Raised when the upstream Open-Meteo request fails or returns bad data."""


async def fetch_daily_weather(latitude: float, longitude: float, start_date: date, end_date: date) -> dict:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "daily": ",".join(DAILY_VARIABLES),
        "timezone": "auto",
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            response = await client.get(settings.open_meteo_base_url, params=params)
        except httpx.RequestError as exc:
            raise WeatherAPIError(f"could not reach Open-Meteo: {exc}") from exc

    if response.status_code != 200:
        raise WeatherAPIError(
            f"Open-Meteo returned {response.status_code}: {response.text[:300]}"
        )

    return response.json()
