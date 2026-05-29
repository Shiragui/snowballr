// Stock data service — prefers local API proxy (fast), falls back to CORS proxy

import { getBrowseConfig, isUsListedSymbol } from '../data/browseQueries.js';

const cache = new Map();
const inflight = new Map();
const CACHE_DURATION = 5 * 60 * 1000;
const QUOTE_CACHE_MS = 15 * 1000;
const CHART_CACHE_1D_MS = 10 * 1000;

function getIntervalForPeriod(period) {
  const intervals = {
    '1D': { interval: '5m', range: '1d', days: 1 },
    '1W': { interval: '1h', range: '5d', days: 7 },
    '1M': { interval: '1d', range: '1mo', days: 30 },
    '3M': { interval: '1d', range: '3mo', days: 90 },
    '6M': { interval: '1d', range: '6mo', days: 180 },
    '1Y': { interval: '1d', range: '1y', days: 365 },
    '5Y': { interval: '1wk', range: '5y', days: 1825 },
    'All': { interval: '1mo', range: 'max', days: 10000 },
  };
  return intervals[period] || intervals['1Y'];
}

async function fetchWithDedup(key, ttl, fetcher) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < ttl) {
    return cached.data;
  }

  if (inflight.has(key)) {
    return inflight.get(key);
  }

  const promise = fetcher()
    .then((data) => {
      cache.set(key, { data, timestamp: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}

async function fetchViaProxy(yahooUrl) {
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(yahooUrl)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  let data = await response.json();
  if (data.contents) data = JSON.parse(data.contents);
  return data;
}

function parseChartFromYahoo(data, interval) {
  if (!data.chart?.result?.[0]) throw new Error('No data found');
  const result = data.chart.result[0];
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  const closes = quote.close;
  const opens = quote.open;
  const highs = quote.high;
  const lows = quote.low;
  if (!timestamps || !closes) throw new Error('Invalid data format');

  return timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (!close || isNaN(close)) return null;
      const timeValue =
        interval === '5m' || interval === '1h'
          ? timestamp
          : new Date(timestamp * 1000).toISOString().split('T')[0];
      const baseData = { time: timeValue, value: close };
      if (opens?.[index] && highs?.[index] && lows?.[index]) {
        const open = opens[index];
        const high = highs[index];
        const low = lows[index];
        if (!isNaN(open) && !isNaN(high) && !isNaN(low)) {
          baseData.open = open;
          baseData.high = high;
          baseData.low = low;
        }
      }
      return baseData;
    })
    .filter(Boolean);
}

export async function fetchStockData(symbol, period = '1Y') {
  const { interval, range, days } = getIntervalForPeriod(period);
  const cacheKey = `chart-${symbol}-${period}`;
  const cacheTime = period === '1D' ? CHART_CACHE_1D_MS : CACHE_DURATION;

  return fetchWithDedup(cacheKey, cacheTime, async () => {
    try {
      const res = await fetch(
        `/api/market/chart/${encodeURIComponent(symbol)}?period=${encodeURIComponent(period)}`
      );
      if (res.ok) {
        const { data } = await res.json();
        if (data?.length) return data;
      }
    } catch {
      // fall through
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;
      const data = await fetchViaProxy(yahooUrl);
      return parseChartFromYahoo(data, interval);
    } catch (error) {
      console.error(`Error fetching stock data for ${symbol}:`, error);
      return getFallbackData(symbol, days);
    }
  });
}

export async function fetchLatestPrice(symbol) {
  const cacheKey = `latest-${symbol}`;

  return fetchWithDedup(cacheKey, 10 * 1000, async () => {
    try {
      const res = await fetch(`/api/market/latest/${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const { latest } = await res.json();
        if (latest) return latest;
      }
    } catch {
      // fall through
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
      const data = await fetchViaProxy(yahooUrl);
      const series = parseChartFromYahoo(data, '1m');
      return series.at(-1) ?? null;
    } catch (error) {
      console.error(`Error fetching latest price for ${symbol}:`, error);
      return null;
    }
  });
}

export function tickerFromQuery(query) {
  const ticker = query.trim().toUpperCase();
  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(ticker)) return null;
  return {
    ticker,
    name: ticker,
    expenseRatio: 'N/A',
    avgReturn: 10,
    volatility: 'Medium',
    dividendYield: 'N/A',
  };
}

export async function searchStocks(query) {
  if (!query?.trim()) return [];

  const cacheKey = `search-${query}`;

  return fetchWithDedup(cacheKey, 60 * 1000, async () => {
    try {
      const res = await fetch(`/api/market/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const { results } = await res.json();
        if (results?.length) return results;
      }
    } catch {
      // fall through
    }

    try {
      const searchUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
      const data = await fetchViaProxy(searchUrl);
      if (!data.quotes?.length) throw new Error('No quotes');
      return data.quotes
        .filter((q) => ['EQUITY', 'ETF', 'INDEX'].includes(q.quoteType))
        .map((q) => ({
          ticker: q.symbol,
          name: q.longname || q.shortname || q.symbol,
          exchange: q.exchange || '',
          expenseRatio: 'N/A',
          avgReturn: 'N/A',
          volatility: 'Medium',
          dividendYield: 'N/A',
        }));
    } catch (error) {
      console.error(`Error searching stocks for "${query}":`, error);
      const fallback = tickerFromQuery(query);
      return fallback ? [fallback] : [];
    }
  });
}

export async function fetchStockQuote(symbol) {
  const cacheKey = `quote-${symbol}`;

  return fetchWithDedup(cacheKey, QUOTE_CACHE_MS, async () => {
    try {
      const res = await fetch(`/api/market/quote/${encodeURIComponent(symbol)}`);
      if (res.ok) {
        const { quote } = await res.json();
        if (quote) return quote;
      }
    } catch {
      // fall through
    }

    try {
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
      const data = await fetchViaProxy(yahooUrl);
      const result = data.chart.result[0];
      const meta = result.meta;
      const quote = result.indicators.quote[0];

      let price = meta.regularMarketPrice;
      if (!price || isNaN(price)) {
        const validCloses = (quote.close || []).filter((c) => c != null && !isNaN(c) && c > 0);
        price = validCloses.at(-1) ?? meta.previousClose ?? 0;
      }

      let previousClose = meta.previousClose;
      if (!previousClose || isNaN(previousClose)) {
        const validCloses = (quote.close || []).filter((c) => c != null && !isNaN(c) && c > 0);
        previousClose = validCloses.at(-2) ?? validCloses.at(-1) ?? price;
      }

      const change = price - previousClose;
      const changePercent = previousClose ? (change / previousClose) * 100 : 0;

      return {
        symbol: meta.symbol || symbol,
        price,
        change,
        changePercent,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || price,
        low: meta.regularMarketDayLow || price,
        open: meta.regularMarketOpen || price,
        previousClose,
      };
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error);
      return getFallbackQuote(symbol);
    }
  });
}

