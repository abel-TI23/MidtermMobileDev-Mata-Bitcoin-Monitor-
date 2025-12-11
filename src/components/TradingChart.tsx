/**
 * TradingChart Component
 * Candlestick/line chart with tap interaction and zoom controls
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableWithoutFeedback, TouchableOpacity, GestureResponderEvent } from 'react-native';
import Svg, { Line, Rect, G, Text as SvgText } from 'react-native-svg';
import { Candle } from '../utils/binanceAPI';
import { colors } from '../theme';
import { useResponsive, normalize, spacing, fontSize } from '../utils/responsive';

interface TradingChartProps {
  candles: Candle[];
  currentPrice?: number | null;
  chartType?: 'candle' | 'line';
}

const TradingChart: React.FC<TradingChartProps> = ({
  candles,
  currentPrice,
  chartType = 'candle',
}) => {
  const { width: screenWidth, hp } = useResponsive();
  const chartWidth = screenWidth; // Full width
  const chartHeight = hp(42); // 42% of screen height
  const volumeHeight = hp(15); // 15% of screen height
  const marginLeft = normalize(60);
  const marginRight = normalize(80);
  const marginTop = spacing.md;
  const marginBottom = spacing.xl;

  // Zoom state with button controls
  const [visibleCandleCount, setVisibleCandleCount] = useState(50);

  // Show last N candles based on zoom level
  const visibleCount = Math.min(visibleCandleCount, candles.length);
  const visibleCandles = useMemo(() => {
    if (candles.length <= visibleCount) return candles;
    return candles.slice(-visibleCount);
  }, [candles, visibleCount]);

  // Zoom functions
  const zoomIn = () => setVisibleCandleCount(prev => Math.max(20, prev - 10));
  const zoomOut = () => setVisibleCandleCount(prev => Math.min(100, prev + 10));
  const resetZoom = () => setVisibleCandleCount(50);

  // Price range
  const priceRange = useMemo(() => {
    if (visibleCandles.length === 0) return { min: 0, max: 1 };
    const highs = visibleCandles.map(c => c.high);
    const lows = visibleCandles.map(c => c.low);
    const max = Math.max(...highs);
    const min = Math.min(...lows);
    const pad = (max - min) * 0.05;
    return { min: min - pad, max: max + pad };
  }, [visibleCandles]);

  const volumeMax = useMemo(() => {
    if (visibleCandles.length === 0) return 1;
    return Math.max(...visibleCandles.map(c => c.volume));
  }, [visibleCandles]);

  // Mapping helpers
  const toX = (i: number) => {
    if (visibleCandles.length <= 1) return marginLeft;
    const usable = chartWidth - marginLeft - marginRight;
    return marginLeft + (i / (visibleCandles.length - 1)) * usable;
  };

  const toY = (price: number) => {
    const { min, max } = priceRange;
    const usable = chartHeight - marginTop - marginBottom;
    return marginTop + (1 - (price - min) / (max - min)) * usable;
  };

  const toVolumeY = (vol: number) => {
    const usable = volumeHeight - 40;
    return 20 + (1 - vol / volumeMax) * usable;
  };

  // Axis ticks
  const yTicks = useMemo(() => {
    const { min, max } = priceRange;
    const steps = 6;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) out.push(min + (i / steps) * (max - min));
    return out;
  }, [priceRange]);

  const volumeTicks = useMemo(() => {
    const steps = 3;
    const out: number[] = [];
    for (let i = 0; i <= steps; i++) out.push((i / steps) * volumeMax);
    return out;
  }, [volumeMax]);

  const xLabels = useMemo(() => {
    const steps = 5;
    const labels: { x: number; text: string }[] = [];
    for (let i = 0; i <= steps; i++) {
      const idx = Math.round((i / steps) * (visibleCandles.length - 1));
      const c = visibleCandles[idx];
      if (!c) continue;
      labels.push({ x: toX(idx), text: new Date(c.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) });
    }
    return labels;
  }, [visibleCandles]);

  // Simple tap crosshair
  const [crossIndex, setCrossIndex] = useState<number | null>(null);

  const handlePress = (evt: GestureResponderEvent) => {
    const x = evt.nativeEvent.locationX;
    if (x < marginLeft || x > chartWidth - marginRight) return;
    const usable = chartWidth - marginLeft - marginRight;
    const ratio = (x - marginLeft) / usable;
    const idx = Math.round(ratio * (visibleCandles.length - 1));
    if (idx >= 0 && idx < visibleCandles.length) {
      setCrossIndex(idx);
    }
  };

  const selectedCandle = crossIndex !== null ? visibleCandles[crossIndex] : null;
  const livePrice = currentPrice ?? (candles.length ? candles[candles.length - 1].close : null);

  const selectedMetrics = useMemo(() => {
    if (!selectedCandle) return null;
    const change = selectedCandle.close - selectedCandle.open;
    const changePercent = (change / selectedCandle.open) * 100;
    const amplitude = ((selectedCandle.high - selectedCandle.low) / selectedCandle.open) * 100;
    return { change, changePercent, amplitude };
  }, [selectedCandle]);

  const formatPrice = (p: number) => {
    if (p >= 1000) return p.toFixed(0);
    if (p >= 100) return p.toFixed(1);
    if (p >= 10) return p.toFixed(2);
    return p.toFixed(3);
  };

  const formatVolume = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
    return v.toFixed(0);
  };

  if (candles.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Loading chart data...</Text>
      </View>
    );
  }

  const maxPrice = Math.max(...visibleCandles.map(c => c.high));
  const minPrice = Math.min(...visibleCandles.map(c => c.low));

  return (
    <View style={styles.container}>
      {/* Floating Tooltip Overlay */}
      {selectedCandle && selectedMetrics && (
        <View style={styles.floatingTooltip} pointerEvents="none">
          <Text style={styles.floatingTitle}>{new Date(selectedCandle.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</Text>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>O</Text><Text style={styles.ttVal}>{selectedCandle.open.toFixed(2)}</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>H</Text><Text style={[styles.ttVal, { color: colors.success }]}>{selectedCandle.high.toFixed(2)}</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>L</Text><Text style={[styles.ttVal, { color: colors.danger }]}>{selectedCandle.low.toFixed(2)}</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>C</Text><Text style={styles.ttVal}>{selectedCandle.close.toFixed(2)}</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>Δ</Text><Text style={[styles.ttVal, { color: selectedMetrics.change >= 0 ? colors.success : colors.danger }]}>{selectedMetrics.change >= 0 ? '+' : ''}{selectedMetrics.change.toFixed(2)} ({selectedMetrics.changePercent.toFixed(2)}%)</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>Ampl</Text><Text style={styles.ttVal}>{selectedMetrics.amplitude.toFixed(2)}%</Text></View>
          <View style={styles.floatingRow}><Text style={styles.ttLabel}>Vol</Text><Text style={styles.ttVal}>{formatVolume(selectedCandle.volume)}</Text></View>
        </View>
      )}

      <View style={styles.headerRow}>
        <Text style={styles.title}>Price Chart</Text>
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={zoomIn} style={styles.zoomButton}>
            <Text style={styles.zoomButtonText}>🔍+</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={resetZoom} style={styles.zoomButtonReset}>
            <Text style={styles.zoomButtonTextSmall}>{visibleCandleCount}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={zoomOut} style={styles.zoomButton}>
            <Text style={styles.zoomButtonText}>🔍−</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableWithoutFeedback onPress={handlePress}>
        <View>
          <Svg width={chartWidth} height={chartHeight}>
          {/* Horizontal grid & y-axis */}
          <G>
            {yTicks.map((tick, i) => (
              <G key={i}>
                <Line x1={marginLeft} y1={toY(tick)} x2={chartWidth - marginRight} y2={toY(tick)} stroke={colors.grid} strokeWidth={0.5} opacity={0.3} />
                <SvgText x={marginLeft - 5} y={toY(tick) + 4} fill={colors.textMuted} fontSize={11} textAnchor="end">{formatPrice(tick)}</SvgText>
              </G>
            ))}
          </G>

          {/* Candles or line */}
          {chartType === 'candle' ? (
            <G>
              {visibleCandles.map((c, i) => {
                const x = toX(i);
                const openY = toY(c.open);
                const closeY = toY(c.close);
                const highY = toY(c.high);
                const lowY = toY(c.low);
                const isUp = c.close >= c.open;
                const color = isUp ? '#22C55E' : '#EF4444';
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(1, Math.abs(closeY - openY));
                const candleWidth = 4; // Increased from 6px
                return (
                  <G key={i}>
                    <Line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth={1.5} />
                    <Rect x={x - candleWidth/2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} />
                  </G>
                );
              })}
            </G>
          ) : (
            <G>
              {visibleCandles.map((c, i) => {
                if (i === visibleCandles.length - 1) return null;
                const x1 = toX(i);
                const y1 = toY(c.close);
                const x2 = toX(i + 1);
                const y2 = toY(visibleCandles[i + 1].close);
                return <Line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#3B82F6" strokeWidth={2} />;
              })}
            </G>
          )}

          {/* Crosshair vertical */}
          {crossIndex !== null && (
            <Line x1={toX(crossIndex)} y1={marginTop} x2={toX(crossIndex)} y2={chartHeight - marginBottom} stroke="rgba(255,255,255,0.6)" strokeWidth={1} strokeDasharray="4,4" />
          )}

          {/* Live price line */}
          {livePrice != null && (
            <G>
              <Line x1={marginLeft} y1={toY(livePrice)} x2={chartWidth - marginRight} y2={toY(livePrice)} stroke="#F59E0B" strokeWidth={2} strokeDasharray="5,5" />
              {/* Price label in center */}
              <Rect x={(chartWidth / 2) - 40} y={toY(livePrice) - 14} width={80} height={28} fill="#F59E0B" rx={4} />
              <SvgText x={chartWidth / 2} y={toY(livePrice) + 5} fill="#000" fontSize={13} fontWeight="700" textAnchor="middle">{livePrice.toFixed(2)}</SvgText>
            </G>
          )}

          {/* Extremes labels */}
          <SvgText x={marginLeft + 8} y={toY(maxPrice) - 6} fill="#22C55E" fontSize={11} fontWeight="700">Max {maxPrice.toFixed(2)}</SvgText>
          <SvgText x={marginLeft + 8} y={toY(minPrice) + 14} fill="#EF4444" fontSize={11} fontWeight="700">Min {minPrice.toFixed(2)}</SvgText>

          {/* X-axis time labels */}
          {xLabels.map((l, i) => (
            <SvgText key={i} x={l.x} y={chartHeight - 25} fill={colors.textMuted} fontSize={10} textAnchor="middle">{l.text}</SvgText>
          ))}
        </Svg>
      </View>
      </TouchableWithoutFeedback>

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#22C55E' }]} /><Text style={styles.legendText}>Bullish</Text></View>
        <View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} /><Text style={styles.legendText}>Bearish</Text></View>
      </View>

      {/* Volume */}
      <Text style={[styles.title, { marginTop: 16, marginLeft: 16 }]}>Volume</Text>
      <Svg width={chartWidth} height={volumeHeight}>
        {/* Volume grid */}
        <G>
          {volumeTicks.map((tick, i) => (
            <G key={i}>
              <Line x1={marginLeft} y1={toVolumeY(tick)} x2={chartWidth - marginRight} y2={toVolumeY(tick)} stroke={colors.grid} strokeWidth={0.4} opacity={0.3} />
              <SvgText x={marginLeft - 5} y={toVolumeY(tick) + 4} fill={colors.textMuted} fontSize={10} textAnchor="end">{formatVolume(tick)}</SvgText>
            </G>
          ))}
        </G>
        {/* Bars */}
        <G>
          {visibleCandles.map((c, i) => {
            const x = toX(i);
            const prev = visibleCandles[i - 1];
            const isUp = !prev || c.close >= prev.close;
            const fill = isUp ? '#22C55E' : '#EF4444';
            const y = toVolumeY(c.volume);
            const barH = volumeHeight - 40 - y + 20;
            const barWidth = 4; // Increased from 5px
            return <Rect key={i} x={x - barWidth/2} y={y} width={barWidth} height={Math.max(1, barH)} fill={fill} opacity={0.8} />;
          })}
        </G>
        {/* X-axis labels for volume */}
        {xLabels.map((l, i) => (
          <SvgText key={i} x={l.x} y={volumeHeight - 10} fill={colors.textMuted} fontSize={10} textAnchor="middle">{l.text}</SvgText>
        ))}
      </Svg>
      <Text style={styles.footnote}>Last {visibleCandles.length} candles • Tap for details • Use 🔍 buttons to zoom (20-100) • Real-time updates</Text>
    </View>
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
    overflow: 'hidden',
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
  zoomControls: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  zoomButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  zoomButtonReset: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    minWidth: 32,
    alignItems: 'center',
  },
  zoomButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  zoomButtonTextSmall: {
    color: '#A78BFA',
    fontSize: 11,
    fontWeight: '700',
  },
  floatingTooltip: {
    position: 'absolute',
    top: 50,
    right: 16,
    zIndex: 20,
    backgroundColor: 'rgba(17,24,39,0.96)',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    minWidth: 120,
  },
  floatingTitle: { color: colors.textPrimary, fontSize: 12, fontWeight: '700', marginBottom: 6 },
  floatingRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  ttLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600' },
  ttVal: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  footnote: { color: '#6B7280', fontSize: 11, textAlign: 'center', marginTop: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 14, textAlign: 'center', padding: 40 },
});

export default React.memo(TradingChart);
