/**
 * Connection Status Indicator
 * Shows whether data is coming from WebSocket (LIVE) or Polling mode
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type ConnectionMode = 'live' | 'polling' | 'connecting' | 'offline';

interface ConnectionStatusProps {
  mode: ConnectionMode;
  size?: 'small' | 'medium';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  mode, 
  size = 'small' 
}) => {
  const getStyles = () => {
    switch (mode) {
      case 'live':
        return {
          container: styles.containerLive,
          dot: styles.dotLive,
          text: styles.textLive,
          label: 'LIVE',
        };
      case 'polling':
        return {
          container: styles.containerPolling,
          dot: styles.dotPolling,
          text: styles.textPolling,
          label: 'POLLING',
        };
      case 'connecting':
        return {
          container: styles.containerConnecting,
          dot: styles.dotConnecting,
          text: styles.textConnecting,
          label: 'CONNECTING...',
        };
      case 'offline':
        return {
          container: styles.containerOffline,
          dot: styles.dotOffline,
          text: styles.textOffline,
          label: 'OFFLINE',
        };
    }
  };

  const config = getStyles();
  const isSmall = size === 'small';

  return (
    <View style={[styles.container, config.container, isSmall && styles.containerSmall]}>
      <View style={[styles.dot, config.dot, isSmall && styles.dotSmall]} />
      <Text style={[styles.text, config.text, isSmall && styles.textSmall]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  containerSmall: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  
  // Live (Green)
  containerLive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  dotLive: {
    backgroundColor: '#22C55E',
  },
  textLive: {
    color: '#22C55E',
  },

  // Polling (Yellow)
  containerPolling: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  dotPolling: {
    backgroundColor: '#FBBF24',
  },
  textPolling: {
    color: '#FBBF24',
  },

  // Connecting (Blue)
  containerConnecting: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  dotConnecting: {
    backgroundColor: '#3B82F6',
  },
  textConnecting: {
    color: '#9CA3AF',
  },

  // Offline (Gray)
  containerOffline: {
    backgroundColor: 'rgba(107, 114, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.3)',
  },
  dotOffline: {
    backgroundColor: '#6B7280',
  },
  textOffline: {
    color: '#6B7280',
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  text: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSmall: {
    fontSize: 9,
  },
});
