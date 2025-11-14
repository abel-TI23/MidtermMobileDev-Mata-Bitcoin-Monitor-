import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius } from '../theme';

interface SkeletonProps {
  width?: number | `${number}%` | 'auto';
  height?: number;
  style?: ViewStyle;
  radiusSize?: number;
}

// Lightweight pulsing skeleton (no gradient dependency)
const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 16, style, radiusSize = radius.md }) => {
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.6, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.base, { width, height, borderRadius: radiusSize, opacity }, style]} />
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: '#1B2230',
    borderWidth: 1,
    borderColor: colors.border,
  },
});

export default Skeleton;
