// Runtime network configuration
// Set WS_PROXY_URL to your Cloudflare Worker WebSocket proxy when testing in regions with Binance WS blocked.
// Example: 'wss://binance-ws-proxy.yourname.workers.dev/stream'
export const WS_PROXY_URL: string = '';

// Toggle to force fallback polling instead of WebSocket
// If your WS is blocked and you don't want to use VPN/Proxy right now, set to false.
export const USE_WEBSOCKET: boolean = true;

// Polling intervals when USE_WEBSOCKET=false (ms)
export const POLLING_INTERVALS = {
	TICKER_MS: 10000,  // 10s
	CANDLES_MS: 60000, // 60s
};
