import React, { useEffect, useState } from "react";
import { PageHeader, Panel, LoadingBlock } from "@/components/UI";
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
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
} from "recharts";

const PIE_COLORS = [
    "#007AFF",
    "#FF3B30",
    "#FFB340",
    "#34C759",
    "#FFFFFF",
    "#a1a1aa",
    "#5AC8FA",
    "#FF9500",
];

export default function EDAPage() {
    const [yearly, setYearly] = useState(null);
    const [industry, setIndustry] = useState(null);
    const [types, setTypes] = useState(null);
    const [heatmap, setHeatmap] = useState(null);
    const [size, setSize] = useState(null);

    useEffect(() => {
        Promise.all([
            api.edaYearly(),
            api.edaIndustry(),
            api.edaBreachType(),
            api.edaHeatmap(),
            api.edaSize(),
        ]).then(([y, i, t, h, s]) => {
            setYearly(y);
            setIndustry(i);
            setTypes(t);
            setHeatmap(h);
            setSize(s);
        });
    }, []);

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Exploratory Data Analysis"
                title="Twelve years of breaches, decoded."
                subtitle="A high-level view of incident volume, records exposed, industry impact, and attack vector mix."
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Panel
                    title="Incidents & Records by Year"
                    subtitle="Left axis: incident count · Right axis: log records exposed"
                    testId={IDS.edaYearlyChart}
                    className="lg:col-span-2 min-h-[380px]"
                >
                    {!yearly ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={yearly}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="year" tickLine={false} axisLine={false} />
                                <YAxis
                                    yAxisId="left"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) =>
                                        v >= 1e6
                                            ? `${(v / 1e6).toFixed(1)}M`
                                            : `${(v / 1e3).toFixed(0)}k`
                                    }
                                />
                                <Tooltip />
                                <Legend />
                                <Bar
                                    yAxisId="left"
                                    dataKey="incidents"
                                    fill="#007AFF"
                                    name="Incidents"
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="records_exposed"
                                    stroke="#FF3B30"
                                    strokeWidth={2}
                                    dot={false}
                                    name="Records Exposed"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Panel>

                <Panel
                    title="Industry Share"
                    subtitle="% of total incidents"
                    testId={IDS.edaIndustryChart}
                    className="min-h-[380px]"
                >
                    {!industry ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <PieChart>
                                <Pie
                                    data={industry}
                                    dataKey="incidents"
                                    nameKey="industry"
                                    innerRadius={50}
                                    outerRadius={110}
                                    stroke="#0a0a0a"
                                    strokeWidth={2}
                                >
                                    {industry.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={PIE_COLORS[i % PIE_COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" iconSize={8} />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </Panel>

                <Panel
                    title="Breach Type Distribution"
                    subtitle="Incidents grouped by attack vector"
                    testId={IDS.edaTypeChart}
                    className="lg:col-span-2 min-h-[380px]"
                >
                    {!types ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={types} layout="vertical">
                                <CartesianGrid
                                    horizontal={false}
                                    stroke="rgba(255,255,255,0.05)"
                                />
                                <XAxis
                                    type="number"
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    dataKey="breach_type"
                                    type="category"
                                    tickLine={false}
                                    axisLine={false}
                                    width={130}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="incidents"
                                    fill="#FFB340"
                                    name="Incidents"
                                    radius={[0, 0, 0, 0]}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Panel>

                <Panel
                    title="Breach Size Distribution"
                    subtitle="Log-scale histogram (records exposed)"
                    testId={IDS.edaSizeChart}
                    className="min-h-[380px]"
                >
                    {!size ? (
                        <LoadingBlock />
                    ) : (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={size}>
                                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="midpoint"
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => `10^${v.toFixed(1)}`}
                                />
                                <YAxis tickLine={false} axisLine={false} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#34C759" name="Incidents" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </Panel>

                <Panel
                    title="Year × Industry Heatmap"
                    subtitle="Incident intensity across sectors"
                    testId={IDS.edaHeatmap}
                    className="lg:col-span-3 min-h-[420px]"
                >
                    {!heatmap ? <LoadingBlock /> : <HeatmapView data={heatmap} />}
                </Panel>
            </div>
        </div>
    );
}

function HeatmapView({ data }) {
    const years = Array.from(new Set(data.map((d) => d.year))).sort();
    const industries = Array.from(new Set(data.map((d) => d.industry)));
    const max = Math.max(...data.map((d) => d.count));
    const lookup = {};
    data.forEach((d) => (lookup[`${d.year}-${d.industry}`] = d.count));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
                <thead>
                    <tr>
                        <th className="text-left py-2 px-2 text-[#52525b] font-normal">
                            YEAR ↓ / INDUSTRY →
                        </th>
                        {industries.map((ind) => (
                            <th
                                key={ind}
                                className="text-left py-2 px-2 text-[#52525b] font-normal whitespace-nowrap"
                            >
                                {ind}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {years.map((y) => (
                        <tr key={y}>
                            <td className="py-1 px-2 text-[#a1a1aa]">{y}</td>
                            {industries.map((ind) => {
                                const v = lookup[`${y}-${ind}`] ?? 0;
                                const opacity = Math.max(v / max, 0.08);
                                return (
                                    <td
                                        key={ind}
                                        className="py-1 px-2"
                                        style={{
                                            background: `rgba(0, 122, 255, ${opacity})`,
                                            color:
                                                opacity > 0.55 ? "#fff" : "#a1a1aa",
                                        }}
                                    >
                                        {v}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
