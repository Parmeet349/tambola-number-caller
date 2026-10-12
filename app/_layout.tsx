// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import 'react-native-reanimated';

import { initAds } from '../components/ads/admob';
import { attachAppOpenAppStateListener, initAppOpenAds, maybeShowAppOpenAd } from '../components/ads/appOpenManager';
import AnimatedSplashScreen from '../components/screens/AnimatedSplashScreen';

import { AdStateProvider } from '../utils/store/adState';
import { ThemeProvider as AppThemeProvider, useTheme } from '../utils/store/themeState';

import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootContent() {
  const colorScheme = useColorScheme();
  const { currentTheme } = useTheme();
  const [splashFinished, setSplashFinished] = useState(false);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AdStateProvider>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          {!splashFinished && (
            <AnimatedSplashScreen
              accent={currentTheme.primary}
              onFinish={() => setSplashFinished(true)}
            />
          )}
        </View>
      </AdStateProvider>
      <StatusBar style={!splashFinished ? 'light' : 'auto'} />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  useEffect(() => {
    (async () => {
      try {
        // 1) Init AdMob BEFORE loading any ads
        await initAds();
        console.log('Ad SDK initialized');

        // 2) Now init app-open ads
        console.log('Initializing app open ads');
        await initAppOpenAds();
        console.log('App open ads initialized');

        // 3) Show app open ad after 10s initial grace period
        setTimeout(() => {
          maybeShowAppOpenAd();
        }, 10_000);

        // 4) Attach foreground listener with ad-free state check
        attachAppOpenAppStateListener(() => {
          try {
            return false;
          } catch {
            return false;
          }
        });
        console.log('App open ad state listener attached');
      } catch (e) {
        console.warn('Root init failed', e);
      }
    })();
  }, []);

  return (
    <AppThemeProvider>
      <RootContent />
    </AppThemeProvider>
  );
}
