/**
 * TwitterTimeline - Lightweight card to recommend Twitter accounts
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Linking } from 'react-native';
import { colors } from '../theme';
import { FeaturedTwitterAccount } from '../config/twitterFeeds';

interface TwitterTimelineProps {
  account: FeaturedTwitterAccount;
  onVisit?: (username: string) => void;
}

export function TwitterTimeline({ account, onVisit }: TwitterTimelineProps) {
  const handleVisit = () => {
    const url = `https://twitter.com/${account.username}`;
    Linking.openURL(url).catch(() => {
      // No-op when the device cannot handle the URL
    });
    if (onVisit) {
      onVisit(account.username);
    }
  };

  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.cardPressed]} onPress={handleVisit}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{account.name.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.meta}>
          <Text style={styles.name}>{account.name}</Text>
          <Text style={styles.username}>@{account.username}</Text>
        </View>
      </View>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{account.category}</Text>
      </View>
      {account.description ? (
        <Text style={styles.description}>{account.description}</Text>
      ) : null}
      <Text style={styles.cta}>Buka di Twitter/X</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111827',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.15)',
    marginBottom: 12,
  },
  cardPressed: {
    opacity: 0.85,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  username: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  cta: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3B82F6',
    marginTop: 16,
  },
});

export default TwitterTimeline;
