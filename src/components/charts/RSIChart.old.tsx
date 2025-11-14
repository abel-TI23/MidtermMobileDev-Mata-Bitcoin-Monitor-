/**
 * RSIChart - Oscillator chart for Relative Strength Index
 * Lightweight with tap-to-show tooltip and overbought/oversold zones
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Line, Path, Skia, Circle, Rect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

interface RSIDataPoint {
  time: number;
  rsi: number;
}

interface RSIChartProps {
  data: RSIDataPoint[];
  title?: string;
  height?: number;
  overbought?: number; // Default 70
  oversold?: number; // Default 30
}

export function RSIChart({ 
  data, 
  title = 'RSI (14)', 
  height = 150,
  overbought = 70,
  oversold = 30,
}: RSIChartProps) {
  const [selectedPoint, setSelectedPoint] = useState<RSIDataPoint | null>(null);
  const [tapPosition, setTapPosition] = useState<{ x: number; y: number } | null>(null);

  const chartWidth = Dimensions.get('window').width - 32; // Full width minus margins
  const chartHeight = height - 40;
  const margin = { left: 0, right: 40, top: 20, bottom: 25 };

  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // RSI always 0-100
  const toX = (index: number) => {
    return margin.left + (index / (data.length - 1)) * plotWidth;
  };

  const toY = (rsi: number) => {
    return margin.top + plotHeight - (rsi / 100) * plotHeight;
  };

  // Create path
  const path = Skia.Path.Make();
  if (data.length > 0) {
    path.moveTo(toX(0), toY(data[0].rsi));
    data.forEach((point, i) => {
      if (i > 0) {
        path.lineTo(toX(i), toY(point.rsi));
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
      runOnJS(setTapPosition)({ x: toX(index), y: toY(data[index].rsi) });
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
      const clearSelection = () => {
        setSelectedPoint(null);
        setTapPosition(null);
      };
      setTimeout(clearSelection, 2000);
    });

  // Get signal
  const getSignal = (rsi: number | undefined) => {
    if (!rsi) return null;
    if (rsi >= overbought) return { text: 'Overbought', color: '#EF4444' };
    if (rsi <= oversold) return { text: 'Oversold', color: '#10B981' };
    return { text: 'Neutral', color: '#6B7280' };
  };

  const currentSignal = selectedPoint ? getSignal(selectedPoint.rsi) : getSignal(data[data.length - 1]?.rsi);
  
  // Current RSI for label
  const currentRSI = data.length > 0 ? data[data.length - 1].rsi : null;
  const currentY = currentRSI ? toY(currentRSI) : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {currentSignal && (
          <Text style={[styles.signal, { color: currentSignal.color }]}>
            {currentSignal.text}
          </Text>
        )}
      </View>
      
      <GestureDetector gesture={tapGesture}>
        <Canvas style={{ width: chartWidth, height: chartHeight }}>
          {/* Overbought zone (red) */}
          <Rect
            x={margin.left}
            y={margin.top}
            width={plotWidth}
            height={toY(overbought) - margin.top}
            color="rgba(239, 68, 68, 0.1)"
          />

          {/* Oversold zone (green) */}
          <Rect
            x={margin.left}
            y={toY(oversold)}
            width={plotWidth}
            height={margin.top + plotHeight - toY(oversold)}
            color="rgba(16, 185, 129, 0.1)"
          />

          {/* Grid lines */}
          {[0, 30, 50, 70, 100].map((value) => {
            const y = toY(value);
            const isZone = value === 30 || value === 70;
            return (
              <Line
                key={`grid-${value}`}
                p1={{ x: margin.left, y }}
                p2={{ x: chartWidth - margin.right, y }}
                color={isZone ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)'}
                strokeWidth={isZone ? 1.5 : 1}
              />
            );
          })}

          {/* RSI line */}
          <Path
            path={path}
            color="#8B5CF6"
            style="stroke"
            strokeWidth={2.5}
          />

          {/* Current RSI horizontal line (dinamis) */}
          {data.length > 0 && (() => {
            const rsi = data[data.length - 1].rsi;
            const y = toY(rsi);
            return (
              <Line
                p1={{ x: margin.left, y }}
                p2={{ x: chartWidth - margin.right, y }}
                color="#8B5CF6"
                strokeWidth={1.5}
                opacity={0.6}
              />
            );
          })()}

          {/* Selected point marker */}
          {tapPosition && (
            <>
              <Circle
                cx={tapPosition.x}
                cy={tapPosition.y}
                r={6}
                color="#8B5CF6"
              />
              <Circle
                cx={tapPosition.x}
                cy={tapPosition.y}
                r={3}
                color="#FFFFFF"
              />
            </>
          )}
        </Canvas>
      </GestureDetector>

      {/* Current RSI value label - React Native Text */}
      {currentRSI && currentY && (
        <View style={[styles.currentLabel, { top: currentY - 10 }]}>
          <Text style={styles.currentLabelText}>
            {currentRSI.toFixed(1)}
          </Text>
        </View>
      )}

      {/* Tooltip */}
      {selectedPoint && (
        <View style={styles.tooltip}>
          <Text style={styles.tooltipLabel}>RSI</Text>
          <Text style={styles.tooltipValue}>{selectedPoint.rsi.toFixed(2)}</Text>
          <Text style={styles.tooltipDate}>
            {new Date(selectedPoint.time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
        </View>
      )}

      <Text style={styles.footnote}>💡 Overbought (&gt;70) • Oversold (&lt;30) • Tap for details</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '700',
  },
  signal: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  currentLabel: {
    position: 'absolute',
    right: 15,
    backgroundColor: 'transparent',
  },
  currentLabelText: {
    color: '#8B5CF6',
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
    borderColor: 'rgba(139, 92, 246, 0.3)',
    minWidth: 80,
    alignItems: 'center',
  },
  tooltipLabel: {
    color: '#9CA3AF',
    fontSize: 9,
    fontWeight: '600',
    marginBottom: 2,
  },
  tooltipValue: {
    color: '#8B5CF6',
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
