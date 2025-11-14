/**
 * SignalCard - Display trading signal recommendation
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme';
import { TradingSignal } from '../types/signal';

interface SignalCardProps {
  signal: TradingSignal;
  onPress?: () => void;
}

export function SignalCard({ signal, onPress }: SignalCardProps) {
  const getActionColor = () => {
    switch (signal.action) {
      case 'BUY': return '#22C55E';
      case 'SELL': return '#EF4444';
      case 'HOLD': return '#F59E0B';
      case 'WAIT': return '#6B7280';
    }
  };

  const getActionIcon = () => {
    switch (signal.action) {
      case 'BUY': return '📈';
      case 'SELL': return '📉';
      case 'HOLD': return '⏸️';
      case 'WAIT': return '⏳';
    }
  };

  const getRiskColor = () => {
    switch (signal.riskLevel) {
      case 'LOW': return '#22C55E';
      case 'MODERATE': return '#F59E0B';
      case 'HIGH': return '#EF4444';
    }
  };

  const getStars = () => {
    const fullStars = Math.floor(signal.score);
    const hasHalf = signal.score % 1 >= 0.5;
    
    let stars = '';
    for (let i = 0; i < fullStars; i++) stars += '⭐';
    if (hasHalf) stars += '✨';
    
    return stars || '☆';
  };

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={styles.card}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.symbol}>{signal.symbol.replace('USDT', '/USDT')}</Text>
          <View style={[styles.actionBadge, { backgroundColor: getActionColor() + '20' }]}>
            <Text style={styles.actionIcon}>{getActionIcon()}</Text>
            <Text style={[styles.actionText, { color: getActionColor() }]}>
              {signal.action}
            </Text>
          </View>
        </View>
        <View style={styles.scoreRow}>
          <Text style={styles.stars}>{getStars()}</Text>
          <Text style={styles.scoreText}>{signal.score.toFixed(1)}/5</Text>
        </View>
      </View>

      {/* Current Price */}
      <View style={styles.priceSection}>
        <Text style={styles.label}>Current Price</Text>
        <Text style={styles.currentPrice}>{formatPrice(signal.currentPrice)}</Text>
      </View>

      {/* Entry & Targets */}
      {signal.action === 'BUY' && (
        <View style={styles.targetsSection}>
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Entry Zone</Text>
              <Text style={styles.targetValue}>
                {formatPrice(signal.entryZone.min)} - {formatPrice(signal.entryZone.max)}
              </Text>
            </View>
          </View>
          
          <View style={styles.targetRow}>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Stop Loss</Text>
              <Text style={[styles.targetValue, { color: '#EF4444' }]}>
                {formatPrice(signal.stopLoss)}
              </Text>
            </View>
            <View style={styles.targetItem}>
              <Text style={styles.targetLabel}>Take Profit</Text>
              <Text style={[styles.targetValue, { color: '#22C55E' }]}>
                {formatPrice(signal.takeProfit[1])}
              </Text>
            </View>
          </View>

          <View style={styles.rrRow}>
            <Text style={styles.rrLabel}>Risk/Reward</Text>
            <Text style={styles.rrValue}>1:{signal.riskRewardRatio.toFixed(1)}</Text>
          </View>
        </View>
      )}

      {/* Summary */}
      <View style={styles.summarySection}>
        <Text style={styles.summary}>{signal.summary}</Text>
      </View>

      {/* Why This Signal */}
      {signal.reasons.length > 0 && (
        <View style={styles.reasonsSection}>
          <Text style={styles.reasonsTitle}>Why This Signal?</Text>
          {signal.reasons.slice(0, 4).map((reason, index) => (
            <View key={index} style={styles.reasonItem}>
              <Text style={styles.reasonBullet}>✓</Text>
              <Text style={styles.reasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Warnings */}
      {signal.warnings.length > 0 && (
        <View style={styles.warningsSection}>
          {signal.warnings.slice(0, 2).map((warning, index) => (
            <View key={index} style={styles.warningItem}>
              <Text style={styles.warningIcon}>⚠️</Text>
              <Text style={styles.warningText}>{warning}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Risk</Text>
          <View style={[styles.riskBadge, { backgroundColor: getRiskColor() + '20' }]}>
            <Text style={[styles.riskText, { color: getRiskColor() }]}>
              {signal.riskLevel}
            </Text>
          </View>
        </View>
        
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Confidence</Text>
          <Text style={styles.confidenceText}>{signal.confidencePercent}%</Text>
        </View>
        
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>Position</Text>
          <Text style={styles.positionText}>{signal.positionSizePercent}%</Text>
        </View>
      </View>
    </Component>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbol: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  actionIcon: {
    fontSize: 14,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '800',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stars: {
    fontSize: 18,
  },
  scoreText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  priceSection: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  currentPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: '#3B82F6',
  },
  targetsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  targetItem: {
    flex: 1,
  },
  targetLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  targetValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  rrLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
  },
  rrValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#22C55E',
  },
  summarySection: {
    marginBottom: 12,
  },
  summary: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  reasonsSection: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  reasonsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#22C55E',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  reasonItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  reasonBullet: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '700',
  },
  reasonText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
    flex: 1,
  },
  warningsSection: {
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  warningItem: {
    flexDirection: 'row',
    marginBottom: 6,
    gap: 6,
  },
  warningIcon: {
    fontSize: 12,
  },
  warningText: {
    fontSize: 11,
    color: '#FB923C',
    lineHeight: 16,
    flex: 1,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerItem: {
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 11,
    fontWeight: '800',
  },
  confidenceText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  positionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3B82F6',
  },
});
