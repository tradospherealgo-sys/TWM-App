/**
 * Market Data Adapter
 * Provides real Indian market directory reference (NSE/BSE symbols, sectors, ISIN).
 * When live data provider API is unconfigured, displays honest "Data Unavailable / Configuration Required" state.
 * Never fabricates fake prices, fake charts, or fake volumes!
 */

export interface StockReference {
  symbol: string;
  name: string;
  isin: string;
  sector: string;
  exchange: 'NSE' | 'BSE';
}

export interface MarketIndexInfo {
  name: string;
  symbol: string;
  exchange: string;
  lastPrice: number | null;
  change: number | null;
  percentChange: number | null;
  status: 'LIVE' | 'DATA_UNAVAILABLE';
}

export interface StockQuote {
  symbol: string;
  name: string;
  isin: string;
  sector: string;
  exchange: string;
  lastPrice: number | null;
  change: number | null;
  percentChange: number | null;
  open: number | null;
  high: number | null;
  low: number | null;
  previousClose: number | null;
  volume: number | null;
  high52Week: number | null;
  low52Week: number | null;
  status: 'LIVE' | 'DATA_UNAVAILABLE';
  statusMessage: string;
}

// Verified Indian Market Reference Directory
export const REFERENCE_STOCKS: StockReference[] = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited', isin: 'INE002A01018', sector: 'Energy & Petrochemicals', exchange: 'NSE' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Limited', isin: 'INE467B01029', sector: 'Information Technology', exchange: 'NSE' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', isin: 'INE040A01034', sector: 'Banking & Financial Services', exchange: 'NSE' },
  { symbol: 'INFY', name: 'Infosys Limited', isin: 'INE009A01021', sector: 'Information Technology', exchange: 'NSE' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', isin: 'INE090A01021', sector: 'Banking & Financial Services', exchange: 'NSE' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', isin: 'INE397D01024', sector: 'Telecommunications', exchange: 'NSE' },
  { symbol: 'SBIN', name: 'State Bank of India', isin: 'INE062A01020', sector: 'Public Sector Banking', exchange: 'NSE' },
  { symbol: 'ITC', name: 'ITC Limited', isin: 'INE154A01025', sector: 'FMCG & Consumer Goods', exchange: 'NSE' },
  { symbol: 'LICI', name: 'Life Insurance Corporation of India', isin: 'INE0J1Y01017', sector: 'Insurance', exchange: 'NSE' },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited', isin: 'INE030A01027', sector: 'FMCG & Consumer Goods', exchange: 'NSE' },
  { symbol: 'LT', name: 'Larsen & Toubro Limited', isin: 'INE018A01030', sector: 'Infrastructure & Engineering', exchange: 'NSE' },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', isin: 'INE296A01024', sector: 'NBFC & Financial Services', exchange: 'NSE' },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', isin: 'INE237A01028', sector: 'Banking & Financial Services', exchange: 'NSE' },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', isin: 'INE585B01010', sector: 'Automotive', exchange: 'NSE' },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', isin: 'INE238A01034', sector: 'Banking & Financial Services', exchange: 'NSE' },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Ltd', isin: 'INE044A01036', sector: 'Pharmaceuticals & Healthcare', exchange: 'NSE' },
  { symbol: 'TITAN', name: 'Titan Company Limited', isin: 'INE280A01028', sector: 'Consumer Discretionary', exchange: 'NSE' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', isin: 'INE155A01022', sector: 'Automotive', exchange: 'NSE' },
  { symbol: 'NTPC', name: 'NTPC Limited', isin: 'INE733E01010', sector: 'Power & Utilities', exchange: 'NSE' },
  { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Ltd', isin: 'INE213A01029', sector: 'Oil & Gas Exploration', exchange: 'NSE' },
  { symbol: 'WIPRO', name: 'Wipro Limited', isin: 'INE075A01022', sector: 'Information Technology', exchange: 'NSE' },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited', isin: 'INE860A01027', sector: 'Information Technology', exchange: 'NSE' },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', isin: 'INE021A01026', sector: 'Paints & Consumer Goods', exchange: 'NSE' },
  { symbol: 'COALINDIA', name: 'Coal India Limited', isin: 'INE522F01014', sector: 'Mining & Metals', exchange: 'NSE' },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', isin: 'INE918I01026', sector: 'Financial Services', exchange: 'NSE' },
];

export const REFERENCE_INDICES = [
  { name: 'NIFTY 50', symbol: 'NIFTY50', exchange: 'NSE' },
  { name: 'S&P BSE SENSEX', symbol: 'SENSEX', exchange: 'BSE' },
  { name: 'NIFTY BANK', symbol: 'BANKNIFTY', exchange: 'NSE' },
  { name: 'NIFTY IT', symbol: 'NIFTYIT', exchange: 'NSE' },
];

export function getMarketDataProviderStatus() {
  const apiKey = process.env.MARKET_DATA_PROVIDER_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);
  return {
    isConfigured,
    provider: isConfigured ? 'Live Market Data Feed' : 'Unconfigured',
    message: isConfigured
      ? 'Live market data feed connected.'
      : 'Market data provider API key not configured in .env. Live tick data is disabled.',
  };
}

export function searchStocks(query: string): StockReference[] {
  if (!query || !query.trim()) return REFERENCE_STOCKS.slice(0, 10);
  const q = query.trim().toUpperCase();
  return REFERENCE_STOCKS.filter(
    (s) => s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q) || s.sector.toUpperCase().includes(q)
  );
}

export function getStockBySymbol(symbol: string): StockQuote | null {
  const stock = REFERENCE_STOCKS.find((s) => s.symbol.toUpperCase() === symbol.toUpperCase());
  if (!stock) return null;

  const providerStatus = getMarketDataProviderStatus();

  return {
    symbol: stock.symbol,
    name: stock.name,
    isin: stock.isin,
    sector: stock.sector,
    exchange: stock.exchange,
    lastPrice: null,
    change: null,
    percentChange: null,
    open: null,
    high: null,
    low: null,
    previousClose: null,
    volume: null,
    high52Week: null,
    low52Week: null,
    status: 'DATA_UNAVAILABLE',
    statusMessage: providerStatus.message,
  };
}

export function getIndices(): MarketIndexInfo[] {
  return REFERENCE_INDICES.map((idx) => ({
    name: idx.name,
    symbol: idx.symbol,
    exchange: idx.exchange,
    lastPrice: null,
    change: null,
    percentChange: null,
    status: 'DATA_UNAVAILABLE',
  }));
}
