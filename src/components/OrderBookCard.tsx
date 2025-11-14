import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Skeleton from './Skeleton';
import { fetchOrderBookDepth } from '../utils/binanceAPI';
import { colors } from '../theme';
import { useWebSocketCleanup } from '../hooks/useWebSocketCleanup';

interface Props {
  symbol?: string;
  levels?: number; // how many levels to aggregate
  onPress?: () => void;
  compact?: boolean;
}

type SideMap = Map<number, number>; // price -> qty

function applyDeltas(side: SideMap, deltas: Array<[string, string]>) {
  for (const [p, q] of deltas) {
    const price = Number(p);
    const qty = Number(q);
    if (qty === 0) side.delete(price);
    else side.set(price, qty);
  }
}

function topLevelsSum(side: SideMap, levels: number, isBid: boolean): { top: number; vol: number } {
  const prices = Array.from(side.keys()).sort((a, b) => (isBid ? b - a : a - b));
  const slice = prices.slice(0, levels);
  const vol = slice.reduce((s, px) => s + (side.get(px) || 0), 0);
  const top = slice.length > 0 ? slice[0] : 0;
  return { top, vol };
}

export const OrderBookCard: React.FC<Props> = ({ symbol = 'BTCUSDT', levels = 20, onPress, compact = false }) => {
  const [loading, setLoading] = useState(true);
  const [spreadPct, setSpreadPct] = useState<number>(0);
  const [imbalance, setImbalance] = useState<number>(0); // -1..+1
  const [bestBid, setBestBid] = useState<number>(0);
  const [bestAsk, setBestAsk] = useState<number>(0);
  const lastUpdateIdRef = useRef<number>(0);
  const bidsRef = useRef<SideMap>(new Map());
  const asksRef = useRef<SideMap>(new Map());
  const wsRef = useRef<WebSocket | null>(null);

  const computeMetrics = useCallback(() => {
    const bidStats = topLevelsSum(bidsRef.current, levels, true);
    const askStats = topLevelsSum(asksRef.current, levels, false);
    setBestBid(bidStats.top);
    setBestAsk(askStats.top);
    const mid = bidStats.top && askStats.top ? (bidStats.top + askStats.top) / 2 : 0;
    const sp = mid ? ((askStats.top - bidStats.top) / mid) * 100 : 0;
    setSpreadPct(sp);
    const total = bidStats.vol + askStats.vol;
    const imb = total > 0 ? (bidStats.vol - askStats.vol) / total : 0;
    setImbalance(imb);
  }, [levels]);

  const resetAndLoad = useCallback(async () => {
    try {
      setLoading(true);
      const snap = await fetchOrderBookDepth(symbol, levels);
      bidsRef.current.clear();
      asksRef.current.clear();
      for (const [p, q] of snap.bids) bidsRef.current.set(Number(p), Number(q));
      for (const [p, q] of snap.asks) asksRef.current.set(Number(p), Number(q));
      lastUpdateIdRef.current = snap.lastUpdateId;
      computeMetrics();
    } finally {
      setLoading(false);
    }
  }, [symbol, levels, computeMetrics]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useWebSocketCleanup(wsRef);

  useEffect(() => {
    let closed = false;
    resetAndLoad();

    // Setup WS diff stream
    const s = symbol.toLowerCase();
    const wsUrl = `wss://stream.binance.com:9443/ws/${s}@depth@100ms`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        // msg: { e:'depthUpdate', U: firstUpdateId, u: finalUpdateId, b: bids[], a: asks[] }
        const U = msg.U as number; // first
        const u = msg.u as number; // last
        if (!lastUpdateIdRef.current) return; // not yet initialized

        if (u <= lastUpdateIdRef.current) return; // already applied
        if (U > lastUpdateIdRef.current + 1) {
          // out-of-sync, reload snapshot
          resetAndLoad();
          return;
        }
        // Apply deltas
        applyDeltas(bidsRef.current, msg.b || []);
        applyDeltas(asksRef.current, msg.a || []);
        lastUpdateIdRef.current = u;
        computeMetrics();
      } catch (e) {
        // ignore
      }
    };

    ws.onerror = () => {
      // ignore; metrics will keep last values
    };

    ws.onclose = () => {
      if (!closed) {
        // attempt soft reconnect after short delay
        setTimeout(() => resetAndLoad(), 1000);
      }
    };

    return () => {
      closed = true;
      ws.close();
    };
  }, [symbol, levels, computeMetrics, resetAndLoad]);

  const imbalanceText = useMemo(() => {
    const pct = (Math.abs(imbalance) * 100).toFixed(0);
    return imbalance > 0 ? `Bids +${pct}%` : imbalance < 0 ? `Asks +${pct}%` : 'Balanced';
  }, [imbalance]);

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
      <Text style={styles.titleCentered}>Order Book</Text>
      <View style={styles.valueWrapper}>
        <Text style={styles.value}>{bestBid > 0 ? bestBid.toFixed(2) : '--'}</Text>
      </View>
      <Text style={styles.statusText}>Spread {spreadPct.toFixed(2)}% • {imbalanceText}</Text>
      <Text style={styles.secondaryText}>Bid {bestBid.toLocaleString()} • Ask {bestAsk.toLocaleString()}</Text>
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
  value: { color: '#FDE68A', fontSize: 20, fontWeight: '700' },
  statusText: { textAlign: 'center', fontSize: 10, fontWeight: '600', marginTop: 6, color: '#E5E7EB' },
  secondaryText: { textAlign: 'center', fontSize: 10, fontWeight: '600', marginTop: 4, color: '#9CA3AF' },
});

export default OrderBookCard;
