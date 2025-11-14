import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { OrderBookDepth } from '../components/OrderBookDepth';
import { VolumeAnalysis } from '../components/VolumeAnalysis';
import { LongShortRatio } from '../components/LongShortRatio';
import { LiquidationTracker } from '../components/LiquidationTracker';
import { OpenInterest } from '../components/OpenInterest';
import { FundingRate } from '../components/FundingRate';
import { OrderBookHeatmap } from '../components/OrderBookHeatmap';

export default function MarketFlowScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Market Flow</Text>
          <Text style={styles.subtitle}>Real-time order flow analysis</Text>
        </View>

        {/* Order Book Depth */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Book Depth</Text>
          <OrderBookDepth symbol="BTCUSDT" levels={10} />
        </View>

        {/* Volume Moving Average */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Volume Analysis</Text>
          <VolumeAnalysis symbol="BTCUSDT" period={20} />
        </View>

        {/* Long/Short Ratio */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Long/Short Ratio</Text>
          <LongShortRatio symbol="BTCUSDT" period="4h" />
        </View>

        {/* Liquidation Tracker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Liquidations</Text>
          <LiquidationTracker />
        </View>

        {/* Open Interest */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Open Interest</Text>
          <OpenInterest symbol="BTCUSDT" />
        </View>

        {/* Funding Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Funding Rate</Text>
          <FundingRate symbol="BTCUSDT" />
        </View>

        {/* Order Book Heatmap */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Order Book Heatmap</Text>
          <OrderBookHeatmap symbol="BTCUSDT" bucketSize={100} numLevels={20} />
        </View>

        {/* Real-time Updates Info */}
        <View style={styles.section}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Live Market Data</Text>
            <Text style={styles.infoText}>
              All data updates in real-time via WebSocket connections:
            </Text>
            <Text style={styles.bulletPoint}>• Order Book: 100ms depth updates</Text>
            <Text style={styles.bulletPoint}>• Volume: 30-second refresh with 20-MA</Text>
            <Text style={styles.bulletPoint}>• Long/Short: 1-minute updates</Text>
            <Text style={styles.bulletPoint}>• Liquidations: Real-time feed</Text>
            <Text style={styles.bulletPoint}>• Open Interest: Real-time tracking</Text>
            <Text style={styles.bulletPoint}>• Funding Rate: 5-minute refresh (updates every 8h)</Text>
            <Text style={styles.bulletPoint}>• Heatmap: Real-time order concentration at price levels</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Real-time order flow analysis powered by Binance API
          </Text>
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
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    textAlign: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 12,
    lineHeight: 18,
  },
  bulletPoint: {
    fontSize: 12,
    color: colors.textMuted,
    marginLeft: 8,
    marginBottom: 6,
    lineHeight: 16,
  },
  footer: {
    padding: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
