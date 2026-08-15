from datetime import date

from pydantic import BaseModel, Field, model_validator

from app.config import settings


class StoreWeatherRequest(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    start_date: date
    end_date: date

    @model_validator(mode="after")
    def check_date_range(self) -> "StoreWeatherRequest":
        if self.start_date > self.end_date:
            raise ValueError("start_date must be on or before end_date")
        span_days = (self.end_date - self.start_date).days
        if span_days > settings.max_range_days:
            raise ValueError(
                f"date range must not exceed {settings.max_range_days} days "
                f"(got {span_days} days)"
            )
        return self


class StoreWeatherResponse(BaseModel):
    status: str = "ok"
    file: str


class StoredFile(BaseModel):
    name: str
    size: int
    created_at: str


class ListFilesResponse(BaseModel):
    files: list[StoredFile]


class ErrorResponse(BaseModel):
    status: str = "error"
    message: str
