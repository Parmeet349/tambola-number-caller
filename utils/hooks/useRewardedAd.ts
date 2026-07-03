// src/utils/hooks/useRewardedAd.ts
import { useEffect, useState } from 'react';
import {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';
import { PROD_IDS } from '../../components/ads/admob';
import { useAdState } from '../store/adState';

// Global Singleton State
let rewardedAd: RewardedAd | null = null;
let isLoaded = false;
let isLoading = false;
const listeners = new Set<(loaded: boolean, loading: boolean) => void>();

function notifyListeners() {
  listeners.forEach((l) => l(isLoaded, isLoading));
}

function setupAd(unitId: string) {
  if (rewardedAd) return;

  rewardedAd = RewardedAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  rewardedAd.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log('[Rewarded Singleton] LOADED');
    isLoaded = true;
    isLoading = false;
    notifyListeners();
  });

  rewardedAd.addAdEventListener(AdEventType.ERROR, (err) => {
    console.warn('[Rewarded Singleton] ERROR', err);
    isLoaded = false;
    isLoading = false;
    notifyListeners();

    // Auto-retry loading the ad after 15 seconds to prevent being stuck
    setTimeout(() => {
      console.log('[Rewarded Singleton] Retrying load after error...');
      loadAd();
    }, 15000);
  });

  rewardedAd.addAdEventListener(AdEventType.CLOSED, () => {
    console.log('[Rewarded Singleton] CLOSED – reloading');
    isLoaded = false;
    notifyListeners();
    loadAd();
  });
}

function loadAd() {
  if (!rewardedAd) return;
  if (isLoaded || isLoading) return;

  try {
    console.log('[Rewarded Singleton] Calling load()');
    isLoading = true;
    notifyListeners();
    rewardedAd.load();
  } catch (e) {
    console.warn('[Rewarded Singleton] load() threw', e);
    isLoading = false;
    notifyListeners();
  }
}

export function useRewardedAd(unitId = PROD_IDS.REWARDED) {
  const { setAdFreeForHours } = useAdState();

  // 1. Setup global instance if needed
  if (!rewardedAd) {
    setupAd(unitId);
  }

  // 2. Local state
  const [loaded, setLoaded] = useState(isLoaded);
  const [loading, setLoading] = useState(isLoading);

  // 3. Subscribe to global state
  useEffect(() => {
    const handler = (l: boolean, lng: boolean) => {
      setLoaded(l);
      setLoading(lng);
    };
    listeners.add(handler);

    // Initial load check
    loadAd();

    return () => {
      listeners.delete(handler);
    };
  }, [unitId]);

  // 4. Handle Reward Earned (Specific to this component/context usage)
  useEffect(() => {
    if (!rewardedAd) return;
    const unsubEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      (reward) => {
        console.log('[Rewarded] EARNED_REWARD', reward);
        setAdFreeForHours(0.5); // 0.5 hours = 30 minutes
      }
    );
    return () => {
      unsubEarned();
    };
  }, [setAdFreeForHours]);


  async function show() {
    if (!rewardedAd) return false;
    if (!loaded) {
      console.log('[Rewarded] show() called but ad not loaded');
      loadAd();
      return false;
    }

    try {
      console.log('[Rewarded] Showing ad');
      await rewardedAd.show();
      return true;
    } catch (e) {
      console.warn('[Rewarded] show() failed', e);
      return false;
    }
  }

  return { loaded, loading, show };
}
