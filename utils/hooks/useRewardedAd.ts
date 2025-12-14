// src/utils/hooks/useRewardedAd.ts (or wherever you keep it)
import { useEffect, useRef, useState } from 'react';
import {
  AdEventType,
  RewardedAdEventType,
  RewardedInterstitialAd,
} from 'react-native-google-mobile-ads';
// import { TEST_IDS, PROD_IDS } from '../../components/ads/admob';
import { PROD_IDS } from '../../components/ads/admob';
import { useAdState } from '../store/adState';

// export function useRewardedAd(unitId = TEST_IDS.REWARDED) {
export function useRewardedAd(unitId = PROD_IDS.REWARDED) {
  const rewardedRef = useRef(
    RewardedInterstitialAd.createForAdRequest(unitId, {
      requestNonPersonalizedAdsOnly: true,
    })
  );
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setAdFreeForHours } = useAdState();

  useEffect(() => {
    const rewarded = rewardedRef.current;
    if (!rewarded) return;

    const unsubLoad = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        console.log('[Rewarded] LOADED');
        setLoaded(true);
        setLoading(false); // ✅ stop loading
      }
    );

    const unsubError = rewarded.addAdEventListener(
      AdEventType.ERROR,
      (err) => {
        console.warn('[Rewarded] ERROR', err);
        setLoaded(false);
        setLoading(false); // ✅ stop loading
      }
    );

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('[Rewarded] EARNED_REWARD', reward);
        setAdFreeForHours(0.5); // 0.5 hours = 30 minutes
      }
    );

    const unsubClosed = rewarded.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        console.log('[Rewarded] CLOSED – reloading');
        setLoaded(false);
        setLoading(true);  // ✅ we’re loading a new ad
        rewarded.load();
      }
    );

    setLoading(true);
    try {
      console.log('[Rewarded] Calling load()');
      rewarded.load();
    } catch (e) {
      console.warn('[Rewarded] load() threw', e);
      setLoading(false);
    }

    return () => {
      console.log('[Rewarded] Cleanup listeners');
      unsubLoad();
      unsubError();
      unsubEarned();
      unsubClosed();
    };
  }, [unitId, setAdFreeForHours]);

  async function show() {
    const rewarded = rewardedRef.current;
    if (!rewarded) {
      console.warn('[Rewarded] show() called but ref is null');
      return false;
    }

    if (!loaded) {
      console.log('[Rewarded] show() called but ad not loaded');
      return false;
    }

    try {
      console.log('[Rewarded] Showing ad');
      await rewarded.show();
      return true;
    } catch (e) {
      console.warn('[Rewarded] show() failed', e);
      return false;
    }
  }

  return { loaded, loading, show };
}
