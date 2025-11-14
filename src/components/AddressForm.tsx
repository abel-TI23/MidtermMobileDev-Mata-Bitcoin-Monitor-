/**
 * AddressForm - Modal form for adding/editing wallet addresses
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../theme';
import { WalletAddress, WalletType } from '../types/wallet';

interface AddressFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (address: Omit<WalletAddress, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editAddress?: WalletAddress | null;
}

const WALLET_TYPES: { value: WalletType; label: string }[] = [
  { value: 'whale', label: 'Whale' },
  { value: 'institution', label: 'Institution' },
  { value: 'exchange', label: 'Exchange' },
  { value: 'custom', label: 'Custom' },
];

export function AddressForm({ visible, onClose, onSave, editAddress }: AddressFormProps) {
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [type, setType] = useState<WalletType>('custom');
  const [notes, setNotes] = useState('');
  const [arkhamsLink, setArkhamsLink] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens/closes or editAddress changes
  useEffect(() => {
    if (visible) {
      if (editAddress) {
        setAddress(editAddress.address);
        setLabel(editAddress.label);
        setType(editAddress.type);
        setNotes(editAddress.notes || '');
        setArkhamsLink(editAddress.arkhamsLink || '');
      } else {
        resetForm();
      }
    }
  }, [visible, editAddress]);

  const resetForm = () => {
    setAddress('');
    setLabel('');
    setType('custom');
    setNotes('');
    setArkhamsLink('');
  };

  const handleSave = async () => {
    // Validation
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter a wallet address');
      return;
    }

    if (!label.trim()) {
      Alert.alert('Error', 'Please enter a label for this address');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        address: address.trim(),
        label: label.trim(),
        type,
        notes: notes.trim() || undefined,
        arkhamsLink: arkhamsLink.trim() || undefined,
      });

      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {editAddress ? 'Edit Address' : 'Add New Address'}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Address Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Wallet Address *</Text>
              <TextInput
                style={styles.input}
                placeholder="0x... or bc1..."
                placeholderTextColor="#6B7280"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!editAddress} // Don't allow editing address on update
              />
              {editAddress && (
                <Text style={styles.hint}>Address cannot be changed after creation</Text>
              )}
            </View>

            {/* Label Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Label *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., MicroStrategy, Whale #1"
                placeholderTextColor="#6B7280"
                value={label}
                onChangeText={setLabel}
              />
            </View>

            {/* Type Selection */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Type *</Text>
              <View style={styles.typeContainer}>
                {WALLET_TYPES.map((walletType) => (
                  <TouchableOpacity
                    key={walletType.value}
                    style={[
                      styles.typeButton,
                      type === walletType.value && styles.typeButtonActive,
                    ]}
                    onPress={() => setType(walletType.value)}
                  >
                    <Text
                      style={[
                        styles.typeButtonText,
                        type === walletType.value && styles.typeButtonTextActive,
                      ]}
                    >
                      {walletType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add any notes about this address..."
                placeholderTextColor="#6B7280"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Arkham Link Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Arkham Intelligence Link (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="https://platform.arkhamintelligence.com/..."
                placeholderTextColor="#6B7280"
                value={arkhamsLink}
                onChangeText={setArkhamsLink}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={saving}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Saving...' : editAddress ? 'Update' : 'Add Address'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.textMuted,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  typeButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#374151',
  },
  saveButton: {
    backgroundColor: '#3B82F6',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
