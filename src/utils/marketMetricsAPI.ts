/**
 * Market Metrics API
 * Fetches Open Interest, Liquidations, BTC Dominance, etc.
 */

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const BINANCE_FUTURES_API = 'https://fapi.binance.com';
const TIMEOUT = 5000; // Reduced to 5 seconds

// Helper: fetch with timeout
const fetchWithTimeout = async (url: string, timeout = TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

/**
 * Fetch BTC Open Interest from Binance Futures
 * Returns total open interest in USD
 */
export const fetchOpenInterest = async (): Promise<{
  value: number;
  symbol: string;
  formatted: string;
}> => {
  try {
    const url = `${BINANCE_FUTURES_API}/fapi/v1/openInterest?symbol=BTCUSDT`;
    const data = await fetchWithTimeout(url, 5000);
    
    const openInterest = parseFloat(data.openInterest || '0');
    
    // Get current BTC price to convert to USD
    const tickerUrl = `${BINANCE_FUTURES_API}/fapi/v1/ticker/price?symbol=BTCUSDT`;
    const ticker = await fetchWithTimeout(tickerUrl, 5000);
    const price = parseFloat(ticker.price || '0');
    
    const valueUSD = openInterest * price;
    
    return {
      value: valueUSD,
      symbol: 'BTCUSDT',
      formatted: formatLargeNumber(valueUSD),
    };
  } catch (error: any) {
    // Silent fail - don't log, just throw with clean message
    throw new Error('Timeout');
  }
};

/**
 * Fetch 24h Liquidations from Binance Futures
 * Note: This is a simplified version - real liquidation data requires websocket
 * or third-party services like Coinglass API
 */
export const fetchLiquidations = async (): Promise<{
  long: number;
  short: number;
  total: number;
  formatted: string;
}> => {
  try {
    // Simplified: Use funding rate as proxy for liquidation pressure
    // Positive = longs paying shorts (bearish pressure)
    // Negative = shorts paying longs (bullish pressure)
    const url = `${BINANCE_FUTURES_API}/fapi/v1/fundingRate?symbol=BTCUSDT&limit=1`;
    const data = await fetchWithTimeout(url, 5000);
    
    if (!data || data.length === 0) {
      throw new Error('No data');
    }
    
    const fundingRate = parseFloat(data[0].fundingRate);
    
    // Mock liquidation estimates based on funding rate magnitude
    // In production, use Coinglass API or similar service
    const magnitude = Math.abs(fundingRate) * 100000000;
    const isLongHeavy = fundingRate > 0;
    
    return {
      long: isLongHeavy ? magnitude * 0.6 : magnitude * 0.4,
      short: isLongHeavy ? magnitude * 0.4 : magnitude * 0.6,
      total: magnitude,
      formatted: formatLargeNumber(magnitude),
    };
  } catch (error: any) {
    // Silent fail
    throw new Error('Timeout');
  }
};

/**
 * Fetch BTC Dominance from CoinGecko
 * Returns BTC market cap percentage vs total crypto market
 */
export const fetchBTCDominance = async (): Promise<{
  value: number;
  formatted: string;
  change24h: number;
}> => {
  try {
    const url = `${COINGECKO_API}/global`;
    const data = await fetchWithTimeout(url, 5000);
    
    const dominance = data?.data?.market_cap_percentage?.btc || 0;
    
    // CoinGecko doesn't provide 24h change for dominance
    // Store previous value in cache for comparison
    const cached = getDominanceCache();
    const change24h = cached ? dominance - cached : 0;
    setDominanceCache(dominance);
    
    return {
      value: dominance,
      formatted: `${dominance.toFixed(2)}%`,
      change24h,
    };
  } catch (error: any) {
    // Silent fail
    throw new Error('Timeout');
  }
};

/**
 * Fetch average RSI across top cryptocurrencies
 * Useful for market-wide overbought/oversold conditions
 */
export const fetchMarketRSI = async (): Promise<{
  value: number;
  classification: 'Oversold' | 'Neutral' | 'Overbought';
  formatted: string;
}> => {
  try {
    // This requires historical price data for multiple coins
    // Simplified: Use BTC RSI as proxy
    // In production, calculate RSI for top 10-20 coins and average
    
    // For now, return mock data structure
    // Real implementation would fetch OHLC data and calculate RSI
    throw new Error('Market RSI calculation requires OHLC data');
  } catch (error: any) {
    console.error('Market RSI fetch error:', error);
    throw new Error('Unable to fetch Market RSI');
  }
};

// Helper: Format large numbers
const formatLargeNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

// Simple cache for dominance change calculation
let dominanceCache: number | null = null;

const getDominanceCache = (): number | null => {
  return dominanceCache;
};

const setDominanceCache = (value: number): void => {
  dominanceCache = value;
};
