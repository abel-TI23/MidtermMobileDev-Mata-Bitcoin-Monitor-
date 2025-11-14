/**
 * SimpleCandleChart - Example usage of BaseChart
 * Lightweight candlestick chart using modular architecture
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BaseChart, { ChartDataPoint } from './BaseChart';
import { renderCandles } from './renderers/renderCandles';
import { Line } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { cardBase, colors } from '../../theme';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SimpleCandleChartProps {
  candles: Candle[];
  title?: string;
  height?: number;
}

const SimpleCandleChart: React.FC<SimpleCandleChartProps> = ({
  candles,
  title = 'BTC/USDT',
  height = 320,
}) => {
  const [selectedCandle, setSelectedCandle] = React.useState<Candle | null>(null);

  // Transform candles to BaseChart format
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return candles.map(c => ({
      time: c.time,
      value: {
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      },
      volume: c.volume, // Extra data for tooltip
    }));
  }, [candles]);

  // Grid renderer
  const renderGrid = (ctx: any) => {
    const gridLines = [];
    const { width, height, margin, priceRange, toY } = ctx;
    
    // Horizontal grid lines
    const step = (priceRange.max - priceRange.min) / 5;
    for (let i = 0; i <= 5; i++) {
      const price = priceRange.min + i * step;
      const y = toY(price);
      
      gridLines.push(
        <Line
          key={`grid-h-${i}`}
          p1={{ x: margin.left, y }}
          p2={{ x: width - margin.right, y }}
          color="rgba(255, 255, 255, 0.05)"
          strokeWidth={1}
        />
      );
    }

    return <>{gridLines}</>;
  };

  // Tooltip overlay
  const renderTooltip = (ctx: any) => {
    if (!selectedCandle) {
      return <></>;
    }

    const change = selectedCandle.close - selectedCandle.open;
    const changePercent = (change / selectedCandle.open) * 100;
    const isGreen = change >= 0;

    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>{title}</Text>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>O:</Text>
          <Text style={styles.tooltipValue}>${selectedCandle.open.toFixed(2)}</Text>
        </View>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>H:</Text>
          <Text style={[styles.tooltipValue, { color: '#22C55E' }]}>
            ${selectedCandle.high.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>L:</Text>
          <Text style={[styles.tooltipValue, { color: '#EF4444' }]}>
            ${selectedCandle.low.toFixed(2)}
          </Text>
        </View>
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>C:</Text>
          <Text style={styles.tooltipValue}>${selectedCandle.close.toFixed(2)}</Text>
        </View>
        <View style={styles.tooltipDivider} />
        <View style={styles.tooltipRow}>
          <Text style={styles.tooltipLabel}>Change:</Text>
          <Text style={[styles.tooltipValue, { color: isGreen ? '#22C55E' : '#EF4444' }]}>
            {isGreen ? '+' : ''}{changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>
    );
  };

  const handleDataPointSelect = (point: ChartDataPoint | null) => {
    if (point) {
      const candle = candles.find(c => c.time === point.time);
      setSelectedCandle(candle || null);
    } else {
      setSelectedCandle(null);
    }
  };

  return (
    <View style={styles.container}>
      <BaseChart
        data={chartData}
        height={height}
        renderContent={(ctx) => (
          <>
            {renderGrid(ctx)}
            {renderCandles(ctx)}
          </>
        )}
        renderOverlay={renderTooltip}
        onDataPointSelect={handleDataPointSelect}
        enableGestures={{
          tap: true,
          zoom: true,
          scroll: false,
        }}
      />
      <Text style={styles.footnote}>
        💡 Tap to view details • Pinch to zoom
      </Text>
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
  tooltip: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 8,
    padding: 12,
    minWidth: 150,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  tooltipTitle: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  tooltipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  tooltipLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 30,
  },
  tooltipValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginVertical: 4,
  },
  footnote: {
    color: colors.accent,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    opacity: 0.7,
  },
});

export default SimpleCandleChart;
