"""
Pure carbon emission calculation functions.
All values in kg CO2e unless documented otherwise.
Sources: IPCC AR6, India CEA 2023, DEFRA 2023.
"""
from dataclasses import dataclass

# ── Emission factors ──────────────────────────────────────────────────────────
EF = {
    "car_per_km": 0.21,                # avg Indian petrol car
    "domestic_flight": 255.0,          # per one-way flight
    "international_flight": 1200.0,    # per one-way flight
    "public_transport_per_km": 0.089,  # bus/metro mix
    "diet_meat_heavy": 7.19,           # kg CO2e / person / day
    "diet_meat_moderate": 5.63,
    "diet_vegetarian": 3.81,
    "diet_vegan": 2.89,
    "electricity_india_grid": 0.82,    # kg CO2e / kWh (CEA 2023)
    "clothing_per_item": 33.4,
    "electronics_per_item": 70.0,
}

FUEL_COST_PER_KM = 8.5       # ₹ / km
ELECTRICITY_COST_PER_KWH = 6.5  # ₹ / kWh


@dataclass(frozen=True)
class CarbonProfile:
    transport_tons: float
    food_tons: float
    energy_tons: float
    shopping_tons: float

    @property
    def total_tons(self) -> float:
        return self.transport_tons + self.food_tons + self.energy_tons + self.shopping_tons

    def as_dict(self) -> dict[str, float]:
        return {
            "transport": round(self.transport_tons, 3),
            "food": round(self.food_tons, 3),
            "energy": round(self.energy_tons, 3),
            "shopping": round(self.shopping_tons, 3),
        }


def calculate_transport_emissions(
    car_km_per_week: float,
    domestic_flights: int,
    international_flights: int,
    public_transport_km_per_week: float,
) -> float:
    """Annual transport emissions in tons CO2e."""
    car = car_km_per_week * 52 * EF["car_per_km"]
    dom = domestic_flights * EF["domestic_flight"]
    intl = international_flights * EF["international_flight"]
    pt = public_transport_km_per_week * 52 * EF["public_transport_per_km"]
    return (car + dom + intl + pt) / 1000


def calculate_food_emissions(diet_type: str, local_food_percent: float) -> float:
    """Annual food emissions in tons CO2e."""
    daily_kg = EF.get(f"diet_{diet_type}", EF["diet_meat_moderate"])
    annual_kg = daily_kg * 365
    local_reduction = (local_food_percent / 100.0) * 0.10
    return annual_kg * (1 - local_reduction) / 1000


def calculate_energy_emissions(
    monthly_kwh: float,
    renewable_percent: float,
    home_size_sqft: float,
) -> float:
    """Annual energy emissions in tons CO2e."""
    annual_kwh = monthly_kwh * 12
    grid_fraction = 1.0 - (renewable_percent / 100.0)
    electricity_kg = annual_kwh * grid_fraction * EF["electricity_india_grid"]
    # Cooking gas / misc: ~0.4 kg CO2e per sqft per year
    other_kg = home_size_sqft * 0.4
    return (electricity_kg + other_kg) / 1000


def calculate_shopping_emissions(clothing_items: int, electronics_items: int) -> float:
    """Annual shopping emissions in tons CO2e."""
    kg = clothing_items * EF["clothing_per_item"] + electronics_items * EF["electronics_per_item"]
    return kg / 1000


def build_carbon_profile(p: dict) -> CarbonProfile:
    return CarbonProfile(
        transport_tons=calculate_transport_emissions(
            p["car_km_per_week"],
            p["domestic_flights_per_year"],
            p["international_flights_per_year"],
            p["public_transport_km_per_week"],
        ),
        food_tons=calculate_food_emissions(p["diet_type"], p["local_food_percent"]),
        energy_tons=calculate_energy_emissions(
            p["monthly_electricity_kwh"],
            p["renewable_energy_percent"],
            p["home_size_sqft"],
        ),
        shopping_tons=calculate_shopping_emissions(
            p["new_clothing_items_per_year"],
            p["new_electronics_per_year"],
        ),
    )


def calculate_annual_cost_inr(p: dict) -> float:
    """Estimate annual financial cost of carbon-emitting lifestyle choices."""
    fuel = p["car_km_per_week"] * 52 * FUEL_COST_PER_KM
    electricity = p["monthly_electricity_kwh"] * 12 * ELECTRICITY_COST_PER_KWH
    return fuel + electricity


def tons_to_trees(tons: float) -> int:
    """Mature tree absorbs ~21 kg CO2/year → 0.021 tons."""
    return max(0, round(tons / 0.021))


def project_emissions(base_tons: float, annual_rate: float, year_offset: int) -> float:
    """Compound growth/reduction projection."""
    return base_tons * ((1 + annual_rate) ** year_offset)
