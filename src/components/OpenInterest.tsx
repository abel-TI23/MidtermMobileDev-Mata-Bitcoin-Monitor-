/**
 * OpenInterest - Real-time open interest from Binance Futures
 * Tracks total outstanding contracts with 4H-1D trend analysis
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';
import { useWebSocketCleanup } from '../hooks/useWebSocketCleanup';
import { useAppStateReconnect } from '../hooks/useAppStateReconnect';

interface OpenInterestProps {
  symbol?: string;
}

export function OpenInterest({ symbol = 'BTCUSDT' }: OpenInterestProps) {
  const [openInterest, setOpenInterest] = useState<number>(0);
  const [openInterestValue, setOpenInterestValue] = useState<number>(0);
  const [trend, setTrend] = useState<'up' | 'down' | 'neutral'>('neutral');
  const [changePercent, setChangePercent] = useState<number>(0);
  const [change4H, setChange4H] = useState<number>(0);
  const [change1D, setChange1D] = useState<number>(0);
  const wsRef = useRef<WebSocket | null>(null);
  const priceWsRef = useRef<WebSocket | null>(null);
  const prevOIRef = useRef<number>(0);
  const priceRef = useRef<number>(0);
  const oi4HRef = useRef<number>(0);
  const oi1DRef = useRef<number>(0);

  // Fetch historical OI for 4H and 1D comparison
  const fetchHistoricalOI = useCallback(async () => {
    try {
      const response = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=4h&limit=2`);
      const data = await response.json();
      
      if (data && data.length >= 2) {
        oi4HRef.current = parseFloat(data[0].sumOpenInterest);
        
        // Calculate 4H change
        const prev4H = parseFloat(data[1].sumOpenInterest);
        if (prev4H > 0) {
          const change = ((oi4HRef.current - prev4H) / prev4H) * 100;
          setChange4H(change);
        }
      }

      // Fetch 1D data
      const response1D = await fetch(`https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}&period=1d&limit=2`);
      const data1D = await response1D.json();
      
      if (data1D && data1D.length >= 2) {
        oi1DRef.current = parseFloat(data1D[0].sumOpenInterest);
        
        // Calculate 1D change
        const prev1D = parseFloat(data1D[1].sumOpenInterest);
        if (prev1D > 0) {
          const change = ((oi1DRef.current - prev1D) / prev1D) * 100;
          setChange1D(change);
        }
      }
    } catch (error) {
      console.error('Error fetching historical OI:', error);
    }
  }, [symbol]);

  // Fetch initial open interest
  const fetchInitialOI = useCallback(async () => {
    try {
      const response = await fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`);
      const data = await response.json();
      
      if (data.openInterest) {
        const oi = parseFloat(data.openInterest);
        setOpenInterest(oi);
        prevOIRef.current = oi;
      }
    } catch (error) {
      console.error('Error fetching initial OI:', error);
    }
  }, [symbol]);

  // Connect both WebSockets
  const connectWebSockets = useCallback(() => {
    // Clean up existing connections
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (priceWsRef.current) {
      priceWsRef.current.close();
      priceWsRef.current = null;
    }

    // WebSocket for real-time OI updates
    const oiWs = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@openInterest`);
    wsRef.current = oiWs;

    oiWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.o) {
          const newOI = parseFloat(data.o);
          setOpenInterest(newOI);

          // Calculate trend
          if (prevOIRef.current > 0) {
            const change = ((newOI - prevOIRef.current) / prevOIRef.current) * 100;
            setChangePercent(change);
            
            if (Math.abs(change) < 0.1) {
              setTrend('neutral');
            } else if (newOI > prevOIRef.current) {
              setTrend('up');
            } else {
              setTrend('down');
            }
          }
          
          prevOIRef.current = newOI;
        }
      } catch (error) {
        console.error('Error parsing OI data:', error);
      }
    };

    // Get price for USD value calculation
    const priceWs = new WebSocket(`wss://fstream.binance.com/ws/${symbol.toLowerCase()}@markPrice@1s`);
    priceWsRef.current = priceWs;
    
    priceWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.p) {
          const price = parseFloat(data.p);
          priceRef.current = price;
          setOpenInterestValue(openInterest * price);
        }
      } catch (error) {
        console.error('Error parsing price data:', error);
      }
    };
  }, [symbol, openInterest]);

  // Memory leak prevention: Auto cleanup on unmount and app background
  useWebSocketCleanup(wsRef, connectWebSockets);
  useWebSocketCleanup(priceWsRef);

  // Auto-reconnect on app resume (keep untuk ensure reconnect after background)
  useAppStateReconnect(connectWebSockets);

  useEffect(() => {
    fetchInitialOI();
    fetchHistoricalOI(); // Fetch 4H and 1D data
    connectWebSockets();

    // Refresh historical data every 5 minutes
    const historicalInterval = setInterval(fetchHistoricalOI, 300000);

    return () => {
      if (wsRef.current) wsRef.current.close();
      if (priceWsRef.current) priceWsRef.current.close();
      clearInterval(historicalInterval);
    };
  }, [symbol, fetchInitialOI, fetchHistoricalOI, connectWebSockets]);

  // Update value when OI or price changes
  useEffect(() => {
    if (priceRef.current > 0) {
      setOpenInterestValue(openInterest * priceRef.current);
    }
  }, [openInterest]);

  const getTrendColor = () => {
    if (trend === 'up') return '#22C55E';
    if (trend === 'down') return '#EF4444';
    return '#9CA3AF';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↗';
    if (trend === 'down') return '↘';
    return '→';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const getChangeColor = (change: number) => {
    if (Math.abs(change) < 0.5) return '#9CA3AF';
    return change > 0 ? '#22C55E' : '#EF4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Open Interest (4H-1D)</Text>
        <View style={[styles.trendBadge, { backgroundColor: getTrendColor() + '20' }]}>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {getTrendIcon()} {trend.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>Contracts</Text>
          <Text style={styles.metricValue}>{formatNumber(openInterest)}</Text>
          <Text style={styles.metricUnit}>BTC</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.metricBox}>
          <Text style={styles.metricLabel}>USD Value</Text>
          <Text style={styles.metricValue}>${formatNumber(openInterestValue)}</Text>
          <Text style={[styles.changeText, { color: getTrendColor() }]}>
            {changePercent > 0 ? '+' : ''}{changePercent.toFixed(2)}%
          </Text>
        </View>
      </View>

      {/* 4H and 1D Changes */}
      <View style={styles.timeframeChanges}>
        <View style={styles.changeBox}>
          <Text style={styles.changeLabel}>4H Change</Text>
          <Text style={[styles.changeValue, { color: getChangeColor(change4H) }]}>
            {change4H > 0 ? '+' : ''}{change4H.toFixed(2)}%
          </Text>
        </View>
        <View style={styles.changeDivider} />
        <View style={styles.changeBox}>
          <Text style={styles.changeLabel}>1D Change</Text>
          <Text style={[styles.changeValue, { color: getChangeColor(change1D) }]}>
            {change1D > 0 ? '+' : ''}{change1D.toFixed(2)}%
          </Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          {trend === 'up' && '📈 Increasing OI = More leverage entering, potential for volatility'}
          {trend === 'down' && '📉 Decreasing OI = Positions closing, momentum slowing'}
          {trend === 'neutral' && '⚖️ Stable OI = Balanced market conditions'}
        </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
  },
  metricBox: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  metricUnit: {
    fontSize: 10,
    color: colors.textMuted,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  timeframeChanges: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  changeBox: {
    flex: 1,
    alignItems: 'center',
  },
  changeLabel: {
    fontSize: 10,
    color: '#A78BFA',
    fontWeight: '600',
    marginBottom: 4,
  },
  changeValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  changeDivider: {
    width: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    marginHorizontal: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
