"""Orchestrates scenario generation: calculates emissions + calls Gemini for narratives."""
from datetime import datetime, timezone

from app.models.schemas import FutureScenario, ScenarioResponse, TimelinePoint, UserProfile
from app.services.carbon_calculator import (
    build_carbon_profile,
    calculate_annual_cost_inr,
    project_emissions,
    tons_to_trees,
)
from app.services.gemini_service import generate_scenario_summary, generate_timeline_narrative

BASE_YEAR = 2025
PROJECTION_YEARS = [2030, 2035, 2040]
BAU_RATE = 0.02       # 2% annual growth (business as usual)
COST_INFLATION = 0.04  # 4% annual cost inflation

# ── Scenario definitions ──────────────────────────────────────────────────────
_SCENARIOS: list[dict] = [
    {
        "id": "bau",
        "label": "Current Path",
        "human_changes": [],
        "growth_rate": BAU_RATE,
        "profile_mutations": [],
    },
    {
        "id": "small",
        "label": "Small Steps",
        "human_changes": ["Use metro/bus twice a week", "Upgrade to LED + 20% solar"],
        "growth_rate": 0.005,
        "profile_mutations": [
            ("car_km_per_week", lambda v: v * 0.75),
            ("public_transport_km_per_week", lambda v: v + 50),
            ("renewable_energy_percent", lambda v: min(100.0, v + 20)),
        ],
    },
    {
        "id": "committed",
        "label": "Committed Future",
        "human_changes": [
            "Public transport as primary mode",
            "Switch to vegetarian diet",
            "Install rooftop solar (50%)",
            "Buy only what you need",
        ],
        "growth_rate": -0.01,
        "profile_mutations": [
            ("car_km_per_week", lambda v: v * 0.4),
            ("public_transport_km_per_week", lambda v: v + 100),
            ("diet_type", lambda _: "vegetarian"),
            ("renewable_energy_percent", lambda v: min(100.0, v + 50)),
            ("new_clothing_items_per_year", lambda v: max(0, v - 12)),
            ("new_electronics_per_year", lambda v: max(0, v - 2)),
        ],
    },
]


def _apply_mutations(base: dict, mutations: list) -> dict:  # type: ignore[type-arg]
    p = base.copy()
    for key, fn in mutations:
        p[key] = fn(p[key])
    return p


def _cumulative_tons(
    base_tons: float,
    rate: float,
    from_year: int,
    to_year: int,
) -> float:
    """Sum annual emissions from from_year to to_year (inclusive)."""
    return sum(
        project_emissions(base_tons, rate, y - BASE_YEAR)
        for y in range(from_year, to_year + 1)
    )


async def generate_scenarios(profile: UserProfile) -> ScenarioResponse:
    p = profile.model_dump()
    base_carbon = build_carbon_profile(p)
    base_cost = calculate_annual_cost_inr(p)
    base_tons = base_carbon.total_tons

    profile_summary = (
        f"Car {p['car_km_per_week']}km/wk, "
        f"diet:{p['diet_type']}, "
        f"{p['monthly_electricity_kwh']}kWh/mo, "
        f"{p['domestic_flights_per_year']} domestic flights/yr"
    )

    scenarios: list[FutureScenario] = []

    for cfg in _SCENARIOS:
        mod_p = _apply_mutations(p, cfg["profile_mutations"])
        mod_carbon = build_carbon_profile(mod_p)
        mod_cost = calculate_annual_cost_inr(mod_p)
        mod_tons = mod_carbon.total_tons

        timeline: list[TimelinePoint] = []
        prev_year = BASE_YEAR

        for year in PROJECTION_YEARS:
            offset = year - BASE_YEAR
            annual = project_emissions(mod_tons, cfg["growth_rate"], offset)
            cumulative = _cumulative_tons(mod_tons, cfg["growth_rate"], BASE_YEAR + 1, year)
            annual_cost = mod_cost * ((1 + COST_INFLATION) ** offset)
            prev_year = year

            narrative = await generate_timeline_narrative(
                year, profile_summary, annual, cumulative, annual_cost
            )
            timeline.append(
                TimelinePoint(
                    year=year,
                    annual_emissions_tons=round(annual, 2),
                    cumulative_emissions_tons=round(cumulative, 1),
                    equivalent_trees=tons_to_trees(annual),
                    financial_cost_inr=round(annual_cost),
                    narrative=narrative,
                )
            )

        # Savings vs BAU at horizon year 2040
        bau_2040 = project_emissions(base_tons, BAU_RATE, 2040 - BASE_YEAR)
        scen_2040 = project_emissions(mod_tons, cfg["growth_rate"], 2040 - BASE_YEAR)
        savings_tons = max(0.0, (bau_2040 - scen_2040) * 15)
        savings_inr = max(0.0, (base_cost - mod_cost) * 15)

        summary = await generate_scenario_summary(
            cfg["label"], cfg["human_changes"], savings_tons, savings_inr
        )

        scenarios.append(
            FutureScenario(
                scenario_id=cfg["id"],
                label=cfg["label"],
                changes=cfg["human_changes"],
                timeline=timeline,
                total_savings_tons=round(savings_tons, 1),
                total_savings_inr=round(savings_inr),
                summary=summary,
            )
        )

    return ScenarioResponse(
        current_annual_tons=round(base_tons, 2),
        breakdown=base_carbon.as_dict(),
        scenarios=scenarios,
        generated_at=datetime.now(timezone.utc).isoformat(),
    )
