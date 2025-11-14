/**
 * LiquidationTracker - Real-time liquidation feed from Binance Futures
 * Shows recent liquidations with side, price, and quantity
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../theme';
import { useWebSocketCleanup } from '../hooks/useWebSocketCleanup';

interface Liquidation {
  symbol: string;
  side: 'BUY' | 'SELL'; // BUY = short liquidation, SELL = long liquidation
  price: string;
  quantity: string;
  time: number;
}

interface LiquidationTrackerProps {
  symbol?: string;
  maxItems?: number;
}

export function LiquidationTracker({ symbol = 'BTCUSDT', maxItems = 15 }: LiquidationTrackerProps) {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [totalLongLiq, setTotalLongLiq] = useState<number>(0);
  const [totalShortLiq, setTotalShortLiq] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Liquidation WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.o && data.o.s === symbol) {
          const liquidation: Liquidation = {
            symbol: data.o.s,
            side: data.o.S,
            price: data.o.p,
            quantity: data.o.q,
            time: data.o.T,
          };

          setLiquidations(prev => {
            const updated = [liquidation, ...prev].slice(0, maxItems);
            
            // Calculate totals
            const longLiqs = updated.filter(l => l.side === 'SELL');
            const shortLiqs = updated.filter(l => l.side === 'BUY');
            
            const longTotal = longLiqs.reduce((sum, l) => sum + parseFloat(l.quantity), 0);
            const shortTotal = shortLiqs.reduce((sum, l) => sum + parseFloat(l.quantity), 0);
            
            setTotalLongLiq(longTotal);
            setTotalShortLiq(shortTotal);
            
            return updated;
          });
        }
      } catch (error) {
        console.error('Error parsing liquidation data:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('Liquidation WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Liquidation WebSocket closed');
    };
  }, [symbol, maxItems]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useWebSocketCleanup(wsRef, connectWebSocket);

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit',
      hour12: false 
    });
  };

  const formatQuantity = (qty: string) => {
    const num = parseFloat(qty);
    if (num >= 10) return num.toFixed(2);
    if (num >= 1) return num.toFixed(3);
    return num.toFixed(4);
  };

  const getLiquidationColor = (side: string) => {
    return side === 'SELL' ? '#EF4444' : '#22C55E'; // SELL = long liq (red), BUY = short liq (green)
  };

  const getLiquidationLabel = (side: string) => {
    return side === 'SELL' ? 'LONG' : 'SHORT';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Liquidations</Text>
        <View style={styles.statusDot} />
      </View>

      {/* Summary Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Long Liquidated</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {totalLongLiq.toFixed(2)} BTC
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Short Liquidated</Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {totalShortLiq.toFixed(2)} BTC
          </Text>
        </View>
      </View>

      {/* Liquidation Feed */}
      <View style={styles.feedContainer}>
        <View style={styles.feedHeader}>
          <Text style={styles.headerText}>Time</Text>
          <Text style={styles.headerText}>Side</Text>
          <Text style={styles.headerText}>Price</Text>
          <Text style={styles.headerText}>Size</Text>
        </View>
        
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {liquidations.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Waiting for liquidations...</Text>
            </View>
          ) : (
            liquidations.map((liq, index) => (
              <View 
                key={`${liq.time}-${index}`} 
                style={[
                  styles.liqRow,
                  { backgroundColor: getLiquidationColor(liq.side) + '10' }
                ]}
              >
                <Text style={styles.timeText}>{formatTime(liq.time)}</Text>
                <View style={[styles.sideBadge, { backgroundColor: getLiquidationColor(liq.side) + '30' }]}>
                  <Text style={[styles.sideText, { color: getLiquidationColor(liq.side) }]}>
                    {getLiquidationLabel(liq.side)}
                  </Text>
                </View>
                <Text style={styles.priceText}>${parseFloat(liq.price).toFixed(2)}</Text>
                <Text style={styles.qtyText}>{formatQuantity(liq.quantity)}</Text>
              </View>
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 8,
  },
  feedContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
  },
  feedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 6,
  },
  headerText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    maxHeight: 250,
  },
  emptyState: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  liqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginBottom: 4,
    borderRadius: 6,
  },
  timeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  sideBadge: {
    flex: 1,
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: 'center',
  },
  sideText: {
    fontSize: 10,
    fontWeight: '700',
  },
  priceText: {
    fontSize: 11,
    color: colors.textPrimary,
    fontWeight: '600',
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'center',
  },
  qtyText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    flex: 1,
    textAlign: 'right',
  },
});
