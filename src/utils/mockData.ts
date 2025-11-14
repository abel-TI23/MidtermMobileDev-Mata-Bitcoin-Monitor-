/**
 * Mock Data for Testing
 * Used as fallback when Binance API is not accessible
 */

import { Candle } from './binanceAPI';

/**
 * Generate mock candle data for testing
 * Creates realistic-looking BTC price data
 */
export function generateMockCandles(count: number = 200): Candle[] {
  const candles: Candle[] = [];
  const basePrice = 95000; // Current BTC price around $95k
  const baseVolume = 150;
  let currentPrice = basePrice;
  const now = Date.now();
  
  for (let i = count - 1; i >= 0; i--) {
    // Random price movement (+/- 0.5%)
    const change = (Math.random() - 0.5) * 0.01 * currentPrice;
    currentPrice = currentPrice + change;
    
    const open = currentPrice;
    const close = currentPrice + (Math.random() - 0.5) * 0.005 * currentPrice;
    const high = Math.max(open, close) + Math.random() * 0.003 * currentPrice;
    const low = Math.min(open, close) - Math.random() * 0.003 * currentPrice;
    const volume = baseVolume + (Math.random() - 0.5) * 50;
    
    candles.push({
      time: now - (i * 60 * 1000), // 1 minute intervals
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(3)),
    });
    
    currentPrice = close;
  }
  
  return candles;
}

/**
 * Generate mock ticker data
 */
export function generateMockTicker() {
  const basePrice = 95000;
  const priceChange = (Math.random() - 0.3) * 5; // -1.5% to +3.5%
  
  return {
    price: basePrice + (Math.random() - 0.5) * 1000,
    priceChange,
    volume: 28000 + Math.random() * 4000,
  };
}

/**
 * Update mock candle with new data (simulate real-time)
 */
export function updateMockCandle(lastCandle: Candle): Candle {
  const change = (Math.random() - 0.5) * 0.002 * lastCandle.close;
  const newClose = lastCandle.close + change;
  
  return {
    time: Date.now(),
    open: lastCandle.close,
    high: Math.max(lastCandle.close, newClose) + Math.random() * 50,
    low: Math.min(lastCandle.close, newClose) - Math.random() * 50,
    close: parseFloat(newClose.toFixed(2)),
    volume: parseFloat((150 + (Math.random() - 0.5) * 50).toFixed(3)),
  };
}
