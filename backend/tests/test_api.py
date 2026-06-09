"""API endpoint tests — mocks Gemini so no real API key needed."""
from unittest.mock import AsyncMock, patch

import pytest
from tests.conftest import VALID_PROFILE


class TestHealthEndpoint:
    def test_returns_ok(self, client):
        r = client.get("/api/health")
        assert r.status_code == 200
        assert r.json()["status"] == "ok"


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
            patch("app.services.scenario_generator.generate_timeline_narrative", new_callable=AsyncMock) as mn,
            patch("app.services.scenario_generator.generate_scenario_summary", new_callable=AsyncMock) as ms,
        ):
            mn.return_value = "Narrative."
            ms.return_value = "Summary."
            r = client.post("/api/scenarios", json=zero_profile)
        assert r.status_code == 200


@patch("app.services.scenario_generator.generate_timeline_narrative", new_callable=AsyncMock)
@patch("app.services.scenario_generator.generate_scenario_summary", new_callable=AsyncMock)
class TestScenariosSuccess:
    def test_returns_three_scenarios(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Test narrative."
        mock_summary.return_value = "Test summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        assert r.status_code == 200
        data = r.json()
        assert len(data["scenarios"]) == 3

    def test_current_annual_tons_positive(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        assert r.json()["current_annual_tons"] > 0

    def test_breakdown_has_four_keys(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        breakdown = r.json()["breakdown"]
        assert set(breakdown.keys()) == {"transport", "food", "energy", "shopping"}

    def test_scenario_ids_correct(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        ids = [s["scenario_id"] for s in r.json()["scenarios"]]
        assert ids == ["bau", "small", "committed"]

    def test_each_scenario_has_three_timeline_points(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        for scenario in r.json()["scenarios"]:
            assert len(scenario["timeline"]) == 3

    def test_bau_savings_zero(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        bau = next(s for s in r.json()["scenarios"] if s["scenario_id"] == "bau")
        assert bau["total_savings_tons"] == 0.0

    def test_committed_saves_more_than_small(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        scenarios = {s["scenario_id"]: s for s in r.json()["scenarios"]}
        assert scenarios["committed"]["total_savings_tons"] >= scenarios["small"]["total_savings_tons"]

    def test_timeline_years_correct(self, mock_summary, mock_narrative, client):
        mock_narrative.return_value = "Narrative."
        mock_summary.return_value = "Summary."
        r = client.post("/api/scenarios", json=VALID_PROFILE)
        years = [tp["year"] for tp in r.json()["scenarios"][0]["timeline"]]
        assert years == [2030, 2035, 2040]
