// constants/purchases.ts
import { Platform } from 'react-native';

/**
 * RevenueCat Configuration
 * 
 * Replace placeholder keys below or set environment variables:
 * EXPO_PUBLIC_RC_APPLE_KEY: Public Apple API key from RevenueCat (appl_...)
 * EXPO_PUBLIC_RC_GOOGLE_KEY: Public Google API key from RevenueCat (goog_...)
 */
export const REVENUECAT_CONFIG = {
  // Public SDK Keys from RevenueCat Dashboard -> Project -> API Keys
  apiKey: Platform.select({
    ios: process.env.EXPO_PUBLIC_RC_APPLE_KEY,
    android: process.env.EXPO_PUBLIC_RC_GOOGLE_KEY,
    default: '',
  }),

  // Entitlement identifier configured in RevenueCat Dashboard -> Entitlements
  entitlementId: 'tambola_number_caller_pro',

  // Expected product / package identifier
  lifetimeProductId: 'tambola_lifetime_pro',
};

export function isRevenueCatConfigured(): boolean {
  const key = REVENUECAT_CONFIG.apiKey;
  return Boolean(
    key &&
    (key.startsWith('appl_') || key.startsWith('goog_'))
  );
}
