/**
 * Binance API Integration
 * Handles REST API calls and WebSocket connections for real-time BTC data
 */

export interface Candle {
  time: number;        // Timestamp in milliseconds
  open: number;        // Opening price
  high: number;        // Highest price
  low: number;         // Lowest price
  close: number;       // Closing price
  volume: number;      // Trading volume
}

export interface TickerData {
  price: number;       // Current price
  priceChange: number; // 24h price change percentage
  volume: number;      // 24h volume
}

// Binance API endpoints (with regional/availability fallbacks)
const BINANCE_REST_HOSTS = [
  'https://api.binance.com/api/v3',
  'https://api1.binance.com/api/v3',
  'https://api2.binance.com/api/v3',
  'https://api3.binance.com/api/v3',
  // Public mirrored data API (read-only)
  'https://data-api.binance.vision/api/v3',
] as const;

// WebSocket endpoints (cycle on each connect to avoid regional blocking/mitm)
const BINANCE_WS_HOSTS = [
  // Primary (often unblocked)
  'wss://stream.binance.com:9443/stream',
  // Regional mirror with explicit port
  'wss://stream.binance.me:9443/stream',
  // Fallbacks on 443
  'wss://stream.binance.com:443/stream',
  'wss://stream.binance.me/stream',
  // Note: If your ISP blocks Binance domains, consider using a proxy (see README)
] as const;

let wsHostIndex = 0;
const DEBUG_WS = false; // set true to enable verbose WS logs during debugging
const pickWsBase = () => {
  // Optional runtime override for proxying (set global.__WS_PROXY_URL before init)
  const proxy = (globalThis as any)?.__WS_PROXY_URL as string | undefined;
  if (proxy && typeof proxy === 'string') {
    return proxy.replace(/\/$/, '');
  }
  const base = BINANCE_WS_HOSTS[wsHostIndex % BINANCE_WS_HOSTS.length];
  wsHostIndex = (wsHostIndex + 1) % BINANCE_WS_HOSTS.length;
  return base;
};

/**
 * Fetch historical candlestick data from Binance REST API
 * @param symbol - Trading pair (e.g., 'BTCUSDT')
 * @param interval - Candlestick interval (e.g., '1m', '5m', '1h')
 * @param limit - Number of candles to fetch (max 1000)
 * @returns Promise with array of Candle objects
 */
