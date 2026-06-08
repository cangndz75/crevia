# Crevia Store Screenshot Narrative Pack - Aşama 1

## 1. Amaç

Crevia'nın App Store ve Google Play ekran görüntülerini yalnızca ekran gösterimi olmaktan çıkarıp, oyunun vaadini 5-9 görselde anlatan net bir mağaza hikayesine dönüştürmek.

Bu pass narrative order, TR/EN başlıklar, kısa caption copy, capture scenario state'leri, device/crop notları, false-claim guard ve readiness bağlantısını tamamlar. Gerçek screenshot dosyası üretmez.

## 2. Neden şimdi gerekli

Public launch halen manuel blocker'lar nedeniyle blocked. Screenshot blocker'ı gerçek capture ve store-console evidence olmadan kapanmamalı.

Bu pack capture ekibine şu soruları net yanıtlar:

- Hangi ekran hangi sırada kullanılacak?
- TR/EN overlay metni ne olacak?
- Ekran hangi oyun gününde ve hangi state ile çekilecek?
- Hangi iddialardan kaçınılacak?
- Hangi evidence olmadan launch blocker açık kalacak?

## 3. Dirty worktree stabilization

Bu görevden önce aşağıdaki dosyalar dirty/WIP durumdaydı ve bu pass içinde stabilize edildi:

- `docs/crevia-store-screenshot-narrative-pack.md`
- `src/core/storeScreenshotNarrative/*`
- `package.json` içindeki `verify:store-screenshot-narrative` bağlantısı

Stabilizasyon kararları:

- Constants source of truth kabul edildi; docs onu açıklar.
- Eski narrative sırada eksik olan onboarding item ilk sıraya eklendi.
- Eski kesin dimension iddiaları kaldırıldı; resmi console check required notuna çevrildi.
- Capture status kod içinde `pending` kaldı.
- Store screenshot blocker kapanmadı.
- `SAVE_VERSION`, persist shape, `applyDecision`, `dayPipeline`, event generation ve route yapısı değiştirilmedi.

## 4. Screenshot narrative order

| # | ID | Surface | TR title | EN title | Status |
|---|----|---------|----------|----------|--------|
| 1 | `ssn_onboarding_entry` | Onboarding / Şehre İlk Giriş | Şehre İlk Adımını At | Step Into City Operations | required, pending |
| 2 | `ssn_hub_operations` | Merkez / Operasyon Masası | Şehri Bugün Sen Yönet | Run Today's City Operations | required, pending |
| 3 | `ssn_decision_plan` | Karar Ver / Planla | Karar Ver, Etkisini Gör | Make Decisions That Matter | required, pending |
| 4 | `ssn_decision_impact` | Sonuç / Neden Böyle Oldu? | Neden Böyle Oldu? | See Why It Happened | required, pending |
| 5 | `ssn_map_neighborhood` | Harita / Mahalle Tepkileri | Mahalleler Tepki Verir | Neighborhoods React | required, pending |
| 6 | `ssn_social_pulse` | Sosyal Nabız | Sosyal Nabzı Oku | Read the City's Pulse | required, pending |
| 7 | `ssn_end_of_day_report` | Gün Sonu Raporu | Günün Etkisini Gör | Review the Day's Impact | required, pending |
| 8 | `ssn_main_operation` | Ana Operasyon / Day 8+ | Ana Operasyon Başladı | The Main Operation Begins | required, pending |
| 9 | `ssn_ece_advisor` | Ece / Operasyonel İlişki | Ece Karar Tarzını Tanır | Ece Learns Your Style | required, pending |
| 10 | `ssn_profile_career` | Profil / Kariyer / Yetki | Kariyerini Büyüt | Grow Your Civic Career | optional, pending |
| 11 | `ssn_operational_resources` | Ekip & Araç / Saha Kaynakları | Ekip ve Araçları Dengele | Balance Teams and Vehicles | optional, pending |

## 5. TR captions

