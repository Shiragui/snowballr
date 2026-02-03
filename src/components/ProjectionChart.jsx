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

    const areaSeries = chart.addAreaSeries({
      lineColor: '#8b5cf6',
      topColor: 'rgba(139, 92, 246, 0.4)',
      bottomColor: 'rgba(139, 92, 246, 0.05)',
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