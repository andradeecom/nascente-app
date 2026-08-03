import type { CustomerInfo } from 'react-native-purchases';
import { isProActive, isUserCancelledError, PRO_ENTITLEMENT } from '../revenuecat';

/**
 * The two pure predicates behind the paywall. `isProActive` is half of
 * `useIsPro()` — the gate for the entire study/AI layer — so a false negative
 * locks a paying customer out and a false positive gives Pro away.
 *
 * Only the pure helpers are covered here; the `Purchases.*`-calling functions
 * need the native SDK mock and belong to the `hooks` project.
 */

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: { setLogLevel: jest.fn(), configure: jest.fn() },
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));

jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }));

/** Minimal `CustomerInfo` — only `entitlements.active` is read by `isProActive`. */
function customerInfo(activeIds: string[]): CustomerInfo {
  return {
    entitlements: {
      active: Object.fromEntries(activeIds.map((id) => [id, { identifier: id, isActive: true }])),
    },
  } as unknown as CustomerInfo;
}

describe('isProActive', () => {
  it('is true when the pro entitlement is active', () => {
    expect(isProActive(customerInfo([PRO_ENTITLEMENT]))).toBe(true);
  });

  it('is false when no entitlements are active', () => {
    expect(isProActive(customerInfo([]))).toBe(false);
  });

  it('is false when a DIFFERENT entitlement is active', () => {
    // Guards against a truthiness check on `entitlements.active` itself, which
    // would hand Pro to anyone holding any future entitlement.
    expect(isProActive(customerInfo(['some_other_entitlement']))).toBe(false);
  });

  it('is false for null/undefined (SDK not configured, or info not loaded yet)', () => {
    // `useCustomerInfo()` returns undefined data in Expo Go / CI / before load.
    // Defaulting to "not Pro" is the safe direction.
    expect(isProActive(null)).toBe(false);
    expect(isProActive(undefined)).toBe(false);
  });

  it('reads the entitlement id RevenueCat is configured with', () => {
    // Must match the entitlement identifier on the RevenueCat dashboard.
    expect(PRO_ENTITLEMENT).toBe('pro');
  });
});

describe('isUserCancelledError', () => {
  it('is true for the SDK cancel code', () => {
    // A cancel is a normal user action, not an error worth toasting.
    expect(isUserCancelledError({ code: '1' })).toBe(true);
  });

  it('is false for any other purchase error', () => {
    expect(isUserCancelledError({ code: '2' })).toBe(false);
  });

  it('is false for a non-SDK error shape', () => {
    expect(isUserCancelledError(new Error('network'))).toBe(false);
    expect(isUserCancelledError(null)).toBe(false);
    expect(isUserCancelledError(undefined)).toBe(false);
  });
});
