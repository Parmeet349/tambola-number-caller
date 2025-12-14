// src/components/RewardedButton.tsx
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity } from 'react-native';
import { useRewardedAd } from '../utils/hooks/useRewardedAd';

export default function RewardedButton() {
  const { loaded, show, loading: adLoading } = useRewardedAd();
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
    if (loaded) return 'Watch Ad and go 30 minutes Ad-Free';
    return 'Ad not ready';
  })();

  return (
    <TouchableOpacity
      onPress={onWatch}
      disabled={disabled}
      style={{
        backgroundColor: disabled ? '#ddd' : '#1e88e5',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
      }}
    >
      {processing || adLoading ? (
        <ActivityIndicator />
      ) : (
        <Text style={{ fontWeight: '700', color:'white' }}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}
