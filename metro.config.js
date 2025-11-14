const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

// Metro configuration
/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
	resolver: {
		sourceExts: ['js', 'json', 'ts', 'tsx', 'jsx'],
		extraNodeModules: {
			'react-native-reanimated': path.resolve(__dirname, 'src/lib/ReanimatedStub.ts'),
			'@shopify/react-native-skia': path.resolve(__dirname, 'src/lib/SkiaStub.ts'),
		},
	},
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
