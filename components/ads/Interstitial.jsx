// components/ads/Interstitial.jsx
import { useEffect, useRef, useState } from 'react';
import { AdEventType, InterstitialAd } from 'react-native-google-mobile-ads';
// import { TEST_IDS, PROD_IDS } from './admob';
import { PROD_IDS } from './admob';

/**
 * Hook to manage an interstitial ad.
 * Usage:
 * const { loaded, show } = useInterstitial();
 * // call show() when you want to display the ad
 */
// export function useInterstitial(unitId = TEST_IDS.INTERSTITIAL) {
export function useInterstitial(unitId = PROD_IDS.INTERSTITIAL) {
  // create the ad instance once
  const interstitialRef = useRef(
    InterstitialAd.createForAdRequest(unitId, { requestNonPersonalizedAdsOnly: true })
  );

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const interstitial = interstitialRef.current;
    if (!interstitial) {
      console.warn('Interstitial ad instance unavailable');
      return;
    }

    // Newer API: use addAdEventListener for specific events.
    // Each call returns an unsubscribe function.
    const unsubscribers = [];

    try {
      // LOADED
      if (typeof interstitial.addAdEventListener === 'function') {
        unsubscribers.push(
          interstitial.addAdEventListener(AdEventType.LOADED, () => {
            setLoaded(true);
          })
        );
        // ERROR
        unsubscribers.push(
          interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
            console.warn('Interstitial error', error);
            setLoaded(false);
          })
        );
        // CLOSED
        unsubscribers.push(
          interstitial.addAdEventListener(AdEventType.CLOSED, () => {
            setLoaded(false);
            // reload for next time
            if (typeof interstitial.load === 'function') {
              interstitial.load();
            }
          })
        );
      } else if (typeof interstitial.onAdEvent === 'function') {
        // Backwards-compat fallback (older versions)
        const cb = (type, error) => {
          if (type === AdEventType.LOADED) setLoaded(true);
          if (type === AdEventType.ERROR) {
            console.warn('Interstitial error', error);
            setLoaded(false);
          }
          if (type === AdEventType.CLOSED) {
            setLoaded(false);
            interstitial.load && interstitial.load();
          }
        };
        const cleanup = interstitial.onAdEvent(cb);
        if (typeof cleanup === 'function') unsubscribers.push(cleanup);
      } else {
        console.warn('Interstitial ad API does not expose addAdEventListener or onAdEvent');
      }
    } catch (e) {
      console.warn('Failed to attach interstitial listeners', e);
    }

    // Start loading
    try {
      interstitial.load && interstitial.load();
    } catch (e) {
      console.warn('Failed to call interstitial.load()', e);
    }

    // cleanup
    return () => {
      try {
        unsubscribers.forEach((u) => {
          try { if (typeof u === 'function') u(); } catch (e) { /* ignore */ }
        });
      } catch (e) {
        // best-effort
      }
    };
  }, [unitId]);

  async function show() {
    const interstitial = interstitialRef.current;
    if (!interstitial) {
      console.warn('No interstitial instance available to show');
      return false;
    }

    try {
      // Prefer the library's isLoaded/isLoaded API if present.
      if (typeof interstitial.isLoaded === 'function') {
        const ready = await interstitial.isLoaded();
        if (!ready) {
          console.log('Interstitial not loaded yet');
          return false;
        }
      }
      // show - some versions expose show() directly on the instance
      if (typeof interstitial.show === 'function') {
        await interstitial.show();
        return true;
      }

      console.warn('Interstitial show API not available');
      return false;
    } catch (e) {
      console.warn('Failed to show interstitial', e);
      return false;
    }
  }

  return { loaded, show };
}
