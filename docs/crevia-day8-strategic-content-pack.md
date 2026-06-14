# Crevia Day 8+ Strategic Content Pack

## Purpose

This pass unifies Day 8+ strategic signals from portfolio, defer risk, retention, memory, follow-up, comeback, neglect/recovery, authority, and map systems into one read-only strategic content candidate model.

Player-facing intent:

> The pilot is over. The city is no longer a single event; districts, resources, neglect, recovery, follow-up moves, and strategic priorities work together.

## Model

New module:

- `src/core/day8StrategicContent/day8StrategicContentTypes.ts`
- `src/core/day8StrategicContent/day8StrategicContentConstants.ts`
- `src/core/day8StrategicContent/day8StrategicContentModel.ts`
- `src/core/day8StrategicContent/day8StrategicContentPresentation.ts`
- `src/core/day8StrategicContent/verifyDay8StrategicContentScenario.ts`

Main builder:

```ts
buildDay8StrategicContent(input: Day8StrategicContentInput): Day8StrategicContentResult
```

## Candidate Taxonomy

Kinds include:

- `strategic_operation_focus`
- `district_neglect_focus`
- `district_recovery_focus`
- `resource_pressure_focus`
- `route_pressure_focus`
- `container_pressure_focus`
- `social_trust_focus`
- `memory_trace_focus`
- `follow_up_focus`
- `positive_comeback_focus`
- `defer_risk_focus`
- `map_priority_focus`
- `authority_explanation_focus`
- `safe_watch_focus`
- `fallback`

## Source Priority

1. DistrictNeglectRecovery high/rising neglect or active/strong recovery
2. PositiveComeback primary candidate
3. PortfolioDeferRisk high-impact defer risk
4. DailyCapacityPortfolio strategic items
5. FollowUpActions primary action
6. CityMemoryVisibility primary trace
7. OneMoreDayRetention primary hook
8. MapGameplayBinding / ActiveOperationMapBinding
9. Resource/vehicle/team/container/social pressure
10. AuthorityGameplayExpansion explanation benefit
11. EceStrategyLines supporting source
12. fallback safe watch

## Day Behavior

- Day < 8: hidden / fallback only
- Day 8–9: first strategic phase, max 3 visible, low-data fallback required
- Day 10+: richer mix, story/memory/neglect/recovery more visible, district repetition guard

## Diversity Guard

- Max 1 candidate per kind when alternatives exist
- Max 2 candidates from same district
- Max 1 pure risk if positive/recovery source exists
- Max 1 pure positive if high risk source exists
- Day 10+ prefers at least 2 source kinds when possible

## Authority Visibility

Permissions deepen explanation only; they do not create fake content:

- `portfolio_cost_explanation` → resource/defer candidates
- `district_context_detail` → district neglect/recovery
- `map_layer_detail` → map priority
- `ece_analysis_depth` → strategic/Ece candidates
- `tomorrow_priority_reason` → defer/retention candidates

## Presentation Helpers

- `buildDay8StrategicContentCardModels`
- `buildPrimaryDay8StrategicContentCard`
- `buildHubDay8StrategicContentHint`
- `buildReportDay8StrategicContentNote`
- `buildMapDay8StrategicContentHint`
- `buildEceDay8StrategicContentLine`
- `buildPortfolioDay8StrategicContentSignal`

## Integration Policy

Build order in `memoryFollowUpPresentationContext.ts`:

1. DailyCapacityPortfolio
2. PortfolioDeferRisk
3. OneMoreDayRetention
4. CityMemoryVisibility
5. FollowUpActions
6. PositiveComeback
7. DistrictNeglectRecovery
8. Day8StrategicContent
9. EceStrategyLines

Optional wiring:

- Report `day8StrategicContentNote`
- Hub continuation strategic content card
- Ece advisor strategic content line

## Duplicate Guard Priority

1. OneMoreDay CTA/hook
2. Ece strategy line
3. Day8StrategicContent strategic focus
4. DistrictNeglectRecovery district state
5. PositiveComeback opportunity
6. CityMemory trace
7. FollowUp action

## Analyzer / Verify

- `npm run verify:day8-strategic-content`
- `npm run analyze:day8-strategic-content`

## Unchanged Boundaries

This pass does not change:

- event selection rewrite
- event spawn
- persist shape
- `SAVE_VERSION`
- `applyDecision`
- day pipeline
- follow-up execution
- reward payout
- UI redesign

## Next Prompt

City Rhythm Director Pass