| # | Başlık | Alt satır |
|---|--------|-----------|
| 1 | Şehre İlk Adımını At | Ece seni pilot operasyona hazırlar. |
| 2 | Şehri Bugün Sen Yönet | Ece, riskler ve saha kaynakları aynı merkezde. |
| 3 | Karar Ver, Etkisini Gör | Kısa vadeli etki ile yarına kalan riski dengele. |
| 4 | Neden Böyle Oldu? | Kararın güven, kaynak ve mahalle etkisini açıkça gör. |
| 5 | Mahalleler Tepki Verir | Risk, toparlanma ve saha kapasitesi haritada görünür. |
| 6 | Sosyal Nabzı Oku | Mahalleler kararlarının etkisini konuşur. |
| 7 | Günün Etkisini Gör | Raporlar kararlarını, riskleri ve toparlanmayı hatırlar. |
| 8 | Ana Operasyon Başladı | Pilot biter, şehir daha geniş sorumluluk ister. |
| 9 | Ece Karar Tarzını Tanır | Önceki kararlarını ve mahalle sinyallerini birlikte yorumlar. |
| 10 | Kariyerini Büyüt | Yetki, rozet ve şehirde bıraktığın iz gelişir. |
| 11 | Ekip ve Araçları Dengele | Saha kapasitesi kararlarının gerçek ağırlığını gösterir. |

## 6. EN captions

| # | Headline | Subtitle |
|---|----------|----------|
| 1 | Step Into City Operations | Ece prepares you for the pilot operation. |
| 2 | Run Today's City Operations | Advisor notes, risks and field resources in one place. |
| 3 | Make Decisions That Matter | Balance short-term impact and tomorrow's risk. |
| 4 | See Why It Happened | Understand trust, resource and neighborhood impact. |
| 5 | Neighborhoods React | Risks, recovery and field capacity appear on the map. |
| 6 | Read the City's Pulse | Neighborhoods respond to your decisions. |
| 7 | Review the Day's Impact | Reports remember decisions, risks and recovery. |
| 8 | The Main Operation Begins | The pilot ends and the city opens wider. |
| 9 | Ece Learns Your Style | She connects your decisions with neighborhood signals. |
| 10 | Grow Your Civic Career | Build authority, badges and your city legacy. |
| 11 | Balance Teams and Vehicles | Field capacity gives weight to every decision. |

## 7. Capture scenario states

### Day 1 onboarding and first decision

- Onboarding 7-step continuation incomplete or newly completed.
- 5 presentation districts may be visible.
- Gameplay district mapping must not be shown.
- Hub stays simple.
- First decision/result/report flow can be captured.
- Heavy systems stay hidden or minimal.

### Day 5 pilot depth

- Pilot has social/trust signals.
- Ece is more observant.
- Social Pulse is active.
- Reward/recovery can appear only as a small truthful game signal.
- Map and report can show neighborhood impact.

### Day 8 main operation

- Main Operation Feel is active.
- Map reactions, district report, resources, city journal and advisor relationship can be visible.
- Store copy must describe this as wider city responsibility, not as a submitted live-service promise.

### Profile career evidence

- Authority/badge state must come from real progression.
- If there is not enough progression, profile stays optional.
- No fake achievement, official rank, certification or real-world authority claim.

### Store console and privacy metadata check

- Official App Store Connect and Play Console requirements must be checked manually before final capture/export.
- Privacy URL and Data safety remain separate blockers.

## 8. Device matrix

| Platform | Device class | Priority | Notes |
|----------|--------------|----------|-------|
| iOS | iPhone large display | must | Primary phone capture. Check App Store Connect accepted screenshot specs before export. |
| iOS | iPhone medium/small display | should | Check TR subtitle wrap and notch crop. |
| iOS | iPad/tablet | optional | Backlog unless tablet listing assets are required. |
| Android | Android phone | must | Primary Play capture. Check Play Console preview asset requirements before export. |
| Android | Low-end/small Android phone | should | Check density, bottom navigation and text length. |
| Android | Android tablet | optional | Backlog; do not imply tablet evidence until captured. |

