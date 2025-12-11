/**
 * HomeScreen Component
 * Main dashboard displaying real-time BTC data, chart, and indicators
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { RootStackParamList, TabParamList } from '../../App';
import dayjs from 'dayjs';
import PriceCard from '../components/PriceCard';
import NotificationBanner from '../components/NotificationBanner';
import CenterModal from '../components/CenterModal';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import FearGreedCard from '../components/FearGreedCard';
import { ATRCard } from '../components/ATRCard';
import { RSICard } from '../components/RSICard';
import { VolumeCard } from '../components/VolumeCard';
import OrderBookCard from '../components/OrderBookCard';
import MarketDominanceCard from '../components/MarketDominanceCard';
import { ResponsiveGrid } from '../components/ResponsiveGrid';
import { colors } from '../theme';
import { fetchFearGreedIndex } from '../utils/fearGreedAPI';
import { REFRESH_INTERVALS } from '../utils/performanceConfig';
import { USE_WEBSOCKET, POLLING_INTERVALS } from '../config/network';
import {
  fetchCandles,
  createBinanceWebSocket,
  Candle,
  TickerData,
  INTERVALS,
  fetchTicker24h,
} from '../utils/binanceAPI';
import { calculateEMA, calculateSMA } from '../utils/indicators';
import { generateMockCandles, generateMockTicker, updateMockCandle } from '../utils/mockData';
import { useKlines } from '../market/MarketDataManager';
import { useSettings } from '../hooks/useSettings';
import { normalize, spacing, fontSize, borderRadius } from '../utils/responsive';

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { settings, refreshSettings } = useSettings();
  // State management
  const [candles, setCandles] = useState<Candle[]>([]);
  // Removed local price/volume/change states to avoid frequent screen-wide re-renders
  const [showEMA, setShowEMA] = useState(true);
  const [showSMA, setShowSMA] = useState(true);
  const [selectedInterval, setSelectedInterval] = useState('1m');
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [useMockData, setUseMockData] = useState(false); // Flag for using mock data
  // Fear & Greed index
  const [fgValue, setFgValue] = useState<number | null>(null);
  const [fgLabel, setFgLabel] = useState<string | undefined>(undefined);
  const [fgUpdated, setFgUpdated] = useState<string | undefined>(undefined);
  // Market Metrics state
  // Market metrics removed for now (unstable APIs)
  // Notification banner state
  const [bannerVisible, setBannerVisible] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');
  const [bannerType, setBannerType] = useState<'info' | 'warning' | 'error' | 'success'>('info');
  const [bannerAutoHideMs, setBannerAutoHideMs] = useState<number | undefined>(7000);

  // Center modal notice (one-time per app open)
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState<string>('Peringatan');
  const [modalMessage, setModalMessage] = useState<string>('');
  // Dedup keys to avoid spamming the same problem
  const lastNoticeRef = useRef<{ key: string; time: number } | null>(null);
  // Show first-launch tip once per session
  const firstLaunchTipShownRef = useRef(false);

  const fallbackPollRef = useRef<any>(null);
  const latestKline = useKlines('1m', 'BTCUSDT');

  // Calculate active alerts count
  const activeAlertsCount = settings.priceAlerts.filter(a => a.enabled).length;

  const showNotice = (key: string, message: string, type: 'info'|'warning'|'error'|'success' = 'info', cooldownMs = 60000, autoHide?: number) => {
    const now = Date.now();
    const last = lastNoticeRef.current;
    if (last && last.key === key && now - last.time < cooldownMs) {
      // Skip duplicate notices within cooldown window
      return;
    }
    lastNoticeRef.current = { key, time: now };
    setBannerMessage(message);
    setBannerType(type);
    setBannerAutoHideMs(autoHide ?? 7000);
    setBannerVisible(true);
  };

  // Load initial candle data from REST API
  const CHART_LIMIT_BY_INTERVAL: Record<string, number> = {
    '1m': 120,   // ~2h (clean, focused)
    '5m': 144,   // ~12h
    '15m': 192,  // ~2 days
    '1h': 168,   // ~7 days
    '4h': 180,   // ~1 month
    '1d': 365,   // ~1 year
  };

  const loadInitialData = async (interval: string = '1m') => {
    try {
      console.log('🔄 Loading initial data...');
      setIsLoading(true);
      const limit = CHART_LIMIT_BY_INTERVAL[interval] ?? 200;
      const data = await fetchCandles('BTCUSDT', interval, limit);
      console.log('✅ Data loaded:', data.length, 'candles');
      setCandles(data);
      setUseMockData(false);
      
      const lastCandle = data[data.length - 1];
      if (lastCandle) {
        setLastUpdate(dayjs(lastCandle.time).format('MMM D, HH:mm:ss'));
      }
      setIsLoading(false);
    } catch (error) {
  console.error('❌ Load initial data error:', error);
  // Notify once and fall back to mock
  showNotice('demo-mode', 'Could not reach Binance API. Running in Demo Mode with simulated data.', 'warning');
  // Use mock data as fallback
      console.log('🎭 Using mock data as fallback');
      const mockData = generateMockCandles(200);
      setCandles(mockData);
  setUseMockData(true);
  const lastCandle = mockData[mockData.length - 1];
  setLastUpdate(dayjs(lastCandle.time).format('MMM D, HH:mm:ss'));
      
      setIsLoading(false);
    }
  };

  // Fetch Fear & Greed Index (updates daily; refresh occasionally)
  const loadFearGreed = async () => {
    try {
      const data = await fetchFearGreedIndex();
      setFgValue(data.value);
      setFgLabel(data.classification);
      setFgUpdated(data.lastUpdated);
    } catch (e: any) {
      console.log('Fear & Greed fetch error:', e?.message || e);
      showNotice('fg-error', 'Unable to load Fear & Greed Index right now.', 'info', 3600000);
    }
  };

  // Fetch Market Metrics (Open Interest, BTC Dominance, Liquidations)
  const loadMarketMetrics = async () => {};

  // Connect to WebSocket for real-time updates
  // React to shared kline updates (no direct WS here)
  useEffect(() => {
    if (latestKline.candle && latestKline.isClosed) {
      const c = latestKline.candle;
      setCandles(prev => [...prev, c].slice(-300));
      setLastUpdate(dayjs(c.time).format('MMM D, HH:mm:ss'));
    }
  }, [latestKline]);
  
  useEffect(() => {
    // First-launch floating tip about WebSocket restrictions
    if (!firstLaunchTipShownRef.current) {
      setModalTitle('Peringatan');
      setModalMessage('Di beberapa negara koneksi WebSocket ke Binance dapat diblokir sehingga aplikasi kurang optimal. Disarankan mengaktifkan Cloudflare 1.1.1.1 WARP (dapat diunduh di playstore) atau terhubung ke VPN. Jika WS tidak tersedia, aplikasi akan beralih ke mode Polling secara otomatis.');
      setModalVisible(true);
      firstLaunchTipShownRef.current = true;
    }

    loadInitialData(selectedInterval);
    loadFearGreed();
  // Market metrics removed
    
    // Real-time updates now provided by MarketDataManager via hook
    
    // Fallback: Polling mode when mock OR WebSocket disabled
    let pollInterval: any = null;
    if (useMockData || !USE_WEBSOCKET) {
      pollInterval = setInterval(() => {
        if (useMockData) {
          console.log('🎭 Updating mock data...');
          setCandles(prev => {
            if (prev.length === 0) return prev;
            const newCandle = updateMockCandle(prev[prev.length - 1]);
            const updated = [...prev, newCandle].slice(-300);
            return updated;
          });
          setLastUpdate(dayjs().format('MMM D, HH:mm:ss'));
        } else {
          // Real network polling
          fetchTicker24h('BTCUSDT')
            .then((t) => {
              setLastUpdate(dayjs().format('MMM D, HH:mm:ss'));
            })
            .catch(() => {});
        }
      }, settings.pollingInterval);

      // Less frequent candle refresh for chart sync in polling mode
      const candleTimer = setInterval(() => {
        if (!useMockData && !USE_WEBSOCKET) {
          loadInitialData(selectedInterval);
        }
      }, POLLING_INTERVALS.CANDLES_MS);

      // Store candleTimer on ref for cleanup by reusing pollInterval as tuple
      (pollInterval as any) = { ticker: pollInterval, candles: candleTimer };
    }

    // Refresh Fear & Greed every 30 minutes (low-priority data)
    const fgInterval = setInterval(() => {
      loadFearGreed();
    }, REFRESH_INTERVALS.FEAR_GREED_INDEX);

    // Refresh Market Metrics every 5 minutes
    // metrics refresh disabled

    // Cleanup on unmount
    return () => {
      if (pollInterval) {
        if ((pollInterval as any).ticker) clearInterval((pollInterval as any).ticker);
        if ((pollInterval as any).candles) clearInterval((pollInterval as any).candles);
        if (typeof pollInterval === 'number') clearInterval(pollInterval);
      }
      clearInterval(fgInterval);
      if (fallbackPollRef.current) {
        clearInterval(fallbackPollRef.current);
      }
    };
  }, [selectedInterval, useMockData]);

  // Calculate indicators using useMemo for performance
  const closes = useMemo(() => candles.map((c) => c.close), [candles]);
  const ema21 = useMemo(() => calculateEMA(closes, 21), [closes]);
  const sma100 = useMemo(() => calculateSMA(closes, 100), [closes]);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Reload all data in parallel
      await Promise.all([
        loadInitialData(selectedInterval),
        loadFearGreed(),
        loadMarketMetrics(),
      ]);
  showNotice('refresh-success', '✅ Data refreshed', 'success', 3000, 3000);
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle interval change
  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  // Stable navigation handlers to prevent child remounts
  const onPressPriceCard = useCallback(() => {
    navigation.navigate('IndicatorDetail', { type: 'PRICE', symbol: 'BTCUSDT' });
  }, [navigation]);
  const onPressVolumeCard = useCallback(() => {
    navigation.navigate('IndicatorDetail', { type: 'VOLUME', symbol: 'BTCUSDT' });
  }, [navigation]);
  const onPressFG = useCallback(() => {
    navigation.navigate('IndicatorDetail', { type: 'FG' });
  }, [navigation]);
  const onPressATR = useCallback(() => {
    navigation.navigate('IndicatorDetail', { type: 'ATR', symbol: 'BTCUSDT' });
  }, [navigation]);
  const onPressRSI = useCallback(() => {
    navigation.navigate('IndicatorDetail', { type: 'RSI', symbol: 'BTCUSDT' });
  }, [navigation]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Non-blocking, deduplicated notifications */}
        <NotificationBanner
          visible={bannerVisible}
          message={bannerMessage}
          type={bannerType}
          autoHideMs={bannerAutoHideMs}
          onClose={() => setBannerVisible(false)}
        />
        {/* Center modal notice (first-launch WS tip) */}
        <CenterModal
          visible={modalVisible}
          title={modalTitle}
          message={modalMessage}
          onClose={() => setModalVisible(false)}
          primaryActionLabel="Mengerti"
          onPrimaryAction={() => setModalVisible(false)}
        />
      {isLoading && candles.length === 0 ? (
        <ScrollView 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        >
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <Text style={styles.headerTitle}>Mata</Text>
            <Text style={styles.headerSubtitle}>Bitcoin Monitor</Text>
          </View>
          <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
            <Badge label="Loading…" tone="info" />
          </View>
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Skeleton height={140} radiusSize={16} />
          </View>
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Skeleton height={280} radiusSize={16} />
          </View>
          {/* Metrics placeholder while loading */}
          <View style={{ marginHorizontal: 16, marginTop: 16 }}>
            <Skeleton height={100} radiusSize={12} />
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.accent]}
              tintColor={colors.accent}
            />
          }
        >
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Mata</Text>
            <Text style={styles.headerSubtitle}>Bitcoin Monitor</Text>
          </View>
          
          <View style={styles.headerRight}>
            <Badge
              label={useMockData ? 'Demo Mode' : USE_WEBSOCKET ? (isConnected ? 'Live' : 'Connecting...') : 'Polling'}
              tone={useMockData ? 'violet' : USE_WEBSOCKET ? (isConnected ? 'success' : 'default') : 'accent'}
            />
            {!USE_WEBSOCKET && !useMockData && (
              <Badge
                label={`${settings.pollingInterval / 1000}s`}
                tone="default"
              />
            )}
            {activeAlertsCount > 0 && (
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                activeOpacity={0.7}
              >
                <Badge
                  label={`🔔 ${activeAlertsCount}`}
                  tone="accent"
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.7}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Last Update Time */}
        {lastUpdate && (
          <Text style={styles.lastUpdate}>Last update: {lastUpdate}</Text>
        )}

        {/* 1. Price Card (Hero - Full Width) */}
        <PriceCard onPress={onPressPriceCard} />

        {/* Responsive Grid - 1 column on phone, 2 columns on tablet */}
        <View style={{ paddingHorizontal: 16 }}>
          <ResponsiveGrid spacing={16}>
            <VolumeCard compact onPress={onPressVolumeCard} />
            <FearGreedCard compact value={fgValue} label={fgLabel} lastUpdated={fgUpdated} onPress={onPressFG} />
            <ATRCard compact onPress={onPressATR} />
            <RSICard compact onPress={onPressRSI} />
            <OrderBookCard compact />
            <MarketDominanceCard compact />
          </ResponsiveGrid>
        </View>

        {/* (Market Metrics removed - API issues) */}

        {/* Footer Info */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data provided by Binance • Free public API
          </Text>
          <Text style={styles.footerText}>
            Showing last {candles.length} candles
          </Text>
        </View>
      </ScrollView>
      )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111827',
  },
  loadingText: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  loadingSubtext: {
    color: '#9CA3AF',
    fontSize: fontSize.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsButton: {
    width: normalize(36),
    height: normalize(36),
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: fontSize.lg,
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: fontSize.xxxl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: fontSize.md,
    fontWeight: '500',
  },
  // Replaced connectionStatus with Badge component
  lastUpdate: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  intervalContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  sectionTitle: {
    color: '#F9FAFB',
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  intervalScroll: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intervalButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    backgroundColor: '#1E222D',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  intervalButtonActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  intervalButtonText: {
    color: '#9CA3AF',
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  intervalButtonTextActive: {
    color: '#FDE68A',
  },
  indicatorsContainer: {
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
  },
  togglesRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    color: '#6B7280',
    fontSize: fontSize.sm,
    textAlign: 'center',
    marginVertical: spacing.xs,
  },
  twoColumnGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    gap: 0,
    marginBottom: spacing.sm,
  },
  gridItem: {
    flex: 1,
  },
  gridRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.sm,
  },
  gridCol: {
    flex: 1,
  },
  multiGridWrapper: {
    paddingHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  gridRowTight: {
    flexDirection: 'row',
    marginHorizontal: spacing.xs,
    marginTop: spacing.xs,
  },
  gridItemTight: {
    flex: 1,
  },
});

export default HomeScreen;
