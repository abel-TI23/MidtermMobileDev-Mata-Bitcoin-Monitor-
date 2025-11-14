/**
 * SimpleLineChart - For single-value indicators
 * Perfect for: ATR, Fear & Greed Index, RSI, etc.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import BaseChart, { ChartDataPoint } from './BaseChart';
import { renderLine } from './renderers/renderLine';
import { Line } from '@shopify/react-native-skia';
import { cardBase, colors } from '../../theme';

interface DataPoint {
  time: number;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
  lineColor?: string;
  showArea?: boolean;
  valueFormatter?: (value: number) => string;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  title = 'Indicator',
  height = 200,
  lineColor = '#3B82F6',
  showArea = true,
  valueFormatter = (v) => v.toFixed(2),
}) => {
  const [selectedPoint, setSelectedPoint] = React.useState<DataPoint | null>(null);

  // Transform data to BaseChart format
  const chartData: ChartDataPoint[] = React.useMemo(() => {
    return data.map(d => ({
      time: d.time,
      value: d.value,
    }));
  }, [data]);

  // Grid renderer
  const renderGrid = (ctx: any) => {
    const gridLines = [];
    const { width, height, margin, priceRange, toY } = ctx;
    
    const step = (priceRange.max - priceRange.min) / 4;
    for (let i = 0; i <= 4; i++) {
      const value = priceRange.min + i * step;
      const y = toY(value);
      
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
    if (!selectedPoint) {
      return <></>;
    }

    return (
      <View style={styles.tooltip}>
        <Text style={styles.tooltipTitle}>{title}</Text>
        <Text style={[styles.tooltipValue, { color: lineColor }]}>
          {valueFormatter(selectedPoint.value)}
        </Text>
        <Text style={styles.tooltipTime}>
          {new Date(selectedPoint.time).toLocaleDateString()}
        </Text>
      </View>
    );
  };

  const handleDataPointSelect = (point: ChartDataPoint | null) => {
    if (point) {
      const dataPoint = data.find(d => d.time === point.time);
      setSelectedPoint(dataPoint || null);
    } else {
      setSelectedPoint(null);
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
            {renderLine(ctx, { 
              lineColor, 
              lineWidth: 2, 
              showArea,
              areaColor: `${lineColor}20`,
            })}
          </>
        )}
        renderOverlay={renderTooltip}
        onDataPointSelect={handleDataPointSelect}
        enableGestures={{
          tap: true,
          zoom: true,
          scroll: false,
        }}
        zoomRange={{ min: 20, max: 100 }}
      />
      <Text style={styles.footnote}>
        💡 {title} • Tap for details
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
    right: 10,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 8,
    padding: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
  },
  tooltipTitle: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  tooltipValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  tooltipTime: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '500',
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

export default SimpleLineChart;
