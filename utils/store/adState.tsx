// utils/store/adState.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';


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
    setPro: () => { },
    setAdFreeForHours: () => { },
    clearAdFree: () => { },
    showAds: true,
    reloadFromServer: async () => { },
};

const AdStateContext = createContext<AdState>(defaultState);

export const AdStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isPro, setIsPro] = useState<boolean>(false);
    const [adFreeUntil, setAdFreeUntil] = useState<number | null>(null);

    useEffect(() => {
        (async () => {
            try {
                let raw = await AsyncStorage.getItem(STORAGE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    setIsPro(!!parsed.isPro);
                    //   set ad-free until timestamp if valid else null
                    setAdFreeUntil(
                        parsed.adFreeUntil && typeof parsed.adFreeUntil === 'number' && parsed.adFreeUntil > Date.now()
                            ? parsed.adFreeUntil
                            : null
                    );
                    //
                    console.log('Loaded ad state from storage', { isPro: parsed.isPro, adFreeUntil: parsed.adFreeUntil });

                    //   setAdFreeUntil(parsed.adFreeUntil ?? null);
                }
            } catch (e) {
                console.warn('Failed to load ad state', e);
            }
            // Also check server-side entitlement
            await reloadFromServer();
        })();
    }, []);

    useEffect(() => {
        // persist
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ isPro, adFreeUntil })).catch(() => { });
    }, [isPro, adFreeUntil]);

    const setPro = (v: boolean) => setIsPro(v);

    const setAdFreeForHours = (hours: number) => {
        const until = Date.now() + hours * 60 * 60 * 1000;
        setAdFreeUntil(until);
    };

    const clearAdFree = () => setAdFreeUntil(null);

    const showAds = !isPro && !(adFreeUntil && adFreeUntil > Date.now());

    const reloadFromServer = async () => {
        // RevenueCat removed
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
