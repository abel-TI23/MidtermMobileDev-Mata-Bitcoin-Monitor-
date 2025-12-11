/**
 * CardHeader Component
 * Reusable header dengan icon dan title untuk cards
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { CardIcon, CARD_ICONS } from './CardIcon';
import { colors } from '../theme';
import { useResponsive } from '../utils/responsive';

interface CardHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
  iconColor?: string;
  style?: ViewStyle;
  titleStyle?: TextStyle;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  icon,
  title,
  subtitle,
  iconColor = colors.accent,
  style,
  titleStyle,
}) => {
  const { normalize } = useResponsive();
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconTitleRow}>
        <CardIcon name={icon} size="md" color={iconColor} />
        <View style={styles.textContainer}>
          <Text style={[styles.title, titleStyle]}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
});
