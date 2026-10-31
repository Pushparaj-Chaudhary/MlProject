"""
API Integration Tests using FastAPI TestClient.
Tests all endpoints:
- GET /api/health
- GET /api/dataset/stats
- GET /api/models
- GET /api/analytics
- POST /api/predict (valid payload)
- POST /api/predict (invalid range payloads)
- POST /api/predict/decision-tree
- POST /api/predict/knn
- GET /api/evaluate
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["models_loaded"] is True


def test_dataset_stats_endpoint():
    response = client.get("/api/dataset/stats")
    assert response.status_code == 200
    data = response.json()
    assert "feature_stats" in data
    assert "correlation_matrix" in data
    assert data["num_classes"] == 28


def test_models_metadata_endpoint():
    response = client.get("/api/models")
    assert response.status_code == 200
    data = response.json()
    assert "decision_tree" in data["models"]
    assert "knn" in data["models"]
    assert data["total_classes"] == 28


def test_analytics_endpoint():
    response = client.get("/api/analytics")
    assert response.status_code == 200
    data = response.json()
    assert "insights" in data
    assert len(data["insights"]) > 0


def test_dual_prediction_valid():
    payload = {
        "N": 90.0,
        "P": 42.0,
        "K": 43.0,
        "temperature": 25.6,
        "humidity": 80.0,
        "ph": 6.5,
        "rainfall": 200.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommended_crop" in data
    assert "models_agree" in data
    assert "decision_tree" in data
    assert "knn" in data
    assert len(data["decision_tree"]["decision_path"]) > 0
    assert len(data["top_predictions"]) > 0
    assert data["recommended_crop"] in ["rice", "jute"]


def test_predict_decision_tree():
    payload = {
        "N": 80.0,
        "P": 40.0,
        "K": 40.0,
        "temperature": 24.0,
        "humidity": 75.0,
        "ph": 6.8,
        "rainfall": 180.0
    }
    response = client.post("/api/predict/decision-tree", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_crop" in data
    assert "decision_path" in data


def test_predict_knn():
    payload = {
        "N": 80.0,
        "P": 40.0,
        "K": 40.0,
        "temperature": 24.0,
        "humidity": 75.0,
        "ph": 6.8,
        "rainfall": 180.0
    }
    response = client.post("/api/predict/knn", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "predicted_crop" in data
    assert "nearest_neighbors" in data
    assert len(data["nearest_neighbors"]) == 5


def test_prediction_validation_errors():
    # Out of range N (> 200)
    payload = {
        "N": 350.0,
        "P": 40.0,
        "K": 40.0,
        "temperature": 24.0,
        "humidity": 75.0,
        "ph": 6.8,
        "rainfall": 180.0
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422  # Unprocessable Entity (Pydantic validation)


def test_evaluate_endpoint():
    response = client.get("/api/evaluate")
    assert response.status_code == 200
    data = response.json()
    assert "decision_tree" in data
    assert "knn" in data
    assert "cross_validation" in data["decision_tree"]
    assert data["decision_tree"]["accuracy"] > 0.90
    assert data["knn"]["accuracy"] > 0.90


def test_fertilizer_recommendation_endpoint():
    payload = {
        "N": 20.0,
        "P": 60.0,
        "K": 15.0,
        "temperature": 28.0,
        "humidity": 65.0,
        "crop": "rice"
    }
    response = client.post("/api/fertilizer/recommend", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "recommended_fertilizer" in data
    assert "grade" in data
    assert "diagnosis" in data


def test_production_analytics_endpoint():
    response = client.get("/api/analytics/production?crop=rice")
    assert response.status_code == 200
    data = response.json()
    assert data["crop"] == "rice"
    assert data["status"] == "deprecated"


def test_dataset_catalog_endpoint():
    response = client.get("/api/analytics/datasets")
    assert response.status_code == 200
    data = response.json()
    assert "catalog" in data
    assert data["total_datasets"] == 1
    filenames = [d["filename"] for d in data["catalog"]]
    assert "Crop_recommendation.csv" in filenames


def test_irrigation_advisor_endpoint():
    payload = {
        "crop": "rice",
        "temperature": 27.0,
        "humidity": 75.0,
        "rainfall": 190.0
    }
    response = client.post("/api/irrigation/calculate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "daily_water_mm" in data
    assert "liters_per_hectare_day" in data
    assert data["daily_water_mm"] > 0


def test_yield_predictor_endpoint():
    payload = {
        "crop": "maize",
        "temperature": 26.0,
        "rainfall": 150.0,
        "humidity": 65.0
    }
    response = client.post("/api/yield/project", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "projected_yield_tonnes_ha" in data
    assert "india_average_yield_tonnes" in data
    assert "seedling_viability_status" in data


