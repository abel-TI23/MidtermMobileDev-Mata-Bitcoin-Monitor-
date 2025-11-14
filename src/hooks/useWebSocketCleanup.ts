/**
 * useWebSocketCleanup - Simple hook to ensure WebSocket cleanup
 * Prevents memory leaks by closing connections on unmount and app background
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useWebSocketCleanup(
  wsRef: React.MutableRefObject<WebSocket | null>,
  reconnectFn?: () => void
) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      // App going to background - close WebSocket
      if (
        appState.current.match(/active/) &&
        nextAppState.match(/inactive|background/)
      ) {
        console.log('[WebSocketCleanup] App backgrounded - closing WebSocket');
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
          wsRef.current = null;
        }
      }

      // App coming to foreground - reconnect WebSocket
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[WebSocketCleanup] App foregrounded - reconnecting WebSocket');
        if (reconnectFn) {
          // Delay reconnect slightly to ensure app is fully active
          setTimeout(reconnectFn, 500);
        }
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [wsRef, reconnectFn]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('[WebSocketCleanup] Component unmounting - closing WebSocket');
      if (wsRef.current) {
        try {
          wsRef.current.close();
          wsRef.current = null;
        } catch (error) {
          console.error('[WebSocketCleanup] Error closing WebSocket:', error);
        }
      }
    };
  }, [wsRef]);
}
