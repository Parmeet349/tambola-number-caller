// components/ads/Interstitial.jsx
import { useEffect, useState } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
import { PROD_IDS } from './admob';

// Global singleton instance
let interstitialAd = null;
let isLoaded = false;
let isLoading = false;
const listeners = new Set();

function notifyListeners() {
  listeners.forEach((l) => l(isLoaded));
}

function setupAd(unitId) {
  if (interstitialAd) return; // already setup

  interstitialAd = InterstitialAd.createForAdRequest(unitId, {
    requestNonPersonalizedAdsOnly: true,
  });

  // Event Listeners
  interstitialAd.addAdEventListener(AdEventType.LOADED, () => {
    isLoaded = true;
    isLoading = false;
    notifyListeners();
  });

  interstitialAd.addAdEventListener(AdEventType.ERROR, (error) => {
    console.warn('Interstitial error', error);
    isLoaded = false;
    isLoading = false;
    notifyListeners();
  });

  interstitialAd.addAdEventListener(AdEventType.CLOSED, () => {
    isLoaded = false;
    notifyListeners();
    loadAd(); // Reload immediately after closing
  });
}

function loadAd() {
  if (!interstitialAd) return;
  if (isLoaded || isLoading) return;

  try {
    isLoading = true;
    interstitialAd.load();
  } catch (error) {
    console.warn('Interstitial load failed', error);
    isLoading = false;
  }
}

/**
 * Hook to manage an interstitial ad (Singleton Version)
 * Usage:
 * const { loaded, show } = useInterstitial();
 */
export function useInterstitial(unitId = PROD_IDS.INTERSTITIAL) {
  // 1. Setup global instance if needed
  if (!interstitialAd) {
    setupAd(unitId);
  }

  // 2. Local state to trigger re-renders
  const [loaded, setLoaded] = useState(isLoaded);

  // 3. Subscribe to global changes
  useEffect(() => {
    const handler = (status) => setLoaded(status);
    listeners.add(handler);

    // Trigger load if needed
    loadAd();

    return () => {
      listeners.delete(handler);
    };
  }, []);

  // 4. Show function
  async function show() {
    if (!interstitialAd) return false;
    if (!isLoaded) {
      console.log('Interstitial not loaded yet');
      // Attempt load again just in case
      loadAd();
      return false;
    }

    try {
      await interstitialAd.show();
      return true;
    } catch (e) {
      console.warn('Failed to show interstitial', e);
      return false;
    }
  }

  return { loaded, show };
}
