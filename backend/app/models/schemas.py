from pydantic import BaseModel, Field, field_validator
from typing import Literal


class UserProfile(BaseModel):
    # Transport
    car_km_per_week: float = Field(ge=0, le=5000, description="km driven by car per week")
    domestic_flights_per_year: int = Field(ge=0, le=100)
    international_flights_per_year: int = Field(ge=0, le=50)
    public_transport_km_per_week: float = Field(ge=0, le=2000)

    # Food
    diet_type: Literal["meat_heavy", "meat_moderate", "vegetarian", "vegan"]
    local_food_percent: float = Field(ge=0, le=100)

    # Energy
    monthly_electricity_kwh: float = Field(ge=0, le=10000)
    renewable_energy_percent: float = Field(ge=0, le=100)
    home_size_sqft: float = Field(ge=0, le=20000)

    # Shopping
    new_clothing_items_per_year: int = Field(ge=0, le=500)
    new_electronics_per_year: int = Field(ge=0, le=100)

    @field_validator("car_km_per_week", "public_transport_km_per_week", mode="before")
    @classmethod
    def round_km(cls, v: float) -> float:
        return round(float(v), 2)


class TimelinePoint(BaseModel):
    year: int
    annual_emissions_tons: float
    cumulative_emissions_tons: float
    equivalent_trees: int
    financial_cost_inr: float
    narrative: str


class FutureScenario(BaseModel):
    scenario_id: str
    label: str
    changes: list[str]
    timeline: list[TimelinePoint]
    total_savings_tons: float
    total_savings_inr: float
    summary: str


class ScenarioResponse(BaseModel):
    current_annual_tons: float
    breakdown: dict[str, float]
    scenarios: list[FutureScenario]
    generated_at: str
