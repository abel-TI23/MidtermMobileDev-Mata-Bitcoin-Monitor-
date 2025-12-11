/**
 * ATRCard - Compact ATR visualization
 * Updates every 30 seconds
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
// Inline chart removed for compact summary card
import { fetchCandles } from '../utils/binanceAPI';
import { calculateATR } from '../utils/indicators';
import Skeleton from './Skeleton';
import { normalize, spacing, fontSize, borderRadius, hp } from '../utils/responsive';

interface ATRCardProps {
  onPress?: () => void;
  compact?: boolean; // optimized for 2-column grid
}

export function ATRCard({ onPress, compact = false }: ATRCardProps) {
  const [atrData, setAtrData] = useState<Array<{time: number; atr: number}>>([]);
  const [currentATR, setCurrentATR] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const candles = await fetchCandles('BTCUSDT', '1h', 50);
      
      const highs = candles.map(c => c.high);
      const lows = candles.map(c => c.low);
      const closes = candles.map(c => c.close);
      
      const atrValues = calculateATR(highs, lows, closes, 14);
      
      const data = candles.map((c, i) => ({
        time: c.time,
        atr: atrValues[i] || 0,
      })).filter(d => d.atr > 0);
      
      setAtrData(data);
      if (data.length > 0) {
        setCurrentATR(data[data.length - 1].atr);
      }
    } catch (err) {
      console.error('Failed to load ATR:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    
    // Update every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

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
      <Text style={styles.titleCentered}>ATR</Text>
      <View style={styles.valueWrapper}>
        <Text style={styles.value}>{currentATR.toFixed(2)}</Text>
      </View>
      <Text style={styles.helperCentered}>Avg volatility (14)</Text>
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
  titleCentered: { textAlign: 'center', color: '#F9FAFB', fontSize: fontSize.lg, fontWeight: '700' },
  valueWrapper: { alignItems: 'center', justifyContent: 'center', minHeight: normalize(42), marginTop: spacing.xs },
  title: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  value: {
    color: '#F59E0B',
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  footnote: {
    color: '#6B7280',
    fontSize: fontSize.xs,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  chartWrapper: {
    marginTop: spacing.xs,
  },
  helper: { color: '#6B7280', fontSize: fontSize.sm, marginTop: spacing.xs, fontWeight: '600' },
  helperCentered: { color: '#6B7280', fontSize: fontSize.sm, marginTop: spacing.xs, fontWeight: '600', textAlign: 'center' },
});
