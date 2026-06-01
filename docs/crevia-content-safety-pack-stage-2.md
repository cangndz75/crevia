# Crevia Content Safety Pack — Aşama 2: Araç/Rota + Personel/Moral + Sosyal/Kriz Events

## Amaç

Aşama 1 mahalle + konteyner çeşitliliğini tamamlayan operasyon paketi: araç/rota, personel/moral, sosyal nabız ve kriz-adjacent (önleyici sinyal) eventleri.

Verify: `npm run verify:content-safety-pack-stage-2`

## Neden gerekli?

Oyuncu yalnızca temizlik değil; rota, ekip, halk algısı ve birleşen risk sinyallerini yönettiğini hissetmeli. Pilot gün 3–6 tema ritmi (kaynak, sosyal, kriz sinyali) için aday havuzu genişler.

## Stage 1 ile ilişki

- Stage 1: `NEIGHBORHOOD_CONTAINER_CONTENT_PACK` (20 event) — korunur.
- Stage 2: `OPERATION_DIVERSITY_CONTENT_PACK` (34 event).
- Birleşik katalog: `mergePilotCatalogWithContentSafetyPacks()` → 53+ pilot base ile geniş havuz.

## Event Writing Standard ile ilişki

8 katman (mahalle, saha, aktör, domain, kazanç, trade-off, carry-over, echo). Hedef: Stage 2 ortalama audit ≥ 82, min ≥ 75.

## Daily Theme Rhythm ile ilişki

| Gün | Tema | Stage 2 adayları |
| --- | --- | --- |
| 1 | learning | `avoidPilotDays: [1, 7]` — Stage 2 yok |
| 3 | resource | vehicle, route, personnel |
| 4 | social_pressure | social |
| 5 | opportunity | district balance — karışık |
| 6 | butterfly_effect | crisis_adjacent (önleyici sinyal) |
| 7 | final_report | avoid — final akış korunur |

## Domainler

- **Araç/Rota:** kapasite, bakım, gecikme, rota çakışması
- **Personel/Moral:** tempo, rotasyon, ekip dayanıklılığı
- **Sosyal Nabız:** görünürlük, algı, mahalle kıyası
- **Kriz-adjacent:** henüz kriz değil; birleşen sinyaller, önleyici karar

## Mahalle karakterleri

Stage 1 ile uyumlu: Merkez görünürlük, Cumhuriyet konut/esnaf, Sanayi atölye/araç, İstasyon geçiş/akşam, Yeşilvadi park/çevre.

## Yeni event listesi

Kaynak: `src/core/contentPacks/operationDiversityContentPack.ts` — ID öneki `csp2-`.

## Audit score özeti

`npm run verify:content-safety-pack-stage-2` güncel ortalama/min skorları yazdırır.

## Runtime integration notu

`ensureDailyEventsForDay` varsayılan katalog `mergePilotCatalogWithContentSafetyPacks()` kullanır. Generation algoritması, cap ve idempotency değişmez; `applyDecision` / `postPilotEventEngine` dokunulmaz.

## Neyi değiştirmez?

- SAVE_VERSION / persist
- applyDecision, dayPipeline, post-pilot engine
- Harita, AI, analytics SDK, IAP
- Yeni route/screen

## Sonraki prompt

**Crevia Content Safety Pack Aşama 3: Ece + Social Mentions + Report Echo Variations** (`content-safety-pack-stage-3`)
