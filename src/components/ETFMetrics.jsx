import React, { useState, useEffect, useRef } from "react";
import { fetchStockQuote } from '../services/stockData';

// Calculate additional metrics based on ETF data
const calculateAdditionalMetrics = (etf) => {
  const avgReturn = Number(etf.avgReturn);
  const hasAvgReturn = !isNaN(avgReturn) && avgReturn > 0;

  // Calculate Sharpe Ratio (simplified - higher return and lower volatility = better)
  const volatilityScore = etf.volatility === "High" ? 1.5 : etf.volatility === "Medium" ? 1.0 : 0.5;
  const sharpeRatio = hasAvgReturn ? ((avgReturn - 2) / volatilityScore).toFixed(2) : 'N/A';
  
  // Calculate Price-to-Earnings (mock calculation based on return)
  const peRatio = hasAvgReturn ? (100 / avgReturn).toFixed(1) : 'N/A';
  
  // Assets Under Management (mock - based on ticker popularity)
  const aumMap = {
    "VOO": "$850B",
    "SPY": "$450B", 
    "QQQ": "$200B"
  };
  const aum = aumMap[etf.ticker] || "$100B";
  
  // 52-week range (mock calculation)
  const currentPrice = etf.ticker === "QQQ" ? 380 : etf.ticker === "VOO" ? 450 : 420;
  const high52w = (currentPrice * 1.15).toFixed(2);
  const low52w = (currentPrice * 0.85).toFixed(2);
  
  return { sharpeRatio, peRatio, aum, high52w, low52w, currentPrice };
};

export default function ETFMetrics({ etf, stockPriceData }) {
  const [todayQuote, setTodayQuote] = useState(null);
  const [loadingTodayQuote, setLoadingTodayQuote] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!etf?.ticker) return;

    isInitialLoad.current = true;

    const loadTodayQuote = async () => {
      if (isInitialLoad.current) {
        setLoadingTodayQuote(true);
      }
      try {
        const data = await fetchStockQuote(etf.ticker);
        if (data) setTodayQuote(data);
      } catch (error) {
        console.error('Error loading today\'s quote:', error);
      } finally {
        if (isInitialLoad.current) {
          setLoadingTodayQuote(false);
          isInitialLoad.current = false;
        }
      }
    };

    loadTodayQuote();
    const interval = setInterval(loadTodayQuote, 60000);

    return () => clearInterval(interval);
  }, [etf?.ticker]);

  if (!etf) return null;

  const additionalMetrics = calculateAdditionalMetrics(etf);
  
  const todayPrice = Number(todayQuote?.price) || 0;
  const todayChange = Number(todayQuote?.change) || 0;
  const todayChangePercent = Number(todayQuote?.changePercent) || 0;

  const isPositive = todayChange >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';

  return (
    <div className="bg-primary-500/10 backdrop-blur-sm rounded-lg p-4 shadow-md border border-primary-500/20 w-full">
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Expense Ratio</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {etf.expenseRatio}%
          </p>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Avg Annual Return</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {etf.avgReturn}%
          </p>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Volatility</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {etf.volatility}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Dividend Yield</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {etf.dividendYield}%
          </p>
        </div>
      </div>
      
      {/* Additional metrics row */}
      <div className="grid grid-cols-4 gap-4 pt-4 border-t border-primary-500/20">
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Sharpe Ratio</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {additionalMetrics.sharpeRatio}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">P/E Ratio</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {additionalMetrics.peRatio}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center border-r border-primary-500/20 pr-4">
          <h4 className="text-primary-300 text-xs font-medium mb-1">AUM</h4>
          <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
            {additionalMetrics.aum}
          </p>
        </div>
        <div className="flex flex-col items-center justify-center">
          <h4 className="text-primary-300 text-xs font-medium mb-1">Today's Change</h4>
          {loadingTodayQuote ? (
            <p className="text-primary-200 text-sm">Loading...</p>
          ) : (
            <>
              <p className="text-primary-200 text-base font-semibold drop-shadow-[0_0_4px_rgba(221,214,254,0.4)]">
                ${todayPrice.toFixed(2)}
              </p>
              <p className={`text-sm font-medium ${changeColor}`}>
                {isPositive ? '+' : ''}{todayChange.toFixed(2)} ({isPositive ? '+' : ''}{todayChangePercent.toFixed(2)}%)
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
