import { Router } from 'express';

const router = Router();

const YAHOO_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (compatible; SnowballR/1.0)',
};

const PERIODS = {
  '1D': { interval: '5m', range: '1d', days: 1 },
  '1W': { interval: '1h', range: '5d', days: 7 },
  '1M': { interval: '1d', range: '1mo', days: 30 },
  '3M': { interval: '1d', range: '3mo', days: 90 },
  '6M': { interval: '1d', range: '6mo', days: 180 },
  '1Y': { interval: '1d', range: '1y', days: 365 },
  '5Y': { interval: '1wk', range: '5y', days: 1825 },
  All: { interval: '1mo', range: 'max', days: 10000 },
};

async function fetchYahooChart(symbol, interval, range, { includePrePost = false } = {}) {
  const params = new URLSearchParams({ interval, range });
  if (includePrePost) params.set('includePrePost', 'true');
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?${params}`;
  const response = await fetch(url, { headers: YAHOO_HEADERS });
  if (!response.ok) {
    throw new Error(`Yahoo chart failed (${response.status})`);
  }
  const data = await response.json();
  if (!data.chart?.result?.[0]) {
    throw new Error('No chart data');
  }
  return data.chart.result[0];
}

function latestFromSeries(result, interval) {
  const series = parseChartSeries(result, interval);
  const last = series.at(-1);
  if (!last) return null;

  const meta = result.meta;
  const regularTime = meta.regularMarketTime || 0;
  const marketState =
    typeof last.time === 'number' && last.time > regularTime ? 'POST' : 'REGULAR';

  return { ...last, marketState };
}

function parseChartSeries(result, interval) {
  const timestamps = result.timestamp;
  const quote = result.indicators.quote[0];
  const closes = quote.close;
  const opens = quote.open;
  const highs = quote.high;
  const lows = quote.low;

  if (!timestamps || !closes) return [];

  const isIntraday = interval === '1m' || interval === '5m' || interval === '1h';

  return timestamps
    .map((timestamp, index) => {
      const close = closes[index];
      if (!close || isNaN(close)) return null;

      const timeValue = isIntraday
        ? timestamp
        : new Date(timestamp * 1000).toISOString().split('T')[0];

      const point = { time: timeValue, value: close };

      if (opens?.[index] && highs?.[index] && lows?.[index]) {
        const open = opens[index];
        const high = highs[index];
        const low = lows[index];
        if (!isNaN(open) && !isNaN(high) && !isNaN(low)) {
          point.open = open;
          point.high = high;
          point.low = low;
        }
      }
      return point;
    })
    .filter(Boolean);
}

function parseQuote(result, symbol) {
  const meta = result.meta;
  const quote = result.indicators.quote[0];
  const timestamps = result.timestamp || [];
  const closes = quote.close || [];

  // Use the most recent bar (includes pre/post-market when enabled)
  let price = null;
  let marketTime = meta.regularMarketTime || null;
  for (let i = closes.length - 1; i >= 0; i--) {
    const close = closes[i];
    if (close != null && !isNaN(close) && close > 0) {
      price = close;
      marketTime = timestamps[i] ?? marketTime;
      break;
    }
  }

  if (!price || isNaN(price)) {
    price = meta.regularMarketPrice ?? meta.previousClose ?? 0;
    marketTime = meta.regularMarketTime ?? marketTime;
  }

  let previousClose = meta.previousClose ?? meta.chartPreviousClose;
  if (!previousClose || isNaN(previousClose)) {
    const validCloses = closes.filter((c) => c != null && !isNaN(c) && c > 0);
    previousClose = validCloses.at(-2) ?? validCloses.at(-1) ?? price;
  }

  const change = price - previousClose;
  const changePercent = previousClose ? (change / previousClose) * 100 : 0;
  const regularTime = meta.regularMarketTime || 0;
  const marketState =
    marketTime && marketTime > regularTime ? 'POST' : 'REGULAR';

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
    marketTime,
    marketState,
  };
}

function formatSearchQuote(quote) {
  return {
    ticker: quote.symbol,
    name: quote.longname || quote.shortname || quote.symbol,
    exchange: quote.exchange || quote.exchDisp || '',
    quoteType: quote.quoteType,
    expenseRatio: 'N/A',
    avgReturn: 'N/A',
    volatility: 'Medium',
    dividendYield: 'N/A',
  };
}

router.get('/search', async (req, res) => {
  const query = String(req.query.q || '').trim();
  if (!query) return res.json({ results: [] });

  try {
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=12&newsCount=0`;
    const response = await fetch(url, { headers: YAHOO_HEADERS });
    if (!response.ok) throw new Error(`Yahoo search failed (${response.status})`);

    const data = await response.json();
    const results = (data.quotes || [])
      .filter((q) => ['EQUITY', 'ETF', 'INDEX', 'MUTUALFUND'].includes(q.quoteType))
      .map(formatSearchQuote);

    res.json({ results });
  } catch (err) {
    console.error('Market search error:', err.message);
    res.status(502).json({ error: 'Search unavailable', results: [] });
  }
});

router.get('/chart/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').trim().toUpperCase();
  const period = PERIODS[req.query.period] ? req.query.period : '1Y';
  const { interval, range } = PERIODS[period];

  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  try {
    const includePrePost = period === '1D';
    const result = await fetchYahooChart(symbol, interval, range, { includePrePost });
    res.json({ data: parseChartSeries(result, interval) });
  } catch (err) {
    console.error(`Chart error ${symbol}:`, err.message);
    res.status(502).json({ error: err.message, data: [] });
  }
});

router.get('/quote/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const result = await fetchYahooChart(symbol, '1m', '1d', { includePrePost: true });
    res.json({ quote: parseQuote(result, symbol) });
  } catch (err) {
    console.error(`Quote error ${symbol}:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

router.get('/latest/:symbol', async (req, res) => {
  const symbol = String(req.params.symbol || '').trim().toUpperCase();
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });

  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');

  try {
    const result = await fetchYahooChart(symbol, '1m', '1d', { includePrePost: true });
    const latest = latestFromSeries(result, '1m');
    if (!latest) throw new Error('No latest price');
    res.json({ latest });
  } catch (err) {
    console.error(`Latest price error ${symbol}:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
