import { useEffect, useRef, useState } from 'react';
import { createChart } from 'lightweight-charts';
import { fetchStockData, fetchLatestPrice } from '../services/stockData';

export default function ProjectionChart({ data = [], mode = "projection", etf, timePeriod = "1Y", onResize }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const depositsSeriesRef = useRef(null);
  const customSeriesRef = useRef(null);
  const tooltipRef = useRef(null);
  const [stockData, setStockData] = useState([]);
  const [loading, setLoading] = useState(false);
  const streamingIntervalRef = useRef(null);

  // Fetch real stock data when in price mode
  useEffect(() => {
    if (mode === "price" && etf?.ticker) {
      setLoading(true);
      fetchStockData(etf.ticker, timePeriod)
        .then(data => {
          setStockData(data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error loading stock data:', error);
          setLoading(false);
        });
    } else {
      setStockData([]);
    }
  }, [mode, etf?.ticker, timePeriod]);

  // Real-time streaming updates (polling every 5 seconds for intraday)
  useEffect(() => {
    if (mode === "price" && etf?.ticker && seriesRef.current) {
      // Clear any existing interval
      if (streamingIntervalRef.current) {
        clearInterval(streamingIntervalRef.current);
      }

      // Only stream for 1D period (intraday data)
      if (timePeriod === '1D') {
        const updatePrice = async () => {
          const latest = await fetchLatestPrice(etf.ticker);
          if (latest && seriesRef.current) {
            // Update chart with latest price
            try {
              seriesRef.current.update(latest);
            } catch (error) {
              // If update fails, might need to add new point
              console.log('Update failed, may need to add new point');
            }
          }
        };

        // Update immediately and then every 5 seconds
        updatePrice();
        streamingIntervalRef.current = setInterval(updatePrice, 5000);
      }

      return () => {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
        }
      };
    }
  }, [mode, etf?.ticker, timePeriod, seriesRef.current]);

  // Handle chart resize - separate effect that runs after chart is created
  useEffect(() => {
    if (!chartRef.current || !chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current && chartContainerRef.current) {
        const width = chartContainerRef.current.clientWidth;
        const height = chartContainerRef.current.clientHeight;
        if (width > 0 && height > 0) {
          // Use resize method if available, otherwise use applyOptions
          if (typeof chartRef.current.resize === 'function') {
            chartRef.current.resize(width, height);
          } else {
            chartRef.current.applyOptions({
              width: width,
              height: height,
            });
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
    if (!chartContainerRef.current) return;

    // Clean up existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
      depositsSeriesRef.current = null;
      customSeriesRef.current = null;
    }
    
    // Create tooltip element
    if (!tooltipRef.current && chartContainerRef.current) {
      const tooltip = document.createElement('div');
      tooltip.className = 'absolute pointer-events-none z-20 bg-primary-500/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-primary-400/50 shadow-lg';
      tooltip.style.display = 'none';
      tooltip.style.fontSize = '12px';
      tooltip.style.color = '#ddd6fe';
      chartContainerRef.current.appendChild(tooltip);
      tooltipRef.current = tooltip;
    }

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
      layout: {
        background: { color: 'rgba(139, 92, 246, 0.1)' },
        textColor: '#ddd6fe',
      },
      grid: {
        vertLines: { color: 'rgba(139, 92, 246, 0.2)' },
        horzLines: { color: 'rgba(139, 92, 246, 0.2)' },
      },
      crosshair: {
        mode: 1, // Normal crosshair mode
        vertLine: {
          color: 'rgba(196, 181, 253, 0.5)',
          width: 1,
          style: 2, // Dashed line
        },
        horzLine: {
          color: 'rgba(196, 181, 253, 0.5)',
          width: 1,
          style: 2, // Dashed line
        },
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
      
      // Add crosshair move handler for tooltip
      chart.subscribeCrosshairMove(param => {
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
      // Stock price data - use real data from API
      chartData = stockData;
      
      if (chartData.length > 0) {
        // Check if we're using intraday data (Unix timestamps) or daily data (date strings)
        const isIntraday = typeof chartData[0].time === 'number';
        
        const lineSeries = chart.addLineSeries({
          color: '#8b5cf6',
          lineWidth: 2,
          priceFormat: {
            type: 'price',
            precision: 2,
            minMove: 0.01,
          },
        });
        
        // Configure time scale based on data type
        if (isIntraday) {
          chart.timeScale().applyOptions({
            timeVisible: true,
            secondsVisible: false,
          });
        }
        
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
        depositsSeriesRef.current = null;
        customSeriesRef.current = null;
      }
      if (tooltipRef.current && tooltipRef.current.parentNode) {
        tooltipRef.current.parentNode.removeChild(tooltipRef.current);
        tooltipRef.current = null;
      }
    };
  }, [mode, data, etf, stockData]);

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
    />
  );
}