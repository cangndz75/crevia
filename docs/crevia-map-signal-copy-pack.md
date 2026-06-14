# Crevia — Map Signal Copy Pack

## Amaç

Harita sinyal, aktif operasyon, mahalle, rota, kaynak, sosyal nabız, güven, hafıza, konteyner ve yetki/layer metinlerini daha zengin, tekrar etmeyen, karar destekli ve mobil uyumlu hale getirmek.

Oyuncu haritayı açtığında:

> “Bu harita bana sadece konum göstermiyor; hangi bölgeye neden dikkat edeceğimi kısa ve net söylüyor.”

## MapSignalCopy model ailesi

Dosyalar: `src/core/mapSignalCopy/*`

| Tip | Rol |
| --- | --- |
| `MapSignalCopyTemplate` | Havuz satırı (persist edilmez) |
| `MapSignalCopyResult` | Seçilen satır + confidence |
| `selectMapSignalCopy()` | Deterministic seçim |
| `selectActiveOperationMapCopy()` | Faz bazlı 3'lü seçim |
| `buildMapSignalAccessibilityLabel()` | A11y birleştirme |

## Context / kind / tone / day policy

- **Context:** active_operation, district_personality, route_support, resource_pressure, social_sensitivity, trust_fragility, container_network, vehicle_maintenance, team_fatigue, district_memory, result_trace, tomorrow_risk, authority_layer, fallback
- **Kind:** map_line, decision_line, district_line, pressure_line, route_line, next_action_line, locked_teaser, accessibility_label
- **Day policy:** day_1, day_2_7, day_8_plus, day_10_plus, any
- **Visibility:** source guard + day policy + repetition guard

## Active operation phase copy

Her `ACTIVE_OPERATION_MAP_PHASE` için en az 3 `map_line` + 3 `decision_line` varyasyonu.

`activeOperationMapBindingModel` artık `PHASE_COPY` sabit tablosu yerine `selectActiveOperationMapCopy` kullanır.

## District personality copy

10 criterion × (5 map_signal + 5 decision_line + 3 district_line + 3 next_action_line).

`getDistrictPersonalityLine()` gün ≥ 2 iken `selectDistrictPersonalityMapCopy` ile zenginleşir.

## Route / resource / social / trust / container / memory / authority

Context havuzları `mapSignalCopyLines.ts` içinde; source guard ile korunur.

## Source guard kuralları

| Guard | Gereksinim |
| ----- | ----------- |
| requires_active_event | event:/active_event |
| requires_route_source | route:/active_task_route |
| requires_district_source | districtCriterionId veya district: |
| requires_live_pressure | pressureKind ≠ calm_standard |
| requires_memory_source | memory/archive/decision_consequence |
| requires_result_source | result_trace/before_after |
| requires_authority_permission | permission + detailed visibility |
| requires_vehicle/container/team | ilgili presence source |
| safe_baseline / fallback_only | güvenli genel satırlar |

Fake claim yok: kaynak yokken memory/route/tomorrow/authority detailed seçilmez.

## Repetition guard

`recentTemplateIds` + `filterRepeatedMapSignalCopy` — aynı template veya aynı metin üst üste dönmez.

## Mobile length guard

- map_line ideal 42–76 karakter
- decision_line ideal 45–90
- accessibility_label max 140

## Entegrasyon noktaları

| Modül | Değişiklik |
| ----- | ---------- |
| `activeOperationMapBindingModel` | MapSignalCopy phase seçimi + a11y |
| `mapGameplayBindingPresentation` | `enrichMapGameplayBindingDecisionLine` |
| `districtPersonalityContentLines` | Opsiyonel gün bazlı seçim |

Map UI, marker, route line, animation değişmedi.

## Verify / analyze

| Komut | Rol |
| ----- | --- |
| `npm run verify:map-signal-copy` | Model + guard + nested verify |
| `npm run analyze:map-signal-copy` | Diagnostic rapor + WARN |

## Değiştirilmeyen sınırlar

- UI redesign yok
- animation yok
- persist / SAVE_VERSION yok
- applyDecision yok
- day pipeline yok

## Sonraki prompt

**Daily Capacity / Operation Portfolio Planning**
