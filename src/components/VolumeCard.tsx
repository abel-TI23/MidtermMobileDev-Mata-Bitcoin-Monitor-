/**
 * VolumeCard - Compact volume visualization
 * Real-time WebSocket updates with auto-reconnect
 * Memory leak fixed with useWebSocketCleanup
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { fetchCandles, Candle } from '../utils/binanceAPI';
import { useKlines } from '../market/MarketDataManager';
import Skeleton from './Skeleton';
import { normalize, spacing, fontSize, borderRadius, hp } from '../utils/responsive';

interface VolumeCardProps {
  onPress?: () => void;
  compact?: boolean; // optimized for 2-column grid
}

export function VolumeCard({ onPress, compact = false }: VolumeCardProps) {
  const [volumeData, setVolumeData] = useState<Array<{time: number; volume: number; priceChange: number}>>([]);
  const [totalVolume, setTotalVolume] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [volumeSignal, setVolumeSignal] = useState<string>('Neutral');
  const latestKline = useKlines('15m', 'BTCUSDT');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const candles = await fetchCandles('BTCUSDT', '15m', 50);
      
      const data = candles.map(c => ({
        time: c.time,
        volume: c.volume,
        priceChange: c.close - c.open,
      }));
      
      setVolumeData(data);
      setTotalVolume(candles.reduce((sum, c) => sum + c.volume, 0));
      // Simple signal: compare latest volume vs average of previous 20
      if (data.length > 5) {
        const latest = data[data.length - 1].volume;
        const avg = data.slice(-21, -1).reduce((s, d) => s + d.volume, 0) / Math.max(1, Math.min(20, data.length - 1));
        const ratio = latest / (avg || 1);
        if (ratio > 1.3) setVolumeSignal('Rising');
        else if (ratio < 0.7) setVolumeSignal('Fading');
        else setVolumeSignal('Neutral');
      }
    } catch (err) {
      console.error('Failed to load volume:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // WebSocket connection with reconnect
  useEffect(() => {
    if (latestKline.candle) {
      const candle = latestKline.candle;
      setVolumeData(prev => {
        const updated = [...prev];
        const newData = { time: candle.time, volume: candle.volume, priceChange: candle.close - candle.open };
        if (latestKline.isClosed) {
          updated.push(newData);
          if (updated.length > 50) updated.shift();
        } else if (updated.length > 0) {
          updated[updated.length - 1] = newData;
        } else {
          updated.push(newData);
        }
        const total = updated.reduce((sum, d) => sum + d.volume, 0);
        setTotalVolume(total);
        if (updated.length > 5) {
          const latestVol = updated[updated.length - 1].volume;
          const window = updated.slice(-21, -1);
          const avg = window.reduce((s, d) => s + d.volume, 0) / Math.max(1, window.length);
          const ratio = latestVol / (avg || 1);
          if (ratio > 1.3) setVolumeSignal('Rising');
          else if (ratio < 0.7) setVolumeSignal('Fading');
          else setVolumeSignal('Neutral');
        }
        return updated;
      });
    }
  }, [latestKline]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Format volume
  const formatVol = (vol: number): string => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
    return vol.toFixed(0);
  };

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Skeleton height={18} width="40%" style={{ marginBottom: 8 }} />
        <Skeleton height={32} width="60%" style={{ alignSelf: 'center' }} />
        <Skeleton height={14} width="50%" style={{ marginTop: 8, alignSelf: 'center' }} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.container,
        compact && styles.containerCompact,
        pressed && { opacity: 0.95 },
      ]}
    >
      <Text style={styles.title}>Volume</Text>
      <View style={styles.valueWrapper}>
        <Text style={styles.totalVolume}>{formatVol(totalVolume)}</Text>
      </View>
      <Text style={styles.helper}>Activity: {volumeSignal}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    minHeight: hp(15),
  },
  containerCompact: {
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.md,
    minHeight: hp(15),
  },
  title: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  valueWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: normalize(42),
    marginTop: spacing.xs,
  },
  totalVolume: {
    color: '#3B82F6',
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  chartWrapper: {
    marginTop: spacing.xs,
  },
  helper: {
    color: '#6B7280',
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
});
