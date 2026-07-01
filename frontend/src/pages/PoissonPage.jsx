import React, { useEffect, useState } from "react";
import { PageHeader, Panel, StatCard, LoadingBlock } from "@/components/UI";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    Line,
    ComposedChart,
} from "recharts";

export default function PoissonPage() {
    const [data, setData] = useState(null);

    useEffect(() => {
        api.poisson().then(setData);
    }, []);

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Stochastic Modeling"
                title="Poisson model of attack counts."
                subtitle="Monthly incident counts follow an approximate Poisson process. Inter-arrival times are fit against an exponential distribution."
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard
                    label="λ (per month)"
                    value={data ? data.lambda_monthly.toFixed(3) : "—"}
                    unit="incidents"
                    accent="primary"
                    testId={IDS.poissonLambda}
                />
                <StatCard
                    label="χ² statistic"
                    value={data ? data.chi_square.toFixed(2) : "—"}
                    unit="goodness of fit"
                    accent="warning"
                    testId={IDS.poissonChiSquare}
                />
                <StatCard
                    label="p-value"
                    value={data ? data.p_value.toFixed(4) : "—"}
                    unit="α = 0.05"
                    accent={data?.p_value > 0.05 ? "success" : "critical"}
                />
                <StatCard
                    label="Mean inter-arrival"
                    value={
                        data ? data.inter_arrival.mean_days.toFixed(2) : "—"
                    }
                    unit="days"
                    accent="critical"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Panel
                    title="Observed vs Expected Monthly Counts"
                    subtitle="Poisson PMF · scaled to sample size"
                    testId={IDS.poissonBinsChart}
                    className="min-h-[440px]"
                >
                    {!data ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={380}>
                            <ComposedChart data={data.bins}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="k"
                                    tickLine={false}
                                    axisLine={false}
                                    label={{
                                        value: "k = incidents / month",
                                        position: "insideBottom",
                                        offset: -4,
                                        fill: "#52525b",
                                        fontSize: 10,
                                    }}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="observed"
                                    fill="#FFB340"
                                    name="Observed"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expected"
                                    stroke="#007AFF"
                                    strokeWidth={2}
                                    dot={{ r: 3 }}
                                    name="Poisson(λ)"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </Panel>

                <Panel
                    title="Inter-Arrival Time Distribution"
                    subtitle="Days between consecutive breaches · Exponential fit overlay"
                    testId={IDS.poissonInterArrivalChart}
                    className="min-h-[440px]"
                >
                    {!data ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={380}>
                            <ComposedChart data={data.inter_arrival.histogram}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="bin"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `${v.toFixed(1)}d`}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    dataKey="count"
                                    fill="#34C759"
                                    name="Observed"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="expected"
                                    stroke="#FF3B30"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Exp(λ) fit"
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </Panel>
            </div>
        </div>
    );
}
