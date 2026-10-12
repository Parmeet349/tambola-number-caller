// utils/store/adState.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  addCustomerInfoUpdateListener,
  getCustomerInfo,
  hasProEntitlement,
  initPurchases,
} from '../purchases';

const STORAGE_KEY = 'ad_state_v1';

type AdState = {
  isPro: boolean;
  adFreeUntil: number | null;
  setPro: (v: boolean) => void;
  setAdFreeForHours: (hours: number) => void;
  clearAdFree: () => void;
  showAds: boolean;
  reloadFromServer: () => Promise<void>;
};

const defaultState: AdState = {
  isPro: false,
  adFreeUntil: null,
  setPro: () => {},
  setAdFreeForHours: () => {},
  clearAdFree: () => {},
  showAds: true,
  reloadFromServer: async () => {},
};

const AdStateContext = createContext<AdState>(defaultState);

export const AdStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState<boolean>(false);
  const [adFreeUntil, setAdFreeUntil] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      // 1. Fast local restore from AsyncStorage for instant offline access
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.isPro) {
            setIsPro(true);
          }
          setAdFreeUntil(
            parsed.adFreeUntil && typeof parsed.adFreeUntil === 'number' && parsed.adFreeUntil > Date.now()
              ? parsed.adFreeUntil
              : null
          );
        }
      } catch (e) {
        console.warn('Failed to load ad state from storage', e);
      }

      // 2. Initialize RevenueCat and sync server entitlement
      try {
        await initPurchases();
        await reloadFromServer();
      } catch (e) {
        console.warn('Failed to sync purchases on launch', e);
      }
    })();

    // 3. Listen to live RevenueCat entitlement changes
    const unsubscribe = addCustomerInfoUpdateListener((customerInfo) => {
      const active = hasProEntitlement(customerInfo);
      setIsPro(active);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Persist changes locally
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPro, adFreeUntil })).catch(() => {});
  }, [isPro, adFreeUntil]);

  const setPro = (v: boolean) => setIsPro(v);

  const setAdFreeForHours = (hours: number) => {
    const until = Date.now() + hours * 60 * 60 * 1000;
    setAdFreeUntil(until);
  };

  const clearAdFree = () => setAdFreeUntil(null);

  // If user is Pro or has active temporary ad-free reward, hide all ads
  const showAds = !isPro && !(adFreeUntil && adFreeUntil > Date.now());

  const reloadFromServer = async () => {
    try {
      const info = await getCustomerInfo();
      if (info) {
        const active = hasProEntitlement(info);
        setIsPro(active);
      }
    } catch (e) {
      console.warn('Failed to reload entitlement from server', e);
    }
  };

  return (
    <AdStateContext.Provider
      value={{
        isPro,
        adFreeUntil,
        setPro,
        setAdFreeForHours,
        clearAdFree,
        showAds,
        reloadFromServer,
      }}
    >
      {children}
    </AdStateContext.Provider>
  );
};

export function useAdState() {
  return useContext(AdStateContext);
}
