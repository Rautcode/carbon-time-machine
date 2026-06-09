"""Fetches real-time climate context from Open-Meteo (free, no key required)."""
import logging
from datetime import datetime, timezone

import httpx

from app.models.schemas import ClimateContext

_logger = logging.getLogger(__name__)

# Centre of India — Madhya Pradesh (Open-Meteo free API, no key)
_OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=20.5937&longitude=78.9629"
    "&current=temperature_2m,apparent_temperature"
    "&forecast_days=1"
)

# Static global context — IPCC AR6 WGI (2023) + Mauna Loa 2024 annual mean
_GLOBAL_ANOMALY_C = 1.1   # °C above pre-industrial 1850–1900 baseline
_CO2_PPM = 424            # ppm (Mauna Loa 2024 approx, NOAA)
_LOCATION = "India (20.6°N, 78.9°E)"


async def get_climate_context() -> ClimateContext:
    """Return real-time temperature from Open-Meteo plus static global climate stats."""
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(5.0)) as client:
            resp = await client.get(_OPEN_METEO_URL)
            resp.raise_for_status()
            payload = resp.json()
            temp_c = float(payload["current"]["temperature_2m"])
    except httpx.TimeoutException:
        _logger.warning("Open-Meteo timed out; using placeholder temperature")
        temp_c = 30.0
    except Exception as exc:
        _logger.warning("Open-Meteo fetch failed (%s); using placeholder temperature", exc)
        temp_c = 30.0

    return ClimateContext(
        current_temp_c=round(temp_c, 1),
        global_anomaly_c=_GLOBAL_ANOMALY_C,
        co2_ppm=_CO2_PPM,
        location=_LOCATION,
        fetched_at=datetime.now(timezone.utc).isoformat(),
    )
