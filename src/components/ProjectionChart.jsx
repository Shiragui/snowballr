import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

// Generate mock stock price data
const generateStockPriceData = (ticker, days = 365) => {
  const data = [];
  const basePrice = ticker === "QQQ" ? 380 : ticker === "VOO" ? 450 : 420;
  let currentPrice = basePrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Random walk with slight upward trend
    const change = (Math.random() - 0.48) * 3; // Slight upward bias
    currentPrice = Math.max(50, currentPrice + change);
    
    const dateStr = date.toISOString().split('T')[0];
    data.push({
      time: dateStr,
      value: Math.round(currentPrice * 100) / 100
    });
  }
  
  return data;
};

export default function ProjectionChart({ data = [], mode = "projection", etf }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: 'rgba(139, 92, 246, 0.1)' },
        textColor: '#ddd6fe',
      },
      grid: {
        vertLines: { color: 'rgba(139, 92, 246, 0.2)' },
        horzLines: { color: 'rgba(139, 92, 246, 0.2)' },
      },
      timeScale: {
        borderColor: 'rgba(139, 92, 246, 0.3)',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: 'rgba(139, 92, 246, 0.3)',
      },
      watermark: {
        visible: false,
      },
    });

    chartRef.current = chart;

    // Set up initial data
    let chartData = [];
    
    if (mode === "projection") {
      // Growth projection data
      if (data.length > 0) {
        chartData = data.map(item => {
          // Calculate the date based on month
          const startYear = 2024;
          const year = startYear + Math.floor(item.month / 12);
          const month = (item.month % 12) + 1; // Month 1-12
          const dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
          return {
            time: dateStr,
            value: item.balance
          };
        });
      } else {
        // Default projection data
        chartData = [
          { time: '2024-01-01', value: 10000 },
          { time: '2025-01-01', value: 11000 },
          { time: '2026-01-01', value: 12100 },
        ];
      }
      
      const areaSeries = chart.addAreaSeries({
        lineColor: '#8b5cf6',
        topColor: 'rgba(139, 92, 246, 0.4)',
        bottomColor: 'rgba(139, 92, 246, 0.05)',
        lineWidth: 2,
      });
      
      areaSeries.setData(chartData);
      seriesRef.current = areaSeries;
    } else {
      // Stock price data
      if (etf) {
        chartData = generateStockPriceData(etf.ticker, 365);
      } else {
        chartData = [];
      }
      
      if (chartData.length > 0) {
        const lineSeries = chart.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        
        lineSeries.setData(chartData);
        seriesRef.current = lineSeries;
      }
    }

    if (chartData.length > 0) {
      chart.timeScale().fitContent();
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }
    };
  }, [mode, data, etf]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '400px',
        position: 'relative'
      }} 
      className="chart-container rounded-lg overflow-hidden"
    />
  );
}