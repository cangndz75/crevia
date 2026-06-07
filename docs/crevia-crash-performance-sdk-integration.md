# Crevia Crash / Performance SDK Integration — Aşama 1

## 1. Amaç

Soft launch öncesi production-safe crash monitoring ve temel performance/error telemetry altyapısı. Gerçek cihaz ve internal/soft launch build’lerinde crash, JS error, navigation/screen context ve kritik flow breadcrumb’larını **PII olmadan** görmek.

Oyuncu deneyimini değiştirmez; yalnızca diagnostic observability katmanıdır.

## 2. Neden şimdi gerekli

- Soft launch completion pass’leri tamamlandı; sahada görülmeyen crash’ler artık en büyük risk.
- Analytics runtime no-op katmanı vardı; crash SDK ayrı ve bağımsız olmalı.
- Store/privacy formları crash diagnostics için provider bekliyor (pending → entegre kod + manual smoke).

## 3. Provider decision: Sentry vs Crashlytics

| Karar | Seçim |
|-------|--------|
| **Primary** | **Sentry** (`@sentry/react-native`) |
| **Alternative (docs only)** | Firebase Crashlytics — Expo Go’da çalışmaz, native config + dev client gerekir |
| **Dual SDK** | ❌ Aynı anda bağlanmaz |
| **Analytics** | ❌ Karıştırılmaz — `trackAnalyticsEvent` no-op kalır |

**Resmi referanslar:**

