/**
 * useAppStatereconnect - Hook to reconnect WebSocket when app returns to foreground
 * Fixes stuck WebSocket data when app is backgrounded
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useAppStateReconnect(reconnectFn: () => void) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to foreground - trigger reconnect
        console.log('App came to foreground - triggering reconnect');
        reconnectFn();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [reconnectFn]);
}
