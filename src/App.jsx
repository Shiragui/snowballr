import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import Home from "./pages/Home";
import ProjectionChart from "./components/ProjectionChart";
import GrowthCalculator from "./components/GrowthCalculator";
import ETFMetrics from "./components/ETFMetrics";
import ResizablePanel from "./components/ResizablePanel";
import StockQuote from "./components/StockQuote";
import AccountMenu from "./components/AccountMenu";
import SchwabHoldings from "./components/SchwabHoldings";
import { useAuth } from "./context/AuthContext";
import { api } from "./services/api";
import { etfs } from "./data/etfs";

const defaultEtfFields = {
  expenseRatio: 'N/A',
  avgReturn: 10,
  volatility: 'Medium',
  dividendYield: 'N/A',
};

function etfFromTicker(ticker) {
  return (
    etfs.find((e) => e.ticker.toUpperCase() === ticker.toUpperCase()) || {
      ticker: ticker.toUpperCase(),
      name: ticker.toUpperCase(),
      ...defaultEtfFields,
    }
  );
}

export default function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, refreshUser, refreshSchwab } = useAuth();
  const [selectedETF, setSelectedETF] = useState(etfs.find(e => e.ticker === "QQQ"));
  const [growthData, setGrowthData] = useState([]);
  const [stockPriceData, setStockPriceData] = useState([]);
  const [livePrice, setLivePrice] = useState(null);
  const [chartMode, setChartMode] = useState("price");
  const [chartSize, setChartSize] = useState(65);
  const [metricsSize, setMetricsSize] = useState(20);
  const [timePeriod, setTimePeriod] = useState("1Y");
  const [chartView, setChartView] = useState("line");
  const [projectionInputs, setProjectionInputs] = useState(null);
  const [savedProjections, setSavedProjections] = useState([]);
  const [loadedProjection, setLoadedProjection] = useState(null);
  const chartResizeRef = useRef(null);

  const handleChartResize = useCallback((fn) => {
    chartResizeRef.current = fn;
  }, []);

  const handleInputsChange = useCallback((inputs) => {
    setProjectionInputs(inputs);
  }, []);

  const refreshProjections = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedProjections([]);
      return;
    }
    try {
      const { projections } = await api.listProjections();
      setSavedProjections(projections);
    } catch {
      setSavedProjections([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshProjections();
  }, [refreshProjections]);

  useEffect(() => {
    const login = searchParams.get('login');
    const schwab = searchParams.get('schwab');
    if (login === 'success') {
      refreshUser();
      searchParams.delete('login');
      setSearchParams(searchParams, { replace: true });
    }
    if (schwab) {
      refreshSchwab();
      searchParams.delete('schwab');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, refreshUser, refreshSchwab]);

  useEffect(() => {
    if (chartResizeRef.current) {
      setTimeout(() => {
        chartResizeRef.current?.();
      }, 100);
    }
  }, [chartSize, metricsSize, chartMode]);

  const handleLoadProjection = (projection) => {
    setSelectedETF(etfFromTicker(projection.etfTicker));
    setLoadedProjection(projection);
    setChartMode('projection');
  };

  const handleSelectTicker = (ticker) => {
    setSelectedETF(etfFromTicker(ticker));
  };

  const projectionSummary = growthData.length > 0 ? growthData[growthData.length - 1] : null;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-900 via-primary-800 to-primary-900">
      <main className="w-full h-screen flex flex-col overflow-hidden">
        {/* Top section: Search bar and toggle */}
        <div className="flex-shrink-0 px-4 sm:px-6 lg:px-8 py-4 space-y-4 border-b border-primary-500/20">
          <div className="flex items-start justify-between gap-4">
            <div className="w-full max-w-2xl flex-1">
              <Home onSelectETF={setSelectedETF} selectedETF={selectedETF} />
            </div>
            <AccountMenu
              projectionInputs={projectionInputs}
              onLoadProjection={handleLoadProjection}
              savedProjections={savedProjections}
              onRefreshProjections={refreshProjections}
            />
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
                  livePrice={livePrice}
                />
              )}
              {chartMode === "projection" && projectionSummary && (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <div className="text-xs font-medium text-primary-300/80 uppercase tracking-wide">
                      Projected final balance
                    </div>
                    <div className="text-2xl font-bold text-primary-100 drop-shadow-[0_0_8px_rgba(221,214,254,0.4)]">
                      ${projectionSummary.balance.toLocaleString()}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-md bg-green-500/20 text-green-400 text-sm font-medium">
                    +${(projectionSummary.balance - projectionSummary.totalDeposits).toLocaleString()} profit
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {/* Chart view selector - only show in price mode */}
              {chartMode === "price" && (
                <div className="flex gap-1 bg-primary-500/10 rounded-lg p-1 border border-primary-500/20">
                  {['line', 'candlestick'].map((view) => (
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
        <div className="flex-1 flex flex-col overflow-hidden px-4 sm:px-6 lg:px-8 py-4 gap-4 min-h-0">
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
                    <ProjectionChart data={growthData} mode={chartMode} etf={selectedETF} timePeriod={timePeriod} chartView={chartView} onResize={handleChartResize} onDataChange={setStockPriceData} onLivePrice={setLivePrice} />
                  </div>
                  {/* Calculator Section */}
                  <div className="h-full w-full overflow-y-auto bg-primary-500/10 backdrop-blur-sm rounded-lg border border-primary-500/20" style={{ minWidth: 0 }}>
                    <GrowthCalculator
                      etf={selectedETF}
                      onData={setGrowthData}
                      onInputsChange={handleInputsChange}
                      loadProjection={loadedProjection}
                    />
                  </div>
                </ResizablePanel>
              ) : (
                /* Chart only in price mode */
                <div className="h-full w-full bg-primary-500/10 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-primary-500/20 flex flex-col" style={{ minWidth: 0, minHeight: 0, position: 'relative' }}>
                  <ProjectionChart data={growthData} mode={chartMode} etf={selectedETF} timePeriod={timePeriod} chartView={chartView} onResize={handleChartResize} onDataChange={setStockPriceData} onLivePrice={setLivePrice} />
                </div>
              )}
            </div>
            
            {/* Bottom section: Metrics - Resizable with minimum height, always visible */}
            <div className="w-full h-full flex flex-col items-center justify-center py-2 overflow-y-auto gap-4" style={{ minHeight: '150px' }}>
              <SchwabHoldings onSelectTicker={handleSelectTicker} />
              {selectedETF && <ETFMetrics etf={selectedETF} stockPriceData={stockPriceData} />}
            </div>
          </ResizablePanel>
        </div>
      </main>
    </div>
  );
}