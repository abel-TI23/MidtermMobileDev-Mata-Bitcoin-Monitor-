/**
 * Technical Indicators Calculator
 * Implements Simple Moving Average (SMA) and Exponential Moving Average (EMA)
 */

/**
 * Calculate Simple Moving Average (SMA)
 * @param values - Array of price values
 * @param period - Period for SMA calculation (e.g., 100 for SMA-100)
 * @returns Array with SMA values (null for insufficient data points)
 */
export function calculateSMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  let sum = 0;

  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    
    // Remove the oldest value once we exceed the period
    if (i >= period) {
      sum -= values[i - period];
    }
    
    // Only calculate SMA once we have enough data points
    if (i >= period - 1) {
      result.push(parseFloat((sum / period).toFixed(2)));
    } else {
      result.push(null);
    }
  }
  
  return result;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param values - Array of price values
 * @param period - Period for EMA calculation (e.g., 21 for EMA-21)
 * @returns Array with EMA values (null for insufficient data points)
 */
export function calculateEMA(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const multiplier = 2 / (period + 1); // EMA smoothing factor
  let ema: number | null = null;

  for (let i = 0; i < values.length; i++) {
    const currentValue = values[i];
    
    if (ema === null) {
      // Initialize EMA with the first value
      ema = currentValue;
    } else {
      // EMA formula: (Current Price × Multiplier) + (Previous EMA × (1 - Multiplier))
      ema = currentValue * multiplier + ema * (1 - multiplier);
    }
    
    // Only return EMA values once we have enough data points
    if (i >= period - 1) {
      result.push(parseFloat(ema.toFixed(2)));
    } else {
      result.push(null);
    }
  }
  
  return result;
}

/**
 * Format large numbers with K/M suffixes
 * @param value - Number to format
 * @returns Formatted string (e.g., "1.5K", "2.3M")
 */
export function formatVolume(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(2)}M`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}K`;
  }
  return value.toFixed(2);
}

/**
 * Format price with proper decimal places
 * @param price - Price value
 * @returns Formatted price string
 */
