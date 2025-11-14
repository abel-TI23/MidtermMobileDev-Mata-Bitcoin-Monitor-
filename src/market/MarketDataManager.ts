import { createBinanceWebSocket, Candle, TickerData } from '../utils/binanceAPI';

type KlineListener = (candle: Candle, isClosed: boolean) => void;
type TickerListener = (ticker: TickerData) => void;

type ConnKey = `${string}|${string}`; // `${symbol}|${interval}`

interface Connection {
  ws: WebSocket | null;
  interval: string;
  symbol: string;
  klineSubs: Set<KlineListener>;
  // throttling support
  lastEmit: number;
  reconnectTimer: any;
}

/**
 * Singleton MarketDataManager
 * - Deduplicates WS connections per (symbol, interval)
 * - Provides subscribeKline and subscribeTicker APIs
 * - Applies light throttling and backoff reconnect
 */
class MarketDataManager {
  private connections = new Map<ConnKey, Connection>();
  private tickerSubs: Set<TickerListener> = new Set();
  private tickerKey: ConnKey = 'btcusdt|1m'; // canonical source for ticker events
  private debug = false;

  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  subscribeTicker(listener: TickerListener) {
    this.tickerSubs.add(listener);
    // Ensure ticker source connection is up
    this.ensureConnection(this.tickerKey.split('|')[0], this.tickerKey.split('|')[1]);
    return () => {
      this.tickerSubs.delete(listener);
      // Do not tear down ticker connection aggressively; leave it for kline consumers or until idle
      this.maybeTeardown(this.tickerKey);
    };
  }

  subscribeKline(symbol: string, interval: string, listener: KlineListener) {
    const key: ConnKey = `${symbol.toLowerCase()}|${interval}`;
    const conn = this.ensureConnection(symbol, interval);
    conn.klineSubs.add(listener);
    return () => {
      const c = this.connections.get(key);
      if (!c) return;
      c.klineSubs.delete(listener);
      this.maybeTeardown(key);
    };
  }

  private ensureConnection(symbol: string, interval: string): Connection {
    const key: ConnKey = `${symbol.toLowerCase()}|${interval}`;
    const existing = this.connections.get(key);
    if (existing && existing.ws) {
      return existing;
    }

    const conn: Connection = existing ?? {
      ws: null,
      interval,
      symbol: symbol.toUpperCase(),
      klineSubs: new Set(),
      lastEmit: 0,
      reconnectTimer: null,
    };
    this.connections.set(key, conn);

    const connect = () => {
      // Clear prior
      if (conn.ws) {
        try { conn.ws.close(); } catch {}
        conn.ws = null;
      }

      const ws = createBinanceWebSocket(
        symbol.toLowerCase(),
        interval,
        // Kline handler
        (candle, isClosed) => {
          const now = Date.now();
          // Throttle open-candle updates to 250ms, always emit closed candles
          if (!isClosed && now - conn.lastEmit < 250) return;
          conn.lastEmit = now;
          conn.klineSubs.forEach((fn) => {
            try { fn(candle, isClosed); } catch (e) { if (this.debug) console.warn('kline sub error', e); }
          });
        },
        // Ticker handler: only forward from canonical tickerKey
        (ticker) => {
          const currentKey: ConnKey = `${symbol.toLowerCase()}|${interval}`;
          if (currentKey !== this.tickerKey) return;
          // Throttle ticker to 200ms
          const now = Date.now();
          const last = (this as any)._lastTickerEmit || 0;
          if (now - last < 200) return;
          (this as any)._lastTickerEmit = now;
          this.tickerSubs.forEach((fn) => {
            try { fn(ticker); } catch (e) { if (this.debug) console.warn('ticker sub error', e); }
          });
        },
        (error) => {
          if (this.debug) console.warn('WS error, will reconnect:', error);
          // Backoff reconnect 1.5s
          if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
          conn.reconnectTimer = setTimeout(connect, 1500);
        }
      );

      ws.onclose = () => {
        // Attempt reconnect unless no subscribers
        if (this.debug) console.log('WS closed:', key);
        if (conn.klineSubs.size === 0 && this.tickerSubs.size === 0) return; // no need to reconnect
        if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
        conn.reconnectTimer = setTimeout(connect, 1500);
      };

      conn.ws = ws;
    };

    connect();
    return conn;
  }

  private maybeTeardown(key: ConnKey) {
    const conn = this.connections.get(key);
    if (!conn) return;
    const isTickerConn = key === this.tickerKey;
    const hasTickerSubs = this.tickerSubs.size > 0;
    if (conn.klineSubs.size === 0 && (!isTickerConn || !hasTickerSubs)) {
      if (this.debug) console.log('Tearing down WS:', key);
      try { conn.ws?.close(); } catch {}
      if (conn.reconnectTimer) clearTimeout(conn.reconnectTimer);
      this.connections.delete(key);
    }
  }
}

export const marketDataManager = new MarketDataManager();

// Convenience hooks (minimal, no external store)
import { useEffect, useState } from 'react';

export function useTicker(symbol: string = 'BTCUSDT') {
  const [state, setState] = useState<TickerData>({ price: 0, priceChange: 0, volume: 0 });
  useEffect(() => {
    const unsub = marketDataManager.subscribeTicker((t) => setState(t));
    return () => unsub();
  }, [symbol]);
  return state;
}

export function useKlines(interval: string = '1m', symbol: string = 'BTCUSDT') {
  const [last, setLast] = useState<{ candle: Candle | null; isClosed: boolean }>({ candle: null, isClosed: false });
  useEffect(() => {
    const unsub = marketDataManager.subscribeKline(symbol, interval, (c, x) => setLast({ candle: c, isClosed: x }));
    return () => unsub();
  }, [symbol, interval]);
  return last;
}
