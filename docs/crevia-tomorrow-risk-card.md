# Crevia Tomorrow Risk Card

## Amaç

Tomorrow Risk Card, gün sonunda ve yoğunluk uygunsa Hub'da yarına kalan tek sakin operasyon sinyalini gösterir. Sistem yeni gameplay üretmez; mevcut rapor, carry-over, operationSignals, resource fatigue, district trust/memory, social recovery ve post-pilot bağlamından presentation modeli üretir.

## Retention hedefi

Oyuncuya "bugünkü kararın yarın bir devamı var" hissi verir. Motivasyon şehir hafızası ve operasyon devamlılığıdır.

## FOMO olmayan ton

CTA dili ödül, seri, kaçırma veya baskı dili içermez. Uygun örnek: "Şehir yarına hazırlanıyor."

## Tomorrow risk kind listesi

- route_pressure_tomorrow
- container_pressure_tomorrow
- social_trust_recovery
- personnel_fatigue_watch
- vehicle_fatigue_watch
- district_trust_watch
- crisis_prevention_watch
- resource_balance_watch
- recovery_momentum
- operation_era_hint
- post_pilot_next_scope
- generic_city_preparation
- fallback

## Selection rules

Öncelik sırası: carry-over, tomorrow hint/report preview, operationSignals, resourceFatigue, districtTrust/districtMemory, social recovery, Day 7 post-pilot next scope, Day 8+ operation era, fallback.

## Report entegrasyonu

`EndOfDayReportView` mevcut `ReportTomorrowPreviewCard` sistemini korur. `ReportTomorrowRiskCard`, systems integration kartından sonra render edilir ve existing lines listesine preview/carry-over/social/system satırları eklenerek duplicate baskılanır.

## Hub entegrasyonu

`HubScreen` runtime-only modeli üretir ve `HubReferenceHome` içinde `HubTomorrowRiskStrip` olarak kompakt gösterir. Fallback Hub'da gösterilmez; carry-over, high priority veya Day 8+ operation era gibi belirgin sinyal gerekir.

## Duplicate guard

Same text/similar text için normalize edilmiş satır karşılaştırması yapılır. Report ve Hub mevcut carry-over, preview, social echo ve operation action satırlarını `existingLines` olarak verir.

## Day bazlı visibility

Day 1 gizli. Day 2-6 report'ta en fazla tek ana sinyal. Day 7 post-pilot geçiş dili desteklenir. Day 8+ operation era compact Hub sinyali gösterebilir.

## Non-goals

- Yeni gameplay sistemi kurma
- `applyDecision` değiştirme
- Event generation algoritmasını değiştirme
- Persistence ekleme
- `SAVE_VERSION` artırma
- Push notification ekleme
- Daily reward/FOMO sistemi ekleme
- Monetization CTA ekleme
- AI kullanma
- Büyük UI redesign yapma
- Yeni route ekleme

## Verify sonucu

Beklenen komutlar:

- `npm run typecheck`
- `npm run verify:tomorrow-risk`
- `npm run verify:report-tomorrow-preview`
- `npm run verify:report-ui`
- `npm run verify:report-systems-integration`
- `npm run verify:carry-over-memory`
- `npm run verify:hub-ui`
- `npm run verify:full-loop`
- `npm run verify:full-ux-flow`

## Sonraki önerilen prompt

Tomorrow Risk Card Pass Aşama 2: yalnızca mevcut analytics schema uygunsa `tomorrow_risk_card_shown` ve `tomorrow_risk_cta_seen` eventlerini mevcut runtime analytics pattern'iyle ekle; schema freeze varsa sadece dokümantasyon önerisi olarak bırak.
