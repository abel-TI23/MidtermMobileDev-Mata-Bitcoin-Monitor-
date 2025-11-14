/**
 * Signal Generator - Rule-Based Trading Signals
 * 
 * Menggunakan kombinasi indikator teknikal untuk menghasilkan sinyal trading
 * berbasis aturan matematis sederhana tanpa machine learning.
 * 
 * ATURAN SINYAL:
 * 1. RSI Oversold (<30) + Volume tinggi = BULLISH signal
 * 2. RSI Overbought (>70) + Volume tinggi = BEARISH signal
 * 3. Price break EMA21 upward + Volume rising = BULLISH signal
 * 4. Price break EMA21 downward + Volume rising = BEARISH signal
 * 5. ATR rising + Price momentum up = BULLISH momentum
 * 6. ATR rising + Price momentum down = BEARISH momentum
 */

import { calculateRSI, calculateEMA, calculateATR, calculateSMA } from './indicators';
import { Candle } from './binanceAPI';

export type SignalType = 'LONG' | 'SHORT' | 'NEUTRAL';
export type SignalStrength = 'STRONG' | 'MODERATE' | 'WEAK';
export type SignalReason = string;

export interface TradingSignal {
  type: SignalType;
  strength: SignalStrength;
  confidence: number; // 0-100
  reasons: SignalReason[];
  entry: number; // Suggested entry price
  stopLoss: number; // Suggested stop loss
  takeProfit: number; // Suggested take profit
  timestamp: number;
}

/**
 * Menghasilkan sinyal trading berdasarkan data candle terbaru
 */
export function generateSignal(candles: Candle[]): TradingSignal {
  if (candles.length < 50) {
    return createNeutralSignal('Insufficient data for signal generation');
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  const volumes = candles.map(c => c.volume);

  // Calculate indicators
  const rsi = calculateRSI(closes, 14);
  const ema21 = calculateEMA(closes, 21);
  const ema50 = calculateEMA(closes, 50);
  const atr = calculateATR(highs, lows, closes, 14);
  const volumeAvg = calculateSMA(volumes, 20);

  const current = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const currentRSI = rsi[rsi.length - 1] || 50;
  const currentEMA21 = ema21[ema21.length - 1] || current.close;
  const currentEMA50 = ema50[ema50.length - 1] || current.close;
  const currentATR = atr[atr.length - 1] || 0;
  const prevATR = atr[atr.length - 2] || 0;
  const currentVolume = current.volume;
  const avgVolume = volumeAvg[volumeAvg.length - 1] || currentVolume;
  
  let score = 0;
  const reasons: string[] = [];
  const bullishReasons: string[] = [];
  const bearishReasons: string[] = [];

  // Rule 1: RSI Oversold/Overbought
  if (currentRSI < 30) {
    score += 25;
    bullishReasons.push(`RSI oversold (${currentRSI.toFixed(1)})`);
  } else if (currentRSI > 70) {
    score -= 25;
    bearishReasons.push(`RSI overbought (${currentRSI.toFixed(1)})`);
  }

  // Rule 2: Price vs EMA (Trend)
  if (current.close > currentEMA21 && prev.close <= ema21[ema21.length - 2]!) {
    score += 20;
    bullishReasons.push('Price crossed above EMA21 (uptrend signal)');
  } else if (current.close < currentEMA21 && prev.close >= ema21[ema21.length - 2]!) {
    score -= 20;
    bearishReasons.push('Price crossed below EMA21 (downtrend signal)');
  }

  // Rule 3: EMA21 vs EMA50 (Longer trend)
  if (currentEMA21 > currentEMA50) {
    score += 15;
    bullishReasons.push('EMA21 above EMA50 (bullish trend)');
  } else if (currentEMA21 < currentEMA50) {
    score -= 15;
    bearishReasons.push('EMA21 below EMA50 (bearish trend)');
  }

  // Rule 4: Volume confirmation
  const volumeRatio = currentVolume / avgVolume;
  if (volumeRatio > 1.5) {
    if (current.close > current.open) {
      score += 15;
      bullishReasons.push(`High volume on green candle (${(volumeRatio * 100).toFixed(0)}% above avg)`);
    } else {
      score -= 15;
      bearishReasons.push(`High volume on red candle (${(volumeRatio * 100).toFixed(0)}% above avg)`);
    }
  }

  // Rule 5: Momentum (price change)
  const momentum = ((current.close - prev.close) / prev.close) * 100;
  if (momentum > 1) {
    score += 10;
    bullishReasons.push(`Strong upward momentum (+${momentum.toFixed(2)}%)`);
  } else if (momentum < -1) {
    score -= 10;
    bearishReasons.push(`Strong downward momentum (${momentum.toFixed(2)}%)`);
  }

  // Rule 6: ATR (volatility expansion)
  if (currentATR > prevATR * 1.2) {
    if (current.close > prev.close) {
      score += 10;
      bullishReasons.push('Volatility expanding upward');
    } else {
      score -= 10;
      bearishReasons.push('Volatility expanding downward');
    }
  }

  // Determine signal type and strength
  let signalType: SignalType = 'NEUTRAL';
  let signalStrength: SignalStrength = 'WEAK';
  
  if (score >= 40) {
    signalType = 'LONG';
    signalStrength = score >= 60 ? 'STRONG' : 'MODERATE';
    reasons.push(...bullishReasons);
  } else if (score <= -40) {
    signalType = 'SHORT';
    signalStrength = score <= -60 ? 'STRONG' : 'MODERATE';
    reasons.push(...bearishReasons);
  } else {
    reasons.push('No clear trend - waiting for better setup');
    if (bullishReasons.length > 0) reasons.push('Bullish factors: ' + bullishReasons.join(', '));
    if (bearishReasons.length > 0) reasons.push('Bearish factors: ' + bearishReasons.join(', '));
  }

  const confidence = Math.min(Math.abs(score), 100);

  // Calculate entry, stop loss, and take profit
  const atrMultiplier = signalStrength === 'STRONG' ? 1.5 : 2.0;
  const entry = current.close;
  let stopLoss: number;
  let takeProfit: number;

  if (signalType === 'LONG') {
    stopLoss = entry - (currentATR * atrMultiplier);
    takeProfit = entry + (currentATR * atrMultiplier * 2); // 2:1 R:R
  } else if (signalType === 'SHORT') {
    stopLoss = entry + (currentATR * atrMultiplier);
    takeProfit = entry - (currentATR * atrMultiplier * 2); // 2:1 R:R
  } else {
    stopLoss = entry - currentATR;
    takeProfit = entry + currentATR;
  }

  return {
    type: signalType,
    strength: signalStrength,
    confidence,
    reasons,
    entry,
    stopLoss,
    takeProfit,
    timestamp: current.time,
  };
}

/**
 * Generate neutral signal with reason
 */
function createNeutralSignal(reason: string): TradingSignal {
  return {
    type: 'NEUTRAL',
    strength: 'WEAK',
    confidence: 0,
    reasons: [reason],
    entry: 0,
    stopLoss: 0,
    takeProfit: 0,
    timestamp: Date.now(),
  };
}

/**
 * Format signal untuk display
 */
export function formatSignal(signal: TradingSignal): string {
  const { type, strength, confidence } = signal;
  
  if (type === 'NEUTRAL') {
    return `⚪ NEUTRAL - No clear signal`;
  }
  
  const emoji = type === 'LONG' ? '🟢' : '🔴';
  const action = type === 'LONG' ? 'BUY' : 'SELL';
  
  return `${emoji} ${action} ${strength} (${confidence}% confidence)`;
}
