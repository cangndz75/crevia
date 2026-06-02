# Crevia District Trust Runtime-lite — Aşama 1

Bu doküman, mevcut district trust foundation’ını event selection, variant, freshness ve map/report/advisor/tomorrow preview yüzeylerine **runtime-lite** şekilde bağlayan adapter katmanını açıklar.

## District trust runtime-lite neyi çözüyor?

- Kalıcı persist olmadan **derived trust snapshot** üretir
- 5 ana mahalle için band, trend, score ve sinyal kaynaklarını toplar
- Event selection / variant / freshness helper’larına **hint-only** sinyal verir
- Map, report, advisor, tomorrow preview için kısa presentation satırları hazırlar
- Rank visibility ile düşük rank’te compact, yüksek rank’te detaylı gösterim kurallarını tanımlar

## Neden persist eklenmedi?

- SAVE_VERSION 23 ve persist shape korunmalı
- Bu patch economy/simulation rewrite değil; derived/fallback snapshot yeterli
- Caller mevcut state (report, socialPulse, operationSignals, carryOver) sağlar; yoksa güvenli fallback

## Trust score nasıl derived hesaplanıyor?

1. Foundation `districtTrust` modeli (`deriveDistrictTrustScore`) kullanılır
2. Sinyaller: daily report, socialPulse, operationSignals, carryOver, recentEvents, resourceFatigue, crisisState
3. Trend foundation `getDistrictTrustTrend` ile türetilir
4. Band: score + trend overlay (`deriveDistrictTrustBand`)
   - fragile / strained / watch / stable / trusted / improving / recovering
5. Gün 1 tutorial: band sadeleştirilir (stable/watch)

## Event selection / variant / freshness bağlantı

| Adapter | Fonksiyon |
|---------|-----------|
| Selection | `applyDistrictTrustToEventSelectionContext`, `buildDistrictTrustSelectionHints` |
| Variant | `buildDistrictTrustVariantContext`, `shouldApplyDistrictTrustVariantBias` |
| Freshness | `buildDistrictTrustFreshnessModifier`, `applyDistrictTrustFreshnessContext` |

Tüm çıktılar `isRuntimeHintOnly: true`. **eventSelection / eventVariants / eventFreshness → districtTrustRuntime import yok** (circular import yok).

## Map / report / advisor / tomorrow preview yüzeyleri

- `buildDistrictTrustMapLine` — max 1 satır, map chip/line
- `buildDistrictTrustReportLine` — gün sonu rapor compact trust
- `buildDistrictTrustAdvisorLine` — Ece kısa insight
- `buildDistrictTrustTomorrowPreviewLine` — yarın önizleme
- Forbidden/panic term guard; yüzeyler arası birebir copy tekrarı yok

## Rank visibility kuralları

- Gün 1: compact, trend gizli
- Düşük rank: compact
- Supervisor + district_trust_preview: standard + trend
- Director/chief + memory trace: detailed + recovery/next action

## Sonraki patch sırası

1. District Memory Runtime-lite Aşama 1
2. District-Specific Operations Runtime-lite Aşama 1
3. District Trust Map Integration Aşama 1
4. Result/Report/Map Variant UI Binding

## Kısıtlar

- SAVE_VERSION 23
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` değiştirilmedi
- Math.random yok
