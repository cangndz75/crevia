# Crevia Real Device QA Evidence — Round 1

## 1. Amaç

Public release öncesi **gerçek cihaz** test kanıtlarını tek formatta toplamak. Bu doküman bir **şablon ve rehberdir** — dosya eklenmeden veya QA lead `verified` işaretlemeden hiçbir blocker/test PASS sayılmaz.

İlgili otomatik doğrulamalar (yapısal kontrol; cihaz testi çalıştırmaz):

| Komut | Ne doğrular | Evidence bekler mi? |
|-------|-------------|---------------------|
| `npm run verify:real-device-playtest` | 16 senaryo planı, gözlem şablonları, risk sınıfları, docs | Hayır — `completedObservationCount=0` beklenir |
| `npm run verify:manual-launch-tracker` | 51 blocker, Round 1 (20 test), fake PASS guard, `verifiedEvidence=0` | Hayır — 136 evidence kaydı `missing` |
| `npm run verify:release-candidate` | Kod/gameplay verify referansları, store/IAP/Sentry manual blocker’lar | Hayır — `verifiedEvidence=0`, `internalEvidence=BLOCKED` |

**Fake PASS yasak:** `attached` ≠ `verified`. `manual_note` tek başına public launch blocker kapatmaz.

Kaynak kod: `src/core/manualLaunchTracker/`, `src/core/playtest/`, `src/core/releaseCandidate/`

---

## 2. Evidence alanları (zorunlu format)

Her platform için **ayrı satır** doldurulur (iOS ve Android aynı test olsa bile).

| Alan | Açıklama | Örnek |
|------|----------|-------|
| `evidenceId` | Benzersiz kimlik | `ev_ios_day1_hub_001` |
| `testCaseId` | Round 1 test case veya supplemental id | `day1_first_session` |
| `platform` | `ios` \| `android` | `ios` |
| `deviceName` | Fiziksel cihaz modeli | `iPhone 15` |
| `osVersion` | İşletim sistemi sürümü | `iOS 18.2` |
| `buildProfile` | EAS profil adı | `internal` |
| `appVersion` | Uygulama sürümü | `1.0.0` |
| `buildNumber` | iOS buildNumber / Android versionCode | `42` |
| `testDate` | Test tarihi (ISO veya `YYYY-MM-DD`) | `2026-06-28` |
| `tester` | Test eden kişi | `QA — Ada` |
| `result` | `pass` \| `fail` \| `blocked` \| `skipped` \| `pending` | `pass` |
| `evidenceType` | `screenshot` \| `screen_recording` \| `manual_note` \| … | `screenshot` |
| `evidenceLocation` | Repo veya depo yolu (dosya yoksa `missing` kalır) | `docs/evidence/ios/day1-hub.png` |
| `evidenceSummary` | Kısa gözlem özeti | `Hub sade; guide strip görünür` |
| `testerNote` / `notes` | Ek notlar, bulgu, severity | `medium — kart aralığı sıkı` |
| `verifiedBy` | QA lead (yalnızca `verified` için) | `QA Lead` |
| `verifiedAt` | Doğrulama zamanı ISO | `2026-06-28T14:30:00Z` |
| `status` | `missing` \| `attached` \| `verified` \| `rejected` | `attached` |

JSON örneği (şablon — **gerçek dosya olmadan tracker verified olmaz**):

```json
{
  "evidenceId": "ev_ios_day1_hub_001",
  "testCaseId": "day1_first_session",
  "platform": "ios",
  "deviceName": "iPhone 15",
  "osVersion": "iOS 18.2",
  "buildProfile": "internal",
  "appVersion": "1.0.0",
  "buildNumber": "42",
  "testDate": "2026-06-28",
  "tester": "QA — Ada",
  "result": "pass",
  "evidenceType": "screenshot",
  "evidenceLocation": "docs/evidence/ios/day1-hub.png",
  "evidenceSummary": "Day 1 hub sade; guide strip + ilk event CTA net.",
  "notes": "Scroll performansı akıcı; safe area OK.",
  "status": "attached",
  "fakePassGuard": true
}
```

Evidence dosyaları: `docs/evidence/ios/` ve `docs/evidence/android/` (bkz. `docs/evidence/README.md`).

---

## 3. Ana QA checklist — akış eşlemesi

Aşağıdaki akışlar Round 1 test case’leri, playtest senaryoları (`rdp.*`) veya **supplemental** manuel satırlarla kapsanır. Supplemental satırlar Round 1 tracker sayısına eklenmez; bu dokümanda loglanır ve ilgili playtest senaryosuna bağlanır.

