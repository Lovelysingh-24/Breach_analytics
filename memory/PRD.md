# CyberBreach Predictor — Product Requirements Document

## Original Problem Statement
> Modelling & Predicting Cyber Hacking Breaches
> Python · Pandas · NumPy · Matplotlib · Scikit-learn · ARIMA · Poisson Modeling — Aug 2024
> Analyzed a 12-year dataset (2005–2017) of global cyber-attack incidents to
> identify evolving threat patterns and breach magnitudes.
> Applied stochastic and time-series models (Poisson, ARIMA) to forecast attack
> frequency and breach size with <5% Mean Absolute Error.
> User wants deployment on GitHub.

## User Choices
- Full-stack web app (FastAPI + React dashboard)
- Dataset: synthetic 2005–2017 modelled on PRC / Xu-Kim-Xu (2018)
- Deployment: Push to GitHub + host live
- Features: EDA, ARIMA, Poisson, Interactive What-If, Downloadable PDF
- Design: agent-chosen (dark cyber "control room" theme)

## User Personas
- Data-science recruiter / hiring manager reviewing a portfolio project
- Cybersecurity analyst / researcher exploring historical breach patterns
- Student / peer wanting to reproduce statistical forecast approaches

## Core Requirements (Static)
1. Backend (FastAPI) with statistical modelling (ARIMA, Poisson, log-normal)
2. Frontend (React) with dark, technical dashboard aesthetic
3. Deterministic synthetic 12-year (2005–2017) breach dataset
4. Interactive what-if forecasting with industry filter and horizon controls
5. Downloadable PDF report
6. GitHub-deployable repo with README, `.env.example`, install instructions

## Architecture
- **Backend** (`/app/backend/`)
  - `server.py` — FastAPI, /api routes, startup cache warm-up
  - `data_generator.py` — RNG-seeded synthetic dataset (1,972 incidents)
  - `models_ml.py` — ARIMA / Poisson / what-if implementations
  - `report.py` — ReportLab PDF generator
- **Frontend** (`/app/frontend/src/`)
  - `App.js` — React Router with 7 pages
  - `components/Layout.jsx`, `components/UI.jsx`
  - `pages/OverviewPage.jsx`, `EDAPage.jsx`, `ArimaPage.jsx`, `PoissonPage.jsx`,
    `PredictPage.jsx`, `MetricsPage.jsx`, `DatasetPage.jsx`
  - `lib/apiClient.js`

## What's Been Implemented (2026-01)
- ✅ FastAPI backend with 12 endpoints (summary, EDA, ARIMA, Poisson, predict, dataset, PDF)
- ✅ ARIMA(2,1,2) with MAE / RMSE / MAPE / AIC / BIC (100% backend tests pass)
- ✅ Poisson model with χ² goodness-of-fit and inter-arrival exponential fit
- ✅ Full React dashboard (7 pages) with dark cyber theme, custom fonts (Outfit / IBM Plex / JetBrains Mono)
- ✅ Interactive What-If forecasts (industry filter, horizon slider, growth adjustment)
- ✅ Downloadable PDF report (ReportLab)
- ✅ Dataset explorer with filters + pagination
- ✅ README.md, .env.example files for both backend & frontend (GitHub-ready)
- ✅ All data-testids applied for automation

## Testing Status
- Backend: **100 %** (16/16 endpoints validated by testing subagent, iteration_1)
- Frontend: **92 %** initial → 100 % after MetricsPage testid fix

## Prioritized Backlog
### P1
- Optional MongoDB persistence for user-submitted scenarios
- SARIMAX / seasonal ARIMA option to reduce MAPE below 10 %

### P2
- Compare multiple ARIMA orders side-by-side
- User-uploadable CSV → run modelling on custom dataset
- Cache TTL on ARIMA endpoint (currently unbounded per-horizon)
- Migrate `@app.on_event` to FastAPI lifespan API

### P3
- Auth + private dashboard sharing
- Docker Compose one-click local run
- Deploy previews via GitHub Actions

## Next Action Items
1. Push repo to GitHub via **"Save to Github"** button in Emergent chat
2. Optionally deploy live (Emergent Deploy / Render / Fly)
3. (User request) — plug in real PRC dataset CSV if available
