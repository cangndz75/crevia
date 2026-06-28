# Crevia Manual Launch Blocker Tracker — Aşama 1.2

## 1. Amaç

Public launch öncesi kalan **manuel işleri** tek tracker’da toplamak: IAP, store, privacy, Sentry, analytics dashboard ve internal device test. Fake PASS yok.

## 2. Neden şimdi gerekli

Soft Launch Regression Cleanup sonrası `codeHealth=WARN`, `manualLaunchReadiness=BLOCKED`, tüm verify script’leri exit 0. Kod hazır; sıradaki risk manuel işlerin görünmez kalması.

## 3. Current decision

| Alan | Değer |
|------|--------|
| codeHealth | WARN |
| manualLaunchReadiness | BLOCKED |
| launchCandidateDecision | blocked |
| internal device test | **proceed_internal_device_test** |
| overall tracker status | **ready_for_internal_device_test** |
| public launch | **blocked_for_public_launch** |

## 4. Blocker taxonomy

`pending` | `in_progress` | `done` | `blocked` | `not_applicable`

Kategoriler: `iap` | `store` | `privacy` | `crash` | `analytics` | `device_test` | `performance` | `metadata`

## 5. Manual blocker registry

Kaynak: `src/core/manualLaunchTracker/manualLaunchTrackerConstants.ts` → `MANUAL_LAUNCH_BLOCKERS` (51 item, 7 grup).

Çalıştır: `npm run verify:manual-launch-tracker`

### 5a. Verify script’lerin beklediği kanıtlar

| Script | Otomatik PASS için | Manuel kanıt (gerçek cihaz) |
|--------|-------------------|----------------------------|
| `verify:real-device-playtest` | Plan (16 senaryo), docs, gözlem şablonları, `completedObservationCount=0` | 16 senaryo × cihaz profili gözlem sheet’leri |
| `verify:manual-launch-tracker` | 51 blocker pending, `verifiedEvidence=0`, fake PASS guard | Round 1 (20 test) + 136 evidence kaydı — screenshot/video/build_log |
| `verify:release-candidate` | Gameplay verify referansları PASS, manual blocker ayrı, `verifiedEvidence=0` | EAS build, IAP sandbox, store, privacy URL, device matrix |

**Evidence şablonu:** `docs/crevia-real-device-qa-evidence-round-1.md` — iOS/Android ayrı tablolar, 20 akış checklist, JSON attach formatı.

**Evidence depo:** `docs/evidence/ios/`, `docs/evidence/android/` (bkz. `docs/evidence/README.md`)

Blocker kapatma kuralları: `manualLaunchEvidenceConstants.ts` → `BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS` (ör. IAP → `purchase_log` verified, Sentry → `dashboard_event` verified).

## 6. IAP / RevenueCat checklist

- [ ] RevenueCat public keys (EAS)
- [ ] Entitlement + offering config
- [ ] App Store product created
- [ ] Play Console product created
- [ ] Sandbox purchase test
- [ ] Restore test
- [ ] Price finalized

Verify: `verify:iap-manual-setup-tracker`, `verify:iap-sandbox-qa`, `verify:iap-sandbox-smoke-execution`

## 7. Store metadata / screenshots checklist

- [ ] App Store metadata entered
- [ ] Play Store metadata entered
- [ ] Screenshots captured + device matrix
- [ ] App icon final
- [ ] Feature graphic (Play)
- [ ] Release notes final

Verify: `verify:store-metadata-finalization`, `verify:store-screenshot-readiness`

## 8. Privacy / data safety checklist

- [ ] Privacy URL published (**placeholder = BLOCKED**)
- [x] Sentry processor listed in draft (code/docs — factual `done`)
- [ ] RevenueCat / analytics / Sentry data safety review
- [ ] Store data safety forms completed
- [ ] Legal final review

Verify: `verify:privacy-policy-readiness`

## 9. Sentry crash checklist

- [ ] DSN + enable flag on internal build
- [ ] Dashboard smoke test
- [ ] Source maps (EAS secrets)
- [ ] Release/environment tags on events
- [ ] Privacy-safe breadcrumbs verified on device

Code integration: **PASS** (no-op without DSN). Verify: `verify:crash-performance`

