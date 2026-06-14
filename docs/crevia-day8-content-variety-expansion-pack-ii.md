# Crevia — Day 8+ Content Variety Expansion Pack II

## Amaç

Day 8+ sonrası stratejik sinyallerin birkaç gün sonra tekrar hissettirmesini azaltmak. Sistemler aynı kalır; copy havuzları genişler ve yüzeye göre ayrışır.

Bu pass **content-only**'dir:

- Gameplay logic değişmez
- Score/balance değişmez
- Persist / SAVE_VERSION değişmez
- applyDecision / day pipeline değişmez
- Event spawn / selection rewrite yok

## Surface taxonomy

| Yüzey | Ton |
|-------|-----|
| hub | Kısa, aksiyon odaklı |
| report | Açıklayıcı, kısa |
| ece | Danışman tonu |
| operation_feed | Seçimle ilgili, direkt |
| portfolio | Maliyet/fırsat dili |
| city_rhythm | Gün ritmi dili |
| dominant_strategy | Yansıtıcı, suçlayıcı değil |
| follow_up_execution | Küçük aksiyon/sonuç |
| resource_pressure | Cost-axis dili |
| map | Çok kısa sinyal |

## Genişletilen modüller

- `eceStrategyLines` — +66 Ece satırı (`eceStrategyLineContentPackExpansion.ts`)
- `cityRhythmDirector` — +5 satır/kind
- `day8StrategicContent` — +4 satır/kind
- `day8OperationFeedBinding` — +5 reason/bias
- `followUpExecution` — 4 action + 4 result variant/kind
- `resourcePressureDifferentiation` — reason/opportunity/caution genişlemesi
- `dominantStrategyDetector` — reflection/counter/badge varyantları
- `positiveComeback`, `districtNeglectRecovery`, `cityMemoryVisibility` — copy genişlemesi

## Deterministic selector

Modül: `src/core/contentVarietyQuality/`

- `selectDeterministicCopyVariant` — random yok; day/district/source hash ile stabil seçim
- `pickSurfaceCopy` — yüzey-aware wrapper
- `normalizeCopyForDuplicateCheck`, `detectTechnicalEnumLeak`, `detectShameLanguage`
- `mergeCopyPools` — expansion dosyalarını base havuzlara birleştirir

## Analyzer / verify

```bash
npm run verify:day8-content-variety-expansion
npm run analyze:day8-content-variety-expansion
```

## Değiştirilmeyen sınırlar

- Persist / SAVE_VERSION (26)
- applyDecision / day pipeline
- Event selection rewrite / event spawn
- Score/balance mutation
- UI redesign

## Future

- Localization pack
- Seasonal content pack
- Remote config content (ileride)
