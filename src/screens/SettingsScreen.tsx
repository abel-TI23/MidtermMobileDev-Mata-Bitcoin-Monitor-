/**
 * SettingsScreen - App settings and preferences management
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { AppSettings, PriceAlert, TimeframeOption, PollingInterval } from '../types/settings';
import { PriceAlertForm } from '../components/PriceAlertForm';
import {
  getSettings,
  updateSetting,
  resetSettings,
  getPriceAlerts,
  addPriceAlert,
  updatePriceAlert,
  deletePriceAlert,
  clearAllCache,
  getStorageInfo,
} from '../utils/settingsStorage';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([]);
  const [isAlertFormVisible, setIsAlertFormVisible] = useState(false);
  const [editingAlert, setEditingAlert] = useState<PriceAlert | null>(null);
  const [storageInfo, setStorageInfo] = useState({ keys: 0, size: '0 KB' });

  useFocusEffect(
    useCallback(() => {
      loadSettings();
      loadStorageInfo();
    }, [])
  );

  const loadSettings = async () => {
    const data = await getSettings();
    setSettings(data);
    setPriceAlerts(data.priceAlerts);
  };

  const loadStorageInfo = async () => {
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const handleToggleSetting = async (key: keyof AppSettings, value: boolean) => {
    await updateSetting(key, value);
    await loadSettings();
  };

  const handleUpdateTimeframe = async (timeframe: TimeframeOption) => {
    await updateSetting('defaultTimeframe', timeframe);
    await loadSettings();
  };

  const handleUpdatePollingInterval = async (interval: PollingInterval) => {
    await updateSetting('pollingInterval', interval);
    await loadSettings();
  };

  const handleAddAlert = () => {
    setEditingAlert(null);
    setIsAlertFormVisible(true);
  };

  const handleSaveAlert = async (alertData: Omit<PriceAlert, 'id' | 'createdAt'>) => {
    try {
      if (editingAlert) {
        await updatePriceAlert(editingAlert.id, alertData);
      } else {
        await addPriceAlert(alertData);
      }
      await loadSettings();
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteAlert = (alert: PriceAlert) => {
    Alert.alert(
      'Delete Alert',
      `Remove alert for ${alert.symbol} at $${alert.targetPrice.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePriceAlert(alert.id);
            await loadSettings();
          },
        },
      ]
    );
  };

  const handleToggleAlert = async (alert: PriceAlert) => {
    await updatePriceAlert(alert.id, { enabled: !alert.enabled });
    await loadSettings();
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data but preserve your settings and watchlist. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            const success = await clearAllCache();
            if (success) {
              Alert.alert('Success', 'Cache cleared successfully');
              await loadStorageInfo();
            } else {
              Alert.alert('Error', 'Failed to clear cache');
            }
          },
        },
      ]
    );
  };

  const handleResetSettings = () => {
    Alert.alert(
      'Reset Settings',
      'This will reset all settings to defaults. Price alerts and watchlist will be preserved. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const alerts = await getPriceAlerts();
            await resetSettings();
            await loadSettings();
            // Restore alerts
            for (const alert of alerts) {
              await addPriceAlert(alert);
            }
            Alert.alert('Success', 'Settings reset to defaults');
          },
        },
      ]
    );
  };

  if (!settings) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.loadingText}>Loading settings...</Text>
      </SafeAreaView>
    );
  }

  const TIMEFRAME_OPTIONS: TimeframeOption[] = ['1m', '5m', '15m', '1h', '4h', 'D', 'W'];
  const POLLING_OPTIONS: { label: string; value: PollingInterval }[] = [
    { label: '5 seconds', value: 5000 },
    { label: '10 seconds', value: 10000 },
    { label: '30 seconds', value: 30000 },
    { label: '1 minute', value: 60000 },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your experience</Text>
        </View>

        {/* Theme Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Dark Theme</Text>
                <Text style={styles.settingDescription}>
                  {settings.theme === 'dark' ? 'Enabled' : 'Light mode (coming soon)'}
                </Text>
              </View>
              <Switch
                value={settings.theme === 'dark'}
                onValueChange={(value) => handleToggleSetting('theme', value ? 'dark' : 'light' as any)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
                disabled={true} // Disable until light theme is implemented
              />
            </View>
          </View>
        </View>

        {/* Chart Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chart Preferences</Text>
          
          <View style={styles.settingCard}>
            <Text style={styles.settingLabel}>Default Timeframe</Text>
            <View style={styles.chipContainer}>
              {TIMEFRAME_OPTIONS.map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.chip,
                    settings.defaultTimeframe === tf && styles.chipActive,
                  ]}
                  onPress={() => handleUpdateTimeframe(tf)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.defaultTimeframe === tf && styles.chipTextActive,
                    ]}
                  >
                    {tf}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={[styles.settingCard, { marginTop: 12 }]}>
            <Text style={styles.settingLabel}>Data Refresh Rate</Text>
            <View style={styles.chipContainer}>
              {POLLING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.chip,
                    settings.pollingInterval === option.value && styles.chipActive,
                  ]}
                  onPress={() => handleUpdatePollingInterval(option.value)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      settings.pollingInterval === option.value && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Price Alerts */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Price Alerts</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAlert}>
              <Text style={styles.addButtonText}>+ Add</Text>
            </TouchableOpacity>
          </View>

          {priceAlerts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No price alerts set</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "Add" to create your first alert
              </Text>
            </View>
          ) : (
            priceAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertSymbol}>{alert.symbol}</Text>
                    <Text style={styles.alertCondition}>
                      {alert.condition === 'above' ? '↑' : '↓'} ${alert.targetPrice.toLocaleString()}
                    </Text>
                  </View>
                  <Switch
                    value={alert.enabled}
                    onValueChange={() => handleToggleAlert(alert)}
                    trackColor={{ false: '#374151', true: '#3B82F6' }}
                    thumbColor={'#FFFFFF'}
                  />
                </View>
                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={styles.alertDeleteButton}
                    onPress={() => handleDeleteAlert(alert)}
                  >
                    <Text style={styles.alertDeleteText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Push Notifications</Text>
                <Text style={styles.settingDescription}>
                  Receive alerts when price targets are hit
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => handleToggleSetting('notificationsEnabled', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { marginTop: 12 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Sound Alerts</Text>
                <Text style={styles.settingDescription}>
                  Play sound when alerts trigger
                </Text>
              </View>
              <Switch
                value={settings.soundEnabled}
                onValueChange={(value) => handleToggleSetting('soundEnabled', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* Data & Storage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Storage</Text>
          
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Offline Mode</Text>
                <Text style={styles.settingDescription}>
                  Use cached data when offline
                </Text>
              </View>
              <Switch
                value={settings.offlineMode}
                onValueChange={(value) => handleToggleSetting('offlineMode', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>

          <View style={[styles.settingCard, { marginTop: 12 }]}>
            <View style={styles.storageInfo}>
              <Text style={styles.settingLabel}>Storage Usage</Text>
              <Text style={styles.storageText}>
                {storageInfo.keys} items • {storageInfo.size}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClearCache}
            >
              <Text style={styles.actionButtonText}>Clear Cache</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Advanced */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Advanced</Text>
          
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={handleResetSettings}
          >
            <Text style={styles.dangerButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mata v1.0.0 • Made with ❤️ for crypto traders
          </Text>
        </View>
      </ScrollView>

      {/* Price Alert Form */}
      <PriceAlertForm
        visible={isAlertFormVisible}
        onClose={() => {
          setIsAlertFormVisible(false);
          setEditingAlert(null);
        }}
        onSave={handleSaveAlert}
        editAlert={editingAlert}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
  },
  header: {
    padding: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  settingCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  emptyStateText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: colors.textMuted,
  },
  alertCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertInfo: {
    flex: 1,
  },
  alertSymbol: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  alertCondition: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '600',
  },
  alertActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 10,
  },
  alertDeleteButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  alertDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  storageInfo: {
    marginBottom: 12,
  },
  storageText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 4,
  },
  actionButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dangerButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#EF4444',
  },
  footer: {
    padding: 20,
    paddingTop: 8,
    marginBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
