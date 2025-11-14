/**
 * Signal Engine - Rule-based trading signal calculator
 * Simplified version using mathematical rules instead of ML
 */

import {
  TradingSignal,
  SignalAction,
  SignalFactor,
  RiskLevel,
  ConfidenceLevel,
} from '../types/signal';
import { fetchCandles, Candle } from './binanceAPI';
import { generateSignal, SignalType, SignalStrength } from './signalGenerator';
import { calculateRSI, calculateEMA, calculateATR } from './indicators';

/**
 * Main entry point - fetches data and calculates signal
 */
export const calculateTradingSignal = async (symbol: string = 'BTCUSDT'): Promise<TradingSignal> => {
  try {
    // Fetch candles for analysis (1h timeframe, 100 candles)
    const candles = await fetchCandles(symbol, '1h', 100);
    
    // Generate signal using rule-based engine
    const basicSignal = generateSignal(candles);
    
    // Convert to TradingSignal format
    return convertToTradingSignal(basicSignal, candles, symbol);
  } catch (error) {
    console.error('Error calculating trading signal:', error);
    throw error;
  }
};

/**
 * Convert basic signal to full TradingSignal format
 */
function convertToTradingSignal(
  basicSignal: ReturnType<typeof generateSignal>,
  candles: Candle[],
  symbol: string
): TradingSignal {
  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);
  
  const rsi = calculateRSI(closes, 14);
  const ema21 = calculateEMA(closes, 21);
  const atr = calculateATR(highs, lows, closes, 14);
  
  const currentRSI = rsi[rsi.length - 1] || 50;
  const currentEMA = ema21[ema21.length - 1] || closes[closes.length - 1];
  const currentATR = atr[atr.length - 1] || 0;
  const currentPrice = closes[closes.length - 1];

  // Convert signal type to action
  let action: SignalAction = 'WAIT';
  if (basicSignal.type === 'LONG' && basicSignal.strength === 'STRONG') action = 'BUY';
  else if (basicSignal.type === 'LONG' && basicSignal.strength === 'MODERATE') action = 'BUY';
  else if (basicSignal.type === 'SHORT' && basicSignal.strength === 'STRONG') action = 'SELL';
  else if (basicSignal.type === 'SHORT' && basicSignal.strength === 'MODERATE') action = 'SELL';
  else if (basicSignal.type === 'NEUTRAL') action = 'HOLD';

  // Convert confidence to level
  let confidenceLevel: ConfidenceLevel = 'MEDIUM';
  if (basicSignal.confidence >= 80) confidenceLevel = 'VERY_HIGH';
  else if (basicSignal.confidence >= 65) confidenceLevel = 'HIGH';
  else if (basicSignal.confidence >= 50) confidenceLevel = 'MEDIUM';
  else confidenceLevel = 'LOW';

  // Calculate score (0-5 stars)
  const score = (basicSignal.confidence / 100) * 5;

  // Build factors from reasons
  const factors: SignalFactor[] = basicSignal.reasons.map((reason, index) => ({
    name: `Factor ${index + 1}`,
    score: basicSignal.type === 'LONG' ? 70 + (basicSignal.confidence / 10) : 30 - (basicSignal.confidence / 10),
    weight: 5,
    description: reason,
    bullish: basicSignal.type === 'LONG',
  }));

  // Add indicator factors
  factors.push({
    name: 'RSI Indicator',
    score: currentRSI < 30 ? 85 : currentRSI > 70 ? 30 : 50,
    weight: 7,
    description: `RSI: ${currentRSI.toFixed(1)} ${currentRSI < 30 ? '(Oversold)' : currentRSI > 70 ? '(Overbought)' : '(Neutral)'}`,
    bullish: currentRSI < 50,
  });

  factors.push({
    name: 'Trend (EMA21)',
    score: currentPrice > currentEMA ? 70 : 30,
    weight: 6,
    description: `Price ${currentPrice > currentEMA ? 'above' : 'below'} EMA21 (${currentEMA.toFixed(2)})`,
    bullish: currentPrice > currentEMA,
  });

  // Risk level
  const atrPercent = (currentATR / currentPrice) * 100;
  let riskLevel: RiskLevel = 'MODERATE';
  if (atrPercent > 8 || basicSignal.confidence < 50) riskLevel = 'HIGH';
  else if (atrPercent < 4 && basicSignal.confidence >= 70) riskLevel = 'LOW';

  // Position size
  let positionSizePercent = 5;
  if (riskLevel === 'LOW' && basicSignal.confidence >= 75) positionSizePercent = 8;
  else if (riskLevel === 'HIGH' || basicSignal.confidence < 50) positionSizePercent = 2;

  // Entry zone (0.5% around current price)
  const entryZone = {
    min: currentPrice * 0.995,
    max: currentPrice * 1.005,
  };

  // Generate summary
  let summary = '';
  if (action === 'BUY') {
    summary = `${basicSignal.strength} bullish signal with ${basicSignal.confidence}% confidence. Multiple technical factors align for potential upside.`;
  } else if (action === 'SELL') {
    summary = `${basicSignal.strength} bearish signal with ${basicSignal.confidence}% confidence. Consider taking profits or avoiding longs.`;
  } else if (action === 'HOLD') {
    summary = 'Mixed signals. Maintain existing positions and monitor for clearer direction.';
  } else {
    summary = 'No clear setup detected. Wait for better risk/reward opportunity.';
  }

  const warnings: string[] = [];
  if (riskLevel === 'HIGH') {
    warnings.push('High volatility detected - use smaller position size');
  }
  if (basicSignal.confidence < 60) {
    warnings.push('Low confidence - wait for stronger confirmation');
  }

  return {
    id: `signal_${symbol}_${Date.now()}`,
    symbol,
    timestamp: Date.now(),
    score: parseFloat(score.toFixed(1)),
    action,
    confidence: confidenceLevel,
    confidencePercent: basicSignal.confidence,
    currentPrice,
    entryZone,
    stopLoss: basicSignal.stopLoss,
    takeProfit: [basicSignal.takeProfit],
    riskRewardRatio: ((basicSignal.takeProfit - currentPrice) / (currentPrice - basicSignal.stopLoss)),
    factors,
    riskLevel,
    positionSizePercent,
    summary,
    reasons: basicSignal.reasons,
    warnings,
  };
}
