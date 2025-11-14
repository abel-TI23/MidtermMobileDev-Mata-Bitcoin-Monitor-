/**
 * FundingRate - Display current funding rate and next funding time
 * Updates every 8 hours (00:00, 08:00, 16:00 UTC)
 */

import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface FundingRateProps {
  symbol?: string;
}

export function FundingRate({ symbol = 'BTCUSDT' }: FundingRateProps) {
  const [fundingRate, setFundingRate] = useState<number>(0);
  const [nextFundingTime, setNextFundingTime] = useState<number>(0);
  const [annualizedRate, setAnnualizedRate] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchFundingRate = async () => {
    try {
      // Get current funding rate
      const response = await fetch(
        `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const rate = parseFloat(data[0].fundingRate) * 100; // Convert to percentage
        setFundingRate(rate);
        setAnnualizedRate(rate * 3 * 365); // 3 funding periods per day
      }

      // Get next funding time from premium index
      const premiumResponse = await fetch(
        `https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}`
      );
      const premiumData = await premiumResponse.json();

      if (premiumData && premiumData.nextFundingTime) {
        setNextFundingTime(premiumData.nextFundingTime);
      }
    } catch (error) {
      console.error('Error fetching funding rate:', error);
    }
  };

  useEffect(() => {
    fetchFundingRate();

    // Refresh every 5 minutes
    intervalRef.current = setInterval(fetchFundingRate, 300000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [symbol]);

  const getTimeUntilFunding = () => {
    if (nextFundingTime === 0) return '--';
    
    const now = Date.now();
    const diff = nextFundingTime - now;
    
    if (diff < 0) return 'Soon';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getRateColor = () => {
    if (Math.abs(fundingRate) < 0.01) return '#9CA3AF';
    return fundingRate > 0 ? '#EF4444' : '#22C55E';
  };

  const getRateSentiment = () => {
    if (fundingRate > 0.05) return 'Very Bullish (Longs pay)';
    if (fundingRate > 0.01) return 'Bullish (Longs pay)';
    if (fundingRate < -0.05) return 'Very Bearish (Shorts pay)';
    if (fundingRate < -0.01) return 'Bearish (Shorts pay)';
    return 'Neutral';
  };

  const getNextFundingDate = () => {
    if (nextFundingTime === 0) return '--';
    
    const date = new Date(nextFundingTime);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Funding Rate</Text>
        <View style={styles.updateBadge}>
          <Text style={styles.updateText}>Every 8h</Text>
        </View>
      </View>

      <View style={styles.rateContainer}>
        <Text style={styles.rateLabel}>Current Rate</Text>
        <Text style={[styles.rateValue, { color: getRateColor() }]}>
          {fundingRate >= 0 ? '+' : ''}{fundingRate.toFixed(4)}%
        </Text>
        <Text style={styles.rateSubtext}>{getRateSentiment()}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Annualized</Text>
          <Text style={[styles.statValue, { color: getRateColor() }]}>
            {annualizedRate >= 0 ? '+' : ''}{annualizedRate.toFixed(2)}%
          </Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statBox}>
          <Text style={styles.statLabel}>Next Funding</Text>
          <Text style={styles.statValue}>{getNextFundingDate()}</Text>
          <Text style={styles.statSubtext}>{getTimeUntilFunding()}</Text>
        </View>
      </View>

      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>What This Means</Text>
        <Text style={styles.infoText}>
          {fundingRate > 0 
            ? '🔴 Positive funding = Longs dominate, they pay shorts. Potential for long squeeze if rate stays high.'
            : fundingRate < 0
            ? '🟢 Negative funding = Shorts dominate, they pay longs. Potential for short squeeze if rate stays negative.'
            : '⚪ Neutral funding = Balanced market, neither side dominates.'
          }
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
  updateBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  updateText: {
    fontSize: 10,
    color: '#3B82F6',
    fontWeight: '600',
  },
  rateContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    marginBottom: 14,
  },
  rateLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 6,
    fontWeight: '600',
  },
  rateValue: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 4,
  },
  rateSubtext: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
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
    marginBottom: 6,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  statSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16,
  },
});
