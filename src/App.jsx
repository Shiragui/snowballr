import React, { useState } from "react";
import Home from "./pages/Home";
import ETFDetail from "./pages/ETFDetail";
import ProjectionChart from "./components/ProjectionChart";

export default function App() {
  const [selectedETF, setSelectedETF] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="mb-8 text-center py-8">
        <h1 className="text-5xl font-bold text-emerald-400">SnowballR</h1>
        <p className="text-gray-300 mt-2">Accessible ETF research & growth simulation</p>
      </header>

      <main className="w-full px-8 flex flex-col md:flex-row gap-8 max-w-7xl mx-auto">
        <div className="md:w-1/3">
          <Home onSelectETF={setSelectedETF} />
        </div>

        <div className="md:w-2/3">
          <ETFDetail etf={selectedETF} />
          
          {/* Chart Section */}
        <div className="mt-8 bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-emerald-400">Growth Projection</h2>
          <ProjectionChart />
        </div>
        </div>
      </main>
    </div>
  );
}