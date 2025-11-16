/**
 * FearGreedHistoryChart - Simple SVG-based Fear & Greed history chart
 * No Skia dependency
 */

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../theme';

export interface FearGreedHistoryPoint {
  time: number;
  value: number;
  classification: string;
}

interface Props {
  data: FearGreedHistoryPoint[];
  height?: number;
}

export const FearGreedHistoryChart: React.FC<Props> = ({ data, height = 220 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.title}>Fear & Greed Index History</Text>
        <Text style={styles.noData}>No historical data available</Text>
      </View>
    );
  }

  const chartWidth = Dimensions.get('window').width - 32;
  const chartHeight = height - 60;
  const padding = { left: 50, right: 10, top: 30, bottom: 30 };

  const latestPoint = data[data.length - 1];
  const latestValue = latestPoint.value;
  
  // Color based on latest value
  const getColor = (value: number) => {
    if (value <= 24) return '#EF4444'; // Extreme Fear
    if (value <= 44) return '#F97316'; // Fear
    if (value <= 55) return '#F59E0B'; // Neutral
    if (value <= 74) return '#84CC16'; // Greed
    return '#10B981'; // Extreme Greed
  };

  const lineColor = getColor(latestValue);

  // Create path
  let pathData = '';
  data.forEach((point, index) => {
    const x = padding.left + (index / (data.length - 1)) * (chartWidth - padding.left - padding.right);
    const y = padding.top + ((100 - point.value) / 100) * chartHeight;
    
    if (index === 0) {
      pathData += `M ${x} ${y}`;
    } else {
      pathData += ` L ${x} ${y}`;
    }
  });

  // Sample 5 date labels
  const labelIndices = [0, Math.floor(data.length * 0.25), Math.floor(data.length * 0.5), Math.floor(data.length * 0.75), data.length - 1];

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Fear & Greed History</Text>
        <Text style={[styles.value, { color: lineColor }]}>
          {latestValue.toFixed(0)}
        </Text>
      </View>

      <Svg width={chartWidth} height={chartHeight + 40}>
        {/* Background zones */}
        {/* Extreme Fear zone (0-25) */}
        <Rect
          x={padding.left}
          y={padding.top + ((75 / 100) * chartHeight)}
          width={chartWidth - padding.left - padding.right}
          height={(25 / 100) * chartHeight}
          fill="rgba(239, 68, 68, 0.1)"
        />
        
        {/* Fear zone (25-45) */}
        <Rect
          x={padding.left}
          y={padding.top + ((55 / 100) * chartHeight)}
          width={chartWidth - padding.left - padding.right}
          height={(20 / 100) * chartHeight}
          fill="rgba(249, 115, 22, 0.1)"
        />
        
        {/* Greed zone (55-75) */}
        <Rect
          x={padding.left}
          y={padding.top + ((25 / 100) * chartHeight)}
          width={chartWidth - padding.left - padding.right}
          height={(20 / 100) * chartHeight}
          fill="rgba(132, 204, 22, 0.1)"
        />
        
        {/* Extreme Greed zone (75-100) */}
        <Rect
          x={padding.left}
          y={padding.top}
          width={chartWidth - padding.left - padding.right}
          height={(25 / 100) * chartHeight}
          fill="rgba(16, 185, 129, 0.1)"
        />

        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((value) => (
          <Line
            key={value}
            x1={padding.left}
            y1={padding.top + ((100 - value) / 100) * chartHeight}
            x2={chartWidth - padding.right}
            y2={padding.top + ((100 - value) / 100) * chartHeight}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            strokeDasharray={value === 50 ? "0" : "4,4"}
          />
        ))}

        {/* Fear & Greed line */}
        <Path d={pathData} stroke={lineColor} strokeWidth="2.5" fill="none" />

        {/* Latest point indicator */}
        {(() => {
          const lastIndex = data.length - 1;
          const x = padding.left + (lastIndex / (data.length - 1)) * (chartWidth - padding.left - padding.right);
          const y = padding.top + ((100 - latestValue) / 100) * chartHeight;
          return (
            <>
              <Circle cx={x} cy={y} r="5" fill={lineColor} />
              <Circle cx={x} cy={y} r="2.5" fill="#1F2937" />
            </>
          );
        })()}

        {/* Y-axis labels */}
        {[0, 25, 50, 75, 100].map((value) => (
          <SvgText
            key={value}
            x={padding.left - 10}
            y={padding.top + ((100 - value) / 100) * chartHeight + 4}
            fill="#9CA3AF"
            fontSize="10"
            textAnchor="end"
          >
            {value}
          </SvgText>
        ))}

        {/* X-axis date labels */}
        {labelIndices.map((idx) => {
          const point = data[idx];
          if (!point) return null;
          const x = padding.left + (idx / (data.length - 1)) * (chartWidth - padding.left - padding.right);
          const dateStr = new Date(point.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          return (
            <SvgText
              key={idx}
              x={x}
              y={padding.top + chartHeight + 20}
              fill="#9CA3AF"
              fontSize="9"
              textAnchor="middle"
            >
              {dateStr}
            </SvgText>
          );
        })}
      </Svg>

      <Text style={styles.status}>
        {latestPoint.classification} • Last {data.length} days
      </Text>
    </View>
  );
};

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

export default FearGreedHistoryChart;
