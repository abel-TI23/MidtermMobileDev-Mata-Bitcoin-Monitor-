/**
 * Settings Storage Service - AsyncStorage operations for app settings
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, PriceAlert, DEFAULT_SETTINGS } from '../types/settings';

const SETTINGS_KEY = '@app_settings';

/**
 * Get app settings from storage
 */
export const getSettings = async (): Promise<AppSettings> => {
  try {
    const data = await AsyncStorage.getItem(SETTINGS_KEY);
    if (data) {
      const settings = JSON.parse(data);
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_SETTINGS, ...settings };
    }
    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS;
  }
};

/**
 * Save app settings to storage
 */
export const saveSettings = async (settings: AppSettings): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
};

/**
 * Update specific setting
 */
export const updateSetting = async <K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<boolean> => {
  try {
    const settings = await getSettings();
    settings[key] = value;
    return await saveSettings(settings);
  } catch (error) {
    console.error('Error updating setting:', error);
    return false;
  }
};

/**
 * Reset settings to defaults
 */
export const resetSettings = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch (error) {
    console.error('Error resetting settings:', error);
    return false;
  }
};

/**
 * Get all price alerts
 */
export const getPriceAlerts = async (): Promise<PriceAlert[]> => {
  const settings = await getSettings();
  return settings.priceAlerts;
};

/**
 * Add a price alert
 */
export const addPriceAlert = async (alert: Omit<PriceAlert, 'id' | 'createdAt'>): Promise<PriceAlert | null> => {
  try {
    const settings = await getSettings();
    
    const now = Date.now();
    const newAlert: PriceAlert = {
      ...alert,
      id: `alert_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
    };

    settings.priceAlerts.push(newAlert);
    const success = await saveSettings(settings);
    
    return success ? newAlert : null;
  } catch (error) {
    console.error('Error adding price alert:', error);
    return null;
  }
};

/**
 * Update a price alert
 */
export const updatePriceAlert = async (
  id: string,
  updates: Partial<Omit<PriceAlert, 'id' | 'createdAt'>>
): Promise<boolean> => {
  try {
    const settings = await getSettings();
    const index = settings.priceAlerts.findIndex(a => a.id === id);
    
    if (index === -1) {
      throw new Error('Price alert not found');
    }

    settings.priceAlerts[index] = {
      ...settings.priceAlerts[index],
      ...updates,
    };

    return await saveSettings(settings);
  } catch (error) {
    console.error('Error updating price alert:', error);
    return false;
  }
};

/**
 * Delete a price alert
 */
export const deletePriceAlert = async (id: string): Promise<boolean> => {
  try {
    const settings = await getSettings();
    const filtered = settings.priceAlerts.filter(a => a.id !== id);
    
    if (filtered.length === settings.priceAlerts.length) {
      throw new Error('Price alert not found');
    }

    settings.priceAlerts = filtered;
    return await saveSettings(settings);
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return false;
  }
};

/**
 * Clear all cache data
 */
export const clearAllCache = async (): Promise<boolean> => {
  try {
    // Get all keys
    const keys = await AsyncStorage.getAllKeys();
    
    // Filter out settings key to preserve user preferences
    const cacheKeys = keys.filter(key => key !== SETTINGS_KEY && key !== '@wallet_addresses');
    
    if (cacheKeys.length > 0) {
      await AsyncStorage.multiRemove(cacheKeys);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
};

/**
 * Get storage usage info
 */
export const getStorageInfo = async (): Promise<{ keys: number; size: string }> => {
  try {
    const keys = await AsyncStorage.getAllKeys();
    
    // Rough estimate of storage size
    let totalSize = 0;
    for (const key of keys) {
      const value = await AsyncStorage.getItem(key);
      if (value) {
        totalSize += value.length;
      }
    }
    
    // Convert to readable format
    const sizeKB = (totalSize / 1024).toFixed(2);
    
    return {
      keys: keys.length,
      size: `${sizeKB} KB`,
    };
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { keys: 0, size: '0 KB' };
  }
};
