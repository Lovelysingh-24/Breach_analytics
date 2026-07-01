"""
Statistical models: ARIMA (time-series) and Poisson (stochastic counts).
"""
from __future__ import annotations
import warnings
from typing import Any
import numpy as np
import pandas as pd
from scipy import stats
from statsmodels.tsa.arima.model import ARIMA
from sklearn.metrics import mean_absolute_error, mean_squared_error

warnings.filterwarnings("ignore")


# -------------------- Monthly aggregation --------------------
def monthly_counts(df: pd.DataFrame) -> pd.Series:
    """Return monthly attack count series indexed by month-start."""
    s = pd.to_datetime(df["date"])
    grp = df.assign(_d=s).groupby(pd.Grouper(key="_d", freq="MS")).size()
    grp.name = "count"
    return grp.astype(float)


def yearly_counts(df: pd.DataFrame) -> pd.Series:
    return df.groupby("year").size().astype(float)


# -------------------- ARIMA --------------------
def arima_forecast(df: pd.DataFrame, horizon: int = 12, order=(2, 1, 2)) -> dict[str, Any]:
    """
    Fit ARIMA on monthly attack counts. Return history, forecast, CI, and metrics.
    Uses last 12 months as holdout to compute MAE / MAPE.
    """
    series = monthly_counts(df)
    if len(series) < 24:
        raise ValueError("Not enough monthly data to fit ARIMA")

    holdout = 12
    train = series.iloc[:-holdout]
    test = series.iloc[-holdout:]

    model = ARIMA(train, order=order)
    fit = model.fit()

    # In-sample validation
    pred_test = fit.forecast(steps=holdout)
    mae = float(mean_absolute_error(test.values, pred_test.values))
    rmse = float(np.sqrt(mean_squared_error(test.values, pred_test.values)))
    denom = np.where(test.values == 0, 1, test.values)
    mape = float(np.mean(np.abs((test.values - pred_test.values) / denom)) * 100)

    # Refit on full data and forecast forward
    full_model = ARIMA(series, order=order).fit()
    fc = full_model.get_forecast(steps=horizon)
    fc_mean = fc.predicted_mean
    fc_ci = fc.conf_int(alpha=0.05)

    history = [
        {"date": idx.strftime("%Y-%m"), "actual": float(v)}
        for idx, v in series.items()
    ]
    # Attach in-sample fitted values for the training portion
    fitted = full_model.fittedvalues
    for i, idx in enumerate(series.index):
        if idx in fitted.index:
            history[i]["fitted"] = float(fitted.loc[idx])

    forecast = []
    for idx, mean_val in fc_mean.items():
        lo = float(fc_ci.loc[idx].iloc[0])
        hi = float(fc_ci.loc[idx].iloc[1])
        forecast.append({
            "date": idx.strftime("%Y-%m"),
            "forecast": float(max(mean_val, 0)),
            "lower": float(max(lo, 0)),
            "upper": float(max(hi, 0)),
        })

    return {
        "order": list(order),
        "aic": float(full_model.aic),
        "bic": float(full_model.bic),
        "mae": round(mae, 3),
        "rmse": round(rmse, 3),
        "mape": round(mape, 3),
        "history": history,
        "forecast": forecast,
    }


