# Crevia Content Safety Pack — Aşama 3: Ece + Social + Report Echo Variations

## Amaç

Stage 1–2 event havuzunun oyun yüzeylerinde doğal yankılanması: Ece danışman satırı, Sosyal Nabız mention, gün sonu rapor echo ve yarın/carry-over hazırlık metinleri.

Verify: `npm run verify:content-safety-pack-stage-3`

## Stage 1 ve Stage 2 ile ilişki

Content pack eventlerindeki `advisorEchoText`, `socialEchoText`, `reportEchoText` korunur. Aşama 3 ayrı **echo template havuzu** (`eventEchoCopy.ts`) ve **deterministik selector** ile domain/mahalle/sonuç bandına göre varyasyon üretir.

## Event Writing Standard ile ilişki

Echo metinleri 8 katmanlı tonu destekler: trade-off, carry-over, sosyal/Ece/rapor yankısı; panik veya dayatmacı dil yok.

## Ece echo sistemi

`AdvisorEchoTemplate` — kısa, operasyonel, trade-off vurgulu. Day 1 `forbiddenInDay1` guard.

## Social mention echo sistemi

`SocialEchoTemplate` — mahalle/aktör tonu, kısa feed mention, skor iddiası yok.

## Report echo sistemi

`ReportEchoTemplate` — resmi-kısa gün sonu satırı, resource/social/district bölümleri.

## Tomorrow hint hazırlığı

`tomorrow_hint` surface — Carry-over Memory Cards / Report Tomorrow Preview için metin havuzu (bu patch UI eklemez).

## Domain coverage

container, vehicle, route, personnel, social, crisis_adjacent, district_balance, pilot_learning, pilot_final, generic_operation.

## Selection rules

- Domain + district + outcomeBand eşleşmesi
- Deterministic hash (`eventId`, `day`, `domain`) — `Math.random` yok
- Generic fallback
- Bundle içi duplicate cümle engeli

## Day 1 ve Day 7 safety rules

- Day 1: `forbiddenInDay1` template seçilmez
- Day 7: `allowInPilotFinal === false` template seçilmez
- Crisis: “henüz kriz değil” / önleyici sinyal tonu

## Neyi değiştirmez?

- SAVE_VERSION / persist
- applyDecision, dayPipeline, post-pilot engine
- Event generation algoritması ve cap
- Runtime AI, analytics SDK, IAP
- Yeni route/screen

## Runtime integration notu

Hafif entegrasyon: `buildReportTomorrowNoteFallback` echo tomorrow hint kullanabilir. Ece/Social tam UI bağlama sonraki **Event Domain UI Prioritization** patch’inde genişletilebilir.

## Sonraki prompt

**Crevia Event Domain UI Prioritization** (`event-domain-ui-prioritization`)
