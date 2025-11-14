/**
 * ATRChart - Simple SVG-based ATR chart
 * No Skia dependency
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

interface ATRDataPoint {
  time: number;
  atr: number;
}

interface ATRChartProps {
  data: ATRDataPoint[];
  title?: string;
  height?: number;
}

export function ATRChart({ data, title = 'ATR (14)', height = 220 }: ATRChartProps) {
  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.noData}>No data available</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = height - 60;
  const padding = { left: 50, right: 10, top: 20, bottom: 20 };

  const latestATR = data[data.length - 1].atr;
  const maxATR = Math.max(...data.map(d => d.atr));
  const minATR = Math.min(...data.map(d => d.atr));
  const range = maxATR - minATR || 1;

  // Create path
  let pathData = '';
  data.forEach((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + ((maxATR - point.atr) / range) * chartHeight;
    
    if (index === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{latestATR.toFixed(2)}</Text>
      </View>

      <Svg width={chartWidth} height={chartHeight + 40}>
        {/* Grid lines */}
        <Line
          x1={padding.left}
          y1={padding.top}
          x2={chartWidth - padding.right}
          y2={padding.top}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight / 2}
          x2={chartWidth - padding.right}
          y2={padding.top + chartHeight / 2}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />
        <Line
          x1={padding.left}
          y1={padding.top + chartHeight}
          x2={chartWidth - padding.right}
          y2={padding.top + chartHeight}
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="1"
        />

        {/* ATR line */}
        <Path d={pathData} stroke="#F59E0B" strokeWidth="2" fill="none" />

        {/* Y-axis labels */}
        <SvgText x={5} y={padding.top + 5} fill="#9CA3AF" fontSize="10">
          {maxATR.toFixed(0)}
        </SvgText>
        <SvgText x={5} y={padding.top + chartHeight / 2 + 5} fill="#9CA3AF" fontSize="10">
          {((maxATR + minATR) / 2).toFixed(0)}
        </SvgText>
        <SvgText x={5} y={padding.top + chartHeight + 5} fill="#9CA3AF" fontSize="10">
          {minATR.toFixed(0)}
        </SvgText>
      </Svg>

      <Text style={styles.subtitle}>Volatility Indicator</Text>
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
    color: '#F59E0B',
    fontSize: 20,
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
