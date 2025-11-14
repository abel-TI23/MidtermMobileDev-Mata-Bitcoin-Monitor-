/**
 * Settings Types
 */

export type ThemeMode = 'dark' | 'light';
export type TimeframeOption = '1m' | '5m' | '15m' | '1h' | '4h' | 'D' | 'W';
export type PollingInterval = 5000 | 10000 | 30000 | 60000; // milliseconds

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  enabled: boolean;
  createdAt: number;
  triggeredAt?: number;
}

export interface AppSettings {
  theme: ThemeMode;
  defaultTimeframe: TimeframeOption;
  pollingInterval: PollingInterval;
  offlineMode: boolean;
  priceAlerts: PriceAlert[];
  notificationsEnabled: boolean;
  soundEnabled: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  defaultTimeframe: '1h',
  pollingInterval: 30000,
  offlineMode: false,
  priceAlerts: [],
  notificationsEnabled: true,
  soundEnabled: true,
};
