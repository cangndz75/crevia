# Crevia Event Writing Standard + Content Schema Audit

## Amaç

Event metinleri düz görev cümlesi değil; mahalle, somut saha, operasyon domain’i, trade-off ve yarına taşan etkiye bağlı yazılmalı. Bu doküman ve `src/core/contentQuality/` modülü **yazım standardı + audit helper** sağlar; yeni content pack bu patch’te eklenmez.

Verify: `npm run verify:event-writing-standard`

## Neden gerekli?

Pilot haftasında günler farklı hissedilmeli (Daily Theme Rhythm). İçerik kalitesi ölçülebilir olmalı ki Content Safety Pack aşamaları hedefli iyileştirme yapsın.

## İyi Crevia eventi nedir?

Oyuncu sahneyi görür, bugünkü kazancı ve bedeli anlar, yarın ve sosyal/rapor yankısını hisseder.

## Kötü event örnekleri

- "Cumhuriyet'te temizlik sorunu var."
- "Şehirde sorun var."
- "Bazı bölgelerde operasyon zor."

## Golden example: Cumhuriyet iri atık event’i

> Cumhuriyet'te gece bırakılan iri atıklar konteyner çevresini kapattı. Esnaf sabah saatlerinde yolu dar buluyor. Hızlı ekip gönderirsen şikayet düşer ama araç yorgunluğu artar. Önleyici rota yaparsan bugün daha az görünür sonuç alırsın ama yarın konteyner baskısı azalır.

Audit hedefi: **80+ skor, PASS**.

## 8 kalite katmanı

| Katman | Açıklama |
| --- | --- |
| district_context | Net mahalle/hat |
| concrete_scene | Somut saha görüntüsü |
| affected_actor | Esnaf, ekip, vatandaş vb. |
| operational_domain | Konteyner, araç, sosyal, kriz… |
| short_term_gain | Bugün ne düzelir |
| trade_off | Bedel / alternatif maliyet |
| carry_over | Yarına taşan etki |
| echo | Sosyal Nabız, Ece, rapor |

## Domain listesi

`container`, `vehicle`, `personnel`, `social`, `crisis`, `route`, `budget`, `district_balance`, `pilot_learning`, `pilot_final`, `post_pilot`

## Day 1 sade kalma kuralı

- Öğrenme tonu; fazla sistem/metrik yok.
- Generic “sorun var” FAIL.
- Trade-off / carry-over / echo eksikliği kısmen tolere (compact).

## Daily Theme Rhythm ile ilişki

`src/core/pilotRhythm/` gün teması presentation katmanıdır. Event yazımında gün 2 konteyner, gün 3 kaynak, gün 4 sosyal vb. domain vurgusu okunabilir olmalı; tema motoru değiştirilmez.

## Event option trade-off yazım kuralı

Her karar seçeneğinde farklı strateji; `contentShortTradeoff` veya description içinde “ama / fakat / bedeli” dili.

## Carry-over yazım kuralı

“Yarın”, “ertesi gün”, “sonraki gün” ile yarına risk/fayda.

## Social / Ece / Report echo yazım kuralı

“Sosyal Nabız’da yankılanır”, “raporda yarına risk”, “Ece … uyarır”.

## Audit score mantığı

- Toplam 100; katman ağırlıkları `eventWritingStandards.ts`
- **80+** PASS | **60–79** WARN | **&lt;60** FAIL
- Heuristics (keyword/phrase); NLP/AI yok
- Mevcut pilot katalog düşük skor → batch WARN beklenir (content pack öncesi)

## Bu patch neyi değiştirmez?

- Event generation (`generateDailyEventSet`, `pilotRhythmEngine`)
- `applyDecision`, dayPipeline, persist, SAVE_VERSION
- Yeni event pack, harita, AI, analytics SDK, IAP
- Post-pilot generation algoritması
- Gün 8+ post-pilot event içeriği (collector yalnızca örnek okur)

## Sonraki prompt

**Crevia Content Safety Pack Aşama 1: Mahalle + Konteyner Events** — `content-safety-pack-stage-1`

Bu patch’te yeni event eklenmedi; yalnızca standard + audit altyapısı kuruldu.
