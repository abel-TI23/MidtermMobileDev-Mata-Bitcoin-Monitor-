/**
 * PriceAlertForm - Modal form for adding/editing price alerts
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { colors } from '../theme';
import { PriceAlert } from '../types/settings';

interface PriceAlertFormProps {
  visible: boolean;
  onClose: () => void;
  onSave: (alert: Omit<PriceAlert, 'id' | 'createdAt'>) => Promise<void>;
  editAlert?: PriceAlert | null;
}

export function PriceAlertForm({ visible, onClose, onSave, editAlert }: PriceAlertFormProps) {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      if (editAlert) {
        setSymbol(editAlert.symbol);
        setTargetPrice(editAlert.targetPrice.toString());
        setCondition(editAlert.condition);
      } else {
        resetForm();
      }
    }
  }, [visible, editAlert]);

  const resetForm = () => {
    setSymbol('BTCUSDT');
    setTargetPrice('');
    setCondition('above');
  };

  const handleSave = async () => {
    const price = parseFloat(targetPrice);
    
    if (!symbol.trim()) {
      Alert.alert('Error', 'Please enter a symbol');
      return;
    }

    if (isNaN(price) || price <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    setSaving(true);

    try {
      await onSave({
        symbol: symbol.trim().toUpperCase(),
        targetPrice: price,
        condition,
        enabled: true,
      });

      resetForm();
      onClose();
    } catch (error) {
      Alert.alert('Error', 'Failed to save alert');
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
              {editAlert ? 'Edit Alert' : 'New Price Alert'}
            </Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Symbol Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Symbol</Text>
            <TextInput
              style={styles.input}
              placeholder="BTCUSDT"
              placeholderTextColor="#6B7280"
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
            />
          </View>

          {/* Condition Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alert When Price</Text>
            <View style={styles.conditionContainer}>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  condition === 'above' && styles.conditionButtonActive,
                ]}
                onPress={() => setCondition('above')}
              >
                <Text
                  style={[
                    styles.conditionText,
                    condition === 'above' && styles.conditionTextActive,
                  ]}
                >
                  Goes Above
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.conditionButton,
                  condition === 'below' && styles.conditionButtonActive,
                ]}
                onPress={() => setCondition('below')}
              >
                <Text
                  style={[
                    styles.conditionText,
                    condition === 'below' && styles.conditionTextActive,
                  ]}
                >
                  Goes Below
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Price Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Price (USD)</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              placeholderTextColor="#6B7280"
              value={targetPrice}
              onChangeText={setTargetPrice}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Preview */}
          {targetPrice && !isNaN(parseFloat(targetPrice)) && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Alert Preview</Text>
              <Text style={styles.previewText}>
                Notify me when <Text style={styles.previewSymbol}>{symbol}</Text> {' '}
                {condition === 'above' ? 'goes above' : 'drops below'} {' '}
                <Text style={styles.previewPrice}>${parseFloat(targetPrice).toLocaleString()}</Text>
              </Text>
            </View>
          )}

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
                {saving ? 'Saving...' : editAlert ? 'Update' : 'Create Alert'}
              </Text>
            </TouchableOpacity>
          </View>
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
  conditionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  conditionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  conditionButtonActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  conditionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  conditionTextActive: {
    color: '#FFFFFF',
  },
  previewCard: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  previewTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  previewText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  previewSymbol: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  previewPrice: {
    fontWeight: '800',
    color: '#3B82F6',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
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
