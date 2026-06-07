# Crevia Store Screenshot Narrative Pack — Aşama 1

## 1. Amaç

App Store ve Google Play ekran görüntülerini yalnızca “ekran gösterimi” olmaktan çıkarıp, oyuncuya Crevia’nın vaadini anlatan güçlü bir mağaza hikâyesine dönüştürmek. Bu pass **narrative order**, **TR/EN caption**, **capture scenario seed planı**, **device matrix** ve **compliance guard** tanımlar — gerçek screenshot dosyası üretmez.

## 2. Neden şimdi gerekli

Public launch manuel blocker’lar nedeniyle blocked. Screenshot blocker (`store_screenshots_captured`) evidence olmadan kapanmıyor. Narrative pack, capture ekibine hangi ekranın hangi mesajla, hangi gün state’inde çekileceğini netleştirir.

## 3. Screenshot narrative order

| # | ID | Ekran | TR Başlık | EN Başlık |
|---|-----|-------|-----------|-----------|
| 1 | ssn_hub_operations | Merkez / Operasyon Masası | Şehri Bugün Sen Yönet | Run Today's City Operations |
| 2 | ssn_decision_plan | Karar Ver / Planla | Karar Ver, Etkisini Gör | Make Decisions That Matter |
| 3 | ssn_decision_impact | Sonuç / Neden Böyle Oldu? | Neden Böyle Oldu? | See Why It Happened |
| 4 | ssn_map_neighborhood | Harita / Mahalle | Mahalleler Tepki Verir | Neighborhoods React |
| 5 | ssn_social_pulse | Sosyal Nabız | Sosyal Nabzı Oku | Read the City's Pulse |
| 6 | ssn_end_of_day_report | Gün Sonu Raporu | Günün Etkisini Gör | Review the Day's Impact |
| 7 | ssn_main_operation | Ana Operasyon Day 8+ | Ana Operasyon Başladı | The Main Operation Begins |
| 8 | ssn_profile_career | Profil / Kariyer | Kariyerini Büyüt | Grow Your Civic Career |
| 9* | ssn_operational_resources | Ekip & Araç | Ekip ve Araçları Dengele | Balance Teams and Vehicles |
| 10* | ssn_city_journal | Şehir Günlüğü | Şehrin Bir Hafızası Var | The City Remembers |

\* Opsiyonel — store minimum 8 için zorunlu değil.

## 4. TR captions

| # | Başlık | Alt satır |
|---|--------|-----------|
| 1 | Şehri Bugün Sen Yönet | Operasyon masasından günlük kararları planla. |
| 2 | Karar Ver, Etkisini Gör | Her karar kısa vadeli etki ve yarına risk taşır. |
| 3 | Neden Böyle Oldu? | Crevia kararını açıklar; rastgele sonuç vermez. |
| 4 | Mahalleler Tepki Verir | Haritada seçili mahalle ve tepki izleri. |
| 5 | Sosyal Nabzı Oku | Halk sahadaki değişimi fark eder. |
| 6 | Günün Etkisini Gör | Rapor, yarın riski ve şehir günlüğü bir arada. |
| 7 | Ana Operasyon Başladı | Pilot biter; şehir kapsamı büyür. |
| 8 | Kariyerini Büyüt | Yetki, rozetler ve operatör kimliği. |
| 9 | Ekip ve Araçları Dengele | Saha kaynakları operasyonu taşır. |
| 10 | Şehrin Bir Hafızası Var | Şehir günlüğü kararlarını hatırlar. |

## 5. EN captions

| # | Headline | Subtitle |
|---|----------|----------|
| 1 | Run Today's City Operations | Plan daily decisions from your operations desk. |
| 2 | Make Decisions That Matter | Every choice carries impact and tomorrow risk. |
| 3 | See Why It Happened | Crevia explains your decision — not random results. |
| 4 | Neighborhoods React | Selected districts and reactions on the map. |
| 5 | Read the City's Pulse | Citizens notice changes in the field. |
| 6 | Review the Day's Impact | Report, tomorrow risk, and city journal together. |
| 7 | The Main Operation Begins | After the pilot, the city scope expands. |
| 8 | Grow Your Civic Career | Authority, badges, and operator identity. |
| 9 | Balance Teams and Vehicles | Field resources carry the operation. |
| 10 | The City Remembers | The city journal remembers your decisions. |