## 10. Analytics dashboard checklist

- [ ] SDK selected + integrated (not verify no-op only)
- [ ] Dashboard created
- [ ] Events visible after device session
- [ ] Day 1 funnel verified
- [ ] IAP funnel verified
- [ ] Crash vs analytics separation verified

Schema 35/35: **PASS**. Dashboard: **pending**. Verify: `verify:analytics-runtime`, `verify:post-launch-telemetry-readiness`

## 11. Internal device test matrix

20 zorunlu test — `MANUAL_LAUNCH_DEVICE_TEST_MATRIX`:

| ID | Başlık | Platform |
|----|--------|----------|
| idt.day1_first_session | Day 1 first session | both |
| idt.day1_decision_result | Day 1 decision result | both |
| idt.day5_mid_event_resume | Day 5 mid-event resume | both |
| idt.day7_day8_transition | Day 7 → Day 8 | both |
| idt.day8_pack_origin_event | Day 8 pack-origin event | both |
| idt.day8_pack_origin_decision_result | Pack-origin result | both |
| idt.day8_report_resume | Report close/reopen | both |
| idt.hub_resume_after_report | Hub resume | both |
| idt.map_reaction | Map + Mahalle Karnesi | both |
| idt.operational_resources_detail | Resources detail | both |
| idt.social_pulse_mention_cap | Social Pulse cap | both |
| idt.iap_offer_screen | PostPilotOffer | both |
| idt.iap_sandbox_purchase | IAP sandbox purchase | both |
| idt.iap_restore_sandbox | IAP restore | both |
| idt.sentry_crash_smoke | Sentry crash DEV | both |
| idt.sentry_dashboard_visible | Sentry dashboard | both |
| idt.large_text_smoke | Large text | both |
| idt.low_end_android_performance | Low-end Android | android |
| idt.offline_launch | Offline launch | both |
| idt.privacy_store_metadata_check | Privacy/store check | both |

İlgili playtest doc: `docs/crevia-real-device-playtest-round-1.md`

## 12. Performance device smoke matrix

| Blocker ID | Açıklama |
|------------|----------|
| low_end_android_smoke | Hub/Map scroll |
| iphone_se_layout_smoke | Küçük iOS |
| large_text_smoke | Dynamic type |
| map_screen_performance_smoke | Map panel |
| report_screen_scroll_smoke | EOD report |
| app_start_smoke | Cold start |
| memory_warning_observation | 20 dk session |

## 13. Evidence log model (Aşama 1.1)

Kaynak: `src/core/manualLaunchTracker/manualLaunchEvidenceTypes.ts`, `manualLaunchEvidenceAudit.ts`

Her kayıt: `evidenceId`, `blockerId`, opsiyonel `testCaseId`, `evidenceType`, `status`, `platform`, opsiyonel `buildProfile` / `appVersion` / `buildNumber`, `fakePassGuard: true`.

| evidenceType | Kullanım |
|--------------|----------|
| screenshot | UI / store console |
| screen_recording | Akış / performans |
| dashboard_event | Sentry smoke (zorunlu PASS için) |
| store_console | Metadata / IAP ürün |
| purchase_log | Sandbox IAP (zorunlu PASS için) |
| manual_note | Gözlem (tek başına public blocker kapatmaz) |
| url | Privacy URL (zorunlu PASS için) |
| build_log | EAS internal build |

`status`: `missing` | `attached` | `verified` | `rejected` — **persist edilmez**; gerçek attach/verify manuel.

## 13a. Internal EAS build execution

Checklist: `buildEasInternalBuildChecklistTemplate()` — 11 item (`eas_cli_ready` … `tester_device_registered_or_distribution_ready`).

Her item: `status` pending/done/blocked, `evidenceRequired`, `nextAction`, `blocksInternalDeviceTest`.

Sıra: EAS CLI → project config → iOS/Android internal profile → `EXPO_PUBLIC_SENTRY_DSN` + crash flag → RevenueCat keys (IAP test) → version/build kaydı → internal distribution → tester cihaz.

## 13b. Sentry smoke evidence

