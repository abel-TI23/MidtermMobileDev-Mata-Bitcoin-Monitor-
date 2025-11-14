/**
 * TwitterFeedScreen - Display Twitter/X feed using official embeds
 * Alternative to Nitter RSS (more reliable but slower)
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { TwitterEmbed } from '../components/TwitterEmbed';

// Premium crypto Twitter accounts
const FEATURED_TWEETS = [
  'https://twitter.com/lookonchain/status/1234567890', // Replace with real tweet URLs
  'https://twitter.com/WhalePanda/status/1234567891',
  'https://twitter.com/CryptoQuant_com/status/1234567892',
  'https://twitter.com/glassnode/status/1234567893',
  'https://twitter.com/santimentfeed/status/1234567894',
];

export default function TwitterFeedScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app, fetch latest tweets
    await new Promise<void>((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Twitter Feed</Text>
        <Text style={styles.subtitle}>Latest from crypto experts</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#1DA1F2']}
            tintColor="#1DA1F2"
          />
        }
      >
        <View style={styles.feedContainer}>
          {FEATURED_TWEETS.map((tweetUrl, index) => (
            <TwitterEmbed key={index} tweetUrl={tweetUrl} />
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Powered by Twitter's official embed API
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
    paddingBottom: 12,
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
  scrollContent: {
    flexGrow: 1,
  },
  feedContainer: {
    paddingHorizontal: 16,
  },
  footer: {
    padding: 20,
    paddingTop: 8,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
