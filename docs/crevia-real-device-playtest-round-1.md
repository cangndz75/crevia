# Crevia Real Device Playtest — Round 1

## Test amacı

Soft Launch Readiness Review Aşama 1 sonucu: **internal_device_test → proceed_internal_test** (kod/verify hazır). Bu round gerçek cihazda oyuncu deneyimini doğrular. **Gerçek IAP satın alma smoke testi ayrı aşamadadır** (`docs/crevia-iap-sandbox-smoke-test.md`).

Otomatik plan doğrulama: `npm run verify:real-device-playtest`

**QA evidence şablonu (iOS/Android checklist + attach format):** `docs/crevia-real-device-qa-evidence-round-1.md`

## Cihaz matrisi

| Profil | Gereksinim | Not |
|--------|------------|-----|
| Android küçük ekran | Zorunlu | ≤5.8" telefon |
| Android orta ekran | Zorunlu | 6.1–6.5" |
| Düşük/orta segment Android | Zorunlu | Gerçek mid-range cihaz |
| iOS küçük ekran | Zorunlu | SE / mini sınıfı |
| iOS orta/büyük ekran | Zorunlu | Standart iPhone |
| Gerçek iPhone | Zorunlu | Fiziksel cihaz |

Emulator/simulator destekleyici olabilir; **real device playtest yerine geçmez**.

## Playtest alanları (12)

1. **Install / Launch / Fresh Start** — crash, offline, state normalize
2. **First 10 Minutes** — hub sade, guide, ilk event yönlendirme
3. **Event Flow** — İncele→Planla→Yönlendir→Sahada→Sonuç
4. **Assignment / Active Route** — GPS vaadi yok, operasyonel rota
5. **Map** — district intelligence, overlay, küçük ekran taşması
6. **Result Screen** — impact, systems echo, carry-over
7. **End-of-Day Report** — yoğunluk, scroll, systems card
8. **Hub Day 2+** — carry-over, open-ended strip, kart sırası
9. **Day 7 / Post-Pilot Offer** — pilot completion, teklif dili
10. **Day 8+ Open-Ended** — era preview, story hint, operation action
11. **Profile / Career** — rank, next unlock, duplicate yok
12. **Performance / Device UX** — jank, safe area, back stack

## Senaryo listesi (16)

| # | ID | Senaryo |
|---|-----|---------|
| 1 | `rdp.fresh_day1_first_result` | Fresh install → Day 1 first event result |
| 2 | `rdp.day1_full_report` | Day 1 full report |
| 3 | `rdp.day2_carry_over` | Day 2 carry-over memory |
| 4 | `rdp.day3_assignment_route` | Day 3 assignment + route preview |
| 5 | `rdp.day4_map_intelligence` | Day 4 map district intelligence |
| 6 | `rdp.day5_district_operation_action` | Day 5 district operation action |
| 7 | `rdp.day6_crisis_calm_language` | Day 6 crisis-adjacent calm language |
| 8 | `rdp.day7_pilot_completion` | Day 7 pilot completion |
| 9 | `rdp.day8_limited_mode` | Day 8 limited mode |
| 10 | `rdp.day8_full_mock` | Day 8 full mock/dev path |
| 11 | `rdp.profile_career` | Profile career showcase |
| 12 | `rdp.social_report_echo` | Social Pulse + report echo |
| 13 | `rdp.offline_open` | Offline app open |
| 14 | `rdp.background_foreground` | Background/foreground |
| 15 | `rdp.restart_after_report` | Restart after report |
| 16 | `rdp.navigation_back_stack` | Navigation back-stack sanity |

## Gözlem formu (her senaryo)

| Alan | Açıklama |
|------|----------|
| scenarioId | Senaryo kimliği |
| deviceProfile | Test cihazı profili |
| startState | Başlangıç durumu |
| steps | Adımlar + watchFor |
| expectedResult | Beklenen sonuç |
| observedResult | Gözlemlenen sonuç |
| severity | blocker / high / medium / low / polish |
| screenshotNeeded | Ekran görüntüsü gerekli mi |
| videoNeeded | Video gerekli mi |
| owner | qa / design / engineering |
| fixRecommendation | Düzeltme önerisi |
| relatedVerifyScript | İlgili verify komutu |

Şablonlar kodda: `buildRealDeviceObservationTemplate()` — `src/core/playtest/realDevicePlaytestPlan.ts`

## Risk sınıfları

### Blocker

- crash, save corrupt, purchase flow crash
- main event flow stuck
- Day 7→8 geçiş bozuk
- player-facing oyun sonu / sezon finali / 14 gün bitti
- gerçek GPS / kesin takip iddiası
- IAP yanlış unlock state

### High

- ana CTA belirsiz
- hub/map/report okunamaz kalabalık
- assignment flow karışıklığı
- result impact anlaşılmıyor
- large text overflow

### Medium

- fazla metin, tekrar eden echo, küçük taşma, zayıf tone

### Low / Polish

- microcopy, spacing, icon, animasyon

## Screenshot / video gereksinimleri

- **Screenshot zorunlu:** Day 1 hub, Day 1 report, Day 3 route, Day 4 map, Day 7 completion, Day 8 hub, profile
- **Video önerilen:** Day 3 assignment flow, Day 7 completion, background/foreground, back-stack
- Blocker veya high bulguda mutlaka screenshot + kısa video

## Test sonrası karar kriteri

| Sonuç | Karar |
|-------|--------|
| Plan + docs var, test başlamadı | `ready_for_internal_device_test` |
| Test devam ediyor | `continue_manual_playtest` |
| Blocker gözlem | `fix_required_before_iap_sandbox` |
| Launch candidate (test tamamlanmadan) | `blocked_for_release_candidate` |

**Launch candidate ready olmaz** ta ki tüm senaryolar loglanana ve blocker temizlenene kadar.

## Sonraki prompt önerileri

1. **Crevia Real Device Playtest Results Log Pass** — Round 1 observation sheet'leri repo dışı QA log'a aktar.
2. **Crevia IAP Sandbox Smoke Test Pass** — EAS dev build purchase/restore matrix.
3. **Crevia Playtest Fix Pass** — blocker/high bulgular için minimal polish patch.
4. **Crevia Store Listing & Privacy Pass**
5. **Crevia No-New-System Freeze**

## Verify

```bash
npm run verify:real-device-playtest
npm run verify:soft-launch-review
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```
