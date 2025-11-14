import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';

type BannerType = 'info' | 'warning' | 'error' | 'success';

interface NotificationBannerProps {
  visible: boolean;
  message: string;
  type?: BannerType;
  onClose?: () => void;
  autoHideMs?: number; // optional auto-hide duration
}

const colorsByType: Record<BannerType, { bg: string; text: string; border: string }> = {
  info: { bg: '#1E3A8A', text: '#E5E7EB', border: '#3B82F6' },
  warning: { bg: '#78350F', text: '#FEF3C7', border: '#F59E0B' },
  error: { bg: '#7F1D1D', text: '#FEE2E2', border: '#EF4444' },
  success: { bg: '#064E3B', text: '#D1FAE5', border: '#10B981' },
};

const NotificationBanner: React.FC<NotificationBannerProps> = ({
  visible,
  message,
  type = 'info',
  onClose,
  autoHideMs,
}) => {
  const [opacity] = React.useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    } else {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start();
    }
  }, [visible]);

  useEffect(() => {
    if (!visible || !autoHideMs) return;
    const t = setTimeout(() => onClose && onClose(), autoHideMs);
    return () => clearTimeout(t);
  }, [visible, autoHideMs, onClose]);

  if (!visible) return null;

  const palette = colorsByType[type];

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <View style={[styles.banner, { backgroundColor: palette.bg, borderColor: palette.border }]}> 
        <Text style={[styles.text, { color: palette.text }]} numberOfLines={3}>
          {message}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose} accessibilityLabel="Dismiss notification">
            <Text style={[styles.close, { color: palette.text }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  banner: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  text: {
    flex: 1,
    marginRight: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  close: {
    fontSize: 16,
    paddingHorizontal: 4,
  },
});

export default NotificationBanner;
