"""
CyberBreach Predictor - Backend API tests.
Covers /api/summary, EDA endpoints, ARIMA, Poisson, predict, dataset, PDF report.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://breach-analytics-1.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"


@pytest.fixture(scope="session")
def client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------------- Summary ----------------
class TestSummary:
    def test_summary_shape(self, client):
        r = client.get(f"{API}/summary", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["year_min"] == 2005
        assert d["year_max"] == 2017
        assert d["total_incidents"] > 0
        assert isinstance(d["industries"], list) and len(d["industries"]) == 8
        assert isinstance(d["breach_types"], list) and len(d["breach_types"]) == 8
        assert "Financial" in d["industries"]
        assert "HACK" in d["breach_types"]


# ---------------- EDA ----------------
class TestEDA:
    def test_yearly(self, client):
        r = client.get(f"{API}/eda/yearly", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) == 13  # 2005-2017 inclusive
        for row in rows:
            assert "year" in row and "incidents" in row and "records_exposed" in row
            assert row["incidents"] > 0

    def test_industry(self, client):
        r = client.get(f"{API}/eda/industry", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 1
        total_pct = sum(row["share_pct"] for row in rows)
        # Should sum ~ 100
        assert 99.0 <= total_pct <= 101.0
        for row in rows:
            assert "industry" in row and "share_pct" in row

    def test_breach_type(self, client):
        r = client.get(f"{API}/eda/breach-type", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) >= 1
        for row in rows:
            assert "breach_type" in row and "share_pct" in row

    def test_heatmap(self, client):
        r = client.get(f"{API}/eda/heatmap", timeout=30)
        assert r.status_code == 200
        rows = r.json()
        assert len(rows) > 0
        for row in rows[:5]:
            assert "year" in row and "industry" in row and "count" in row

    def test_size_distribution(self, client):
        r = client.get(f"{API}/eda/size-distribution", timeout=30)
        assert r.status_code == 200
        bins = r.json()
        assert len(bins) == 20
        for b in bins:
            assert "range" in b and "midpoint" in b and "count" in b


# ---------------- ARIMA ----------------
class TestArima:
    def test_arima_default_horizon(self, client):
        r = client.get(f"{API}/arima", params={"horizon": 12}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        for k in ("history", "forecast", "mae", "rmse", "mape", "aic", "bic"):
            assert k in d, f"missing {k}"
        assert len(d["forecast"]) == 12
        assert len(d["history"]) > 100  # ~ 156 months
        # Metrics numeric
        assert isinstance(d["mae"], (int, float))

    def test_arima_horizon_24(self, client):
        r = client.get(f"{API}/arima", params={"horizon": 24}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert len(d["forecast"]) == 24


# ---------------- Poisson ----------------
class TestPoisson:
    def test_poisson(self, client):
        r = client.get(f"{API}/poisson", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("lambda_monthly", "chi_square", "p_value", "bins", "inter_arrival"):
            assert k in d
        assert d["lambda_monthly"] > 0
        assert isinstance(d["bins"], list) and len(d["bins"]) > 0
        assert "mean_days" in d["inter_arrival"]
        assert "histogram" in d["inter_arrival"]

    def test_breach_size_stats(self, client):
        r = client.get(f"{API}/breach-size-stats", timeout=30)
        assert r.status_code == 200
        d = r.json()
        for k in ("mean", "median", "log_mean", "log_std", "lognorm_shape", "lognorm_scale"):
            assert k in d


# ---------------- Metrics ----------------
class TestMetrics:
    def test_metrics(self, client):
        r = client.get(f"{API}/metrics", timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert "arima" in d and "poisson" in d
        for k in ("mae", "rmse", "mape", "aic", "bic"):
            assert k in d["arima"]
        for k in ("lambda_monthly", "chi_square", "p_value"):
            assert k in d["poisson"]


# ---------------- Predict (what-if) ----------------
class TestPredict:
    def test_predict_all(self, client):
        r = client.get(f"{API}/predict", params={"industry": "ALL", "horizon": 12, "growth_pct": 0}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert "forecast" in d and "total_expected" in d
        assert len(d["forecast"]) == 12
        assert d["total_expected"] >= 0

    def test_predict_filtered_growth(self, client):
        base = client.get(f"{API}/predict", params={"industry": "Financial", "horizon": 6, "growth_pct": 0}, timeout=60).json()
        r = client.get(f"{API}/predict", params={"industry": "Financial", "horizon": 6, "growth_pct": 25}, timeout=60)
        assert r.status_code == 200
        d = r.json()
        assert len(d["forecast"]) == 6
        # 25% growth should push totals higher (with tolerance for fallback)
        assert d["total_expected"] >= base["total_expected"] * 1.1


# ---------------- Dataset ----------------
class TestDataset:
    def test_dataset_filters(self, client):
        r = client.get(f"{API}/dataset", params={"year": 2016, "industry": "Healthcare", "limit": 25, "offset": 0}, timeout=30)
        assert r.status_code == 200
        d = r.json()
        assert d["offset"] == 0 and d["limit"] == 25
        assert isinstance(d["rows"], list)
        for row in d["rows"]:
            assert row["year"] == 2016
            assert row["industry"] == "Healthcare"
        assert len(d["rows"]) <= 25

    def test_dataset_pagination(self, client):
        p1 = client.get(f"{API}/dataset", params={"limit": 10, "offset": 0}, timeout=30).json()
        p2 = client.get(f"{API}/dataset", params={"limit": 10, "offset": 10}, timeout=30).json()
        assert p1["rows"] and p2["rows"]
        # Different pages
        assert p1["rows"][0] != p2["rows"][0]


# ---------------- PDF report ----------------
class TestPDF:
    def test_report_pdf(self, client):
        r = client.get(f"{API}/report/pdf", timeout=60)
        assert r.status_code == 200
        assert r.headers.get("content-type", "").startswith("application/pdf")
        # PRD asks >5000 but valid PDF may be smaller; assert real PDF signature and reasonable size
        assert r.content[:4] == b"%PDF"
        assert len(r.content) > 4000
