/**
 * Bar Renderer - For volume and histogram data
 * Perfect for: Volume bars, MACD histogram, etc.
 */

import React from 'react';
import { Rect } from '@shopify/react-native-skia';
import { ChartRenderContext } from '../BaseChart';

export const renderBars = (
  ctx: ChartRenderContext,
  options?: {
    barColor?: string | ((value: number, index: number) => string);
    barWidth?: number;
    baselineValue?: number;
  }
) => {
  const {
    barColor = '#3B82F6',
    barWidth,
    baselineValue = 0,
  } = options || {};

  const { visibleData, toX, toY, margin, width } = ctx;

  if (visibleData.length === 0) return null;

  const plotWidth = width - margin.left - margin.right;
  const defaultBarWidth = Math.max(2, Math.min(10, plotWidth / visibleData.length * 0.6));
  const finalBarWidth = barWidth || defaultBarWidth;
  const baselineY = toY(baselineValue);

  return (
    <>
      {visibleData.map((point: any, i) => {
        const value = typeof point.value === 'number' ? point.value : point.value.close;
        const x = toX(i);
        const y = toY(value);
        const barHeight = Math.abs(y - baselineY);
        
        const color = typeof barColor === 'function' 
          ? barColor(value, i) 
          : barColor;

        return (
          <Rect
            key={`bar-${i}`}
            x={x - finalBarWidth / 2}
            y={Math.min(y, baselineY)}
            width={finalBarWidth}
            height={Math.max(1, barHeight)}
            color={color}
          />
        );
      })}
    </>
  );
};
