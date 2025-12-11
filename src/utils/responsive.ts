/**
 * Responsive Design Utilities for React Native
 * 
 * Provides helpers for creating responsive layouts that adapt to different screen sizes
 */

import { Dimensions, PixelRatio, Platform, ScaledSize } from 'react-native';
import { useEffect, useState } from 'react';

// Get initial screen dimensions
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base dimensions (iPhone 11 Pro as design reference)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Breakpoints for different device types
export const BREAKPOINTS = {
  SMALL_PHONE: 320,   // iPhone SE
  PHONE: 375,         // iPhone 11 Pro, 12 Mini
  LARGE_PHONE: 414,   // iPhone 11 Pro Max, 12 Pro Max
  TABLET: 768,        // iPad Mini, Portrait tablets
  LARGE_TABLET: 1024, // iPad Pro 11", Landscape tablets
  XLARGE_TABLET: 1366, // iPad Pro 12.9", Desktop
};

/**
 * Custom hook for reactive window dimensions
 * Auto re-renders when orientation changes or device folds/unfolds
 * USE THIS in functional components for dynamic responsive behavior
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = dimensions;
  
  // Orientation detection
  const isLandscape = width > height;
  const isPortrait = height > width;
  
  // Device type detection with large-tablet support
  const isSmallPhone = width < BREAKPOINTS.PHONE;
  const isPhone = width >= BREAKPOINTS.PHONE && width < BREAKPOINTS.TABLET;
  const isTablet = width >= BREAKPOINTS.TABLET && width < BREAKPOINTS.LARGE_TABLET;
  const isLargeTablet = width >= BREAKPOINTS.LARGE_TABLET && width < BREAKPOINTS.XLARGE_TABLET;
  const isXLargeTablet = width >= BREAKPOINTS.XLARGE_TABLET;
  
  // Adaptive column count based on device and orientation
  const getColumnCount = (): number => {
    if (isXLargeTablet) return isLandscape ? 4 : 3;
    if (isLargeTablet) return isLandscape ? 3 : 2;
    if (isTablet) return isLandscape ? 3 : 2;
    if (isPhone) return isLandscape ? 2 : 1;
    return 1; // Small phone always 1 column
  };

  return {
    width,
    height,
    isLandscape,
    isPortrait,
    isSmallPhone,
    isPhone,
    isTablet,
    isLargeTablet,
    isXLargeTablet,
    columnCount: getColumnCount(),
    wp: (percentage: number) => (percentage / 100) * width,
    hp: (percentage: number) => (percentage / 100) * height,
    normalize: (size: number) => {
      const scale = width / BASE_WIDTH;
      const newSize = size * scale;
      if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
      }
      return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    },
  };
};

/**
 * Width Percentage
 * Converts percentage to actual width based on screen width
 * @param percentage - Percentage of screen width (0-100)
 * @returns Actual width in pixels
 */
export const wp = (percentage: number): number => {
  return (percentage / 100) * SCREEN_WIDTH;
};

/**
 * Height Percentage
 * Converts percentage to actual height based on screen height
 * @param percentage - Percentage of screen height (0-100)
 * @returns Actual height in pixels
 */
export const hp = (percentage: number): number => {
  return (percentage / 100) * SCREEN_HEIGHT;
};

/**
 * Normalize Font Size
 * Scales font size based on screen width, with platform-specific adjustments
 * @param size - Base font size
 * @returns Scaled font size
 */
export const normalize = (size: number): number => {
  const scale = SCREEN_WIDTH / BASE_WIDTH;
  const newSize = size * scale;
  
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  
  // Android scaling with upper bound to prevent overly large text
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

/**
 * Responsive Value
 * Returns different values based on screen width breakpoints
 * @param small - Value for small phones
 * @param medium - Value for medium phones
 * @param large - Value for large phones/tablets
 * @returns Appropriate value based on current screen width
 */
export const responsiveValue = <T>(small: T, medium: T, large: T): T => {
  if (SCREEN_WIDTH < BREAKPOINTS.PHONE) {
    return small;
  }
  if (SCREEN_WIDTH < BREAKPOINTS.TABLET) {
    return medium;
  }
  return large;
};

/**
 * Check if device is a tablet
 */
export const isTablet = (): boolean => {
  return SCREEN_WIDTH >= BREAKPOINTS.TABLET;
};

/**
 * Check if device is in landscape mode
 */
export const isLandscape = (): boolean => {
  return SCREEN_WIDTH > SCREEN_HEIGHT;
};

/**
 * Get responsive grid columns
 * Returns appropriate number of columns based on screen width
 */
export const getGridColumns = (): number => {
  if (SCREEN_WIDTH >= BREAKPOINTS.LARGE_TABLET) return 4;
  if (SCREEN_WIDTH >= BREAKPOINTS.TABLET) return 3;
  if (SCREEN_WIDTH >= BREAKPOINTS.LARGE_PHONE) return 2;
  return 2; // Default for phones
};

/**
 * Get screen dimensions (reactive to orientation changes)
 */
export const getScreenDimensions = () => {
  return Dimensions.get('window');
};

/**
 * Responsive spacing helper
 * Provides consistent spacing across different screen sizes
 */
export const spacing = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(16),
  lg: normalize(24),
  xl: normalize(32),
  xxl: normalize(48),
};

/**
 * Responsive border radius
 */
export const borderRadius = {
  xs: normalize(4),
  sm: normalize(8),
  md: normalize(12),
  lg: normalize(16),
  xl: normalize(24),
  round: normalize(999),
};

/**
 * Responsive font sizes
 */
export const fontSize = {
  xs: normalize(10),
  sm: normalize(12),
  md: normalize(14),
  lg: normalize(16),
  xl: normalize(20),
  xxl: normalize(24),
  xxxl: normalize(32),
  huge: normalize(48),
};

// Export screen dimensions for direct use
export { SCREEN_WIDTH, SCREEN_HEIGHT };
