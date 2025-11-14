import 'react-native-gesture-handler/jestSetup';

// Silence the warning: Animated: `useNativeDriver` is not supported because the native animated module is missing
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Mock react-native-screens to avoid native calls
jest.mock('react-native-screens', () => ({
  enableScreens: jest.fn(),
  Screen: 'RNSScreen',
  ScreenContainer: 'RNSScreenContainer',
  NativeScreen: 'RNSScreen',
}));

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaView: ({ children }) => React.createElement('SafeAreaView', null, children),
    SafeAreaProvider: ({ children }) => React.createElement('SafeAreaProvider', null, children),
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});
