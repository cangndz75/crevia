# Crevia Internal Device Test — Round 1

## 1. Amaç

Release Candidate Aşama 1.1 evidence log sistemini gerçek cihazda kullanılabilir hale getirmek. Round 1, **Day 1 first session** ve **Day 8 pack-origin ana operasyon** akışına odaklanır. Fake PASS yok — evidence `verified` olmadan test PASS sayılmaz.

Kod kaynağı: `src/core/manualLaunchTracker/manualLaunchRoundOneConstants.ts`  
Verify: `npm run verify:manual-launch-tracker`

## 2. Round 1 kapsamı

| Scope | İçerik |
|-------|--------|
| A) Build readiness | EAS internal build, install smoke iOS/Android, offline launch |
| B) Day 1 first session | Hub sade, event, decision, report, hub return |
| C) Day 8 pack-origin | Main Operation Feel, pack-origin event, systems echo, map, journal, resources |
| D) Resume smoke | Day 5 mid-event, Day 8 report close/reopen |
| E) UI density | Large text — Hub, Map, DecisionResult, Report |
| F) Sentry (conditional) | Dashboard smoke — yalnızca DSN/env hazırsa |

**20 test case** — tümü başlangıçta `pending`, `verifiedEvidence=0`.

## 3. Build checklist

1. `eas build --profile internal` iOS + Android
2. `build_log` + `manual_note` evidence (gerçek build sonrası)
3. Fiziksel cihaza install — screenshot
4. Version/build number kaydı (SAVE_VERSION 23 ile uyumlu app version)

EAS checklist: `manualLaunchEvidenceConstants.ts` → `buildEasInternalBuildChecklistTemplate()`

## 4. Day 1 test script

**Önkoşul:** Fresh install veya temiz save, Day 1.

| Adım | Kontrol |
|------|---------|
| Cold launch | Crash yok |
| Hub | Max 2 featured kart, guide strip |
| Gizli kalmalı | Crisis, PostPilot, Main Operation, ağır Şehir Günlüğü |
| İlk event | Akış takılmıyor |
| Decision result | Decision Impact sade; Tomorrow Risk sakin dil |
| Report | Compact; CTA görünür |
| Hub dönüş | State temiz |

**Evidence:** `screenshot` + `screen_recording` per platform.

## 5. Day 8 pack-origin test script

**Önkoşul:** Day 7 tamamlandı veya dev seed ile Day 8.

| Adım | Kontrol |
|------|---------|
| Day 7→8 geçiş | False game-over yok |
| Main Operation Feel | Kart görünür; teknik pack adı UI’da yok |
| Pack-origin event | PostPilotEventContextChip player-facing; max caps |
| Decision result | Pack-specific Decision Impact + Tomorrow Risk |
| Report echo | City Echo / Social / Report duplicate değil |
| Map | District seçimi + Map Reaction ≤4 |
| Mahalle Karnesi | Selected district anlamlı |
| Şehir Günlüğü | ≤5 entry; Hub’da ≤2 surfacing |
| Ekip & Araç | Presence-lite; tekil roster yok |
| Report resume | Kill/reopen sonrası state korunur |

**Evidence:** `screenshot` her kritik ekran; resume için `screen_recording`.

## 6. Resume test script

- **Day 5:** Event ortasında (Planla vb.) → background/kill → reopen → aynı faz
- **Day 8:** Report açıkken kill → reopen → report + hub tutarlı

**Evidence:** `screen_recording` + `manual_note`

## 7. Large text test script

Cihaz: iPhone SE / küçük Android. Sistem **Büyük Yazı / Large Text** açık.

Ekranlar: Hub scroll, Map bottom panel, DecisionResult, End-of-day report.

**PASS:** CTA tıklanabilir; kritik metin kesilmiyor.  
**Evidence:** `screenshot` per ekran.

## 8. Sentry smoke conditional test

**Önkoşul:** `EXPO_PUBLIC_SENTRY_DSN` set + `EXPO_PUBLIC_CRASH_REPORTING_ENABLED=true` + internal build.

DSN yoksa test `skipped` — PASS verilmez.

1. Internal crash test butonu
2. Sentry dashboard’da event
3. environment, release, screen breadcrumb, safe context

**PASS:** `dashboard_event` **verified** + PII/raw save/event body yok.  
**Evidence:** `dashboard_event`, `screenshot`, `manual_note`

## 9. Evidence attach formatı

Manuel attach (repo dışı veya `docs/evidence/` — **gerçek dosya olmadan tracker verified olmaz**):

```json
{
  "evidenceId": "ev_day8_pack_origin_ios_001",
  "testCaseId": "day8_pack_origin_event_appears",
  "blockerId": "day8_pack_origin_event_smoke",
  "platform": "ios",
  "buildProfile": "internal",
  "appVersion": "1.0.0",
  "buildNumber": "23",
  "evidenceType": "screenshot",
  "evidenceLocation": "docs/evidence/ios/day8-pack-origin.png",
  "evidenceSummary": "Day 8 pack-origin event visible with player-facing chip.",
  "testerNote": "iPhone 15, internal build 23",
  "status": "attached",
  "fakePassGuard": true
}
```

Alanlar: `testCaseId`, `platform`, `buildProfile`, `appVersion`, `buildNumber`, `evidenceType`, `evidenceLocation`, `evidenceSummary`, `testerNote`, `verifiedBy`, `verifiedAt`.

**Önemli:** Yukarıdaki örnek şablondur. Repo’da dosya yoksa tracker `missing` kalır. `attached` ≠ blocker done; `verified` gerekir.

## 10. PASS / FAIL kriterleri

| Durum | Koşul |
|-------|--------|
| PASS | Tüm `passCriteria` karşılandı + gerekli evidence **verified** |
| PENDING | Test yapılmadı veya evidence missing/attached |
| BLOCKED | Fail criteria veya rejected evidence |
| SKIPPED | Sentry test — env hazır değil |

`manual_note` tek başına public launch blocker kapatmaz.

## 11. Fake PASS guard

- `canPassWithoutEvidence: false` tüm round ve test case’lerde
- `fakePassGuard: true` tüm evidence kayıtlarında
- Verify: `verifiedEvidence === 0` iken tüm testler pending
- Blocker `done` yalnızca `canCloseBlockerWithEvidence` + verified types

## 12. Sonraki manuel adımlar

1. Internal EAS build al (iOS + Android)
2. Round 1 Day 1 script — 2 platform
3. Round 1 Day 8 pack-origin script — 2 platform
4. Large text + offline smoke
5. DSN set edildikten sonra Sentry dashboard smoke
6. Evidence dosyalarını ekle; QA lead `verified` işaretlesin

## 13. Typecheck (release gate)

Round 1 cihaz testine geçmeden önce `npm run typecheck` PASS olmalı. Expo Router typed routes bozulursa: `npm run regenerate:expo-router-types`.

## 14. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:manual-launch-tracker
npm run verify:release-candidate
npm run verify:soft-launch-regression-cleanup
npm run verify:crash-performance
npm run verify:first-10-minutes
npm run verify:offline-resume
npm run verify:ui-density
npm run verify:map-reactions
npm run verify:content-runtime-activation
npm run verify:full-loop
npm run verify:full-ux-flow
```

İlgili playtest notları: `docs/crevia-real-device-playtest-round-1.md`