1. Internal build çalıştır (`EXPO_PUBLIC_SENTRY_DSN`, `EXPO_PUBLIC_CRASH_REPORTING_ENABLED=true`)
2. DEV/internal crash test butonu
3. Sentry dashboard’da event doğrula

PASS: dashboard event, PII yok, raw save/event body yok, screen breadcrumb + environment tag. Evidence: `dashboard_event` (verified) + screenshot + manual_note. Yoksa **pending**.

## 13c. IAP sandbox evidence

Testler: RC keys, entitlement/offering/product eşleşmesi, App Store + Play ürün, iOS/Android sandbox purchase, restore, cancel/fail davranışı.

PASS: purchase succeeds, entitlement unlocks, restore works, fail app’i bozmaz, product id eşleşir. Evidence: `purchase_log` (verified) + store_console + RC dashboard screenshot. Yoksa **pending/blocked**.

## 13d. Device test evidence

20 internal batch (`INTERNAL_DEVICE_TEST_BATCH_IDS`) — her test `deviceTestEvidence` ile `passCriteria`, `expectedResult`, `blocksInternalDeviceTest`, `blocksPublicLaunch` taşır. Blocker’lara `DEVICE_TEST_BLOCKER_LINKS` ile bağlı.

## 13e. Evidence verification rules

- Attached ≠ done; blocker kapanması için **verified** evidence gerekir (`canCloseBlockerWithEvidence`).
- Sentry: `dashboard_event` verified olmadan PASS yok.
- IAP: `purchase_log` verified olmadan PASS yok.
- Privacy: `url` verified olmadan PASS yok.
- Store screenshots: `screenshot` verified olmadan PASS yok.
- `fakePassGuardActive` — verified evidence 0 iken aktif.

## 13f. What can / cannot close a blocker

**Kapatabilir:** İlgili evidence type **verified** + PASS kriterleri (`BLOCKER_EVIDENCE_CLOSE_REQUIREMENTS`).

**Kapatamaz:** Sadece `manual_note`; attached ama verified değil; placeholder privacy URL; sandbox yapılmadan IAP; dashboard görülmeden Sentry smoke; store metadata/screenshot olmadan store blocker.

## 14. Public launch decision

**blocked_for_public_launch** — tüm `blocksPublicLaunch` blocker’lar pending/blocked iken değişmez.

## 15. Internal device test decision

**proceed_internal_device_test** — kod sağlığı PASS/WARN; manuel blocker’lar paralel takip. IAP sandbox + device matrix öncelikli.

## 16. Non-goals

Gameplay, persist, SAVE_VERSION, monetization davranışı, fake PASS, uydurma product id/URL yok.

## 17. Verify sonucu

`npm run verify:manual-launch-tracker` — script exit 0; manual blockers pending (beklenen).

## 17a. Round 1 internal device playtest (Aşama 1.2)

Kaynak: `manualLaunchRoundOneConstants.ts` — **20 test case**, 6 scope (Build, Day 1, Day 8 pack-origin, Resume, UI density, Sentry conditional).

| Alan | Beklenen |
|------|----------|
| roundOneStatus | `ready_to_execute` |
| verifiedEvidence | **0** |
| pendingTests | 19–20 |
| canComplete | false |

Detaylı script: `docs/crevia-internal-device-test-round-one.md`

## 18. Next manual steps

1. `eas build --profile internal` (iOS + Android) — build_log evidence
2. Sentry DSN + internal crash smoke — dashboard_event verified
3. RevenueCat sandbox purchase + restore — purchase_log verified
4. 20 device test batch — screenshot/screen_recording per case
5. Privacy URL yayınla — url evidence
6. Store console metadata + screenshots — store_console / screenshot

## 19. Sonraki önerilen prompt

> Release Candidate Aşama 1.3: Round 1 playtest sonuçları — gerçek evidence attach + verified işaretleme; fake PASS yok.

## 20. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:soft-launch-review
npm run verify:soft-launch-readiness
npm run verify:iap-integration
npm run verify:iap-sandbox-qa
npm run verify:iap-manual-setup-tracker
npm run verify:store-metadata-finalization
npm run verify:store-screenshot-readiness
npm run verify:privacy-policy-readiness
npm run verify:crash-performance
npm run verify:post-launch-telemetry-readiness
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```
