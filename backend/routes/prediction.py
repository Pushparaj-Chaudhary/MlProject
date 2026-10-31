"""
Prediction Endpoints for Crop Recommendation API.
Handles:
- Dual model prediction (POST /api/predict)
- Decision Tree prediction (POST /api/predict/decision-tree)
- KNN prediction (POST /api/predict/knn)
- Model metadata retrieval (GET /api/models)
"""

import sys
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

# Ensure project root in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.crop_recommendation import (
    get_crop_predictor,
    load_json,
    fertilizer_advisor,
    irrigation_advisor,
    yield_predictor
)

router = APIRouter(tags=["Prediction"])




class PredictionRequest(BaseModel):
    N: float = Field(..., ge=0.0, le=200.0, description="Nitrogen content in soil (kg/ha)", examples=[90.0])
    P: float = Field(..., ge=0.0, le=200.0, description="Phosphorus content in soil (kg/ha)", examples=[42.0])
    K: float = Field(..., ge=0.0, le=300.0, description="Potassium content in soil (kg/ha)", examples=[43.0])
    temperature: float = Field(..., ge=-10.0, le=60.0, description="Ambient temperature in °C", examples=[25.6])
    humidity: float = Field(..., ge=0.0, le=100.0, description="Relative humidity in %", examples=[80.0])
    ph: float = Field(..., ge=0.0, le=14.0, description="Soil pH level (0 - 14)", examples=[6.5])
    rainfall: float = Field(..., ge=0.0, le=500.0, description="Annual rainfall in mm", examples=[200.0])


class TopPrediction(BaseModel):
    crop: str
    combined_confidence: float
    dt_confidence: float
    knn_confidence: float


class DecisionPathStep(BaseModel):
    feature: str
    feature_index: int
    threshold: float
    actual_value: float
    condition: str
    satisfied: bool
    direction: str
    depth: int
    impurity: float


class DecisionTreeResult(BaseModel):
    predicted_crop: str
    confidence: float
    confidence_percent: float
    leaf_samples: int
    decision_path: List[DecisionPathStep]


class NearestNeighborItem(BaseModel):
    rank: int
    distance: float
    crop_label: str
    crop_index: int
    raw_features: Dict[str, float]


class KNNResult(BaseModel):
    predicted_crop: str
    confidence: float
    confidence_percent: float
    k: int
    confidence_explanation: str
    nearest_neighbors: List[NearestNeighborItem]


class DualPredictionResponse(BaseModel):
    recommended_crop: str
    models_agree: bool
    agreement_message: str
    decision_tree: DecisionTreeResult
    knn: KNNResult
    top_predictions: List[TopPrediction]
    confidence_explanation: str
    input_summary: Dict[str, Any]
    fertilizer_recommendation: Optional[Dict[str, Any]] = None
    irrigation_advisory: Optional[Dict[str, Any]] = None
    yield_projection: Optional[Dict[str, Any]] = None




@router.post("/predict", response_model=DualPredictionResponse)
def predict_crop(req: PredictionRequest):
    """
    Primary endpoint for dual-model crop recommendation.
    Runs both scratch Decision Tree and scratch KNN models, compares predictions,
    traces tree decision pathways, and details nearest neighbor voting.
    """
    try:
        predictor = get_crop_predictor()
        res = predictor.predict(
            N=req.N,
            P=req.P,
            K=req.K,
            temperature=req.temperature,
            humidity=req.humidity,
            ph=req.ph,
            rainfall=req.rainfall
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Inference error: {str(e)}"
        )


@router.post("/predict/decision-tree")
def predict_decision_tree(req: PredictionRequest):
    """Generates recommendation strictly using Decision Tree Classifier from scratch."""
    try:
        predictor = get_crop_predictor()
        if not predictor.is_loaded:
            raise RuntimeError("Decision Tree model is not loaded.")
        x_raw = [req.N, req.P, req.K, req.temperature, req.humidity, req.ph, req.rainfall]
        explanation = predictor.dt_model.explain_prediction(x_raw)
        return {
            "algorithm": "Decision Tree (From Scratch)",
            "criterion": predictor.dt_model.criterion,
            "max_depth": predictor.dt_model.max_depth,
            **explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Decision Tree error: {str(e)}"
        )


