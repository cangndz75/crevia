# Crevia District-Specific Operations Runtime-lite (Aşama 1)

## Ne çözüyor?

District-specific operations runtime-lite, mevcut **district operations foundation** ile **District Trust Runtime-lite** ve **District Memory Runtime-lite** snapshot’larını birleştirerek mahalleye özel operasyon **önerilerini** üretir.

Bu katman:

- Map bottom panel
- Report tomorrow preview
- Advisor line
- Hub compact öneri

için presentation model ve hint satırları sağlar.

**Persist shape değişmez.** SAVE_VERSION artmaz. Yeni kayıt alanı eklenmez.

## Neden selectable action eklenmedi?

Aşama 1 bilinçli olarak **preview / recommendation / hint** katmanıdır:

- Oyuncuya yeni gameplay action seçtirmek event generation ve applyDecision zincirini etkiler.
- Runtime event card shape ve `ensureDailyEventsForDay` davranışı korunmalıdır.
- Öneriler `isSelectableNow: false` ve `isRuntimeHintOnly: true` ile işaretlenir.

Sonraki patch’lerde activation ve UI binding genişletilebilir.

## Aşama 2 selectable action notu

District-Specific Operations Activation Aşama 2, runtime-lite önerilerinden en fazla **günde 1** küçük mahalle hamlesi seçtirir.

- Day 1: action gizli.
- Day 2-3: sadece preview, seçim yok.
- Day 4+: uygun tek action `available` olabilir.
- Aynı gün ikinci action blocked kalır.
- Yakın geçmişte aynı mahalle + operation kind tekrarı blocked kalır.
- Etki modeli küçük operation signal delta ile sınırlıdır; event generation veya `applyDecision` zinciri değişmez.
- State oturum içidir; persist shape değişmediği için SAVE_VERSION 23 kalır.
- Hub ve Map aynı küçük kartı kullanır; Report sadece seçilen action için tek summary satırı gösterir.

## Trust / memory / resource / era sinyalleri → skor

| Sinyal | Etki |
|--------|------|
| Trust `fragile` / `strained` | Sosyal onarım / recovery operasyonları (`social_trust_repair`, `night_pressure_softening`, …) |
| Memory `repeated_pressure` | Domain odaklı operasyonlar (atık, rota, endüstriyel baskı) |
| Memory `recent_improvement` | Görünürlük / ödül operasyonları (`visible_service`, `low_noise_service`, …) |
| Resource fatigue yüksek | Rota dengeleme / kaynak rahatlatma operasyonları |
| Crisis watch | Panik dili olmadan crisis-adjacent hint (`rapid_response`, `transfer_flow`, …) |
| Operation era aktif | İlgili domain + foundation kind eşleşmesine küçük bonus |
| Aynı operation tekrarı | Freshness penalty |
| Day 1 tutorial | Gizli / sade fallback |

Skor fonksiyonu: `scoreDistrictOperationCandidate()`  
Snapshot: `buildDistrictOperationsRuntimeSnapshot()`

## Event selection / variant / freshness bağlantısı

Runtime katman **event generation’ı doğrudan değiştirmez**. Sadece context/hint adapter’ları sunar:

- `applyDistrictOperationToEventSelectionContext()` — domain / variant hint
- `buildDistrictOperationVariantContext()` — `recommendedVariantBias` aktarımı
- `buildDistrictOperationFreshnessModifier()` — aynı operation kind tekrarını azaltır
- `buildDistrictOperationContentProductionHint()` — coverage notu (`isRuntimeLinked: false`)

Circular import yok: `districtOperationsRuntime` → trust/memory/event katmanlarını okur; ters import yapılmaz.

## Mahalle operation kind modeli

Her ana mahalle için 3 runtime kind:

| Mahalle | Kind’lar |
|---------|----------|
| Merkez | `visible_service`, `public_flow`, `rapid_response` |
| Cumhuriyet | `social_trust_repair`, `bulky_waste_control`, `night_pressure_softening` |
| Sanayi | `route_efficiency`, `vehicle_flow`, `industrial_waste_pressure` |
| İstasyon | `transfer_flow`, `crowd_timing`, `route_coordination` |
| Yeşilvadi | `environmental_care`, `container_balance`, `low_noise_service` |

Her kind: label, domainFocus, trust/memory/resource intent, variant bias, yüzey hint intent’leri ve forbidden terms taşır.

## Presentation yüzeyleri

| Yüzey | Helper |
|-------|--------|
| Hub | `buildDistrictOperationHubLine()` |
| Map | `buildDistrictOperationMapLine()` |
| Report | `buildDistrictOperationReportLine()` |
| Advisor | `buildDistrictOperationAdvisorLine()` |
| Tomorrow | `buildDistrictOperationTomorrowPreviewLine()` |
| Compact chip | `buildDistrictOperationCompactChip()` |

Copy kuralları: 72–88 karakter bandı, mobile-safe, panik / sezon finali / oyun sonu yasağı, yüzeyler arası birebir aynı cümle yok.

Rank visibility: `buildDistrictOperationRankVisibility()` — düşük rank compact, yüksek rank detailed.

## Verify

```bash
npm run verify:district-operations-runtime
```

## Sonraki patch sırası

1. **District-Specific Operations Activation Aşama 2** — selectable action, persist yok, SAVE_VERSION 23
2. **District Trust + Memory Map Integration**
3. **Active Task Route UI Integration**
4. **Result/Report/Map New Systems Binding**

## Kısıtlar (Aşama 1)

- SAVE_VERSION 23 sabit
- `ensureDailyEventsForDay`, `applyDecision`, `dayPipeline` dokunulmaz
- Runtime event generation rewrite yok
- Büyük UI redesign yok; Aşama 1’de minimal binding opsiyonel bırakıldı (risk → sadece helper + verify)
