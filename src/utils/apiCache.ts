/**
 * Simple in-memory cache for API responses
 * Reduces redundant API calls for data that doesn't change frequently
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data or fetch new data
   * @param key - Cache key
   * @param fetcher - Function to fetch fresh data
   * @param ttl - Time to live in milliseconds
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    const cached = this.cache.get(key);
    const now = Date.now();

    // Return cached data if still fresh
    if (cached && now - cached.timestamp < ttl) {
      console.log(`✓ Cache HIT: ${key} (age: ${((now - cached.timestamp) / 1000).toFixed(1)}s)`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`⟳ Cache MISS: ${key} - fetching...`);
    try {
      const data = await fetcher();
      this.cache.set(key, { data, timestamp: now });
      return data;
    } catch (error) {
      // Return stale cache if fetch fails (graceful degradation)
      if (cached) {
        console.warn(`⚠️ Fetch failed for ${key}, returning stale cache`);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Manually invalidate cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    console.log(`🗑️ Cache invalidated: ${key}`);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    console.log('🗑️ All cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: ((Date.now() - entry.timestamp) / 1000).toFixed(1) + 's',
    }));
    return { size: this.cache.size, entries };
  }
}

// Singleton instance
export const apiCache = new SimpleCache();

// Cache TTL constants (in milliseconds)
export const CACHE_TTL = {
  FEAR_GREED: 30 * 1000,      // 30s - updates once per day
  DOMINANCE: 30 * 1000,       // 30s - slow changing
  ATR: 60 * 1000,             // 60s - 5min interval data
  RSI: 60 * 1000,             // 60s - 5min interval data
  MARKET_METRICS: 20 * 1000,  // 20s - relatively stable
  LONG_SHORT: 30 * 1000,      // 30s - 4h data
  FUNDING: 30 * 1000,         // 30s - 8h updates
};
