/**
 * Two Jest projects, split by how much React Native runtime a test needs.
 *
 * - **node** — pure functions (sync merge helpers, schemas, error mappers,
 *   predicates). Plain `node` environment, no `jest-expo` preset, no RN
 *   transform chain. These are the fast, dependency-free tests and the bulk of
 *   the suite; keep new pure logic here.
 * - **hooks** — anything that needs `renderHook`, React Query, or a Zustand
 *   store that imports RN modules. Runs under the `jest-expo` preset so
 *   `react-native` and the Expo module registry resolve.
 *
 * We deliberately have NO component/screen project: this app's UI is Unistyles 3
 * + Reanimated 4 + native `@expo/ui` views, which is a mocking swamp with poor
 * signal. Screen-level flows are covered by Maestro against the real native
 * stack instead. See `.docs/` and CLAUDE.md.
 */

/**
 * Packages shipped as untranspiled ESM/Flow that Metro handles but Jest must be
 * told to transform.
 *
 * **pnpm caveat — do not "simplify" this to the usual `node_modules/(?!pkg)`.**
 * pnpm resolves to `node_modules/.pnpm/<pkg>@<ver>_<hash>/node_modules/<pkg>/…`,
 * i.e. TWO `node_modules/` segments. A path is ignored if the pattern matches
 * *anywhere*, so the plain idiom matches at the first (outer) `node_modules/` —
 * where the next segment is `.pnpm`, not a package name — and every allowlisted
 * package gets ignored anyway. Prefixing `.*` doesn't help either: it backtracks
 * to that same outer position. The fix is `(?!\.pnpm/)`, which makes the outer
 * segment fail to match so only the real package directory is ever evaluated.
 *
 * Concretely this is what lets `expo/virtual/env.js` (raw ESM,
 * `export const env = process.env`) through — it's pulled in transitively by
 * anything reading `process.env`, e.g. `src/lib/revenuecat.ts`. Without it the
 * suite dies with `SyntaxError: Unexpected token 'export'`.
 */
const transformIgnore = [
  'node_modules/(?!\\.pnpm/)(?!(' +
    [
      '(jest-)?react-native',
      '@react-native(-community)?',
      '@react-navigation',
      'expo',
      '@expo(nent)?',
      'expo-.*',
      'react-native-.*',
      '@shopify/flash-list',
      '@gorhom/bottom-sheet',
      'lucide-react-native',
      'pressto',
      'zustand',
      'i18n-js',
      '@wrack/.*',
      'posthog-react-native',
      '@posthog/.*',
    ].join('|') +
    ')[/\\\\])',
];

/** Shared `@/*` → `src/*` mapping, mirroring tsconfig paths. */
const moduleNameMapper = {
  '^@/assets/(.*)$': '<rootDir>/assets/$1',
  '^@/(.*)$': '<rootDir>/src/$1',
};

module.exports = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      // `.test.ts` only — the extension IS the project boundary. Pure tests must
      // not reach into the RN runtime; anything needing `renderHook` or the
      // `jest-expo` preset goes in a `.test.tsx` file and lands in `hooks`.
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.ts'],
      transform: {
        '^.+\\.[jt]sx?$': ['babel-jest', { presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]] }],
      },
      transformIgnorePatterns: transformIgnore,
      moduleNameMapper,
      setupFiles: ['<rootDir>/src/test-utils/setup-node.ts'],
      clearMocks: true,
    },
    {
      displayName: 'hooks',
      preset: 'jest-expo',
      testMatch: ['<rootDir>/src/**/__tests__/**/*.test.tsx'],
      transformIgnorePatterns: transformIgnore,
      moduleNameMapper,
      setupFiles: ['<rootDir>/src/test-utils/setup-hooks.ts'],
      clearMocks: true,
    },
  ],
};
