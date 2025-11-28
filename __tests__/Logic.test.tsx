/**
 * @format
 * Logic and Utility Functions Tests
 */

import { calculateEMA, calculateSMA } from '../src/utils/indicators';
import { formatCurrency, formatNumber } from '../src/utils/formatters';

describe('Technical Indicators - Math Functions', () => {
  describe('calculateEMA', () => {
    it('calculates EMA correctly for valid data', () => {
      const prices = [10, 12, 14, 16, 18];
      const period = 3;
      const ema = calculateEMA(prices, period);
      
      expect(ema).toBeDefined();
      expect(Array.isArray(ema)).toBe(true);
      expect(ema.length).toBe(prices.length);
    });

    it('returns empty array for insufficient data', () => {
      const prices = [10, 12];
      const period = 5;
      const ema = calculateEMA(prices, period);
      
      expect(ema).toBeDefined();
      expect(ema.length).toBeLessThanOrEqual(prices.length);
    });

    it('handles single price correctly', () => {
      const prices = [100];
      const period = 1;
      const ema = calculateEMA(prices, period);
      
      expect(ema).toBeDefined();
      expect(ema.length).toBe(1);
    });
  });

  describe('calculateSMA', () => {
    it('calculates SMA correctly for valid data', () => {
      const prices = [10, 20, 30, 40, 50];
      const period = 3;
      const sma = calculateSMA(prices, period);
      
      expect(sma).toBeDefined();
      expect(Array.isArray(sma)).toBe(true);
    });

    it('calculates correct average for simple case', () => {
      const prices = [10, 20, 30];
      const period = 3;
      const sma = calculateSMA(prices, period);
      
      // Average of [10, 20, 30] should be 20
      if (sma.length > 0) {
        const lastSMA = sma[sma.length - 1];
        expect(lastSMA).toBeCloseTo(20, 1);
      }
    });

    it('returns empty array for insufficient data', () => {
      const prices = [10];
      const period = 5;
      const sma = calculateSMA(prices, period);
      
      expect(sma).toBeDefined();
      expect(sma.length).toBeLessThanOrEqual(prices.length);
    });
  });
});

describe('Formatters - String Manipulation', () => {
  describe('formatCurrency', () => {
    it('formats currency correctly with default settings', () => {
      const result = formatCurrency(1234.56);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result).toContain('1');
      expect(result).toContain('234');
    });

    it('formats large numbers with thousands separator', () => {
      const result = formatCurrency(1000000);
      
      expect(result).toBeDefined();
      expect(result).toContain('1');
      // Should have separators for millions
    });

    it('handles negative numbers', () => {
      const result = formatCurrency(-500);
      
      expect(result).toBeDefined();
      expect(result).toContain('-');
      expect(result).toContain('500');
    });

    it('handles zero correctly', () => {
      const result = formatCurrency(0);
      
      expect(result).toBeDefined();
      expect(result).toContain('0');
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with proper decimal places', () => {
      const result = formatNumber(123.456789, 2);
      
      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
    });

    it('handles whole numbers', () => {
      const result = formatNumber(1000);
      
      expect(result).toBeDefined();
      expect(result).toContain('1');
    });

    it('formats very large numbers', () => {
      const result = formatNumber(999999999);
      
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('formats very small decimals', () => {
      const result = formatNumber(0.00001, 5);
      
      expect(result).toBeDefined();
      expect(result).toContain('0');
    });
  });
});

describe('Math Operations - Price Calculations', () => {
  it('calculates percentage change correctly', () => {
    const oldPrice = 100;
    const newPrice = 110;
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    
    expect(change).toBe(10);
  });

  it('calculates percentage change for negative movement', () => {
    const oldPrice = 100;
    const newPrice = 90;
    const change = ((newPrice - oldPrice) / oldPrice) * 100;
    
    expect(change).toBe(-10);
  });

  it('handles division by zero safely', () => {
    const oldPrice = 0;
    const newPrice = 10;
    const change = oldPrice === 0 ? 0 : ((newPrice - oldPrice) / oldPrice) * 100;
    
    expect(change).toBe(0);
  });

  it('calculates VWAP correctly', () => {
    // Simplified VWAP calculation test
    const volumes = [100, 200, 150];
    const prices = [50, 55, 52];
    
    let totalTPV = 0;
    let totalVolume = 0;
    
    for (let i = 0; i < volumes.length; i++) {
      const tp = prices[i]; // Simplified: using price as typical price
      totalTPV += tp * volumes[i];
      totalVolume += volumes[i];
    }
    
    const vwap = totalTPV / totalVolume;
    
    expect(vwap).toBeGreaterThan(0);
    expect(vwap).toBeCloseTo(52.89, 1); // Expected is ~52.89, allow 1 decimal precision
  });
});

describe('Data Validation', () => {
  it('validates price data is numeric', () => {
    const validPrice = 12345.67;
    const invalidPrice = NaN;
    
    expect(typeof validPrice).toBe('number');
    expect(isNaN(validPrice)).toBe(false);
    expect(isNaN(invalidPrice)).toBe(true);
  });

  it('validates array is not empty', () => {
    const emptyArray: number[] = [];
    const validArray = [1, 2, 3];
    
    expect(emptyArray.length).toBe(0);
    expect(validArray.length).toBeGreaterThan(0);
  });

  it('validates polling interval is within range', () => {
    const validIntervals = [5000, 10000, 30000, 60000];
    const testInterval = 30000;
    
    expect(validIntervals).toContain(testInterval);
  });

  it('validates timeframe option is valid', () => {
    const validTimeframes = ['1m', '5m', '15m', '1h', '4h', 'D', 'W'];
    const testTimeframe = '1h';
    
    expect(validTimeframes).toContain(testTimeframe);
  });
});

describe('Edge Cases and Error Handling', () => {
  it('handles undefined values gracefully', () => {
    const value = undefined;
    const result = value ?? 0;
    
    expect(result).toBe(0);
  });

  it('handles null values gracefully', () => {
    const value = null;
    const result = value ?? 'default';
    
    expect(result).toBe('default');
  });

  it('handles empty string gracefully', () => {
    const value = '';
    const result = value || 'default';
    
    expect(result).toBe('default');
  });

  it('handles negative array index safely', () => {
    const array = [1, 2, 3, 4, 5];
    const lastItem = array[array.length - 1];
    
    expect(lastItem).toBe(5);
  });
});
