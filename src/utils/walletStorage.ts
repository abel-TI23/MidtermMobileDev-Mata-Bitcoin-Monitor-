/**
 * Wallet Storage Service - AsyncStorage operations for wallet addresses
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { WalletAddress, WalletExportData } from '../types/wallet';

const STORAGE_KEY = '@wallet_addresses';
const STORAGE_VERSION = '1.0';

/**
 * Get all wallet addresses from storage
 */
export const getWalletAddresses = async (): Promise<WalletAddress[]> => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading wallet addresses:', error);
    return [];
  }
};

/**
 * Save wallet addresses to storage
 */
export const saveWalletAddresses = async (addresses: WalletAddress[]): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(addresses));
    return true;
  } catch (error) {
    console.error('Error saving wallet addresses:', error);
    return false;
  }
};

/**
 * Add a new wallet address
 */
export const addWalletAddress = async (address: Omit<WalletAddress, 'id' | 'createdAt' | 'updatedAt'>): Promise<WalletAddress | null> => {
  try {
    const addresses = await getWalletAddresses();
    
    // Check for duplicate address
    const exists = addresses.find(w => w.address.toLowerCase() === address.address.toLowerCase());
    if (exists) {
      throw new Error('Address already exists in watchlist');
    }

    const now = Date.now();
    const newAddress: WalletAddress = {
      ...address,
      id: `wallet_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };

    addresses.push(newAddress);
    const success = await saveWalletAddresses(addresses);
    
    return success ? newAddress : null;
  } catch (error) {
    console.error('Error adding wallet address:', error);
    throw error;
  }
};

/**
 * Update an existing wallet address
 */
export const updateWalletAddress = async (id: string, updates: Partial<Omit<WalletAddress, 'id' | 'createdAt'>>): Promise<boolean> => {
  try {
    const addresses = await getWalletAddresses();
    const index = addresses.findIndex(w => w.id === id);
    
    if (index === -1) {
      throw new Error('Wallet address not found');
    }

    addresses[index] = {
      ...addresses[index],
      ...updates,
      updatedAt: Date.now(),
    };

    return await saveWalletAddresses(addresses);
  } catch (error) {
    console.error('Error updating wallet address:', error);
    throw error;
  }
};

/**
 * Delete a wallet address
 */
export const deleteWalletAddress = async (id: string): Promise<boolean> => {
  try {
    const addresses = await getWalletAddresses();
    const filtered = addresses.filter(w => w.id !== id);
    
    if (filtered.length === addresses.length) {
      throw new Error('Wallet address not found');
    }

    return await saveWalletAddresses(filtered);
  } catch (error) {
    console.error('Error deleting wallet address:', error);
    throw error;
  }
};

/**
 * Search wallet addresses by label or address
 */
export const searchWalletAddresses = async (query: string): Promise<WalletAddress[]> => {
  try {
    const addresses = await getWalletAddresses();
    const lowerQuery = query.toLowerCase();
    
    return addresses.filter(w => 
      w.label.toLowerCase().includes(lowerQuery) ||
      w.address.toLowerCase().includes(lowerQuery) ||
      w.notes?.toLowerCase().includes(lowerQuery)
    );
  } catch (error) {
    console.error('Error searching wallet addresses:', error);
    return [];
  }
};

/**
 * Export wallet addresses as JSON
 */
export const exportWalletAddresses = async (): Promise<WalletExportData> => {
  const addresses = await getWalletAddresses();
  
  return {
    version: STORAGE_VERSION,
    exportDate: Date.now(),
    addresses,
  };
};

/**
 * Import wallet addresses from JSON
 */
export const importWalletAddresses = async (data: WalletExportData, merge: boolean = false): Promise<boolean> => {
  try {
    if (data.version !== STORAGE_VERSION) {
      console.warn('Import data version mismatch. Attempting import anyway.');
    }

    let addresses = data.addresses;

    if (merge) {
      const existing = await getWalletAddresses();
      const existingAddresses = new Set(existing.map(w => w.address.toLowerCase()));
      
      // Only add addresses that don't already exist
      const newAddresses = data.addresses.filter(w => !existingAddresses.has(w.address.toLowerCase()));
      addresses = [...existing, ...newAddresses];
    }

    return await saveWalletAddresses(addresses);
  } catch (error) {
    console.error('Error importing wallet addresses:', error);
    throw error;
  }
};

/**
 * Clear all wallet addresses
 */
export const clearWalletAddresses = async (): Promise<boolean> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing wallet addresses:', error);
    return false;
  }
};
