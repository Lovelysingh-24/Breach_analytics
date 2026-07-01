"""
CyberBreach Predictor — FastAPI backend.
All routes prefixed with /api.
"""
from __future__ import annotations
import os
import logging
from pathlib import Path
from typing import Any
from fastapi import FastAPI, APIRouter, HTTPException, Query
from fastapi.responses import Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import numpy as np
import pandas as pd

from data_generator import get_dataset, INDUSTRIES, BREACH_TYPES
from models_ml import (
    arima_forecast, poisson_fit, breach_size_stats,
    what_if_forecast, monthly_counts, yearly_counts,
)
from report import build_report

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="CyberBreach Predictor API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("cyberbreach")


# ---------------- Cached model results ----------------
_CACHE: dict[str, Any] = {}


def _get_cached(key: str, builder):
    if key not in _CACHE:
        _CACHE[key] = builder()
    return _CACHE[key]


@api.get("/")
async def root():
    return {"service": "CyberBreach Predictor", "status": "ok"}


@api.get("/summary")
async def summary():
    df = get_dataset()
    return {
        "total_incidents": int(len(df)),
        "year_min": int(df["year"].min()),
        "year_max": int(df["year"].max()),
        "industries_count": int(df["industry"].nunique()),
        "breach_types_count": int(df["breach_type"].nunique()),
        "total_records_exposed": int(df["records_exposed"].sum()),
        "avg_records_per_incident": float(round(df["records_exposed"].mean(), 2)),
        "industries": INDUSTRIES,
        "breach_types": BREACH_TYPES,
    }


@api.get("/eda/yearly")
async def eda_yearly():
    df = get_dataset()
    by_year = df.groupby("year").agg(
        incidents=("id", "count"),
        records_exposed=("records_exposed", "sum"),
    ).reset_index()
    by_year["avg_records"] = (by_year["records_exposed"] / by_year["incidents"]).round(0)
    return by_year.to_dict(orient="records")


@api.get("/eda/industry")
async def eda_industry():
    df = get_dataset()
    by_ind = df.groupby("industry").agg(
        incidents=("id", "count"),
        records_exposed=("records_exposed", "sum"),
    ).reset_index()
    by_ind["share_pct"] = (by_ind["incidents"] / by_ind["incidents"].sum() * 100).round(2)
    return by_ind.sort_values("incidents", ascending=False).to_dict(orient="records")


@api.get("/eda/breach-type")
async def eda_breach_type():
    df = get_dataset()
    by_t = df.groupby("breach_type").agg(
        incidents=("id", "count"),
        records_exposed=("records_exposed", "sum"),
    ).reset_index()
    by_t["share_pct"] = (by_t["incidents"] / by_t["incidents"].sum() * 100).round(2)
    return by_t.sort_values("incidents", ascending=False).to_dict(orient="records")


@api.get("/eda/heatmap")
async def eda_heatmap():
    """Year x industry heatmap of incident counts."""
    df = get_dataset()
    pivot = pd.crosstab(df["year"], df["industry"])
    rows = []
    for year, row in pivot.iterrows():
        for industry, val in row.items():
            rows.append({"year": int(year), "industry": industry, "count": int(val)})
    return rows


@api.get("/eda/size-distribution")
async def eda_size():
    """Log-scale histogram of breach sizes."""
    df = get_dataset()
    log_sizes = np.log10(df["records_exposed"].astype(float).values)
    hist, edges = np.histogram(log_sizes, bins=20)
    bins = []
    for i in range(len(hist)):
        left = 10 ** edges[i]
        right = 10 ** edges[i + 1]
        bins.append({
            "range": f"{int(left):,}–{int(right):,}",
            "midpoint": float(round((edges[i] + edges[i + 1]) / 2, 3)),
            "count": int(hist[i]),
        })
    return bins


@api.get("/arima")
async def arima(horizon: int = Query(12, ge=1, le=60)):
    df = get_dataset()
    key = f"arima_{horizon}"
    return _get_cached(key, lambda: arima_forecast(df, horizon=horizon))


@api.get("/poisson")
async def poisson():
    df = get_dataset()
    return _get_cached("poisson", lambda: poisson_fit(df))


@api.get("/breach-size-stats")
async def size_stats():
    df = get_dataset()
    return _get_cached("size", lambda: breach_size_stats(df))


@api.get("/metrics")
async def metrics():
    """Aggregate model metrics for the metrics dashboard."""
    df = get_dataset()
    arima_res = _get_cached("arima_12", lambda: arima_forecast(df, horizon=12))
    poisson_res = _get_cached("poisson", lambda: poisson_fit(df))
    return {
        "arima": {
            "order": arima_res["order"],
            "aic": arima_res["aic"],
            "bic": arima_res["bic"],
            "mae": arima_res["mae"],
            "rmse": arima_res["rmse"],
            "mape": arima_res["mape"],
        },
        "poisson": {
            "lambda_monthly": poisson_res["lambda_monthly"],
            "chi_square": poisson_res["chi_square"],
            "p_value": poisson_res["p_value"],
            "inter_arrival_mean_days": poisson_res["inter_arrival"]["mean_days"],
        },
    }


class WhatIfBody(dict):
    pass


@api.get("/predict")
async def predict(
    industry: str = Query("ALL"),
    horizon: int = Query(12, ge=1, le=60),
    growth_pct: float = Query(0.0, ge=-90.0, le=500.0),
):
    df = get_dataset()
    try:
        return what_if_forecast(df, industry, horizon, growth_pct)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/dataset")
async def dataset(
    year: int | None = Query(None),
    industry: str | None = Query(None),
    breach_type: str | None = Query(None),
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0),
):
    df = get_dataset()
    d = df
    if year is not None:
        d = d[d["year"] == year]
    if industry:
        d = d[d["industry"] == industry]
    if breach_type:
        d = d[d["breach_type"] == breach_type]
    total = int(len(d))
    page = d.iloc[offset: offset + limit].to_dict(orient="records")
    return {"total": total, "offset": offset, "limit": limit, "rows": page}


@api.get("/report/pdf")
async def report_pdf():
    df = get_dataset()
    summary_data = {
        "total_incidents": int(len(df)),
        "year_min": int(df["year"].min()),
        "year_max": int(df["year"].max()),
        "industries_count": int(df["industry"].nunique()),
        "breach_types_count": int(df["breach_type"].nunique()),
        "total_records_exposed": int(df["records_exposed"].sum()),
    }
    arima_res = _get_cached("arima_12", lambda: arima_forecast(df, horizon=12))
    poisson_res = _get_cached("poisson", lambda: poisson_fit(df))
    size = _get_cached("size", lambda: breach_size_stats(df))
    pdf_bytes = build_report(summary_data, arima_res, poisson_res, size)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": 'attachment; filename="cyberbreach_report.pdf"',
        },
    )


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def warm_cache():
    """Pre-compute expensive models so first request is snappy."""
    logger.info("Warming up model caches …")
    df = get_dataset()
    _CACHE["arima_12"] = arima_forecast(df, horizon=12)
    _CACHE["poisson"] = poisson_fit(df)
    _CACHE["size"] = breach_size_stats(df)
    logger.info("Cache ready — %d incidents loaded", len(df))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
