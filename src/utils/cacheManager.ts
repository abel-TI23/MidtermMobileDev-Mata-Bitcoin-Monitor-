/**
 * Cache Manager for API Rate-Limited Endpoints
 * 
 * Handles intelligent caching for APIs with daily call limits:
 * - CryptoQuant: 10 calls/day (every 2.4 hours)
 * - CryptoPanic: 500 calls/day (every 30 minutes for safety)
 * - Blockchain.com: Unlimited (every 10 minutes)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxCallsPerDay?: number;
  storageKey: string;
}

/**
 * Generic cache manager with persistent storage
 */
export class CacheManager<T> {
  private config: CacheConfig;
  private memoryCache: CacheEntry<T> | null = null;
  private callLog: number[] = []; // Timestamps of API calls
  
  constructor(config: CacheConfig) {
    this.config = config;
  }
  
  /**
   * Get cached data or fetch new data
   */
  async get(fetchFn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    
    // Check memory cache first (fastest)
    if (this.memoryCache && this.memoryCache.expiresAt > now) {
      console.log(`📦 Cache HIT (memory): ${this.config.storageKey}`);
      return this.memoryCache.data;
    }
    
    // Check persistent storage
    try {
      const stored = await AsyncStorage.getItem(this.config.storageKey);
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored);
        if (entry.expiresAt > now) {
          console.log(`📦 Cache HIT (storage): ${this.config.storageKey}`);
          this.memoryCache = entry; // Update memory cache
          return entry.data;
        }
      }
    } catch (error) {
      console.warn(`⚠️ Cache read error for ${this.config.storageKey}:`, error);
    }
    
    // Cache miss - check rate limit before fetching
    if (this.config.maxCallsPerDay) {
      this.cleanOldCallLogs();
      if (this.callLog.length >= this.config.maxCallsPerDay) {
        console.warn(`⚠️ Rate limit reached for ${this.config.storageKey} (${this.config.maxCallsPerDay}/day)`);
        
        // Return stale data if available
        if (this.memoryCache) {
          console.log(`📦 Returning STALE cache: ${this.config.storageKey}`);
          return this.memoryCache.data;
        }
        
        throw new Error(`Rate limit exceeded for ${this.config.storageKey}`);
      }
    }
    
    // Fetch new data
    console.log(`🌐 Cache MISS - Fetching: ${this.config.storageKey}`);
    const data = await fetchFn();
    
    // Update cache
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + this.config.ttl,
    };
    
    this.memoryCache = entry;
    this.callLog.push(now);
    
    // Persist to storage
    try {
      await AsyncStorage.setItem(this.config.storageKey, JSON.stringify(entry));
    } catch (error) {
      console.warn(`⚠️ Cache write error for ${this.config.storageKey}:`, error);
    }
    
    return data;
  }
  
  /**
   * Manually clear cache
   */
  async clear(): Promise<void> {
    this.memoryCache = null;
    try {
      await AsyncStorage.removeItem(this.config.storageKey);
      console.log(`🗑️ Cache cleared: ${this.config.storageKey}`);
    } catch (error) {
      console.warn(`⚠️ Cache clear error for ${this.config.storageKey}:`, error);
    }
  }
  
  /**
   * Get cache info (for debugging)
   */
  async getInfo(): Promise<{
    hasCache: boolean;
    age?: number;
    expiresIn?: number;
    callsToday: number;
    remainingCalls?: number;
  }> {
    const now = Date.now();
    this.cleanOldCallLogs();
    
    let hasCache = false;
    let age: number | undefined;
    let expiresIn: number | undefined;
    
    if (this.memoryCache) {
      hasCache = true;
      age = now - this.memoryCache.timestamp;
      expiresIn = this.memoryCache.expiresAt - now;
    }
    
    return {
      hasCache,
      age,
      expiresIn,
      callsToday: this.callLog.length,
      remainingCalls: this.config.maxCallsPerDay
        ? this.config.maxCallsPerDay - this.callLog.length
        : undefined,
    };
  }
  
  /**
   * Remove call logs older than 24 hours
   */
  private cleanOldCallLogs(): void {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    this.callLog = this.callLog.filter(timestamp => timestamp > oneDayAgo);
  }
}

// ============================================================================
// Pre-configured Cache Instances
// ============================================================================

/**
 * CryptoQuant: 10 calls/day = every 2.4 hours
 */
export const cryptoQuantCache = {
  exchangeFlow: new CacheManager({
    ttl: 2.4 * 60 * 60 * 1000, // 2.4 hours
    maxCallsPerDay: 5, // Use 5 calls for exchange flow (half of daily limit)
    storageKey: '@mata_cryptoquant_exchange_flow',
  }),
  
  mvrv: new CacheManager({
    ttl: 2.4 * 60 * 60 * 1000, // 2.4 hours
    maxCallsPerDay: 5, // Use 5 calls for MVRV (other half)
    storageKey: '@mata_cryptoquant_mvrv',
  }),
};

/**
 * CryptoPanic: 500 calls/day = every ~3 minutes (but we use every 30 min for safety)
 */
export const cryptoPanicCache = new CacheManager({
  ttl: 30 * 60 * 1000, // 30 minutes
  maxCallsPerDay: 48, // 48 calls/day (2 per hour) - very conservative
  storageKey: '@mata_cryptopanic_news',
});

/**
 * Blockchain.com: Unlimited calls, cache for performance only
 */
export const blockchainComCache = {
  hashRate: new CacheManager({
    ttl: 10 * 60 * 1000, // 10 minutes
    storageKey: '@mata_blockchain_hashrate',
  }),
  
  mempool: new CacheManager({
    ttl: 1 * 60 * 1000, // 1 minute
    storageKey: '@mata_blockchain_mempool',
  }),
  
  difficulty: new CacheManager({
    ttl: 10 * 60 * 1000, // 10 minutes (difficulty changes ~every 2 weeks)
    storageKey: '@mata_blockchain_difficulty',
  }),
};

/**
 * Utility: Clear all caches
 */
export async function clearAllCaches(): Promise<void> {
  await Promise.all([
    cryptoQuantCache.exchangeFlow.clear(),
    cryptoQuantCache.mvrv.clear(),
    cryptoPanicCache.clear(),
    blockchainComCache.hashRate.clear(),
    blockchainComCache.mempool.clear(),
    blockchainComCache.difficulty.clear(),
  ]);
  console.log('🗑️ All caches cleared');
}

/**
 * Utility: Get cache stats for debugging
 */
export async function getCacheStats() {
  const [exchangeFlow, mvrv, cryptoPanic, hashRate, mempool, difficulty] = await Promise.all([
    cryptoQuantCache.exchangeFlow.getInfo(),
    cryptoQuantCache.mvrv.getInfo(),
    cryptoPanicCache.getInfo(),
    blockchainComCache.hashRate.getInfo(),
    blockchainComCache.mempool.getInfo(),
    blockchainComCache.difficulty.getInfo(),
  ]);
  
  return {
    cryptoQuant: { exchangeFlow, mvrv },
    cryptoPanic,
    blockchainCom: { hashRate, mempool, difficulty },
  };
}
