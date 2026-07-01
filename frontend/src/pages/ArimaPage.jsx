import React, { useEffect, useState } from "react";
import { PageHeader, Panel, StatCard, LoadingBlock } from "@/components/UI";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";
import {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from "recharts";

export default function ArimaPage() {
    const [horizon, setHorizon] = useState(12);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        api.arima(horizon).then((d) => {
            setData(d);
            setLoading(false);
        });
    }, [horizon]);

    const chartData = data
        ? [
              ...data.history.map((h) => ({
                  date: h.date,
                  actual: h.actual,
                  fitted: h.fitted,
              })),
              ...data.forecast.map((f) => ({
                  date: f.date,
                  forecast: f.forecast,
                  lower: f.lower,
                  upper: f.upper,
                  range: [f.lower, f.upper],
              })),
          ]
        : [];

    const boundaryDate = data?.history?.slice(-1)[0]?.date;

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Time-Series Modeling"
                title="ARIMA forecast of monthly attack frequency."
                subtitle="Non-seasonal ARIMA(2, 1, 2) fitted on monthly incident counts. Last 12 months held out for validation."
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="MAE"
                    value={data ? data.mae.toFixed(3) : "—"}
                    unit="incidents"
                    accent="primary"
                    testId={IDS.arimaMetricMae}
                />
                <StatCard
                    label="RMSE"
                    value={data ? data.rmse.toFixed(3) : "—"}
                    unit="incidents"
                    accent="warning"
                    testId={IDS.arimaMetricRmse}
                />
                <StatCard
                    label="MAPE"
                    value={data ? `${data.mape.toFixed(2)}` : "—"}
                    unit="%"
                    accent="critical"
                    testId={IDS.arimaMetricMape}
                />
                <StatCard
                    label="AIC"
                    value={data ? data.aic.toFixed(1) : "—"}
                    unit="model score"
                    accent="success"
                    testId={IDS.arimaMetricAic}
                />
            </div>

            <Panel
                title={`Historical vs. ${horizon}-month forecast`}
                subtitle={
                    data
                        ? `ARIMA(${data.order.join(",")}) · shaded band = 95% confidence interval`
                        : ""
                }
                testId={IDS.arimaChart}
                right={
                    <div className="flex flex-col items-end gap-2 text-xs font-mono text-[#a1a1aa]">
                        <label>Horizon: {horizon} mo</label>
                        <input
                            data-testid={IDS.arimaHorizonSlider}
                            type="range"
                            min="1"
                            max="36"
                            value={horizon}
                            onChange={(e) => setHorizon(parseInt(e.target.value))}
                            className="accent-[#007AFF] w-48"
                        />
                    </div>
                }
                className="min-h-[540px]"
            >
                {loading || !data ? (
                    <LoadingBlock label="Fitting ARIMA…" />
                ) : (
                    <ResponsiveContainer width="100%" height={460}>
                        <ComposedChart
                            data={chartData}
                            margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                        >
                            <defs>
                                <linearGradient id="confBand" x1="0" y1="0" x2="0" y2="1">
                                    <stop
                                        offset="0%"
                                        stopColor="#007AFF"
                                        stopOpacity={0.28}
                                    />
                                    <stop
                                        offset="100%"
                                        stopColor="#007AFF"
                                        stopOpacity={0.05}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                interval="preserveStartEnd"
                                minTickGap={40}
                            />
                            <YAxis tickLine={false} axisLine={false} />
                            <Tooltip />
                            <Legend />
                            {boundaryDate && (
                                <ReferenceLine
                                    x={boundaryDate}
                                    stroke="#FFB340"
                                    strokeDasharray="4 4"
                                    label={{
                                        value: "Forecast Start",
                                        position: "top",
                                        fill: "#FFB340",
                                        fontSize: 10,
                                    }}
                                />
                            )}
                            <Area
                                type="monotone"
                                dataKey="range"
                                stroke="none"
                                fill="url(#confBand)"
                                name="95% CI"
                            />
                            <Line
                                type="monotone"
                                dataKey="actual"
                                stroke="#FFFFFF"
                                strokeWidth={1.6}
                                dot={false}
                                name="Historical"
                            />
                            <Line
                                type="monotone"
                                dataKey="fitted"
                                stroke="#a1a1aa"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                dot={false}
                                name="Fitted"
                            />
                            <Line
                                type="monotone"
                                dataKey="forecast"
                                stroke="#007AFF"
                                strokeWidth={2.4}
                                dot={false}
                                name="Forecast"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </Panel>
        </div>
    );
}
