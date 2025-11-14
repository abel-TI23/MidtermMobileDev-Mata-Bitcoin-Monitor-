module.exports = {
  preset: 'react-native',
  // Ignore non-RN subprojects during RN test runs
  testPathIgnorePatterns: [
    '/node_modules/',
    '<rootDir>/binance-ws-proxy/',
    '<rootDir>/server-proxy/',
    '<rootDir>/cloudflare/',
  ],
  // Ensure ESM packages in node_modules get transformed
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-native-.*)/)'
  ],
  setupFiles: [
    '<rootDir>/jest.setup.js',
    'react-native-gesture-handler/jestSetup',
  ],
};
