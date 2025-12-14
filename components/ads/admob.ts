// components/ads/admob.ts
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

// export const PROD_IDS = {
//   BANNER: 'ca-app-pub-1373723692607134/9597257218',
//   INTERSTITIAL: 'ca-app-pub-1373723692607134/4580734256',
//   REWARDED: 'ca-app-pub-1373723692607134/9020217302',
//   APP_OPEN: 'ca-app-pub-1373723692607134/5702165651', // your real app open unit
// };

export const PROD_IDS = {
  BANNER: process.env.BANNER,
  INTERSTITIAL: process.env.INTERSTITIAL,
  REWARDED: process.env.REWARDED,
  APP_OPEN: process.env.APP_OPEN,
};

