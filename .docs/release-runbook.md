# Release runbook (iOS)

Step-by-step procedures for shipping Nascente: **OTA updates**, **TestFlight builds**, and **App Store submissions**, plus rollback. Architecture and the reasons behind these steps live in [`ota-updates.md`](./ota-updates.md).

Android is deferred. Everything here is iOS only.

## 0. Pick the right path

| What changed                                                                                                    | Path                                                                                 |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| JS/TS only: bug fixes, copy, translations, styles, layouts, behavior of existing screens, static assets         | **OTA** ([§2](#2-ship-an-ota-update))                                                |
| Native deps, Expo/RN upgrade, `app.json` / config plugins, permissions, entitlements, icons/splash, signing key | **New binary** ([§3](#3-ship-a-testflight-build) → [§4](#4-submit-to-the-app-store)) |
| A new feature that materially changes what the app does                                                         | **New binary** (App Review 2.5.2)                                                    |

Not sure? Run `pnpm exec hot-updater fingerprint create` locally on your branch. If it reports **"fingerprint.json changed"**, you need a new binary. Revert the file with `git checkout fingerprint.json` if you were only checking.

## 1. One-time prerequisites

Already done for the current setup. Re-check these if a workflow fails on credentials.

- GitHub **Settings → Environments → `production`** holds all secrets listed in [`ota-updates.md` → Current implementation](./ota-updates.md#current-implementation).
- `main` is protected: releases are run from a `release/*` branch and merged back by PR. GitHub Actions cannot push to `main`.
- Local CLI work (rollout changes, disable, insights) needs `nascente-app/.env.hotupdater` (gitignored). It contains the Cloudflare credentials and is loaded automatically by `hot-updater.config.ts`.
- Signing material:
  - OTA private key: `keys/private-key.pem` plus the `HOT_UPDATER_SIGNING_PRIVATE_KEY` secret. **Back it up offline.** Losing it means no further OTAs until a new binary with a new public key ships.
  - Apple Distribution certificate: `.p12` in `IOS_DIST_CERT_P12_BASE64` / `IOS_DIST_CERT_P12_PASSWORD`. CI never creates certificates. If it expires, export a new `.p12` and replace both secrets.

## 2. Ship an OTA update

An OTA reaches only installs whose **native fingerprint** equals the fingerprint of the source you deploy. The source must therefore be compatible with the binary that is live.

### 2.1 Prepare the source

1. Merge the fix into `main` through a normal PR (CI green).
2. Check that `main` is still native-compatible with the store binary:
   ```bash
   git checkout main && git pull
   pnpm exec hot-updater fingerprint create
   git status fingerprint.json   # must be unchanged
   ```
   - **Unchanged** → deploy from `main`.
   - **Changed** → `main` contains native changes that aren't released yet. Revert the file (`git checkout fingerprint.json`), then deploy from a hotfix branch cut from the live release tag:
     ```bash
     git checkout -b hotfix/<name> v1.1.0
     git cherry-pick <fix-commit>
     git push origin hotfix/<name>
     ```
     Afterwards, merge the hotfix back into `main` by PR as well.

### 2.2 Deploy

1. GitHub → **Actions → OTA iOS → Run workflow**.
2. Inputs:
   - **Use workflow from**: the branch from 2.1 (`main` or `hotfix/<name>`). Leave `ref` empty unless you deploy a specific commit.
   - **rollout**:
     - before v1.1.0 is live on the App Store: any value; only TestFlight installs share the fingerprint;
     - after the App Store launch: `0` for QA, or `5` to start a staged rollout.
   - **force_update**: `false`. Use `true` only for emergencies: it reloads the app mid-session.
   - The bundle's message is the deployed commit's message, so write a clear commit message for the fix.
3. Approve the `production` environment if reviewers are configured.
4. The job runs CI (typecheck, lint, tests), then prebuild, then the `doctor` preflight, then the signed deploy.
5. Open the run's **Summary**. Note the **bundle ID** from "Latest bundles"; you need it for every step below. You can also get it locally:
   ```bash
   pnpm exec hot-updater bundle list -p ios -c production --limit 5
   ```

### 2.3 Verify on a device

1. Install the app from **TestFlight** (the binary must be v1.1.0 or newer).
2. **Fully kill** the app, then open it. This launch checks for the update and downloads it in the background; you won't see a change yet.
3. **Kill and reopen** again. This launch boots the new bundle.
4. Confirm the fix is visible. In PostHog, look for `ota_check_completed` (`update_available: true`) followed by `ota_update_staged`.
5. Optional, from the Worker side:
   ```bash
   pnpm exec hot-updater insights overview
   pnpm exec hot-updater insights failures
   ```

### 2.4 Raise the rollout (same bundle, no redeploy)

Rollout is stored as a cohort count from 0 to 1000 (1000 = 100%). Preview each change first, then apply it:

```bash
# 5%
pnpm exec hot-updater bundle update <bundle-id> --rollout-cohort-count 50 --dry-run
pnpm exec hot-updater bundle update <bundle-id> --rollout-cohort-count 50
# 25%, then 100%
pnpm exec hot-updater bundle update <bundle-id> --rollout-cohort-count 250
pnpm exec hot-updater bundle update <bundle-id> --rollout-cohort-count 1000
```

Between stages, check PostHog (`ota_error`, crash/error trends for the new `bundle_id`), `insights failures`, and Cloudflare usage (Workers & Pages → Worker → Metrics; D1/R2 usage). Wait at least a day per stage for non-trivial changes.

QA happens on one local device for now (see [`ota-updates.md` → QA today](./ota-updates.md#qa-today-one-local-device)). After the App Store launch, validate on that device before raising the rollout past 5%. Shipping a bundle to only one specific device is planned but not built.

### 2.5 Roll back an OTA

Startup crashes roll back automatically: the device returns to the last good bundle. For anything else:

```bash
# Stop delivering the bad bundle. Devices fall back to the previous compatible bundle
# (or the embedded one) on their next check plus cold launch.
pnpm exec hot-updater bundle disable <bundle-id>
```

Then fix forward: deploy a new OTA (2.1–2.4). If users must leave the bad bundle immediately, deploy the fix with `force_update: true`.

Re-enable a bundle if it was disabled by mistake: `pnpm exec hot-updater bundle enable <bundle-id>`.

## 3. Ship a TestFlight build

Builds a new signed binary from source and uploads it to TestFlight. A new binary is required for native changes (§0), and also before the first OTA reaches a new fingerprint.

1. Merge everything for the release into `main` (CI green).
2. Create a release branch from `main`. The workflow commits the version bump to it, because it can't push to protected `main`:
   ```bash
   git checkout main && git pull
   git checkout -b release/vX.Y.Z
   git push origin release/vX.Y.Z
   ```
3. GitHub → **Actions → Release iOS → Run workflow** on `release/vX.Y.Z`:
   - **bump**: `patch` for fixes, `minor` for features, `major` for breaking/product-level changes;
   - **submit_for_review**: `false` (submit after QA, §4);
   - **skip_version_bump**: `false`.
4. The workflow:
   1. runs CI;
   2. bumps `package.json` and `app.json` (version + build number);
   3. regenerates `fingerprint.json`;
   4. commits `chore: release vX.Y.Z (build N)`, tags `vX.Y.Z`, and pushes both;
   5. runs prebuild, imports the stable signing certificate, archives with Xcode 26.6, and uploads to TestFlight.
5. Open a PR from `release/vX.Y.Z` into `main` and merge it, so `main` carries the new version and `fingerprint.json`.
6. In **App Store Connect → TestFlight**, wait for processing (~5–30 min). Answer the export-compliance question if asked, then add the build to your tester group.

### If the build fails after the tag was pushed

Don't delete the tag and don't bump again. Fix the problem on the same `release/vX.Y.Z` branch, push, and run **Release iOS** again with **`skip_version_bump: true`**. It rebuilds the already-tagged version.

## 4. Submit to the App Store

Submit the exact TestFlight build you tested. There's no rebuild and no new version.

1. **Test the TestFlight build.** For the first OTA-capable release (v1.1.0), at minimum:
   - Cold launch in airplane mode: the app is usable immediately and the bundled Bible reads offline.
   - Cold launch online: `ota_check_completed` shows up in PostHog.
   - Recommended before launch: deploy a trivial JS-only OTA (§2) and confirm it applies on the second cold launch. Before the App Store launch, only TestFlight installs can receive it, so it's safe.
2. **Prepare the version in App Store Connect** (one-time per version, done in the web UI): "What's New" text, and screenshots/metadata if they changed. The lane deliberately doesn't upload metadata or screenshots.
3. GitHub → **Actions → Submit iOS for review → Run workflow**:
   - **ref**: the release tag, e.g. `v1.1.0`.
4. The workflow reads `version` and `ios.buildNumber` from that tag's `app.json` and submits exactly that build for review, with **manual release** (`automatic_release: false`).
5. When Apple approves, go to **App Store Connect → the version → Release This Version**. Release with phased release if offered (7-day automatic ramp).
6. From then on, App Store users share the binary's fingerprint, so production OTAs at rollout > 0 reach real users. Follow the staged rollout in §2.4.

`Release iOS` with `submit_for_review: true` also exists. It builds and submits in one go, which skips TestFlight QA. Prefer §3 followed by §4.

## 5. Troubleshooting

| Symptom                                                                              | Cause / fix                                                                                                                                                                                                                                 |
| ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OTA preflight: `ios: The iOS fingerprint changed since fingerprint.json was created` | The source has native changes relative to the release. Deploy from a hotfix branch off the release tag (§2.1), or ship a new binary (§3).                                                                                                   |
| OTA preflight fingerprint error but the source has no native changes                 | Possible cross-OS fingerprint mismatch: the binary was fingerprinted on macOS, the deploy runs on Linux. See [`ota-updates.md` → Open item: cross-OS fingerprint determinism](./ota-updates.md#open-item-cross-os-fingerprint-determinism). |
| OTA preflight: infrastructure needs an upgrade                                       | Hot Updater packages were bumped without upgrading the Worker/D1. Follow [`ota-updates.md` → Infrastructure upgrades](./ota-updates.md#infrastructure-upgrades).                                                                            |
| Local `pnpm exec hot-updater doctor` exits 1 with only `android:` errors             | Expected while Android is deferred. CI judges the JSON output and ignores Android.                                                                                                                                                          |
| OTA deployed but the device never updates                                            | Kill and relaunch **twice**. Check that the binary is ≥ v1.1.0, that the rollout isn't `0` (or the device is in a target cohort), and that the bundle is enabled (`bundle list`). Debug/`__DEV__` builds never check.                       |
| Release: `ARCHIVE FAILED` mentioning `ExpoModulesJSI`                                | Xcode is too old for the Expo SDK. SDK 57 needs Xcode ≥ 26.4; `release-ios.yml` pins `macos-26` + Xcode 26.6.                                                                                                                               |
| Release: "No profiles … were found" / certificate not found                          | `IOS_DIST_CERT_P12_*` secrets are missing, wrong, or expired. Re-export the Apple Distribution `.p12` from Keychain Access and replace both secrets.                                                                                        |
| Release: push rejected (`GH006`)                                                     | The workflow was run on `main`. Run it on a `release/*` branch (§3).                                                                                                                                                                        |
| Submit: build not found                                                              | The build is still processing in App Store Connect, or `ref` points at the wrong tag. Wait for processing and check the tag.                                                                                                                |
