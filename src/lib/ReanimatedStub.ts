// Minimal stub to satisfy components that imported react-native-reanimated
// Provides basic JS fallbacks without native performance. Suitable for demo APK.
import { Animated } from 'react-native';

export const useSharedValue = <T,>(initial: T) => ({ value: initial });
export const useAnimatedStyle = (fn: () => any) => fn();
export const withTiming = (v: any) => v;
export const withSpring = (v: any) => v;
export const runOnJS = (fn: (...args: any[]) => any) => fn;

export default Animated;