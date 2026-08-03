/**
 * Setup for the `hooks` project (runs under the `jest-expo` preset).
 *
 * Everything mocked here is a native module with no JS fallback — importing the
 * real thing throws in a Jest environment because there's no bridge/JSI host.
 * Individual tests override these per-case with `jest.mocked(...)`, so keep the
 * defaults inert (no-op / not-configured), never behavioural.
 */

/* ------------------------------------------------------------------ *
 * Native modules with no JS fallback
 * ------------------------------------------------------------------ */

// Nitro/JSI-backed: no bridge in Jest, so the real module throws on import.
jest.mock('react-native-nitro-modules', () => ({}));
jest.mock('react-native-quick-crypto', () => ({}));

jest.mock('react-native-purchases', () => ({
  __esModule: true,
  default: {
    configure: jest.fn(),
    setLogLevel: jest.fn(),
    logIn: jest.fn().mockResolvedValue({ customerInfo: { entitlements: { active: {} } } }),
    logOut: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    getOfferings: jest.fn().mockResolvedValue({ current: null }),
    getCustomerInfo: jest.fn().mockResolvedValue({ entitlements: { active: {} } }),
    purchasePackage: jest.fn(),
    restorePurchases: jest.fn(),
    addCustomerInfoUpdateListener: jest.fn(),
    removeCustomerInfoUpdateListener: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: 'DEBUG', WARN: 'WARN' },
  PURCHASES_ERROR_CODE: { PURCHASE_CANCELLED_ERROR: '1' },
}));

jest.mock('expo-sqlite', () => ({
  openDatabaseSync: jest.fn(() => ({
    getAllSync: jest.fn(() => []),
    getFirstSync: jest.fn(() => null),
    execSync: jest.fn(),
    closeSync: jest.fn(),
  })),
}));

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

// `require` inside the factory is mandatory: `jest.mock` factories are hoisted
// above imports, so referencing a statically-imported binding here throws
// "Cannot access before initialization".
jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

/* ------------------------------------------------------------------ *
 * App seams
 * ------------------------------------------------------------------ */

// The single Supabase client (src/lib/supabase.ts). Tests that exercise a query
// override the relevant method; the default shape just keeps imports resolvable.
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      signInWithPassword: jest.fn(),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    from: jest.fn(),
    functions: { invoke: jest.fn() },
  },
}));

// Analytics is fire-and-forget instrumentation; assert on `capture` where the
// event IS the contract (see the AI-generate tests).
jest.mock('@/lib/posthog', () => ({
  capture: jest.fn(),
  captureError: jest.fn(),
  identifyUser: jest.fn(),
  resetIdentity: jest.fn(),
  screen: jest.fn(),
  registerSuperProperties: jest.fn(),
  isPostHogConfigured: () => false,
  getPostHogClient: () => null,
  log: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// expo-router: `useProGate` asserts on where it pushes.
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn(), back: jest.fn() }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: jest.fn(),
  router: { push: jest.fn(), replace: jest.fn(), back: jest.fn() },
}));

/* Quieter output: RN's Animated helper warns on every `useNativeDriver` in tests. */
jest.spyOn(console, 'warn').mockImplementation(() => {});
