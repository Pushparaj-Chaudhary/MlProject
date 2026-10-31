"""
FastAPI Application Entry Point for CROP INTELLIGENCE System.
Configures CORS, registers prediction and analytics routers,
serves static EDA output visualizations, and implements health check.
"""

import os
import sys
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

# Add project root to sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from backend.routes import prediction, analytics
from ml.crop_recommendation import get_crop_predictor

app = FastAPI(
    title="CROP INTELLIGENCE API",
    description="Production Machine Learning Crop Recommendation Engine (Decision Tree & KNN From Scratch)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
# Accepts origins from env var CORS_ORIGINS or allows localhost + any vercel.app deployment
env_origins = os.environ.get("CORS_ORIGINS", "")
if env_origins:
    origins = [o.strip() for o in env_origins.split(",") if o.strip()]
else:
    origins = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "*"
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if "*" in origins else origins,
    allow_origin_regex=r"https://.*\.vercel\.app" if "*" not in origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static outputs folder for chart images
outputs_path = PROJECT_ROOT / "ml" / "outputs"
if outputs_path.exists():
    app.mount("/outputs", StaticFiles(directory=str(outputs_path)), name="outputs")

# Register Routers under /api
app.include_router(prediction.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")


@app.get("/", tags=["Root"])
def root():
    return {
        "message": "Welcome to CROP INTELLIGENCE — Crop Recommendation API",
        "version": "1.0.0",
        "endpoints": {
            "health": "/api/health",
            "predict": "/api/predict",
            "models": "/api/models",
            "analytics": "/api/analytics",
            "dataset_stats": "/api/dataset/stats",
            "evaluate": "/api/evaluate",
            "docs": "/docs"
        }
    }


@app.get("/api/health", tags=["Health"])
def health_check():
    """Health check endpoint for monitoring, uptime, and deployment validation."""
    predictor = get_crop_predictor()
    models_ready = (
        predictor.is_loaded
        and predictor.dt_model is not None
        and predictor.knn_model is not None
    )
    return {
        "status": "healthy" if models_ready else "degraded",
        "service": "CROP INTELLIGENCE API",
        "models_loaded": models_ready,
        "environment": os.environ.get("ENV", "production"),
        "algorithms": [
            "Decision Tree Classifier (From Scratch)",
            "K-Nearest Neighbors Classifier (From Scratch)"
        ]
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=True)
