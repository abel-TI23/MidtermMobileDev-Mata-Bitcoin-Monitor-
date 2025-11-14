/**
 * TradingView Widget Component
 * 
 * Embeds TradingView's advanced chart for Bitcoin
 * Uses TradingView's free mini widget (no API key required)
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

interface TradingViewWidgetProps {
  symbol?: string; // e.g., "BTCUSDT", "BINANCE:BTCUSDT"
  interval?: string; // e.g., "1", "5", "15", "60", "240", "D"
  theme?: 'light' | 'dark';
  height?: number;
  width?: number;
  hideTopToolbar?: boolean;
  hideSideToolbar?: boolean;
  showVolume?: boolean;
}

/**
 * TradingView Advanced Chart Widget
 * 
 * Features:
 * - Full TradingView charting functionality
 * - All indicators, drawing tools
 * - Professional-grade analysis
 * - Free to use (no API key)
 */
export function TradingViewWidget({
  symbol = 'BINANCE:BTCUSDT',
  interval = '60', // 1 hour default
  theme = 'dark',
  height = 400,
  width = Dimensions.get('window').width,
  hideTopToolbar = false,
  hideSideToolbar = false,
  showVolume = true,
}: TradingViewWidgetProps) {
  // Generate TradingView HTML
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${theme === 'dark' ? '#0A0E27' : '#ffffff'}; }
    #tradingview_widget { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div id="tradingview_widget"></div>
  
  <script type="text/javascript" src="https://s3.tradingview.com/tv.js"></script>
  <script type="text/javascript">
    new TradingView.widget({
      "autosize": true,
      "symbol": "${symbol}",
      "interval": "${interval}",
      "timezone": "Etc/UTC",
      "theme": "${theme}",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "${theme === 'dark' ? '#0A0E27' : '#f1f3f6'}",
      "enable_publishing": false,
      "hide_top_toolbar": ${hideTopToolbar},
      "hide_side_toolbar": ${hideSideToolbar},
      "allow_symbol_change": false,
      "save_image": false,
      "container_id": "tradingview_widget",
      "studies": [
        ${showVolume ? '"Volume@tv-basicstudies"' : ''}
      ],
      "show_popup_button": false,
      "popup_width": "1000",
      "popup_height": "650",
      "backgroundColor": "${theme === 'dark' ? '#0A0E27' : '#ffffff'}",
      "gridColor": "${theme === 'dark' ? '#1E2640' : '#e0e3eb'}",
      "hide_volume": ${!showVolume}
    });
  </script>
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height, width }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        scalesPageToFit={false}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        // Disable zoom
        injectedJavaScript={`
          const meta = document.createElement('meta');
          meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
          meta.setAttribute('name', 'viewport');
          document.getElementsByTagName('head')[0].appendChild(meta);
        `}
      />
    </View>
  );
}

/**
 * TradingView Mini Widget (Lightweight Alternative)
 * 
 * Simpler, faster loading widget
 * Good for preview/card views
 */
export function TradingViewMiniWidget({
  symbol = 'BINANCE:BTCUSDT',
  theme = 'dark',
  height = 200,
  width = Dimensions.get('window').width - 32,
}: Omit<TradingViewWidgetProps, 'interval' | 'hideTopToolbar' | 'hideSideToolbar' | 'showVolume'>) {
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: ${theme === 'dark' ? '#0A0E27' : '#ffffff'}; }
  </style>
</head>
<body>
  <!-- TradingView Widget BEGIN -->
  <div class="tradingview-widget-container" style="height:100%;width:100%">
    <div class="tradingview-widget-container__widget" style="height:calc(100% - 32px);width:100%"></div>
    <script type="text/javascript" src="https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js" async>
    {
      "symbol": "${symbol}",
      "width": "100%",
      "height": "100%",
      "locale": "en",
      "dateRange": "1D",
      "colorTheme": "${theme}",
      "trendLineColor": "rgba(59, 130, 246, 1)",
      "underLineColor": "rgba(59, 130, 246, 0.3)",
      "underLineBottomColor": "rgba(59, 130, 246, 0)",
      "isTransparent": true,
      "autosize": true,
      "largeChartUrl": ""
    }
    </script>
  </div>
  <!-- TradingView Widget END -->
</body>
</html>
  `;

  return (
    <View style={[styles.container, { height, width }]}>
      <WebView
        source={{ html: htmlContent }}
        style={styles.webview}
        scrollEnabled={false}
        bounces={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#0A0E27',
  },
  webview: {
    backgroundColor: 'transparent',
  },
});
