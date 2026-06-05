# Crevia Soft Launch Readiness Review

Kapsamlı soft launch kalite raporu. Otomatik doğrulama: `npm run verify:soft-launch-review`.

Bu doküman **mevcut kod/verify durumunun dürüst özeti**dir; store dashboard işlemi yapılmış gibi işaretlenmez.

## Current readiness snapshot

| Boyut | Durum |
|-------|--------|
| İlk 10 dakika (Day 1) | Otomatik verify PASS; manuel playtest pending |
| Pilot Gün 1–7 | Full-loop PASS; post-pilot geçiş wired |
| Gün 8+ açık uçlu operasyon | Hub/Report/Result entegrasyonu; legacy dil taraması PASS |
| District runtime sistemleri | Trust/memory/operation action runtime-lite; map density capped |
| Content coverage | 5 pack, 80+ family, 300+ variant |
| Analytics | Schema + new-systems instrumentation PASS; dashboard/SDK manual |
| IAP | Adapter + fail-safe PASS; RC keys + smoke test **pending** |
| Performance | Selector WARN’ler listelenir; blocker değil |
| Release / store | Icon var; screenshots/listing/privacy/playtest **pending** |
| SAVE_VERSION | 23 (değişmedi) |

## What is ready

- Open-ended progression, hub/map/result/report/profile entegrasyonları
- 5 content pack (District, Vehicle Route, Container, Social Trust, Crisis Adjacent)
- Analytics runtime expansion (33+ instrumented events)
- Performance selector pass two (memo/skip guards)
- IAP sandbox readiness audit + smoke test matrix (kod tarafı)
- Full-loop ve full-ux-flow verify PASS

## What is blocked (launch candidate)

- RevenueCat public SDK keys yapılandırılmadı
- App Store Connect / Play Console ürünleri oluşturulmadı
- EAS dev build üzerinde IAP sandbox smoke test tamamlanmadı
- 4 profil gerçek cihaz playtest loglanmadı
- Store listing / privacy / screenshots manual

## Manual IAP / store actions

1. RevenueCat: entitlement `main_operation_full_access`, offering `default`
2. App Store: `crevia.main_operation.season1` (non-consumable)
3. Play Console: `crevia_main_operation_season_1`
4. EAS secrets: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `ANDROID_API_KEY`
5. `docs/crevia-iap-sandbox-smoke-test.md` smoke matrix (14 case)

## Real device playtest plan

`docs/crevia-player-flow-playtest-checklist.md`:

1. **Fresh pilot** — Day 1 tutorial, hub sade
2. **Pilot completion** — Day 7 → post-pilot offer
3. **Limited continue** — Day 8 sınırlı akış
4. **Full unlock (mock/sandbox)** — Hub full operasyon ipuçları

Platform: iOS + Android, küçük ekran + normal ekran.

## No-New-System Freeze criteria

Freeze yalnızca **blocker yokken** önerilir:

- [ ] Launch candidate blocker listesi temiz
- [ ] Gerçek cihaz playtest tamamlandı
- [ ] IAP sandbox smoke matrix tamamlandı
- [ ] Store listing + privacy hazır
- [ ] `verify:soft-launch-review` PASS (WARN kabul edilebilir)

Freeze sonrası: yalnızca bugfix, polish, store hazırlığı — yeni gameplay sistemi yok.

## Review modes

| Mode | Amaç | IAP store blocker |
|------|------|-------------------|
| `internal_device_test` | Oyun akışı QA | WARN (engel değil) |
| `iap_sandbox_test` | IAP smoke | BLOCKER if keys/setup missing |
| `launch_candidate` | Store submission prep | BLOCKER |
| `soft_launch_candidate` | Public soft launch | Zero blocker gerekli |

## Recommended next 5 prompts

1. **Crevia Real Device Playtest Pass** — 4 profil checklist ile iOS/Android smoke test logla.
2. **Crevia IAP Sandbox Smoke Test Pass** — EAS dev build üzerinde purchase/restore matrix tamamla.
3. **Crevia Store Listing & Privacy Pass** — App Store / Play metinleri ve data safety formu.
4. **Crevia Performance Selector Pass Aşama 3** — kalan broad selector risklerini daralt.
5. **Crevia No-New-System Freeze** — yalnızca bugfix, polish ve store hazırlığı patch’leri.

## Verify komutları

```bash
npm run verify:soft-launch-review
npm run verify:soft-launch-readiness
npm run verify:iap-sandbox-readiness
npm run verify:quality-audit
npm run verify:content-production
npm run verify:full-loop
npm run verify:full-ux-flow
```
