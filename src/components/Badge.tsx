import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../theme';

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'info' | 'violet';

interface BadgeProps {
  label: string;
  tone?: Tone;
  style?: ViewStyle;
}

const bgByTone: Record<Tone, { bg: string; fg: string; border: string }> = {
  default: { bg: '#141A24', fg: colors.textSecondary, border: colors.border },
  accent: { bg: 'rgba(245, 158, 11, 0.15)', fg: '#FDE68A', border: '#F59E0B' },
  success: { bg: 'rgba(16, 185, 129, 0.15)', fg: '#D1FAE5', border: colors.success },
  warning: { bg: 'rgba(245, 158, 11, 0.18)', fg: '#FDE68A', border: colors.warning },
  info: { bg: 'rgba(59, 130, 246, 0.15)', fg: '#DBEAFE', border: colors.info },
  violet: { bg: 'rgba(139, 92, 246, 0.18)', fg: '#E9D5FF', border: colors.accentAlt },
};

const Badge: React.FC<BadgeProps> = ({ label, tone = 'default', style }) => {
  const p = bgByTone[tone];
  return (
    <View style={[styles.container, { backgroundColor: p.bg, borderColor: p.border }, style]}> 
      <View style={[styles.dot, { backgroundColor: p.border }]} />
      <Text style={[styles.text, { color: p.fg }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});

export default Badge;
