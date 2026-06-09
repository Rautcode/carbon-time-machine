"""Unit tests for carbon_calculator — pure functions, no I/O."""
import pytest
from app.services.carbon_calculator import (
    EF,
    CarbonProfile,
    build_carbon_profile,
    calculate_annual_cost_inr,
    calculate_digital_carbon,
    calculate_energy_emissions,
    calculate_food_emissions,
    calculate_shopping_emissions,
    calculate_transport_emissions,
    project_emissions,
    tons_to_trees,
)


# ── Transport ──────────────────────────────────────────────────────────────────

class TestTransportEmissions:
    def test_zero_inputs_returns_zero(self):
        assert calculate_transport_emissions(0, 0, 0, 0) == 0.0

    def test_car_only_correct_math(self):
        # 100 km/wk × 52 wk × 0.21 kg/km = 1092 kg = 1.092 t
        result = calculate_transport_emissions(100, 0, 0, 0)
        assert abs(result - 1.092) < 0.001

    def test_domestic_flight_correct(self):
        result = calculate_transport_emissions(0, 2, 0, 0)
        expected = 2 * EF["domestic_flight"] / 1000
        assert abs(result - expected) < 0.001

    def test_international_flight_correct(self):
        result = calculate_transport_emissions(0, 0, 1, 0)
        expected = EF["international_flight"] / 1000
        assert abs(result - expected) < 0.001

    def test_public_transport_correct(self):
        result = calculate_transport_emissions(0, 0, 0, 100)
        expected = 100 * 52 * EF["public_transport_per_km"] / 1000
        assert abs(result - expected) < 0.001

    def test_all_modes_sums_correctly(self):
        car = calculate_transport_emissions(100, 0, 0, 0)
        dom = calculate_transport_emissions(0, 1, 0, 0)
        combined = calculate_transport_emissions(100, 1, 0, 0)
        assert abs(combined - (car + dom)) < 0.001


# ── Food ──────────────────────────────────────────────────────────────────────

class TestFoodEmissions:
    def test_meat_heavy_highest(self):
        assert calculate_food_emissions("meat_heavy", 0) > calculate_food_emissions("vegan", 0)

    def test_vegan_lowest(self):
        diets = ["meat_heavy", "meat_moderate", "vegetarian", "vegan"]
        values = [calculate_food_emissions(d, 0) for d in diets]
        assert values == sorted(values, reverse=True)

    def test_local_food_reduces_emissions(self):
        base = calculate_food_emissions("meat_moderate", 0)
        local = calculate_food_emissions("meat_moderate", 100)
        assert local < base

    def test_local_food_max_10_pct_reduction(self):
        base = calculate_food_emissions("meat_moderate", 0)
        full_local = calculate_food_emissions("meat_moderate", 100)
        reduction = (base - full_local) / base
        assert abs(reduction - 0.10) < 0.001

    def test_unknown_diet_raises_value_error(self):
        with pytest.raises(ValueError, match="Unknown diet_type"):
            calculate_food_emissions("unknown_diet", 0)


# ── Energy ────────────────────────────────────────────────────────────────────

class TestEnergyEmissions:
    def test_zero_electricity_zero_home_returns_zero(self):
        assert calculate_energy_emissions(0, 0, 0) == 0.0

    def test_renewable_reduces_grid_emissions(self):
        grid_only = calculate_energy_emissions(300, 0, 1000)
        full_solar = calculate_energy_emissions(300, 100, 1000)
        assert full_solar < grid_only

    def test_100_pct_renewable_only_home_size_remains(self):
        result = calculate_energy_emissions(1000, 100, 1000)
        expected = 1000 * 0.4 / 1000
        assert abs(result - expected) < 0.001

    def test_larger_home_higher_emissions(self):
        small = calculate_energy_emissions(200, 0, 500)
        large = calculate_energy_emissions(200, 0, 2000)
        assert large > small


# ── Shopping ─────────────────────────────────────────────────────────────────

