import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../theme';
import { WalletAddress } from '../types/wallet';
import { AddressForm } from '../components/AddressForm';
import {
  getWalletAddresses,
  addWalletAddress,
  updateWalletAddress,
  deleteWalletAddress,
  searchWalletAddresses,
  exportWalletAddresses,
  importWalletAddresses,
} from '../utils/walletStorage';

// Pre-configured featured addresses (not stored in AsyncStorage)
const FEATURED_ADDRESSES: WalletAddress[] = [
  {
    id: 'featured_1',
    address: '1P5ZEDxoTbHYXiQADe5DKmNKtjjShVQGNq',
    label: 'MicroStrategy',
    type: 'institution',
    notes: 'Corporate Bitcoin treasury holder',
    arkhamsLink: 'https://intel.arkm.com/explorer/entity/microstrategy',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'featured_2',
    address: 'bc1qx9t2l3pyny2spqpqlye8svce70nppwtaxwdrp4',
    label: 'Grayscale Bitcoin Trust',
    type: 'institution',
    notes: 'Large institutional Bitcoin fund',
    arkhamsLink: 'https://intel.arkm.com/explorer/entity/grayscale-bitcoin-trust',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'featured_3',
    address: 'bc1ql49ydapnjafl5t2cp9zqpjwe6pdgmxy98859v2',
    label: 'BlackRock',
    type: 'institution',
    notes: 'BlackRock Bitcoin ETF institutional holdings',
    arkhamsLink: 'https://intel.arkm.com/explorer/entity/blackrock',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'featured_4',
    address: '1NDyJtNTjmwk5xPNhjgAMu4HDHigtobu1s',
    label: 'Binance Cold Wallet',
    type: 'exchange',
    notes: 'Major exchange cold storage',
    arkhamsLink: 'https://intel.arkm.com/explorer/entity/binance',
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'featured_5',
    address: '3Kzh9qAqVWQhEsfQz7zEQL1EuSx5tyNLNS',
    label: 'Bitcoin Whale',
    type: 'whale',
    notes: 'Early Bitcoin adopter whale wallet',
    arkhamsLink: 'https://intel.arkm.com/explorer/address/3Kzh9qAqVWQhEsfQz7zEQL1EuSx5tyNLNS',
    createdAt: 0,
    updatedAt: 0,
  },
];