# -------------------- Poisson --------------------
def poisson_fit(df: pd.DataFrame) -> dict[str, Any]:
    """
    Fit a Poisson distribution to monthly attack counts.
    Return lambda, observed vs expected counts, chi-square GoF, inter-arrival stats.
    """
    series = monthly_counts(df)
    obs = series.values.astype(int)
    lam = float(np.mean(obs))

    # Bin observed counts and compare against Poisson expected
    max_k = int(obs.max()) + 1
    hist_edges = np.arange(0, max_k + 1)
    observed_counts, _ = np.histogram(obs, bins=hist_edges)
    expected_counts = stats.poisson.pmf(np.arange(max_k), lam) * len(obs)

    # Merge low-expected bins into a single tail bin (>= threshold) for chi-square
    threshold = 5.0
    merged_obs, merged_exp, merged_labels = [], [], []
    accum_o, accum_e = 0, 0.0
    for k in range(max_k):
        accum_o += int(observed_counts[k])
        accum_e += float(expected_counts[k])
        if accum_e >= threshold:
            merged_obs.append(accum_o)
            merged_exp.append(accum_e)
            merged_labels.append(str(k))
            accum_o, accum_e = 0, 0.0
    if accum_o > 0 or accum_e > 0:
        if merged_exp:
            merged_obs[-1] += accum_o
            merged_exp[-1] += accum_e
        else:
            merged_obs.append(accum_o)
            merged_exp.append(accum_e)
            merged_labels.append(str(max_k - 1))

    # Rescale expected to exactly match observed total (chi2 requires sum agreement)
    total_obs = float(sum(merged_obs))
    total_exp = float(sum(merged_exp))
    if total_exp > 0:
        merged_exp = [e * total_obs / total_exp for e in merged_exp]
    chi2, p_value = stats.chisquare(f_obs=merged_obs, f_exp=merged_exp)

    # Buckets for visual chart (raw un-merged bins, top 20)
    bins = []
    for k in range(min(max_k, 40)):
        bins.append({
            "k": int(k),
            "observed": int(observed_counts[k]),
            "expected": float(round(expected_counts[k], 3)),
        })

    # Inter-arrival times (days between consecutive breaches)
    dates = pd.to_datetime(df["date"]).sort_values().reset_index(drop=True)
    diffs = dates.diff().dt.total_seconds().dropna() / 86400.0
    diffs = diffs.values
    exp_fit = stats.expon.fit(diffs, floc=0)
    inter_mean = float(np.mean(diffs))
    inter_median = float(np.median(diffs))

    # Histogram for inter-arrival chart
    ia_hist, ia_edges = np.histogram(diffs, bins=20)
    ia_data = []
    for i in range(len(ia_hist)):
        ia_data.append({
            "bin": round(float((ia_edges[i] + ia_edges[i + 1]) / 2), 2),
            "count": int(ia_hist[i]),
            "expected": float(round(
                stats.expon.pdf((ia_edges[i] + ia_edges[i + 1]) / 2, *exp_fit)
                * len(diffs) * (ia_edges[1] - ia_edges[0]),
                3,
            )),
        })

    return {
        "lambda_monthly": round(lam, 3),
        "chi_square": round(float(chi2), 3),
        "p_value": round(float(p_value), 5),
        "bins": bins,
        "inter_arrival": {
            "mean_days": round(inter_mean, 3),
            "median_days": round(inter_median, 3),
            "rate_lambda": round(1 / inter_mean if inter_mean > 0 else 0, 5),
            "histogram": ia_data,
        },
    }


# -------------------- Breach size model (log-normal) --------------------
def breach_size_stats(df: pd.DataFrame) -> dict[str, Any]:
    sizes = df["records_exposed"].astype(float).values
    log_sizes = np.log(sizes)
    shape, loc, scale = stats.lognorm.fit(sizes, floc=0)
    return {
        "mean": float(round(np.mean(sizes), 2)),
        "median": float(round(np.median(sizes), 2)),
        "max": int(np.max(sizes)),
        "min": int(np.min(sizes)),
        "log_mean": float(round(np.mean(log_sizes), 3)),
        "log_std": float(round(np.std(log_sizes), 3)),
        "lognorm_shape": float(round(shape, 4)),
        "lognorm_scale": float(round(scale, 4)),
    }


# -------------------- Interactive what-if --------------------
def what_if_forecast(df: pd.DataFrame, industry: str | None, horizon_months: int, growth_pct: float) -> dict[str, Any]:
    """
    Apply ARIMA on filtered data + user growth-rate multiplier for scenario analysis.
    """
    d = df if not industry or industry == "ALL" else df[df["industry"] == industry]
    if d.empty:
        raise ValueError("No data for selected filter")
    horizon_months = max(1, min(int(horizon_months), 60))
    growth = 1.0 + (float(growth_pct) / 100.0)

    series = monthly_counts(d)
    if len(series) < 24:
        # Fallback: simple Poisson mean projection
        lam = float(np.mean(series.values))
        forecast = []
        last_idx = series.index[-1]
        for i in range(1, horizon_months + 1):
            nxt = last_idx + pd.DateOffset(months=i)
            forecast.append({
                "date": nxt.strftime("%Y-%m"),
                "forecast": round(float(lam * growth), 2),
                "lower": round(float(lam * growth * 0.7), 2),
                "upper": round(float(lam * growth * 1.3), 2),
            })
        return {"method": "poisson_fallback", "forecast": forecast, "total_expected": round(sum(f["forecast"] for f in forecast), 1)}

    model = ARIMA(series, order=(2, 1, 2)).fit()
    fc = model.get_forecast(steps=horizon_months)
    fc_mean = fc.predicted_mean * growth
    fc_ci = fc.conf_int(alpha=0.05) * growth

    forecast = []
    for idx, val in fc_mean.items():
        forecast.append({
            "date": idx.strftime("%Y-%m"),
            "forecast": round(float(max(val, 0)), 2),
            "lower": round(float(max(fc_ci.loc[idx].iloc[0], 0)), 2),
            "upper": round(float(max(fc_ci.loc[idx].iloc[1], 0)), 2),
        })

    total_expected = float(round(sum(f["forecast"] for f in forecast), 1))
    return {
        "method": "arima",
        "industry": industry or "ALL",
        "horizon_months": horizon_months,
        "growth_pct": growth_pct,
        "total_expected": total_expected,
        "forecast": forecast,
    }
