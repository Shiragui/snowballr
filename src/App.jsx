import React, { useState } from "react";
import Home from "./pages/Home";
import ProjectionChart from "./components/ProjectionChart";
import GrowthCalculator from "./components/GrowthCalculator";
import MetricCard from "./components/MetricCard";
import { etfs } from "./data/etfs";



export default function App() {
  const [selectedETF, setSelectedETF] = useState(etfs.find(e => e.ticker === "QQQ"));
  const [growthData, setGrowthData] = useState([]);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Search bar section */}
        <div className="w-full max-w-2xl">
          <Home onSelectETF={setSelectedETF} selectedETF={selectedETF} />
        </div>

        {/* Two column layout: ETF Details + Calculator */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Left column: Chart and Metrics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chart Section */}
            <div className="bg-primary-500/10 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-primary-500/20">
              <h2 className="text-2xl font-bold mb-4 text-primary-200 drop-shadow-[0_0_8px_rgba(221,214,254,0.5)]">Growth Projection</h2>
              <ProjectionChart data={growthData} />
            </div>

            {/* Metric Cards Grid - Under the graph */}
            {selectedETF && (
              <div className="grid grid-cols-4 gap-3">
                <MetricCard title="Expense Ratio" value={`${selectedETF.expenseRatio}%`} />
                <MetricCard title="Avg Annual Return" value={`${selectedETF.avgReturn}%`} />
                <MetricCard title="Volatility" value={selectedETF.volatility} />
                <MetricCard title="Dividend Yield" value={`${selectedETF.dividendYield}%`} />
              </div>
            )}
          </div>

          {/* Right column: Growth Calculator */}
          <div className="lg:col-span-1">
            <GrowthCalculator etf={selectedETF} onData={setGrowthData} />
          </div>
        </div>
      </main>
    </div>
  );
}