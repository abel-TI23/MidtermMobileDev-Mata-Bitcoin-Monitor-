import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import {
  fetchOpenInterestFutures,
  fetchLiquidations,
  fetchLongShortRatio,
} from '../utils/binanceAPI';
import Skeleton from './Skeleton';

interface MarketMetricsCardProps {
  onPress?: () => void;
}

export function MarketMetricsCard({ onPress }: MarketMetricsCardProps) {
  const [openInterest, setOpenInterest] = useState<string>('--');
  const [liquidations, setLiquidations] = useState<{ long: number; short: number }>({ long: 0, short: 0 });
  const [longShortRatio, setLongShortRatio] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [oiData, liqData, lsData] = await Promise.all([
        fetchOpenInterestFutures('BTCUSDT'),
        fetchLiquidations('BTCUSDT', 100),
        fetchLongShortRatio('BTCUSDT', '5m', 1),
      ]);

      const oiValue = oiData.openInterest;
      if (oiValue >= 1000000000) {
        const billions = (oiValue / 1000000000).toFixed(2);
        setOpenInterest('$' + billions + 'B');
      } else if (oiValue >= 1000000) {
        const millions = (oiValue / 1000000).toFixed(2);
        setOpenInterest('$' + millions + 'M');
      } else {
        setOpenInterest('$' + oiValue.toFixed(0));
      }

      const longLiq = liqData.filter(l => l.side === 'SELL').reduce((sum, l) => sum + l.origQty, 0);
      const shortLiq = liqData.filter(l => l.side === 'BUY').reduce((sum, l) => sum + l.origQty, 0);
      setLiquidations({ long: longLiq, short: shortLiq });

      if (lsData.length > 0) {
        setLongShortRatio(lsData[0].longShortRatio);
      }
    } catch (err) {
      console.error('Failed to load market metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // 30s instead of 10s
    return () => clearInterval(interval);
  }, [loadData]);

  const lsColor = longShortRatio > 1 ? '#10B981' : '#EF4444';
  const lsSentiment = longShortRatio > 1 ? 'Bullish' : 'Bearish';

  if (loading) {
    return (
      <View style={styles.container}>
        <Skeleton height={20} width="60%" style={{ marginBottom: 12 }} />
        <View style={styles.grid}>
          <Skeleton height={60} width="30%" />
          <Skeleton height={60} width="30%" />
          <Skeleton height={60} width="30%" />
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.container}>
      <Text style={styles.title}>🏦 Market Metrics</Text>
      
      <View style={styles.grid}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Open Interest</Text>
          <Text style={styles.metricValue}>{openInterest}</Text>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Liquidations</Text>
          <View style={styles.liqContainer}>
            <Text style={styles.liqLong}>↑ {liquidations.long.toFixed(1)}</Text>
            <Text style={styles.liqShort}>↓ {liquidations.short.toFixed(1)}</Text>
          </View>
        </View>

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>L/S Ratio</Text>
          <Text style={[styles.metricValue, { color: lsColor }]}>
            {longShortRatio.toFixed(2)}
          </Text>
          <Text style={[styles.sentiment, { color: lsColor }]}>{lsSentiment}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B33',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  metricLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  metricValue: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  liqContainer: {
    gap: 2,
  },
  liqLong: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  liqShort: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  sentiment: {
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 2,
  },
});

export default MarketMetricsCard;