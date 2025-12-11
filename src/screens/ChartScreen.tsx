import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import TradingChart from '../components/TradingChart';
import { fetchCandles, Candle } from '../utils/binanceAPI';

type Interval = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';

const ChartScreen: React.FC = () => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(0);
  const [timeInterval, setTimeInterval] = useState<Interval>('1h');
  const [loading, setLoading] = useState(true);

  const loadCandles = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      }
      
      const data = await fetchCandles('BTCUSDT', timeInterval, 150);
      setCandles(data);
      
      if (data.length > 0) {
        const latestPrice = data[data.length - 1].close;
        setCurrentPrice(latestPrice);
      }
    } catch (error) {
      console.error('Error loading candles:', error);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  }, [timeInterval]);

  useFocusEffect(
    useCallback(() => {
      loadCandles(true);
      
      const intervalId = setInterval(() => loadCandles(false), 30000);
      
      return () => clearInterval(intervalId);
    }, [loadCandles])
  );

  const timeframes: { label: string; value: Interval }[] = [
    { label: '1m', value: '1m' },
    { label: '5m', value: '5m' },
    { label: '15m', value: '15m' },
    { label: 'H', value: '1h' },
    { label: '4H', value: '4h' },
    { label: 'D', value: '1d' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {timeframes.map((tf) => (
            <TouchableOpacity
              key={tf.value}
              style={[
                styles.timeframeChip,
                timeInterval === tf.value && styles.timeframeChipActive
              ]}
              onPress={() => setTimeInterval(tf.value)}
            >
              <Text style={[
                styles.timeframeText,
                timeInterval === tf.value && styles.timeframeTextActive
              ]}>
                {tf.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Chart */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      ) : (
        <TradingChart
          candles={candles}
          currentPrice={currentPrice}
          chartType="candle"
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0e27',
  },
  timeframeContainer: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1d0111ff',
  },
  timeframeChip: {
    paddingHorizontal: 1,
    paddingVertical: 6,
    marginRight: 5,
    borderRadius: 20,
    backgroundColor: '#e2e3ebff',
    borderWidth: 1,
    borderColor: '#2a2f4a',
    minWidth: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeframeChipActive: {
    backgroundColor: '#f59e0b',
    borderColor: '#f59e0b',
  },
  timeframeText: {
    fontSize: 14,
    color: '#8891a8',
    fontWeight: '600',
    textAlign: 'center',
  },
  timeframeTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 0.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChartScreen;
