# Crevia — EAS / Store Build Prep Foundation

Bu pass **build/store hazırlık altyapısı** kurar. Gameplay, persist migration veya store submission içermez.

```bash
npm run analyze:build-prep
npm run verify:build-prep
```

## App config summary

| Alan | Değer | Not |
|------|-------|-----|
| name | Crevia | Görünen ad |
| slug | crevia | Expo slug |
| scheme | crevia | Deep link |
| version | 1.0.0 | User-facing semver (store) |
| orientation | portrait | |
| userInterfaceStyle | light | |
| icon | `./assets/images/icon.png` | 1024×1024 source mevcut |
| splash | expo-splash-screen plugin | `#F5F4F1`, Android logo |
| ios.bundleIdentifier | com.cngndz75.crevia | Mevcut owner standardı |
| ios.buildNumber | 1 | Her TestFlight/internal build’de artır |
| ios.supportsTablet | false | **Tablet desteklenmiyor** — telefon odaklı portrait |
| android.package | com.cngndz75.crevia | |
| android.versionCode | 1 | Her Play internal build’de artır |
| android.adaptiveIcon | foreground/background/monochrome | Mevcut |
| extra.eas.projectId | f5895e71-f5b0-4992-84a8-c2facd2f3519 | EAS projesi bağlı |
| plugins | expo-router, expo-splash-screen, expo-font, @sentry/react-native | |
| runtimeVersion / OTA | Not configured | İleride EAS Update pass |

**Managed workflow:** `ios/` ve `android/` native klasörleri yok; prebuild EAS build sırasında üretilir.

## EAS profile summary

| Profile | developmentClient | distribution | channel | Not |
|---------|-------------------|--------------|---------|-----|
| development | true | internal | development | Dev client |
| preview | — | internal | preview | APK (Android) |
| production | — | store | production | autoIncrement |

Submit skeleton: `submit.production` (credentials EAS’te, repo’da yok).

CLI: `eas-cli/20.1.0+` — `npm install -g eas-cli` veya `npx eas`.

## Versioning policy

Üç ayrı numara — **birbirine karıştırılmamalı:**

| Kavram | Kaynak | Amaç | Örnek |
|--------|--------|------|-------|
| **App version** | `app.json` → `expo.version` | Mağazada görünen semver | `1.0.0` veya soft launch `0.1.0` |
| **iOS buildNumber** | `app.json` → `ios.buildNumber` | TestFlight / internal build sayacı | `"1"`, `"2"`, … |
| **Android versionCode** | `app.json` → `android.versionCode` | Play internal build sayacı | `1`, `2`, … |
| **SAVE_VERSION** | `src/store/gamePersist.ts` | Oyun save şema versiyonu | **27** |

- `SAVE_VERSION` **27** app version ile aynı şey **değildir**.
- Build number artışı persist migration **değildir**.
- Store release semver `0.1.0` soft launch için uygun; mevcut `1.0.0` korunabilir — karar product pass’inde.

Helper: `src/core/quality/saveVersionPolicy.ts` — verify script’ler için tek kaynak.

## Asset checklist

| Asset | Path | Durum |
|-------|------|-------|
| App icon 1024×1024 | `assets/images/icon.png` | ✓ Mevcut |
| Adaptive foreground | `assets/images/android-icon-foreground.png` | ✓ |
| Adaptive background | `assets/images/android-icon-background.png` | ✓ |
| Adaptive monochrome | `assets/images/android-icon-monochrome.png` | ✓ |
| Splash (Android plugin) | `assets/logos/logo.png` | ✓ |
| iOS app icon set | `assets/expo.icon` | ✓ |
| Notification icon | — | Gerekli değil (push yok) |
| Store screenshots | — | **Pending** — ayrı pass |
| Feature graphic (Play) | — | **Pending** |

## Env policy

Dosya: [`.env.example`](../.env.example) — commit edilir; gerçek secret **commit edilmez**.

| Değişken | Amaç |
|----------|------|
| `EXPO_PUBLIC_APP_ENV` | development / preview / production |
| `EXPO_PUBLIC_BUILD_CHANNEL` | EAS channel mirror |
| `EXPO_PUBLIC_REVENUECAT_*` | Public SDK key placeholder |
| `EXPO_PUBLIC_API_BASE_URL` | Future — yorum satırı |
| Sentry / analytics | Future — EAS secrets |

Kurallar: private key, store credentials, OpenAI/API secret repo’da yok.

## IAP / RevenueCat readiness

**Entegrasyon:** Kodda mevcut (`react-native-purchases`, `src/core/iap/`). Canlı ödeme testi **yok**.

| Alan | Değer | Durum |
|------|-------|-------|
| iOS product id | `crevia.main_operation.season1` | Dashboard pending |
| Android product id | `crevia_main_operation_season_1` | Dashboard pending |
| Entitlement | `main_operation_full_access` | RC pending |
| Offering | `default` | RC pending |
| RevenueCat project | — | Manual setup |
| Sandbox tester | — | Post internal build |
| Restore purchases | Kod mevcut | Sandbox QA pending |
| Paywall screen | PostPilotOfferScreen | UI mevcut |
| Store / privacy disclosure | Checklist | [privacy checklist](./crevia-privacy-data-safety-checklist.md) |

Public key placeholder: `iapRuntimeConfig.ts` — `REPLACE_WITH` pattern.

## Store metadata checklist

[docs/crevia-store-metadata-checklist.md](./crevia-store-metadata-checklist.md)

## Privacy / data safety checklist

[docs/crevia-privacy-data-safety-checklist.md](./crevia-privacy-data-safety-checklist.md)

## Analyze / verify

```bash
npm run analyze:build-prep    # WARN/FAIL raporu
npm run verify:build-prep     # PASS gating + typecheck + final-ui
npm run verify:save-version-policy
```

## Preflight snapshot (foundation pass)

| Komut | Beklenen | Blok? |
|-------|----------|-------|
| typecheck:tsc | PASS | Evet (verify:build-prep) |
| verify:gameplay-loop-qa | PASS | Release readiness notu |
| verify:final-ui-visual-unification | PASS | Evet (verify:build-prep) |
| verify:save-version-policy | PASS | Policy drift |
| expo-doctor | WARN possible | Patch deps + schema |
| expo config --type public | PASS | |
| eas --version | PASS | |

## Known blockers (internal build öncesi)

1. **Privacy policy URL** — placeholder; store submission blocker
2. **RevenueCat + store products** — dashboard manual setup
3. **Store screenshots** — capture pass pending
4. **Sentry org/project** — EAS secrets veya env
5. **expo-doctor** — patch version drift (expo, expo-font, expo-router); `navigationBarColor` schema uyarısı giderildi
6. **Dependency patches** — `npx expo install --check` önerilir

## Next steps

1. **Internal build:** `eas build --profile preview --platform all`
2. **Device playtest:** ayrı pass (`verify:real-device-playtest`)
3. **Store screenshot pass:** hub, operation, map, report, profile
4. **IAP sandbox QA:** RevenueCat keys + store products sonrası
5. **Store submission:** metadata + privacy URL finalize sonrası
