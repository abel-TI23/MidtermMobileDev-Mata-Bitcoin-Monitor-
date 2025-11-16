import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Canvas, Path, Line, Circle, Skia } from '@shopify/react-native-skia';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors } from '../../theme';

export interface FearGreedHistoryPoint { time: number; value: number; classification: string; }
interface Props { data: FearGreedHistoryPoint[]; height?: number; }

// Simple line chart with area gradient + vertical/horizontal pinch zoom & tap crosshair.
export const FearGreedHistoryChart: React.FC<Props> = ({ data, height = 220 }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [rangeStart, setRangeStart] = useState(0);
  const [rangeEnd, setRangeEnd] = useState(data.length);
  const [verticalScale, setVerticalScale] = useState(1); // 1..3

  const visible = useMemo(() => data.slice(rangeStart, rangeEnd), [data, rangeStart, rangeEnd]);

  const margin = { left: 40, right: 12, top: 12, bottom: 28 };
  const width = 360; // will be stretched to parent width with flex styles
  const chartW = width - margin.left - margin.right;
  const chartH = height - margin.top - margin.bottom;

  const minVal = 0; // Fear & Greed fixed domain 0..100
  const maxVal = 100;
  const domainSpan = (maxVal - minVal) / verticalScale;
  const center = (maxVal + minVal) / 2; // 50
  const adjMin = Math.max(0, center - domainSpan / 2);
  const adjMax = Math.min(100, center + domainSpan / 2);

  const toX = (i: number) => margin.left + (i / Math.max(1, visible.length - 1)) * chartW;
  const toY = (v: number) => {
    const span = Math.max(1, adjMax - adjMin);
    return margin.top + chartH - ((v - adjMin) / span) * chartH;
  };

  const path = Skia.Path.Make();
  visible.forEach((p, i) => {
    const x = toX(i);
    const y = toY(p.value);
    if (i === 0) path.moveTo(x, y); else path.lineTo(x, y);
  });

  const tap = Gesture.Tap().onStart(e => {
    const relX = e.x - margin.left;
    if (relX >= 0 && relX <= chartW) {
      const idx = Math.round((relX / chartW) * (visible.length - 1));
      setSelectedIndex(idx);
    }
  });

  const pinch = Gesture.Pinch().onUpdate(e => {
    const currentWindow = rangeEnd - rangeStart;
    const zoomDir = e.scale < 1 ? 1 : -1; // pinch in => scale>1
    // Horizontal zoom: adjust window size
    const newSize = Math.min(data.length, Math.max(10, currentWindow + zoomDir * 3));
    const centerIdx = rangeStart + currentWindow / 2;
    let newStart = Math.round(centerIdx - newSize / 2);
    let newEnd = Math.round(centerIdx + newSize / 2);
    if (newStart < 0) { newStart = 0; newEnd = newSize; }
    if (newEnd > data.length) { newEnd = data.length; newStart = data.length - newSize; }
    setRangeStart(newStart); setRangeEnd(newEnd);
    // Vertical zoom: adjust verticalScale based on average finger distance change (approx by e.scale)
    const vScale = e.scale > 1 ? Math.min(3, verticalScale + 0.05) : Math.max(1, verticalScale - 0.05);
    setVerticalScale(vScale);
  });

  const composed = Gesture.Simultaneous(tap, pinch);

  // X axis labels (5 evenly spaced)
  const xLabels = useMemo(() => {
    const labels: { x: number; text: string }[] = [];
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const idx = Math.round(i / steps * (visible.length - 1));
      const p = visible[idx];
      if (!p) continue;
      labels.push({ x: toX(idx), text: new Date(p.time).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }) });
    }
    return labels;
  }, [visible]);

  const yTicks = [adjMin, adjMin + (adjMax - adjMin) * 0.25, adjMin + (adjMax - adjMin) * 0.5, adjMin + (adjMax - adjMin) * 0.75, adjMax];

  const selectedPoint = selectedIndex != null ? visible[selectedIndex] : null;

  return (
    <GestureDetector gesture={composed}>
      <View style={{ height }}>
        <Canvas style={{ flex: 1 }}>
          {/* Grid */}
          {yTicks.map((t, i) => (
            <Line key={i} p1={{ x: margin.left, y: toY(t) }} p2={{ x: width - margin.right, y: toY(t) }} color="rgba(255,255,255,0.06)" strokeWidth={1} />
          ))}

          {/* Line */}
          <Path path={path} color="#FDE68A" style="stroke" strokeWidth={2} />

          {/* Crosshair */}
          {selectedPoint && (
            <>
              <Line p1={{ x: toX(selectedIndex!), y: margin.top }} p2={{ x: toX(selectedIndex!), y: height - margin.bottom }} color="rgba(255,255,255,0.4)" strokeWidth={1} />
              <Circle cx={toX(selectedIndex!)} cy={toY(selectedPoint.value)} r={5} color="#FDE68A" />
              <Circle cx={toX(selectedIndex!)} cy={toY(selectedPoint.value)} r={2} color="#1F2937" />
            </>
          )}
        </Canvas>
        {/* Axes labels */}
        <View style={styles.xAxisLabels}>
          {xLabels.map((l, i) => (
            <Text key={i} style={[styles.xLabel, { left: l.x - 18 }]}>{l.text}</Text>
          ))}
        </View>
        <View style={styles.yAxisLabels}>
          {yTicks.map((t,i) => (
            <Text key={i} style={[styles.yLabel, { top: toY(t) - 6 }]}>{Math.round(t)}</Text>
          ))}
        </View>
        {selectedPoint && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipValue}>{selectedPoint.value.toFixed(0)}</Text>
            <Text style={styles.tooltipText}>{selectedPoint.classification}</Text>
            <Text style={styles.tooltipDate}>{new Date(selectedPoint.time).toLocaleDateString()}</Text>
          </View>
        )}
      </View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  xAxisLabels: { position: 'absolute', bottom: 4, left: 0, right: 0, height: 18 },
  xLabel: { position: 'absolute', color: '#6B7280', fontSize: 10 },
  yAxisLabels: { position: 'absolute', top: 0, bottom: 0, left: 4, width: 34 },
  yLabel: { position: 'absolute', color: '#6B7280', fontSize: 10, textAlign: 'right', width: '100%' },
  tooltip: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(17,24,39,0.95)', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(253,230,138,0.4)' },
  tooltipValue: { color: '#FDE68A', fontSize: 16, fontWeight: '700' },
  tooltipText: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', marginTop: 2 },
  tooltipDate: { color: '#9CA3AF', fontSize: 10, marginTop: 2 },
});

export default FearGreedHistoryChart;
