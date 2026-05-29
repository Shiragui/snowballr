import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { fetchStockData, fetchLatestPrice } from '../services/stockData';

export default function ProjectionChart({ data = [], mode = "projection", etf, timePeriod = "1Y", chartView = "line", onResize, onDataChange }) {
  const chartContainerRef = useRef(null);
  const chartMountRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const depositsSeriesRef = useRef(null);
  const customSeriesRef = useRef(null);
  const tooltipRef = useRef(null);
  const streamingIntervalRef = useRef(null);
  const prevModeRef = useRef(mode);
  const prevChartViewRef = useRef(chartView);
  const crosshairUnsubRef = useRef(null);
  const projectionRangeUnsubRef = useRef(null);
  const projectionStartTimeRef = useRef(null);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch real stock data when in price mode
  useEffect(() => {
    if (mode === "price" && etf?.ticker) {
      setLoading(true);
      fetchStockData(etf.ticker, timePeriod)
        .then(data => {
          setStockData(data);
          if (onDataChange) {
            onDataChange(data);
          }
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading stock data:', error);
          setLoading(false);
        });
    } else {
      setStockData([]);
      if (onDataChange) {
        onDataChange([]);
      }
    }
  }, [mode, etf?.ticker, timePeriod, onDataChange]);

  // Real-time streaming updates (polling for intraday)
  useEffect(() => {
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }

    if (mode !== "price" || !etf?.ticker || timePeriod !== '1D') {
      return;
    }

    const updatePrice = async () => {
      if (!seriesRef.current) return;

      try {
        const latest = await fetchLatestPrice(etf.ticker);
        if (latest?.value != null && !isNaN(latest.value)) {
          seriesRef.current.update(latest);
        }
      } catch (error) {
        console.error('Error fetching latest price:', error);
      }
    };

    updatePrice();
    streamingIntervalRef.current = setInterval(updatePrice, 60000);

    return () => {
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
      }
    };
  }, [mode, etf?.ticker, timePeriod, stockData.length]);

  // Handle chart resize - separate effect that runs after chart is created
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          try {
            if (typeof chartRef.current.resize === 'function') {
              chartRef.current.resize(width, height);
            } else {
              chartRef.current.applyOptions({ width, height });
            }
          } catch (error) {
            console.error('Chart resize failed:', error);
          }
        }
      }
    };

    // Use a small delay to ensure DOM has updated after resize
    let resizeTimeout;
    const resizeObserver = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        requestAnimationFrame(() => {
          handleResize();
        });
      }, 10);
    });

    resizeObserver.observe(chartContainerRef.current);
    
    // Also observe the parent container in case it changes
    if (chartContainerRef.current.parentElement) {
      resizeObserver.observe(chartContainerRef.current.parentElement);
    }
    
    // Initial resize with a small delay
    setTimeout(() => {
      handleResize();
    }, 100);
    
    // Expose resize function to parent if needed
    if (onResize) {
      onResize(handleResize);
    }

    return () => {
      clearTimeout(resizeTimeout);
      resizeObserver.disconnect();
    };
  }, [mode, data, etf, onResize]);
  
  // Force resize when container dimensions might have changed
  useEffect(() => {
    if (chartRef.current && chartContainerRef.current) {
      const timeout = setTimeout(() => {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        if (width > 0 && height > 0 && chartRef.current) {
          if (typeof chartRef.current.resize === 'function') {
            chartRef.current.resize(width, height);
          } else {
            chartRef.current.applyOptions({
              width: width,
              height: height,
            });
          }
        }
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [data.length]); // Trigger when data changes

  useEffect(() => {
    if (!chartContainerRef.current || !chartMountRef.current) return;

    const modeChanged = prevModeRef.current !== mode;
    const chartViewChanged = prevChartViewRef.current !== chartView;
    prevModeRef.current = mode;
    prevChartViewRef.current = chartView;

    const removeSeries = (seriesRefToRemove) => {
      if (seriesRefToRemove.current && chartRef.current) {
        try {
          chartRef.current.removeSeries(seriesRefToRemove.current);
        } catch (e) {
          // Series might already be removed
        }
        seriesRefToRemove.current = null;
      }
    };

    try {
      if (chartRef.current && modeChanged) {
        if (typeof crosshairUnsubRef.current === 'function') {
          crosshairUnsubRef.current();
          crosshairUnsubRef.current = null;
        }
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        depositsSeriesRef.current = null;
        customSeriesRef.current = null;
      }

      if (mode === "projection") {
        if (typeof crosshairUnsubRef.current === 'function') {
          crosshairUnsubRef.current();
          crosshairUnsubRef.current = null;
        }
        removeSeries(seriesRef);
        removeSeries(depositsSeriesRef);
        removeSeries(customSeriesRef);
      } else if (chartViewChanged) {
        removeSeries(seriesRef);
      }

      if (!tooltipRef.current && chartContainerRef.current) {
        const tooltip = document.createElement('div');
        tooltip.className = 'absolute pointer-events-none z-20 bg-primary-500/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-400/50 shadow-lg';
        tooltip.style.display = 'none';
        tooltip.style.fontSize = '12px';
        tooltip.style.color = '#ddd6fe';
        chartContainerRef.current.appendChild(tooltip);
        tooltipRef.current = tooltip;
      }

      let chart = chartRef.current;
      if (!chart && chartMountRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        chart = createChart(chartMountRef.current, {
          width: width > 0 ? width : 400,
          height: height > 0 ? height : 400,
          layout: {
            background: { color: 'rgba(139, 92, 246, 0.1)' },
            textColor: '#ddd6fe',
          },
          grid: {
            vertLines: { color: 'rgba(139, 92, 246, 0.2)' },
            horzLines: { color: 'rgba(139, 92, 246, 0.2)' },
          },
          crosshair: {
            mode: 1,
            vertLine: { color: 'rgba(196, 181, 253, 0.5)', width: 1, style: 2 },
            horzLine: { color: 'rgba(196, 181, 253, 0.5)', width: 1, style: 2 },
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
      }

      if (!chart) return;

      let chartData = [];

      if (mode === "price" && seriesRef.current && stockData.length > 0 && !chartViewChanged && !modeChanged) {
        const isIntraday = typeof stockData[0].time === 'number';
        const lineData = stockData
          .filter(item => item.value != null && !isNaN(item.value))
          .map(item => ({ time: item.time, value: item.value }));

        if (lineData.length > 0 && chartView !== 'candlestick') {
          try {
            seriesRef.current.setData(lineData);
            chart.timeScale().fitContent();
            if (isIntraday) {
              chart.timeScale().applyOptions({ timeVisible: true, secondsVisible: false });
            }
            return;
          } catch (error) {
            console.error('Chart setData failed, recreating series:', error);
            removeSeries(seriesRef);
          }
        }
      }

      if (mode === "projection") {
      // Growth projection data
      let depositsData = [];
      let compareData = [];
      const currentDate = new Date();
      const startYear = currentDate.getFullYear();
      const startMonth = currentDate.getMonth() + 1; // Month 1-12
      const hasCompare = data.length > 0 && data.some(item => item.compareBalance !== null && item.compareBalance !== undefined);
      
      if (data.length > 0) {
        chartData = data.map(item => {
          // Calculate the date based on month from current date
          const totalMonths = startMonth - 1 + item.month; // Add months to current month
          const year = startYear + Math.floor(totalMonths / 12);
          const month = (totalMonths % 12) + 1; // Month 1-12
          const day = item.month === 0 ? currentDate.getDate() : 1; // Use current day for month 0, otherwise 1st
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return {
            time: dateStr,
            value: item.balance
          };
        });
        
        depositsData = data.map(item => {
          const totalMonths = startMonth - 1 + item.month;
          const year = startYear + Math.floor(totalMonths / 12);
          const month = (totalMonths % 12) + 1;
          const day = item.month === 0 ? currentDate.getDate() : 1;
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          return {
            time: dateStr,
            value: item.totalDeposits
          };
        });
        
        if (hasCompare) {
          compareData = data.map(item => {
            const totalMonths = startMonth - 1 + item.month;
            const year = startYear + Math.floor(totalMonths / 12);
            const month = (totalMonths % 12) + 1;
            const day = item.month === 0 ? currentDate.getDate() : 1;
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            return {
              time: dateStr,
              value: item.compareBalance
            };
          });
        }
      } else {
        // Default projection data - use current date
        const today = new Date();
        const nextYear = new Date(today);
        nextYear.setFullYear(today.getFullYear() + 1);
        const yearAfter = new Date(today);
        yearAfter.setFullYear(today.getFullYear() + 2);
        
        chartData = [
          { time: today.toISOString().split('T')[0], value: 10000 },
          { time: nextYear.toISOString().split('T')[0], value: 11000 },
          { time: yearAfter.toISOString().split('T')[0], value: 12100 },
        ];
        depositsData = [
          { time: today.toISOString().split('T')[0], value: 5000 },
          { time: nextYear.toISOString().split('T')[0], value: 6500 },
          { time: yearAfter.toISOString().split('T')[0], value: 8000 },
        ];
      }
      
      // Add deposits line series
      if (depositsData.length > 0) {
        const depositsLine = chart.addLineSeries({
          color: '#a78bfa',
          lineWidth: 1.5,
          lineStyle: 2, // Dashed line
          title: 'Total Deposits',
        });
        depositsLine.setData(depositsData);
        depositsSeriesRef.current = depositsLine;
      }
      
      // Add comparison line series if available
      if (compareData.length > 0) {
        const compareLine = chart.addLineSeries({
          color: '#c4b5fd',
          lineWidth: 2,
          lineStyle: 0, // Solid line
          title: 'Comparison',
        });
        compareLine.setData(compareData);
        customSeriesRef.current = compareLine;
      }
      
      const areaSeries = chart.addAreaSeries({
        lineColor: '#8b5cf6',
        topColor: 'rgba(139, 92, 246, 0.4)',
        bottomColor: 'rgba(139, 92, 246, 0.05)',
        lineWidth: 2,
        title: 'Projected Balance',
      });
      
      areaSeries.setData(chartData);
      seriesRef.current = areaSeries;
      projectionStartTimeRef.current = chartData[0]?.time ?? null;
      
      // Add crosshair move handler for tooltip
      crosshairUnsubRef.current = chart.subscribeCrosshairMove(param => {
        if (!tooltipRef.current) return;
        
        if (param.point === undefined || !param.time || param.point.x < 0 || param.point.x > chartContainerRef.current.clientWidth || param.point.y < 0 || param.point.y > chartContainerRef.current.clientHeight) {
          tooltipRef.current.style.display = 'none';
          return;
        }
        
        const balanceData = param.seriesData.get(areaSeries);
        const depositsDataPoint = depositsSeriesRef.current ? param.seriesData.get(depositsSeriesRef.current) : null;
        const compareDataPoint = customSeriesRef.current ? param.seriesData.get(customSeriesRef.current) : null;
        
        if (balanceData) {
          const balance = balanceData.value;
          const deposits = depositsDataPoint ? depositsDataPoint.value : null;
          const compareBalance = compareDataPoint ? compareDataPoint.value : null;
          
          // Handle date parsing - param.time is a string in 'YYYY-MM-DD' format
          let date;
          if (typeof param.time === 'string') {
            // Parse YYYY-MM-DD format
            date = new Date(param.time + 'T00:00:00');
          } else if (typeof param.time === 'number') {
            // If it's a timestamp, check if it's in seconds or milliseconds
            date = new Date(param.time > 10000000000 ? param.time : param.time * 1000);
          } else {
            date = new Date();
          }
          
          // Check if date is valid
          if (isNaN(date.getTime())) {
            tooltipRef.current.style.display = 'none';
            return;
          }
          
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
          
          const profit = deposits ? balance - deposits : null;
          const profitPercent = deposits && deposits > 0 ? ((profit / deposits) * 100).toFixed(1) : null;
          
          let tooltipContent = `
            <div class="space-y-1">
              <div class="font-semibold text-primary-200">${dateStr}</div>
              <div class="text-primary-300">Balance: <span class="text-primary-200 font-medium">$${balance.toLocaleString()}</span></div>
          `;
          
          if (compareBalance !== null) {
            tooltipContent += `
              <div class="text-primary-300">Comparison: <span class="text-primary-200 font-medium">$${compareBalance.toLocaleString()}</span></div>
            `;
          }
          
          if (deposits !== null) {
            tooltipContent += `
              <div class="text-primary-300">Deposits: <span class="text-primary-200 font-medium">$${deposits.toLocaleString()}</span></div>
              <div class="text-primary-300">Profit: <span class="text-primary-200 font-medium">$${profit.toLocaleString()}</span> (${profitPercent}%)</div>
            `;
          }
          
          tooltipContent += `</div>`;
          
          tooltipRef.current.innerHTML = tooltipContent;
          tooltipRef.current.style.display = 'block';
          
          const chartRect = chartContainerRef.current.getBoundingClientRect();
          const tooltipWidth = tooltipRef.current.offsetWidth || 200;
          const tooltipHeight = tooltipRef.current.offsetHeight || 100;
          
          let left = param.point.x + 10;
          let top = param.point.y - 10;
          
          // Adjust if tooltip goes off screen
          if (left + tooltipWidth > chartRect.width) {
            left = param.point.x - tooltipWidth - 10;
          }
          if (top + tooltipHeight > chartRect.height) {
            top = param.point.y - tooltipHeight - 10;
          }
          if (top < 0) {
            top = 10;
          }
          
          tooltipRef.current.style.left = left + 'px';
          tooltipRef.current.style.top = top + 'px';
        } else {
          tooltipRef.current.style.display = 'none';
        }
      });
    } else {
      projectionStartTimeRef.current = null;
      // Stock price data - use real data from API
      chartData = stockData;
      
      if (chartData.length > 0) {
        // Check if we're using intraday data (Unix timestamps) or daily data (date strings)
        const isIntraday = typeof chartData[0].time === 'number';
        
        // Remove existing series if switching views
        if (seriesRef.current) {
          try {
            chart.removeSeries(seriesRef.current);
          } catch (e) {
            // Series might already be removed
          }
          seriesRef.current = null;
        }
        
        let series;
        
        // Check if we have OHLC data for candlestick
        const hasOHLC = chartData.some(item => 
          item.open !== undefined && 
          item.high !== undefined && 
          item.low !== undefined &&
          !isNaN(item.open) &&
          !isNaN(item.high) &&
          !isNaN(item.low) &&
          item.open > 0 &&
          item.high > 0 &&
          item.low > 0
        );
        
        if (chartView === 'candlestick' && hasOHLC) {
          // Candlestick chart
          series = chart.addCandlestickSeries({
            upColor: '#10b981',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#10b981',
            wickDownColor: '#ef4444',
          });
          
          const candlestickData = chartData
            .filter(item => 
              item.open !== undefined && 
              item.high !== undefined && 
              item.low !== undefined &&
              !isNaN(item.open) &&
              !isNaN(item.high) &&
              !isNaN(item.low) &&
              !isNaN(item.value)
            )
            .map(item => ({
              time: item.time,
              open: item.open,
              high: item.high,
              low: item.low,
              close: item.value
            }));
          
          if (candlestickData.length > 0) {
            series.setData(candlestickData);
          } else {
            // Fallback to line if no valid candlestick data
            series = chart.addLineSeries({
              color: '#8b5cf6',
              lineWidth: 2,
              priceFormat: {
                type: 'price',
                precision: 2,
                minMove: 0.01,
              },
            });
            series.setData(chartData.map(item => ({ time: item.time, value: item.value })));
          }
        } else if (chartView === 'area') {
          // Area chart
          series = chart.addAreaSeries({
            lineColor: '#8b5cf6',
            topColor: 'rgba(139, 92, 246, 0.3)',
            bottomColor: 'rgba(139, 92, 246, 0.1)',
            lineWidth: 2,
          });
          series.setData(chartData.map(item => ({ time: item.time, value: item.value })));
        } else {
          // Line chart (default)
          series = chart.addLineSeries({
            color: '#8b5cf6',
            lineWidth: 2,
            priceFormat: {
              type: 'price',
              precision: 2,
              minMove: 0.01,
            },
          });
          series.setData(chartData.map(item => ({ time: item.time, value: item.value })));
        }
        
        // Configure time scale based on data type
        if (isIntraday) {
          chart.timeScale().applyOptions({
            timeVisible: true,
            secondsVisible: false,
          });
        }
        
        seriesRef.current = series;
      }
    }

      if (chartData.length > 0) {
        try {
          if (mode === "projection") {
            chart.timeScale().applyOptions({
              fixLeftEdge: true,
              fixRightEdge: false,
            });
          } else {
            chart.timeScale().applyOptions({
              fixLeftEdge: false,
              fixRightEdge: false,
            });
          }
          chart.timeScale().fitContent();

          if (typeof projectionRangeUnsubRef.current === 'function') {
            projectionRangeUnsubRef.current();
            projectionRangeUnsubRef.current = null;
          }

          if (mode === "projection" && projectionStartTimeRef.current) {
            const startTime = projectionStartTimeRef.current;
            projectionRangeUnsubRef.current = chart.timeScale().subscribeVisibleTimeRangeChange((range) => {
              if (!range || range.from >= startTime) return;
              try {
                chart.timeScale().setVisibleRange({
                  from: startTime,
                  to: range.to > startTime ? range.to : startTime,
                });
              } catch (error) {
                console.error('Chart visible range clamp failed:', error);
              }
            });
          }
        } catch (error) {
          console.error('Chart fitContent failed:', error);
        }
      }
    } catch (error) {
      console.error('Chart effect error:', error);
    }

    return () => {
      if (typeof crosshairUnsubRef.current === 'function') {
        crosshairUnsubRef.current();
        crosshairUnsubRef.current = null;
      }
      if (typeof projectionRangeUnsubRef.current === 'function') {
        projectionRangeUnsubRef.current();
        projectionRangeUnsubRef.current = null;
      }
    };
  }, [mode, data, etf, stockData, chartView]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof crosshairUnsubRef.current === 'function') {
        crosshairUnsubRef.current();
        crosshairUnsubRef.current = null;
      }
      if (typeof projectionRangeUnsubRef.current === 'function') {
        projectionRangeUnsubRef.current();
        projectionRangeUnsubRef.current = null;
      }
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        depositsSeriesRef.current = null;
        customSeriesRef.current = null;
      }
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        position: 'relative',
        minHeight: '400px',
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column'
      }} 
      className="chart-container rounded-lg overflow-hidden"
    >
      <div
        ref={chartMountRef}
        style={{ width: '100%', height: '100%', flex: '1 1 auto', minHeight: '400px' }}
      />
    </div>
  );
}