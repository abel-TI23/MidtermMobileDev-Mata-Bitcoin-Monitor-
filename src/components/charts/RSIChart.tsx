/**
 * RSIChart - Simple SVG-based RSI chart
 * No Skia dependency
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Line, Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

interface RSIDataPoint {
  time: number;
  rsi: number;
}

interface RSIChartProps {
  data: RSIDataPoint[];
  title?: string;
  height?: number;
}

export function RSIChart({ data, title = 'RSI (14)', height = 220 }: RSIChartProps) {
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
  const padding = { left: 40, right: 10, top: 30, bottom: 20 };

  const latestRSI = data[data.length - 1].rsi;
  const rsiColor = latestRSI > 70 ? '#EF4444' : latestRSI < 30 ? '#10B981' : '#3B82F6';

  // Create path
  let pathData = '';
  data.forEach((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + ((100 - point.rsi) / 100) * chartHeight;
    
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
        <Text style={[styles.value, { color: rsiColor }]}>
          {latestRSI.toFixed(1)}
        </Text>
      </View>

      <Svg width={chartWidth} height={chartHeight + 40}>
        {/* Overbought zone */}
        <Rect
          x={padding.left}
          y={padding.top}
          width={chartWidth - padding.left - padding.right}
          height={(30 / 100) * chartHeight}
          fill="rgba(239, 68, 68, 0.1)"
        />
        
        {/* Oversold zone */}
        <Rect
          x={padding.left}
          y={padding.top + ((70 / 100) * chartHeight)}
          width={chartWidth - padding.left - padding.right}
          height={(30 / 100) * chartHeight}
          fill="rgba(16, 185, 129, 0.1)"
        />

        {/* Reference lines */}
        <Line
          x1={padding.left}
          y1={padding.top + ((30 / 100) * chartHeight)}
          x2={chartWidth - padding.right}
          y2={padding.top + ((30 / 100) * chartHeight)}
          stroke="#EF4444"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
        <Line
          x1={padding.left}
          y1={padding.top + ((50 / 100) * chartHeight)}
          x2={chartWidth - padding.right}
          y2={padding.top + ((50 / 100) * chartHeight)}
          stroke="rgba(255,255,255,0.2)"
          strokeWidth="1"
        />
        <Line
          x1={padding.left}
          y1={padding.top + ((70 / 100) * chartHeight)}
          x2={chartWidth - padding.right}
          y2={padding.top + ((70 / 100) * chartHeight)}
          stroke="#10B981"
          strokeWidth="1"
          strokeDasharray="4,4"
        />

        {/* RSI line */}
        <Path d={pathData} stroke={rsiColor} strokeWidth="2" fill="none" />

        {/* Y-axis labels */}
        <SvgText x={10} y={padding.top + 5} fill="#9CA3AF" fontSize="10">70</SvgText>
        <SvgText x={10} y={padding.top + ((50 / 100) * chartHeight) + 5} fill="#9CA3AF" fontSize="10">50</SvgText>
        <SvgText x={10} y={padding.top + ((70 / 100) * chartHeight) + 5} fill="#9CA3AF" fontSize="10">30</SvgText>
      </Svg>

      <Text style={styles.status}>
        {latestRSI > 70 ? '⚠️ Overbought' : latestRSI < 30 ? '✅ Oversold' : '● Neutral'}
      </Text>
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
    fontSize: 20,
    fontWeight: '700',
  },
  noData: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
});
