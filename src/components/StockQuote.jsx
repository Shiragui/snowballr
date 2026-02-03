import React, { useState, useEffect } from 'react';
import { fetchStockQuote } from '../services/stockData';

export default function StockQuote({ symbol, stockData, timePeriod }) {
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!symbol) return;

    const loadQuote = async () => {
      setLoading(true);
      try {
        const data = await fetchStockQuote(symbol);
        setQuote(data);
      } catch (error) {
        console.error('Error loading quote:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuote();
    // Update every 10 seconds
    const interval = setInterval(loadQuote, 10000);

    return () => clearInterval(interval);
  }, [symbol]);

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

  const price = quote.price || 0;
  const { change, changePercent } = calculatePeriodChange();

  const isPositive = change >= 0;
  const changeColor = isPositive ? 'text-green-400' : 'text-red-400';
  const bgColor = isPositive ? 'bg-green-500/20' : 'bg-red-500/20';

  // Safety check for valid numbers
  if (isNaN(price) || isNaN(change) || isNaN(changePercent)) {
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
          {isPositive ? '+' : ''}{change.toFixed(2)} ({isPositive ? '+' : ''}{changePercent.toFixed(2)}%)
        </div>
      </div>
      <div className={`px-3 py-1 rounded-md ${bgColor} ${changeColor} text-sm font-medium`}>
        {isPositive ? '↑' : '↓'} {Math.abs(changePercent).toFixed(2)}%
      </div>
    </div>
  );
}
