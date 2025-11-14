import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { colors } from '../theme';

interface CenterModalProps {
  visible: boolean;
  title?: string;
  message?: string;
  onClose?: () => void;
  primaryActionLabel?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

const CenterModal: React.FC<CenterModalProps> = ({
  visible,
  title = 'Info',
  message = '',
  onClose,
  primaryActionLabel = 'OK',
  onPrimaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => {
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 160, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, useNativeDriver: true, friction: 7 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 0.9, duration: 120, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity }]}> 
        <Pressable style={styles.backdropTouchable} onPress={onClose} />
        <Animated.View style={[styles.card, { transform: [{ scale }] }]}> 
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actionsRow}>
            {secondaryActionLabel && (
              <Pressable
                style={({ pressed }) => [styles.secondaryBtn, pressed && styles.btnPressed]}
                onPress={onSecondaryAction}
              >
                <Text style={styles.secondaryText}>{secondaryActionLabel}</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [styles.primaryBtn, pressed && styles.btnPressed]}
              onPress={onPrimaryAction || onClose}
            >
              <Text style={styles.primaryText}>{primaryActionLabel}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#374151',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: '#E5E7EB',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 20,
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
  },
  primaryText: { color: '#0F172A', fontWeight: '700', fontSize: 14 },
  secondaryBtn: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  secondaryText: { color: '#F9FAFB', fontWeight: '600', fontSize: 14 },
  btnPressed: { opacity: 0.85 },
});

export default CenterModal;
