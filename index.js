/**
 * @format
 */
import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
// Optional: set WebSocket proxy URL via config
try {
	const { WS_PROXY_URL } = require('./src/config/network');
	if (WS_PROXY_URL && typeof WS_PROXY_URL === 'string') {
		global.__WS_PROXY_URL = WS_PROXY_URL;
		// eslint-disable-next-line no-console
		console.log('Using WS proxy:', WS_PROXY_URL);
	}
} catch (e) {
	// no-op if config not found
}

AppRegistry.registerComponent(appName, () => App);
