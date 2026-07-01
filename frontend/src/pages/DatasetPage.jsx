import React, { useEffect, useState } from "react";
import { PageHeader, Panel, LoadingBlock } from "@/components/UI";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";

const PAGE_SIZE = 25;

export default function DatasetPage() {
    const [summary, setSummary] = useState(null);
    const [year, setYear] = useState("");
    const [industry, setIndustry] = useState("");
    const [breachType, setBreachType] = useState("");
    const [offset, setOffset] = useState(0);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.summary().then(setSummary);
    }, []);

    useEffect(() => {
        setLoading(true);
        api.dataset({
            year: year || null,
            industry: industry || null,
            breachType: breachType || null,
            limit: PAGE_SIZE,
            offset,
        })
            .then(setData)
            .finally(() => setLoading(false));
    }, [year, industry, breachType, offset]);

    const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;
    const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

    const years = summary
        ? Array.from(
              { length: summary.year_max - summary.year_min + 1 },
              (_, i) => summary.year_min + i,
          )
        : [];

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Dataset Explorer"
                title="Every incident, filterable."
                subtitle={
                    summary
                        ? `${summary.total_incidents.toLocaleString()} rows · ${summary.industries_count} industries · ${summary.breach_types_count} vectors`
                        : ""
                }
            />

            <div className="card-surface p-4 mb-4 flex flex-wrap gap-3 items-center">
                <FilterSelect
                    label="Year"
                    value={year}
                    onChange={(v) => {
                        setYear(v);
                        setOffset(0);
                    }}
                    testId={IDS.datasetYearFilter}
                    options={[
                        { v: "", l: "All years" },
                        ...years.map((y) => ({ v: y, l: y })),
                    ]}
                />
                <FilterSelect
                    label="Industry"
                    value={industry}
                    onChange={(v) => {
                        setIndustry(v);
                        setOffset(0);
                    }}
                    testId={IDS.datasetIndustryFilter}
                    options={[
                        { v: "", l: "All industries" },
                        ...(summary?.industries || []).map((i) => ({ v: i, l: i })),
                    ]}
                />
                <FilterSelect
                    label="Breach type"
                    value={breachType}
                    onChange={(v) => {
                        setBreachType(v);
                        setOffset(0);
                    }}
                    testId={IDS.datasetTypeFilter}
                    options={[
                        { v: "", l: "All types" },
                        ...(summary?.breach_types || []).map((t) => ({
                            v: t,
                            l: t,
                        })),
                    ]}
                />
                <div className="ml-auto text-xs font-mono text-[#a1a1aa]">
                    {data ? `${data.total.toLocaleString()} matches` : "—"}
                </div>
            </div>

            <Panel testId={IDS.datasetTable} className="min-h-[540px] p-0">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-mono">
                        <thead className="sticky top-0 bg-black/80 backdrop-blur border-b border-white/10">
                            <tr className="text-left text-[#52525b] uppercase text-xs tracking-wider">
                                <th className="px-4 py-3">ID</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Year</th>
                                <th className="px-4 py-3">Industry</th>
                                <th className="px-4 py-3">Breach Type</th>
                                <th className="px-4 py-3 text-right">
                                    Records Exposed
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="6">
                                        <LoadingBlock />
                                    </td>
                                </tr>
                            ) : (
                                data?.rows.map((r) => (
                                    <tr
                                        key={r.id}
                                        className="border-b border-white/5 hover:bg-white/[0.03]"
                                    >
                                        <td className="px-4 py-2.5 text-[#52525b]">
                                            #{r.id}
                                        </td>
                                        <td className="px-4 py-2.5">{r.date}</td>
                                        <td className="px-4 py-2.5">{r.year}</td>
                                        <td className="px-4 py-2.5">
                                            <span className="inline-block px-2 py-0.5 border border-white/10 text-xs">
                                                {r.industry}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[#FFB340]">
                                            {r.breach_type}
                                        </td>
                                        <td className="px-4 py-2.5 text-right text-[#FF3B30]">
                                            {r.records_exposed.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
                    <div className="text-xs font-mono text-[#a1a1aa]">
                        Page {currentPage} / {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            data-testid={IDS.datasetPrevBtn}
                            disabled={offset === 0}
                            onClick={() =>
                                setOffset(Math.max(0, offset - PAGE_SIZE))
                            }
                            className="p-2 border border-white/15 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <CaretLeft size={14} weight="bold" />
                        </button>
                        <button
                            data-testid={IDS.datasetNextBtn}
                            disabled={currentPage >= totalPages}
                            onClick={() => setOffset(offset + PAGE_SIZE)}
                            className="p-2 border border-white/15 hover:border-white/40 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <CaretRight size={14} weight="bold" />
                        </button>
                    </div>
                </div>
            </Panel>
        </div>
    );
}

function FilterSelect({ label, value, onChange, options, testId }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="overline">{label}</label>
            <select
                data-testid={testId}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-black/60 border border-white/15 focus:border-[#007AFF] focus:outline-none px-3 py-1.5 font-mono text-xs min-w-[160px]"
            >
                {options.map((o) => (
                    <option key={o.v} value={o.v}>
                        {o.l}
                    </option>
                ))}
            </select>
        </div>
    );
}
