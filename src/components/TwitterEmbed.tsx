/**
 * TwitterEmbed - Display Twitter/X posts using official embed
 * Uses WebView with Twitter's oEmbed API
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Pressable, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

interface TwitterEmbedProps {
  tweetUrl: string;
  maxHeight?: number;
}

export function TwitterEmbed({ tweetUrl, maxHeight = 600 }: TwitterEmbedProps) {
  const [embedHtml, setEmbedHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmbedHtml();
  }, [tweetUrl]);

  const fetchEmbedHtml = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use Twitter's oEmbed API
      const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(tweetUrl)}&theme=dark&dnt=true`;
      
      const response = await fetch(oembedUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tweet embed');
      }

      const data = await response.json();
      
      if (data.html) {
        // Wrap HTML with styling
        const wrappedHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
            <style>
              body {
                margin: 0;
                padding: 16px;
                background-color: #111827;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              }
              .twitter-tweet {
                margin: 0 !important;
              }
            </style>
          </head>
          <body>
            ${data.html}
            <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
          </body>
          </html>
        `;
        setEmbedHtml(wrappedHtml);
      } else {
        throw new Error('No embed HTML returned');
      }
    } catch (err) {
      console.error('Error fetching Twitter embed:', err);
      setError('Failed to load tweet');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenInBrowser = () => {
    Linking.openURL(tweetUrl).catch(() => {
      console.error('Failed to open URL');
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#1DA1F2" />
        <Text style={styles.loadingText}>Loading tweet...</Text>
      </View>
    );
  }

  if (error || !embedHtml) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Failed to load tweet'}</Text>
        <Pressable style={styles.openButton} onPress={handleOpenInBrowser}>
          <Text style={styles.openButtonText}>Open in Browser</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.container, { maxHeight }]}>
      <WebView
        source={{ html: embedHtml }}
        style={styles.webview}
        scrollEnabled={false}
        automaticallyAdjustContentInsets={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        onError={() => setError('WebView error')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  webview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
  loadingContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginVertical: 8,
  },
  loadingText: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginVertical: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 12,
  },
  openButton: {
    backgroundColor: '#1DA1F2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  openButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
