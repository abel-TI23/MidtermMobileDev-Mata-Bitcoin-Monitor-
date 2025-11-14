/**
 * TradingChartSkia Component
 * High-performance candlestick chart using Skia Canvas
 * 
 * PERFORMANCE:
 * - 60 FPS GPU-accelerated rendering
 * - Optimized for 20-200 visible candles
 * 
 * FEATURES:
 * - Candlestick/Line chart modes
 * - EMA21, SMA100 overlays
 * - Volume bars
 * - Current price line
 * - Max/Min markers
 * - Interactive crosshair tooltip
 * 
 * GESTURES:
 * - TAP: Show crosshair with candle details
 * - PINCH: Zoom in/out (2 fingers)
 */

import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Canvas, Line, Rect, Circle, Path, Skia, Text as SkiaText, useFont, Group } from '@shopify/react-native-skia';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Candle } from '../utils/binanceAPI';
import { colors } from '../theme';

interface TradingChartSkiaProps {
  candles: Candle[];
  ema21: (number | null)[];
  sma100: (number | null)[];
  showEMA: boolean;
  showSMA: boolean;
  currentPrice?: number | null;
  chartType?: 'candle' | 'line';
  lineColor?: string;
}

const TradingChartSkia: React.FC<TradingChartSkiaProps> = ({
  candles,
  ema21,
  sma100,
  showEMA,
  showSMA,
  currentPrice,
  chartType = 'candle',
  lineColor = '#3b82f6',
}) => {
  const chartWidth = Dimensions.get('window').width;
  const chartHeight = 350;
  const volumeHeight = 130;
  const margin = { left: 10, right: 30, top: 20, bottom: 40 }; // Y-axis labels di kiri

  // Load font for Skia Text rendering - larger size for visibility
  const font = useFont(null, 12);

  // Reanimated shared values for smooth interactions
  const scale = useSharedValue(1);
  const crosshairX = useSharedValue(-1);
  const crosshairY = useSharedValue(-1);
  const isPressed = useSharedValue(false);
  
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(25);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Initialize visible window - show last 25 candles for better spacing
  useEffect(() => {
    if (candles.length > 0) {
      const defaultWindow = 25;
      setVisibleStart(Math.max(0, candles.length - defaultWindow));
      setVisibleEnd(candles.length);
    }
  }, [candles.length]);

  // Visible candles subset
  const visibleCandles = useMemo(() => {
    return candles.slice(visibleStart, visibleEnd);
  }, [candles, visibleStart, visibleEnd]);

  // Price range calculation
  const priceRange = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 100 };
    const highs = visibleCandles.map(c => c.high);
    const lows = visibleCandles.map(c => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const padding = (max - min) * 0.05;
    return { min: min - padding, max: max + padding };
  }, [visibleCandles]);

  // Volume max
  const volumeMax = useMemo(() => {
    if (visibleCandles.length === 0) return 100;
    return Math.max(...visibleCandles.map(c => c.volume));
  }, [visibleCandles]);

  // Max/Min prices in visible range
  const { maxPrice, minPrice, maxIndex, minIndex } = useMemo(() => {
    if (visibleCandles.length === 0) return { maxPrice: 0, minPrice: 0, maxIndex: -1, minIndex: -1 };
    let max = -Infinity;
    let min = Infinity;
    let maxIdx = -1;
    let minIdx = -1;
    
    visibleCandles.forEach((c, i) => {
      if (c.high > max) {
        max = c.high;
        maxIdx = i;
      }
      if (c.low < min) {
        min = c.low;
        minIdx = i;
      }
    });
    
    return { maxPrice: max, minPrice: min, maxIndex: maxIdx, minIndex: minIdx };
  }, [visibleCandles]);

  // Current live price
  const livePrice = currentPrice ?? (candles.length > 0 ? candles[candles.length - 1].close : null);

  // Coordinate mapping functions
  const toX = useCallback((index: number) => {
    const plotWidth = chartWidth - margin.left - margin.right;
    return margin.left + (index / Math.max(1, visibleCandles.length - 1)) * plotWidth;
  }, [chartWidth, visibleCandles.length, margin]);

  const toY = useCallback((price: number) => {
    const plotHeight = chartHeight - margin.top - margin.bottom;
    const { min, max } = priceRange;
    const range = Math.max(0.001, max - min);
    return margin.top + plotHeight - ((price - min) / range) * plotHeight;
  }, [chartHeight, priceRange, margin]);

  const toVolumeY = useCallback((volume: number) => {
    const plotHeight = volumeHeight - 10 - 30;
    return 10 + plotHeight - (volume / volumeMax) * plotHeight;
  }, [volumeHeight, volumeMax]);

  // Format price for labels
  const formatPrice = (val: number) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(1)}K`;
    return val.toFixed(val < 10 ? 2 : 0);
  };

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const { min, max } = priceRange;
    const step = (max - min) / 5;
    return Array.from({ length: 6 }, (_, i) => min + i * step);
  }, [priceRange]);

  // Long press gesture untuk tooltip yang lebih baik
  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart((event) => {
      const plotWidth = chartWidth - margin.left - margin.right;
      const relX = event.x - margin.left;
      
      if (relX >= 0 && relX <= plotWidth && visibleCandles.length > 0) {
        crosshairX.value = event.x;
        crosshairY.value = event.y;
        isPressed.value = true;
        
        const idx = Math.round((relX / plotWidth) * (visibleCandles.length - 1));
        const clampedIdx = Math.max(0, Math.min(visibleCandles.length - 1, idx));
        runOnJS(setSelectedIndex)(clampedIdx);
      }
    })
    .onEnd(() => {
      isPressed.value = false;
      crosshairX.value = withTiming(-1, { duration: 200 });
      crosshairY.value = withTiming(-1, { duration: 200 });
      runOnJS(setSelectedIndex)(null);
    });

  // Pan gesture untuk tooltip yang bisa di-drag
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      const plotWidth = chartWidth - margin.left - margin.right;
      const relX = event.x - margin.left;
      
      if (relX >= 0 && relX <= plotWidth && visibleCandles.length > 0) {
        crosshairX.value = event.x;
        crosshairY.value = event.y;
        isPressed.value = true;
        
        const idx = Math.round((relX / plotWidth) * (visibleCandles.length - 1));
        const clampedIdx = Math.max(0, Math.min(visibleCandles.length - 1, idx));
        runOnJS(setSelectedIndex)(clampedIdx);
      }
    })
    .onUpdate((event) => {
      const plotWidth = chartWidth - margin.left - margin.right;
      const relX = event.x - margin.left;
      
      if (relX >= 0 && relX <= plotWidth && visibleCandles.length > 0) {
        crosshairX.value = event.x;
        crosshairY.value = event.y;
        
        const idx = Math.round((relX / plotWidth) * (visibleCandles.length - 1));
        const clampedIdx = Math.max(0, Math.min(visibleCandles.length - 1, idx));
        runOnJS(setSelectedIndex)(clampedIdx);
      }
    })
    .onEnd(() => {
      isPressed.value = false;
      crosshairX.value = withTiming(-1, { duration: 200 });
      crosshairY.value = withTiming(-1, { duration: 200 });
      runOnJS(setSelectedIndex)(null);
    });

  // Pinch gesture for zooming
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = event.scale;
    })
    .onEnd(() => {
      const currentWindowSize = visibleEnd - visibleStart;
      if (currentWindowSize <= 0 || candles.length === 0) {
        scale.value = withSpring(1);
        return;
      }
      
      // Calculate new window size with safe bounds
      const zoomFactor = Math.max(0.5, Math.min(2, 1 / scale.value));
      const newSize = Math.round(currentWindowSize * zoomFactor);
      const clampedNewSize = Math.max(15, Math.min(100, Math.min(newSize, candles.length)));
      
      // Center the zoom
      const center = Math.floor((visibleStart + visibleEnd) / 2);
      const halfSize = Math.floor(clampedNewSize / 2);
      let newStart = center - halfSize;
      let newEnd = center + halfSize;
      
      // Adjust if out of bounds
      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(candles.length, clampedNewSize);
      } else if (newEnd > candles.length) {
        newEnd = candles.length;
        newStart = Math.max(0, candles.length - clampedNewSize);
      }
      
      // Only update if valid
      if (newStart >= 0 && newEnd > newStart && newEnd <= candles.length) {
        runOnJS(setVisibleStart)(newStart);
        runOnJS(setVisibleEnd)(newEnd);
      }
      
      scale.value = withSpring(1);
    });

  // Combine gestures - pan untuk tooltip, pinch untuk zoom
  const composed = Gesture.Race(pinchGesture, panGesture, longPressGesture);

  // Animated style for floating tooltip
  const tooltipStyle = useAnimatedStyle(() => {
    const isVisible = isPressed.value && crosshairX.value > 0;
    const tooltipWidth = 180;
    const tooltipHeight = 210;
    
    // Position tooltip on left or right side of crosshair to avoid overlap
    const left = crosshairX.value < chartWidth / 2 
      ? crosshairX.value + 15  // Right side
      : crosshairX.value - tooltipWidth - 15; // Left side
    
    // Keep tooltip within bounds
    const top = Math.max(10, Math.min(chartHeight - tooltipHeight - 10, crosshairY.value - tooltipHeight / 2));
    
    return {
      left,
      top,
      opacity: withTiming(isVisible ? 1 : 0, { duration: 150 }),
      transform: [
        { scale: withSpring(isVisible ? 1 : 0.8) },
      ],
    };
  });

  // Selected candle data with metrics
  const selectedCandle = selectedIndex !== null ? visibleCandles[selectedIndex] : null;
  const selectedMetrics = useMemo(() => {
    if (!selectedCandle) return null;
    
    const change = selectedCandle.close - selectedCandle.open;
    const changePercent = (change / selectedCandle.open) * 100;
    const amplitude = ((selectedCandle.high - selectedCandle.low) / selectedCandle.open) * 100;
    
    return {
      change,
      changePercent,
      amplitude,
      time: new Date(selectedCandle.time).toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  }, [selectedCandle]);

  // Render grid lines with price labels
  const renderGrid = useCallback(() => {
    const gridElements = [];
    
    for (let i = 0; i < yTicks.length; i++) {
      const price = yTicks[i];
      const y = toY(price);
      
      // Horizontal grid line
      gridElements.push(
        <Line
          key={`grid-${i}`}
          p1={{ x: margin.left, y }}
          p2={{ x: chartWidth - margin.right, y }}
          color="rgba(55, 65, 81, 0.25)"
          strokeWidth={0.5}
        />
      );

      // Y-axis price label (di KIRI) - only if font loaded
      if (font) {
        const priceLabel = price >= 100000 
          ? `${(price / 1000).toFixed(1)}K` 
          : price >= 10000
          ? `${(price / 1000).toFixed(2)}K`
          : price.toFixed(0);
        
        gridElements.push(
          <SkiaText
            key={`ylabel-${i}`}
            x={8}
            y={y + 5}
            text={priceLabel}
            font={font}
            color="#9CA3AF"
          />
        );
      }
    }
    
    return gridElements;
  }, [yTicks, toY, chartWidth, font, margin]);

  // Render X-axis time labels
  const renderXAxisLabels = useCallback(() => {
    if (!font || visibleCandles.length === 0) return null;
    
    const labels: any[] = [];
    // Show 4-5 labels evenly spaced
    const numLabels = 5;
    const step = Math.floor(visibleCandles.length / (numLabels - 1));
    
    for (let i = 0; i < numLabels; i++) {
      const index = i === numLabels - 1 ? visibleCandles.length - 1 : i * step;
      if (index >= visibleCandles.length) continue;
      
      const candle = visibleCandles[index];
      const x = toX(index);
      const y = chartHeight - margin.bottom + 15; // Below chart
      
      const date = new Date(candle.time);
      // Format: "8:00 PM" or "8:00 AM"
      const timeLabel = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      
      labels.push(
        <SkiaText
          key={`xlabel-${i}`}
          x={x - 25} // Center align better
          y={y}
          text={timeLabel}
          font={font}
          color="#9CA3AF" // Lebih terang
        />
      );
    }
    
    return labels;
  }, [visibleCandles, toX, chartHeight, font, margin]);

  // Render candles using Skia
  const renderCandles = useCallback(() => {
    if (chartType === 'line') {
      // Line chart - smooth line dengan gradient area seperti SimplePriceChart
      const path = Skia.Path.Make();
      const areaPath = Skia.Path.Make();
      
      if (visibleCandles.length < 2) return null;
      
      // Build smooth line path
      visibleCandles.forEach((candle, i) => {
        const x = toX(i);
        const y = toY(candle.close);
        
        if (i === 0) {
          path.moveTo(x, y);
          areaPath.moveTo(x, y);
        } else {
          path.lineTo(x, y);
          areaPath.lineTo(x, y);
        }
      });
      
      // Close area path to bottom
      const lastX = toX(visibleCandles.length - 1);
      const firstX = toX(0);
      const bottomY = chartHeight - margin.bottom;
      areaPath.lineTo(lastX, bottomY);
      areaPath.lineTo(firstX, bottomY);
      areaPath.close();
      
      return (
        <>
          {/* Gradient area fill */}
          <Path
            path={areaPath}
            color={lineColor}
            opacity={0.15}
            style="fill"
          />
          {/* Line stroke */}
          <Path
            path={path}
            color={lineColor}
            strokeWidth={2.5}
            style="stroke"
            strokeCap="round"
            strokeJoin="round"
          />
        </>
      );
    }

    // Candlestick chart with professional styling
    return visibleCandles.map((candle, i) => {
      const x = toX(i);
      const open = toY(candle.open);
      const close = toY(candle.close);
      const high = toY(candle.high);
      const low = toY(candle.low);
      const isUp = candle.close >= candle.open;
      const fillColor = isUp ? '#22C55E' : '#EF4444';
      const bodyHeight = Math.abs(close - open);
      const bodyY = Math.min(open, close);
      
      // Candle width - lebih sempit untuk spacing yang lebih baik
      const candleWidth = Math.max(3, Math.min(10, (chartWidth - margin.left - margin.right) / visibleCandles.length * 0.5));

      return (
        <React.Fragment key={i}>
          {/* Wick (thin line) */}
          <Line
            p1={{ x, y: high }}
            p2={{ x, y: low }}
            color={fillColor}
            strokeWidth={1.5}
          />
          {/* Body (rectangle) */}
          <Rect
            x={x - candleWidth / 2}
            y={bodyY}
            width={candleWidth}
            height={Math.max(1, bodyHeight)}
            color={fillColor}
          />
        </React.Fragment>
      );
    });
  }, [chartType, visibleCandles, toX, toY, chartWidth, lineColor]);

  // Render EMA21 indicator
  const renderEMA = useCallback(() => {
    if (!showEMA || !ema21 || ema21.length === 0) return null;
    
    const path = Skia.Path.Make();
    let started = false;
    
    visibleCandles.forEach((candle, i) => {
      const emaValue = ema21[visibleStart + i];
      if (emaValue && emaValue > 0) {
        const x = toX(i);
        const y = toY(emaValue);
        
        if (!started) {
          path.moveTo(x, y);
          started = true;
        } else {
          path.lineTo(x, y);
        }
      }
    });
    
    return (
      <Path
        path={path}
        color="#F59E0B"
        strokeWidth={1.5}
        style="stroke"
      />
    );
  }, [showEMA, ema21, visibleCandles, visibleStart, toX, toY]);

  // Render SMA100 indicator
  const renderSMA = useCallback(() => {
    if (!showSMA || !sma100 || sma100.length === 0) return null;
    
    const path = Skia.Path.Make();
    let started = false;
    
    visibleCandles.forEach((candle, i) => {
      const smaValue = sma100[visibleStart + i];
      if (smaValue && smaValue > 0) {
        const x = toX(i);
        const y = toY(smaValue);
        
        if (!started) {
          path.moveTo(x, y);
          started = true;
        } else {
          path.lineTo(x, y);
        }
      }
    });
    
    return (
      <Path
        path={path}
        color="#8B5CF6"
        strokeWidth={1.5}
        style="stroke"
      />
    );
  }, [showSMA, sma100, visibleCandles, visibleStart, toX, toY]);

  // Render volume bars
  const renderVolume = useCallback(() => {
    const volumeChartHeight = 80; // Fixed height for volume section
    const volumeChartTop = chartHeight - margin.bottom - volumeChartHeight - 10;
    
    return visibleCandles.map((candle, i) => {
      const x = toX(i);
      const volumeRatio = candle.volume / volumeMax;
      const barHeight = volumeRatio * volumeChartHeight;
      const barY = volumeChartTop + volumeChartHeight - barHeight;
      const isUp = candle.close >= candle.open;
      const barColor = isUp ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)';
      // Volume bars - sesuaikan dengan lebar candle untuk spacing konsisten
      const barWidth = Math.max(3, Math.min(10, (chartWidth - margin.left - margin.right) / visibleCandles.length * 0.5));
      
      return (
        <Rect
          key={`vol-${i}`}
          x={x - barWidth / 2}
          y={barY}
          width={barWidth}
          height={Math.max(1, barHeight)}
          color={barColor}
        />
      );
    });
  }, [visibleCandles, toX, volumeMax, chartHeight, chartWidth]);

  // Render current price line (dashed effect)
  const renderCurrentPriceLine = useCallback(() => {
    if (!livePrice) return null;
    
    const y = toY(livePrice);
    
    // Just a solid horizontal line - simple and clean
    return (
      <Line
        key="current-price-line"
        p1={{ x: margin.left, y }}
        p2={{ x: chartWidth - margin.right, y }}
        color="#e9eaeeff"
        strokeWidth={2}
        opacity={0.8}
      />
    );
  }, [livePrice, toY, chartWidth, margin]);

  // Render max/min price markers - DISABLED untuk tampilan lebih clean
  const renderMaxMinMarkers = useCallback(() => {
    if (maxIndex === -1 || minIndex === -1) return null;
    
    const maxX = toX(maxIndex);
    const maxY = toY(maxPrice);
    const minX = toX(minIndex);
    const minY = toY(minPrice);
    
    const elements = [];
    
    // Max price marker line
    elements.push(
      <Line
        key="max-line"
        p1={{ x: margin.left, y: maxY }}
        p2={{ x: chartWidth - margin.right, y: maxY }}
        color="rgba(34, 197, 94, 0.3)"
        strokeWidth={1}
      />
    );
    
    // Min price marker line
    elements.push(
      <Line
        key="min-line"
        p1={{ x: margin.left, y: minY }}
        p2={{ x: chartWidth - margin.right, y: minY }}
        color="rgba(239, 68, 68, 0.3)"
        strokeWidth={1}
      />
    );
    
    // Only add text if font is loaded
    if (font) {
      elements.push(
        <SkiaText
          key="max-text"
          x={maxX + 5}
          y={maxY - 5}
          text={`Max ${maxPrice.toFixed(2)}`}
          font={font}
          color="#22C55E"
        />
      );
      
      elements.push(
        <SkiaText
          key="min-text"
          x={minX + 5}
          y={minY + 12}
          text={`Min ${minPrice.toFixed(2)}`}
          font={font}
          color="#EF4444"
        />
      );
    }
    
    return elements;
  }, [maxIndex, minIndex, maxPrice, minPrice, toX, toY, font, margin, chartWidth]);

  // Render crosshair and tooltip
  const renderCrosshair = useCallback(() => {
    if (selectedIndex === null) return null;
    
    const selectedX = toX(selectedIndex);
    const selectedY = toY(visibleCandles[selectedIndex]?.close || 0);
    
    return (
      <>
        {/* Vertical line */}
        <Line
          p1={{ x: selectedX, y: margin.top }}
          p2={{ x: selectedX, y: chartHeight - margin.bottom }}
          color="rgba(156, 163, 175, 0.5)"
          strokeWidth={1}
        />
        {/* Horizontal line */}
        <Line
          p1={{ x: margin.left, y: selectedY }}
          p2={{ x: chartWidth - margin.right, y: selectedY }}
          color="rgba(156, 163, 175, 0.5)"
          strokeWidth={1}
        />
        {/* Center circle */}
        <Circle
          cx={selectedX}
          cy={selectedY}
          r={6}
          color="#3B82F6"
        />
        <Circle
          cx={selectedX}
          cy={selectedY}
          r={3}
          color="#FFF"
        />
      </>
    );
  }, [selectedIndex, visibleCandles, toX, toY, chartHeight, chartWidth]);

  if (candles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading chart data...</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Price Chart</Text>
          <Text style={styles.hint}>👆 Tap & hold on chart</Text>
        </View>

        <GestureDetector gesture={composed}>
          <Animated.View style={[{ width: chartWidth, height: chartHeight }]}>
            <Canvas style={{ width: chartWidth, height: chartHeight }}>
              {/* Background */}
              <Rect
                x={0}
                y={0}
                width={chartWidth}
                height={chartHeight}
                color={colors.background}
              />
              
              {/* Grid with price labels */}
              {renderGrid()}
              
              {/* X-axis time labels */}
              {renderXAxisLabels()}
              
              {/* Candlesticks or Line chart */}
              {renderCandles()}
              
              {/* EMA21 indicator */}
              {renderEMA()}
              
              {/* SMA100 indicator */}
              {renderSMA()}
              
              {/* Max/Min price markers */}
              {renderMaxMinMarkers()}
              
              {/* Current price line (dashed) */}
              {renderCurrentPriceLine()}
              
              {/* Crosshair when candle selected */}
              {renderCrosshair()}
            </Canvas>

            {/* Current price label - React Native Text (positioned on line) */}
            {livePrice && (() => {
              const y = toY(livePrice);
              return (
                <View style={[styles.currentPriceLabel, { top: y - 10, left: chartWidth / 2 }]}>
                  <Text style={styles.currentPriceLabelText}>
                    {livePrice >= 1000 ? `$${(livePrice / 1000).toFixed(1)}K` : `$${livePrice.toFixed(2)}`}
                  </Text>
                </View>
              );
            })()}

            {/* Floating Tooltip Overlay - Binance Style */}
            {selectedCandle && selectedMetrics && (
              <Animated.View style={[styles.floatingTooltip, tooltipStyle]}>
                <View style={styles.tooltipBubble}>
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>Time:</Text>
                    <Text style={styles.tooltipValue}>{selectedMetrics.time}</Text>
                  </View>
                  <View style={styles.tooltipDivider} />
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>O:</Text>
                    <Text style={styles.tooltipValue}>${selectedCandle.open.toFixed(2)}</Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>H:</Text>
                    <Text style={[styles.tooltipValue, { color: '#22C55E' }]}>${selectedCandle.high.toFixed(2)}</Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>L:</Text>
                    <Text style={[styles.tooltipValue, { color: '#EF4444' }]}>${selectedCandle.low.toFixed(2)}</Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>C:</Text>
                    <Text style={styles.tooltipValue}>${selectedCandle.close.toFixed(2)}</Text>
                  </View>
                  <View style={styles.tooltipDivider} />
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>Change:</Text>
                    <Text style={[
                      styles.tooltipValue,
                      { color: selectedMetrics.change >= 0 ? '#22C55E' : '#EF4444', fontWeight: '700' }
                    ]}>
                      {selectedMetrics.change >= 0 ? '+' : ''}{selectedMetrics.changePercent.toFixed(2)}%
                    </Text>
                  </View>
                  <View style={styles.tooltipRow}>
                    <Text style={styles.tooltipLabel}>Vol:</Text>
                    <Text style={styles.tooltipValue}>{formatPrice(selectedCandle.volume)}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </Animated.View>
        </GestureDetector>

        {/* Price info footer */}
        <View style={styles.priceFooter}>
          {livePrice && (
            <Text style={styles.priceText}>
              Current: <Text style={{ color: '#F59E0B', fontWeight: 'bold' }}>${formatPrice(livePrice)}</Text>
            </Text>
          )}
          <Text style={styles.rangeText}>
            H: <Text style={{ color: '#22C55E' }}>${formatPrice(maxPrice)}</Text> • 
            L: <Text style={{ color: '#EF4444' }}> ${formatPrice(minPrice)}</Text>
          </Text>
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Bullish</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Bearish</Text>
          </View>
        </View>

        {/* Footer hint */}
        <Text style={styles.footnote}>
          🖌️ Powered by Skia • 60 FPS • Pinch to zoom • Long press for details
        </Text>
      </View>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 0,
    borderWidth: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 0,
    marginVertical: 0,
    paddingVertical: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  title: {
    color: '#F9FAFB',
    fontSize: 18,
    fontWeight: '700',
  },
  hint: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  indicatorBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  floatingTooltip: {
    position: 'absolute',
    zIndex: 1000,
    pointerEvents: 'none', // Don't block touch events
  },
  tooltipBubble: {
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    borderRadius: 12,
    padding: 14,
    minWidth: 180,
    borderWidth: 1.5,
    borderColor: 'rgba(59, 130, 246, 0.5)',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tooltipDivider: {
    height: 1,
    backgroundColor: 'rgba(75, 85, 99, 0.5)',
    marginVertical: 6,
  },
  tooltipContainer: {
    backgroundColor: 'rgba(17, 24, 39, 0.98)',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    minWidth: 50,
  },
  tooltipValue: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  priceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  priceText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600',
  },
  rangeText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  currentPriceLabel: {
    position: 'absolute',
    backgroundColor: 'rgba(10, 14, 39, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    transform: [{ translateX: -50 }], // Center horizontally
  },
  currentPriceLabelText: {
    color: '#faf8f5ff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  axisLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '500',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingHorizontal: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#E5E7EB',
    fontSize: 11,
    fontWeight: '600',
  },
  footnote: {
    color: colors.accent,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '600',
    opacity: 0.8,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
    padding: 40,
  },
});

export default React.memo(TradingChartSkia);