@router.post("/predict/knn")
def predict_knn(req: PredictionRequest):
    """Generates recommendation strictly using KNN Classifier from scratch."""
    try:
        predictor = get_crop_predictor()
        if not predictor.is_loaded:
            raise RuntimeError("KNN model is not loaded.")
        x_raw = [req.N, req.P, req.K, req.temperature, req.humidity, req.ph, req.rainfall]
        explanation = predictor.knn_model.explain_prediction(x_raw)
        return {
            "algorithm": "K-Nearest Neighbors (From Scratch)",
            "k": predictor.knn_model.k,
            "weights": predictor.knn_model.weights,
            **explanation
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"KNN error: {str(e)}"
        )


@router.get("/models")
def get_models_metadata():
    """Returns technical metadata, hyperparameters, and feature schemas for both models."""
    predictor = get_crop_predictor()
    dt = predictor.dt_model
    knn = predictor.knn_model

    return {
        "models": {
            "decision_tree": {
                "name": "Decision Tree Classifier",
                "implementation": "Implemented completely from scratch using NumPy",
                "criterion": dt.criterion if dt else "gini",
                "max_depth": dt.max_depth if dt else 12,
                "min_samples_split": dt.min_samples_split if dt else 4,
                "num_classes": dt.num_classes_ if dt else 22,
                "features": dt.feature_names if dt else [],
                "feature_importances": {
                    feat: round(float(imp), 4)
                    for feat, imp in zip(dt.feature_names, dt.feature_importances_)
                } if dt else {}
            },
            "knn": {
                "name": "K-Nearest Neighbors Classifier",
                "implementation": "Implemented completely from scratch using NumPy",
                "k": knn.k if knn else 5,
                "distance_metric": "Euclidean Distance",
                "weights": knn.weights if knn else "uniform",
                "num_training_samples": len(knn.y_train_) if knn and knn.y_train_ is not None else 0,
                "num_classes": knn.num_classes_ if knn else 22,
                "features": knn.feature_names if knn else []
            }
        },
        "target_classes": dt.class_names if dt else [],
        "total_classes": len(dt.class_names) if dt else 22
    }


class FertilizerRequest(BaseModel):
    N: float = Field(..., ge=0.0, le=200.0)
    P: float = Field(..., ge=0.0, le=200.0)
    K: float = Field(..., ge=0.0, le=300.0)
    temperature: float = Field(28.0, ge=-10.0, le=60.0)
    humidity: float = Field(60.0, ge=0.0, le=100.0)
    crop: Optional[str] = None


@router.post("/fertilizer/recommend")
def recommend_fertilizer(req: FertilizerRequest):
    """
    Recommends optimal fertilizer based on Kaggle Fertilizer Prediction dataset.
    Prescribes NPK blends (Urea, DAP, 14-35-14, 17-17-17, 20-20, 28-28, 10-26-26) with agronomic dosage advice.
    """
    try:
        return fertilizer_advisor.recommend(
            n=req.N,
            p=req.P,
            k=req.K,
            temp=req.temperature,
            humidity=req.humidity,
            crop=req.crop
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Fertilizer recommendation error: {str(e)}"
        )


class IrrigationRequest(BaseModel):
    crop: str = Field(..., description="Target crop name")
    temperature: float = Field(..., ge=-10.0, le=60.0)
    humidity: float = Field(..., ge=0.0, le=100.0)
    rainfall: float = Field(..., ge=0.0, le=500.0)


@router.post("/irrigation/calculate")
def calculate_irrigation(req: IrrigationRequest):
    """
    Computes precision daily crop water requirements (mm/day and Liters/ha)
    utilizing the 2,880-record Kaggle irrigation dataset (DATASET - Sheet1.csv).
    """
    try:
        return irrigation_advisor.calculate_water_requirement(
            crop=req.crop,
            temperature=req.temperature,
            humidity=req.humidity,
            rainfall=req.rainfall
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Irrigation calculation error: {str(e)}"
        )


class YieldRequest(BaseModel):
    crop: str = Field(..., description="Target crop name")
    temperature: float = Field(..., ge=-10.0, le=60.0)
    rainfall: float = Field(..., ge=0.0, le=500.0)
    humidity: float = Field(..., ge=0.0, le=100.0)


@router.post("/yield/project")
def project_crop_yield(req: YieldRequest):
    """
    Projects expected crop yield (tonnes/ha and quintals/ha) utilizing
    the 28,242-record Kaggle FAO global yield dataset (yield_df.csv)
    and evaluates seedling moisture viability via cropdata_updated.csv.
    """
    try:
        return yield_predictor.project_yield(
            crop=req.crop,
            temperature=req.temperature,
            rainfall=req.rainfall,
            humidity=req.humidity
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Yield projection error: {str(e)}"
        )