- [Expo — Using Sentry](https://docs.expo.dev/guides/using-sentry/)
- [Sentry — React Native Expo setup](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [Sentry — Migrate from sentry-expo](https://docs.sentry.io/platforms/react-native/migration/sentry-expo/) (`sentry-expo` kullanılmıyor)
- [Expo — Debugging runtime issues](https://docs.expo.dev/debugging/runtime-issues/)
- Crashlytics karşılaştırma: [RN Firebase Crashlytics](https://rnfirebase.io/crashlytics/usage) — bu aşamada wired değil

**Gerekçe:** Crevia Expo SDK 54 + EAS managed workflow kullanıyor. Sentry resmi Expo wizard/plugin yolu daha düşük sürtünmeli.

## 4. Expo/EAS compatibility

- Paket: `@sentry/react-native` (`npx expo install @sentry/react-native`)
- `app.json` plugin: `@sentry/react-native` (Expo install tarafından eklendi)
- **Expo Go:** Native modül yok → DSN olmasa veya dev build olmasa runtime **no-op** kalır; app crash olmaz.
- **EAS dev/internal build:** DSN + `EXPO_PUBLIC_CRASH_REPORTING_ENABLED=true` ile aktif.
- Metro `getSentryExpoConfig`: custom resolver nedeniyle Aşama 1’de **otomasyon yapılmadı** — source map upload EAS secret + plugin ile; metro merge Aşama 1.1.

## 5. Runtime config

| Env | Açıklama |
|-----|----------|
| `EXPO_PUBLIC_SENTRY_DSN` | Sentry DSN — yoksa **no-op** |
| `EXPO_PUBLIC_CRASH_REPORTING_ENABLED` | `true` olmadan SDK init disabled |
| `EXPO_PUBLIC_APP_ENV` | `development` / `internal` / `production` tag |
| `EXPO_PUBLIC_SENTRY_PERFORMANCE_TRACING_ENABLED` | Opsiyonel tracing (`tracesSampleRate` 0.1) |

**EAS secrets (source maps):**

- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Kurallar:

- DSN yok → no-op
- `enabled=false` → no-op
- Geçersiz DSN → no-op (app crash yok)
- `sendDefaultPii: false`
- Session replay **kapalı** (privacy review yok)

## 6. Privacy-safe breadcrumbs

**İzinli:** screen name, game day, phase, event id (body değil), event source kind, district id, surface, action type.

**Yasak:** player name, email, location, free text, event body/copy, payment ids, raw save JSON, RevenueCat customer id, AI prompt/text.

Guard: `src/core/crashPerformance/crashPerformancePrivacy.ts` + `FORBIDDEN_CRASH_BREADCRUMB_KEYS`.

## 7. Error boundary / capture helpers

- `CreviaErrorBoundary` — sade fallback, gameplay state mutate etmez
- `captureException`, `captureMessage`, `addBreadcrumb`, `setCrashContext`, `clearCrashContext`
- No-op provider ile uyumlu

## 8. Performance lite strategy

- `startPerformanceSpan` / `endPerformanceSpan` / `recordScreenReady`
- `startScreenTiming` — screen load breadcrumb
- Heavy profiler yok; tracing env flag ile gated
- Real Sentry performance tracing → Aşama 1.1 (metro + sample rate review)

## 9. Source maps / release setup

1. Sentry’de org + project oluştur; DSN al.
2. EAS secrets: `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`.
3. `app.json` plugin mevcut; production build’de EAS otomatik upload dener (token varsa).
4. Release adı: `crevia@{expo.version}` + `dist` = build number.
5. Metro merge (opsiyonel Aşama 1.1):

```js
const { getDefaultConfig } = require("expo/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");
// Mevcut custom resolver ile birleştirme dikkatli yapılmalı.
```

6. EAS Update sonrası: `npx sentry-expo-upload-sourcemaps dist` (Expo docs).

## 10. Real device smoke test checklist

- [ ] Internal EAS build (iOS veya Android) DSN + enabled flag ile
- [ ] Hub DevTools → **Dev: Sentry crash test** (yalnızca `__DEV__`)
- [ ] Sentry dashboard’da yeni issue + release tag (`crevia@1.0.0`)
- [ ] Breadcrumb’larda screen/day/phase; PII yok
- [ ] Source map ile okunabilir stack (token yapılandırıldıysa)
- [ ] Production build’de enabled flag doğrulandı; development’ta gürültü minimum

## 11. Release readiness integration

- `postLaunchTelemetryReadiness`: `telemetry.crash_sdk_code_ready` / `crash_dsn_pending` / `crash_smoke_test_pending`
- `softLaunchReview`: `crash.code_integration_present` (PASS/WARN), manual smoke WARN
- `softLaunchReadiness` performance area: crash SDK code PASS, env/smoke WARN
- **Fake PASS yok** — IAP/store/manual blocker’lar BLOCKED kalabilir

## 12. Manual blockers

- DSN + EAS secrets henüz set edilmemiş olabilir → runtime no-op, audit WARN
- Dashboard smoke test yapılmadı → WARN
- Source maps tam configured değil → WARN
- IAP sandbox, store metadata, privacy URL, screenshots, playtest — önceki manual blocker’lar devam

## 13. Non-goals

- Gameplay / persist / SAVE_VERSION / route değişikliği
- Analytics schema refactor
- Session replay
- Dual crash SDK
- Crashlytics ana entegrasyon (bu pass)
- AI / Remote Config / full profiler dashboard

## 14. Verify sonucu

`npm run verify:crash-performance` — SDK decision, runtime safety, privacy, breadcrumbs, release integration kontrolleri.

Beklenen: code integration **PASS**, env/smoke/source maps **WARN** (manual pending).

## 15. Sonraki önerilen prompt

> Crash / Performance SDK Integration Aşama 1.1: EAS internal build’de DSN + SENTRY_AUTH_TOKEN set et, metro Sentry merge, real device smoke PASS, privacy policy crash processor satırını güncelle, opsiyonel Sentry performance tracing sample rate review.

## 16. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:crash-performance
npm run verify:analytics-runtime
npm run verify:post-launch-telemetry-readiness
npm run verify:soft-launch-review
npm run verify:soft-launch-readiness
npm run verify:privacy-policy-readiness
npm run verify:first-10-minutes
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:map-ui
npm run verify:event-result-ui
npm run verify:full-loop
npm run verify:full-ux-flow
```

**Kurulum (bir kez):**

```bash
npx expo install @sentry/react-native
# veya resmi wizard:
npx @sentry/wizard@latest -i reactNative
```