Official references checked on 2026-06-07:

- Apple screenshot specifications: https://developer.apple.com/help/app-store-connect/reference/screenshot-specifications
- Apple app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Google Play preview assets: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en

Exact screenshot dimensions must be verified in App Store Connect and Play Console during capture QA. Do not treat this narrative pack as a dimension source.

## 9. Visual direction

- Short headline at the top.
- One short subtitle below.
- Phone screenshot centered or lower in a rounded frame.
- Cream/mint soft gradient background.
- Dark teal headline/CTA contrast.
- Gold only as restrained accent.
- Premium mobile game feeling, not corporate dashboard.
- Avoid crowded chips, tiny text, panic language and dark store mood.

## 10. False claim guard

Forbidden or misleading claims:

- Real-time GPS or live tracking
- AI-managed operations
- Online players or multiplayer
- Real municipality data
- Official municipality app
- Real city data
- Unlimited/free-everything claims
- Buy-to-win or premium unlock pressure
- Guaranteed success
- Fake screenshot capture or verified evidence
- Five onboarding presentation districts as new gameplay district types
- Reward/comeback as economy reward

Audit guard:

- `fakePassGuard: true`
- all `captureStatus: pending`
- `verifiedCaptureCount: 0`
- false-claim scanner must pass before `ready_for_capture`

## 11. Store readiness integration

Connected modules:

- `storeScreenshotReadiness` reads `narrativePackId`, `narrativePackStatus`, and `narrativeDocsPath`.
- `storeMetadataFinalization` points to this narrative doc in next actions.
- `releaseCandidate` keeps screenshot blockers open.
- `manualLaunchTracker` requires screenshot and store-console evidence before closure.

Expected status after this pass:

- Narrative pack: `ready_for_capture`
- Actual screenshots: `pending`
- Verified screenshot evidence: `0`
- Public launch: `blocked`
- Store screenshot blocker: still open

## 12. Evidence requirements

Required screenshots need:

- real screenshot export
- device/platform note
- visual QA note
- store-console evidence where required
- manual launch tracker attachment

Evidence that does not exist must not be represented as captured, verified or submitted.

## 13. Non-goals

- No gameplay system.
- No screenshot capture.
- No fake evidence.
- No IAP/store/privacy blocker closure.
- No App Store or Play Console submitted claim.
- No `SAVE_VERSION` bump.
- No persist shape change.
- No `applyDecision` change.
- No `dayPipeline` change.
- No event generation change.
- No new route.
- No large UI redesign.
- No AI, Remote Config or Live-Ops enablement.
- No final store listing submitted status.

## 14. Verify sonucu

Expected commands:

```bash
npm run typecheck
npm run verify:store-screenshot-narrative
npm run verify:store-screenshot-readiness
npm run verify:store-metadata-finalization
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```

Expected result:

- scripts exit 0
- narrative status `ready_for_capture`
- actual capture remains pending
- verified evidence can remain 0
- public launch remains blocked
- no fake pass

## 15. Sonraki önerilen prompt

Store Screenshot Narrative Pack Aşama 2: iOS large phone and Android phone üzerinde 9 required screenshot capture session yap; TR/EN overlay export et; evidence'ı manual launch tracker'a attach et; `store_screenshots_captured` blocker'ını yalnızca verified evidence ile güncelle.

## 16. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:store-screenshot-narrative
npm run verify:store-screenshot-readiness
npm run verify:store-metadata-finalization
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```

## 17. Remaining manual actions

- Capture the 9 required screenshots on real target devices or validated emulator profiles.
- Export TR/EN overlay assets.
- Run official App Store Connect screenshot validation.
- Run official Play Console preview asset validation.
- Complete privacy URL and app privacy answers.
- Complete Google Play Data safety form.
- Attach evidence in manual launch tracker.
- Keep public launch blocked until real evidence exists.
