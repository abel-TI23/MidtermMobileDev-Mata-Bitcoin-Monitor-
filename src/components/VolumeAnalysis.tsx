/**
 * VolumeAnalysis - 4H and 1D volume tracking with MA comparison
 * Tracks institutional-level volume movements over longer timeframes
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { fetchCandles } from '../utils/binanceAPI';

interface VolumeData {
  current: number;
  ma: number;
  deviation: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface VolumeAnalysisProps {
  symbol?: string;
  period?: number; // MA period (default: 20)
}

export function VolumeAnalysis({ symbol = 'BTCUSDT', period = 20 }: VolumeAnalysisProps) {
  const [volume4H, setVolume4H] = useState<VolumeData>({
    current: 0,
    ma: 0,
    deviation: 0,
    trend: 'stable',
  });
  const [volume1D, setVolume1D] = useState<VolumeData>({
    current: 0,
    ma: 0,
    deviation: 0,
    trend: 'stable',
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const calculateVolumeData = (candles: any[]): VolumeData => {
    if (candles.length === 0) {
      return { current: 0, ma: 0, deviation: 0, trend: 'stable' };
    }

    // Current volume is the last candle
    const current = candles[candles.length - 1].volume;

    // Calculate MA excluding current candle
    const historicalVolumes = candles.slice(0, -1).map(c => c.volume);
    const ma = historicalVolumes.length > 0
      ? historicalVolumes.reduce((sum, v) => sum + v, 0) / historicalVolumes.length
      : 0;

    // Calculate deviation
    const deviation = ma > 0 ? ((current - ma) / ma) * 100 : 0;

    // Determine trend based on recent volumes
    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (candles.length >= 3) {
      const recent = candles.slice(-3).map(c => c.volume);
      if (recent[2] > recent[1] && recent[1] > recent[0]) {
        trend = 'increasing';
      } else if (recent[2] < recent[1] && recent[1] < recent[0]) {
        trend = 'decreasing';
      }
    }

    return { current, ma, deviation, trend };
  };

  const loadVolumeData = async () => {
    try {
      // Fetch 4H data
      const candles4H = await fetchCandles(symbol, '4h', period + 1);
      const data4H = calculateVolumeData(candles4H);
      setVolume4H(data4H);

      // Fetch 1D data
      const candles1D = await fetchCandles(symbol, '1d', period + 1);
      const data1D = calculateVolumeData(candles1D);
      setVolume1D(data1D);
    } catch (error) {
      console.error('Error loading volume data:', error);
    }
  };

  useEffect(() => {
    loadVolumeData();
    
    // Refresh every 5 minutes (since we're tracking 4H/1D)
    intervalRef.current = setInterval(loadVolumeData, 300000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, period]);

  const formatVolume = (vol: number) => {
    if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
    if (vol >= 1000) return `${(vol / 1000).toFixed(2)}K`;
    return vol.toFixed(2);
  };

  const getDeviationColor = (deviation: number) => {
    if (Math.abs(deviation) < 10) return '#9CA3AF';
    return deviation > 0 ? '#22C55E' : '#EF4444';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'increasing') return '↗';
    if (trend === 'decreasing') return '↘';
    return '→';
  };

  const getTrendColor = (trend: string) => {
    if (trend === 'increasing') return '#22C55E';
    if (trend === 'decreasing') return '#EF4444';
    return '#9CA3AF';
  };

  // Determine overall market sentiment based on both timeframes
  const getOverallSentiment = () => {
    const both4HUp = volume4H.deviation > 10 && volume4H.trend === 'increasing';
    const both1DUp = volume1D.deviation > 10 && volume1D.trend === 'increasing';
    const both4HDown = volume4H.deviation < -10 && volume4H.trend === 'decreasing';
    const both1DDown = volume1D.deviation < -10 && volume1D.trend === 'decreasing';

    if (both4HUp && both1DUp) return { text: 'Strong Bullish Volume', color: '#22C55E' };
    if (both4HDown && both1DDown) return { text: 'Strong Bearish Volume', color: '#EF4444' };
    if (both4HUp || both1DUp) return { text: 'Moderate Bullish', color: '#22C55E' };
    if (both4HDown || both1DDown) return { text: 'Moderate Bearish', color: '#EF4444' };
    return { text: 'Neutral Volume', color: '#9CA3AF' };
  };

  const sentiment = getOverallSentiment();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Volume Analysis (4H-1D)</Text>
        <View style={[styles.sentimentBadge, { backgroundColor: sentiment.color + '20' }]}>
          <Text style={[styles.sentimentText, { color: sentiment.color }]}>
            {sentiment.text}
          </Text>
        </View>
      </View>

      {/* 4H Volume Section */}
      <View style={styles.timeframeSection}>
        <View style={styles.timeframeHeader}>
          <Text style={styles.timeframeTitle}>4-Hour Timeframe</Text>
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor(volume4H.trend) + '20' }]}>
            <Text style={[styles.trendText, { color: getTrendColor(volume4H.trend) }]}>
              {getTrendIcon(volume4H.trend)} {volume4H.trend}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Current</Text>
            <Text style={styles.metricValue}>{formatVolume(volume4H.current)}</Text>
            <Text style={styles.metricUnit}>BTC</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{period}-Period MA</Text>
            <Text style={styles.metricValue}>{formatVolume(volume4H.ma)}</Text>
            <Text style={styles.metricUnit}>BTC</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>vs MA</Text>
            <Text style={[styles.metricValue, { color: getDeviationColor(volume4H.deviation) }]}>
              {volume4H.deviation > 0 ? '+' : ''}{volume4H.deviation.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* 1D Volume Section */}
      <View style={styles.timeframeSection}>
        <View style={styles.timeframeHeader}>
          <Text style={styles.timeframeTitle}>Daily Timeframe</Text>
          <View style={[styles.trendBadge, { backgroundColor: getTrendColor(volume1D.trend) + '20' }]}>
            <Text style={[styles.trendText, { color: getTrendColor(volume1D.trend) }]}>
              {getTrendIcon(volume1D.trend)} {volume1D.trend}
            </Text>
          </View>
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>Current</Text>
            <Text style={styles.metricValue}>{formatVolume(volume1D.current)}</Text>
            <Text style={styles.metricUnit}>BTC</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>{period}-Period MA</Text>
            <Text style={styles.metricValue}>{formatVolume(volume1D.ma)}</Text>
            <Text style={styles.metricUnit}>BTC</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>vs MA</Text>
            <Text style={[styles.metricValue, { color: getDeviationColor(volume1D.deviation) }]}>
              {volume1D.deviation > 0 ? '+' : ''}{volume1D.deviation.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Alert for significant deviations */}
      {(Math.abs(volume4H.deviation) > 50 || Math.abs(volume1D.deviation) > 50) && (
        <View style={[styles.alert, { backgroundColor: sentiment.color + '15' }]}>
          <Text style={[styles.alertText, { color: sentiment.color }]}>
            ⚠ Significant volume {sentiment.text.includes('Bullish') ? 'spike' : 'drop'} detected on{' '}
            {Math.abs(volume4H.deviation) > 50 && Math.abs(volume1D.deviation) > 50
              ? 'both 4H and 1D'
              : Math.abs(volume4H.deviation) > 50
              ? '4H'
              : '1D'}{' '}
            timeframe
          </Text>
        </View>
      )}

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📊 Tracking institutional volume movements on 4H-1D timeframes
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
  sentimentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sentimentText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timeframeSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  timeframeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeframeTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A78BFA',
    textTransform: 'uppercase',
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 9,
    color: colors.textMuted,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  alert: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  alertText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  infoBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoText: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '600',
    textAlign: 'center',
  },
});
