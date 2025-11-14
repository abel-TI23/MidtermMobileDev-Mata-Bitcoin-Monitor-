/**
 * LongShortRatio - Display long vs short positions ratio (4H-1D timeframes)
 * Data from Binance Futures Global Long/Short Accounts Ratio
 * Tracks institutional positioning over longer timeframes
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface LongShortRatioProps {
  symbol?: string;
  period?: '4h' | '1d'; // Changed to 4h-1d for institutional tracking
}

export function LongShortRatio({ symbol = 'BTCUSDT', period = '4h' }: LongShortRatioProps) {
  const [longRatio, setLongRatio] = useState<number>(50);
  const [shortRatio, setShortRatio] = useState<number>(50);
  const [longAccount, setLongAccount] = useState<number>(0);
  const [shortAccount, setShortAccount] = useState<number>(0);
  const [sentiment, setSentiment] = useState<'bullish' | 'bearish' | 'neutral'>('neutral');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchLongShortRatio = async () => {
    try {
      // Binance Futures API endpoint for global long/short account ratio
      const response = await fetch(
        `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=${period}&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch long/short ratio');
      }

      const data = await response.json();
      
      if (data && data.length > 0) {
        const ratio = parseFloat(data[0].longShortRatio);
        const longAcct = parseFloat(data[0].longAccount);
        const shortAcct = parseFloat(data[0].shortAccount);
        
        // Calculate percentages
        const total = ratio + 1;
        const longPct = (ratio / total) * 100;
        const shortPct = (1 / total) * 100;
        
        setLongRatio(longPct);
        setShortRatio(shortPct);
        setLongAccount(longAcct);
        setShortAccount(shortAcct);
        
        // Determine sentiment
        if (longPct > 55) {
          setSentiment('bullish');
        } else if (shortPct > 55) {
          setSentiment('bearish');
        } else {
          setSentiment('neutral');
        }
      }
    } catch (error) {
      console.error('Error fetching long/short ratio:', error);
      // Set default values on error
      setLongRatio(50);
      setShortRatio(50);
    }
  };

  useEffect(() => {
    fetchLongShortRatio();
    
    // Refresh every 5 minutes (appropriate for 4H-1D timeframes)
    intervalRef.current = setInterval(fetchLongShortRatio, 300000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol, period]);

  const getSentimentColor = () => {
    if (sentiment === 'bullish') return '#22C55E';
    if (sentiment === 'bearish') return '#EF4444';
    return '#9CA3AF';
  };

  const getSentimentIcon = () => {
    if (sentiment === 'bullish') return '🐂';
    if (sentiment === 'bearish') return '🐻';
    return '⚖️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Long/Short Positioning ({period.toUpperCase()})</Text>
        <View style={[styles.sentimentBadge, { backgroundColor: getSentimentColor() + '20' }]}>
          <Text style={[styles.sentimentText, { color: getSentimentColor() }]}>
            {getSentimentIcon()} {sentiment.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Ratio Bar */}
      <View style={styles.ratioContainer}>
        <View style={styles.ratioBar}>
          <View style={[styles.longBar, { width: `${longRatio}%` }]} />
          <View style={[styles.shortBar, { width: `${shortRatio}%` }]} />
        </View>
        
        <View style={styles.ratioLabels}>
          <View style={styles.labelBox}>
            <Text style={[styles.labelText, { color: '#22C55E' }]}>
              Long {longRatio.toFixed(1)}%
            </Text>
          </View>
          <View style={styles.labelBox}>
            <Text style={[styles.labelText, { color: '#EF4444' }]}>
              Short {shortRatio.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      {/* Account Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Long Accounts</Text>
          <Text style={[styles.statValue, { color: '#22C55E' }]}>
            {(longAccount * 100).toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Short Accounts</Text>
          <Text style={[styles.statValue, { color: '#EF4444' }]}>
            {(shortAccount * 100).toFixed(1)}%
          </Text>
        </View>
      </View>

      {/* Analysis */}
      <View style={styles.analysisBox}>
        <Text style={styles.analysisTitle}>Market Positioning</Text>
        <Text style={styles.analysisText}>
          {longRatio > 60 && 'Majority long - potential for squeeze if market turns bearish.'}
          {shortRatio > 60 && 'Majority short - potential for short squeeze if market rallies.'}
          {longRatio <= 60 && shortRatio <= 60 && 'Balanced positioning - no clear directional bias.'}
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
  sentimentBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sentimentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  ratioContainer: {
    marginBottom: 16,
  },
  ratioBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 10,
  },
  longBar: {
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shortBar: {
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratioLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelBox: {
    flex: 1,
  },
  labelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    paddingVertical: 12,
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
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  analysisBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  analysisTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  analysisText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
