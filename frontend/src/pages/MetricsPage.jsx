import React, { useEffect, useState } from "react";
import { PageHeader, StatCard, Panel, LoadingBlock } from "@/components/UI";
import { IDS } from "@/constants/testIds/dashboard";
import { api } from "@/lib/apiClient";

export default function MetricsPage() {
    const [metrics, setMetrics] = useState(null);
    const [size, setSize] = useState(null);

    useEffect(() => {
        Promise.all([api.metrics(), api.sizeStats()]).then(([m, s]) => {
            setMetrics(m);
            setSize(s);
        });
    }, []);

    if (!metrics || !size) {
        return (
            <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
                <LoadingBlock />
            </div>
        );
    }

    return (
        <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto">
            <PageHeader
                overline="Model Metrics"
                title="Performance & goodness-of-fit."
                subtitle="Validation scores, information criteria, and distributional statistics for both models."
            />

            {/* ARIMA */}
            <div className="mb-10">
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-3">
                    <span className="w-1 h-6 bg-[#007AFF]" /> ARIMA(2, 1, 2)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    <StatCard
                        label="MAE"
                        value={metrics.arima.mae.toFixed(3)}
                        unit="incidents"
                        accent="primary"
                        testId={IDS.arimaMetricMae}
                    />
                    <StatCard
                        label="RMSE"
                        value={metrics.arima.rmse.toFixed(3)}
                        unit="incidents"
                        accent="warning"
                        testId={IDS.arimaMetricRmse}
                    />
                    <StatCard
                        label="MAPE"
                        value={`${metrics.arima.mape.toFixed(2)}`}
                        unit="%"
                        accent="critical"
                        testId={IDS.arimaMetricMape}
                    />
                    <StatCard
                        label="AIC"
                        value={metrics.arima.aic.toFixed(1)}
                        accent="success"
                        testId={IDS.arimaMetricAic}
                    />
                    <StatCard
                        label="BIC"
                        value={metrics.arima.bic.toFixed(1)}
                        accent="success"
                    />
                    <StatCard
                        label="Order"
                        value={`(${metrics.arima.order.join(",")})`}
                        unit="p,d,q"
                        accent="primary"
                    />
                </div>
            </div>

            {/* Poisson */}
            <div className="mb-10">
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-3">
                    <span className="w-1 h-6 bg-[#FFB340]" /> Poisson Stochastic
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="λ (monthly rate)"
                        value={metrics.poisson.lambda_monthly.toFixed(3)}
                        unit="incidents/mo"
                        accent="warning"
                        testId={IDS.poissonLambda}
                    />
                    <StatCard
                        label="Chi-square"
                        value={metrics.poisson.chi_square.toFixed(2)}
                        unit="statistic"
                        accent="primary"
                        testId={IDS.poissonChiSquare}
                    />
                    <StatCard
                        label="p-value"
                        value={metrics.poisson.p_value.toFixed(4)}
                        accent={
                            metrics.poisson.p_value > 0.05
                                ? "success"
                                : "critical"
                        }
                    />
                    <StatCard
                        label="Mean inter-arrival"
                        value={metrics.poisson.inter_arrival_mean_days.toFixed(
                            2,
                        )}
                        unit="days"
                        accent="critical"
                    />
                </div>
            </div>

            {/* Breach size */}
            <div>
                <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-3">
                    <span className="w-1 h-6 bg-[#FF3B30]" /> Breach Size
                    (Log-normal fit)
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Mean records"
                        value={size.mean.toLocaleString()}
                        accent="primary"
                    />
                    <StatCard
                        label="Median records"
                        value={size.median.toLocaleString()}
                        accent="warning"
                    />
                    <StatCard
                        label="Max records"
                        value={size.max.toLocaleString()}
                        accent="critical"
                    />
                    <StatCard
                        label="log-normal σ"
                        value={size.lognorm_shape.toFixed(3)}
                        accent="success"
                    />
                </div>
            </div>
        </div>
    );
}
