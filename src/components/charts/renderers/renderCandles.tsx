/**
 * Candle Renderer - For OHLC price data
 * Optimized Skia rendering for candlestick charts
 */

import React from 'react';
import { Line, Rect } from '@shopify/react-native-skia';
import { ChartRenderContext } from '../BaseChart';

export const renderCandles = (ctx: ChartRenderContext) => {
  const { visibleData, toX, toY, margin, width, height } = ctx;
  
  if (visibleData.length === 0) return null;

  const plotWidth = width - margin.left - margin.right;
  const candleWidth = Math.max(2, Math.min(12, plotWidth / visibleData.length * 0.7));

  return (
    <>
      {visibleData.map((candle: any, i) => {
        if (typeof candle.value !== 'object') return null;

        const { open, high, low, close } = candle.value;
        const x = toX(i);
        const yOpen = toY(open);
        const yClose = toY(close);
        const yHigh = toY(high);
        const yLow = toY(low);

        const isGreen = close >= open;
        const color = isGreen ? '#22C55E' : '#EF4444';
        const bodyHeight = Math.abs(yClose - yOpen);

        return (
          <React.Fragment key={`candle-${i}`}>
            {/* Wick */}
            <Line
              p1={{ x, y: yHigh }}
              p2={{ x, y: yLow }}
              color={color}
              strokeWidth={1}
            />
            
            {/* Body */}
            <Rect
              x={x - candleWidth / 2}
              y={Math.min(yOpen, yClose)}
              width={candleWidth}
              height={Math.max(1, bodyHeight)}
              color={color}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
