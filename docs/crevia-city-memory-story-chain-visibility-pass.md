# Crevia — City Memory / Story Chain Visibility Pass

## Amaç

Kararların etkileri sistemde vardı ama oyuncu bunları her zaman “şehir hafızası” olarak net okuyamıyordu. Bu pass, mevcut memory/story/archive sinyallerini **read-only** bir görünürlük modeliyle toparlar.

Hedef oyuncu hissi:

> *“Şehir beni hatırlıyor. Dün yaptığım karar kaybolmadı; mahallelerde, raporda, Ece yorumunda ve haritada iz bırakıyor.”*

## Kapsam

- `src/core/cityMemoryVisibility/` — core model, copy pack, presentation helpers
- Opsiyonel Report / Hub continuation hook’ları
- Analyzer + verify script’leri

## Kapsam dışı

- Follow-up action content üretimi yok
- Yeni operation/event yok
- Story chain runtime değişikliği yok
- City archive persist shape değişikliği yok
- `SAVE_VERSION` / migration / `applyDecision` / day pipeline değişikliği yok
- Hub / Map / Report UI redesign yok
- LLM / API yok

## CityMemoryVisibility modeli

`buildCityMemoryVisibility(input)` → `CityMemoryVisibilityResult`

| Alan | Açıklama |
|------|----------|
| `traces` | Max 3 trace |
| `primaryTrace` | Max 1 ana iz |
| `reportTrace` / `hubTrace` / `mapTrace` / `eceTrace` | Yüzey başına max 1 |
| `summaryLine` | Kısa özet |
| `sourceIds` | Dedupe edilmiş kaynak kimlikleri |

### Trace türleri

`decision_trace`, `district_trace`, `story_chain_trace`, `carry_over_trace`, `butterfly_trace`, `map_memory_hint`, `hub_continuation_hint`, `report_memory_note`, `ece_memory_hint`, `safe_summary`, `fallback`

## Source priority

1. DecisionConsequence / CarryOver / Butterfly (gerçek source)
2. CityArchive / DistrictMemory
3. StoryChain active/persistent trace
4. OneMoreDayRetention / PortfolioDeferRisk (memory-related hook)
5. MapGameplayBinding `district_memory_trace` / `result_trace_stamp`
6. EceStrategyLines memory source
7. DistrictPersonality `operation_history_weight` (low-confidence context only)
8. Safe fallback

## Day davranışı

| Band | Davranış |
|------|----------|
| **Day 1** | Low-noise; max 1 trace; fallback: “Bugünkü kararın etkisini raporda göreceksin.” |
| **Day 2–7** | Carry-over / decision consequence varsa kısa trace |
| **Day 8+** | Şehir hafızası görünür; en az bir source varsa trace |
| **Day 10+** | Story chain ve district trace önceliği artar |

## Source guard

**Hard guard:** Kaynak yokken archive / story / decision / carry-over / butterfly / district memory / map iddiası üretilmez.

**Soft guard:** DistrictPersonality baseline yalnızca “kararlar daha görünür olabilir” dili; “iz bıraktı” denmez.

## Presentation helpers

| Helper | Çıktı |
|--------|-------|
| `buildCityMemoryTraceCardModels` | Max 3 kart |
| `buildReportCityMemoryNote` | Max 1 rapor notu |
| `buildHubCityMemoryHint` | Max 1 hub hint |
| `buildMapCityMemoryHint` | Max 1 harita hint |
| `buildEceCityMemoryHint` | Max 1 Ece hint (duplicate suppress) |

Satır limitleri: line 110, shortLine 72, accessibility 160.

## Integration (opsiyonel)

### Report

`buildEndOfDayReportViewModel` → optional `cityMemoryVisibility` input → `cityMemoryNote` view-model alanı. OneMoreDay ve Ece satırlarıyla duplicate guard.

### Hub continuation

`buildCenterContinuationCards` → optional `cityMemoryVisibility` → `city-memory-continuation` kartı (Devam Odağı / recommended plan ile çakışırsa suppress).

### Map / Ece advisor

Yalnızca helper export; Map UI ve `centerAdvisorPresentation` doğrudan bağlanmadı (duplicate riski).

## Duplicate guard

- Aynı `sourceId` OneMoreDay / Ece’de görünüyorsa city memory secondary veya suppress
- Aynı exact line report’ta iki kez çıkmaz
- Ece zaten memory trace söylediyse `eceTrace` suppress
- Hub continuation’da dedupe listesi retention + Ece satırlarını içerir

## Verification

```bash
npm run verify:city-memory-visibility
npm run analyze:city-memory-visibility
```

Adjacent:

```bash
npm run verify:center-continuation-cards
npm run verify:report-ui
npm run verify:ece-strategy-lines
npm run verify:one-more-day-retention
npm run typecheck:tsc
```

## Sonraki prompt

**Follow-up Action Content Pack** — memory trace’lerden oyuncuya seçilebilir takip hamleleri (bu pass üretmez).

## Değiştirilmeyen sınırlar

| Alan | Değişti? |
|------|----------|
| Persist / SAVE_VERSION (26) | Hayır |
| applyDecision / day pipeline | Hayır |
| Story chain runtime | Hayır |
| Hub / Map / Report UI layout | Hayır |
| Follow-up action content | Hayır |