export async function fetchCandles(
  symbol: string = 'BTCUSDT',
  interval: string = '1m',
  limit: number = 200
): Promise<Candle[]> {
  // Try each host in order until one works
  let lastError: any = null;
  for (const host of BINANCE_REST_HOSTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout (lebih cepat dari 12s)
    const url = `${host}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        // Try next host on common transient statuses
        if ([403, 429, 502, 503, 504].includes(response.status)) {
          lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
          console.warn('⚠️ Host failed, trying next:', host, response.status);
          continue;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (!Array.isArray(data) || data.length === 0) {
        lastError = new Error('Invalid data format received from API');
        continue;
      }
      return data.map((item: any[]) => ({
        time: item[0],
        open: parseFloat(item[1]),
        high: parseFloat(item[2]),
        low: parseFloat(item[3]),
        close: parseFloat(item[4]),
        volume: parseFloat(item[5]),
      }));
    } catch (error: any) {
      clearTimeout(timeoutId);
      lastError = error;
      // try next host tanpa console log untuk lebih cepat
      continue;
    }
  }
  // console.error('❌ Error fetching candles across all hosts:', lastError);
  if (lastError?.name === 'AbortError') {
    throw new Error('Request timeout - please check your internet connection');
  }
  throw lastError || new Error('Unable to fetch candles from Binance');
}

/**
 * Fetch 24h ticker stats (price, percent change, volume) from REST with host fallbacks
 */
export async function fetchTicker24h(symbol: string = 'BTCUSDT'): Promise<TickerData> {
  let lastError: any = null;
  for (const host of BINANCE_REST_HOSTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    const url = `${host}/ticker/24hr?symbol=${symbol}`;
    try {
      const res = await fetch(url, { method: 'GET', signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) {
        if ([403, 429, 502, 503, 504].includes(res.status)) {
          lastError = new Error(`HTTP ${res.status}: ${res.statusText}`);
          continue;
        }
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      return {
        price: parseFloat(data.lastPrice || data.c || '0'),
        priceChange: parseFloat(data.priceChangePercent || data.P || '0'),
        volume: parseFloat(data.volume || data.v || '0'),
      };
    } catch (e: any) {
      clearTimeout(timeoutId);
      lastError = e;
      continue;
    }
  }
  if (lastError?.name === 'AbortError') {
    throw new Error('Ticker request timeout');
  }
  throw lastError || new Error('Unable to fetch ticker');
}

/**
 * Create WebSocket connection for real-time data
 * @param symbol - Trading pair (e.g., 'btcusdt')
 * @param interval - Kline interval (e.g., '1m')
 * @param onKline - Callback for new kline data
 * @param onTicker - Callback for ticker updates
 * @param onError - Callback for errors
 * @returns WebSocket instance
 */
export function createBinanceWebSocket(
  symbol: string = 'btcusdt',
  interval: string = '1m',
  onKline: (candle: Candle, isClosed: boolean) => void,
  onTicker: (ticker: TickerData) => void,
  onError: (error: Event) => void
): WebSocket {
  // Subscribe to kline stream and 24h ticker stream
  const streams = `${symbol}@kline_${interval}/${symbol}@ticker`;
  const wsUrl = `${pickWsBase()}?streams=${streams}`;
  
  if (DEBUG_WS) console.log('🔌 Connecting to WebSocket:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    if (DEBUG_WS) console.log('✅ WebSocket connected successfully');
  };
  
  ws.onmessage = (event) => {
    try {
  const message = JSON.parse(event.data);
  if (DEBUG_WS) console.log('📨 WebSocket message received:', message.stream);
      
      // Handle kline (candlestick) updates
      if (message.stream?.includes('@kline_')) {
        const kline = message.data.k;
        const candle: Candle = {
          time: kline.t,
          open: parseFloat(kline.o),
          high: parseFloat(kline.h),
          low: parseFloat(kline.l),
          close: parseFloat(kline.c),
          volume: parseFloat(kline.v),
        };
        if (DEBUG_WS) console.log('📊 Kline update:', { price: candle.close, closed: kline.x });
        onKline(candle, kline.x); // kline.x indicates if the candle is closed
      }
      
      // Handle 24h ticker updates
      if (message.stream?.includes('@ticker')) {
        const ticker = message.data;
        const tickerData: TickerData = {
          price: parseFloat(ticker.c),
          priceChange: parseFloat(ticker.P),
          volume: parseFloat(ticker.v),
        };
        if (DEBUG_WS) console.log('💹 Ticker update:', { price: tickerData.price, change: tickerData.priceChange });
        onTicker(tickerData);
      }
    } catch (error) {
      if (DEBUG_WS) console.error('❌ Error parsing WebSocket message:', error);
    }
  };
  
  ws.onerror = (error) => {
    if (DEBUG_WS) console.error('❌ WebSocket error:', error);
    onError(error);
  };
  
  ws.onclose = (event) => {
    if (DEBUG_WS) console.log('🔴 WebSocket connection closed:', event.code, event.reason);
  };
  
  return ws;
}

/**
 * Available intervals for Binance klines
 */
export const INTERVALS = [
  { label: '1 Minute', value: '1m' },
  { label: '5 Minutes', value: '5m' },
  { label: '15 Minutes', value: '15m' },
  { label: '1 Hour', value: '1h' },
  { label: '4 Hours', value: '4h' },
  { label: '1 Day', value: '1d' },
] as const;

// ============================================================================
// EXTENDED BINANCE FUTURES API (Real-time Trading Metrics)
// ============================================================================

/**
 * Liquidation data from Binance Futures
 */
export interface LiquidationOrder {
  symbol: string;
  side: 'BUY' | 'SELL'; // SELL = long liquidation, BUY = short liquidation
  orderType: string;
  timeInForce: string;
  origQty: number; // Original quantity
  price: number; // Liquidation price
  avgPrice: number; // Average price
  orderStatus: string;
  time: number; // Timestamp
}

/**
 * Long/Short ratio data
 */
export interface LongShortRatio {
  symbol: string;
  longShortRatio: number; // Ratio of long/short positions
  longAccount: number; // Percentage of long accounts
  shortAccount: number; // Percentage of short accounts
  timestamp: number;
}

/**
 * Order book depth data
 */
export interface OrderBookDepth {
  lastUpdateId: number;
  bids: Array<[string, string]>; // [price, quantity]
  asks: Array<[string, string]>; // [price, quantity]
  timestamp: number;
}

/**
 * Open Interest data
 */
export interface OpenInterest {
  symbol: string;
  openInterest: number; // Total open interest in contracts
  timestamp: number;
}

/**
 * Taker Buy/Sell Volume ratio
 */
export interface TakerVolume {
  symbol: string;
  buyVolume: number;
  sellVolume: number;
  buyPercentage: number;
  sellPercentage: number;
  timestamp: number;
}

// Binance Futures API endpoints
const BINANCE_FUTURES_HOSTS = [
  'https://fapi.binance.com/fapi/v1',
  'https://fapi1.binance.com/fapi/v1',
  'https://fapi2.binance.com/fapi/v1',
] as const;

/**
 * Fetch recent liquidation orders (last 100)
 * @param symbol Trading pair (default: BTCUSDT)
 * @param limit Number of liquidations to fetch (max 1000, default 100)
 */
export async function fetchLiquidations(
  symbol: string = 'BTCUSDT',
  limit: number = 100
): Promise<LiquidationOrder[]> {
  const timeout = 5000;
  
  for (const host of BINANCE_FUTURES_HOSTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const url = `${host}/forceOrders?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((order: any) => ({
        symbol: order.symbol,
        side: order.side,
        orderType: order.orderType,
        timeInForce: order.timeInForce,
        origQty: parseFloat(order.origQty),
        price: parseFloat(order.price),
        avgPrice: parseFloat(order.avgPrice),
        orderStatus: order.orderStatus,
        time: order.time,
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to fetch liquidations from ${host}:`, error);
      continue;
    }
  }
  
  throw new Error('All Binance Futures hosts failed for liquidations');
}

/**
 * Fetch Long/Short account ratio
 * Top trader long/short account ratio
 * @param symbol Trading pair (default: BTCUSDT)
 * @param period Time period: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
 * @param limit Number of data points (max 500, default 30)
 */
export async function fetchLongShortRatio(
  symbol: string = 'BTCUSDT',
  period: string = '5m',
  limit: number = 30
): Promise<LongShortRatio[]> {
  const timeout = 5000;
  
  for (const host of BINANCE_FUTURES_HOSTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const url = `${host.replace('/fapi/v1', '/futures/data')}/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((item: any) => ({
        symbol: item.symbol,
        longShortRatio: parseFloat(item.longShortRatio),
        longAccount: parseFloat(item.longAccount),
        shortAccount: parseFloat(item.shortAccount),
        timestamp: item.timestamp,
      }));
    } catch (error) {
      console.warn(`⚠️ Failed to fetch Long/Short ratio from ${host}:`, error);
      continue;
    }
  }
  
  throw new Error('All Binance Futures hosts failed for Long/Short ratio');
}

/**
 * Fetch order book depth (bid/ask levels)
 * @param symbol Trading pair (default: BTCUSDT)
 * @param limit Depth levels: 5, 10, 20, 50, 100, 500, 1000 (default: 20)
 */
export async function fetchOrderBookDepth(
  symbol: string = 'BTCUSDT',
  limit: number = 20
): Promise<OrderBookDepth> {
  const timeout = 5000;
  
  for (const host of BINANCE_REST_HOSTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const url = `${host}/depth?symbol=${symbol}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        lastUpdateId: data.lastUpdateId,
        bids: data.bids,
        asks: data.asks,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.warn(`⚠️ Failed to fetch order book from ${host}:`, error);
      continue;
    }
  }
  
  throw new Error('All Binance hosts failed for order book depth');
}

/**
 * Fetch Open Interest for futures
 * @param symbol Trading pair (default: BTCUSDT)
 */
export async function fetchOpenInterestFutures(
  symbol: string = 'BTCUSDT'
): Promise<OpenInterest> {
  const timeout = 5000;
  
  for (const host of BINANCE_FUTURES_HOSTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const url = `${host}/openInterest?symbol=${symbol}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return {
        symbol: data.symbol,
        openInterest: parseFloat(data.openInterest),
        timestamp: data.time || Date.now(),
      };
    } catch (error) {
      console.warn(`⚠️ Failed to fetch Open Interest from ${host}:`, error);
      continue;
    }
  }
  
  throw new Error('All Binance Futures hosts failed for Open Interest');
}

/**
 * Fetch taker buy/sell volume (aggressive buying/selling pressure)
 * @param symbol Trading pair (default: BTCUSDT)
 * @param period Time period: 5m, 15m, 30m, 1h, 2h, 4h, 6h, 12h, 1d
 * @param limit Number of data points (max 500, default 30)
 */
export async function fetchTakerBuySellVolume(
  symbol: string = 'BTCUSDT',
  period: string = '5m',
  limit: number = 30
): Promise<TakerVolume[]> {
  const timeout = 5000;
  
  for (const host of BINANCE_FUTURES_HOSTS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);
      
      const url = `${host.replace('/fapi/v1', '/futures/data')}/takerlongshortRatio?symbol=${symbol}&period=${period}&limit=${limit}`;
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      return data.map((item: any) => {
        const buyRatio = parseFloat(item.buySellRatio);
        const buyVolume = parseFloat(item.buyVol);
        const sellVolume = parseFloat(item.sellVol);
        const totalVolume = buyVolume + sellVolume;
        
        return {
          symbol: symbol,
          buyVolume,
          sellVolume,
          buyPercentage: totalVolume > 0 ? (buyVolume / totalVolume) * 100 : 50,
          sellPercentage: totalVolume > 0 ? (sellVolume / totalVolume) * 100 : 50,
          timestamp: item.timestamp,
        };
      });
    } catch (error) {
      console.warn(`⚠️ Failed to fetch Taker Buy/Sell volume from ${host}:`, error);
      continue;
    }
  }
  
  throw new Error('All Binance Futures hosts failed for Taker Buy/Sell volume');
}

