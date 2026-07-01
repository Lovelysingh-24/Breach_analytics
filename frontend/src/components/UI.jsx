import React from "react";

export function PageHeader({ overline, title, subtitle, actions }) {
    return (
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
            <div>
                {overline && <div className="overline mb-3">{overline}</div>}
                <h1 className="font-display font-black text-3xl md:text-5xl leading-[1.05] tracking-tighter">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-3 text-[#a1a1aa] max-w-2xl leading-relaxed">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
        </div>
    );
}

export function StatCard({ label, value, unit, accent = "primary", testId }) {
    const accentColor = {
        primary: "text-[#007AFF]",
        critical: "text-[#FF3B30]",
        warning: "text-[#FFB340]",
        success: "text-[#34C759]",
    }[accent];
    return (
        <div
            data-testid={testId}
            className="card-surface p-5 flex flex-col h-full"
        >
            <div className="overline">{label}</div>
            <div className="mt-3 flex items-baseline gap-2">
                <span className={`font-mono font-bold text-3xl ${accentColor}`}>
                    {value}
                </span>
                {unit && (
                    <span className="text-xs text-[#52525b] font-mono uppercase tracking-wider">
                        {unit}
                    </span>
                )}
            </div>
        </div>
    );
}

export function Panel({ title, subtitle, right, children, testId, className = "" }) {
    return (
        <section
            data-testid={testId}
            className={`card-surface p-5 md:p-6 h-full flex flex-col ${className}`}
        >
            {(title || right) && (
                <header className="flex items-start justify-between mb-4 gap-3">
                    <div>
                        {title && (
                            <h3 className="font-display font-bold text-lg leading-tight">
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-xs text-[#52525b] font-body mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {right}
                </header>
            )}
            <div className="flex-1 min-h-0">{children}</div>
        </section>
    );
}

export function LoadingBlock({ label = "Computing…" }) {
    return (
        <div className="min-h-[280px] grid place-items-center text-[#52525b] font-mono text-xs">
            <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-[#007AFF] animate-pulse"></span>
                {label}
            </div>
        </div>
    );
}

export function ErrorBlock({ msg }) {
    return (
        <div className="min-h-[240px] grid place-items-center text-[#FF3B30] font-mono text-xs p-4 border border-[#FF3B30]/30">
            {msg || "Error loading data"}
        </div>
    );
}
