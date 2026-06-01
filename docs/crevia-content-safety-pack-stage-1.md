# Crevia Content Safety Pack — Aşama 1: Mahalle + Konteyner Events

## Amaç

İçerik tekrarını azaltmak ve event kalitesini yükseltmek için ilk gerçek content pack. Yeni eventler **8 kalite katmanına** (`verify:event-writing-standard`) göre yazıldı.

Verify: `npm run verify:content-safety-pack-stage-1`

## Neden gerekli?

Mevcut pilot katalog audit ortalaması ~57 idi; carry-over ve echo katmanları zayıftı. Aşama 1 mahalle karakteri + konteyner operasyon çeşitliliğini hedefler.

## Event Writing Standard ile ilişki

Her şablon: mahalle bağlamı, somut saha, aktör, domain, bugünkü kazanç, trade-off, carry-over, sosyal/Ece/rapor echo alanları içerir. Pack audit hedefi: **ortalama ≥ 82**, **min ≥ 75**.

## Daily Theme Rhythm ile ilişki

- Gün 2 container teması için `preferredPilotDays: [2]` container eventleri
- Gün 1 ve 7 `avoidPilotDays` ile korunur
- Gün 3–6 için ek eventler planlanabilir

## Mahalle karakterleri

| Mahalle | Karakter |
| --- | --- |
| Merkez | Görünürlük, meydan/çarşı, hızlı tepki |
| Cumhuriyet | Konut, esnaf, apartman, konteyner şikayeti |
| Sanayi | Ağır atık, atölye, araç kapasitesi |
| İstasyon | Geçiş, akşam dalgası, rota çakışması |
| Yeşilvadi | Park/site, çevre hassasiyeti, düzen algısı |

## Konteyner olay türleri

İri atık, doluluk, koku, yanlış atık, gece bırakım, önleyici temizlik, sosyal görüntü, sokak daralması, esnaf/apartman şikayeti vb.

## Yeni event listesi

Kaynak: `src/core/contentPacks/neighborhoodContainerContentPack.ts` — **20 event** (5 mahalle × 4 ve 13 konteyner domain).

Örnek ID’ler: `csp1-cumhuriyet-iri-atik-sikisma`, `csp1-sanayi-agir-atik-hatti`, `csp1-yesilvadi-park-hassasiyet`.

## Audit score özeti

`npm run verify:content-safety-pack-stage-1` çıktısı güncel ortalama/min skorları raporlar. Hedef: ortalama ≥ 82, golden örnekler ≥ 90.

## Neyi değiştirmez?

- `applyDecision`, dayPipeline, post-pilot engine algoritması
- SAVE_VERSION / persist shape
- Harita, AI, analytics SDK, IAP
- Day 7 final event içerikleri (pack gün 2–6)

## Runtime integration notu

Aşama 1 eventleri `mergePilotCatalogWithContentSafetyPackStage1()` ile `ensureDailyEventsForDay` kataloğuna **kontrollü** eklendi. Event cap, idempotency ve generation algoritması aynı; yalnızca aday havuzu genişledi. Tam pool ayrıştırması ileride genişletilebilir.

## Sonraki prompt

**Crevia Content Safety Pack Aşama 2: Araç/Rota + Personel/Moral + Sosyal/Kriz Events** — `content-safety-pack-stage-2`
