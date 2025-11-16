/**
 * OrderBookHeatmap - Visualize BTC price levels with order concentration
 * Shows where large orders are "parked" to identify support/resistance
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme';
import { useWebSocketCleanup } from '../hooks/useWebSocketCleanup';
import { useAppStateReconnect } from '../hooks/useAppStateReconnect';

interface PriceLevel {
  price: number;
  bidSize: number;
  askSize: number;
  totalSize: number;
}

interface OrderBookHeatmapProps {
  symbol?: string;
  bucketSize?: number; // Price bucket size (default: $100)
  numLevels?: number; // Number of price levels to show
  minOrderSize?: number; // Minimum BTC order size to filter (default: 0.5 BTC)
}

export function OrderBookHeatmap({ 
  symbol = 'BTCUSDT',
  bucketSize = 50,
  numLevels = 25,
  minOrderSize = 0.1, // Lower threshold - 0.1 BTC minimum
}: OrderBookHeatmapProps) {
  const [priceLevels, setPriceLevels] = useState<PriceLevel[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [maxSize, setMaxSize] = useState<number>(0);
  const [filteredOrderCount, setFilteredOrderCount] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  // Fetch current price (extracted as useCallback)
  const fetchCurrentPrice = useCallback(async () => {
    try {
      const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      if (data.price) {
        setCurrentPrice(parseFloat(data.price));
      }
    } catch (error) {
      console.error('Error fetching price:', error);
    }
  }, [symbol]);

  // Aggregate order book with configurable filter
  const aggregateOrderBook = useCallback((bids: string[][], asks: string[][]) => {
    const buckets: Map<number, PriceLevel> = new Map();
    let filteredCount = 0;

    console.log(`[Heatmap] Processing ${bids.length} bids, ${asks.length} asks, minSize: ${minOrderSize}`);

    // Process bids (support levels)
    bids.forEach(([priceStr, sizeStr]) => {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      
      // Filter: only track orders >= minOrderSize BTC
      if (minOrderSize > 0 && size < minOrderSize) {
        filteredCount++;
        return;
      }
      
      const bucketPrice = Math.floor(price / bucketSize) * bucketSize;

      if (!buckets.has(bucketPrice)) {
        buckets.set(bucketPrice, {
          price: bucketPrice,
          bidSize: 0,
          askSize: 0,
          totalSize: 0,
        });
      }

      const bucket = buckets.get(bucketPrice)!;
      bucket.bidSize += size;
      bucket.totalSize += size;
    });

    // Process asks (resistance levels)
    asks.forEach(([priceStr, sizeStr]) => {
      const price = parseFloat(priceStr);
      const size = parseFloat(sizeStr);
      
      // Filter: only track orders >= minOrderSize BTC
      if (minOrderSize > 0 && size < minOrderSize) {
        filteredCount++;
        return;
      }
      
      const bucketPrice = Math.floor(price / bucketSize) * bucketSize;

      if (!buckets.has(bucketPrice)) {
        buckets.set(bucketPrice, {
          price: bucketPrice,
          bidSize: 0,
          askSize: 0,
          totalSize: 0,
        });
      }

      const bucket = buckets.get(bucketPrice)!;
      bucket.askSize += size;
      bucket.totalSize += size;
    });

    // Convert to array and sort by price
    const levels = Array.from(buckets.values())
      .filter(level => level.totalSize > 0) // Only show levels with orders
      .sort((a, b) => b.price - a.price)
      .slice(0, numLevels);

    console.log(`[Heatmap] Result: ${levels.length} levels, filtered: ${filteredCount}, maxSize: ${Math.max(...levels.map(l => l.totalSize), 0).toFixed(2)}`);

    // Find max size for normalization
    const max = Math.max(...levels.map((l) => l.totalSize), 1); // Prevent division by zero
    setMaxSize(max);
    setPriceLevels(levels);
    setFilteredOrderCount(filteredCount);
  }, [bucketSize, numLevels, minOrderSize]);

  // Connect WebSocket
  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.b && data.a) {
          aggregateOrderBook(data.b, data.a);
        }
      } catch (error) {
        console.error('Error processing orderbook data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }, [symbol, aggregateOrderBook]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useWebSocketCleanup(wsRef, connectWebSocket);

  // Auto-reconnect on app resume (keep untuk ensure reconnect after background)
  useAppStateReconnect(connectWebSocket);

  useEffect(() => {
    fetchCurrentPrice();
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol, fetchCurrentPrice, connectWebSocket]);

  const getHeatmapColor = (size: number, isBid: boolean) => {
    const intensity = maxSize > 0 ? size / maxSize : 0;
    
    if (isBid) {
      // Green for bids (support)
      const opacity = Math.max(0.15, intensity * 0.85);
      return `rgba(34, 197, 94, ${opacity})`;
    } else {
      // Red for asks (resistance)
      const opacity = Math.max(0.15, intensity * 0.85);
      return `rgba(239, 68, 68, ${opacity})`;
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  };

  const formatSize = (size: number) => {
    if (size >= 100) return `${size.toFixed(0)} BTC`;
    if (size >= 10) return `${size.toFixed(1)} BTC`;
    return `${size.toFixed(2)} BTC`;
  };

  const getStrengthLabel = (size: number) => {
    const intensity = maxSize > 0 ? size / maxSize : 0;
    if (intensity > 0.7) return 'Very Strong';
    if (intensity > 0.5) return 'Strong';
    if (intensity > 0.3) return 'Moderate';
    if (intensity > 0.15) return 'Weak';
    return 'Very Weak';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Order Book Heatmap</Text>
        <View style={styles.headerBadges}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoText}>${bucketSize} levels</Text>
          </View>
          <View style={[styles.infoBadge, { backgroundColor: 'rgba(34, 197, 94, 0.2)' }]}>
            <Text style={[styles.infoText, { color: '#22C55E' }]}>≥{minOrderSize.toFixed(1)} BTC</Text>
          </View>
        </View>
      </View>

      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(34, 197, 94, 0.6)' }]} />
          <Text style={styles.legendText}>Support (Bids)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendBox, { backgroundColor: 'rgba(239, 68, 68, 0.6)' }]} />
          <Text style={styles.legendText}>Resistance (Asks)</Text>
        </View>
      </View>

      {priceLevels.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>⏳ Loading heatmap data...</Text>
          <Text style={styles.emptySubtext}>
            Tracking orders ≥ {minOrderSize} BTC
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.heatmapContainer} showsVerticalScrollIndicator={false}>
        {priceLevels.map((level, index) => {
          const isNearCurrentPrice = currentPrice > 0 && 
            Math.abs(level.price - currentPrice) < bucketSize * 2;
          
          return (
            <View key={`${level.price}-${index}`} style={styles.levelRow}>
              <View style={styles.priceColumn}>
                <Text style={[
                  styles.priceText,
                  isNearCurrentPrice && styles.currentPriceText
                ]}>
                  {formatPrice(level.price)}
                </Text>
                {isNearCurrentPrice && (
                  <View style={styles.currentPriceBadge}>
                    <Text style={styles.currentPriceBadgeText}>CURRENT</Text>
                  </View>
                )}
              </View>

              <View style={styles.barContainer}>
                {/* Bid bar (left side - green) */}
                {level.bidSize > 0 && (
                  <View style={styles.bidBarWrapper}>
                    <View
                      style={[
                        styles.bidBar,
                        {
                          width: `${(level.bidSize / maxSize) * 100}%`,
                          backgroundColor: getHeatmapColor(level.bidSize, true),
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{formatSize(level.bidSize)}</Text>
                  </View>
                )}

                {/* Ask bar (right side - red) */}
                {level.askSize > 0 && (
                  <View style={styles.askBarWrapper}>
                    <Text style={styles.barLabel}>{formatSize(level.askSize)}</Text>
                    <View
                      style={[
                        styles.askBar,
                        {
                          width: `${(level.askSize / maxSize) * 100}%`,
                          backgroundColor: getHeatmapColor(level.askSize, false),
                        },
                      ]}
                    />
                  </View>
                )}
              </View>

              <View style={styles.strengthColumn}>
                <Text style={styles.strengthText}>
                  {getStrengthLabel(level.totalSize)}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoBoxTitle}>Order Concentration Analysis</Text>
        <Text style={styles.infoBoxText}>
          • Tracking orders ≥ {minOrderSize} BTC at ${bucketSize} price levels{'\n'}
          • Darker colors = Higher concentration of orders{'\n'}
          • Green (left) = Buy walls (support){'\n'}
          • Red (right) = Sell walls (resistance){'\n'}
          • Strong levels may act as price magnets or barriers
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  infoBadge: {
    backgroundColor: 'rgba(147, 51, 234, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  infoText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 11,
    color: colors.textMuted,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  heatmapContainer: {
    maxHeight: 400,
    marginBottom: 12,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  priceColumn: {
    width: 80,
    alignItems: 'flex-start',
  },
  priceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  currentPriceText: {
    color: '#3B82F6',
  },
  currentPriceBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  currentPriceBadgeText: {
    fontSize: 8,
    color: '#3B82F6',
    fontWeight: '800',
  },
  barContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 2,
  },
  bidBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  askBarWrapper: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 4,
  },
  bidBar: {
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  askBar: {
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  barLabel: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '700',
  },
  strengthColumn: {
    width: 70,
    alignItems: 'flex-end',
  },
  strengthText: {
    fontSize: 9,
    color: colors.textMuted,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(147, 51, 234, 0.2)',
  },
  infoBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
    marginBottom: 4,
  },
  infoBoxText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
