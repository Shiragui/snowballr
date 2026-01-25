import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function ProjectionChart() {
  const chartContainerRef = useRef(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 400,
      layout: {
        background: { color: '#1f2937' },
        textColor: '#9ca3af',
      },
      grid: {
        vertLines: { color: '#374151' },
        horzLines: { color: '#374151' },
      },
      timeScale: {
        borderColor: '#374151',
        timeVisible: true,
      },
      rightPriceScale: {
        borderColor: '#374151',
      },
      watermark: {
        visible: false,
      },
    });

    const areaSeries = chart.addAreaSeries({
      lineColor: '#10b981',
      topColor: 'rgba(16, 185, 129, 0.4)',
      bottomColor: 'rgba(16, 185, 129, 0.05)',
      lineWidth: 2,
    });

    areaSeries.setData([
      { time: '2024-01-01', value: 10000 },
      { time: '2024-06-01', value: 10350 },
      { time: '2025-01-01', value: 10700 },
      { time: '2025-06-01', value: 11070 },
      { time: '2026-01-01', value: 11449 },
    ]);

    chart.timeScale().fitContent();

    return () => {
      chart.remove();
    };
  }, []);

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