import React from "react";
import { NavLink, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    ShieldWarning,
    ChartLineUp,
    ChartBar,
    Waveform,
    Sliders,
    Table as TableIcon,
    Gauge,
    House,
    GithubLogo,
    DownloadSimple,
} from "@phosphor-icons/react";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";

const links = [
    { to: "/", label: "Overview", icon: House, id: IDS.navHome, end: true },
    { to: "/eda", label: "EDA", icon: ChartBar, id: IDS.navEda },
    { to: "/arima", label: "ARIMA Forecast", icon: ChartLineUp, id: IDS.navArima },
    { to: "/poisson", label: "Poisson Model", icon: Waveform, id: IDS.navPoisson },
    { to: "/predict", label: "What-If", icon: Sliders, id: IDS.navPredict },
    { to: "/metrics", label: "Model Metrics", icon: Gauge, id: IDS.navMetrics },
    { to: "/dataset", label: "Dataset", icon: TableIcon, id: IDS.navDataset },
];

export default function Layout({ children }) {
    return (
        <div className="min-h-screen flex bg-[var(--bg-base)] text-white">
            <aside className="hidden md:flex md:w-64 shrink-0 flex-col border-r border-white/10 bg-black/40 backdrop-blur-md sticky top-0 h-screen">
                <Link to="/" className="p-6 flex items-center gap-3">
                    <div className="w-9 h-9 grid place-items-center bg-[#007AFF] text-white">
                        <ShieldWarning size={20} weight="bold" />
                    </div>
                    <div>
                        <div className="font-display font-black text-lg leading-none">
                            CyberBreach
                        </div>
                        <div className="overline mt-1">Predictor · v1.0</div>
                    </div>
                </Link>
                <nav className="flex-1 px-3 flex flex-col gap-1">
                    {links.map((l) => (
                        <NavLink
                            key={l.to}
                            to={l.to}
                            end={l.end}
                            data-testid={l.id}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 text-sm font-body transition-colors ${
                                    isActive
                                        ? "bg-[#007AFF]/12 text-white border-l-2 border-[#007AFF]"
                                        : "text-[#a1a1aa] hover:bg-white/5 hover:text-white border-l-2 border-transparent"
                                }`
                            }
                        >
                            <l.icon size={18} weight="bold" />
                            <span>{l.label}</span>
                        </NavLink>
                    ))}
                </nav>
                <div className="p-4 flex flex-col gap-2 border-t border-white/10">
                    <a
                        href={api.reportUrl()}
                        target="_blank"
                        rel="noreferrer"
                        data-testid={IDS.navReport}
                        className="flex items-center justify-center gap-2 px-3 py-2 bg-[#007AFF] hover:bg-[#0a86ff] text-white text-sm font-semibold transition-colors"
                    >
                        <DownloadSimple size={16} weight="bold" /> PDF Report
                    </a>
                    <a
                        href="https://github.com"
                        target="_blank"
                        rel="noreferrer"
                        data-testid={IDS.navGithub}
                        className="flex items-center justify-center gap-2 px-3 py-2 border border-white/15 hover:border-white/40 text-[#a1a1aa] hover:text-white text-sm font-body transition-colors"
                    >
                        <GithubLogo size={16} weight="bold" /> GitHub
                    </a>
                </div>
            </aside>

            {/* Mobile top nav */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3 flex items-center justify-between">
                <Link to="/" className="flex items-center gap-2">
                    <div className="w-7 h-7 grid place-items-center bg-[#007AFF]">
                        <ShieldWarning size={14} weight="bold" />
                    </div>
                    <span className="font-display font-black">CyberBreach</span>
                </Link>
                <a
                    href={api.reportUrl()}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs px-3 py-1.5 bg-[#007AFF] text-white"
                >
                    PDF
                </a>
            </div>

            <main className="flex-1 min-w-0 md:pt-0 pt-16">
                <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                >
                    {children}
                </motion.div>
                <footer className="mt-16 border-t border-white/10 py-8 px-6 md:px-10 text-xs text-[#52525b] font-body">
                    <div className="flex flex-wrap gap-2 justify-between items-center">
                        <span>
                            © 2026 CyberBreach Predictor · Built with FastAPI, ARIMA,
                            Poisson & React
                        </span>
                        <span className="font-mono">
                            data: 2005–2017 · engine: statsmodels + scipy
                        </span>
                    </div>
                </footer>
            </main>
        </div>
    );
}
