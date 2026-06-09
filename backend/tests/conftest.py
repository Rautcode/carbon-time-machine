import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.routers.scenarios import limiter as _route_limiter


@pytest.fixture(scope="session")
def client() -> TestClient:
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limiter() -> None:
    """Reset rate-limiter storage before each test so tests don't bleed into each other."""
    _route_limiter._storage.reset()


VALID_PROFILE = {
    "car_km_per_week": 100,
    "domestic_flights_per_year": 2,
    "international_flights_per_year": 1,
    "public_transport_km_per_week": 30,
    "diet_type": "meat_moderate",
    "local_food_percent": 20,
    "monthly_electricity_kwh": 300,
    "renewable_energy_percent": 10,
    "home_size_sqft": 1000,
    "new_clothing_items_per_year": 15,
    "new_electronics_per_year": 2,
}
