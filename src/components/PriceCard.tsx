/**
 * PriceCard Component
 * Hero card with BTC price + real-time sparkline
 * WebSocket updates for instant price changes with auto-reconnect
 * Memory leak fixed with useWebSocketCleanup
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { SimplePriceChart } from './SimplePriceChart';
import { fetchCandles, Candle, fetchTicker24h } from '../utils/binanceAPI';
import { useTicker, useKlines, marketDataManager } from '../market/MarketDataManager';
import Skeleton from './Skeleton';

interface PriceCardProps {
  onPress?: () => void;
}

const PriceCard: React.FC<PriceCardProps> = ({ onPress }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<any>(null);
  const lastTickRef = useRef<number>(0);
  const ticker = useTicker('BTCUSDT');
  const latestKline = useKlines('1m', 'BTCUSDT');
  const changeAnim = useRef(new Animated.Value(0)).current;
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  // Fetch initial candles
  const loadCandles = useCallback(async () => {
    try {
      setLoading(true);
      // Use 1m for a more dynamic sparkline
      const data = await fetchCandles('BTCUSDT', '1m', 180);
      setCandles(data);
      
      if (data.length > 0) {
        const latest = data[data.length - 1];
        setCurrentPrice(latest.close);
        setPriceHistory(data.slice(-120).map(c => c.close));
        
        if (data.length >= 1440) {
          const dayAgo = data[data.length - 1440];
          const change = ((latest.close - dayAgo.close) / dayAgo.close) * 100;
          setPriceChange(change);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Failed to load candles:', err);
      setError('Failed to load price data');
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection using shared helper
  // React to shared kline/ticker updates
  useEffect(() => {
    if (latestKline.candle) {
      const c = latestKline.candle;
      setCurrentPrice(c.close);
      setCandles(prev => {
        if (prev.length === 0) return [c];
        const updated = [...prev];
        if (latestKline.isClosed) {
          updated.push(c);
          if (updated.length > 300) updated.shift();
        } else {
          updated[updated.length - 1] = c;
        }
        return updated;
      });
      setPriceHistory(prev => {
        const base = prev.length ? prev : candles.slice(-120).map(cd => cd.close);
        const arr = [...base];
        if (arr.length > 0) arr[arr.length - 1] = c.close; else arr.push(c.close);
        return arr.slice(-120);
      });
      lastTickRef.current = Date.now();
    }
  }, [latestKline, candles]);

  useEffect(() => {
    if (ticker.price) {
      setCurrentPrice(ticker.price);
      setPriceChange(ticker.priceChange);
      setPriceHistory(prev => [...prev, ticker.price].slice(-120));
      lastTickRef.current = Date.now();
      changeAnim.stopAnimation();
      changeAnim.setValue(0);
      Animated.timing(changeAnim, { toValue: 1, duration: 240, useNativeDriver: true }).start(() => {
        Animated.timing(changeAnim, { toValue: 0, duration: 240, useNativeDriver: true }).start();
      });
    }
  }, [ticker, changeAnim]);

  useEffect(() => {
    loadCandles();
    marketDataManager.setDebug(false);
  }, [loadCandles]);

  useEffect(() => {
    pollRef.current = setInterval(() => {
      const staleFor = Date.now() - (lastTickRef.current || 0);
      if (staleFor > 15000) {
        fetchTicker24h('BTCUSDT').then(t => {
          setCurrentPrice(t.price);
          setPriceChange(t.priceChange);
          setPriceHistory(prev => [...prev, t.price].slice(-120));
          lastTickRef.current = Date.now();
        }).catch(() => {});
      }
    }, 15000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const priceColor = priceChange >= 0 ? '#10B981' : '#EF4444';
  const changeBadgeStyle = useMemo(() => ({
    backgroundColor: priceChange >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
    borderColor: priceChange >= 0 ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.35)',
  }), [priceChange]);

  const closePrices = useMemo(() => priceHistory, [priceHistory]);
  const formattedPrice = useMemo(
    () =>
      Number.isFinite(currentPrice)
        ? currentPrice.toLocaleString('id-ID', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '0,00',
    [currentPrice]
  );

  // Loading skeleton
  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton height={20} width="50%" style={{ marginBottom: 6 }} />
        <Skeleton height={150} width="100%" />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <Pressable onPress={loadCandles} style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.container,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 },
      ]}
    >
      {/* Header with Icon + Label + Change */}
      <View style={styles.headerRow}>
        <View style={styles.iconLabelRow}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>B</Text>
          </View>
          <Text style={styles.label}>BTC</Text>
        </View>
        <View style={[styles.changeBadge, changeBadgeStyle]}>
          <Text style={[styles.changePercent, { color: priceColor }]}> {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% </Text>
        </View>
      </View>

      {/* Large Price */}
      <Animated.View style={{ marginBottom: 12, opacity: changeAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }), transform: [{ translateY: changeAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }}>
        <Text style={styles.price}>${formattedPrice}</Text>
      </Animated.View>

      {closePrices.length > 0 && (
        <View style={styles.chartContainer}>
      <SimplePriceChart data={closePrices} height={80} color={priceColor} smooth />
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    color: '#F9FAFB',
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  changePercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  price: {
    color: '#F9FAFB',
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: -1,
  },
  priceCents: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  chartContainer: {
    marginHorizontal: -10,
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default React.memo(PriceCard);
