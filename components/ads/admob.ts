// components/ads/admob.ts
import { Platform } from 'react-native';
import mobileAds, { MaxAdContentRating, TestIds } from 'react-native-google-mobile-ads';

// init function - call once on app start (App.tsx or index)
export function initAds() {
  // configure request behavior and then initialize
  return mobileAds()
    .setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.PG,
      tagForChildDirectedTreatment: false,
      tagForUnderAgeOfConsent: false,
    })
    .then(() => mobileAds().initialize());
}

// Export test IDs (use only for development)
export const TEST_IDS = {
  BANNER: TestIds.BANNER,
  INTERSTITIAL: TestIds.INTERSTITIAL,
  REWARDED: TestIds.REWARDED,
  APP_OPEN: TestIds.APP_OPEN,
};


const REAL_PROD_IDS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-1373723692607134/1178550334',
    android: 'ca-app-pub-1373723692607134/9597257218',
  }),
  APP_OPEN: Platform.select({
    ios: 'ca-app-pub-1373723692607134/8969410448',
    android: 'ca-app-pub-1373723692607134/5702165651',
  }),
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-1373723692607134/5030165439',
    android: 'ca-app-pub-1373723692607134/4580734256',
  }),
  REWARDED: Platform.select({
    ios: 'ca-app-pub-1373723692607134/2404002096',
    android: 'ca-app-pub-1373723692607134/9020217302',
  }),
};

export const PROD_IDS = __DEV__ ? TEST_IDS : REAL_PROD_IDS;