import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Skeleton from './Skeleton';
import { fetchGlobalMarket } from '../utils/marketAPI';
import { colors } from '../theme';

interface Props {
  onPress?: () => void;
  compact?: boolean;
  showETH?: boolean;
  refreshMs?: number;
}

export const MarketDominanceCard: React.FC<Props> = ({ onPress, compact = false, showETH = true, refreshMs = 15 * 60 * 1000 }) => {
  const [btc, setBtc] = useState<number | null>(null);
  const [eth, setEth] = useState<number | null>(null);
  const [last, setLast] = useState<number | null>(null);
  const [prevBtc, setPrevBtc] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchGlobalMarket();
      setPrevBtc(btc);
      setBtc(data.btcDominance);
      setEth(data.ethDominance ?? null);
      setLast(data.updatedAt || Date.now());
    } catch (e) {
      console.log('Dominance fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [btc]);

  useEffect(() => {
    load();
    const t = setInterval(load, refreshMs);
    return () => clearInterval(t);
  }, [load, refreshMs]);

  const delta = btc != null && prevBtc != null ? (btc - prevBtc) : 0;
  const deltaColor = delta > 0 ? '#10B981' : delta < 0 ? '#EF4444' : colors.textMuted;

  if (loading) {
    return (
      <View style={[styles.container, compact && styles.containerCompact]}>
        <Skeleton height={18} width="50%" style={{ alignSelf: 'center', marginBottom: 8 }} />
        <Skeleton height={34} width="60%" style={{ alignSelf: 'center' }} />
        <Skeleton height={14} width="40%" style={{ alignSelf: 'center', marginTop: 8 }} />
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: 'rgba(255,255,255,0.06)' }}
      style={({ pressed }) => [styles.container, compact && styles.containerCompact, pressed && { opacity: 0.95 }]}
    >
      <Text style={styles.titleCentered}>🌐 Dominance</Text>
      <View style={styles.valueWrapper}>
        <Text style={styles.value}>{btc != null ? btc.toFixed(1) + '%' : '--'}</Text>
      </View>
      <Text style={[styles.statusText, { color: deltaColor }]}>Δ {delta === 0 ? '0.0' : delta.toFixed(2)}%</Text>
      {showETH && eth != null && (
        <Text style={styles.secondaryText}>ETH {eth.toFixed(1)}%</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    minHeight: 120,
  },
  containerCompact: {
    marginHorizontal: 8,
    marginTop: 8,
    padding: 16,
    minHeight: 120,
  },
  titleCentered: { textAlign: 'center', color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  valueWrapper: { alignItems: 'center', justifyContent: 'center', minHeight: 42, marginTop: 6 },
  value: { color: '#F59E0B', fontSize: 26, fontWeight: '700' },
  statusText: { textAlign: 'center', fontSize: 12, fontWeight: '600', marginTop: 6 },
  secondaryText: { textAlign: 'center', fontSize: 11, fontWeight: '600', marginTop: 4, color: '#9CA3AF' },
});

export default MarketDominanceCard;
