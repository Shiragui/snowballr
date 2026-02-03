// Stock data service using Yahoo Finance public API (no API key required)
// This is a free public endpoint similar to what Schwab/Robinhood use

// Cache for API responses to avoid rate limiting
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get interval and range for time period
 */
function getIntervalForPeriod(period) {
  const intervals = {
    '1D': { interval: '5m', range: '1d', days: 1 },
    '1W': { interval: '1h', range: '5d', days: 7 },
    '1M': { interval: '1d', range: '1mo', days: 30 },
    '3M': { interval: '1d', range: '3mo', days: 90 },
    '6M': { interval: '1d', range: '6mo', days: 180 },
    '1Y': { interval: '1d', range: '1y', days: 365 },
    '5Y': { interval: '1wk', range: '5y', days: 1825 },
    'All': { interval: '1mo', range: 'max', days: 10000 }
  };
  return intervals[period] || intervals['1Y'];
}

/**
 * Fetch stock data from Yahoo Finance (free, no API key needed)
 * @param {string} symbol - Stock ticker symbol
 * @param {string} period - Time period: '1D', '1W', '1M', '3M', '6M', '1Y', '5Y', 'All'
 * @returns {Promise<Array>} Array of { time, value } objects
 */
export async function fetchStockData(symbol, period = '1Y') {
  const { interval, range } = getIntervalForPeriod(period);
  const cacheKey = `${symbol}-${period}`;
  const cached = cache.get(cacheKey);
  
  // Shorter cache for intraday data
  const cacheTime = period === '1D' ? 60000 : CACHE_DURATION; // 1 min for 1D, 5 min for others
  
  if (cached && Date.now() - cached.timestamp < cacheTime) {
    return cached.data;
  }

  try {
    // Yahoo Finance public API endpoint (no API key required)
    // Using CORS proxy to bypass browser CORS restrictions
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
    
    // Use a public CORS proxy (you can also set up your own)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    
    // If using proxy, extract the actual data
    if (data.contents) {
      data = JSON.parse(data.contents);
    }

    // Check for errors
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      throw new Error('No data found');
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const quote = result.indicators.quote[0];
    const closes = quote.close;
    const opens = quote.open;
    const highs = quote.high;
    const lows = quote.low;

    if (!timestamps || !closes) {
      throw new Error('Invalid data format');
    }

    // Convert to array format for lightweight-charts
    const chartData = timestamps
      .map((timestamp, index) => {
        const close = closes[index];
        if (!close || isNaN(close)) return null;
        
        // Format time based on interval
        // For intraday (5m, 1h), lightweight-charts needs Unix timestamp
        // For daily+, use YYYY-MM-DD string format
        let timeValue;
        
        if (interval === '5m' || interval === '1h') {
          // For intraday, use Unix timestamp (seconds)
          timeValue = timestamp;
        } else {
          // For daily/weekly/monthly, use YYYY-MM-DD string
          const date = new Date(timestamp * 1000);
          timeValue = date.toISOString().split('T')[0];
        }
        
        const baseData = {
          time: timeValue,
          value: close
        };
        
        // Add OHLC for candlestick charts
        if (opens && highs && lows && opens[index] && highs[index] && lows[index]) {
          const open = opens[index];
          const high = highs[index];
          const low = lows[index];
          
          // Only add if values are valid numbers
          if (!isNaN(open) && !isNaN(high) && !isNaN(low)) {
            baseData.open = open;
            baseData.high = high;
            baseData.low = low;
          }
        }
        
        return baseData;
      })
      .filter(item => item !== null)

    // Cache the result
    cache.set(cacheKey, {
      data: chartData,
      timestamp: Date.now()
    });

    return chartData;
  } catch (error) {
    console.error(`Error fetching stock data for ${symbol}:`, error);
    console.error('Falling back to mock data. This usually means CORS is blocked or API rate limit hit.');
    // Return fallback data on error - but log it clearly
    const { days } = getIntervalForPeriod(period);
    const fallbackData = getFallbackData(symbol, days);
    console.warn('Using fallback data - API request failed. Check network tab for CORS errors.');
    return fallbackData;
  }
}

/**
 * Fetch latest quote for real-time updates
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise<Object>} Latest price data
 */
