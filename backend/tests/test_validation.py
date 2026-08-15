from datetime import date, timedelta

import pytest
from pydantic import ValidationError

from app.schemas import StoreWeatherRequest


def _payload(**overrides):
    base = dict(latitude=12.97, longitude=77.59, start_date=date(2024, 1, 1), end_date=date(2024, 1, 10))
    base.update(overrides)
    return base


def test_valid_request_passes():
    req = StoreWeatherRequest(**_payload())
    assert req.latitude == 12.97


@pytest.mark.parametrize("latitude", [-90.01, 90.01, 180, -1000])
def test_latitude_out_of_range_rejected(latitude):
    with pytest.raises(ValidationError):
        StoreWeatherRequest(**_payload(latitude=latitude))


@pytest.mark.parametrize("longitude", [-180.01, 180.01, 360])
def test_longitude_out_of_range_rejected(longitude):
    with pytest.raises(ValidationError):
        StoreWeatherRequest(**_payload(longitude=longitude))


def test_start_after_end_rejected():
    with pytest.raises(ValidationError):
        StoreWeatherRequest(**_payload(start_date=date(2024, 2, 1), end_date=date(2024, 1, 1)))


def test_range_over_31_days_rejected():
    start = date(2024, 1, 1)
    with pytest.raises(ValidationError):
        StoreWeatherRequest(**_payload(start_date=start, end_date=start + timedelta(days=32)))


def test_range_of_exactly_31_days_allowed():
    start = date(2024, 1, 1)
    req = StoreWeatherRequest(**_payload(start_date=start, end_date=start + timedelta(days=31)))
    assert (req.end_date - req.start_date).days == 31
