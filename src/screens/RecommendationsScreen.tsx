/**
 * RecommendationsScreen - AI-powered trading recommendations
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { SignalCard } from '../components/SignalCard';
import { LoadingLogo } from '../components/LoadingLogo';
import { calculateTradingSignal } from '../utils/signalEngine';
import { TradingSignal } from '../types/signal';

const SYMBOL = 'BTCUSDT';

export default function RecommendationsScreen() {
  const [signal, setSignal] = useState<TradingSignal | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Load signal on screen focus
  useFocusEffect(
    React.useCallback(() => {
      loadSignal();
    }, [])
  );

  // Auto-refresh every 5 minutes
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadSignal(true);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const loadSignal = async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const newSignal = await calculateTradingSignal(SYMBOL);
      setSignal(newSignal);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error calculating signal:', error);
      if (!silent) {
        Alert.alert('Error', 'Failed to calculate trading signal. Please try again.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSignal();
  };

  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
  };

  const formatLastUpdate = () => {
    if (!lastUpdate) return 'Never';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  if (loading && !signal) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top']}>
        <LoadingLogo size={140} />
        <Text style={styles.loadingText}>Analyzing Market Data...</Text>
        <Text style={styles.loadingSubtext}>
          Combining price action, indicators, order flow, and sentiment
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#3B82F6"
            colors={['#3B82F6']}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Trading Signal</Text>
            <Text style={styles.subtitle}>
              AI-Powered Multi-Factor Analysis
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.autoRefreshButton, autoRefresh && styles.autoRefreshActive]}
            onPress={toggleAutoRefresh}
          >
            <Text style={styles.autoRefreshIcon}>{autoRefresh ? '🔄' : '⏸️'}</Text>
          </TouchableOpacity>
        </View>

        {/* Last Update */}
        <View style={styles.updateInfo}>
          <Text style={styles.updateText}>
            Last updated: {formatLastUpdate()}
          </Text>
          {autoRefresh && (
            <Text style={styles.autoRefreshLabel}>• Auto-refresh enabled</Text>
          )}
        </View>

        {/* Signal Card */}
        {signal && (
          <SignalCard signal={signal} />
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerIcon}>⚠️</Text>
          <Text style={styles.disclaimerText}>
            <Text style={styles.disclaimerBold}>Disclaimer:</Text> This is not financial advice.
            Trading cryptocurrencies carries high risk. Always do your own research and never
            invest more than you can afford to lose. Signals are based on technical analysis
            and may not reflect fundamental market conditions.
          </Text>
        </View>

        {/* How It Works */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>How It Works</Text>
          <Text style={styles.infoText}>
            Our signal engine analyzes multiple data sources in real-time:
          </Text>
          
          <View style={styles.factorList}>
            <View style={styles.factorItem}>
              <Text style={styles.factorIcon}>📊</Text>
              <View style={styles.factorContent}>
                <Text style={styles.factorName}>Trend Analysis (20 pts)</Text>
                <Text style={styles.factorDesc}>
                  Price action vs moving averages, support/resistance levels
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <Text style={styles.factorIcon}>⚡</Text>
              <View style={styles.factorContent}>
                <Text style={styles.factorName}>Momentum (20 pts)</Text>
                <Text style={styles.factorDesc}>
                  RSI, volume trends, volatility (ATR)
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <Text style={styles.factorIcon}>💰</Text>
              <View style={styles.factorContent}>
                <Text style={styles.factorName}>Order Flow (25 pts)</Text>
                <Text style={styles.factorDesc}>
                  Order book imbalance, long/short ratio, liquidations, open interest
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <Text style={styles.factorIcon}>😱</Text>
              <View style={styles.factorContent}>
                <Text style={styles.factorName}>Sentiment (20 pts)</Text>
                <Text style={styles.factorDesc}>
                  Fear & Greed Index, funding rates, market dominance
                </Text>
              </View>
            </View>

            <View style={styles.factorItem}>
              <Text style={styles.factorIcon}>🛡️</Text>
              <View style={styles.factorContent}>
                <Text style={styles.factorName}>Risk Management (15 pts)</Text>
                <Text style={styles.factorDesc}>
                  ATR-based stop loss, risk/reward ratio, position sizing
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.scoringInfo}>
            <Text style={styles.scoringTitle}>Signal Scoring:</Text>
            <Text style={styles.scoringText}>
              • <Text style={styles.scoringBold}>0-1 Star:</Text> Very Weak - Wait for better opportunity{'\n'}
              • <Text style={styles.scoringBold}>1-2 Stars:</Text> Weak - High risk, not recommended{'\n'}
              • <Text style={styles.scoringBold}>2-3 Stars:</Text> Moderate - Neutral, watch closely{'\n'}
              • <Text style={styles.scoringBold}>3-4 Stars:</Text> Good - Multiple confirmations{'\n'}
              • <Text style={styles.scoringBold}>4-5 Stars:</Text> Strong - High confidence with low risk
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 16,
  },
  loadingSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  autoRefreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  autoRefreshActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  autoRefreshIcon: {
    fontSize: 20,
  },
  updateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  updateText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  autoRefreshLabel: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(251, 146, 60, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.2)',
    gap: 10,
  },
  disclaimerIcon: {
    fontSize: 16,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    color: '#FB923C',
    lineHeight: 16,
  },
  disclaimerBold: {
    fontWeight: '800',
  },
  infoSection: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  factorList: {
    marginBottom: 20,
  },
  factorItem: {
    flexDirection: 'row',
    marginBottom: 14,
    gap: 12,
  },
  factorIcon: {
    fontSize: 20,
  },
  factorContent: {
    flex: 1,
  },
  factorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  factorDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 15,
  },
  scoringInfo: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 8,
    padding: 12,
  },
  scoringTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 8,
  },
  scoringText: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  scoringBold: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