| # | Akış | Round 1 test case | Playtest senaryo | Supplemental id |
|---|------|-------------------|------------------|-----------------|
| 1 | İlk açılış | `ios_install_smoke`, `android_install_smoke` | `rdp.fresh_day1_first_result` | — |
| 2 | Day 1 hub | `day1_first_session` | `rdp.fresh_day1_first_result` | — |
| 3 | İlk olay seçimi | `day1_first_session` | `rdp.fresh_day1_first_result` | `sup.first_event_selection` |
| 4 | İncele | — | event_flow alanı | `sup.event_inspect_phase` |
| 5 | Planla | — | `rdp.day3_assignment_route` | `sup.event_plan_phase` |
| 6 | Yönlendir | — | `rdp.day3_assignment_route` | `sup.event_dispatch_phase` |
| 7 | Sahada | — | `rdp.day3_assignment_route` | `sup.event_field_phase` |
| 8 | Sonuç | `day1_decision_result` | `rdp.fresh_day1_first_result` | — |
| 9 | Gün sonu raporu | `day1_report_return_to_hub` | `rdp.day1_full_report` | — |
| 10 | Yeni gün | `day7_to_day8_transition` | `rdp.day2_carry_over` (Day 2+) | `sup.new_day_advance` |
| 11 | Maintenance action | — | — | `sup.maintenance_action` |
| 12 | Maintenance economy | — | — | `sup.maintenance_economy` |
| 13 | Map marker selection | `day8_map_district_reaction` | `rdp.day4_map_intelligence` | `sup.map_marker_selection` |
| 14 | Active operation map card | — | map alanı | `sup.active_operation_map_card` |
| 15 | Growth screen | — | profile_career alanı | `sup.growth_screen` |
| 16 | Reports screen | `day8_pack_origin_report_echo` | `rdp.social_report_echo` | `sup.reports_screen` |
| 17 | Offline / resume | `offline_no_network_launch`, `day5_mid_event_resume` | `rdp.offline_open` | — |
| 18 | App kill / reopen | `day5_mid_event_resume`, `day8_report_before_close_resume` | `rdp.restart_after_report` | — |
| 19 | Safe area / bottom nav | `large_text_hub_map_report` | performance_device_ux | `sup.safe_area_bottom_nav` |
| 20 | Scroll performance | `large_text_hub_map_report`, `idt.low_end_android_performance` | performance_device_ux | `sup.scroll_performance` |

**Maintenance / map marker / growth:** Kod verify (`verify:maintenance-actions-lite`, `verify:map-marker-feedback`, vb.) cihazda okunabilirlik ve etkileşim için supplemental satırlarda screenshot + not zorunlu.

---

## 4. iOS evidence tablosu (doldurulacak)

| checklistId | testCaseId | deviceName | osVersion | buildProfile | testDate | tester | result | screenshot/ref | video/ref | notes |
|-------------|------------|------------|-----------|--------------|----------|--------|--------|----------------|-----------|-------|
| 1 ilk_acilis | ios_install_smoke | | | internal | | | pending | | | |
| 2 day1_hub | day1_first_session | | | internal | | | pending | | | |
| 3 ilk_olay | day1_first_session | | | internal | | | pending | | | |
| 4 incele | sup.event_inspect_phase | | | internal | | | pending | | | |
| 5 planla | sup.event_plan_phase | | | internal | | | pending | | | |
| 6 yonlendir | sup.event_dispatch_phase | | | internal | | | pending | | | |
| 7 sahada | sup.event_field_phase | | | internal | | | pending | | | |
| 8 sonuc | day1_decision_result | | | internal | | | pending | | | |
| 9 gun_sonu | day1_report_return_to_hub | | | internal | | | pending | | | |
| 10 yeni_gun | day7_to_day8_transition | | | internal | | | pending | | | |
| 11 maintenance_action | sup.maintenance_action | | | internal | | | pending | | | |
| 12 maintenance_economy | sup.maintenance_economy | | | internal | | | pending | | | |
| 13 map_marker | sup.map_marker_selection | | | internal | | | pending | | | |
| 14 active_op_map | sup.active_operation_map_card | | | internal | | | pending | | | |
| 15 growth | sup.growth_screen | | | internal | | | pending | | | |
| 16 reports | sup.reports_screen | | | internal | | | pending | | | |
| 17 offline | offline_no_network_launch | | | internal | | | pending | | | |
| 18 kill_reopen | day8_report_before_close_resume | | | internal | | | pending | | screen_recording | |
| 19 safe_area | sup.safe_area_bottom_nav | | | internal | | | pending | | | |
| 20 scroll_perf | large_text_hub_map_report | | | internal | | | pending | | | |

---

## 5. Android evidence tablosu (doldurulacak)

