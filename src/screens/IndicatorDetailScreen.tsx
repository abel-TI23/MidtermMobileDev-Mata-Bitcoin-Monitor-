import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App';
import { colors } from '../theme';
import { fetchCandles } from '../utils/binanceAPI';
import { calculateRSI, calculateATR } from '../utils/indicators';
import { RSIChart } from '../components/charts/RSIChart';
import { ATRChart } from '../components/charts/ATRChart';
import { VolumeChart } from '../components/charts/VolumeChart';
import TradingChart from '../components/TradingChart';
import FearGreedHistoryChart from '../components/charts/FearGreedHistoryChart';
import { fetchFearGreedHistory } from '../utils/fearGreedAPI';


type Props = NativeStackScreenProps<RootStackParamList, 'IndicatorDetail'>;

const EXPLAINS: Record<string, { title: string; about: string; howToRead: string[] }> = {
  PRICE: {
    title: 'Price Chart',
    about: 'Price shows the market value over time. The line chart connects closing prices to show the overall trend.',
    howToRead: [
      'Green line: Bullish trend (price rising overall).',
      'Red line: Bearish trend (price falling overall).',
      'Rising line: uptrend • Falling line: downtrend • Flat line: sideways market.',
      'Combine with volume for confirmation of trends.'
    ],
  },
  RSI: {
    title: 'Relative Strength Index (RSI 14)',
    about: 'RSI measures the speed and magnitude of price changes to detect overbought/oversold conditions.',
    howToRead: [
      'RSI > 70: Overbought (risk of pullback).',
      'RSI < 30: Oversold (potential rebound).',
      'Divergences between price and RSI can hint reversals.'
    ],
  },
  ATR: {
    title: 'Average True Range (ATR 14)',
    about: 'ATR measures volatility (how much price is moving on average). It does not indicate direction.',
    howToRead: [
      'Rising ATR: increasing volatility (strong moves).',
      'Falling ATR: quiet market (range-bound).',
      'Use ATR to size stops: e.g., 1.5x to 2x ATR.'
    ],
  },
  VOLUME: {
    title: 'Volume',
    about: 'Volume shows how many units were traded. It often confirms the strength of price moves.',
    howToRead: [
      'Breakouts with high volume are more trustworthy.',
      'Price moves on low volume are prone to fail.',
      'Compare the last bar versus the recent average.'
    ],
  },
  FG: {
    title: 'Fear & Greed Index',
    about: 'A composite market sentiment indicator derived from several sources (volatility, volume, social, etc.).',
    howToRead: [
      '0-24: Extreme Fear • 25-44: Fear • 45-55: Neutral • 56-74: Greed • 75-100: Extreme Greed',
      'Contrarian view: Extreme readings may precede reversals.',
      'Best used as context, not a standalone signal.'
    ],
  },
};

