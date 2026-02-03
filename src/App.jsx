import React, { useState, useRef, useEffect } from "react";
import Home from "./pages/Home";
import ProjectionChart from "./components/ProjectionChart";
import GrowthCalculator from "./components/GrowthCalculator";
import ETFMetrics from "./components/ETFMetrics";
import ResizablePanel from "./components/ResizablePanel";
import StockQuote from "./components/StockQuote";
import { etfs } from "./data/etfs";



export default function App() {
  const [selectedETF, setSelectedETF] = useState(etfs.find(e => e.ticker === "QQQ"));
  const [growthData, setGrowthData] = useState([]);
  const [stockPriceData, setStockPriceData] = useState([]); // Store stock price data for period calculation
  const [chartMode, setChartMode] = useState("price"); // "projection" or "price"
  const [chartSize, setChartSize] = useState(65); // Default 65% for chart, 35% for calculator
  const [metricsSize, setMetricsSize] = useState(20); // Default 20% for metrics
  const [timePeriod, setTimePeriod] = useState("1Y"); // Time period for stock price chart
  const [chartView, setChartView] = useState("line"); // "line", "candlestick", "area"
  const chartResizeRef = useRef(null);
  
  // Trigger chart resize when panel sizes change
  useEffect(() => {
    if (chartResizeRef.current) {
      setTimeout(() => {
        chartResizeRef.current?.();
      }, 100);
    }
  }, [chartSize, metricsSize, chartMode]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <main className="w-full h-screen flex flex-col overflow-hidden">
        {/* Top section: Search bar and toggle */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 space-y-4 border-b border-primary-500/20">
          <div className="w-full max-w-2xl">
            <Home onSelectETF={setSelectedETF} selectedETF={selectedETF} />
          </div>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-primary-200 drop-shadow-[0_0_8px_rgba(221,214,254,0.5)]">
                {chartMode === "projection" ? "Growth Projection" : "Stock Price"}
              </h2>
              {chartMode === "price" && selectedETF && (
                <StockQuote 
                  symbol={selectedETF.ticker} 
                  stockData={stockPriceData}
                  timePeriod={timePeriod}
                />
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Chart view selector - only show in price mode */}
              {chartMode === "price" && (
                <div className="flex gap-1 bg-primary-500/10 rounded-lg p-1 border border-primary-500/20">
                  {['line', 'candlestick', 'area'].map((view) => (
                    <button
                      key={view}
                      onClick={() => setChartView(view)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors capitalize ${
                        chartView === view
                          ? "bg-primary-400/30 text-primary-200"
                          : "text-primary-300 hover:text-primary-200"
                      }`}
                    >
                      {view}
                    </button>
                  ))}
                </div>
              )}
              {/* Time period selector - only show in price mode */}
              {chartMode === "price" && (
                <div className="flex gap-1 bg-primary-500/10 rounded-lg p-1 border border-primary-500/20">
                  {['1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'All'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimePeriod(period)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                        timePeriod === period
                          ? "bg-primary-400/30 text-primary-200"
                          : "text-primary-300 hover:text-primary-200"
                      }`}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 bg-primary-500/10 rounded-lg p-1 border border-primary-500/20">
                <button
                  onClick={() => setChartMode("price")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    chartMode === "price"
                      ? "bg-primary-400/30 text-primary-200"
                      : "text-primary-300 hover:text-primary-200"
                  }`}
                >
                  Price
                </button>
                <button
                  onClick={() => setChartMode("projection")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    chartMode === "projection"
                      ? "bg-primary-400/30 text-primary-200"
                      : "text-primary-300 hover:text-primary-200"
                  }`}
                >
                  Projection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main resizable content area */}
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-4 gap-4">
          <ResizablePanel
            direction="vertical"
            defaultSize={100 - metricsSize}
            minSize={60}
            maxSize={85}
            onResize={(size) => setMetricsSize(100 - size)}
          >
            {/* Top section: Chart and Calculator */}
            <div className="h-full w-full flex flex-col" style={{ minHeight: 0 }}>
              {chartMode === "projection" ? (
                <ResizablePanel
                  direction="horizontal"
                  defaultSize={chartSize}
                  minSize={50}
                  maxSize={75}
                  onResize={setChartSize}
                >
                  {/* Chart Section */}
                  <div className="h-full w-full bg-primary-500/10 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-primary-500/20 flex flex-col" style={{ minWidth: 0, minHeight: 0, position: 'relative' }}>
                    <ProjectionChart data={growthData} mode={chartMode} etf={selectedETF} timePeriod={timePeriod} chartView={chartView} onResize={(fn) => { chartResizeRef.current = fn; }} onDataChange={setStockPriceData} />
                  </div>
                  {/* Calculator Section */}
                  <div className="h-full w-full overflow-y-auto bg-primary-500/10 backdrop-blur-sm rounded-lg border border-primary-500/20" style={{ minWidth: 0 }}>
                    <GrowthCalculator etf={selectedETF} onData={setGrowthData} />
                  </div>
                </ResizablePanel>
              ) : (
                /* Chart only in price mode */
                <div className="h-full w-full bg-primary-500/10 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-primary-500/20 flex flex-col" style={{ minWidth: 0, minHeight: 0, position: 'relative' }}>
                  <ProjectionChart data={growthData} mode={chartMode} etf={selectedETF} timePeriod={timePeriod} chartView={chartView} onResize={(fn) => { chartResizeRef.current = fn; }} onDataChange={setStockPriceData} />
                </div>
              )}
            </div>
            
            {/* Bottom section: Metrics - Resizable with minimum height, always visible */}
            <div className="w-full h-full flex items-center justify-center py-2 overflow-y-auto" style={{ minHeight: '150px' }}>
              {selectedETF && <ETFMetrics etf={selectedETF} stockPriceData={stockPriceData} />}
            </div>
          </ResizablePanel>
        </div>
      </main>
    </div>
  );
}