/**
 * ChartView Component
 * Displays price chart with optional EMA and SMA indicators
 */

import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, PanResponder, LayoutChangeEvent } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Candle } from '../utils/binanceAPI';
import { cardBase, colors } from '../theme';

interface ChartViewProps {
  candles: Candle[];
  ema21: (number | null)[];
  sma100: (number | null)[];
  showEMA: boolean;
  showSMA: boolean;
}

const ChartView: React.FC<ChartViewProps> = ({
  candles,
  ema21,
  sma100,
  showEMA,
  showSMA,
}) => {
  const prices = useMemo(() => candles.map(c => c.close), [candles]);
  const volumes = useMemo(() => candles.map(c => c.volume), [candles]);
  const volumeBars = useMemo(() => {
    return candles.map((c, i) => {
      const prev = candles[i - 1];
      const up = !prev ? true : c.close >= prev.close;
      const color = (opacity = 1) => up ? `rgba(34, 197, 94, ${opacity})` : `rgba(239, 68, 68, ${opacity})`;
      return { value: c.volume, color } as any; // chart-kit custom color API
    });
  }, [candles]);
  const lastPrice = prices[prices.length - 1] ?? 0;

  const kFormat = (value: string) => {
    const num = Number(value);
    if (Math.abs(num) >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (Math.abs(num) >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return String(Math.round(num));
  };

  // Crosshair (TradingView-like) for quick inspection
  const [chartWidth, setChartWidth] = useState<number>(Dimensions.get('window').width - 32);
  const [crossIndex, setCrossIndex] = useState<number | null>(null);
  const [crossX, setCrossX] = useState<number>(0);

  const onChartLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w && w !== chartWidth) setChartWidth(w);
  };

  const updateCross = (x: number) => {
    if (!candles.length || chartWidth <= 0) return;
    const clamped = Math.max(0, Math.min(x, chartWidth));
    const idx = Math.max(0, Math.min(candles.length - 1, Math.round((clamped / chartWidth) * (candles.length - 1))));
    setCrossIndex(idx);
    setCrossX(clamped);
  };

  const pan = useMemo(() =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => updateCross(evt.nativeEvent.locationX),
      onPanResponderMove: (evt) => updateCross(evt.nativeEvent.locationX),
      onPanResponderRelease: () => setCrossIndex(null),
      onPanResponderTerminate: () => setCrossIndex(null),
    }),
  // Recreate only when width or candle count changes (safe for closures)
  [chartWidth, candles.length]
  );
  // Prepare chart data
  const chartData = useMemo(() => {
    const datasets: any[] = [
      {
        data: prices,
        color: (opacity = 1) => `rgba(245, 158, 11, ${opacity})`, // Orange for price
        strokeWidth: 2,
      },
    ];

    // Add EMA if enabled
    if (showEMA && ema21.length > 0) {
      const emaValues = ema21.filter((v): v is number => v !== null);
      if (emaValues.length > 0) {
        // Replace nulls with corresponding price to avoid min=0 flattening
        const aligned = ema21.map((v, i) => (v == null ? prices[i] : v));
        datasets.push({
          data: aligned,
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`, // Green for EMA
          strokeWidth: 2,
          withDots: false,
        });
      }
    }

    // Add SMA if enabled
    if (showSMA && sma100.length > 0) {
      const smaValues = sma100.filter((v): v is number => v !== null);
      if (smaValues.length > 0) {
        const aligned = sma100.map((v, i) => (v == null ? prices[i] : v));
        datasets.push({
          data: aligned,
          color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`, // Blue for SMA
          strokeWidth: 2,
          withDots: false,
        });
      }
    }

    return {
      labels: [], // Empty labels for cleaner look
      datasets,
      legend: ['Price', showEMA ? 'EMA 21' : '', showSMA ? 'SMA 100' : ''].filter(Boolean),
    };
  }, [candles, ema21, sma100, showEMA, showSMA]);

  if (candles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Loading chart data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Price Chart</Text>
      
      <View onLayout={onChartLayout}>
        <LineChart
        data={chartData}
        width={Dimensions.get('window').width - 32}
        height={280}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '0',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: colors.grid,
            strokeWidth: 0.5,
          },
          fillShadowGradientFrom: '#F59E0B',
          fillShadowGradientTo: '#F59E0B',
          fillShadowGradientFromOpacity: 0.12,
          fillShadowGradientToOpacity: 0.02,
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={false}
        withHorizontalLabels={true}
        formatYLabel={kFormat}
        fromZero={false}
        segments={4}
      />
      {/* Last price line & bubble (based on price range only) */}
      {prices.length > 1 && (
        (() => {
          const min = Math.min(...prices);
          const max = Math.max(...prices);
          const range = Math.max(1e-6, max - min);
          const y = 280 - ((lastPrice - min) / range) * 280; // chart height is 280
          return (
            <>
              <View style={[styles.lastLine, { top: y }]} />
              <View style={[styles.lastBubble, { top: Math.max(8, Math.min(280 - 24, y - 12)) }]}>
                <Text style={styles.lastBubbleText}>{lastPrice.toFixed(2)}</Text>
              </View>
            </>
          );
        })()
      )}
      {/* Crosshair overlay */}
      <View style={styles.overlay} {...pan.panHandlers}>
        {crossIndex !== null && (
          <>
            <View style={[styles.crosshairLine, { left: crossX }]} />
            <View style={[styles.tooltip, { left: Math.min(Math.max(crossX - 80, 8), chartWidth - 160) }]}>
              <Text style={styles.tooltipTitle}>{new Date(candles[crossIndex].time).toLocaleString()}</Text>
              <View style={styles.tooltipRow}><Text style={styles.tooltipLabel}>Close</Text><Text style={styles.tooltipValue}>{prices[crossIndex].toFixed(2)}</Text></View>
              {showEMA && ema21[crossIndex] != null && (
                <View style={styles.tooltipRow}><Text style={[styles.tooltipLabel, { color: '#10B981' }]}>EMA 21</Text><Text style={styles.tooltipValue}>{(ema21[crossIndex] as number).toFixed(2)}</Text></View>
              )}
              {showSMA && sma100[crossIndex] != null && (
                <View style={styles.tooltipRow}><Text style={[styles.tooltipLabel, { color: '#3B82F6' }]}>SMA 100</Text><Text style={styles.tooltipValue}>{(sma100[crossIndex] as number).toFixed(2)}</Text></View>
              )}
              <View style={styles.tooltipRow}><Text style={styles.tooltipLabel}>Volume</Text><Text style={styles.tooltipValue}>{kFormat(String(volumes[crossIndex]))}</Text></View>
            </View>
          </>
        )}
      </View>
      </View>
      
      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={styles.legendText}>Price</Text>
        </View>
        {showEMA && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>EMA 21</Text>
          </View>
        )}
        {showSMA && (
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#3B82F6' }]} />
            <Text style={styles.legendText}>SMA 100</Text>
          </View>
        )}
      </View>
      
      <Text style={styles.footnote}>
        Last {candles.length} candles • Real-time updates
      </Text>

      {/* Volume */}
      <Text style={[styles.title, { marginTop: 12 }]}>Volume</Text>

      <BarChart
        data={{ labels: [], datasets: [{ data: volumeBars }] }}
        width={Dimensions.get('window').width - 32}
        height={120}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(139, 92, 246, ${opacity})`, // violet bars
          labelColor: (opacity = 1) => `rgba(156, 163, 175, ${opacity})`,
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: colors.grid,
            strokeWidth: 0.5,
          },
        }}
        withVerticalLabels={false}
        withHorizontalLabels={true}
        showBarTops={false}
        fromZero
        style={styles.chart}
        yAxisLabel=""
        yAxisSuffix=""
        withCustomBarColorFromData={true}
        flatColor={true}
        segments={3}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...cardBase,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 16,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 20,
    marginBottom: 12,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 280,
  },
  lastLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
  },
  lastBubble: {
    position: 'absolute',
    right: 8,
    paddingHorizontal: 8,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastBubbleText: {
    color: '#0B1220',
    fontSize: 12,
    fontWeight: '800',
  },
  crosshairLine: {
    position: 'absolute',
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  tooltip: {
    position: 'absolute',
    top: 12,
    width: 160,
    backgroundColor: '#121826',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  tooltipTitle: {
    color: '#CBD5E1',
    fontSize: 11,
    marginBottom: 6,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  tooltipLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  tooltipValue: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '700',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  footnote: {
    color: '#6B7280',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 12,
  },
  emptyContainer: {
    ...cardBase,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default ChartView;
