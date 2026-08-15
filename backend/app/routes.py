from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException

from app.schemas import (
    ListFilesResponse,
    StoredFile,
    StoreWeatherRequest,
    StoreWeatherResponse,
)
from app.storage import storage
from app.weather_client import WeatherAPIError, fetch_daily_weather

router = APIRouter()


def _build_file_name(payload: StoreWeatherRequest) -> str:
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    return (
        f"weather_{payload.latitude}_{payload.longitude}_"
        f"{payload.start_date.isoformat()}_{payload.end_date.isoformat()}_{timestamp}.json"
    )


@router.post("/store-weather-data", response_model=StoreWeatherResponse)
async def store_weather_data(payload: StoreWeatherRequest) -> StoreWeatherResponse:
    try:
        weather_data = await fetch_daily_weather(
            payload.latitude, payload.longitude, payload.start_date, payload.end_date
        )
    except WeatherAPIError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    file_name = _build_file_name(payload)

    try:
        storage.upload_json(file_name, weather_data)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"failed to store weather data: {exc}") from exc

    return StoreWeatherResponse(file=file_name)


@router.get("/list-weather-files", response_model=ListFilesResponse)
def list_weather_files() -> ListFilesResponse:
    try:
        files = storage.list_files()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"failed to list files: {exc}") from exc

    return ListFilesResponse(files=[StoredFile(**f) for f in files])


@router.get("/weather-file-content/{file_name}")
def get_weather_file_content(file_name: str) -> dict:
    try:
        content = storage.get_json(file_name)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"failed to read file: {exc}") from exc

    if content is None:
        raise HTTPException(status_code=404, detail="not found")

    return content
