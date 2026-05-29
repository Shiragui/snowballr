import React, { useState, useEffect, useRef } from 'react';
import { fetchLiveQuote, fetchStockQuote } from '../services/stockData';

export default function StockQuote({ symbol, stockData, timePeriod, livePrice }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!symbol) return;

    isInitialLoad.current = true;

    const loadQuote = async (live = false) => {
      if (isInitialLoad.current) {
        setLoading(true);
      }
      try {
        const data = live
          ? (await fetchLiveQuote(symbol)) ?? (await fetchStockQuote(symbol))
          : await fetchStockQuote(symbol);
        if (data) setQuote(data);
      } catch (error) {
        console.error('Error loading quote:', error);
      } finally {
        if (isInitialLoad.current) {
          setLoading(false);
          isInitialLoad.current = false;
        }
      }
    };

    loadQuote(false);
    const interval = setInterval(() => loadQuote(true), 3_000);

    return () => clearInterval(interval);
  }, [symbol]);

  useEffect(() => {
    if (livePrice == null) return;
    setQuote((prev) => {
      if (!prev || prev.price === livePrice) return prev;
      return { ...prev, price: livePrice };
    });
  }, [livePrice]);

  // Calculate period change from stock data
  const calculatePeriodChange = () => {
    // If we have stock data, calculate period change
    if (stockData && Array.isArray(stockData) && stockData.length >= 2) {
      const firstPrice = stockData[0]?.value;
      const lastPrice = stockData[stockData.length - 1]?.value;
      const currentPrice = quote?.price || lastPrice;
      
      if (firstPrice && currentPrice && !isNaN(firstPrice) && !isNaN(currentPrice) && firstPrice > 0) {
        const change = currentPrice - firstPrice;
        const changePercent = (change / firstPrice * 100);
        return { change, changePercent };
      }
    }
    
    // Fallback to today's change if period data not available
    if (quote) {
      const change = quote.change || 0;
      const changePercent = quote.changePercent || 0;
      if (change !== 0 || changePercent !== 0) {
        return { change, changePercent };
      }
    }
    
    return { change: 0, changePercent: 0 };
  };

  if (loading || !quote) {
    return (
      <div className="flex items-center gap-4 text-primary-300">
        <div className="text-sm">Loading...</div>
      </div>
    );
  }

  const price = livePrice ?? (Number(quote.price) || 0);
  const { change, changePercent } = calculatePeriodChange();
  const changeNum = Number(change) || 0;
  const changePercentNum = Number(changePercent) || 0;

  const isPositive = changeNum >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const bgColor = isPositive ? 'bg-green-500/20' : 'bg-red-500/20';

  // Safety check for valid numbers
  if (isNaN(price) || isNaN(changeNum) || isNaN(changePercentNum)) {
    return (
      <div className="flex items-center gap-4 text-primary-300">
        <div className="text-sm">Price data unavailable</div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <div className="text-2xl font-bold text-primary-200">
          ${price.toFixed(2)}
        </div>
        <div className={`text-sm font-medium ${changeColor}`}>
          {isPositive ? '+' : ''}{changeNum.toFixed(2)} ({isPositive ? '+' : ''}{changePercentNum.toFixed(2)}%)
        </div>
      </div>
      <div className="flex items-center gap-2">
        {quote.marketState === 'POST' && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
            After Hours
          </span>
        )}
        <div className={`px-3 py-1 rounded-md ${bgColor} ${changeColor} text-sm font-medium`}>
          {isPositive ? '↑' : '↓'} {Math.abs(changePercentNum).toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
