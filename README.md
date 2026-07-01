# CyberBreach Predictor — Modelling & Predicting Cyber Hacking Breaches

A full-stack analytics application that models and forecasts global cyber-attack
incidents using **ARIMA** time-series and **Poisson** stochastic modeling, based
on the approach from Xu, Kim & Xu (2018) *Modeling and Predicting Cyber Hacking
Breaches*. Covers a **12-year (2005–2017)** synthetic dataset that reproduces
the patterns of the original PRC / Chronology of Data Breaches records.

<p align="center">
  <img alt="preview" src="https://images.pexels.com/photos/27141316/pexels-photo-27141316.jpeg" width="720" />
</p>

## ✨ Features

- **EDA dashboard** — yearly volume, industry mix, breach vector, size distribution, year × industry heatmap.
- **ARIMA forecasting** — ARIMA(p,d,q) fit on monthly attack counts with 95% confidence bands and validation MAE / RMSE / MAPE / AIC / BIC.
- **Poisson stochastic model** — observed vs expected count PMF, χ² goodness-of-fit, inter-arrival time exponential fit.
- **Interactive What-If** — filter by industry, choose horizon (1–60 months), tune growth assumption (−50% ↔ +200%).
- **Model metrics** dashboard — one-glance view of all fit statistics.
- **Dataset explorer** — filterable + paginated table of every incident.
- **Downloadable PDF report** — full analytical report generated on-demand via ReportLab.

## 🧱 Tech Stack

| Layer      | Tech                                                      |
| ---------- | --------------------------------------------------------- |
| Frontend   | React 19, React Router 7, Recharts, Framer Motion, Tailwind, Phosphor Icons |
| Backend    | FastAPI, statsmodels (ARIMA), scipy (Poisson), scikit-learn, pandas, numpy, reportlab |
| Storage    | MongoDB (for optional persistence)                        |
| Deploy     | Emergent one-click deploy · Docker · Vercel / Render / Fly compatible |

## 📁 Project Structure

```
.
├── backend/
│   ├── server.py              # FastAPI app + /api routes
│   ├── data_generator.py      # 2005–2017 synthetic breach dataset
│   ├── models_ml.py           # ARIMA + Poisson + what-if models
│   ├── report.py              # PDF report generator
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── components/        # Layout, UI primitives
│   │   ├── pages/             # Overview, EDA, ARIMA, Poisson, Predict, Metrics, Dataset
│   │   ├── lib/apiClient.js
│   │   └── constants/testIds/
│   ├── package.json
│   └── .env.example
└── README.md
```

## 🚀 Run Locally

### Prerequisites

- Python **3.11+**
- Node.js **18+** & Yarn
- (optional) MongoDB running on `mongodb://localhost:27017`

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env      # then edit if needed
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Backend will be available on `http://localhost:8001/api`.

### Frontend

```bash
cd frontend
yarn install
cp .env.example .env      # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

App will open on `http://localhost:3000`.

## 🔌 API Endpoints

| Method | Path                       | Description                        |
| ------ | -------------------------- | ---------------------------------- |
| GET    | `/api/summary`             | Dataset summary + industry/type lists |
| GET    | `/api/eda/yearly`          | Yearly incident + record counts    |
| GET    | `/api/eda/industry`        | Industry breakdown                 |
| GET    | `/api/eda/breach-type`     | Attack vector breakdown            |
| GET    | `/api/eda/heatmap`         | Year × industry heatmap            |
| GET    | `/api/eda/size-distribution` | Log-scale breach size histogram  |
| GET    | `/api/arima?horizon=12`    | ARIMA forecast + metrics           |
| GET    | `/api/poisson`             | Poisson bins + inter-arrival fit   |
| GET    | `/api/breach-size-stats`   | Log-normal fit of breach sizes     |
| GET    | `/api/metrics`             | Aggregate metrics                  |
| GET    | `/api/predict`             | What-if scenario forecast          |
| GET    | `/api/dataset`             | Paginated dataset explorer         |
| GET    | `/api/report/pdf`          | Downloadable PDF report            |

## 🧪 Model Details

- **ARIMA(2, 1, 2)** — non-seasonal, fitted on monthly incident counts. Last 12 months held out to compute MAE, RMSE, MAPE.
- **Poisson** — monthly counts modelled as Poisson(λ), λ = mean monthly rate. Chi-square goodness-of-fit test with expected-count rescaling.
- **Inter-arrival** — days between consecutive incidents fitted to an Exponential(λ) distribution.
- **Breach size** — records-exposed fitted to a log-normal, matching the heavy-tail behaviour reported in the Xu et al. paper.

## 📦 GitHub Deployment

1. Click **"Save to GitHub"** inside the Emergent chat to push the codebase.
2. On any host (Render, Railway, Fly.io, Emergent Deploy) build the backend (`pip install -r backend/requirements.txt` then run `uvicorn server:app`) and the frontend (`yarn build` → serve `frontend/build/`).
3. Set `REACT_APP_BACKEND_URL` in the frontend env and `MONGO_URL` + `DB_NAME` in the backend env.

## 📄 License

MIT — feel free to fork, remix, and cite.