## 6. Capture scenario states

### A) Day 1 — `state_day1`

- Tutorial sade; Hub temiz; ilk karar flow; Decision Impact compact; report compact.
- Screenshots: 1, 2, 3.

### B) Day 5 — `state_day5`

- Pilot derinleşmiş; mahalle/trust sinyali; Ece bilinçli; Sosyal Nabız aktif.
- Screenshots: 4, 5, 6.

### C) Day 8+ — `state_day8`

- Main Operation Feel; pack-origin event; Mahalle Karnesi; Map Reaction; Ekip & Araç; Şehir Günlüğü; Tomorrow Risk.
- Screenshots: 7, 4, 6, 9, 10.

### D) Profile — `state_profile`

- Authority/career showcase; badge showcase; operator identity; fake achievement yok.
- Screenshot: 8.

**Devtools:** Bu pass’te yeni devtools route eklenmedi. Capture için mevcut internal save veya doğal oynanış kullanın; fake data runtime’a sızmasın.

## 7. Device matrix

| Platform | Profil | Not |
|----------|--------|-----|
| iOS | 6.7" (primary) | App Store ana phone set |
| iOS | 6.5" | ASC gereksinimine göre doğrula |
| iOS | 5.5" | Opsiyonel legacy — backlog |
| Android | Phone portrait | Play Console min 1080px kısa kenar |
| Android | Tablet | V1.1 backlog |

**Density:** TR başlık ≤28 karakter (6.7"), EN ≤32 karakter önerilir. Safe area: notch + tab bar; headline üst bandda. Küçük ekranda subtitle 2 satırı geçmesin.

## 8. Visual direction

- **UI:** Premium light — cream arka plan, teal/mint accent, dark teal CTA, yumuşak kartlar.
- **Overlay:** Üstte kısa headline, tek subtitle, ortada native screenshot veya phone mockup, cream/mint gradient arka plan.
- **Kaçın:** Kamu paneli hissi, chip kalabalığı, dashboard yoğunluğu.

## 9. False claim guard

Yasaklı ifadeler (TR/EN overlay’de kullanılmaz):

- Gerçek zamanlı GPS / canlı şehir / yapay zeka ile yönet
- Online oyuncular / gerçek belediye verisi / resmi belediye uygulaması
- Sınırsız operasyon / kazanmak için satın al / premium kilidi aç
- Krizi durdur yoksa kaybedersin / FOMO / panic dili

Audit: `scanNarrativeCopyForViolations` — evidence olmadan `captured`/`verified` işaretlenmez (`fakePassGuard: true`).

## 10. Store readiness integration

| Modül | Bağlantı |
|-------|----------|
| `storeScreenshotReadiness` | `narrativePackId`, `narrativePackStatus`, `narrativeDocsPath` |
| `storeMetadataFinalization` | nextActions → narrative docs link |
| `releaseCandidate` | `store_screenshots_captured` blocker pending |
| `manualLaunchTracker` | screenshot evidence verified = 0 |

**Durum:** Narrative `ready_for_capture`; gerçek capture `pending`; public launch `blocked`.

## 11. Evidence requirements

Her required screenshot için:

- `evidenceType: screenshot` + `store_console` (yüklenince)
- `manualLaunchTracker` → `store_screenshots_captured` blocker
- Verified evidence olmadan blocker `done` olamaz

## 12. Non-goals

- Gameplay sistemi ekleme
- Screenshot dosyası üretme veya fake evidence
- IAP/store/privacy blocker kapatma
- SAVE_VERSION / persist / applyDecision / dayPipeline / event generation değişikliği
- Yeni route / büyük UI redesign

## 13. Verify sonucu

Çalıştır: `npm run verify:store-screenshot-narrative`

Beklenti: exit 0; tüm item `captureStatus: pending`; `verifiedCaptureCount: 0`; copy guard PASS.

## 14. Sonraki önerilen prompt

> Store Screenshot Narrative Pack Aşama 2: iOS 6.7" ve Android phone üzerinde 8 required screenshot capture session'ı yap; TR/EN overlay export; evidence'ı manual launch tracker'a attach et; `store_screenshots_captured` blocker'ı yalnızca verified evidence ile güncelle.

## 15. Çalıştırılacak komutlar

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
