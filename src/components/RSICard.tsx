/**
 * RSICard - Compact RSI visualization
 * Updates every 30 seconds
 */

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { fetchCandles } from '../utils/binanceAPI';
import { calculateRSI } from '../utils/indicators';
import Skeleton from './Skeleton';
import { normalize, spacing, fontSize, borderRadius, hp } from '../utils/responsive';

interface RSICardProps {
  onPress?: () => void;
  compact?: boolean; // optimized for 2-column grid
}

export function RSICard({ onPress, compact = false }: RSICardProps) {
  const [rsiData, setRsiData] = useState<Array<{time: number; rsi: number}>>([]);
  const [currentRSI, setCurrentRSI] = useState<number>(0);
  const [signal, setSignal] = useState<string>('Neutral');
  const [signalColor, setSignalColor] = useState<string>('#6B7280');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const candles = await fetchCandles('BTCUSDT', '1h', 50);
      
      const closes = candles.map(c => c.close);
      const rsiValues = calculateRSI(closes, 14);
      
      const data = candles.map((c, i) => ({
        time: c.time,
        rsi: rsiValues[i] || 50,
      })).filter(d => d.rsi > 0);
      
      setRsiData(data);
      
      if (data.length > 0) {
        const latest = data[data.length - 1].rsi;
        setCurrentRSI(latest);
        
        if (latest >= 70) {
          setSignal('Overbought');
          setSignalColor('#EF4444');
        } else if (latest <= 30) {
          setSignal('Oversold');
          setSignalColor('#10B981');
        } else {
          setSignal('Neutral');
          setSignalColor('#6B7280');
        }
      }
    } catch (err) {
      console.error('Failed to load RSI:', err);
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
      <Text style={styles.titleCentered}>RSI</Text>
      <View style={styles.valueWrapper}>
        <Text style={[styles.value, { color: '#8B5CF6' }]}>{currentRSI.toFixed(0)}</Text>
      </View>
      <Text style={[styles.signalTextCentered, { color: signalColor }]}>{signal}</Text>
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
  titleCentered: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
  },
  valueWrapper: { alignItems: 'center', justifyContent: 'center', minHeight: normalize(42), marginTop: spacing.xs },
  title: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  value: {
    color: '#8B5CF6',
    fontSize: fontSize.xxl,
    fontWeight: '700',
  },
  signalText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginTop: spacing.xs,
  },
  signalTextCentered: { fontSize: fontSize.sm, fontWeight: '700', marginTop: spacing.xs, textAlign: 'center' },
});
