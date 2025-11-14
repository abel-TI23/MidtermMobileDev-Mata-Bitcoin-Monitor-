## Android Release Build (Presentation APK)

This guide covers producing a shareable APK quickly. Current release uses the debug keystore (NOT for production distribution). For a real production release, generate a private keystore and update signing configs.

### 1. Local One-Off Release APK

```powershell
# From project root
cd android
./gradlew.bat clean assembleRelease
```

Result APK: `android/app/build/outputs/apk/release/app-release.apk`

### 2. Run in Debug (quick verify)

```powershell
npm run android
```

### 3. GitHub Actions Workflow

Workflow file: `.github/workflows/android-release.yml`

Trigger options:
- Tag push: create a tag like `v1.0.0` – workflow builds and attaches APK to Release.
- Manual dispatch: run from GitHub UI choosing `release` or `debug` variant.

Artifacts uploaded:
- `android/app/build/outputs/apk/release/*.apk`
- `android/app/build/outputs/apk/debug/*.apk`

### 4. Creating a Tag

```powershell
git tag v1.0.0
git push origin v1.0.0
```

### 5. (Optional) Production Keystore Setup
Generate keystore:
```powershell
keytool -genkeypair -v -storetype PKCS12 -keystore mata-prod.keystore -alias mata -keyalg RSA -keysize 2048 -validity 3650
```
Then update `android/app/build.gradle` release signingConfig and store keystore + passwords in GitHub Actions secrets.

### 6. Common Issues
- If build fails on CI due to memory: add `org.gradle.jvmargs=-Xmx2g` to `android/gradle.properties`.
- Native module mismatch: run `npm ci` locally, commit lockfile.
- Reanimated/Hermes issues: clear `android/app/.cxx` and rebuild.

### 7. Quick Smoke Checklist
- Launches without red screen.
- PriceCard updates within a few seconds.
- Scrolling grid responsive.
- No freezing after 2 minutes.

### 8. Next Hardening Steps (Post-Presentation)
- Replace debug signing with release keystore.
- Enable Proguard / R8 (set `enableProguardInReleaseBuilds = true`).
- Shrink assets (limit candle history, minify logs).
- Add crash reporting (Sentry/Firebase Crashlytics).

---
Generated for interim academic presentation; not yet production-hardened.
