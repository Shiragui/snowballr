import React, { useState } from "react";
import MetricCard from "../components/MetricCard";
import GrowthCalculator from "../components/GrowthCalculator";
import ProjectionChart from "../components/ProjectionChart";

export default function ETFDetail({ etf }) {
  const [growthData, setGrowthData] = useState([]);

  if (!etf) return <p>Select an ETF from home page.</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h1>{etf.ticker} - {etf.name}</h1>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "1rem" }}>
        <MetricCard title="Expense Ratio" value={`${etf.expenseRatio}%`} />
        <MetricCard title="Avg Annual Return" value={`${etf.avgReturn}%`} />
        <MetricCard title="Volatility" value={etf.volatility} />
        <MetricCard title="Dividend Yield" value={`${etf.dividendYield}%`} />
      </div>

      <GrowthCalculator onData={setGrowthData} />
      <ProjectionChart data={growthData} />
    </div>
  );
}
