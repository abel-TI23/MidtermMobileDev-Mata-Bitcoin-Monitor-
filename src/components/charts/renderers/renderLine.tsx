/**
 * Line Renderer - For simple time series data
 * Perfect for: ATR, Fear & Greed Index, single-value indicators
 */

import React from 'react';
import { Path, Skia, Line } from '@shopify/react-native-skia';
import { ChartRenderContext } from '../BaseChart';

export const renderLine = (
  ctx: ChartRenderContext,
  options?: {
    lineColor?: string;
    lineWidth?: number;
    showArea?: boolean;
    areaColor?: string;
    showPoints?: boolean;
  }
) => {
  const {
    lineColor = '#3B82F6',
    lineWidth = 2,
    showArea = false,
    areaColor = 'rgba(59, 130, 246, 0.1)',
    showPoints = false,
  } = options || {};

  const { visibleData, toX, toY, margin, height } = ctx;

  if (visibleData.length === 0) return null;

  // Create line path
  const linePath = Skia.Path.Make();
  visibleData.forEach((point: any, i) => {
    const value = typeof point.value === 'number' ? point.value : point.value.close;
    const x = toX(i);
    const y = toY(value);

    if (i === 0) {
      linePath.moveTo(x, y);
    } else {
      linePath.lineTo(x, y);
    }
  });

  // Create area path if enabled
  let areaPath = null;
  if (showArea) {
    areaPath = Skia.Path.Make();
    const bottomY = height - margin.bottom;
    
    visibleData.forEach((point: any, i) => {
      const value = typeof point.value === 'number' ? point.value : point.value.close;
      const x = toX(i);
      const y = toY(value);

      if (i === 0) {
        areaPath!.moveTo(x, bottomY);
        areaPath!.lineTo(x, y);
      } else {
        areaPath!.lineTo(x, y);
      }
    });

    const lastX = toX(visibleData.length - 1);
    areaPath.lineTo(lastX, bottomY);
    areaPath.close();
  }

  return (
    <>
      {/* Area fill */}
      {showArea && areaPath && (
        <Path path={areaPath} color={areaColor} />
      )}

      {/* Line */}
      <Path
        path={linePath}
        color={lineColor}
        style="stroke"
        strokeWidth={lineWidth}
        strokeCap="round"
        strokeJoin="round"
      />

      {/* Data points */}
      {showPoints && visibleData.map((point: any, i) => {
        const value = typeof point.value === 'number' ? point.value : point.value.close;
        const x = toX(i);
        const y = toY(value);

        return (
          <React.Fragment key={`point-${i}`}>
            <Line
              p1={{ x: x - 2, y: y - 2 }}
              p2={{ x: x + 2, y: y + 2 }}
              color={lineColor}
              strokeWidth={lineWidth}
            />
            <Line
              p1={{ x: x - 2, y: y + 2 }}
              p2={{ x: x + 2, y: y - 2 }}
              color={lineColor}
              strokeWidth={lineWidth}
            />
          </React.Fragment>
        );
      })}
    </>
  );
};
