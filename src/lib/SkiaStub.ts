// Minimal JS stub for @shopify/react-native-skia used only for demo builds
// Exports React components that render nothing and no-op helpers to satisfy imports
import React from 'react';

export const Canvas: React.FC<any> = () => null;
export const Line: React.FC<any> = () => null;
export const Rect: React.FC<any> = () => null;
export const Circle: React.FC<any> = () => null;
export const PathComponent: React.FC<any> = () => null;
export const Group: React.FC<any> = () => null;
export const Text: React.FC<any> = () => null;

// Many files import { Path } as a component name. Export alias.
export const Path = PathComponent;

// Hooks
export function useFont(): any {
  return null;
}

// Skia object with minimal Path API used in charts
export const Skia = {
  Path: {
    Make: () => ({
      moveTo: (_x: number, _y: number) => {},
      lineTo: (_x: number, _y: number) => {},
      close: () => {},
    }),
    MakeFromSVGString: (_svg: string) => ({}),
  },
};

export default {
  Canvas,
  Line,
  Rect,
  Circle,
  Path,
  Group,
  Text,
  useFont,
  Skia,
};