export default function IndicatorDetailScreen({ route }: Props) {
  const { type, symbol = 'BTCUSDT' } = route.params;
  const [candles, setCandles] = useState<any[]>([]);
  const [timeframe, setTimeframe] = useState<string>('1h');
  const [fgData, setFgData] = useState<any[]>([]);
  const TIMEFRAMES: { label: string; value: string; limit: number }[] = [
    { label: '1m', value: '1m', limit: 240 },
    { label: '5m', value: '5m', limit: 240 },
    { label: '15m', value: '15m', limit: 240 },
    { label: '1H', value: '1h', limit: 400 },
    { label: '4H', value: '4h', limit: 400 },
    { label: 'D', value: '1d', limit: 365 },
  ];

  const load = useCallback(async (tf: string) => {
    try {
      const meta = TIMEFRAMES.find(t => t.value === tf) || TIMEFRAMES[3];
      // Fetch lebih sedikit data untuk lebih cepat (150 candles cukup)
      const limit = Math.min(meta.limit, 150);
      const data = await fetchCandles(symbol, tf, limit);
      setCandles(data);
    } catch (e) {
      console.log('detail load error', e);
    }
  }, [symbol, TIMEFRAMES]);

  useEffect(() => { load(timeframe); }, [load, timeframe]);
  
  // Auto-refresh setiap 30 detik
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      load(timeframe);
    }, 30000);
    return () => clearInterval(refreshInterval);
  }, [load, timeframe]);
  
  useEffect(() => {
    if (type === 'FG') {
      fetchFearGreedHistory(180).then(setFgData).catch(() => setFgData([]));
    }
  }, [type]);

  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const highs = useMemo(() => candles.map((c) => c.high), [candles]);
  const lows = useMemo(() => candles.map((c) => c.low), [candles]);

  const rsiData = useMemo(() => {
    const r = calculateRSI(closes, 14);
    return candles.map((c, i) => ({ time: c.time, rsi: r[i] || 0 })).filter(d => d.rsi > 0);
  }, [candles, closes]);

  const atrData = useMemo(() => {
    const a = calculateATR(highs, lows, closes, 14);
    return candles.map((c, i) => ({ time: c.time, atr: a[i] || 0 })).filter(d => d.atr > 0);
  }, [candles, highs, lows, closes]);

  const volumeData = useMemo(() => candles.map((c) => ({ time: c.time, volume: c.volume, priceChange: c.close - c.open })), [candles]);

  const explain = EXPLAINS[type];

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.title}>{explain.title}</Text>
          <Text style={styles.subtitle}>{symbol}</Text>
        </View>

        {/* Timeframe Selector */}
        {(type === 'PRICE' || type === 'RSI' || type === 'ATR' || type === 'VOLUME') && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tfRow}
            style={{ paddingHorizontal: 12, marginTop: 4 }}
          >
            {TIMEFRAMES.map(tf => (
              <TouchableOpacity
                key={tf.value}
                style={[styles.tfChip, timeframe === tf.value && styles.tfChipActive]}
                onPress={() => setTimeframe(tf.value)}
              >
                <Text style={[styles.tfChipText, timeframe === tf.value && styles.tfChipTextActive]}> {tf.label} </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {type === 'PRICE' && (
          <View style={styles.chartWrapper}>
            <TradingChart
              candles={candles}
              currentPrice={candles.length ? candles[candles.length - 1].close : undefined}
              chartType="candle"
            />
          </View>
        )}
        {type === 'RSI' && (
          <View style={styles.chartWrapper}>
            <RSIChart data={rsiData} height={220} title="RSI 14" />
          </View>
        )}
        {type === 'ATR' && (
          <View style={styles.chartWrapper}>
            <ATRChart data={atrData} height={220} title="ATR 14" />
          </View>
        )}
        {type === 'VOLUME' && (
          <View style={styles.chartWrapper}>
            <VolumeChart data={volumeData} height={220} />
          </View>
        )}
        {type === 'FG' && (
          <View style={styles.chartWrapper}>
            <FearGreedHistoryChart data={fgData} height={220} />
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.paragraph}>{explain.about}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How to Read</Text>
          {explain.howToRead.map((t, i) => (
            <Text key={i} style={styles.bullet}>• {t}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 16, paddingTop: 16 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  chartWrapper: { marginHorizontal: 12, marginTop: 12, borderRadius: 16, overflow: 'hidden' },
  sectionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  paragraph: { color: colors.textSecondary, fontSize: 13, lineHeight: 18 },
  bullet: { color: colors.textSecondary, fontSize: 13, lineHeight: 20, marginTop: 2 },
  tfRow: { flexDirection: 'row', gap: 10, paddingVertical: 8, paddingHorizontal: 4 },
  tfChip: { 
    paddingHorizontal: 16, 
    paddingVertical: 9, 
    borderRadius: 12, 
    backgroundColor: '#1F2937', 
    borderWidth: 1, 
    borderColor: '#1F2937',
    minWidth: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tfChipActive: { borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,0.15)' },
  tfChipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  tfChipTextActive: { color: '#F59E0B' },
});
