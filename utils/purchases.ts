// utils/purchases.ts
import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  LOG_LEVEL,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
} from 'react-native-purchases';
import { isRevenueCatConfigured, REVENUECAT_CONFIG } from '../constants/purchases';

let isInitialized = false;

/**
 * Initialize RevenueCat SDK safely
 */
export async function initPurchases(): Promise<boolean> {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return false;
  }

  if (isInitialized) {
    return true;
  }

  if (!isRevenueCatConfigured()) {
    if (__DEV__) {
      console.log(
        '[RevenueCat] Placeholder API key detected. Add your real RevenueCat API keys in constants/purchases.ts or .env to enable live purchases.'
      );
    }
    return false;
  }

  try {
    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    } else {
      await Purchases.setLogLevel(LOG_LEVEL.INFO);
    }

    await Purchases.configure({ apiKey: REVENUECAT_CONFIG.apiKey });
    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully');
    return true;
  } catch (error) {
    console.warn('[RevenueCat] Initialization failed:', error);
    return false;
  }
}

/**
 * Check if the user has an active Pro entitlement
 */
export function hasProEntitlement(customerInfo: CustomerInfo | null | undefined): boolean {
  if (!customerInfo || !customerInfo.entitlements) return false;
  const entitlement = customerInfo.entitlements.active[REVENUECAT_CONFIG.entitlementId];
  return Boolean(entitlement && entitlement.isActive);
}

/**
 * Fetch current customer info from RevenueCat
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isRevenueCatConfigured()) return null;
  try {
    await initPurchases();
    return await Purchases.getCustomerInfo();
  } catch (error) {
    console.warn('[RevenueCat] Failed to get customer info:', error);
    return null;
  }
}

/**
 * Fetch offerings from RevenueCat
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isRevenueCatConfigured()) return null;
  try {
    await initPurchases();
    return await Purchases.getOfferings();
  } catch (error) {
    console.warn('[RevenueCat] Failed to fetch offerings:', error);
    return null;
  }
}

export interface PurchaseResult {
  success: boolean;
  isPro: boolean;
  userCancelled: boolean;
  error?: any;
}

/**
 * Purchase a selected package (e.g., Lifetime Pro)
 */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseResult> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      isPro: false,
      userCancelled: false,
      error: new Error('RevenueCat is not configured yet with valid API keys.'),
    };
  }

  try {
    await initPurchases();
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = hasProEntitlement(customerInfo);
    return {
      success: isPro,
      isPro,
      userCancelled: false,
    };
  } catch (error: any) {
    if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return { success: false, isPro: false, userCancelled: true };
    }
    console.warn('[RevenueCat] Purchase failed:', error);
    return {
      success: false,
      isPro: false,
      userCancelled: false,
      error,
    };
  }
}

/**
 * Restore previous purchases
 */
export async function restorePurchases(): Promise<PurchaseResult> {
  if (!isRevenueCatConfigured()) {
    return {
      success: false,
      isPro: false,
      userCancelled: false,
      error: new Error('RevenueCat is not configured yet with valid API keys.'),
    };
  }

  try {
    await initPurchases();
    const customerInfo = await Purchases.restorePurchases();
    const isPro = hasProEntitlement(customerInfo);
    return {
      success: true,
      isPro,
      userCancelled: false,
    };
  } catch (error) {
    console.warn('[RevenueCat] Restore failed:', error);
    return {
      success: false,
      isPro: false,
      userCancelled: false,
      error,
    };
  }
}

/**
 * Listen to customer info updates from RevenueCat
 */
export function addCustomerInfoUpdateListener(listener: (customerInfo: CustomerInfo) => void) {
  if (!isRevenueCatConfigured()) {
    return () => {};
  }
  return Purchases.addCustomerInfoUpdateListener(listener);
}
