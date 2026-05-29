/** Yahoo search queries cycled as the user scrolls (keep queries short — Yahoo works best with 1–2 words) */
export const BROWSE_STOCKS = {
  bigtech: {
    quoteTypes: ['EQUITY'],
    queries: ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'software', 'cloud'],
  },
  'ai-chips': {
    quoteTypes: ['EQUITY'],
    queries: ['semiconductor', 'NVDA', 'AMD', 'AVGO', 'ARM', 'AI', 'INTC', 'QCOM'],
  },
  'ev-auto': {
    quoteTypes: ['EQUITY'],
    queries: ['TSLA', 'F', 'GM', 'RIVN', 'TM', 'auto', 'battery', 'LCID'],
  },
  finance: {
    quoteTypes: ['EQUITY'],
    queries: ['bank', 'JPM', 'BAC', 'V', 'MA', 'GS', 'insurance', 'BRK-B'],
  },
  healthcare: {
    quoteTypes: ['EQUITY'],
    queries: ['biotech', 'LLY', 'UNH', 'JNJ', 'PFE', 'MRK', 'ABBV', 'pharma'],
  },
  consumer: {
    quoteTypes: ['EQUITY'],
    queries: ['WMT', 'COST', 'NKE', 'MCD', 'SBUX', 'KO', 'retail', 'PEP'],
  },
  media: {
    quoteTypes: ['EQUITY'],
    queries: ['NFLX', 'DIS', 'SPOT', 'gaming', 'streaming', 'RBLX', 'WBD', 'CMCSA'],
  },
  energy: {
    quoteTypes: ['EQUITY'],
    queries: ['XOM', 'CVX', 'energy', 'oil', 'CAT', 'BA', 'GE', 'LMT'],
  },
  popular: {
    quoteTypes: ['EQUITY'],
    queries: ['TSLA', 'GME', 'AMC', 'SOFI', 'COIN', 'HOOD', 'PLTR', 'MARA'],
  },
};

export const BROWSE_ETFS = {
  broad: {
    quoteTypes: ['ETF'],
    queries: ['VOO', 'SPY', 'VTI', 'IVV', 'SCHB', 'index ETF', 'S&P 500'],
  },
  tech: {
    quoteTypes: ['ETF'],
    queries: ['QQQ', 'VGT', 'XLK', 'SMH', 'SOXX', 'technology ETF', 'semiconductor ETF'],
  },
  healthcare: {
    quoteTypes: ['ETF'],
    queries: ['XLV', 'VHT', 'biotech ETF', 'IBB', 'XBI', 'healthcare ETF'],
  },
  dividend: {
    quoteTypes: ['ETF'],
    queries: ['SCHD', 'VYM', 'dividend ETF', 'HDV', 'DGRO', 'JEPI', 'DVY'],
  },
  esg: {
    quoteTypes: ['ETF'],
    queries: ['ESGU', 'ESGV', 'clean energy ETF', 'ICLN', 'QCLN', 'TAN', 'PBW'],
  },
  international: {
    quoteTypes: ['ETF'],
    queries: ['VXUS', 'VEA', 'VWO', 'EFA', 'IEMG', 'emerging markets ETF', 'international ETF'],
  },
  smallcap: {
    quoteTypes: ['ETF'],
    queries: ['VB', 'IJR', 'IWM', 'SCHA', 'small cap ETF', 'mid cap ETF', 'VO'],
  },
  bonds: {
    quoteTypes: ['ETF'],
    queries: ['BND', 'AGG', 'TLT', 'bond ETF', 'treasury ETF', 'LQD', 'SHY'],
  },
  sectors: {
    quoteTypes: ['ETF'],
    queries: ['XLE', 'XLF', 'XLY', 'XLP', 'XLI', 'sector ETF', 'XLU'],
  },
  realestate: {
    quoteTypes: ['ETF'],
    queries: ['VNQ', 'SCHH', 'XLRE', 'REIT ETF', 'real estate ETF', 'RWR'],
  },
};

export function getBrowseConfig(assetType, categoryId) {
  const map = assetType === 'stocks' ? BROWSE_STOCKS : BROWSE_ETFS;
  return map[categoryId] || null;
}

export function isUsListedSymbol(symbol) {
  if (!symbol || typeof symbol !== 'string') return false;
  const s = symbol.toUpperCase();
  if (s.startsWith('^') || s.includes('=')) return false;
  if (/\.(TO|DE|NS|SW|BA|MX|L|HK|AX|KL|SG|F|PA|MI|AS|HE|OL|ST|CO|SA|VI|T|TW|NE)$/i.test(s)) {
    return false;
  }
  return /^[A-Z0-9.-]{1,8}$/.test(s);
}
