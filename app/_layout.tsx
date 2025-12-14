// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { initAds } from '../components/ads/admob';
import { attachAppOpenAppStateListener, initAppOpenAds, maybeShowAppOpenAd } from '../components/ads/appOpenManager';

import { AdStateProvider } from '../utils/store/adState';



import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  // useEffect(() => {
  //   initAds().then(() => console.log('Ad SDK initialized'));
  // }, []);
  // useEffect(() => {
  //   initPurchases().catch(() => { });
  //   // initAds().catch(() => {}); // your ad sdk init
  //   initAds().then(() => console.log('Ad SDK initialized'));
  // }, []);

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

        // 3) Test show AFTER 25s (or remove the 20s guard while testing)
        setTimeout(() => {
          maybeShowAppOpenAd();
        }, 10_000);

        attachAppOpenAppStateListener();
        console.log('App open ad state listener attached');
      } catch (e) {
        console.warn('Root init failed', e);
      }
    })();
  }, []);



  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AdStateProvider>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
      </AdStateProvider>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
