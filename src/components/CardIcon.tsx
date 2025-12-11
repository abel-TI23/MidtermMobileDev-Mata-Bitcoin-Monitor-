/**
 * CardIcon Component
 * Responsive icon wrapper with emoji fallback
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useResponsive } from '../utils/responsive';

interface CardIconProps {
  name: string; // Icon name or emoji
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  style?: ViewStyle;
}

export const CardIcon: React.FC<CardIconProps> = ({ 
  name, 
  size = 'md', 
  color,
  style 
}) => {
  const { normalize, isLargeTablet, isTablet } = useResponsive();
  
  // Responsive size mapping
  const getIconSize = (): number => {
    const baseSize = {
      sm: 16,
      md: 24,
      lg: 32,
      xl: 48,
    }[size];
    
    // Scale up for larger devices
    if (isLargeTablet) return normalize(baseSize * 1.3);
    if (isTablet) return normalize(baseSize * 1.15);
    return normalize(baseSize);
  };
  
  const iconSize = getIconSize();
  
  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.icon, { fontSize: iconSize, color }]}>
        {name}
      </Text>
    </View>
  );
};

// Icon name mapping (emoji fallback)
export const CARD_ICONS = {
  bitcoin: '₿',
  chart: '📈',
  signal: '🎯',
  volume: '📊',
  sentiment: '😨',
  atr: '📉',
  rsi: '⚡',
  orderbook: '📚',
  dominance: '👑',
  price: '💰',
  trending: '🔥',
  warning: '⚠️',
  success: '✅',
  info: 'ℹ️',
  settings: '⚙️',
  notification: '🔔',
  time: '⏰',
  lock: '🔒',
  unlock: '🔓',
  refresh: '🔄',
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    textAlign: 'center',
  },
});
