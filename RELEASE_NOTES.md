# Mata - Bitcoin Monitor v1.0.0

**Real-time Bitcoin monitoring dengan trading signals, market analysis, dan multi-source news feeds**

## 🚀 Features

### 📊 Market Data & Charts
- **Real-time Price Monitoring** - WebSocket live price updates dari Binance
- **Interactive Charts** - Candlestick, line charts dengan multiple timeframes (1m, 5m, 15m, 1H, 4H, 1D)
- **Technical Indicators** - RSI, ATR, EMA, SMA, Volume analysis
- **Market Metrics** - Order Book depth, Long/Short ratio, Funding rates, Open Interest

### 🎯 Trading Signals
- **Rule-Based Signal Engine** - Analisis matematis tanpa ML
- **Multi-Factor Analysis**:
  - RSI oversold/overbought detection
  - EMA crossover patterns
  - Volume confirmation
  - ATR volatility measurement
  - Price momentum analysis
- **Risk Management** - Auto-calculated stop loss, take profit, position sizing
- **Confidence Scoring** - 5-star rating system untuk setiap signal

### 📰 News & Updates
- **Multi-Source News Aggregation**:
  - The Block
  - CoinDesk
  - Bloomberg Markets
  - Coinvestasi
- **YouTube Feeds** - Latest videos from 6 curated crypto channels:
  - Bravos Research
  - Bitcoin Magazine
  - Bloomberg Television
  - Real Vision
  - Benjamin Cowen
  - The Chart Guys
- **Twitter Integration** - Embedded timelines dari whale trackers & analysts

### 😱 Sentiment Analysis
- **Fear & Greed Index** - Daily market sentiment indicator
- **Market Dominance** - BTC dominance tracking
- **Liquidation Tracker** - Real-time liquidation monitoring

## 📱 Screenshots

(Coming soon)

## 🔧 Technical Stack

- **Framework**: React Native 0.82.1
- **Architecture**: New Architecture (Fabric + TurboModules)
- **JS Engine**: Hermes
- **State Management**: React Hooks + Context
- **Charts**: React Native SVG
- **Navigation**: React Navigation 6
- **Data Sources**: 
  - Binance API (Spot & Futures)
  - Alternative.me Fear & Greed API
  - RSS feeds (news sources)
  - YouTube RSS feeds

## 📦 Installation

### Requirements
- Android 7.0 (API 24) or higher
- ARM64 device (arm64-v8a)
- ~25MB storage space
- Internet connection

### Install APK
1. Download `Mata-v1.0.0.apk` from [Releases](https://github.com/abel-TI23/MidtermMobileDev-Mata-Bitcoin-Monitor-/releases)
2. Enable "Install from Unknown Sources" in Android settings
3. Open the APK file and install
4. Grant necessary permissions when prompted

### Network Requirements
- **WebSocket**: Binance WebSocket untuk real-time updates
- **HTTPS**: RSS feeds dan REST APIs
- **Recommended**: Cloudflare WARP atau VPN jika WebSocket terblokir di negara Anda

## 🎨 Key Highlights

### Performance Optimizations
- ARM64-only build untuk ukuran APK lebih kecil (~23MB)
- Hermes engine untuk JavaScript execution lebih cepat
- WebSocket dengan fallback ke polling mode
- Efficient caching untuk API calls
- Optimized rendering dengan React Native New Architecture

### User Experience
- Dark mode UI yang modern
- Pull-to-refresh di semua screens
- Smooth animations dengan 60 FPS
- Responsive design untuk berbagai ukuran layar
- Nested scrolling support untuk timeline embeds

### Reliability
- Graceful error handling untuk API failures
- Automatic fallback ke demo mode jika API tidak tersedia
- Network status monitoring
- Connection retry logic

## 🐛 Known Issues

1. **Twitter Embeds**: Beberapa negara memblokir Twitter/X, timeline mungkin tidak load
2. **WebSocket**: Binance WebSocket mungkin terblokir, app otomatis switch ke polling mode
3. **Bloomberg Images**: Tidak semua artikel Bloomberg memiliki gambar

## 🔮 Planned Features

- [ ] Portfolio tracking
- [ ] Price alerts & notifications
- [ ] Multiple exchange support
- [ ] DeFi metrics integration
- [ ] Custom watchlists
- [ ] Export trading history

## 📄 License

MIT License - Free to use and modify

## 🤝 Credits

Developed by **Abel** for Mobile Programming Midterm Project

### Data Sources
- Binance API (price, orderbook, futures data)
- Alternative.me (Fear & Greed Index)
- The Block, CoinDesk, Bloomberg (news)
- YouTube RSS (video feeds)

## 📞 Support

Found a bug or have a feature request? Open an issue on [GitHub](https://github.com/abel-TI23/MidtermMobileDev-Mata-Bitcoin-Monitor-/issues)

---

**⚠️ Disclaimer**: This app is for educational and informational purposes only. Not financial advice. Always do your own research before making investment decisions. Trading cryptocurrencies carries high risk.
