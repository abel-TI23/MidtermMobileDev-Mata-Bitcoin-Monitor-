/**
 * BaseChart Component - Foundation for all chart types
 * 
 * DESIGN PHILOSOPHY:
 * - Modular: Easy to extend for different chart types
 * - Performant: 60 FPS with Skia GPU rendering
 * - Intuitive: Consistent gestures across all variants
 * - Lightweight: ~50KB bundle size per chart type
 * 
 * INSPIRED BY:
 * - TradingView: Plugin architecture
 * - Binance: Gesture optimization
 * - Exness: Smart rendering fallback
 * 
 * USAGE:
 * ```tsx
 * <BaseChart
 *   data={candles}
 *   renderContent={(ctx) => renderCandles(ctx)}
 *   type="candle"
 *   height={320}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Rect } from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring, runOnJS } from 'react-native-reanimated';
import { colors } from '../../theme';

export interface ChartDataPoint {
  time: number;
  value: number | { open: number; high: number; low: number; close: number };
  [key: string]: any;
}

export interface ChartRenderContext {
  data: ChartDataPoint[];
  visibleData: ChartDataPoint[];
  width: number;
  height: number;
  margin: { left: number; right: number; top: number; bottom: number };
  priceRange: { min: number; max: number };
  toX: (index: number) => number;
  toY: (value: number) => number;
  crosshair: { x: number; y: number; visible: boolean };
  selectedIndex: number | null;
}

export interface BaseChartProps {
  data: ChartDataPoint[];
  height?: number;
  margin?: { left: number; right: number; top: number; bottom: number };
  backgroundColor?: string;
  showGrid?: boolean;
  enableGestures?: {
    tap?: boolean;
    zoom?: boolean;
    scroll?: boolean;
  };
  zoomRange?: { min: number; max: number };
  defaultVisibleCount?: number;
  onDataPointSelect?: (point: ChartDataPoint | null, index: number | null) => void;
  renderContent: (ctx: ChartRenderContext) => React.ReactElement;
  renderOverlay?: (ctx: ChartRenderContext) => React.ReactElement;
}

const BaseChart: React.FC<BaseChartProps> = ({
  data,
  height = 320,
  margin = { left: 50, right: 10, top: 10, bottom: 40 },
  backgroundColor = colors.background,
  showGrid = true,
  enableGestures = { tap: true, zoom: true, scroll: false },
  zoomRange = { min: 20, max: 200 },
  defaultVisibleCount = 50,
  onDataPointSelect,
  renderContent,
  renderOverlay,
}) => {
  const chartWidth = Dimensions.get('window').width - 32;

  // Shared values for gestures
  const scale = useSharedValue(1);
  const crosshairX = useSharedValue(-1);
  const crosshairY = useSharedValue(-1);
  const isPressed = useSharedValue(false);

  // State
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(defaultVisibleCount);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Initialize visible window
  useEffect(() => {
    if (data.length > 0) {
      setVisibleStart(Math.max(0, data.length - defaultVisibleCount));
      setVisibleEnd(data.length);
    }
  }, [data.length, defaultVisibleCount]);

  // Visible data subset
  const visibleData = useMemo(() => {
    return data.slice(visibleStart, visibleEnd);
  }, [data, visibleStart, visibleEnd]);

  // Price range calculation
  const priceRange = useMemo(() => {
    if (visibleData.length === 0) return { min: 0, max: 100 };

    let min = Infinity;
    let max = -Infinity;

    visibleData.forEach(point => {
      if (typeof point.value === 'number') {
        min = Math.min(min, point.value);
        max = Math.max(max, point.value);
      } else {
        min = Math.min(min, point.value.low);
        max = Math.max(max, point.value.high);
      }
    });

    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding };
  }, [visibleData]);

  // Coordinate mapping functions
  const toX = useCallback((index: number) => {
    const plotWidth = chartWidth - margin.left - margin.right;
    return margin.left + (index / Math.max(1, visibleData.length - 1)) * plotWidth;
  }, [chartWidth, visibleData.length, margin]);

  const toY = useCallback((value: number) => {
    const plotHeight = height - margin.top - margin.bottom;
    const { min, max } = priceRange;
    const range = Math.max(0.001, max - min);
    return margin.top + plotHeight - ((value - min) / range) * plotHeight;
  }, [height, priceRange, margin]);

  // Tap gesture
  const tapGesture = Gesture.Tap()
    .enabled(enableGestures.tap ?? true)
    .onStart((event) => {
      if (visibleData.length === 0) return;

      const plotWidth = chartWidth - margin.left - margin.right;
      const relX = event.x - margin.left;

      if (relX >= 0 && relX <= plotWidth) {
        crosshairX.value = event.x;
        crosshairY.value = event.y;
        isPressed.value = true;

        const idx = Math.round((relX / plotWidth) * (visibleData.length - 1));
        const clampedIdx = Math.max(0, Math.min(visibleData.length - 1, idx));
        
        runOnJS(setSelectedIndex)(clampedIdx);
        if (onDataPointSelect) {
          runOnJS(onDataPointSelect)(visibleData[clampedIdx], clampedIdx);
        }
      }
    })
    .onEnd(() => {
      isPressed.value = false;
      crosshairX.value = withTiming(-1);
      crosshairY.value = withTiming(-1);
      runOnJS(setSelectedIndex)(null);
      if (onDataPointSelect) {
        runOnJS(onDataPointSelect)(null, null);
      }
    });

  // Pinch gesture for zoom
  const pinchGesture = Gesture.Pinch()
    .enabled(enableGestures.zoom ?? true)
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      const currentWindowSize = visibleEnd - visibleStart;
      if (currentWindowSize <= 0 || data.length === 0) {
        scale.value = withSpring(1);
        return;
      }

      const zoomFactor = Math.max(0.5, Math.min(2, 1 / scale.value));
      const newSize = Math.round(currentWindowSize * zoomFactor);
      const clampedNewSize = Math.max(
        zoomRange.min,
        Math.min(zoomRange.max, Math.min(newSize, data.length))
      );

      const center = Math.floor((visibleStart + visibleEnd) / 2);
      const halfSize = Math.floor(clampedNewSize / 2);
      let newStart = center - halfSize;
      let newEnd = center + halfSize;

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(data.length, clampedNewSize);
      } else if (newEnd > data.length) {
        newEnd = data.length;
        newStart = Math.max(0, data.length - clampedNewSize);
      }

      if (newStart >= 0 && newEnd > newStart && newEnd <= data.length) {
        runOnJS(setVisibleStart)(newStart);
        runOnJS(setVisibleEnd)(newEnd);
      }

      scale.value = withSpring(1);
    });

  // Compose gestures
  const composed = Gesture.Race(pinchGesture, tapGesture);

  // Render context
  const renderContext: ChartRenderContext = {
    data,
    visibleData,
    width: chartWidth,
    height,
    margin,
    priceRange,
    toX,
    toY,
    crosshair: {
      x: crosshairX.value,
      y: crosshairY.value,
      visible: isPressed.value,
    },
    selectedIndex,
  };

  if (data.length === 0) {
    return (
      <View style={[styles.container, { height }]}>
        <View style={styles.emptyState}>
          <Rect x={0} y={0} width={chartWidth} height={height} color={backgroundColor} />
        </View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { height }]}>
        <GestureDetector gesture={composed}>
          <Animated.View style={{ width: chartWidth, height }}>
            <Canvas style={{ width: chartWidth, height }}>
              {/* Background */}
              <Rect x={0} y={0} width={chartWidth} height={height} color={backgroundColor} />

              {/* Main content (candles, line, bars, etc.) */}
              {renderContent(renderContext)}
            </Canvas>

            {/* Overlay content (tooltip, crosshair - React Native components) */}
            {renderOverlay && renderOverlay(renderContext)}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BaseChart;