export default function AddressesScreen() {
  const [customAddresses, setCustomAddresses] = useState<WalletAddress[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<WalletAddress[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<WalletAddress | null>(null);
  const [loading, setLoading] = useState(true);

  // Load addresses when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [])
  );

  // Filter addresses when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      searchWalletAddresses(searchQuery).then(setFilteredAddresses);
    } else {
      setFilteredAddresses(customAddresses);
    }
  }, [searchQuery, customAddresses]);

  const loadAddresses = async () => {
    setLoading(true);
    try {
      const addresses = await getWalletAddresses();
      setCustomAddresses(addresses);
      setFilteredAddresses(addresses);
    } catch (error) {
      console.error('Error loading addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setIsFormVisible(true);
  };

  const handleEditAddress = (address: WalletAddress) => {
    setEditingAddress(address);
    setIsFormVisible(true);
  };

  const handleSaveAddress = async (addressData: Omit<WalletAddress, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingAddress) {
        // Update existing address
        await updateWalletAddress(editingAddress.id, addressData);
      } else {
        // Add new address
        await addWalletAddress(addressData);
      }
      await loadAddresses();
    } catch (error) {
      throw error; // Re-throw to let form handle the error
    }
  };

  const handleDeleteAddress = (address: WalletAddress) => {
    Alert.alert(
      'Delete Address',
      `Are you sure you want to remove "${address.label}" from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteWalletAddress(address.id);
              await loadAddresses();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete address');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      const data = await exportWalletAddresses();
      const jsonString = JSON.stringify(data, null, 2);
      
      await Share.share({
        message: jsonString,
        title: 'Wallet Watchlist Export',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to export addresses');
    }
  };

  const handleOpenArkham = (url?: string) => {
    const finalUrl = url || 'https://intel.arkm.com/';
    Linking.openURL(finalUrl).catch(err => console.error('Failed to open URL:', err));
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'whale':
        return '#3B82F6';
      case 'institution':
        return '#8B5CF6';
      case 'exchange':
        return '#F59E0B';
      case 'custom':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderWalletCard = (wallet: WalletAddress, isFeatured: boolean = false) => (
    <View key={wallet.id} style={styles.walletCard}>
      <TouchableOpacity
        onPress={() => handleOpenArkham(wallet.arkhamsLink)}
        activeOpacity={0.7}
      >
        <View style={styles.walletHeader}>
          <View style={styles.walletInfo}>
            <View style={styles.labelRow}>
              <Text style={styles.walletName}>{wallet.label}</Text>
              {isFeatured && (
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredText}>FEATURED</Text>
                </View>
              )}
            </View>
            <View style={[styles.typeBadge, { backgroundColor: getTypeColor(wallet.type) + '20' }]}>
              <Text style={[styles.typeText, { color: getTypeColor(wallet.type) }]}>
                {wallet.type.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.addressContainer}>
          <Text style={styles.addressLabel}>Address:</Text>
          <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
            {wallet.address}
          </Text>
        </View>
        
        {wallet.notes && (
          <Text style={styles.description}>{wallet.notes}</Text>
        )}
        
        <View style={styles.arkhamBadge}>
          <Text style={styles.arkhamText}>View on Arkham</Text>
        </View>
      </TouchableOpacity>

      {/* Edit/Delete buttons for custom addresses */}
      {!isFeatured && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditAddress(wallet)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteAddress(wallet)}
          >
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>On-Chain Addresses</Text>
          <Text style={styles.subtitle}>Track whale and institutional wallets</Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search addresses..."
            placeholderTextColor="#6B7280"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsRow}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleAddAddress}
          >
            <Text style={styles.primaryButtonText}>+ Add Address</Text>
          </TouchableOpacity>
          
          {customAddresses.length > 0 && (
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleExport}
            >
              <Text style={styles.secondaryButtonText}>Export</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Addresses */}
        {filteredAddresses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {searchQuery ? 'Search Results' : 'My Watchlist'} ({filteredAddresses.length})
            </Text>
            {filteredAddresses.map((wallet) => renderWalletCard(wallet, false))}
          </View>
        )}

        {/* Featured Addresses */}
        {!searchQuery && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Addresses</Text>
            {FEATURED_ADDRESSES.map((wallet) => renderWalletCard(wallet, true))}
          </View>
        )}

        {/* Empty State */}
        {!searchQuery && filteredAddresses.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Custom Addresses Yet</Text>
            <Text style={styles.emptyStateText}>
              Tap "Add Address" to start tracking your own whale and institutional wallets
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Data powered by Arkham Intelligence
          </Text>
        </View>
      </ScrollView>

      {/* Add/Edit Form Modal */}
      <AddressForm
        visible={isFormVisible}
        onClose={() => {
          setIsFormVisible(false);
          setEditingAddress(null);
        }}
        onSave={handleSaveAddress}
        editAddress={editingAddress}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondaryButton: {
    paddingHorizontal: 24,
    backgroundColor: '#374151',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  walletCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  walletInfo: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  walletName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  featuredBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  featuredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FBB424',
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  externalIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  externalIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3B82F6',
  },
  addressContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  addressLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginBottom: 4,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  addressText: {
    fontSize: 14,
    color: colors.textPrimary,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 10,
  },
  arkhamBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  arkhamText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#3B82F6',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  deleteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyState: {
    marginHorizontal: 16,
    marginVertical: 40,
    padding: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#8B5CF6',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
