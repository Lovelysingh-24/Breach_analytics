"""
Cyber Hacking Breaches Dataset Generator
Generates a synthetic dataset (2005-2017) modeled on patterns from the
Xu, Kim, Xu (2018) paper: 'Modeling and Predicting Cyber Hacking Breaches'
and the Privacy Rights Clearinghouse (PRC) chronology.

Deterministic (fixed seed) so all clients see the same numbers.
"""
from __future__ import annotations
import numpy as np
import pandas as pd
from datetime import datetime, timedelta

RNG_SEED = 42

INDUSTRIES = [
    "Financial", "Healthcare", "Government", "Retail",
    "Education", "Technology", "Energy", "Media",
]

BREACH_TYPES = [
    "HACK", "PHISHING", "MALWARE", "INSIDER", "PORTABLE_DEVICE",
    "STATIONARY_DEVICE", "PHYSICAL", "UNINTENDED_DISCLOSURE",
]

# Yearly Poisson rate (annual attack count). Escalating trend 2005 -> 2017.
YEARLY_LAMBDAS = {
    2005: 40, 2006: 55, 2007: 72, 2008: 88, 2009: 95,
    2010: 110, 2011: 135, 2012: 160, 2013: 180, 2014: 205,
    2015: 240, 2016: 285, 2017: 320,
}


def _breach_size_sample(rng: np.random.Generator, year: int) -> int:
    """
    Draw breach size (records exposed) from a heavy-tailed log-normal.
    Mean grows slowly with year (data-hoarding era).
    """
    mu = 8.5 + (year - 2005) * 0.09      # ln(records) mean
    sigma = 1.8                          # heavy tail
    val = int(np.exp(rng.normal(mu, sigma)))
    return max(val, 50)


def generate_dataset() -> pd.DataFrame:
    rng = np.random.default_rng(RNG_SEED)
    rows = []
    for year, lam in YEARLY_LAMBDAS.items():
        n = int(rng.poisson(lam))
        # Random days in the year (approximate uniformity)
        day_offsets = rng.integers(0, 365, size=n)
        for d in day_offsets:
            date = datetime(year, 1, 1) + timedelta(days=int(d))
            industry = rng.choice(INDUSTRIES, p=_industry_probs(year))
            btype = rng.choice(BREACH_TYPES, p=_type_probs(year))
            size = _breach_size_sample(rng, year)
            rows.append({
                "date": date.date().isoformat(),
                "year": year,
                "month": date.month,
                "industry": industry,
                "breach_type": btype,
                "records_exposed": size,
            })
    df = pd.DataFrame(rows)
    df = df.sort_values("date").reset_index(drop=True)
    df["id"] = df.index + 1
    return df


def _industry_probs(year: int) -> np.ndarray:
    # Financial/Healthcare grow with time; retail spikes mid-2010s.
    base = np.array([0.18, 0.16, 0.14, 0.14, 0.10, 0.12, 0.08, 0.08])
    drift = (year - 2005) * 0.005
    base[0] += drift          # Financial up
    base[1] += drift * 0.8    # Healthcare up
    base[3] += drift * 0.4    # Retail up
    base[6] -= drift * 0.8    # Energy down
    base = np.clip(base, 0.02, None)
    return base / base.sum()


def _type_probs(year: int) -> np.ndarray:
    # HACK/PHISHING/MALWARE dominate later years.
    base = np.array([0.22, 0.14, 0.14, 0.10, 0.12, 0.10, 0.10, 0.08])
    drift = (year - 2005) * 0.006
    base[0] += drift            # HACK up
    base[1] += drift * 0.6      # PHISHING up
    base[2] += drift * 0.5      # MALWARE up
    base[4] -= drift * 0.6      # PORTABLE_DEVICE down
    base[6] -= drift * 0.4      # PHYSICAL down
    base = np.clip(base, 0.02, None)
    return base / base.sum()


# Cache the dataset in memory
_DATASET: pd.DataFrame | None = None


def get_dataset() -> pd.DataFrame:
    global _DATASET
    if _DATASET is None:
        _DATASET = generate_dataset()
    return _DATASET
