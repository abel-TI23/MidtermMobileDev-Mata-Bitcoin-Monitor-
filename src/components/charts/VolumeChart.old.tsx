/**
 * VolumeChart - Bar chart for trading volume
 * Lightweight with tap-to-show tooltip
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas, Line, Rect, useFont } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue, runOnJS } from 'react-native-reanimated';

interface VolumeDataPoint {
  time: number;
  volume: number;
  priceChange?: number; // For green/red coloring
}

interface VolumeChartProps {
  data: VolumeDataPoint[];
  height?: number;
}

export function VolumeChart({ data, height = 150 }: VolumeChartProps) {
  const [selectedBar, setSelectedBar] = useState<VolumeDataPoint | null>(null);
  const tapX = useSharedValue(0);
  const tapY = useSharedValue(0);

  const chartWidth = 0; // will be measured via onLayout
  const chartHeight = height; // parent will handle spacing
  const margin = { left: 8, right: 8, top: 8, bottom: 8 };

  const plotWidth = chartWidth - margin.left - margin.right;
  const plotHeight = chartHeight - margin.top - margin.bottom;

  // Find max volume for scaling
  const maxVolume = Math.max(...data.map(d => d.volume), 1);
  
  // Bar width
  const barWidth = Math.max(2, plotWidth / data.length - 1);

  // Map volume to height
  const toHeight = (volume: number) => {
    return (volume / maxVolume) * plotHeight;
  };

  // Handle tap
  const handleTap = (x: number, y: number) => {
    'worklet';
    const barIndex = Math.floor((x - margin.left) / (barWidth + 1));
    if (barIndex >= 0 && barIndex < data.length) {
      runOnJS(setSelectedBar)(data[barIndex]);
    } else {
      runOnJS(setSelectedBar)(null);
    }
  };

  const tapGesture = Gesture.Tap()
    .onStart((e) => {
      tapX.value = e.x;
      tapY.value = e.y;
      handleTap(e.x, e.y);
    });

  // Format volume
  const formatVolume = (vol: number): string => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)}B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)}M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)}K`;
    return vol.toFixed(0);
  };

  const [width, setWidth] = useState<number>(0);

  const effectiveWidth = useMemo(() => Math.max(0, width || 0), [width]);

  return (
    <View style={{ height }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <GestureDetector gesture={tapGesture}>
        <Canvas style={{ width: effectiveWidth, height: chartHeight }}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = margin.top + plotHeight * (1 - ratio);
            return (
              <Line
                key={`grid-${i}`}
                p1={{ x: margin.left, y }}
                p2={{ x: (effectiveWidth || 0) - margin.right, y }}
                color="rgba(255, 255, 255, 0.05)"
                strokeWidth={1}
              />
            );
          })}

          {/* Volume bars */}
          {data.map((point, i) => {
            const plotW = Math.max(1, (effectiveWidth || 1) - margin.left - margin.right);
            const bw = Math.max(2, plotW / data.length - 1);
            const x = margin.left + i * (bw + 1);
            const barHeight = toHeight(point.volume);
            const y = margin.top + plotHeight - barHeight;
            
            // Color based on price change
            let color = '#6B7280'; // Gray default
            if (point.priceChange !== undefined) {
              color = point.priceChange >= 0 ? '#10B981' : '#EF4444';
            }
            
            // Highlight selected bar
            if (selectedBar && selectedBar.time === point.time) {
              color = '#3B82F6'; // Blue highlight
            }

            return (
              <Rect
                key={`bar-${i}`}
                x={x}
                y={y}
                width={bw}
                height={barHeight}
                color={color}
                opacity={0.8}
              />
            );
          })}
        </Canvas>
      </GestureDetector>

      {/* Tooltip */}
      {selectedBar && (
        <View style={styles.tooltip}
        >
          <Text style={styles.tooltipValue}>{formatVolume(selectedBar.volume)}</Text>
          <Text style={styles.tooltipDate}>
            {new Date(selectedBar.time).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tooltip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(17, 24, 39, 0.95)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    minWidth: 100,
    alignItems: 'center',
  },
  tooltipValue: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  tooltipDate: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '500',
  },
});
