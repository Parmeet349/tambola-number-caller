// src/components/RewardedButton.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { useRewardedAd } from '../utils/hooks/useRewardedAd';
import { useTheme } from '../utils/store/themeState';

export default function RewardedButton() {
  const { loaded, show, loading: adLoading } = useRewardedAd();
  const { currentTheme } = useTheme();
  const [processing, setProcessing] = useState(false);

  async function onWatch() {
    setProcessing(true);
    try {
      const shown = await show();
      if (!shown) {
        Alert.alert('Ad not ready', 'Please try again later.');
      }
    } catch (e) {
      console.warn('Error showing rewarded ad', e);
      Alert.alert('Ad error', 'Something went wrong while showing ad.');
    } finally {
      setProcessing(false);
    }
  }

  const disabled = !loaded || adLoading || processing;

  const label = (() => {
    if (processing || adLoading) return 'Loading Ad...';
    if (loaded) return '🎬 Watch Ad → 30 min Ad-Free';
    return 'Ad not ready';
  })();

  return (
    <TouchableOpacity
      onPress={onWatch}
      disabled={disabled}
      style={{
        backgroundColor: disabled
          ? (currentTheme.isDark ? '#1b1433' : '#e0e0e0')
          : currentTheme.primary,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {processing || adLoading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={{ fontWeight: '800', color: '#fff', fontSize: 14 }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
