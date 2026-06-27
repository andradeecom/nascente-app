import { Platform } from 'react-native';
import Purchases, {
  LOG_LEVEL,
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * Single RevenueCat entry point — the SDK's `Purchases` static class wrapped in a
 * thin seam, the same way `src/lib/supabase.ts` is the one Supabase client. The
 * paywall + entitlement hooks go through here, never `Purchases.*` directly, so
 * the "is it configured?" guard and the entitlement id live in one place.
 *
 * RevenueCat has native modules, so it only works in a custom dev/standalone build
 * (not Expo Go). When the platform API key is absent (Expo Go, CI, a fresh clone),
 * `configureRevenueCat` no-ops and `isConfigured()` stays false — every helper here
 * is guarded so the app still boots and the paywall falls back to its i18n prices.
 */

/** Entitlement identifier configured on the RevenueCat dashboard. */
export const PRO_ENTITLEMENT = 'pro';

const apiKey =
  Platform.OS === 'ios'
    ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY
    : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

/** Whether the SDK has a key and has been configured (false in Expo Go / no key). */
export function isRevenueCatConfigured(): boolean {
  return configured;
}

/**
 * Configure the SDK once at app start (before any offerings/purchase call). Safe
 * to call when no key is set — it just no-ops so the app boots without RevenueCat.
 * `appUserID` is intentionally omitted here; identity is bound to the Supabase user
 * via `identifyRevenueCat` from the auth lifecycle (see `src/stores/auth.ts`).
 */
export function configureRevenueCat(): void {
  if (configured || !apiKey) return;
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN);
  Purchases.configure({ apiKey });
  configured = true;
}

/**
 * Alias the anonymous RevenueCat user to the signed-in Supabase user id so a
 * purchase attaches to the account and follows it across devices/reinstalls. The
 * same id is what the webhook's `app_user_id` resolves back to a `profiles` row.
 */
export async function identifyRevenueCat(userId: string): Promise<void> {
  if (!configured) return;
  await Purchases.logIn(userId);
}

/** Reset to an anonymous RevenueCat user on sign-out (no cross-user entitlement leak). */
export async function resetRevenueCat(): Promise<void> {
  if (!configured) return;
  await Purchases.logOut();
}

/** The current offering (annual/monthly packages), or null if none/SDK absent. */
export async function getCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

/** Fetch the latest customer info (entitlements), or null if the SDK isn't configured. */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!configured) return null;
  return Purchases.getCustomerInfo();
}

/** Purchase a package; returns the resulting customer info. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/** Restore prior purchases; returns the refreshed customer info. */
export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

/** Whether the given customer info grants the Pro entitlement. */
export function isProActive(info: CustomerInfo | null | undefined): boolean {
  return !!info && typeof info.entitlements.active[PRO_ENTITLEMENT] !== 'undefined';
}

/** Whether a thrown purchase error is just the user cancelling (not worth surfacing). */
export function isUserCancelledError(error: unknown): boolean {
  return (error as PurchasesError)?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR;
}

/**
 * Subscribe to live customer-info updates (renewals, restores, cross-device).
 * Returns an unsubscribe function (no-op when the SDK isn't configured).
 */
export function addCustomerInfoUpdateListener(listener: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
