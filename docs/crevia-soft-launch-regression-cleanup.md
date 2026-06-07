# Crevia Soft Launch Regression Cleanup — Aşama 1

## 1. Amaç

Verify/readiness hattında **code regression**, **manual blocker**, **dashboard/env pending** ve **stale verify expectation** ayrımını netleştirmek. Fake PASS yok.

## 2. Neden şimdi gerekli

Crash/performance ve soft launch completion pass’leri sonrası verify zinciri “Broken” cascade FAIL üretiyordu; gerçek kod sağlığı ile launch blocker’lar karışıyordu.

## 3. Status taxonomy

| Status | Anlam |
|--------|--------|
| PASS | Kod/kontrol sağlıklı |
| WARN | Kod hazır; env/dashboard/manual smoke pending |
| FAIL | Gerçek kod/test regression |
| BLOCKED | Public launch manual blocker açık |
| MANUAL_PENDING | Store/dashboard/kullanıcı işi bekliyor |
| STALE_EXPECTATION | Verify beklentisi güncel mimariye uymuyordu (düzeltildi) |

Top-level:

- `codeHealth`: PASS | WARN | FAIL
- `manualLaunchReadiness`: READY | WARN | BLOCKED
- `launchCandidateDecision`: ready | blocked

## 4. Current failing commands (sınıflandırma)

| Command | Code health | Manual launch | Not |
|---------|-------------|---------------|-----|
| verify:soft-launch-review | PASS (schema decoupled) | BLOCKED | IAP/store/playtest |
| verify:no-new-system-freeze | PASS (registry) | BLOCKED | Manual blockers ≠ freeze violation |
| verify:privacy-policy-readiness | PASS (drafts) | BLOCKED | Privacy URL placeholder |
| verify:post-launch-telemetry-readiness | PASS/WARN | WARN | Nested review kaldırıldı; ~1-3 dk |
| verify:analytics-runtime | PASS/WARN | WARN | Selector WARN ≠ schema FAIL |

## 5. Classification table

`npm run verify:soft-launch-regression-cleanup` çıktısındaki `commandClassifications` tablosuna bakın.

## 6. Manual blockers registry

`src/core/softLaunchRegressionCleanup/softLaunchRegressionCleanupConstants.ts` → `SOFT_LAUNCH_MANUAL_BLOCKERS`

## 7. Code health summary

- Crash SDK code integration: **PASS**
- Analytics event schema: **PASS** (`validateAnalyticsEventDefinitions`)
- Full loop / UX flow: **PASS**
- SAVE_VERSION 23: **PASS**

## 8. Freeze registry cleanup

Kayıtlı completion modülleri: `crashPerformance`, `uiDensity`, `offlineResume`, `mapReactions`, `operationalResourcePresence`, + diğer soft launch lite modüller.

## 9. Telemetry readiness cleanup

- Nested `verifySoftLaunchReviewScenario()` kaldırıldı
- Progress log: `[telemetry-verify] ...`
- Audit-only compatibility checks

## 10. Privacy readiness update

- Sentry processor listed (`crash_reporting`)
- Crash diagnostics: code ready, DSN/smoke **pending**
- Privacy URL placeholder: **BLOCKED** (fake PASS yok)

## 11. Remaining public launch blockers

IAP sandbox, store metadata/screenshots, privacy URL, Sentry DSN/smoke/source maps, analytics dashboard, real device playtest.

## 12. Internal device test recommendation

**Proceed internal device test** — code health PASS/WARN; manual launch blockers ayrı takip.

## 13. Non-goals

Gameplay/persist/SAVE_VERSION/route değişikliği yok. Manual blocker fake PASS yok.

## 14. Verify sonucu

Aşama 1 sonrası (tüm verify script’leri exit 0; launch audit hâlâ BLOCKED):

| Komut | Script exit | Audit / normalized |
|-------|-------------|-------------------|
| `verify:soft-launch-regression-cleanup` | 0 | code=WARN, manual=BLOCKED |
| `verify:post-launch-telemetry-readiness` | 0 (~35s) | WARN (dashboard/env pending) |
| `verify:soft-launch-review` | 0 | internal WARN, launch BLOCKED |
| `verify:soft-launch-readiness` | 0 | pre_sdk WARN |
| `verify:no-new-system-freeze` | 0 | fix_only_mode, 9 manual blockers |
| `verify:privacy-policy-readiness` | 0 | launch_candidate BLOCKED (URL placeholder) |
| `verify:analytics-runtime` | 0 | schema 35/35 PASS |
| `verify:crash-performance` | 0 | code PASS, DSN pending |
| `verify:ui-density` / `offline-resume` / `first-10-minutes` / `full-loop` / `full-ux-flow` | 0 | PASS |
| `typecheck` | 0 | PASS |

## 15. Sonraki önerilen prompt

> Soft Launch Regression Cleanup Aşama 1.1: Internal EAS build’de Sentry DSN + dashboard smoke PASS; privacy URL publish; IAP sandbox matrix; analytics SDK wiring plan.

## 16. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:soft-launch-regression-cleanup
npm run verify:post-launch-telemetry-readiness
npm run verify:soft-launch-review
npm run verify:no-new-system-freeze
npm run verify:privacy-policy-readiness
npm run verify:analytics-runtime
```
