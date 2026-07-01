import React, { useEffect, useState } from "react";
import { PageHeader, Panel, StatCard, LoadingBlock } from "@/components/UI";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";
import { Sliders, Play } from "@phosphor-icons/react";
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
} from "recharts";

export default function PredictPage() {
    const [industries, setIndustries] = useState([]);
    const [industry, setIndustry] = useState("ALL");
    const [horizon, setHorizon] = useState(12);
    const [growth, setGrowth] = useState(0);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        api.summary().then((s) => setIndustries(["ALL", ...s.industries]));
        run("ALL", 12, 0);
    }, []);

    const run = (ind, h, g) => {
        setLoading(true);
        api.predict({ industry: ind, horizon: h, growth: g })
            .then(setResult)
            .finally(() => setLoading(false));
    };

    const submit = () => run(industry, horizon, growth);

    const chartData = result
        ? result.forecast.map((f) => ({
              ...f,
              range: [f.lower, f.upper],
          }))
        : [];

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Interactive What-If"
                title="Run scenario forecasts on demand."
                subtitle="Tune industry filter, forecast horizon, and assumed growth. The model refits and projects instantly."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Controls */}
                <Panel
                    title="Scenario Controls"
                    subtitle="Set your assumptions"
                    className="lg:col-span-1 min-h-[440px]"
                >
                    <div className="space-y-6">
                        <ControlBlock label="Industry filter">
                            <select
                                data-testid={IDS.predictIndustrySelect}
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value)}
                                className="w-full bg-black/60 border border-white/15 focus:border-[#007AFF] focus:outline-none px-3 py-2 font-mono text-sm"
                            >
                                {industries.map((i) => (
                                    <option key={i} value={i}>
                                        {i}
                                    </option>
                                ))}
                            </select>
                        </ControlBlock>

                        <ControlBlock
                            label="Forecast horizon"
                            value={`${horizon} months`}
                        >
                            <input
                                data-testid={IDS.predictHorizonInput}
                                type="range"
                                min="1"
                                max="60"
                                value={horizon}
                                onChange={(e) =>
                                    setHorizon(parseInt(e.target.value))
                                }
                                className="accent-[#007AFF] w-full"
                            />
                        </ControlBlock>

                        <ControlBlock
                            label="Growth adjustment"
                            value={`${growth > 0 ? "+" : ""}${growth}%`}
                        >
                            <input
                                data-testid={IDS.predictGrowthInput}
                                type="range"
                                min="-50"
                                max="200"
                                step="5"
                                value={growth}
                                onChange={(e) =>
                                    setGrowth(parseInt(e.target.value))
                                }
                                className="accent-[#FFB340] w-full"
                            />
                            <p className="text-[10px] text-[#52525b] font-mono mt-1">
                                Multiplies point forecast (−50% to +200%)
                            </p>
                        </ControlBlock>

                        <button
                            data-testid={IDS.predictRunBtn}
                            onClick={submit}
                            className="w-full flex items-center justify-center gap-2 bg-[#007AFF] hover:bg-[#0a86ff] text-white py-3 font-semibold text-sm"
                        >
                            <Play size={16} weight="fill" /> Run Forecast
                        </button>
                    </div>
                </Panel>

                {/* Result */}
                <Panel
                    title="Projected Incident Trajectory"
                    subtitle={
                        result
                            ? `${result.industry} · ${result.horizon_months}mo · ${result.method}`
                            : ""
                    }
                    testId={IDS.predictResultChart}
                    className="lg:col-span-2 min-h-[440px]"
                >
                    {loading || !result ? (
                        <LoadingBlock label="Forecasting…" />
                    ) : (
                        <>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <StatCard
                                    label="Total expected"
                                    value={result.total_expected.toLocaleString()}
                                    unit="incidents"
                                    accent="primary"
                                    testId={IDS.predictTotalExpected}
                                />
                                <StatCard
                                    label="Per-month avg"
                                    value={(
                                        result.total_expected /
                                        result.horizon_months
                                    ).toFixed(1)}
                                    unit="incidents/mo"
                                    accent="warning"
                                />
                                <StatCard
                                    label="Peak month"
                                    value={
                                        result.forecast.reduce((a, b) =>
                                            a.forecast > b.forecast ? a : b,
                                        ).forecast
                                    }
                                    unit="incidents"
                                    accent="critical"
                                />
                            </div>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="predBand"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1"
                                        >
                                            <stop
                                                offset="0%"
                                                stopColor="#007AFF"
                                                stopOpacity={0.3}
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
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="range"
                                        stroke="none"
                                        fill="url(#predBand)"
                                        name="95% CI"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="forecast"
                                        stroke="#007AFF"
                                        strokeWidth={2.5}
                                        dot={{ r: 3 }}
                                        name="Forecast"
                                    />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </>
                    )}
                </Panel>
            </div>
        </div>
    );
}

function ControlBlock({ label, value, children }) {
    return (
        <div>
            <div className="flex items-baseline justify-between mb-2">
                <label className="overline">{label}</label>
                {value && (
                    <span className="font-mono text-xs text-[#007AFF]">
                        {value}
                    </span>
                )}
            </div>
            {children}
        </div>
    );
}