function getFallbackData(symbol, days) {
  const basePrices = { QQQ: 380, VOO: 450, SPY: 420, AAPL: 175, MSFT: 380, GOOGL: 140 };
  const basePrice = basePrices[symbol] || 100;
  const data = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const change = (Math.random() - 0.48) * 2;
    const price = Math.max(basePrice * 0.5, basePrice + change * (i / days));
    data.push({ time: date.toISOString().split('T')[0], value: Math.round(price * 100) / 100 });
  }
  return data;
}

function getFallbackQuote(symbol) {
  const basePrices = { QQQ: 380, VOO: 450, SPY: 420 };
  const price = basePrices[symbol] || 100;
  return {
    symbol,
    price: price + (Math.random() - 0.5) * 5,
    change: (Math.random() - 0.5) * 2,
    changePercent: (Math.random() - 0.5) * 2,
    volume: 1000000,
    high: price * 1.02,
    low: price * 0.98,
    open: price,
    previousClose: price,
  };
}

function todayDateStr() {
  return new Date().toISOString().split('T')[0];
}

/** Fresh quote — never reads from the 15s quote cache */
export async function fetchLiveQuote(symbol) {
  try {
    const res = await fetch(
      `/api/market/quote/${encodeURIComponent(symbol)}?_=${Date.now()}`,
      { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
    );
    if (res.ok) {
      const { quote } = await res.json();
      if (quote?.price != null && !isNaN(quote.price)) return quote;
    }
  } catch {
    // fall through
  }
  return null;
}

/** Latest { time, value } tick for live chart updates */
export async function fetchLiveTick(symbol, period = '1Y') {
  if (period === '1D' || period === '1W') {
    try {
      const res = await fetch(
        `/api/market/latest/${encodeURIComponent(symbol)}?_=${Date.now()}`,
        { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } }
      );
      if (res.ok) {
        const { latest } = await res.json();
        if (latest?.value != null && !isNaN(latest.value)) return latest;
      }
    } catch {
      // fall through
    }
  }

  const quote = await fetchLiveQuote(symbol);
  if (quote?.price == null || isNaN(quote.price)) return null;

  const time =
    (period === '1D' || period === '1W') && quote.marketTime
      ? quote.marketTime
      : todayDateStr();

  return { time, value: quote.price, marketState: quote.marketState };
}

