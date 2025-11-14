/**
 * SimplePriceChart - Lightweight SVG line chart
 * No gestures, just visual representation
 */

import React, { useMemo } from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

interface SimplePriceChartProps {
  data: number[]; // Array of prices
  height?: number;
  color?: string;
  smooth?: boolean; // use bezier smoothing
  showGradient?: boolean; // fill area under the line with gradient
  gradientOpacityTop?: number; // 0..1
  gradientOpacityBottom?: number; // 0..1
}

export const SimplePriceChart: React.FC<SimplePriceChartProps> = ({
  data,
  height = 80,
  color = '#10B981',
  smooth = true,
  showGradient = true,
  gradientOpacityTop = 0.3,
  gradientOpacityBottom = 0,
}) => {
  const width = Dimensions.get('window').width - 72; // Account for padding

  const gradientId = useMemo(() => `chartGradient-${Math.random().toString(36).slice(2, 9)}`,[data]);
  const path = useMemo(() => {
    if (data.length < 2) return '';

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pts = data.map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 10) - 5;
      return { x, y };
    });

    if (!smooth || pts.length < 3) {
      const segments = pts.map(p => `${p.x},${p.y}`);
      return `M ${segments.join(' L ')}`;
    }

    // Catmull-Rom to Bezier smoothing
    const d: string[] = [];
    d.push(`M ${pts[0].x},${pts[0].y}`);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;
      const tension = 0.5; // 0..1
      const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
      const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
      const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
      const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;
      d.push(`C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`);
    }
    return d.join(' ');
  }, [data, width, height]);

  const areaPath = useMemo(() => {
    if (!path) return '';
    // Close the line to the bottom to form an area
    return `${path} L ${width},${height} L 0,${height} Z`;
  }, [path, width, height]);

  return (
    <View style={{ height, width }}>
      <Svg width={width} height={height} pointerEvents="none">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity={String(gradientOpacityTop)} />
            <Stop offset="1" stopColor={color} stopOpacity={String(gradientOpacityBottom)} />
          </LinearGradient>
        </Defs>
        {showGradient && areaPath ? (
          <Path d={areaPath} fill={`url(#${gradientId})`} stroke="none" />
        ) : null}
        <Path
          d={path}
          stroke={color}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
};
