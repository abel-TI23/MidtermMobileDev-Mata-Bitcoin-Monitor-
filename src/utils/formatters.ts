/**
 * Number and Currency Formatters
 */

export function formatCurrency(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0';
  
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatNumber(value: number, decimals?: number): string {
  if (isNaN(value)) return '0';
  
  if (decimals !== undefined) {
    return value.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  }
  
  return value.toLocaleString('en-US');
}

export function formatPercentage(value: number, decimals: number = 2): string {
  if (isNaN(value)) return '0%';
  
  return `${value.toFixed(decimals)}%`;
}

export function formatLargeNumber(value: number): string {
  if (isNaN(value)) return '0';
  
  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`;
  }
  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`;
  }
  if (value >= 1e3) {
    return `${(value / 1e3).toFixed(2)}K`;
  }
  
  return value.toFixed(2);
}
