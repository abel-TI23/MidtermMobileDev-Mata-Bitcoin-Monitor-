import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { FeedItem, FeedSource, DEFAULT_YOUTUBE_CHANNELS } from '../types/feed';
import { FeedCard } from '../components/FeedCard';
import { TwitterTimeline } from '../components/TwitterTimeline';
import { aggregateFeeds } from '../utils/feedParser';
import { FEATURED_TWITTER_ACCOUNTS } from '../config/twitterFeeds';

export default function UpdatesScreen() {
  const [feeds, setFeeds] = useState<FeedItem[]>([]);
  const [filteredFeeds, setFilteredFeeds] = useState<FeedItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<FeedSource | 'all'>('all');
  const [loading, setLoading] = useState(false); // Start with false
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false); // Track first load

  // Load feeds when screen is focused (only if not loaded before)
  useFocusEffect(
    useCallback(() => {
      if (!hasLoaded) {
        loadFeeds();
      }
    }, [hasLoaded])
  );

  // Filter feeds when filter changes
  useEffect(() => {
    if (selectedFilter === 'all') {
      setFilteredFeeds(feeds);
    } else {
      setFilteredFeeds(feeds.filter(item => item.source === selectedFilter));
    }
  }, [selectedFilter, feeds]);

  const loadFeeds = async () => {
    if (loading || refreshing) return; // Prevent duplicate calls
    
    setLoading(true);
    setError(null);
    
    try {
      // DISABLE Twitter for now - too slow/unreliable
      const twitterHandles: string[] = []; // Empty array
      
      const youtubeChannels = DEFAULT_YOUTUBE_CHANNELS
        .filter(ch => ch.enabled)
        .map(ch => ({ channelId: ch.channelId, name: ch.name }));

      const allFeeds = await aggregateFeeds(twitterHandles, youtubeChannels, true);
      setFeeds(allFeeds);
      setHasLoaded(true);
    } catch (err) {
      console.error('Error loading feeds:', err);
      setError('Failed to load updates. Pull to refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadFeeds();
    setRefreshing(false);
  };

  const getFilterLabel = (source: FeedSource | 'all'): string => {
    switch (source) {
      case 'all': return 'All';
      case 'twitter': return 'Twitter';
      case 'news': return 'News';
      case 'youtube': return 'YouTube';
    }
  };

  const getFilterCount = (source: FeedSource | 'all'): number => {
    if (source === 'all') return feeds.length;
    if (source === 'twitter') {
      // Since we disabled twitterHandles fetch, reflect featured accounts instead of 0
      return FEATURED_TWITTER_ACCOUNTS.length;
    }
    return feeds.filter(item => item.source === source).length;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Updates</Text>
          <Text style={styles.subtitle}>Latest crypto news and insights</Text>
        </View>
      </View>

      {/* Filter Tabs - Compact Design */}
      <View style={styles.filterContainer}>
        {(['all', 'twitter', 'news', 'youtube'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {getFilterLabel(filter)} {filter === 'twitter' ? '' : (getFilterCount(filter) > 0 ? `(${getFilterCount(filter)})` : '')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading updates...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadFeeds}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.contentContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            nestedScrollEnabled
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={['#3B82F6']}
                tintColor="#3B82F6"
              />
            }
          >
            <View style={styles.feedList}>
              {/* Twitter Timeline Section */}
              {selectedFilter === 'twitter' ? (
                <View style={styles.twitterSection}>
                  <Text style={styles.sectionTitle}>Rekomendasi Akun Twitter/X</Text>
                  <Text style={styles.sectionSubtitle}>Pilih akun favorit dan buka langsung di Twitter atau X</Text>
                  {FEATURED_TWITTER_ACCOUNTS.map(account => (
                    <TwitterTimeline key={account.username} account={account} />
                  ))}
                </View>
              ) : null}

              {/* News & YouTube Feeds */}
              {(selectedFilter === 'news' || selectedFilter === 'youtube' || selectedFilter === 'all') && (
                <>
                  {filteredFeeds.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>No updates available</Text>
                      <Text style={styles.emptyStateSubtext}>
                        Pull down to refresh
                      </Text>
                    </View>
                  ) : (
                    filteredFeeds.map((item) => (
                      <FeedCard key={item.id} item={item} />
                    ))
                  )}
                </>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Sources: Rekomendasi akun Twitter/X, The Block, CoinDesk, Bloomberg Markets, Coinvestasi, YouTube RSS
              </Text>
              <Text style={styles.footerSubtext}>
                Last updated: {new Date().toLocaleTimeString()}
              </Text>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  filterTabActive: {
    backgroundColor: '#3B82F6',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 12,
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  feedList: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  twitterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  emptyState: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(59, 130, 246, 0.2)',
    marginVertical: 20,
  },
  emptyStateText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: colors.textMuted,
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
  footerSubtext: {
    fontSize: 10,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
});
