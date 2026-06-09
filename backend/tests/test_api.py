"""API endpoint tests — mocks Gemini so no real API key needed."""
from unittest.mock import AsyncMock, patch

import pytest
from tests.conftest import VALID_PROFILE


class TestHealthEndpoint:
    def test_returns_ok(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"

    def test_service_name_present(self, client):
        r = client.get("/api/health")
        assert "service" in r.json()


class TestScenariosValidation:
    def test_invalid_diet_type_rejected(self, client):
        r = client.post("/api/scenarios", json={**VALID_PROFILE, "diet_type": "carnivore"})
        assert r.status_code == 422

    def test_negative_car_km_rejected(self, client):
        r = client.post("/api/scenarios", json={**VALID_PROFILE, "car_km_per_week": -1})
        assert r.status_code == 422

    def test_over_5000_car_km_rejected(self, client):
        r = client.post("/api/scenarios", json={**VALID_PROFILE, "car_km_per_week": 5001})
        assert r.status_code == 422

    def test_local_food_over_100_rejected(self, client):
        r = client.post("/api/scenarios", json={**VALID_PROFILE, "local_food_percent": 101})
        assert r.status_code == 422

    def test_renewable_over_100_rejected(self, client):
        r = client.post("/api/scenarios", json={**VALID_PROFILE, "renewable_energy_percent": 110})
        assert r.status_code == 422

    def test_missing_required_field_rejected(self, client):
        partial = {k: v for k, v in VALID_PROFILE.items() if k != "diet_type"}
        r = client.post("/api/scenarios", json=partial)
        assert r.status_code == 422

    def test_zero_values_accepted(self, client):
        zero_profile = {**VALID_PROFILE, "car_km_per_week": 0, "domestic_flights_per_year": 0}
        with (
            patch(
                "app.services.scenario_generator.generate_timeline_narrative",
                new_callable=AsyncMock,
                return_value="Narrative.",
            ),
            patch(
                "app.services.scenario_generator.generate_scenario_summary",
                new_callable=AsyncMock,
                return_value="Summary.",
            ),
        ):
            r = client.post("/api/scenarios", json=zero_profile)
        assert r.status_code == 200

    def test_vegan_zero_flights_accepted(self, client):
        profile = {
            **VALID_PROFILE,
            "diet_type": "vegan",
            "domestic_flights_per_year": 0,
            "international_flights_per_year": 0,
            "car_km_per_week": 0,
            "renewable_energy_percent": 100,
        }
        with (
            patch(
                "app.services.scenario_generator.generate_timeline_narrative",
                new_callable=AsyncMock,
                return_value="Narrative.",
            ),
            patch(
                "app.services.scenario_generator.generate_scenario_summary",
                new_callable=AsyncMock,
                return_value="Summary.",
            ),
        ):
            r = client.post("/api/scenarios", json=profile)
        assert r.status_code == 200


class TestScenariosSuccess:
    """Each test patches both async Gemini functions with context managers
    to avoid decorator-order ambiguity with pytest fixtures."""

    def _post(self, client, profile=None):
        with (
            patch(
                "app.services.scenario_generator.generate_timeline_narrative",
                new_callable=AsyncMock,
                return_value="Test narrative.",
            ),
            patch(
                "app.services.scenario_generator.generate_scenario_summary",
                new_callable=AsyncMock,
                return_value="Test summary.",
            ),
        ):
            return client.post("/api/scenarios", json=profile or VALID_PROFILE)

    def test_returns_three_scenarios(self, client):
        r = self._post(client)
        assert r.status_code == 200
        assert len(r.json()["scenarios"]) == 3

    def test_current_annual_tons_positive(self, client):
        r = self._post(client)
        assert r.json()["current_annual_tons"] > 0

    def test_breakdown_has_four_keys(self, client):
        r = self._post(client)
        assert set(r.json()["breakdown"].keys()) == {"transport", "food", "energy", "shopping"}

    def test_breakdown_sums_to_total(self, client):
        r = self._post(client)
        data = r.json()
        total = data["current_annual_tons"]
        breakdown_sum = sum(data["breakdown"].values())
        assert abs(total - breakdown_sum) < 0.01

    def test_scenario_ids_correct(self, client):
        r = self._post(client)
        ids = [s["scenario_id"] for s in r.json()["scenarios"]]
        assert ids == ["bau", "small", "committed"]

    def test_each_scenario_has_three_timeline_points(self, client):
        r = self._post(client)
        for scenario in r.json()["scenarios"]:
            assert len(scenario["timeline"]) == 3

    def test_bau_savings_zero(self, client):
        r = self._post(client)
        bau = next(s for s in r.json()["scenarios"] if s["scenario_id"] == "bau")
        assert bau["total_savings_tons"] == 0.0

    def test_committed_saves_more_than_small(self, client):
        r = self._post(client)
        scenarios = {s["scenario_id"]: s for s in r.json()["scenarios"]}
        assert (
            scenarios["committed"]["total_savings_tons"]
            >= scenarios["small"]["total_savings_tons"]
        )

    def test_timeline_years_are_2030_2035_2040(self, client):
        r = self._post(client)
        years = [tp["year"] for tp in r.json()["scenarios"][0]["timeline"]]
        assert years == [2030, 2035, 2040]

    def test_timeline_annual_emissions_positive(self, client):
        r = self._post(client)
        for scenario in r.json()["scenarios"]:
            for point in scenario["timeline"]:
                assert point["annual_emissions_tons"] >= 0

    def test_response_has_generated_at(self, client):
        r = self._post(client)
        assert "generated_at" in r.json()

    def test_security_header_present(self, client):
        r = client.get("/api/health")
        assert r.headers.get("x-content-type-options") == "nosniff"
        assert r.headers.get("x-frame-options") == "DENY"
