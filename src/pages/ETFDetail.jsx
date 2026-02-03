import React, { useState } from "react";
import MetricCard from "../components/MetricCard";
import GrowthCalculator from "../components/GrowthCalculator";

export default function ETFDetail({ etf }) {
  const [growthData, setGrowthData] = useState([]);

  if (!etf) return null;

  return (
    <div className="w-full space-y-6">
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard title="Expense Ratio" value={`${etf.expenseRatio}%`} />
        <MetricCard title="Avg Annual Return" value={`${etf.avgReturn}%`} />
        <MetricCard title="Volatility" value={etf.volatility} />
        <MetricCard title="Dividend Yield" value={`${etf.dividendYield}%`} />
      </div>

      <GrowthCalculator onData={setGrowthData} />
    </div>
  );
}
