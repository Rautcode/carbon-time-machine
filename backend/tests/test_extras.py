"""Tests for /api/climate and /api/tips endpoints."""
from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient


# ── Helpers ──────────────────────────────────────────────────────────────────

def _make_open_meteo_response(temp: float = 28.5) -> dict:
    return {
        "current": {
            "temperature_2m": temp,
            "time": "2026-06-09T12:00",
        }
    }


def _mock_httpx_client(json_response: dict | None = None, side_effect: Exception | None = None) -> MagicMock:
    """Build a patched httpx.AsyncClient that returns json_response or raises side_effect."""
    mock_resp = MagicMock()
    if json_response is not None:
        mock_resp.json.return_value = json_response
    mock_resp.raise_for_status = MagicMock()

    mock_instance = MagicMock()
    mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
    mock_instance.__aexit__ = AsyncMock(return_value=None)
    if side_effect is not None:
        mock_instance.get = AsyncMock(side_effect=side_effect)
    else:
        mock_instance.get = AsyncMock(return_value=mock_resp)

    mock_cls = MagicMock(return_value=mock_instance)
    return mock_cls


def _make_gemini_tips_json() -> str:
    tips = [
        {
            "title": "Take metro twice a week",
            "description": "Saves 400 kg CO₂ annually.",
            "estimated_savings_kg": 400,
            "category": "transport",
        },
        {
            "title": "Go vegetarian three days",
            "description": "Saves 300 kg CO₂e per year.",
            "estimated_savings_kg": 300,
            "category": "food",
        },
        {
            "title": "Install rooftop solar panel",
            "description": "1 kW system offsets 1148 kg CO₂.",
            "estimated_savings_kg": 1148,
            "category": "energy",
        },
        {
            "title": "Buy second-hand clothes",
            "description": "Saves ~200 kg CO₂ per season.",
            "estimated_savings_kg": 200,
            "category": "shopping",
        },
        {
            "title": "Stream video at 480p quality",
            "description": "Saves 14 kg CO₂ per year.",
            "estimated_savings_kg": 14,
            "category": "digital",
        },
    ]
    return json.dumps(tips)


# ── /api/climate ──────────────────────────────────────────────────────────────

class TestClimateEndpoint:
    def test_climate_returns_200_with_correct_shape(self, client: TestClient):
        with patch("app.services.climate_service.httpx.AsyncClient",
                   _mock_httpx_client(_make_open_meteo_response(28.5))):
            resp = client.get("/api/climate")

        assert resp.status_code == 200
        body = resp.json()
        assert "current_temp_c" in body
        assert "global_anomaly_c" in body
        assert "co2_ppm" in body
        assert "location" in body
        assert "fetched_at" in body

    def test_climate_temperature_value_matches_mock(self, client: TestClient):
        with patch("app.services.climate_service.httpx.AsyncClient",
                   _mock_httpx_client(_make_open_meteo_response(33.2))):
            resp = client.get("/api/climate")

        assert resp.status_code == 200
        assert resp.json()["current_temp_c"] == pytest.approx(33.2)

    def test_climate_falls_back_on_network_error(self, client: TestClient):
        """Any exception from httpx falls back to default temp 30.0."""
        with patch("app.services.climate_service.httpx.AsyncClient",
                   _mock_httpx_client(side_effect=Exception("network error"))):
            resp = client.get("/api/climate")

        assert resp.status_code == 200
        assert resp.json()["current_temp_c"] == pytest.approx(30.0)

    def test_climate_global_anomaly_is_positive(self, client: TestClient):
        with patch("app.services.climate_service.httpx.AsyncClient",
                   _mock_httpx_client(_make_open_meteo_response())):
            resp = client.get("/api/climate")

        assert resp.json()["global_anomaly_c"] > 0


# ── /api/tips ─────────────────────────────────────────────────────────────────

VALID_TIPS_BODY = {
    "current_annual_tons": 7.2,
    "breakdown": {
        "transport": 3.1,
        "food": 1.8,
        "energy": 1.2,
        "shopping": 0.7,
        "digital": 0.4,
    },
}


def _mock_model_with_text(text: str) -> MagicMock:
    """Return a patched _model callable whose instance returns `text` from generate_content."""
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = text
    mock_model.return_value.generate_content.return_value = mock_response
    return mock_model


class TestTipsEndpoint:
    def test_tips_returns_200_with_five_tips(self, client: TestClient):
        with patch("app.services.tips_service._model", _mock_model_with_text(_make_gemini_tips_json())):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        body = resp.json()
        assert "tips" in body
        assert "generated_at" in body
        assert len(body["tips"]) == 5

    def test_tips_each_tip_has_required_fields(self, client: TestClient):
        with patch("app.services.tips_service._model", _mock_model_with_text(_make_gemini_tips_json())):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        for tip in resp.json()["tips"]:
            assert "title" in tip
            assert "description" in tip
            assert "estimated_savings_kg" in tip
            assert "category" in tip
            assert tip["category"] in {"transport", "food", "energy", "shopping", "digital"}

    def test_tips_fallback_on_gemini_error(self, client: TestClient):
        mock_model = MagicMock()
        mock_model.return_value.generate_content.side_effect = Exception("Gemini unavailable")

        with patch("app.services.tips_service._model", mock_model):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5

    def test_tips_fallback_on_invalid_json(self, client: TestClient):
        with patch("app.services.tips_service._model", _mock_model_with_text("not valid json {{")):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5

    def test_tips_fallback_on_non_array_json(self, client: TestClient):
        """Gemini returns a dict instead of an array — should fallback."""
        with patch("app.services.tips_service._model", _mock_model_with_text('{"tips": []}')):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5

    def test_tips_fallback_on_too_few_items(self, client: TestClient):
        """Gemini returns fewer than 5 tips — should use fallback."""
        two_items = json.loads(_make_gemini_tips_json())[:2]
        with patch("app.services.tips_service._model", _mock_model_with_text(json.dumps(two_items))):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5

    def test_tips_validation_error_zero_tons(self, client: TestClient):
        """current_annual_tons must be > 0."""
        resp = client.post(
            "/api/tips",
            json={"current_annual_tons": 0.0, "breakdown": {"transport": 0.0}},
        )
        assert resp.status_code == 422

    def test_tips_validation_error_missing_body(self, client: TestClient):
        # No body at all → Pydantic missing-field 422 (more reliable than empty bytes)
        resp = client.post("/api/tips")
        assert resp.status_code == 422

    def test_tips_strips_markdown_fences(self, client: TestClient):
        """Tips endpoint correctly strips ```json ... ``` fences."""
        fenced = "```json\n" + _make_gemini_tips_json() + "\n```"
        with patch("app.services.tips_service._model", _mock_model_with_text(fenced)):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5

    def test_tips_handles_empty_gemini_text(self, client: TestClient):
        """Blocked/empty Gemini response falls back gracefully."""
        with patch("app.services.tips_service._model", _mock_model_with_text("")):
            resp = client.post("/api/tips", json=VALID_TIPS_BODY)

        assert resp.status_code == 200
        assert len(resp.json()["tips"]) == 5