/**
 * Create WebSocket connection for real-time liquidation updates
 * @param symbol Trading pair (default: BTCUSDT)
 * @param onLiquidation Callback for liquidation events
 * @param onError Error handler
 */
export function createLiquidationWebSocket(
  symbol: string = 'BTCUSDT',
  onLiquidation: (liquidation: LiquidationOrder) => void,
  onError: (error: any) => void
): WebSocket {
  const wsBase = pickWsBase();
  const streamName = `${symbol.toLowerCase()}@forceOrder`;
  const wsUrl = `${wsBase}?streams=${streamName}`;
  
  console.log('🔌 Connecting to Binance Liquidation WebSocket:', wsUrl);
  
  const ws = new WebSocket(wsUrl);
  
  ws.onopen = () => {
    console.log('✅ Liquidation WebSocket connection established');
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      
      if (message.stream?.includes('forceOrder')) {
        const order = message.data.o;
        const liquidation: LiquidationOrder = {
          symbol: order.s,
          side: order.S,
          orderType: order.o,
          timeInForce: order.f,
          origQty: parseFloat(order.q),
          price: parseFloat(order.p),
          avgPrice: parseFloat(order.ap),
          orderStatus: order.X,
          time: order.T,
        };
        
        console.log('💥 Liquidation:', {
          side: liquidation.side,
          qty: liquidation.origQty,
          price: liquidation.price,
        });
        
        onLiquidation(liquidation);
      }
    } catch (error) {
      console.error('❌ Error parsing liquidation message:', error);
    }
  };
  
  ws.onerror = (error) => {
    console.error('❌ Liquidation WebSocket error:', error);
    onError(error);
  };
  
  ws.onclose = (event) => {
    console.log('🔴 Liquidation WebSocket closed:', event.code, event.reason);
  };
  
  return ws;
}
