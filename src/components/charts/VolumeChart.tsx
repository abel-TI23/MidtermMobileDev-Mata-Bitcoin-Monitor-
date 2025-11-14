/**
 * VolumeChart - Simple SVG-based volume bar chart
 * No Skia dependency
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

interface VolumeDataPoint {
  time: number;
  volume: number;
  priceChange?: number;
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

export function VolumeChart({ data, height = 220 }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>Volume</Text>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = height - 60;
  const padding = { left: 10, right: 10, top: 20, bottom: 20 };

  const maxVolume = Math.max(...data.map(d => d.volume));
  const latestVolume = data[data.length - 1].volume;

  // Show last 60 bars max
  const visibleData = data.slice(-60);
  const barWidth = (chartWidth - padding.left - padding.right) / visibleData.length - 1;

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Volume</Text>
        <Text style={styles.value}>{(latestVolume / 1000).toFixed(1)}K</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight + 40}>
        {visibleData.map((point, index) => {
          const barHeight = (point.volume / maxVolume) * chartHeight;
          const x = padding.left + index * (barWidth + 1);
          const y = padding.top + chartHeight - barHeight;
          const isGreen = (point.priceChange || 0) >= 0;

          return (
            <Rect
              key={index}
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              fill={isGreen ? '#10B981' : '#EF4444'}
              opacity={0.7}
            />
          );
        })}
      </Svg>

      <Text style={styles.subtitle}>Last {visibleData.length} bars</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  noData: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
