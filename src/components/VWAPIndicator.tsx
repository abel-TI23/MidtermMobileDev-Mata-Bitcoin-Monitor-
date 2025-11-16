/**
 * VWAP Indicator - Volume Weighted Average Price
 * Shows institutional trading benchmark and support/resistance levels
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { fetchCandles, Candle } from '../utils/binanceAPI';

interface VWAPIndicatorProps {
  symbol?: string;
}

export function VWAPIndicator({ symbol = 'BTCUSDT' }: VWAPIndicatorProps) {
  const [vwap, setVwap] = useState<number>(0);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [deviation, setDeviation] = useState<number>(0);
  const [signal, setSignal] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const [volume24h, setVolume24h] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  const calculateVWAP = useCallback(async () => {
    try {
      // Fetch 1-hour candles for intraday VWAP
      const candles = await fetchCandles(symbol, '1h', 24);
      
      if (candles.length === 0) {
        setLoading(false);
        return;
      }

      let cumulativeTPV = 0; // Typical Price × Volume
      let cumulativeVolume = 0;
      let total24hVolume = 0;

      candles.forEach((candle: Candle) => {
        const typicalPrice = (candle.high + candle.low + candle.close) / 3;
        const tpv = typicalPrice * candle.volume;
        
        cumulativeTPV += tpv;
        cumulativeVolume += candle.volume;
        total24hVolume += candle.volume;
      });

      const calculatedVWAP = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
      const latestPrice = candles[candles.length - 1].close;
      const priceDeviation = ((latestPrice - calculatedVWAP) / calculatedVWAP) * 100;

      setVwap(calculatedVWAP);
      setCurrentPrice(latestPrice);
      setDeviation(priceDeviation);
      setVolume24h(total24hVolume);

      // Determine signal
      if (priceDeviation > 0.5) {
        setSignal('bullish'); // Price above VWAP = bullish
      } else if (priceDeviation < -0.5) {
        setSignal('bearish'); // Price below VWAP = bearish
      } else {
        setSignal('neutral');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error calculating VWAP:', error);
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    calculateVWAP();
    
    // Update every 5 minutes
    const interval = setInterval(calculateVWAP, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [calculateVWAP]);

  const getSignalColor = () => {
    switch (signal) {
      case 'bullish': return '#22C55E';
      case 'bearish': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const getSignalLabel = () => {
    switch (signal) {
      case 'bullish': return 'Price Above VWAP ↑';
      case 'bearish': return 'Price Below VWAP ↓';
      default: return 'Price Near VWAP →';
    }
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(0)}K`;
    return vol.toFixed(0);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>VWAP Indicator</Text>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Calculating VWAP...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>VWAP Indicator</Text>
        <View style={[styles.signalBadge, { backgroundColor: `${getSignalColor()}20` }]}>
          <Text style={[styles.signalText, { color: getSignalColor() }]}>
            {signal.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Main Metrics */}
      <View style={styles.metricsRow}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Current Price</Text>
          <Text style={styles.metricValue}>${currentPrice.toFixed(2)}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>VWAP</Text>
          <Text style={[styles.metricValue, { color: '#3B82F6' }]}>
            ${vwap.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Deviation */}
      <View style={styles.deviationContainer}>
        <Text style={styles.deviationLabel}>Price Deviation from VWAP</Text>
        <Text style={[styles.deviationValue, { color: getSignalColor() }]}>
          {deviation > 0 ? '+' : ''}{deviation.toFixed(2)}%
        </Text>
        <View style={styles.deviationBar}>
          <View
            style={[
              styles.deviationFill,
              {
                width: `${Math.min(Math.abs(deviation) * 10, 100)}%`,
                backgroundColor: getSignalColor(),
                alignSelf: deviation > 0 ? 'flex-end' : 'flex-start',
              },
            ]}
          />
        </View>
      </View>

      {/* Signal Info */}
      <View style={[styles.signalBox, { borderColor: getSignalColor() }]}>
        <Text style={[styles.signalLabel, { color: getSignalColor() }]}>
          {getSignalLabel()}
        </Text>
      </View>

      {/* Volume */}
      <View style={styles.volumeRow}>
        <Text style={styles.volumeLabel}>24h Volume</Text>
        <Text style={styles.volumeValue}>{formatVolume(volume24h)} BTC</Text>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What is VWAP?</Text>
        <Text style={styles.infoText}>
          • Volume Weighted Average Price (institutional benchmark){'\n'}
          • Price above VWAP = bullish, below = bearish{'\n'}
          • Acts as dynamic support/resistance level{'\n'}
          • Used by traders to identify fair value{'\n'}
          • Updates based on 24-hour rolling data
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
    marginBottom: 16,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  signalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  signalText: {
    fontSize: 10,
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    color: colors.textMuted,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  deviationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  deviationLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  deviationValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  deviationBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  deviationFill: {
    height: '100%',
    borderRadius: 3,
  },
  signalBox: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  signalLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  volumeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
  },
  volumeLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  volumeValue: {
    fontSize: 13,
    color: '#A78BFA',
    fontWeight: '700',
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 10,
    color: colors.textSecondary,
    lineHeight: 15,
  },
});
