import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API_BASE = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API_BASE, timeout: 30000 });

export const api = {
    summary: () => client.get("/summary").then((r) => r.data),
    edaYearly: () => client.get("/eda/yearly").then((r) => r.data),
    edaIndustry: () => client.get("/eda/industry").then((r) => r.data),
    edaBreachType: () => client.get("/eda/breach-type").then((r) => r.data),
    edaHeatmap: () => client.get("/eda/heatmap").then((r) => r.data),
    edaSize: () => client.get("/eda/size-distribution").then((r) => r.data),
    arima: (horizon = 12) =>
        client.get(`/arima?horizon=${horizon}`).then((r) => r.data),
    poisson: () => client.get("/poisson").then((r) => r.data),
    sizeStats: () => client.get("/breach-size-stats").then((r) => r.data),
    metrics: () => client.get("/metrics").then((r) => r.data),
    predict: ({ industry = "ALL", horizon = 12, growth = 0 }) =>
        client
            .get(
                `/predict?industry=${encodeURIComponent(
                    industry,
                )}&horizon=${horizon}&growth_pct=${growth}`,
            )
            .then((r) => r.data),
    dataset: ({
        year = null,
        industry = null,
        breachType = null,
        limit = 25,
        offset = 0,
    }) => {
        const params = new URLSearchParams();
        if (year) params.append("year", year);
        if (industry) params.append("industry", industry);
        if (breachType) params.append("breach_type", breachType);
        params.append("limit", limit);
        params.append("offset", offset);
        return client.get(`/dataset?${params}`).then((r) => r.data);
    },
    reportUrl: () => `${API_BASE}/report/pdf`,
};
