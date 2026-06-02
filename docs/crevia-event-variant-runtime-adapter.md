# Crevia Event Variant Runtime Adapter — Aşama 1

Bu doküman, Event Family Selection Engine Aşama 2 çıktısı olan `recommendedVariantKind` bilgisini mevcut event flow’a güvenli şekilde bağlayan **runtime-lite variant adapter** katmanını açıklar.

## Variant adapter neyi çözüyor?

- Selection engine’in önerdiği variant’ı **resolved variant** modeline çevirir
- Event card, inspect/plan/dispatch/field, result, report, social, advisor, map ve tomorrow_preview yüzeyleri için **kısa, güvenli copy** üretir
- Panik dili, sezon finali dili ve generic spam fallback’lerini filtreler
- Echo sistemlerinin üstüne zorla yazmak yerine `mergeVariantLineWithExistingEcho` ile birleştirir
- Day 1 tutorial’da heavy/risky variant’ları downgrade eder

## Neden event generation rewrite yapılmadı?

- `ensureDailyEventsForDay`, `applyDecision` ve `dayPipeline` mevcut save uyumluluğu için korunur
- SAVE_VERSION 23 ve persist shape değişmez
- Variant adapter önce presentation/runtime hint katmanıdır; full UI binding sonraki patch’lere kalır

## Selection engine ile bağlantı

- `resolveEventVariantFromSelectionResult(selectionResult, context?)` selection result’taki `decision.recommendedVariantKind` değerini öncelikli kullanır
- Selection yoksa `resolveEventVariantForContext` deterministic context fallback üretir
- `eventVariants` → `eventSelection` (tip/result okuma) tek yönlüdür; **circular import yok**

## Variant copy yüzeyleri

| Yüzey | Amaç |
|-------|------|
| event_card | Kart üstü kısa bağlam |
| inspect / plan / dispatch / field | Workflow faz copy |
| result | Karar sonucu tonu |
| report / social / advisor / map / tomorrow_preview | Echo yüzeyleri |

Her yüzey: max 1 kısa satır, mobile length guard, forbidden/panic term filtresi.

## Reward / comeback / crisis_adjacent güvenlik kuralları

**Reward**
- Yalnızca trusted/stable trust + düşük/orta resource sinyalinde güçlenir
- Aksi halde `improved` veya `district_trust`’a downgrade

**Comeback**
- Toparlanma fırsatı dili kullanır; bedelsiz kurtarma vaadi yok
- Kaynak baskısının devam ettiği belirtilir

**Crisis_adjacent**
- “Risk büyümeden kontrol penceresi” tonu
- Panik, felaket, kaos terimleri yasak
- Day 1 tutorial’da downgrade → `normal`

**Operation_era**
- Primary event değil; `isContextOnly: true`
- event_card / dispatch / field yüzeylerine uygulanmaz

## Sonraki patch sırası

1. Event Family Repeat & Freshness Runtime Guard
2. District Trust Runtime-lite Integration
3. District Memory Runtime-lite
4. Result/Report/Map variant UI binding

## Kısıtlar (bu patch)

- SAVE_VERSION artırılmadı (23)
- Persist shape değişmedi
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` değiştirilmedi
- Existing event card shape korundu
- Math.random kullanılmadı
