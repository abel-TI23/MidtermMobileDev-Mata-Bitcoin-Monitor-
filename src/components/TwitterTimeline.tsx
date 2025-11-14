/**
 * TwitterTimeline - Display Twitter account timeline using official embed widget
 * Shows the latest tweets from a specific account
 */

import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Linking, Text } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors } from '../theme';

interface TwitterTimelineProps {
  username: string; // Twitter username without @
  tweetLimit?: number; // Number of tweets to display (default: 5)
  height?: number; // Height of the timeline (default: 500)
}

export function TwitterTimeline({ 
  username, 
  tweetLimit = 5,
  height = 500,
}: TwitterTimelineProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            background-color: #000000;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .timeline-container {
            width: 100%;
            min-height: 100vh;
          }
          /* Hide scrollbar but keep functionality */
          ::-webkit-scrollbar {
            width: 0px;
            background: transparent;
          }
        </style>
      </head>
      <body>
        <div class="timeline-container">
          <a class="twitter-timeline"
             data-theme="dark"
             data-chrome="noheader nofooter noborders transparent"
             data-tweet-limit="${tweetLimit}"
             data-dnt="true"
             href="https://twitter.com/${username}">
            Loading tweets from @${username}...
          </a>
        </div>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
      </body>
    </html>
  `;

  const handleNavigationStateChange = useCallback((navState: any) => {
    // Open external links in browser
    if (navState.url && !navState.url.includes('about:blank')) {
      const twitterDomains = ['twitter.com', 'x.com', 't.co'];
      const isTwitterLink = twitterDomains.some(domain => navState.url.includes(domain));
      
      if (isTwitterLink && navState.navigationType === 'click') {
        Linking.openURL(navState.url);
        return false;
      }
    }
    return true;
  }, []);

  return (
    <View style={[styles.container, { height }]}>
      {loading && !error && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      )}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Couldn’t load Twitter/X</Text>
          <Text style={styles.errorText}>Content may be blocked by network or region. Tap to open in browser.</Text>
          <Text
            style={styles.errorLink}
            onPress={() => Linking.openURL(`https://twitter.com/${username}`)}
          >
            Open @${username}
          </Text>
        </View>
      )}
      <WebView
        source={{ html }}
        style={styles.webview}
        onLoadEnd={() => setLoading(false)}
        onError={() => { setLoading(false); setError('Failed'); }}
        onShouldStartLoadWithRequest={handleNavigationStateChange}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        androidLayerType="hardware"
        mixedContentMode="compatibility"
        nestedScrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 8,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    zIndex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    zIndex: 2,
  },
  errorTitle: { color: '#fff', fontWeight: '700', marginBottom: 6 },
  errorText: { color: '#9CA3AF', fontSize: 12, textAlign: 'center' },
  errorLink: { color: '#3B82F6', fontWeight: '700', marginTop: 10 },
});

export default TwitterTimeline;
