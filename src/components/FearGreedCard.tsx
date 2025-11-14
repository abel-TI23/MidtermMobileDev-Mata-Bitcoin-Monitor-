import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { cardBase, colors } from '../theme';

interface Props {
  value: number | null; // 0..100
  label?: string; // classification
  lastUpdated?: string;
  onPress?: () => void;
  compact?: boolean; // optimized for grid layout
}

// Simple segmented horizontal gauge with pointer, inspired by TradingView/CryptoRank
const FearGreedCard: React.FC<Props> = ({ value, label, lastUpdated, onPress, compact = false }) => {
  const v = value ?? 0;
  const posPct = Math.min(100, Math.max(0, v));

  const gaugeHeight = compact ? 10 : 12;
  const pointerWidth = 2;

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [
        styles.container,
        compact && styles.containerCompact,
        pressed && { opacity: 0.95 },
      ]}
    >
      <Text style={styles.titleCentered}>Market Sentiment</Text>
      <View style={styles.valueWrapper}>
        <Text style={styles.valueDisplay}>{value != null ? v.toFixed(0) : '--'}</Text>
      </View>
      <Text style={styles.statusText}>{label ?? '—'}</Text>

      {/* Gauge */}
      <View style={[styles.gaugeWrapper, compact && { marginTop: 8 }]}>
        <View style={[styles.gaugeTrack, { height: gaugeHeight }]}
          accessibilityLabel="Fear & Greed gauge"
          accessible
        >
          {/* 5 segments from red -> green */}
          <View style={[styles.segment, styles.segExtremeFear]} />
          <View style={[styles.segment, styles.segFear]} />
          <View style={[styles.segment, styles.segNeutral]} />
          <View style={[styles.segment, styles.segGreed]} />
          <View style={[styles.segment, styles.segExtremeGreed]} />

          {/* Pointer */}
          <View style={[
            styles.pointer,
            { left: `${posPct}%`, width: pointerWidth, height: gaugeHeight + 6 },
          ]}
          />
        </View>
        <View style={styles.gaugeLabels}>
          <Text style={styles.gaugeLabelText}>Fear</Text>
          <Text style={styles.gaugeLabelText}>Greed</Text>
        </View>
      </View>

      {lastUpdated && (
        <Text style={styles.updated}>Updated: {new Date(lastUpdated).toLocaleDateString()}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginTop: 12,
  },
  containerCompact: {
    marginHorizontal: 8,
    marginTop: 8,
    padding: 12,
  },
  titleCentered: { textAlign: 'center', color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 6 },
  valueWrapper: { alignItems: 'center', justifyContent: 'center', minHeight: 42 },
  valueDisplay: { color: '#FDE68A', fontSize: 28, fontWeight: '700' },
  statusText: { textAlign: 'center', color: '#E5E7EB', fontSize: 12, fontWeight: '600', marginTop: 6 },
  gaugeWrapper: { marginTop: 12 },
  gaugeTrack: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 999,
    overflow: 'hidden',
    position: 'relative',
    flexDirection: 'row',
  },
  segment: { flex: 1 },
  segExtremeFear: { backgroundColor: '#ef4444' },
  segFear: { backgroundColor: '#f59e0b' },
  segNeutral: { backgroundColor: '#eab308' },
  segGreed: { backgroundColor: '#84cc16' },
  segExtremeGreed: { backgroundColor: '#22c55e' },
  pointer: {
    position: 'absolute',
    top: -3,
    marginLeft: -1, // center the thin bar
    backgroundColor: '#fff',
    borderRadius: 1,
    opacity: 0.9,
  },
  gaugeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  gaugeLabelText: {
    fontSize: 10,
    color: colors.textMuted,
  },
  updated: { textAlign: 'center', color: colors.textMuted, fontSize: 10, marginTop: 4 },
});

export default FearGreedCard;
