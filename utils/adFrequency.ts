// utils/adFrequency.ts
// Centralized frequency capping to prevent ad fatigue and policy violations.

const MIN_INTERSTITIAL_COOLDOWN_MS = 60_000; // 60 seconds between interstitials
const MAX_INTERSTITIALS_PER_SESSION = 4;

let lastInterstitialShownAt: number = 0;
let interstitialCountThisSession: number = 0;

/**
 * Check whether we are allowed to show an interstitial right now.
 * Enforces:
 *   1. A minimum cooldown between consecutive interstitials
 *   2. A per-session cap
 */
export function shouldShowInterstitial(): boolean {
    const now = Date.now();

    if (interstitialCountThisSession >= MAX_INTERSTITIALS_PER_SESSION) {
        console.log('[AdFreq] Session cap reached, skipping interstitial');
        return false;
    }

    if (lastInterstitialShownAt && now - lastInterstitialShownAt < MIN_INTERSTITIAL_COOLDOWN_MS) {
        console.log('[AdFreq] Cooldown not met, skipping interstitial');
        return false;
    }

    return true;
}

/**
 * Call this AFTER successfully showing an interstitial to update tracking.
 */
export function recordInterstitialShown(): void {
    lastInterstitialShownAt = Date.now();
    interstitialCountThisSession += 1;
    console.log(`[AdFreq] Interstitial shown (#${interstitialCountThisSession})`);
}

/**
 * Reset session counter (call on app fresh start if needed).
 */
export function resetInterstitialSession(): void {
    interstitialCountThisSession = 0;
    lastInterstitialShownAt = 0;
}
