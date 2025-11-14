/**
 * Performance Configuration
 * Centralized refresh intervals and optimization settings
 */

export const REFRESH_INTERVALS = {
  // Real-time data (via WebSocket - event-driven, no polling)
  PRICE_UPDATES: 0, // WebSocket handles this
  CANDLE_UPDATES: 0, // WebSocket handles this
  
  // Periodic refresh for less critical data
  FEAR_GREED_INDEX: 30 * 60 * 1000, // 30 minutes (updates daily anyway)
  MARKET_METRICS: 5 * 60 * 1000, // 5 minutes (Open Interest, Liquidations)
  TOP_GAINERS_LOSERS: 60 * 1000, // 1 minute (market movers)
  BTC_DOMINANCE: 10 * 60 * 1000, // 10 minutes (slow-changing metric)
  
  // Fallback polling (only when WebSocket fails)
  FALLBACK_POLLING: 15000, // 15 seconds
} as const;

export const PERFORMANCE_SETTINGS = {
  // Candle history limits per timeframe
  MAX_CANDLES: {
    '1m': 120,
    '5m': 144,
    '15m': 192,
    '1h': 168,
    '4h': 180,
    '1d': 365,
  },
  
  // Component render optimization
  CHART_THROTTLE_MS: 100, // Throttle chart updates
  INDICATOR_RECALC_DEBOUNCE: 200, // Debounce indicator calculations
  
  // Network optimization
  API_TIMEOUT: 12000, // 12 second timeout
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 3000,
  
  // Memory management
  MAX_STORED_CANDLES: 500, // Prevent memory bloat
  CLEANUP_THRESHOLD: 1000, // Clean up if exceeds this
} as const;

/**
 * Optimization Tips:
 * 
 * 1. WebSocket First: Always prefer WebSocket over REST polling
 * 2. Batch Updates: Group state updates to reduce re-renders
 * 3. Memoization: Use useMemo/useCallback for expensive calculations
 * 4. Component Memo: Wrap heavy components with React.memo()
 * 5. Lazy Loading: Load market metrics on-demand, not on mount
 * 6. Smart Intervals: Different refresh rates for different data types
 * 7. Error Handling: Fallback gracefully to prevent cascade failures
 */
