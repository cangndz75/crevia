# Crevia District Memory Runtime-lite — Aşama 1

Bu doküman, mahalle hafıza izlerini derived/fallback snapshot olarak üreten **district memory runtime-lite** katmanını açıklar.

## District memory neyi çözüyor?

- Son olaylar, tekrar eden baskılar, unresolved carry-over, recovery window ve recent improvement izlerini toplar
- Her mahalle için max 3 memory trace (primary, secondary, optional recovery)
- Event selection, variant, freshness ve district trust katmanlarına **hint-only** sinyal verir
- Report, map, advisor ve tomorrow preview için kısa presentation satırları üretir

## Neden persist eklenmedi?

- SAVE_VERSION 23 ve persist shape korunmalı
- Caller mevcut state (carryOver, report, socialPulse, operationSignals) sağlar
- Eksik state → güvenli fallback (`quiet_stable`)

## Memory trace nasıl derived hesaplanıyor?

1. Sinyal blob’u: carryOver, dailyReport, tomorrow preview, recentEvents, operationSignals, socialPulse, crisisState, resourceFatigue
2. `deriveDistrictMemoryKind` → primary kind
3. `buildDistrictMemoryTraces` → max 3 trace (map/report/advisor/tomorrow hint’leri)
4. `districtTrustRuntime` snapshot referans olarak okunur; **overwrite edilmez**

## District trust ile farkı ne?

| Katman | Odak |
|--------|------|
| **District trust** | Güven bandı, trend, selection/variant trust bias |
| **District memory** | Somut olay izleri, tekrar/baskı/recovery hafızası, trace satırları |

Memory, trust’ı değiştirmez; `trustSnapshotRef` ile yan yana taşınır.

## Event selection / variant / freshness bağlantı

- `applyDistrictMemoryToEventSelectionContext` — domain/variant hint
- `buildDistrictMemoryVariantContext` — memory reason + variant bias
- `buildDistrictMemoryFreshnessModifier` — repeated pressure / recovery / reward spam guard

Tek yönlü import: `districtMemoryRuntime` → diğer katmanlar; ters import yok.

## Report / map / advisor / tomorrow preview

- Max 1 kısa satır per yüzey
- Forbidden/panic guard
- Yüzeyler arası birebir copy tekrarı yok

## Rank visibility kuralları

- Gün 1: compact, kind gizli
- Düşük rank: “Mahalle İzi” compact chip
- Supervisor + trust preview: kind + reason
- Director/chief + memory trace preview: detailed + recovery action

## Sonraki patch sırası

1. District-Specific Operations Runtime-lite Aşama 1
2. District Trust Map Integration Aşama 1
3. Active Task Route UI Integration Aşama 1
4. Result/Report/Map variant + memory UI binding

## Kısıtlar

- SAVE_VERSION 23
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` değiştirilmedi
- Math.random yok
