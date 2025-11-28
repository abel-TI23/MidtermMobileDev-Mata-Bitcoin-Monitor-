// Mock gesture handler
jest.mock('react-native-gesture-handler', () => ({
  GestureHandlerRootView: 'GestureHandlerRootView',
}));

// Mock Animated API
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  
  RN.Animated.timing = () => ({
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
  });
  
  RN.Animated.parallel = () => ({
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
  });
  
  RN.Animated.sequence = () => ({
    start: (callback) => {
      if (callback) callback({ finished: true });
    },
  });
  
  return RN;
});

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

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  getAllKeys: jest.fn(() => Promise.resolve([])),
  multiRemove: jest.fn(() => Promise.resolve()),
}));

// Mock react-native-svg
jest.mock('react-native-svg', () => {
  const React = require('react');
  return {
    Svg: ({ children, ...props }) => React.createElement('Svg', props, children),
    Circle: (props) => React.createElement('Circle', props),
    Rect: (props) => React.createElement('Rect', props),
    Path: (props) => React.createElement('Path', props),
    Line: (props) => React.createElement('Line', props),
    G: ({ children, ...props }) => React.createElement('G', props, children),
    Text: ({ children, ...props }) => React.createElement('Text', props, children),
  };
});

// Mock WebView
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));

// Suppress console warnings during tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};