export function formatPrice(price: number): string {
  return price.toLocaleString(undefined, { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

/**
 * Relative Strength Index (RSI)
 * @param values price closes
 * @param period lookback (default 14)
 */
export function calculateRSI(values: number[], period: number = 14): (number | null)[] {
  if (values.length < 2) return values.map(() => null);
  const result: (number | null)[] = [];
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < values.length; i++) {
    const change = values[i] - values[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    gains += gain;
    losses += loss;
    if (i >= period) {
      const prevChange = values[i - period + 1] - values[i - period];
      const prevGain = prevChange > 0 ? prevChange : 0;
      const prevLoss = prevChange < 0 ? -prevChange : 0;
      gains -= prevGain;
      losses -= prevLoss;
    }
    if (i >= period) {
      const avgGain = gains / period;
      const avgLoss = losses / period;
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - 100 / (1 + rs);
        result.push(parseFloat(rsi.toFixed(2)));
      }
    } else {
      result.push(null);
    }
  }
  // Align indices (first value has no change)
  result.unshift(null);
  return result;
}

/**
 * MACD calculation (fast EMA - slow EMA) with signal and histogram
 */
export function calculateMACD(values: number[], fast: number = 12, slow: number = 26, signal: number = 9) {
  const ema = (arr: number[], period: number): number[] => {
    const mult = 2 / (period + 1);
    const out: number[] = [];
    let prev: number | null = null;
    for (const v of arr) {
      prev = prev == null ? v : prev + (v - prev) * mult;
      out.push(prev);
    }
    return out;
  };
  const emaFast = ema(values, fast);
  const emaSlow = ema(values, slow);
  const macdLine = emaFast.map((v, i) => v - (emaSlow[i] ?? 0));
  const signalLine = ema(macdLine, signal);
  const histogram = macdLine.map((v, i) => v - (signalLine[i] ?? 0));
  return { macdLine, signalLine, histogram };
}

/**
 * Average True Range (ATR) - Volatility indicator
 * @param highs - Array of high prices
 * @param lows - Array of low prices
 * @param closes - Array of closing prices
 * @param period - ATR period (default 14)
 * @returns Array with ATR values (null for insufficient data points)
 */
export function calculateATR(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): (number | null)[] {
  if (highs.length !== lows.length || highs.length !== closes.length) {
    throw new Error('ATR: All arrays must have the same length');
  }
  
  const result: (number | null)[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 0; i < highs.length; i++) {
    let tr: number;
    
    if (i === 0) {
      // First candle: TR = High - Low
      tr = highs[i] - lows[i];
    } else {
      // TR = max(High - Low, |High - PrevClose|, |Low - PrevClose|)
      const highLow = highs[i] - lows[i];
      const highClose = Math.abs(highs[i] - closes[i - 1]);
      const lowClose = Math.abs(lows[i] - closes[i - 1]);
      tr = Math.max(highLow, highClose, lowClose);
    }
    
    trueRanges.push(tr);
    
    if (i < period - 1) {
      result.push(null);
    } else if (i === period - 1) {
      // First ATR is simple average of first 'period' TRs
      const sum = trueRanges.slice(0, period).reduce((a, b) => a + b, 0);
      result.push(parseFloat((sum / period).toFixed(4)));
    } else {
      // Subsequent ATRs use Wilder's smoothing: ATR = ((prevATR * (period - 1)) + TR) / period
      const prevATR = result[i - 1] as number;
      const atr = ((prevATR * (period - 1)) + tr) / period;
      result.push(parseFloat(atr.toFixed(4)));
    }
  }
  
  return result;
}

/**
 * Bollinger Bands - Volatility bands around SMA
 * @param values - Array of price values
 * @param period - Period for SMA calculation (default 20)
 * @param stdDev - Standard deviation multiplier (default 2)
 * @returns Object with upper, middle (SMA), and lower bands
 */
export function calculateBollingerBands(
  values: number[],
  period: number = 20,
  stdDev: number = 2
): {
  upper: (number | null)[];
  middle: (number | null)[];
  lower: (number | null)[];
} {
  const middle = calculateSMA(values, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];
  
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1 || middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    
    // Calculate standard deviation for the period
    const slice = values.slice(i - period + 1, i + 1);
    const mean = middle[i] as number;
    const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
    const std = Math.sqrt(variance);
    
    upper.push(parseFloat((mean + stdDev * std).toFixed(2)));
    lower.push(parseFloat((mean - stdDev * std).toFixed(2)));
  }
  
  return { upper, middle, lower };
}

/**
 * Stochastic RSI - RSI applied to RSI values
 * @param values - Array of price values
 * @param rsiPeriod - RSI period (default 14)
 * @param stochPeriod - Stochastic period (default 14)
 * @param kSmooth - %K smoothing (default 3)
 * @param dSmooth - %D smoothing (default 3)
 * @returns Object with %K and %D lines
 */
export function calculateStochasticRSI(
  values: number[],
  rsiPeriod: number = 14,
  stochPeriod: number = 14,
  kSmooth: number = 3,
  dSmooth: number = 3
): {
  k: (number | null)[];
  d: (number | null)[];
} {
  // Step 1: Calculate RSI
  const rsiValues = calculateRSI(values, rsiPeriod);
  
  // Step 2: Apply Stochastic to RSI values
  const stochK: (number | null)[] = [];
  
  for (let i = 0; i < rsiValues.length; i++) {
    if (i < rsiPeriod + stochPeriod - 1 || rsiValues[i] === null) {
      stochK.push(null);
      continue;
    }
    
    // Get last 'stochPeriod' RSI values
    const rsiSlice = rsiValues.slice(i - stochPeriod + 1, i + 1).filter((v): v is number => v !== null);
    
    if (rsiSlice.length < stochPeriod) {
      stochK.push(null);
      continue;
    }
    
    const maxRSI = Math.max(...rsiSlice);
    const minRSI = Math.min(...rsiSlice);
    const currentRSI = rsiValues[i] as number;
    
    if (maxRSI === minRSI) {
      stochK.push(50); // Avoid division by zero
    } else {
      const stoch = ((currentRSI - minRSI) / (maxRSI - minRSI)) * 100;
      stochK.push(parseFloat(stoch.toFixed(2)));
    }
  }
  
  // Step 3: Smooth %K with SMA
  const k = calculateSMA(stochK.filter((v): v is number => v !== null), kSmooth);
  
  // Step 4: Calculate %D as SMA of %K
  const d = calculateSMA(k.filter((v): v is number => v !== null), dSmooth);
  
  // Align array lengths
  const maxLength = values.length;
  while (k.length < maxLength) k.unshift(null);
  while (d.length < maxLength) d.unshift(null);
  
  return { k, d };
}

/**
 * On Balance Volume (OBV) - Cumulative volume indicator
 * @param closes - Array of closing prices
 * @param volumes - Array of volumes
 * @returns Array with OBV values
 */
export function calculateOBV(closes: number[], volumes: number[]): number[] {
  if (closes.length !== volumes.length) {
    throw new Error('OBV: closes and volumes must have the same length');
  }
  
  const obv: number[] = [];
  let cumulative = 0;
  
  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      obv.push(volumes[i]);
      cumulative = volumes[i];
    } else {
      if (closes[i] > closes[i - 1]) {
        cumulative += volumes[i];
      } else if (closes[i] < closes[i - 1]) {
        cumulative -= volumes[i];
      }
      // If closes[i] === closes[i - 1], OBV unchanged
      obv.push(cumulative);
    }
  }
  
  return obv;
}

/**
 * Volume Moving Average
 * @param volumes - Array of volume values
 * @param period - Period for MA calculation (default 20)
 * @returns Array with Volume MA values
 */
export function calculateVolumeMA(volumes: number[], period: number = 20): (number | null)[] {
  return calculateSMA(volumes, period);
}
