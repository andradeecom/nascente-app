import { d1Database, r2Storage } from '@hot-updater/cloudflare';
import { expo } from '@hot-updater/expo';
import { defineConfig } from 'hot-updater';
import { apiKeys, insights, remoteConfig } from 'hot-updater/plugins';

// OTA deploy configuration (see .docs/ota-updates.md). Dedicated Cloudflare
// infrastructure — a Worker serves update checks, D1 stores release metadata,
// and a private R2 bucket holds bundles — fully isolated from the Supabase
// product backend. Credentials come from .env.hotupdater locally (gitignored)
// or GitHub Secrets in CI; nothing here is bundled into the app.
try {
  process.loadEnvFile('.env.hotupdater');
} catch {
  // No .env.hotupdater — credentials come from the environment (CI secrets).
}

export default defineConfig({
  // Expo/CNG adapter — bundles via `expo export:embed` and reads Hermes from
  // app.json. Keep `sourcemap` on so PostHog/release debugging can symbolicate
  // OTA bundles.
  build: expo({ sourcemap: true }),
  // Fingerprint strategy: an OTA only reaches binaries whose native inputs hash
  // matches fingerprint.json — appVersion targeting is unsafe because the
  // marketing version only bumps on store releases.
  updateStrategy: 'fingerprint',
  storage: r2Storage({
    bucketName: process.env.HOT_UPDATER_CLOUDFLARE_R2_BUCKET_NAME!,
    accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
    credentials: {
      accessKeyId: process.env.HOT_UPDATER_CLOUDFLARE_R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.HOT_UPDATER_CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
    },
  }),
  database: d1Database({
    databaseId: process.env.HOT_UPDATER_CLOUDFLARE_D1_DATABASE_ID!,
    accountId: process.env.HOT_UPDATER_CLOUDFLARE_ACCOUNT_ID!,
    cloudflareApiToken: process.env.HOT_UPDATER_CLOUDFLARE_API_TOKEN!,
  }),
  // Managed Worker server plugins: client API-key auth, Insights ingestion for
  // launch/update reports, Remote Config. Admin routes stay unmounted publicly.
  plugins: [apiKeys(), insights(), remoteConfig()],
  // RSA-SHA256 bundle signing (local PEM baseline). The private key lives only
  // in .env.hotupdater / the protected GitHub Environment secret — never in the
  // repo. The public key is committed at keys/public-key.pem and embedded in
  // the native binary via the @hot-updater/expo app plugin's publicKeyPath.
  signing: {
    enabled: true,
    privateKeyPath: process.env.HOT_UPDATER_SIGNING_PRIVATE_KEY_PATH ?? './keys/private-key.pem',
  },
});
