/**
 * OrderBookDepth - Real-time orderbook visualization
 * Shows bid/ask depth with bar chart representation
 * Memory leak fixed with useWebSocketCleanup
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme';
import { useWebSocketCleanup } from '../hooks/useWebSocketCleanup';

interface OrderBookLevel {
  price: string;
  quantity: string;
}

interface OrderBookDepthProps {
  symbol?: string;
  levels?: number; // Number of price levels to display (default: 10)
  minOrderSize?: number; // Minimum BTC order size to display (default: 0 = show all)
}

export function OrderBookDepth({ 
  symbol = 'BTCUSDT', 
  levels = 10,
  minOrderSize = 0, // Default 0.1 BTC minimum
}: OrderBookDepthProps) {
  const [bids, setBids] = useState<OrderBookLevel[]>([]);
  const [asks, setAsks] = useState<OrderBookLevel[]>([]);
  const [totalBidQty, setTotalBidQty] = useState<number>(0);
  const [totalAskQty, setTotalAskQty] = useState<number>(0);
  const [spread, setSpread] = useState<number>(0);
  const [filteredCount, setFilteredCount] = useState<number>(0);
  const [userMinSize, setUserMinSize] = useState<number>(minOrderSize); // User-controlled size
  const wsRef = useRef<WebSocket | null>(null);

  // Function to connect WebSocket
  const connectWebSocket = useCallback(() => {
    // Close existing connection if any
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@depth20@100ms`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('OrderBook WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.bids && data.asks) {
        let filtered = 0;

        // Filter bids based on userMinSize
        const filteredBids = data.bids
          .filter((b: string[]) => {
            const qty = parseFloat(b[1]);
            if (userMinSize > 0 && qty < userMinSize) {
              filtered++;
              return false;
            }
            return true;
          })
          .slice(0, levels)
          .map((b: string[]) => ({
            price: b[0],
            quantity: b[1],
          }));
        
        // Filter asks based on userMinSize
        const filteredAsks = data.asks
          .filter((a: string[]) => {
            const qty = parseFloat(a[1]);
            if (userMinSize > 0 && qty < userMinSize) {
              filtered++;
              return false;
            }
            return true;
          })
          .slice(0, levels)
          .map((a: string[]) => ({
            price: a[0],
            quantity: a[1],
          }));

        setBids(filteredBids);
        setAsks(filteredAsks);
        setFilteredCount(filtered);

        // Calculate totals
        const bidTotal = filteredBids.reduce((sum: number, b: OrderBookLevel) => sum + parseFloat(b.quantity), 0);
        const askTotal = filteredAsks.reduce((sum: number, a: OrderBookLevel) => sum + parseFloat(a.quantity), 0);
        setTotalBidQty(bidTotal);
        setTotalAskQty(askTotal);

        // Calculate spread
        if (filteredAsks.length > 0 && filteredBids.length > 0) {
          const bestAsk = parseFloat(filteredAsks[0].price);
          const bestBid = parseFloat(filteredBids[0].price);
          setSpread(((bestAsk - bestBid) / bestBid) * 100);
        }
      }
    };

    ws.onerror = (error) => {
      console.error('OrderBook WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('OrderBook WebSocket closed');
    };
  }, [symbol, levels, userMinSize]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useWebSocketCleanup(wsRef, connectWebSocket);

  useEffect(() => {
    // Initial connection
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket]);

  const maxQty = Math.max(
    ...bids.map(b => parseFloat(b.quantity)),
    ...asks.map(a => parseFloat(a.quantity))
  );

  const getBarWidth = (qty: string) => {
    return (parseFloat(qty) / maxQty) * 100;
  };

  const imbalance = totalBidQty + totalAskQty > 0 
    ? ((totalBidQty - totalAskQty) / (totalBidQty + totalAskQty)) * 100 
    : 0;

  // Size options for user to choose from (0.1 to 1.0 BTC)
  const sizeOptions = [0.1, 0.25, 0.5, 0.75, 1.0];

  return (
    <View style={styles.container}>
      {/* Header with Size Selector */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Order Book Depth</Text>
      </View>

      {/* Size Selector Pills */}
      <View style={styles.sizeSelector}>
        <Text style={styles.sizeLabel}>Min Size:</Text>
        {sizeOptions.map(size => (
          <Pressable
            key={size}
            style={[
              styles.sizePill,
              userMinSize === size && styles.sizePillActive,
            ]}
            onPress={() => setUserMinSize(size)}
          >
            <Text
              style={[
                styles.sizePillText,
                userMinSize === size && styles.sizePillTextActive,
              ]}
            >
              {size}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Header Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Spread</Text>
          <Text style={[styles.statValue, { color: '#F59E0B' }]}>
            {spread.toFixed(3)}%
          </Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Imbalance</Text>
          <Text style={[styles.statValue, { color: imbalance > 0 ? '#22C55E' : '#EF4444' }]}>
            {imbalance > 0 ? '+' : ''}{imbalance.toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Order Book */}
      <View style={styles.bookContainer}>
        {/* Asks (Sells) - Red */}
        <View style={styles.asksSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.headerText}>Price (USDT)</Text>
            <Text style={styles.headerText}>Amount (BTC)</Text>
          </View>
          {asks.slice().reverse().map((ask, idx) => (
            <View key={`ask-${idx}`} style={styles.bookRow}>
              <View style={[styles.depthBar, styles.askBar, { width: `${getBarWidth(ask.quantity)}%` }]} />
              <Text style={[styles.priceText, styles.askPrice]}>{parseFloat(ask.price).toFixed(2)}</Text>
              <Text style={styles.qtyText}>{parseFloat(ask.quantity).toFixed(4)}</Text>
            </View>
          ))}
        </View>

        {/* Spread Indicator */}
        <View style={styles.spreadRow}>
          <Text style={styles.spreadText}>
            ↕ Spread: {spread.toFixed(3)}%
          </Text>
        </View>

        {/* Bids (Buys) - Green */}
        <View style={styles.bidsSection}>
          {bids.map((bid, idx) => (
            <View key={`bid-${idx}`} style={styles.bookRow}>
              <View style={[styles.depthBar, styles.bidBar, { width: `${getBarWidth(bid.quantity)}%` }]} />
              <Text style={[styles.priceText, styles.bidPrice]}>{parseFloat(bid.price).toFixed(2)}</Text>
              <Text style={styles.qtyText}>{parseFloat(bid.quantity).toFixed(4)}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Total Depth */}
      <View style={styles.totalRow}>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Bids</Text>
          <Text style={[styles.totalValue, { color: '#22C55E' }]}>
            {totalBidQty.toFixed(2)} BTC
          </Text>
        </View>
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Asks</Text>
          <Text style={[styles.totalValue, { color: '#EF4444' }]}>
            {totalAskQty.toFixed(2)} BTC
          </Text>
        </View>
      </View>

      {/* Info Box */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          🎯 Showing orders ≥{userMinSize} BTC
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  sizeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  sizeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
    marginRight: 4,
  },
  sizePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  sizePillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  sizePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  sizePillTextActive: {
    color: '#3B82F6',
  },
  filterBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  filterText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  bookContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    padding: 8,
    height: 600, // Fixed height to prevent jumping
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  headerText: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  asksSection: {
    marginBottom: 4,
    height: 260, // Fixed height for asks section
  },
  bidsSection: {
    marginTop: 4,
    height: 260, // Fixed height for bids section
  },
  bookRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 24,
    marginBottom: 2,
    position: 'relative',
    paddingHorizontal: 8,
  },
  depthBar: {
    position: 'absolute',
    right: 0,
    height: '100%',
    opacity: 0.2,
  },
  bidBar: {
    backgroundColor: '#22C55E',
  },
  askBar: {
    backgroundColor: '#EF4444',
  },
  priceText: {
    fontSize: 12,
    fontWeight: '600',
    zIndex: 1,
  },
  bidPrice: {
    color: '#22C55E',
  },
  askPrice: {
    color: '#EF4444',
  },
  qtyText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    zIndex: 1,
  },
  spreadRow: {
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  spreadText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  totalBox: {
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoBox: {
    marginTop: 10,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  infoText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
    textAlign: 'center',
  },
});
