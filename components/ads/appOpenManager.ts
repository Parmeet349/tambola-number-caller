// components/ads/appOpenManager.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AdEventType, AppOpenAd } from 'react-native-google-mobile-ads';
import { AppState, AppStateStatus } from 'react-native';
import { PROD_IDS } from './admob';

const STORAGE_KEY = 'tambola_app_open_meta_v1';

// simple in-memory state
let appOpenAd: AppOpenAd | null = null;
let isLoaded = false;
let isLoading = false;
let lastShownAt: number | null = null;
let appOpenShownCount = 0;
let sessionStart = Date.now();

// optional: hydrate daily count from storage
async function loadMeta() {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        const today = new Date().toISOString().slice(0, 10);
        if (parsed.date === today) {
            appOpenShownCount = parsed.count ?? 0;
        } else {
            appOpenShownCount = 0;
        }
    } catch (e) {
        console.warn('Failed to load app-open meta', e);
    }
}

async function saveMeta() {
    try {
        const today = new Date().toISOString().slice(0, 10);
        await AsyncStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ date: today, count: appOpenShownCount }),
        );
    } catch {
        // ignore
    }
}

function ensureAdInstance() {
    if (!appOpenAd) {
        appOpenAd = AppOpenAd.createForAdRequest(PROD_IDS.APP_OPEN!, {
            requestNonPersonalizedAdsOnly: true,
        });

        appOpenAd.addAdEventListener(AdEventType.LOADED, () => {
            isLoaded = true;
            isLoading = false;
            console.log('[AppOpen] Ad loaded');
        });

        appOpenAd.addAdEventListener(AdEventType.ERROR, (err) => {
            console.warn('[AppOpen] Error', err);
            isLoaded = false;
            isLoading = false;
        });

        appOpenAd.addAdEventListener(AdEventType.CLOSED, () => {
            console.log('[AppOpen] Closed — reloading');
            isLoaded = false;
            isLoading = false;
            appOpenAd?.load();
            isLoading = true;
        });
    }
}

export async function initAppOpenAds() {
    sessionStart = Date.now();
    await loadMeta();
    ensureAdInstance();
    if (!isLoading && !isLoaded) {
        appOpenAd?.load();
        isLoading = true;
    }
}

// Call this when app becomes active or right after splash
export function maybeShowAppOpenAd(options?: { isAdFree?: boolean }) {
    const now = Date.now();

    if (options?.isAdFree) {
        console.log('[AppOpen] Skipping: ad-free mode');
        return;
    }

    if (appOpenShownCount >= 2) {
        console.log('[AppOpen] Skipping: daily cap reached');
        return;
    }

    if (now - sessionStart < 5_000) {
        console.log('[AppOpen] Skipping: first 5 seconds of session');
        return;
    }

    if (lastShownAt && now - lastShownAt < 45_000) {
        console.log('[AppOpen] Skipping: too soon since last fullscreen');
        return;
    }

    if (!isLoaded || !appOpenAd) {
        console.log('[AppOpen] Not loaded yet, trying to load...');
        if (!isLoading) {
            appOpenAd?.load();
            isLoading = true;
        }
        return;
    }

    try {
        console.log('[AppOpen] Showing app open ad...');
        appOpenAd.show();
        lastShownAt = now;
        appOpenShownCount += 1;
        saveMeta();
    } catch (e) {
        console.warn('Failed to show AppOpen ad', e);
    }
}


// attach global AppState listener
let appStateListenerAttached = false;

export function attachAppOpenAppStateListener(getIsAdFree?: () => boolean) {
    if (appStateListenerAttached) return;
    appStateListenerAttached = true;

    AppState.addEventListener('change', (state: AppStateStatus) => {
        if (state === 'active') {
            maybeShowAppOpenAd({ isAdFree: getIsAdFree ? getIsAdFree() : false });
        }
    });
}