export async function fetchLatestPrice(symbol) {
  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    
    // If using proxy, extract the actual data
    if (data.contents) {
      data = JSON.parse(data.contents);
    }

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return null;
    }

    const result = data.chart.result[0];
    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    if (!timestamps || !closes || closes.length === 0) {
      return null;
    }

    // Get the latest data point
    const lastIndex = closes.length - 1;
    const timestamp = timestamps[lastIndex];
    const price = closes[lastIndex];

    if (!price || isNaN(price)) return null;

    // For intraday updates, use Unix timestamp
    return {
      time: timestamp, // Unix timestamp in seconds
      value: price
    };
  } catch (error) {
    console.error(`Error fetching latest price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Search for stocks by ticker or company name
 * @param {string} query - Search query (ticker or company name)
 * @returns {Promise<Array>} Array of stock objects with ticker, name, exchange
 */
export async function searchStocks(query) {
  if (!query || query.trim() === '') {
    return [];
  }

  const cacheKey = `search-${query}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache
    return cached.data;
  }

  try {
    // Yahoo Finance search endpoint
    const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(searchUrl)}`;
    
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    
    // If using proxy, extract the actual data
    if (data.contents) {
      data = JSON.parse(data.contents);
    }

    if (!data.quotes || !Array.isArray(data.quotes)) {
      return [];
    }

    // Format results to match ETF structure
    const results = data.quotes
      .filter(quote => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF' || quote.quoteType === 'INDEX')
      .map(quote => ({
        ticker: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        exchange: quote.exchange || '',
        // Add default values for ETF-specific fields (will be fetched when selected)
        expenseRatio: 'N/A',
        avgReturn: 'N/A',
        volatility: 'Medium',
        dividendYield: 'N/A'
      }));

    cache.set(cacheKey, {
      data: results,
      timestamp: Date.now()
    });

    return results;
  } catch (error) {
    console.error(`Error searching stocks for "${query}":`, error);
    return [];
  }
}

/**
 * Get real-time quote data (current price)
 * @param {string} symbol - Stock ticker symbol
 * @returns {Promise<Object>} Quote data with price, change, etc.
 */
export async function fetchStockQuote(symbol) {
  const cacheKey = `quote-${symbol}`;
  const cached = cache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < 60000) { // 1 minute cache for quotes
    return cached.data;
  }

  try {
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
    const response = await fetch(proxyUrl);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    let data = await response.json();
    
    // If using proxy, extract the actual data
    if (data.contents) {
      data = JSON.parse(data.contents);
    }

    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return getFallbackQuote(symbol);
    }

    const result = data.chart.result[0];
    const meta = result.meta;
    const quote = result.indicators.quote[0];
    
    // Get current price - prioritize regularMarketPrice
    let price = meta.regularMarketPrice;
    if (!price || price === 0 || isNaN(price)) {
      // Fallback to last close price
      if (quote.close && quote.close.length > 0) {
        const validCloses = quote.close.filter(c => c !== null && !isNaN(c) && c > 0);
        if (validCloses.length > 0) {
          price = validCloses[validCloses.length - 1];
        }
      }
    }
    if (!price || price === 0 || isNaN(price)) {
      price = meta.previousClose || 0;
    }
    
    // Get previous close - this is yesterday's closing price
    let previousClose = meta.previousClose;
    if (!previousClose || previousClose === 0 || isNaN(previousClose)) {
      // Try to get from quote data (second to last close)
      if (quote.close && quote.close.length > 1) {
        const validCloses = quote.close.filter(c => c !== null && !isNaN(c) && c > 0);
        if (validCloses.length > 1) {
          previousClose = validCloses[validCloses.length - 2];
        } else if (validCloses.length === 1) {
          previousClose = validCloses[0];
        }
      }
    }
    if (!previousClose || previousClose === 0 || isNaN(previousClose)) {
      previousClose = price;
    }
    
    // Calculate change from previous close (today's change)
    const change = price && previousClose && !isNaN(price) && !isNaN(previousClose) ? (price - previousClose) : 0;
    const changePercent = previousClose && previousClose !== 0 && !isNaN(change) ? (change / previousClose * 100) : 0;
    
    const quoteData = {
      symbol: meta.symbol || symbol,
      price: price,
      change: change,
      changePercent: changePercent,
      volume: meta.regularMarketVolume || 0,
      high: meta.regularMarketDayHigh || price,
      low: meta.regularMarketDayLow || price,
      open: meta.regularMarketOpen || price,
      previousClose: previousClose
    };

    cache.set(cacheKey, {
      data: quoteData,
      timestamp: Date.now()
    });

    return quoteData;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return getFallbackQuote(symbol);
  }
}

/**
 * Fallback data generator (used when API fails or rate limited)
 */
function getFallbackData(symbol, days) {
  const basePrices = {
    'QQQ': 380,
    'VOO': 450,
    'SPY': 420,
    'AAPL': 175,
    'MSFT': 380,
    'GOOGL': 140
  };

  const basePrice = basePrices[symbol] || 100;
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.48) * 2;
    const price = Math.max(basePrice * 0.5, basePrice + change * (i / days));
    
    data.push({
      time: date.toISOString().split('T')[0],
      value: Math.round(price * 100) / 100
    });
  }

  return data;
}

function getFallbackQuote(symbol) {
  const basePrices = {
    'QQQ': 380,
    'VOO': 450,
    'SPY': 420
  };

  const price = basePrices[symbol] || 100;
  return {
    symbol,
    price: price + (Math.random() - 0.5) * 5,
    change: (Math.random() - 0.5) * 2,
    changePercent: ((Math.random() - 0.5) * 2).toFixed(2),
    volume: 1000000,
    high: price * 1.02,
    low: price * 0.98,
    open: price,
    previousClose: price
  };
}
