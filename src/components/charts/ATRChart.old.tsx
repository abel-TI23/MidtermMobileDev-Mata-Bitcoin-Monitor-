/**
 * ATRChart - Line chart for Average True Range (volatility indicator)
 * Lightweight with tap-to-show tooltip
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Line, Path, Skia, Circle } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface ATRDataPoint {
  time: number;
  atr: number;
}

interface ATRChartProps {
  data: ATRDataPoint[];
  title?: string;
  height?: number;
  period?: number; // ATR period (default 14)
}

export function ATRChart({ data, title = 'ATR (14)', height = 150, period = 14 }: ATRChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<ATRDataPoint | null>(null);
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);

  const chartWidth = Dimensions.get('window').width - 50;
  const chartHeight = height - 40;
  const margin = { left: 0, right: 20, top: 20, bottom: 30 };

  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Find min/max for scaling
  const atrValues = data.map(d => d.atr);
  const minATR = Math.min(...atrValues);
  const maxATR = Math.max(...atrValues);
  const range = maxATR - minATR || 1;

  // Coordinate mappers
  const toX = (index: number) => {
    return margin.left + (index / (data.length - 1)) * plotWidth;
  };

  const toY = (atr: number) => {
    return margin.top + plotHeight - ((atr - minATR) / range) * plotHeight;
  };

  // Create path
  const path = Skia.Path.Make();
  if (data.length > 0) {
    path.moveTo(toX(0), toY(data[0].atr));
    data.forEach((point, i) => {
      if (i > 0) {
        path.lineTo(toX(i), toY(point.atr));
      }
    });
  }

  // Handle tap
  const handleTap = (x: number, y: number) => {
    'worklet';
    if (data.length === 0) return;
    
    const relativeX = x - margin.left;
    const index = Math.round((relativeX / plotWidth) * (data.length - 1));
    
    if (index >= 0 && index < data.length && data[index]) {
      runOnJS(setSelectedPoint)(data[index]);
      runOnJS(setTapPosition)({ x: toX(index), y: toY(data[index].atr) });
    } else {
      runOnJS(setSelectedPoint)(null);
      runOnJS(setTapPosition)(null);
    }
  };

  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      handleTap(e.x, e.y);
    })
    .onEnd(() => {
      // Clear selection after delay - use worklet-safe approach
      const clearSelection = () => {
        setSelectedPoint(null);
        setTapPosition(null);
      };
      setTimeout(clearSelection, 2000);
    });

  // Get current ATR value for label
  const currentATR = data.length > 0 ? data[data.length - 1].atr : null;
  const currentY = currentATR ? toY(currentATR) : null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      
      <GestureDetector gesture={tapGesture}>
        <Canvas style={{ width: chartWidth, height: chartHeight }}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = margin.top + plotHeight * ratio;
            return (
              <Line
                key={`grid-${i}`}
                p1={{ x: margin.left, y }}
                p2={{ x: chartWidth - margin.right, y }}
                color="rgba(255, 255, 255, 0.05)"
                strokeWidth={1}
              />
            );
          })}

          {/* ATR line */}
          <Path
            path={path}
            color="#ff7214ff"
            style="stroke"
            strokeWidth={2.5}
          />

          {/* Area fill (optional subtle gradient) */}
          <Path
            path={(() => {
              const areaPath = Skia.Path.MakeFromSVGString(path.toSVGString() || '');
              if (areaPath && data.length > 0) {
                areaPath.lineTo(toX(data.length - 1), margin.top + plotHeight);
                areaPath.lineTo(toX(0), margin.top + plotHeight);
                areaPath.close();
              }
              return areaPath || path;
            })()}
            color="rgba(245, 158, 11, 0.15)"
            style="fill"
          />

          {/* Current ATR horizontal line (dinamis) */}
          {data.length > 0 && (() => {
            const currentATR = data[data.length - 1].atr;
            const currentY = toY(currentATR);
            return (
              <Line
                p1={{ x: margin.left, y: currentY }}
                p2={{ x: chartWidth - margin.right, y: currentY }}
                color="#fcf7f0ff"
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })()}

          {/* Selected point marker */}
          {tapPosition && (
            <Circle
              cx={tapPosition.x}
              cy={tapPosition.y}
              r={5}
              color="#F59E0B"
            />
          )}
        </Canvas>
      </GestureDetector>

      {/* Current ATR value label - React Native Text */}
      {currentATR && currentY && (
        <View style={[styles.currentLabel, { top: currentY - 10 }]}>
          <Text style={styles.currentLabelText}>
            {currentATR.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Tooltip */}
      {selectedPoint && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipLabel}>ATR</Text>
          <Text style={styles.tooltipValue}>{selectedPoint.atr.toFixed(4)}</Text>
          <Text style={styles.tooltipDate}>
            {new Date(selectedPoint.time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      <Text style={styles.footnote}>💡 Measures market volatility • Tap for details</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#161B33',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  currentLabel: {
    position: 'absolute',
    right: 15,
    backgroundColor: 'transparent',
  },
  currentLabelText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  tooltip: {
    position: 'absolute',
    top: 35,
    right: 20,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    minWidth: 90,
    alignItems: 'center',
  },
  tooltipLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipValue: {
    color: '#F59E0B',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tooltipDate: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '500',
  },
  footnote: {
    color: '#6B7280',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 6,
    opacity: 0.7,
  },
});
