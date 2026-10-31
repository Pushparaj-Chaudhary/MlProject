"""
Analytics and Evaluation Endpoints for Crop Recommendation System.
Handles:
- Dataset statistics (GET /api/dataset/stats)
- System analytics & insights (GET /api/analytics)
- Model evaluation benchmark (GET & POST /api/evaluate)
"""

import sys
from pathlib import Path
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, status

# Ensure project root in sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from ml.crop_recommendation import load_json, evaluate_models, load_crop_dataset, get_dataset_statistics

router = APIRouter(tags=["Analytics & Evaluation"])

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
OUTPUTS_DIR = PROJECT_ROOT / "ml" / "outputs"
DATASET_PATH = PROJECT_ROOT / "dataset" / "Crop_recommendation.csv"


@router.get("/dataset/stats")
def get_dataset_stats():
    """Returns dataset summary, feature statistics, correlations, and class distribution."""
    stats_file = OUTPUTS_DIR / "dataset_stats.json"
    if stats_file.exists():
        return load_json(stats_file)

    if not DATASET_PATH.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dataset file not found."
        )

    df, report = load_crop_dataset(DATASET_PATH)
    stats = get_dataset_statistics(df)
    stats["validation_report"] = report
    return stats


@router.get("/analytics")
def get_analytics_overview():
    """Returns high-level analytical insights and dataset metrics."""
    df, report = load_crop_dataset(DATASET_PATH)
    stats = get_dataset_statistics(df)

    # Calculate nutrient extremes
    crop_avg = df.groupby("label")[["N", "P", "K", "rainfall", "temperature", "humidity", "ph"]].mean()
    highest_n_crop = crop_avg["N"].idxmax()
    highest_p_crop = crop_avg["P"].idxmax()
    highest_k_crop = crop_avg["K"].idxmax()
    highest_rainfall_crop = crop_avg["rainfall"].idxmax()
    lowest_rainfall_crop = crop_avg["rainfall"].idxmin()

    insights = [
        {"title": "Heavy Nitrogen Feeder", "crop": highest_n_crop, "value": f"{crop_avg.loc[highest_n_crop, 'N']:.1f} kg/ha", "desc": "Demands maximum nitrogen for foliage synthesis."},
        {"title": "Highest Phosphorus Demand", "crop": highest_p_crop, "value": f"{crop_avg.loc[highest_p_crop, 'P']:.1f} kg/ha", "desc": "Requires high phosphorus for root & flower development."},
        {"title": "Highest Potassium Demand", "crop": highest_k_crop, "value": f"{crop_avg.loc[highest_k_crop, 'K']:.1f} kg/ha", "desc": "Crucial for drought resilience and enzyme activation."},
        {"title": "Water-Intensive Crop", "crop": highest_rainfall_crop, "value": f"{crop_avg.loc[highest_rainfall_crop, 'rainfall']:.1f} mm", "desc": "Requires humid, monsoon-grade soil saturation."},
        {"title": "Arid-Resistant Crop", "crop": lowest_rainfall_crop, "value": f"{crop_avg.loc[lowest_rainfall_crop, 'rainfall']:.1f} mm", "desc": "Thrives in dry soil with minimal precipitation."}
    ]

    return {
        "total_records": report["total_records"],
        "num_classes": len(report["unique_crops"]),
        "features": report["features"],
        "null_values": report["total_nulls"],
        "duplicate_records": report["duplicate_rows"],
        "classes": report["unique_crops"],
        "insights": insights,
        "feature_stats": stats["feature_stats"],
        "correlation_matrix": stats["correlation_matrix"],
        "crop_averages": stats["crop_averages"]
    }


@router.get("/evaluate")
@router.post("/evaluate")
def get_evaluation_metrics():
    """
    Returns actual from-scratch model evaluation metrics.
    Accuracy, macro precision, macro recall, macro F1, confusion matrices,
    and 5-fold cross validation statistics.
    """
    eval_file = OUTPUTS_DIR / "evaluation_results.json"
    if eval_file.exists():
        return load_json(eval_file)

    # If not already generated, run evaluation
    try:
        eval_results = evaluate_models()
        return eval_results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate evaluation: {str(e)}"
        )


@router.get("/analytics/production")
def get_crop_production_analytics(crop: str = None):
    """
    Deprecated endpoint. State/District production dataset was removed
    to maintain a strict focus on soil/climate crop prediction.
    """
    return {
        "status": "deprecated",
        "crop": crop.strip().lower() if crop else None,
        "profile": None,
        "national_context": {}
    }


@router.get("/analytics/datasets")
def get_dataset_catalog():
    """
    Returns metadata for all agricultural datasets available in the system.
    """
    dataset_dir = PROJECT_ROOT / "dataset"
    catalog = []
    
    descriptions = {
        "Crop_recommendation.csv": "Primary crop recommendation training dataset (2,200 samples, 22 crops, 7 NPK/climate features) used for from-scratch Decision Tree and KNN prediction."
    }

    if dataset_dir.exists():
        for f in dataset_dir.glob("*.csv"):
            size_kb = round(f.stat().st_size / 1024, 1)
            size_str = f"{size_kb} KB" if size_kb < 1024 else f"{round(size_kb / 1024, 2)} MB"
            catalog.append({
                "filename": f.name,
                "size": size_str,
                "description": descriptions.get(f.name, "Agricultural research dataset file."),
                "is_primary": f.name == "Crop_recommendation.csv"
            })

    return {
        "total_datasets": len(catalog),
        "catalog": sorted(catalog, key=lambda x: (not x["is_primary"], x["filename"]))
    }

