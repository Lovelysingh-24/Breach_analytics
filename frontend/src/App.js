import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import OverviewPage from "@/pages/OverviewPage";
import EDAPage from "@/pages/EDAPage";
import ArimaPage from "@/pages/ArimaPage";
import PoissonPage from "@/pages/PoissonPage";
import PredictPage from "@/pages/PredictPage";
import MetricsPage from "@/pages/MetricsPage";
import DatasetPage from "@/pages/DatasetPage";

function App() {
    return (
        <BrowserRouter>
            <Layout>
                <Routes>
                    <Route path="/" element={<OverviewPage />} />
                    <Route path="/eda" element={<EDAPage />} />
                    <Route path="/arima" element={<ArimaPage />} />
                    <Route path="/poisson" element={<PoissonPage />} />
                    <Route path="/predict" element={<PredictPage />} />
                    <Route path="/metrics" element={<MetricsPage />} />
                    <Route path="/dataset" element={<DatasetPage />} />
                </Routes>
            </Layout>
        </BrowserRouter>
    );
}

export default App;
