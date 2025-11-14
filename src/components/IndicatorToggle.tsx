/**
 * IndicatorToggle Component
 * Allows users to show/hide technical indicators on the chart
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface IndicatorToggleProps {
  label: string;
  color: string;
  isActive: boolean;
  onToggle: () => void;
}

const IndicatorToggle: React.FC<IndicatorToggleProps> = ({
  label,
  color,
  isActive,
  onToggle,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isActive && styles.containerActive]}
      onPress={onToggle}
      activeOpacity={0.7}>
      <View style={[styles.indicator, { backgroundColor: color }]} />
      <Text style={[styles.label, isActive && styles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1E222D',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  containerActive: {
    backgroundColor: '#252B3A',
    borderColor: colors.border,
  },
  indicator: {
    width: 16,
    height: 3,
    borderRadius: 2,
    marginRight: 8,
  },
  label: {
    color: '#8A93A7',
    fontSize: 13,
    fontWeight: '600',
  },
  labelActive: {
    color: '#E5E7EB',
  },
});

export default IndicatorToggle;
