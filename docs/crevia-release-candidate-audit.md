# Crevia Release Candidate Audit — Aşama 1.2

## 1. Amaç

Kod sağlığı, gameplay readiness, manual launch blockers, store submission, IAP, privacy, crash/analytics observability ve final release decision’ı tek audit altında toplamak. Fake PASS yok.

## 2. Current decision

| Alan | Değer |
|------|--------|
| overallStatus | ready_for_internal_device_test |
| codeHealth | WARN |
| gameplayReadiness | WARN (offline resume 1 WARN) |
| publicLaunchDecision | **blocked** |
| internalDeviceTestDecision | **ready** |
| manual blockers | 51 tracked; public pending ~39 |

## 3. Code health summary

- first-10-minutes, full-loop, full-ux-flow: **PASS**
- offline-resume: **WARN** (bilinçli stub)
- ui-density, crash code integration, analytics schema 35/35: **PASS**
- code regressions: **0**
- SAVE_VERSION: **23**

## 4. Gameplay readiness summary

11 soft launch completion alanı — çoğu **PASS**; offline resume **WARN**. Verify komutları `RELEASE_CANDIDATE_GAMEPLAY_AREAS` içinde.

## 5. Manual blockers summary

Kaynak: `manualLaunchTracker` (51 blocker). Public launch blocked; internal test proceed.

## 6. Store submission tracker

`storeChecklist` — metadata (draft), visual assets (pending), IAP (blocked sandbox/restore), privacy (blocked URL), build (pending).

## 7. IAP readiness

Code integration PASS; RevenueCat keys, products, sandbox, restore **BLOCKED**.

## 8. Privacy/data safety readiness

Draft PASS; privacy URL **BLOCKED**; legal/data safety **pending**.

## 9. Crash/analytics observability

- Crash: code **PASS**, DSN/smoke/source maps **pending**
- Analytics: schema **PASS**, SDK/dashboard **pending**

## 10. Device test readiness

**BLOCKED** — iOS/Android matrix, performance smoke, Day 8 pack-origin pending.

## 11. Evidence summary (Aşama 1.1)

`ReleaseCandidateEvidenceSummary` — `manualLaunchTracker.evidenceSummary` kaynağı:

| Alan | Beklenen (şimdi) |
|------|------------------|
| totalEvidenceRequired | 50+ |
| missingEvidence | >0 |
| verifiedEvidence | **0** (fake PASS yok) |
| internalDeviceEvidenceStatus | BLOCKED |
| publicLaunchEvidenceStatus | BLOCKED |

Öncelik: EAS build → Sentry smoke (`dashboard_event`) → IAP sandbox (`purchase_log`) → Day 8 pack-origin → screenshots → privacy URL (`url`).

## 12. Internal device test plan (Round 1)

Round 1: `manualLaunchRoundOneAudit` — 20 test, `ready_to_execute`, `verifiedEvidence=0`.  
Docs: `docs/crevia-internal-device-test-round-one.md`  
Decision: **proceed_internal_device_test** / execution **ready_to_execute** (completed değil).

## 13. Public launch blocking reasons

IAP sandbox/restore, store screenshots/metadata console, privacy URL, Sentry env/smoke, analytics dashboard, device test matrix.

## 14. Release readiness board

| Now / Internal Device Test | Before Soft Launch | Before Public Launch | V1.1 Backlog |
| --- | --- | --- | --- |
| EAS build; Sentry DSN; device smoke; IAP sandbox; Sentry smoke | Screenshots; metadata; RC keys | Privacy URL; data safety; source maps; analytics | City Archive; Map V1; Content Pack Full; Vehicle Maintenance; AI Ece |

## 15. Non-goals

Gameplay/persist/SAVE_VERSION değişikliği yok; fake PASS yok; AI/Remote Config/Live-Ops açılmadı.

## 16. Verify sonucu

`npm run verify:release-candidate` — exit 0; public blocked; verifiedEvidence=0 (expected).

## 17. Next manual steps

Internal EAS build → Sentry dashboard smoke → IAP sandbox → 20-case device matrix → privacy URL + store assets. Evidence attach sonrası `verified` işaretle; verify script’leri otomatik PASS üretmez.

## 18. Sonraki önerilen prompt

> Release Candidate Aşama 1.3: Round 1 playtest tamamlandıktan sonra evidence verified işaretleme + blocker review (fake PASS yok).

## 19. Typecheck / Expo Router generated types

Internal EAS build öncesi `npm run typecheck` **PASS** olmalı.

- `npm run typecheck` önce `src/app` kökünden `.expo/types/router.d.ts` yeniden üretir (`regenerate:expo-router-types`).
- `.expo/` gitignore’da — commitlenmez; bozuk cache (`/../` path’leri) bu script ile temizlenir.
- Manuel: `.expo/types` sil → `npm run regenerate:expo-router-types` → `npm run typecheck:tsc`

## 20. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:soft-launch-review
npm run verify:soft-launch-readiness
npm run verify:privacy-policy-readiness
npm run verify:store-metadata-finalization
npm run verify:store-screenshot-readiness
npm run verify:iap-integration
npm run verify:iap-sandbox-qa
npm run verify:iap-manual-setup-tracker
npm run verify:crash-performance
npm run verify:post-launch-telemetry-readiness
npm run verify:first-10-minutes
npm run verify:offline-resume
npm run verify:ui-density
npm run verify:full-loop
npm run verify:full-ux-flow
```
