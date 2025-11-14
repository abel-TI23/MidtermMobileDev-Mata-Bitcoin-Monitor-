# Runtime Notes

This app uses React Navigation with native modules (react-native-gesture-handler, react-native-screens) and real-time WebSocket updates.

## After dependency changes

If you update native dependencies (e.g., gesture handler, screens), you must reinstall and rebuild the app:

1. Install dependencies
   - `npm install`
2. Clean and rebuild Android
   - `cd android`
   - `./gradlew clean` (Windows: `gradlew.bat clean`)
   - `cd ..`
   - `npm run android`
3. Reset Metro cache (optional, recommended)
   - `npx react-native start --reset-cache`

## WebSocket Cleanup

Components that open WebSockets should use `useWebSocketCleanup(wsRef, reconnectFn)` to automatically close connections when the app goes to background and reconnect on foreground.

`PriceCard` has been migrated to use this hook; other real-time components should follow the same pattern.
