/**
 * Trading Signal Types
 */

export type SignalAction = 'BUY' | 'SELL' | 'HOLD' | 'WAIT';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';

export interface SignalFactor {
  name: string;
  score: number; // 0-100
  weight: number; // importance weight
  description: string;
  bullish: boolean;
}

export interface TradingSignal {
  id: string;
  symbol: string;
  timestamp: number;
  
  // Overall score
  score: number; // 0-5 stars
  action: SignalAction;
  confidence: ConfidenceLevel;
  confidencePercent: number; // 0-100
  
  // Price zones
  currentPrice: number;
  entryZone: {
    min: number;
    max: number;
  };
  stopLoss: number;
  takeProfit: number[];
  riskRewardRatio: number;
  
  // Factors breakdown
  factors: SignalFactor[];
  
  // Risk assessment
  riskLevel: RiskLevel;
  positionSizePercent: number; // % of portfolio
  
  // Summary
  summary: string;
  reasons: string[];
  warnings: string[];
}

export interface MarketData {
  // Price data
  currentPrice: number;
  priceChange24h: number;
  high24h: number;
  low24h: number;
  recentHigh: number; // Recent swing high
  
  // Indicators (daily)
  rsi: number;
  atr: number;
  ema20: number;
  sma20: number;
  volume: number;
  volumeMA20: number;
  
  // Order flow
  orderBookBidPercent: number; // Bid strength %
  orderBookAskPercent: number; // Ask strength %
  orderBookSpread: number;
  longShortRatio: number; // Long % / Total
  fundingRate: number;
  openInterest: number;
  openInterestChange: number; // % change
  
  // Sentiment
  fearGreedIndex: number; // 0-100
}
