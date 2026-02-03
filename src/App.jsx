import React, { useState } from "react";
import Home from "./pages/Home";
import ETFDetail from "./pages/ETFDetail";
import ProjectionChart from "./components/ProjectionChart";
import { etfs } from "./data/etfs";



export default function App() {
  const [selectedETF, setSelectedETF] = useState(etfs.find(e => e.ticker === "QQQ"));

  return (
    <div className="min-h-screen flex flex-col">
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Search bar section */}
        <div className="w-full max-w-2xl">
          <Home onSelectETF={setSelectedETF} selectedETF={selectedETF} />
        </div>

        {/* Details and chart section */}
        <div className="w-full space-y-6">
          <ETFDetail etf={selectedETF} />
          
          {/* Chart Section */}
          <div className="bg-primary-500/10 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-primary-500/20">
            <h2 className="text-2xl font-bold mb-4 text-primary-200 drop-shadow-[0_0_8px_rgba(221,214,254,0.5)]">Growth Projection</h2>
            <ProjectionChart />
          </div>
        </div>
      </main>
    </div>
  );
}