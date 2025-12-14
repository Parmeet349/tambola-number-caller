// components/ads/Banner.jsx
import { StyleSheet, View } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
// import { TEST_IDS, PROD_IDS } from './admob';
import { PROD_IDS } from './admob';

// Get device 

// export default function Banner({ unitId = TEST_IDS.BANNER }) {
export default function Banner({ unitId = PROD_IDS.BANNER }) {
  return (
    <View style={styles.wrapper}>
      <BannerAd
        unitId={unitId}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdLoaded={() => console.log('Banner loaded')}
        onAdFailedToLoad={(err) => console.warn('Banner failed', err)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'transparent',
  },
});
