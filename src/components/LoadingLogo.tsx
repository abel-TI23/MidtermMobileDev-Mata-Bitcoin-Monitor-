/**
 * LoadingLogo - Sequential fade transition animation
 * Animation sequence: splash1 → splash2 → splash (crossfade effect)
 */

import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Easing } from 'react-native';

interface LoadingLogoProps {
  size?: number;
  showAnimation?: boolean;
  onAnimationComplete?: () => void;
}

export function LoadingLogo({ 
  size = 240, // 2x larger (was 120)
  showAnimation = true,
  onAnimationComplete 
}: LoadingLogoProps) {
  const splash1Opacity = useRef(new Animated.Value(0)).current;
  const splash2Opacity = useRef(new Animated.Value(0)).current;
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!showAnimation) {
      // Skip animation, show final logo directly
      splash1Opacity.setValue(0);
      splash2Opacity.setValue(0);
      splashOpacity.setValue(1);
      scaleAnim.setValue(1);
      return;
    }

    // Sequential animation sequence
    Animated.sequence([
      // Step 1: Fade in splash1 with scale (500ms)
      Animated.parallel([
        Animated.timing(splash1Opacity, {
          toValue: 1,
          duration: 500,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
      ]),

      // Step 2: Hold splash1 (300ms)
      Animated.delay(300),

      // Step 3: Crossfade splash1 → splash2 (600ms)
      Animated.parallel([
        Animated.timing(splash1Opacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(splash2Opacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),

      // Step 4: Hold splash2 (300ms)
      Animated.delay(300),

      // Step 5: Crossfade splash2 → final splash (600ms)
      Animated.parallel([
        Animated.timing(splash2Opacity, {
          toValue: 0,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(splashOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ]),

      // Step 6: Hold final splash (400ms)
      Animated.delay(400),
    ]).start(() => {
      // Start glow pulse on final logo (infinite loop)
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            easing: Easing.ease,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Notify parent that animation sequence completed
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    });
  }, [showAnimation]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const glowScale = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {/* Purple glow ring (only visible on final splash) */}
      <Animated.View
        style={[
          styles.glowRing,
          {
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: (size * 1.2) / 2,
            opacity: Animated.multiply(splashOpacity, glowOpacity),
            transform: [{ scale: glowScale }],
          },
        ]}
      />

      {/* Splash 1 - First image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: splash1Opacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/images/splash1.png')}
          style={[styles.logo, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Splash 2 - Second image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: splash2Opacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/images/splash2.png')}
          style={[styles.logo, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Final Splash - Third image */}
      <Animated.View
        style={[
          styles.imageContainer,
          {
            opacity: splashOpacity,
          },
        ]}
      >
        <Image
          source={require('../../assets/images/splash.png')}
          style={[styles.logo, { width: size, height: size }]}
          resizeMode="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
    backgroundColor: 'rgba(168, 85, 247, 0.2)', // Purple glow
    borderWidth: 3,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  imageContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

// Default export for compatibility
export default LoadingLogo;
