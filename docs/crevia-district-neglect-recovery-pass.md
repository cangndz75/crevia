# Crevia District Neglect & Recovery Pass

## Purpose

This pass gives districts a live neglect/recovery state instead of only static personality criteria or isolated memory traces. The player should feel:

> When I keep deferring a district, the city remembers. With the right follow-up, small actions, and good decisions, that district can recover.

This module is the foundation source for the Day 8+ Strategic Content Pack. Do not start that pack before this pass is complete.

## Model

New module:

- `src/core/districtNeglectRecovery/districtNeglectRecoveryTypes.ts`
- `src/core/districtNeglectRecovery/districtNeglectRecoveryConstants.ts`
- `src/core/districtNeglectRecovery/districtNeglectRecoveryModel.ts`
- `src/core/districtNeglectRecovery/districtNeglectRecoveryPresentation.ts`
- `src/core/districtNeglectRecovery/verifyDistrictNeglectRecoveryScenario.ts`

Main builder:

```ts
buildDistrictNeglectRecovery(input: DistrictNeglectRecoveryInput): DistrictNeglectRecoveryResult
```

## Neglect vs Recovery

Neglect and recovery are separate concepts inside one district-level model:

- `neglectScore` / `neglectBand` track deferred pressure, trust fragility, route/container backlog, and cooling social signals.
- `recoveryScore` / `recoveryBand` track comeback windows, follow-up recovery support, positive momentum, and memory-positive traces.
- District personality is a baseline modifier only. It never creates live neglect or recovery claims by itself.

## Source Priority

1. PositiveComeback real district recovery
2. FollowUpActions support/recheck/reinforce
3. PortfolioDeferRisk trust/social/opportunity
4. DailyCapacityPortfolio district/recovery/follow-up
5. CityMemoryVisibility district/memory trace
6. DecisionConsequence / CarryOver / Butterfly
7. DistrictTrust / DistrictMemory / CityArchive / StoryChain
8. SocialPulse / Map bindings
9. DistrictPersonality baseline modifier
10. fallback safe watch

## Score Model

Neglect contributions include deferred district pressure, portfolio trust/social risk, negative consequence traces, unresolved memory, social cooling, and route/container backlog. Recovery contributions include positive comeback, follow-up recovery support, daily capacity recovery opportunity, one-more-day recovery hooks, and positive city memory traces.

Personality boosts apply only when another real source already exists:

- `neglect_risk` high -> +10 neglect only with another neglect source
- `trust_fragility` high -> +8 neglect only with trust/social source
- `recovery_potential` high -> +10 recovery only with another recovery source

## Band Model

Neglect bands:

- `0-19` -> `none`
- `20-39` -> `watch`
- `40-64` -> `rising`
- `65+` -> `high`

Recovery bands:

- `0-19` -> `none`
- `20-39` -> `possible`
- `40-64` -> `active`
- `65+` -> `strong`

Conflict rule: when both scores are high, priority follows the stronger score, tone becomes `strategic`, and copy balances risk plus recovery opportunity without contradictory claims.

## Day Behavior

- Day 1: low-noise fallback only; no report/hub/map/ece district neglect surface.
- Day 8+: real sources can produce district-level neglect/recovery signals.
- Day 10+: city memory and recovery combinations are supported.

## Copy Pack

`districtNeglectRecoveryConstants.ts` contains player-facing lines for:

- `neglect_watch`
- `neglect_warning`
- `trust_fragility`
- `social_cooling`
- `route_backlog`
- `container_backlog`
- `recovery_window`
- `recovery_progress`
- `positive_momentum`
- `safe_watch`
- `fallback`

Copy rules:

- No certainty language like "definitely neglected" or "fully recovered".
- No blame language.
- No technical enum text in UI output.
- Use "may / could / worth watching" language.

## Source Guard

Hard guards:

- No deferred-pressure neglect without portfolio/daily-capacity/memory/consequence source.
- No recovery opportunity without positive comeback/follow-up/recovery source.
- No trust fragility without trust source.
- No social cooling without social/trust source.
- No route backlog without route source.
- No container backlog without container source.
- No city-memory recall line without city-memory source.
- District personality alone never creates fake live neglect or recovery.

## Presentation Helpers

`districtNeglectRecoveryPresentation.ts` exposes:

- `buildDistrictNeglectRecoveryCardModels`
- `buildPrimaryDistrictNeglectRecoveryCard`
- `buildReportDistrictNeglectRecoveryNote`
- `buildHubDistrictNeglectRecoveryHint`
- `buildMapDistrictNeglectRecoveryHint`
- `buildEceDistrictNeglectRecoveryLine`
- `buildPortfolioDistrictNeglectRecoverySignal`
- `buildFollowUpDistrictNeglectRecoverySeed`
- `buildPositiveComebackDistrictRecoverySeed`

Limits:

- Max 4 internal signals
- Max 3 presentation cards
- Max 1 primary/report/hub/map/ece/portfolio signal
- `line` max 110, `shortLine` max 72, `accessibilityLabel` max 160

## Integration Policy

Allowed optional wiring:

- `memoryFollowUpPresentationContext.ts` builds district neglect after positive comeback and before Ece strategy lines.
- `endOfDayReportPresentation.ts` accepts optional `districtNeglectRecoveryNote`.
- `centerContinuationCardsPresentation.ts` accepts optional district neglect/recovery hint card.
- `centerAdvisorPresentation.ts` can use `buildEceDistrictNeglectRecoveryLine`.
- `EceStrategyLineInput` accepts optional `districtNeglectRecoveryResult`.

Build order:

1. DailyCapacityPortfolio
2. PortfolioDeferRisk
3. OneMoreDayRetention
4. CityMemoryVisibility
5. FollowUpActions
6. PositiveComeback
7. DistrictNeglectRecovery
8. EceStrategyLines

## Duplicate Guard

Priority when the same district/source appears across systems:

1. OneMoreDay CTA/hook
2. Ece strategy line
3. PositiveComeback opportunity
4. DistrictNeglectRecovery district state
5. CityMemory trace
6. FollowUp action

District neglect copy uses district-state language. Follow-up uses action language. Positive comeback uses opportunity language. City memory uses trace language. Ece uses strategy commentary language.

## Analyzer / Verify

Commands:

- `npm run verify:district-neglect-recovery`
- `npm run analyze:district-neglect-recovery`

Verify checks:

- score clamps
- source guards
- Day 1 low-noise
- personality baseline alone does not fake neglect/recovery
- presentation limits
- duplicate suppression
- memory context wiring
- no persist / applyDecision / day pipeline changes

## Unchanged Boundaries

This pass does not change:

- persist shape
- `SAVE_VERSION`
- `applyDecision`
- day pipeline
- follow-up execution
- reward payout
- event spawn
- navigation routes
- store writes

## Next Prompt

Day 8+ Strategic Content Pack
