/**
 * FeedCard - Display individual feed item (Twitter, News, YouTube)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Linking } from 'react-native';
import { colors } from '../theme';
import { FeedItem } from '../types/feed';

interface FeedCardProps {
  item: FeedItem;
}

export function FeedCard({ item }: FeedCardProps) {
  const handlePress = () => {
    Linking.openURL(item.link).catch(err => console.error('Failed to open URL:', err));
  };

  const getSourceIcon = () => {
    switch (item.source) {
      case 'twitter':
        return '🐦';
      case 'news':
        return '📰';
      case 'youtube':
        return '▶️';
      default:
        return '📄';
    }
  };

  const getSourceColor = () => {
    switch (item.source) {
      case 'twitter':
        return '#1DA1F2';
      case 'news':
        return '#F59E0B';
      case 'youtube':
        return '#FF0000';
      default:
        return '#6B7280';
    }
  };

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.sourceInfo}>
          <View style={[styles.sourceIcon, { backgroundColor: getSourceColor() + '20' }]}>
            <Text style={styles.sourceEmoji}>{getSourceIcon()}</Text>
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.author}>{item.author}</Text>
            {item.authorHandle && (
              <Text style={styles.handle}>{item.authorHandle}</Text>
            )}
          </View>
        </View>
        <Text style={styles.timestamp}>{formatTimeAgo(item.publishedAt)}</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={3}>
          {item.title}
        </Text>
        {item.content && (
          <Text style={styles.description} numberOfLines={2}>
            {item.content}
          </Text>
        )}
      </View>

      {/* Media */}
      {(item.imageUrl || item.thumbnailUrl) && (
        <Image
          source={{ uri: item.imageUrl || item.thumbnailUrl }}
          style={styles.media}
          resizeMode="cover"
        />
      )}

      {/* Footer */}
      <View style={styles.footer}>
        {item.category && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        <View style={styles.linkIcon}>
          <Text style={styles.linkIconText}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  sourceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sourceEmoji: {
    fontSize: 16,
  },
  authorInfo: {
    flex: 1,
  },
  author: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  handle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  content: {
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 20,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  media: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3B82F6',
    textTransform: 'uppercase',
  },
  linkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkIconText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3B82F6',
  },
});
