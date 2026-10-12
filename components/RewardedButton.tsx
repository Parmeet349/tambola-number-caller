import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRewardedAd } from '../utils/hooks/useRewardedAd';
import { useTheme } from '../utils/store/themeState';

export default function RewardedButton() {
  const { show, loading: adLoading } = useRewardedAd();
  const { currentTheme: T } = useTheme();
  const isDark = T.isDark;
  const [processing, setProcessing] = useState(false);

  async function onWatch() {
    Alert.alert(
      '30 Minutes Ad-Free',
      'Watch a quick sponsor video to enjoy 30 minutes of uninterrupted, ad-free play!',
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: 'Watch Video',
          onPress: async () => {
            setProcessing(true);
            try {
              const shown = await show();
              if (!shown) {
                Alert.alert('Loading Video', 'The video is loading. Please try again in a moment.');
              }
            } catch (e) {
              Alert.alert('Notice', 'Could not load video at this time. Please try again later.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  }

  const disabled = adLoading || processing;

  return (
    <TouchableOpacity
      onPress={onWatch}
      disabled={disabled}
      style={[
        styles.btn,
        {
          backgroundColor: disabled ? (isDark ? '#1b1433' : '#f0f0f0') : (isDark ? '#251b40' : '#fff3e0'),
          borderColor: isDark ? '#3c2a63' : '#ffcc80',
          opacity: disabled ? 0.6 : 1,
        },
      ]}
      activeOpacity={0.85}
    >
      {processing || adLoading ? (
        <ActivityIndicator color={T.primary} size="small" />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name="play-circle-outline" size={18} color={isDark ? '#ffb74d' : '#e65100'} />
          <Text style={[styles.btnText, { color: isDark ? '#ffb74d' : '#e65100' }]}>
            Watch Video → 30m Ad-Free
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  btnText: { fontWeight: '800', fontSize: 14 },
});