class TestShoppingEmissions:
    def test_zero_shopping_zero_emissions(self):
        assert calculate_shopping_emissions(0, 0) == 0.0

    def test_clothing_contributes(self):
        assert calculate_shopping_emissions(10, 0) > 0

    def test_electronics_contributes(self):
        assert calculate_shopping_emissions(0, 1) > 0

    def test_linear_scaling(self):
        single = calculate_shopping_emissions(1, 0)
        ten = calculate_shopping_emissions(10, 0)
        assert abs(ten - single * 10) < 0.001


# ── Digital carbon ────────────────────────────────────────────────────────────

class TestDigitalCarbon:
    def test_zero_inputs_returns_zero(self):
        assert calculate_digital_carbon(0, 0) == 0.0

    def test_streaming_correct_math(self):
        result = calculate_digital_carbon(10, 0)
        expected = 10 * 52 * EF["streaming_hd_per_hour"] / 1000
        assert abs(result - expected) < 0.001

    def test_orders_correct_math(self):
        result = calculate_digital_carbon(0, 4)
        expected = 4 * 12 * EF["online_order_per_package"] / 1000
        assert abs(result - expected) < 0.001

    def test_combined_additive(self):
        streaming = calculate_digital_carbon(10, 0)
        orders = calculate_digital_carbon(0, 4)
        combined = calculate_digital_carbon(10, 4)
        assert abs(combined - (streaming + orders)) < 0.001

    def test_result_in_tons_not_kg(self):
        # 1 hr/week × 52 × 0.036 kg = 1.872 kg → 0.001872 t — well under 1 t
        result = calculate_digital_carbon(1, 0)
        assert result < 1.0


# ── CarbonProfile ─────────────────────────────────────────────────────────────

class TestCarbonProfile:
    def test_total_is_sum_of_parts(self):
        cp = CarbonProfile(
            transport_tons=2.0, food_tons=1.5, energy_tons=1.0, shopping_tons=0.5, digital_tons=0.2
        )
        assert abs(cp.total_tons - 5.2) < 1e-9

    def test_as_dict_has_five_keys(self):
        cp = CarbonProfile(transport_tons=1, food_tons=1, energy_tons=1, shopping_tons=1, digital_tons=0)
        d = cp.as_dict()
        assert set(d.keys()) == {"transport", "food", "energy", "shopping", "digital"}

    def test_build_carbon_profile_returns_profile(self):
        p = {
            "car_km_per_week": 50,
            "domestic_flights_per_year": 1,
            "international_flights_per_year": 0,
            "public_transport_km_per_week": 20,
            "diet_type": "vegetarian",
            "local_food_percent": 30,
            "monthly_electricity_kwh": 200,
            "renewable_energy_percent": 0,
            "home_size_sqft": 800,
            "new_clothing_items_per_year": 10,
            "new_electronics_per_year": 1,
            "streaming_hours_per_week": 7,
            "online_orders_per_month": 2,
        }
        cp = build_carbon_profile(p)
        assert cp.total_tons > 0
        assert isinstance(cp, CarbonProfile)


# ── Helpers ───────────────────────────────────────────────────────────────────

class TestHelpers:
    def test_tons_to_trees_zero(self):
        assert tons_to_trees(0) == 0

    def test_tons_to_trees_one_ton(self):
        assert tons_to_trees(1.0) == round(1.0 / 0.021)

    def test_tons_to_trees_negative_clamped(self):
        assert tons_to_trees(-5.0) == 0

    def test_project_emissions_zero_rate(self):
        assert abs(project_emissions(3.0, 0.0, 5) - 3.0) < 1e-9

    def test_project_emissions_positive_rate_grows(self):
        assert project_emissions(3.0, 0.02, 10) > 3.0

    def test_project_emissions_negative_rate_shrinks(self):
        assert project_emissions(3.0, -0.01, 10) < 3.0

    def test_calculate_annual_cost_positive(self):
        p = {
            "car_km_per_week": 100,
            "monthly_electricity_kwh": 300,
        }
        assert calculate_annual_cost_inr(p) > 0
