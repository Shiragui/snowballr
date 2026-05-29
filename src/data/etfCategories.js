export const etfCategories = [
  {
    id: 'broad',
    label: 'Broad Market',
    description: 'Core US index funds',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'VOO', name: 'Vanguard S&P 500 ETF', expenseRatio: 0.03, avgReturn: 10, volatility: 'Medium', dividendYield: 1.5 },
      { ticker: 'SPY', name: 'SPDR S&P 500 ETF Trust', expenseRatio: 0.09, avgReturn: 9.8, volatility: 'Medium', dividendYield: 1.4 },
      { ticker: 'IVV', name: 'iShares Core S&P 500 ETF', expenseRatio: 0.03, avgReturn: 10, volatility: 'Medium', dividendYield: 1.5 },
      { ticker: 'VTI', name: 'Vanguard Total Stock Market ETF', expenseRatio: 0.03, avgReturn: 9.5, volatility: 'Medium', dividendYield: 1.4 },
      { ticker: 'SCHB', name: 'Schwab US Broad Market ETF', expenseRatio: 0.03, avgReturn: 9.5, volatility: 'Medium', dividendYield: 1.3 },
      { ticker: 'SCHX', name: 'Schwab US Large-Cap ETF', expenseRatio: 0.03, avgReturn: 10, volatility: 'Medium', dividendYield: 1.4 },
      { ticker: 'ITOT', name: 'iShares Core S&P Total US Stock Market ETF', expenseRatio: 0.03, avgReturn: 9.5, volatility: 'Medium', dividendYield: 1.3 },
    ],
  },
  {
    id: 'tech',
    label: 'Tech & Growth',
    description: 'Innovation and high-growth sectors',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'QQQ', name: 'Invesco QQQ Trust', expenseRatio: 0.2, avgReturn: 12, volatility: 'High', dividendYield: 0.7 },
      { ticker: 'VGT', name: 'Vanguard Information Technology ETF', expenseRatio: 0.1, avgReturn: 13, volatility: 'High', dividendYield: 0.6 },
      { ticker: 'XLK', name: 'Technology Select Sector SPDR', expenseRatio: 0.09, avgReturn: 12, volatility: 'High', dividendYield: 0.7 },
      { ticker: 'SCHG', name: 'Schwab US Large-Cap Growth ETF', expenseRatio: 0.04, avgReturn: 12, volatility: 'High', dividendYield: 0.5 },
      { ticker: 'SMH', name: 'VanEck Semiconductor ETF', expenseRatio: 0.35, avgReturn: 15, volatility: 'High', dividendYield: 0.5 },
      { ticker: 'SOXX', name: 'iShares Semiconductor ETF', expenseRatio: 0.35, avgReturn: 14, volatility: 'High', dividendYield: 0.6 },
      { ticker: 'ARKK', name: 'ARK Innovation ETF', expenseRatio: 0.75, avgReturn: 5, volatility: 'High', dividendYield: 0 },
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Pharma, biotech, and medical devices',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'XLV', name: 'Health Care Select Sector SPDR', expenseRatio: 0.09, avgReturn: 8, volatility: 'Medium', dividendYield: 1.4 },
      { ticker: 'VHT', name: 'Vanguard Health Care ETF', expenseRatio: 0.1, avgReturn: 8, volatility: 'Medium', dividendYield: 1.5 },
      { ticker: 'IHI', name: 'iShares US Medical Devices ETF', expenseRatio: 0.4, avgReturn: 9, volatility: 'Medium', dividendYield: 0.5 },
      { ticker: 'XBI', name: 'SPDR S&P Biotech ETF', expenseRatio: 0.35, avgReturn: 6, volatility: 'High', dividendYield: 0 },
      { ticker: 'IBB', name: 'iShares Biotechnology ETF', expenseRatio: 0.33, avgReturn: 6, volatility: 'High', dividendYield: 0 },
      { ticker: 'FHLC', name: 'Fidelity MSCI Health Care Index ETF', expenseRatio: 0.08, avgReturn: 8, volatility: 'Medium', dividendYield: 1.3 },
    ],
  },
  {
    id: 'dividend',
    label: 'Dividend & Income',
    description: 'Yield-focused and dividend growers',
    primaryMetric: 'dividend',
    etfs: [
      { ticker: 'SCHD', name: 'Schwab US Dividend Equity ETF', expenseRatio: 0.06, avgReturn: 8, volatility: 'Low', dividendYield: 3.5 },
      { ticker: 'VYM', name: 'Vanguard High Dividend Yield ETF', expenseRatio: 0.06, avgReturn: 7.5, volatility: 'Low', dividendYield: 3.0 },
      { ticker: 'DGRO', name: 'iShares Core Dividend Growth ETF', expenseRatio: 0.08, avgReturn: 8, volatility: 'Low', dividendYield: 2.4 },
      { ticker: 'HDV', name: 'iShares Core High Dividend ETF', expenseRatio: 0.08, avgReturn: 7, volatility: 'Low', dividendYield: 3.8 },
      { ticker: 'JEPI', name: 'JPMorgan Equity Premium Income ETF', expenseRatio: 0.35, avgReturn: 6, volatility: 'Low', dividendYield: 8.0 },
      { ticker: 'JEPQ', name: 'JPMorgan Nasdaq Equity Premium Income ETF', expenseRatio: 0.35, avgReturn: 8, volatility: 'Medium', dividendYield: 12.0 },
      { ticker: 'DVY', name: 'iShares Select Dividend ETF', expenseRatio: 0.38, avgReturn: 7, volatility: 'Low', dividendYield: 3.6 },
    ],
  },
  {
    id: 'esg',
    label: 'ESG & Clean Energy',
    description: 'Sustainable and environmental themes',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'ESGU', name: 'iShares ESG Aware MSCI USA ETF', expenseRatio: 0.15, avgReturn: 9, volatility: 'Medium', dividendYield: 1.2 },
      { ticker: 'ESGV', name: 'Vanguard ESG US Stock ETF', expenseRatio: 0.09, avgReturn: 9, volatility: 'Medium', dividendYield: 1.3 },
      { ticker: 'SUSA', name: 'iShares MSCI USA ESG Select ETF', expenseRatio: 0.25, avgReturn: 9, volatility: 'Medium', dividendYield: 1.1 },
      { ticker: 'ICLN', name: 'iShares Global Clean Energy ETF', expenseRatio: 0.4, avgReturn: 4, volatility: 'High', dividendYield: 1.0 },
      { ticker: 'QCLN', name: 'First Trust NASDAQ Clean Edge Green Energy ETF', expenseRatio: 0.58, avgReturn: 5, volatility: 'High', dividendYield: 0.5 },
      { ticker: 'TAN', name: 'Invesco Solar ETF', expenseRatio: 0.67, avgReturn: 3, volatility: 'High', dividendYield: 0 },
      { ticker: 'PBW', name: 'Invesco WilderHill Clean Energy ETF', expenseRatio: 0.61, avgReturn: 4, volatility: 'High', dividendYield: 0.3 },
    ],
  },
  {
    id: 'international',
    label: 'International',
    description: 'Developed and emerging markets',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'VXUS', name: 'Vanguard Total International Stock ETF', expenseRatio: 0.07, avgReturn: 6, volatility: 'Medium', dividendYield: 2.8 },
      { ticker: 'VEA', name: 'Vanguard FTSE Developed Markets ETF', expenseRatio: 0.05, avgReturn: 6, volatility: 'Medium', dividendYield: 2.9 },
      { ticker: 'VWO', name: 'Vanguard FTSE Emerging Markets ETF', expenseRatio: 0.08, avgReturn: 5, volatility: 'High', dividendYield: 2.5 },
      { ticker: 'SCHF', name: 'Schwab International Equity ETF', expenseRatio: 0.03, avgReturn: 6, volatility: 'Medium', dividendYield: 2.7 },
      { ticker: 'SCHE', name: 'Schwab Emerging Markets Equity ETF', expenseRatio: 0.11, avgReturn: 5, volatility: 'High', dividendYield: 2.4 },
      { ticker: 'EFA', name: 'iShares MSCI EAFE ETF', expenseRatio: 0.32, avgReturn: 5.5, volatility: 'Medium', dividendYield: 2.6 },
      { ticker: 'IEMG', name: 'iShares Core MSCI Emerging Markets ETF', expenseRatio: 0.09, avgReturn: 5, volatility: 'High', dividendYield: 2.4 },
    ],
  },
  {
    id: 'smallcap',
    label: 'Small & Mid Cap',
    description: 'Beyond large-cap US stocks',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'VB', name: 'Vanguard Small-Cap ETF', expenseRatio: 0.05, avgReturn: 8, volatility: 'High', dividendYield: 1.5 },
      { ticker: 'IJR', name: 'iShares Core S&P Small-Cap ETF', expenseRatio: 0.06, avgReturn: 8, volatility: 'High', dividendYield: 1.4 },
      { ticker: 'IWM', name: 'iShares Russell 2000 ETF', expenseRatio: 0.19, avgReturn: 7, volatility: 'High', dividendYield: 1.2 },
      { ticker: 'SCHA', name: 'Schwab US Small-Cap ETF', expenseRatio: 0.04, avgReturn: 8, volatility: 'High', dividendYield: 1.3 },
      { ticker: 'VO', name: 'Vanguard Mid-Cap ETF', expenseRatio: 0.04, avgReturn: 9, volatility: 'Medium', dividendYield: 1.3 },
      { ticker: 'IJH', name: 'iShares Core S&P Mid-Cap ETF', expenseRatio: 0.05, avgReturn: 9, volatility: 'Medium', dividendYield: 1.2 },
    ],
  },
  {
    id: 'bonds',
    label: 'Bonds & Fixed Income',
    description: 'Stability and income from fixed income',
    primaryMetric: 'dividend',
    etfs: [
      { ticker: 'BND', name: 'Vanguard Total Bond Market ETF', expenseRatio: 0.03, avgReturn: 3, volatility: 'Low', dividendYield: 4.0 },
      { ticker: 'AGG', name: 'iShares Core US Aggregate Bond ETF', expenseRatio: 0.03, avgReturn: 3, volatility: 'Low', dividendYield: 3.8 },
      { ticker: 'SCHZ', name: 'Schwab US Aggregate Bond ETF', expenseRatio: 0.04, avgReturn: 3, volatility: 'Low', dividendYield: 3.9 },
      { ticker: 'TLT', name: 'iShares 20+ Year Treasury Bond ETF', expenseRatio: 0.15, avgReturn: 2, volatility: 'Medium', dividendYield: 3.5 },
      { ticker: 'SHY', name: 'iShares 1-3 Year Treasury Bond ETF', expenseRatio: 0.15, avgReturn: 2.5, volatility: 'Low', dividendYield: 4.2 },
      { ticker: 'LQD', name: 'iShares Investment Grade Corporate Bond ETF', expenseRatio: 0.14, avgReturn: 4, volatility: 'Low', dividendYield: 4.5 },
    ],
  },
  {
    id: 'sectors',
    label: 'Other Sectors',
    description: 'Energy, financials, consumer, and more',
    primaryMetric: 'growth',
    etfs: [
      { ticker: 'XLE', name: 'Energy Select Sector SPDR', expenseRatio: 0.09, avgReturn: 8, volatility: 'High', dividendYield: 3.2 },
      { ticker: 'XLF', name: 'Financial Select Sector SPDR', expenseRatio: 0.09, avgReturn: 9, volatility: 'Medium', dividendYield: 1.6 },
      { ticker: 'XLY', name: 'Consumer Discretionary Select Sector SPDR', expenseRatio: 0.09, avgReturn: 10, volatility: 'Medium', dividendYield: 0.9 },
      { ticker: 'XLP', name: 'Consumer Staples Select Sector SPDR', expenseRatio: 0.09, avgReturn: 6, volatility: 'Low', dividendYield: 2.8 },
      { ticker: 'XLI', name: 'Industrial Select Sector SPDR', expenseRatio: 0.09, avgReturn: 9, volatility: 'Medium', dividendYield: 1.3 },
      { ticker: 'XLU', name: 'Utilities Select Sector SPDR', expenseRatio: 0.09, avgReturn: 5, volatility: 'Low', dividendYield: 3.0 },
    ],
  },
  {
    id: 'realestate',
    label: 'Real Estate',
    description: 'REITs and property exposure',
    primaryMetric: 'dividend',
    etfs: [
      { ticker: 'VNQ', name: 'Vanguard Real Estate ETF', expenseRatio: 0.12, avgReturn: 6, volatility: 'Medium', dividendYield: 4.0 },
      { ticker: 'SCHH', name: 'Schwab US REIT ETF', expenseRatio: 0.07, avgReturn: 6, volatility: 'Medium', dividendYield: 3.8 },
      { ticker: 'XLRE', name: 'Real Estate Select Sector SPDR', expenseRatio: 0.09, avgReturn: 5.5, volatility: 'Medium', dividendYield: 3.9 },
      { ticker: 'RWR', name: 'SPDR Dow Jones REIT ETF', expenseRatio: 0.25, avgReturn: 5, volatility: 'Medium', dividendYield: 4.2 },
    ],
  },
];

/** Flat list of all catalog ETFs (deduped by ticker) */
export const allCatalogEtfs = Array.from(
  new Map(etfCategories.flatMap((c) => c.etfs.map((e) => [e.ticker, e]))).values()
);

/** Categories that emphasize dividend yield in the browse panel */
export function categoryShowsDividend(category) {
  return category?.primaryMetric === 'dividend';
}
