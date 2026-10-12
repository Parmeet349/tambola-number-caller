// components/PurchaseButton.tsx
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ProModal from './ProModal';
import { useAdState } from '../utils/store/adState';
import { useTheme } from '../utils/store/themeState';

export default function PurchaseButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const { isPro } = useAdState();
  const { currentTheme: T } = useTheme();
  const isDark = T.isDark;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: isPro
              ? (isDark ? '#1e382b' : '#e8f5e9')
              : '#ff9800',
            borderColor: isPro ? '#4caf50' : '#e65100',
          },
        ]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.85}
      >
        <MaterialIcons
          name={isPro ? 'verified' : 'workspace-premium'}
          size={16}
          color={isPro ? '#4caf50' : '#fff'}
        />
        <Text
          style={[
            styles.buttonText,
            { color: isPro ? (isDark ? '#81c784' : '#2e7d32') : '#fff' },
          ]}
        >
          {isPro ? 'Lifetime Pro Active' : 'Remove Ads Forever'}
        </Text>
      </TouchableOpacity>
      <ProModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', width: '100%' },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    width: '100%',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