| checklistId | testCaseId | deviceName | osVersion | buildProfile | testDate | tester | result | screenshot/ref | video/ref | notes |
|-------------|------------|------------|-----------|--------------|----------|--------|--------|----------------|-----------|-------|
| 1 ilk_acilis | android_install_smoke | | | internal | | | pending | | | |
| 2 day1_hub | day1_first_session | | | internal | | | pending | | | |
| 3 ilk_olay | day1_first_session | | | internal | | | pending | | | |
| 4 incele | sup.event_inspect_phase | | | internal | | | pending | | | |
| 5 planla | sup.event_plan_phase | | | internal | | | pending | | | |
| 6 yonlendir | sup.event_dispatch_phase | | | internal | | | pending | | | |
| 7 sahada | sup.event_field_phase | | | internal | | | pending | | | |
| 8 sonuc | day1_decision_result | | | internal | | | pending | | | |
| 9 gun_sonu | day1_report_return_to_hub | | | internal | | | pending | | | |
| 10 yeni_gun | day7_to_day8_transition | | | internal | | | pending | | | |
| 11 maintenance_action | sup.maintenance_action | | | internal | | | pending | | | |
| 12 maintenance_economy | sup.maintenance_economy | | | internal | | | pending | | | |
| 13 map_marker | sup.map_marker_selection | | | internal | | | pending | | | |
| 14 active_op_map | sup.active_operation_map_card | | | internal | | | pending | | | |
| 15 growth | sup.growth_screen | | | internal | | | pending | | | |
| 16 reports | sup.reports_screen | | | internal | | | pending | | | |
| 17 offline | offline_no_network_launch | | | internal | | | pending | | | |
| 18 kill_reopen | day8_report_before_close_resume | | | internal | | | pending | | screen_recording | |
| 19 safe_area | sup.safe_area_bottom_nav | | | internal | | | pending | | | |
| 20 scroll_perf | large_text_hub_map_report + idt.low_end_android_performance | | | internal | | | pending | | | |

---

## 6. Eksik evidence özeti (mevcut durum)

Tracker audit çalıştırıldığında beklenen başlangıç durumu:

| Metrik | Beklenen |
|--------|----------|
| `totalEvidenceRequired` | 136 |
| `missingEvidence` | 136 |
| `verifiedEvidence` | **0** |
| `internalDeviceEvidenceStatus` | `BLOCKED` |
| `publicLaunchEvidenceStatus` | `BLOCKED` |
| Round 1 `pendingTests` | 19–20 |
| Round 1 `canComplete` | `false` |

Öncelikli eksikler (`EVIDENCE_PRIORITY_MISSING`):

1. `evidence.eas_internal_build`
2. `evidence.sentry_dashboard_smoke`
3. `evidence.iap_sandbox_purchase`
4. `evidence.iap_restore`
5. `evidence.day8_pack_origin`
6. `evidence.large_text_smoke`
7. `evidence.store_screenshots`
8. `evidence.privacy_url`

Round 1 öncelik (`MANUAL_LAUNCH_ROUND_ONE_PRIORITY_MISSING`):

1. `evidence.round1.eas_internal_build_created`
2. `evidence.round1.day1_first_session`
3. `evidence.round1.day8_pack_origin_event_appears`
4. `evidence.round1.day8_main_operation_feel`
5. `evidence.round1.day7_to_day8_transition`
6. `evidence.round1.large_text_hub_map_report`
7. `evidence.round1.sentry_dashboard_smoke_if_env_ready`

---

## 7. PASS / FAIL kriterleri

| Durum | Koşul |
|-------|--------|
| **Test PASS** | Tüm `passCriteria` karşılandı + gerekli evidence **`verified`** |
| **PENDING** | Test yapılmadı veya evidence `missing` / `attached` |
| **BLOCKED** | Fail criteria veya `rejected` evidence |
| **Release candidate ready** | Tüm Round 1 testleri verified + blocker’lar kapalı + kod health regressions yok — **şu an mümkün değil** |

---

## 8. Sonraki manuel adımlar

1. `eas build --profile internal` (iOS + Android) → `build_log` evidence
2. Bu dokümandaki iOS + Android tablolarını doldur
3. Screenshot/video dosyalarını `docs/evidence/{ios,android}/` altına koy
4. QA lead `verified` işaretle → tracker audit güncelle (ayrı Results Log pass)
5. Blocker/high bulguda screenshot + kısa video zorunlu

## 9. İlgili dokümanlar

- `docs/crevia-real-device-playtest-round-1.md` — 16 playtest senaryosu
- `docs/crevia-internal-device-test-round-one.md` — Round 1 (20 test case) script
- `docs/crevia-manual-launch-blocker-tracker.md` — 51 manual blocker
- `docs/crevia-release-candidate-audit.md` — release readiness audit

## 10. Verify

```bash
npm run verify:real-device-playtest
npm run verify:manual-launch-tracker
npm run verify:release-candidate
npm run typecheck:tsc
```
