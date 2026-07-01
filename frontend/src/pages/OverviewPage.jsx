import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ArrowRight,
    DownloadSimple,
    Cpu,
    Database,
    ChartLineUp,
    Shield,
} from "@phosphor-icons/react";
import { api } from "@/lib/apiClient";
import { IDS } from "@/constants/testIds/dashboard";
import { StatCard, LoadingBlock } from "@/components/UI";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Area,
    AreaChart,
} from "recharts";

const HERO_IMG =
    "https://images.pexels.com/photos/27141316/pexels-photo-27141316.jpeg";

export default function OverviewPage() {
    const [summary, setSummary] = useState(null);
    const [metrics, setMetrics] = useState(null);
    const [yearly, setYearly] = useState(null);

    useEffect(() => {
        Promise.all([api.summary(), api.metrics(), api.edaYearly()])
            .then(([s, m, y]) => {
                setSummary(s);
                setMetrics(m);
                setYearly(y);
            })
            .catch(console.error);
    }, []);

    return (
        <div>
            {/* HERO */}
            <section className="relative overflow-hidden border-b border-white/10">
                <div
                    className="absolute inset-0 opacity-40"
                    style={{
                        backgroundImage: `url(${HERO_IMG})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-black" />
                <div className="absolute inset-0 grid-lines opacity-30" />

                <div className="relative px-6 md:px-12 py-16 md:py-24 max-w-7xl mx-auto">
                    <div className="overline mb-6 flex items-center gap-3">
                        <Shield size={14} weight="bold" />
                        Threat Intelligence · 2005–2017 Retrospective
                    </div>
                    <h1
                        data-testid={IDS.heroTitle}
                        className="font-display font-black text-4xl md:text-7xl leading-[0.96] tracking-tighter max-w-4xl"
                    >
                        Modelling &{" "}
                        <span className="text-[#007AFF]">Predicting</span>{" "}
                        Cyber Hacking Breaches.
                    </h1>
                    <p className="mt-6 max-w-2xl text-[#a1a1aa] text-base md:text-lg leading-relaxed font-body">
                        A stochastic + time-series analysis of 12 years of
                        global cyber-attack incidents. ARIMA forecasts monthly
                        attack frequency; a Poisson model characterises count
                        distributions and inter-arrival dynamics.
                    </p>

                    <div className="mt-10 flex flex-wrap gap-3">
                        <Link
                            to="/eda"
                            data-testid={IDS.heroCtaExplore}
                            className="inline-flex items-center gap-2 bg-[#007AFF] hover:bg-[#0a86ff] text-white px-6 py-3 font-semibold text-sm transition-colors"
                        >
                            Explore Analysis <ArrowRight size={16} weight="bold" />
                        </Link>
                        <a
                            href={api.reportUrl()}
                            target="_blank"
                            rel="noreferrer"
                            data-testid={IDS.heroCtaReport}
                            className="inline-flex items-center gap-2 border border-white/25 hover:border-white/60 text-white px-6 py-3 font-semibold text-sm transition-colors"
                        >
                            <DownloadSimple size={16} weight="bold" /> Download PDF
                        </a>
                    </div>

                    {/* Stat bento */}
                    <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3">
                        <StatCard
                            label="Total Incidents"
                            value={
                                summary
                                    ? summary.total_incidents.toLocaleString()
                                    : "—"
                            }
                            unit="events"
                            accent="primary"
                            testId={IDS.statTotal}
                        />
                        <StatCard
                            label="Coverage"
                            value={summary ? `${summary.year_min}–${summary.year_max}` : "—"}
                            unit="12 yrs"
                            accent="success"
                            testId={IDS.statYears}
                        />
                        <StatCard
                            label="ARIMA MAE"
                            value={metrics ? metrics.arima.mae.toFixed(2) : "—"}
                            unit="incidents/mo"
                            accent="warning"
                            testId={IDS.statMae}
                        />
                        <StatCard
                            label="Poisson λ"
                            value={
                                metrics
                                    ? metrics.poisson.lambda_monthly.toFixed(2)
                                    : "—"
                            }
                            unit="per month"
                            accent="critical"
                            testId={IDS.statLambda}
                        />
                    </div>
                </div>
            </section>

            {/* Trend snapshot */}
            <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
                <div className="flex items-end justify-between mb-6">
                    <div>
                        <div className="overline">Trend Snapshot</div>
                        <h2 className="font-display font-black text-2xl md:text-4xl tracking-tighter mt-2">
                            Incidents grew{" "}
                            <span className="text-[#FF3B30]">7×</span> in 12 years.
                        </h2>
                    </div>
                    <Link
                        to="/arima"
                        className="hidden md:inline-flex items-center gap-2 text-sm text-[#a1a1aa] hover:text-white"
                    >
                        View forecast <ArrowRight size={14} weight="bold" />
                    </Link>
                </div>

                <div className="card-surface p-4 md:p-6 h-[360px]">
                    {!yearly ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={yearly}
                                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                            >
                                <defs>
                                    <linearGradient
                                        id="incGrad"
                                        x1="0"
                                        y1="0"
                                        x2="0"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor="#007AFF"
                                            stopOpacity={0.4}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor="#007AFF"
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="incidents"
                                    stroke="#007AFF"
                                    strokeWidth={2}
                                    fill="url(#incGrad)"
                                    name="Incidents"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </section>

            {/* Feature grid */}
            <section className="px-6 md:px-12 pb-16 max-w-7xl mx-auto">
                <div className="overline mb-6">Analytical Suite</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <FeatureCard
                        icon={ChartLineUp}
                        title="ARIMA Forecast"
                        desc="Monthly attack frequency forecast with 95% confidence intervals. Validated against a 12-month holdout."
                        to="/arima"
                    />
                    <FeatureCard
                        icon={Cpu}
                        title="Poisson Modeling"
                        desc="Fit Poisson distributions to monthly counts; exponential fit for inter-arrival times."
                        to="/poisson"
                    />
                    <FeatureCard
                        icon={Database}
                        title="Interactive What-If"
                        desc="Tune horizon, industry filter, and growth assumptions to run scenario forecasts on demand."
                        to="/predict"
                    />
                </div>
            </section>
        </div>
    );
}

function FeatureCard({ icon: Icon, title, desc, to }) {
    return (
        <Link to={to} className="card-surface p-6 flex flex-col group h-full">
            <div className="w-10 h-10 grid place-items-center bg-[#007AFF]/12 border border-[#007AFF]/30 text-[#007AFF] mb-4">
                <Icon size={20} weight="bold" />
            </div>
            <h3 className="font-display font-bold text-lg">{title}</h3>
            <p className="mt-2 text-sm text-[#a1a1aa] font-body leading-relaxed flex-1">
                {desc}
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-[#007AFF] group-hover:gap-3 transition-all">
                Enter <ArrowRight size={14} weight="bold" />
            </div>
        </Link>
    );
}
