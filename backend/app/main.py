import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import routes_predict, routes_stats, routes_stream

app = FastAPI(
    title="Lynceus API",
    description="Real-time financial transaction fraud detection: Isolation Forest anomaly "
    "scoring, a Random Forest / Histogram Gradient Boosting leaderboard trained on "
    "the anomaly signal, a per-account behavioral feature store, a deterministic "
    "rules engine, and SHAP-based explanations for every prediction.",
    version="2.0.0",
)

# Comma-separated list of allowed origins, e.g. "https://your-app.vercel.app,http://localhost:5173"
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(routes_predict.router)
app.include_router(routes_stats.router)
app.include_router(routes_stream.router)


@app.get("/")
def root():
    return {
        "service": "Lynceus API",
        "tagline": "Sees what others miss.",
        "docs": "/docs",
        "endpoints": [
            "/api/predict",
            "/api/stats",
            "/api/stream/recent",
            "/api/stream/next",
            "/api/health",
        ],
    }