export async function fetchLivePrice(symbol, period = '1Y') {
  const tick = await fetchLiveTick(symbol, period);
  return tick?.value ?? null;
}

/** Clear cached quote/chart for a symbol (call after manual refresh) */
export function invalidateSymbolCache(symbol) {
  for (const key of cache.keys()) {
    if (key.includes(symbol)) cache.delete(key);
  }
}

/** 1-year price return % for multiple symbols */
export async function fetchYearReturns(symbols) {
  const unique = [...new Set(symbols.map((s) => s.trim().toUpperCase()).filter(Boolean))];
  if (!unique.length) return {};

  const cacheKey = `returns-${unique.sort().join(',')}`;

  return fetchWithDedup(cacheKey, 30 * 60 * 1000, async () => {
    const returns = {};

    try {
      const res = await fetch(
        `/api/market/returns?symbols=${encodeURIComponent(unique.join(','))}`
      );
      if (res.ok) {
        const data = await res.json();
        Object.assign(returns, data.returns || {});
      }
    } catch (err) {
      console.error('Error fetching year returns:', err);
    }

    // Client-side fallback when API is down or a symbol is missing
    await Promise.all(
      unique.map(async (symbol) => {
        if (returns[symbol] != null && !isNaN(returns[symbol])) return;
        try {
          const chart = await fetchStockData(symbol, '1Y');
          if (chart.length >= 2) {
            const first = chart[0].value;
            const last = chart[chart.length - 1].value;
            if (first > 0 && last != null) {
              returns[symbol] = ((last - first) / first) * 100;
            }
          }
        } catch {
          returns[symbol] = returns[symbol] ?? null;
        }
      })
    );

    return returns;
  });
}

export function formatReturnPct(value) {
  if (value == null || isNaN(value)) return '—';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDividendYield(value) {
  if (value == null || isNaN(value) || value === 0) return '—';
  return `${Number(value).toFixed(1)}%`;
}

export function formatExpenseRatio(value) {
  if (value == null || value === 'N/A' || isNaN(value)) return null;
  return `${Number(value).toFixed(2)}%/yr fee`;
}

/** Load next page of browse results for infinite scroll */
export async function fetchBrowsePage(assetType, categoryId, page, excludeTickers = []) {
  const excludeSet = new Set(excludeTickers.map((t) => t.toUpperCase()));
  const config = getBrowseConfig(assetType, categoryId);

  if (!config) {
    return { items: [], hasMore: false, page };
  }

  if (page >= config.queries.length) {
    return { items: [], hasMore: false, page };
  }

  // Try backend browse route first
  try {
    const exclude = [...excludeSet].join(',');
    const res = await fetch(
      `/api/market/browse/${encodeURIComponent(assetType)}/${encodeURIComponent(categoryId)}?page=${page}&limit=8&exclude=${encodeURIComponent(exclude)}`
    );
    if (res.ok) {
      const data = await res.json();
      if (data.items?.length > 0) return data;
      if (data.hasMore && page < config.queries.length - 1) return data;
    }
  } catch (err) {
    console.error('Browse page error:', err);
  }

  // Client fallback — search via existing search API
  const query = config.queries[page];
  let results = [];

  try {
    const res = await fetch(`/api/market/search?q=${encodeURIComponent(query)}`);
    if (res.ok) {
      const data = await res.json();
      results = data.results || [];
    }
  } catch {
    // fall through
  }

  if (!results.length) {
    results = await searchStocks(query);
  }

  const wantEtf = assetType === 'etfs';
  const items = [];
  for (const r of results) {
    const ticker = String(r.ticker || '').toUpperCase();
    if (!ticker || excludeSet.has(ticker) || !isUsListedSymbol(ticker)) continue;

    const type = r.quoteType || '';
    if (wantEtf) {
      if (type && type !== 'ETF' && type !== 'MUTUALFUND') continue;
    } else if (type === 'ETF') {
      continue;
    }

    items.push(r);
    if (items.length >= 8) break;
  }

  return {
    items,
    hasMore: page < config.queries.length - 1,
    page,
    query,
  };
}
