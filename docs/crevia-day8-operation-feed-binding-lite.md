# Crevia — Day 8+ Operation Feed Binding Lite

## Amaç

Day 8+ stratejik kaynakların yalnızca Hub / Report / Ece / Map yüzeylerinde görünmesini değil, mevcut operasyon feed’i ve event seçim sıralamasını da güvenli şekilde etkilemesini sağlar.

Oyuncu hissi:

> “Şehir bugün mahalle ihmalini, toparlanma fırsatını veya rota baskısını gösteriyorsa; operasyon listesi de gerçekten buna göre şekilleniyor.”

## Neden Lite?

Bu pass yeni event sistemi kurmaz. Mevcut candidate pool üzerinde:

- read-only scoring
- soft ordering bias
- reason / badge bağlama

yapar.

## Operation feed binding modeli

`buildDay8OperationFeedBinding(input)` → `Day8OperationFeedBindingResult`

- `day < 8` → `isActive: false`
- Day 8+ → max 4 bias, max 3 feed binding
- `sourceIds` tekil
- fallback düşük güven

## Strategic bias modeli

Her bias:

- `kind` (ör. `district_neglect_bias`, `route_pressure_bias`)
- `scoreBoost` (0–20 clamp)
- `targetDomainTags` ile mevcut candidate eşleşmesi
- `reasonLine`, `badgeLabel`, `visibilityLevel`

## Source priority

1. Day8StrategicContent primary/secondary
2. CityRhythmDirector primary slot
3. DistrictNeglectRecovery primary signal
4. PositiveComeback primary candidate
5. PortfolioDeferRisk high-priority defer
6. DailyCapacityPortfolio selected/deferred item
7. FollowUpActions primary action
8. CityMemoryVisibility primary trace
9. OneMoreDayRetention primary hook
10. EventGameplayVariety (freshness/variety — visibility only)
11. Authority explanation (boost yok)
12. fallback

## Bias mapping

| Kaynak | Odak → Bias |
|--------|-------------|
| Day8StrategicContent | `district_neglect_focus` → `district_neglect_bias`, vb. |
| CityRhythmDirector | `neglect_attention_day` → `district_neglect_bias`, vb. |
| DistrictNeglectRecovery | `neglect_warning` → `district_neglect_bias`, vb. |
| PositiveComeback | `opportunity_window` → `positive_comeback_bias`, vb. |
| FollowUpActions | `support_recovery` → `district_recovery_bias`, vb. |
| PortfolioDeferRisk | `route_may_strain` → `route_pressure_bias`, vb. |
| DailyCapacityPortfolio | `route_pressure` → `route_pressure_bias`, vb. |

## Score boost policy

- high confidence: +16…+20
- medium: +8…+14
- low: +3…+6
- safe_watch: max +2
- authority: +0 (yalnızca visibility)
- candidate başına toplam boost max 25
- bias başına max 20

## Event selection safety

- Candidate pool dışından seçim yok
- Mevcut freshness / cooldown / family guard korunur
- `rankEventSelectionCandidates` ve `buildEventSelectionResult` opsiyonel `strategicBias` alır
- Kaynak yoksa sıra birebir aynı kalır (verify snapshot)

## Operation feed presentation

- `buildOperationFeedBindingCardModels`
- `buildPrimaryOperationFeedBindingCard`
- `buildOperationFeedReasonLine`
- `buildEceOperationFeedBindingLine`
- Hub operation focus subtitle bağlantısı

Badge örnekleri: Ritim, Mahalle, Toparlanma, Takip, Hafıza, Rota, Kaynak, Güven.

## Authority visibility

- `portfolio_cost_explanation` → kaynak/defer detailed
- `district_context_detail` → mahalle neglect/recovery detailed
- `map_layer_detail` → harita/rota detailed
- `ece_analysis_depth` → Ece operation feed line detailed
- `tomorrow_priority_reason` → defer/one-more detailed

Authority tek başına scoreBoost üretmez.

## Integration policy

Bağlı:

- `memoryFollowUpPresentationContext.ts`
- `eventFamilySelectionEngine.ts` (opsiyonel strategic bias)
- `centerOperationFocusPresentation.ts`
- `eceStrategyLineModel.ts` (operation feed line)

Bağlı değil:

- event spawn
- day pipeline
- persist / SAVE_VERSION / applyDecision

## Analyzer / verify

```bash
npm run verify:day8-operation-feed-binding
npm run analyze:day8-operation-feed-binding
```

Verify kontrolleri: Day&lt;8 inactive, no-source identical output, clamp, mapping, authority guard, duplicate guard, cap korunumu.

## Presentation-only binding policy

Portfolio feed item event candidate ile eşleşmediğinde:

- `isPresentationOnly: true` feed binding üretilebilir
- `selectionBiasSummary.applied` yalnızca `matchedCandidateCount > 0` iken true
- `presentationOnlyBindingCount` ayrı raporlanır
- `unmatchedBindingReason`: *"No matching event candidate; reason kept out of selection bias"*
- Reason copy öneri/odak dili kullanır; `seçildi` dili yasak
- Presentation-only binding **scoreBoost uygulamaz**

Analyzer mesajı: `Presentation-only binding: no forced selection`

## Candidate match policy

1. Önce `existingEventCandidates` (canlı event veya selection pool) eşleşmesi
2. Eşleşme yoksa portfolio `existingOperationFeedItems` → presentation-only
3. Candidate pool yoksa `selectionBiasSummary.applied = false`

## Operation Signals integration

`centerOperationSignalsPresentation`:

- Optional `day8OperationFeedBinding`
- Max 1 binding signal (`signal-operation-feed-*`)
- Operation Focus subtitle ile exact duplicate suppress
- Day &lt; 8 hidden
- Label: Operasyon odağı / Stratejik eşleşme / Ritim sinyali

## Event variety verify cleanup

`npm run verify:event-variety` eklendi. Ayrıntı: `docs/crevia-event-variety-verify-cleanup.md`

## Live event candidate adapter

`buildExistingEventCandidatesFromActiveEvents` — `memoryFollowUpPresentationContext` içinde `gameState.events` aktif event’lerinden candidate üretir. Portfolio items feed presentation için kalır.

## Known future

- Full event selection strategic source adapter (post-pilot runtime)
- Resource Pressure Cost Differentiation Pass
- Follow-up Action Execution Lite

## Değiştirilmeyen sınırlar

- event spawn yok
- event selection rewrite yok
- persist yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- follow-up execution yok
- reward payout yok

- Follow-up Action Execution Lite

## Sonraki prompt

**Resource Pressure Cost Differentiation Pass** — defer/portfolio maliyet farklılaştırması.
