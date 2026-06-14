# Crevia Portfolio Defer Risk Binding Pass

## Purpose

This pass connects the read-only Daily Capacity Portfolio model to report and tomorrow-context presentation helpers. It makes deferred and watch-only portfolio items visible as at most one report line and at most one tomorrow action candidate.

Player-facing intent:

> A signal I did not choose today is not lost. It can be watched, followed up, or re-read tomorrow if the model has a real source for that.

## Model

New module:

- `src/core/portfolioDeferRisk/portfolioDeferRiskTypes.ts`
- `src/core/portfolioDeferRisk/portfolioDeferRiskModel.ts`
- `src/core/portfolioDeferRisk/portfolioDeferRiskPresentation.ts`
- `src/core/portfolioDeferRisk/verifyPortfolioDeferRiskScenario.ts`

Main builder:

```ts
buildPortfolioDeferRiskBindings(input: PortfolioDeferRiskInput): PortfolioDeferRiskResult
```

The builder consumes an existing `DailyCapacityPortfolioResult`. It does not rebuild event selection, mutate state, persist runtime data, or write report data into the day pipeline.

## Defer Risk Mapping

- `pressure_may_grow` -> `deferred_risk`
- `trust_may_drop` -> `deferred_risk`
- `resource_cost_may_rise` -> `deferred_risk`
- `route_may_strain` -> `deferred_risk`
- `social_reaction_may_grow` -> `deferred_risk`
- `opportunity_may_expire` -> `opportunity_window`
- `memory_trace_may_harden` -> `memory_trace`
- `safe_to_watch` -> `safe_watch`
- `none` -> no binding

The result is capped at two bindings. The first sorted binding is the single primary binding.

## Report Line Policy

`buildPortfolioDeferReportLine(result, existingLines)` returns at most one line.

Rules:

- Day 1 produces no binding.
- No portfolio source produces no binding.
- Report line max length is 110 characters.
- Duplicate exact lines are suppressed.
- Technical enum text is suppressed.
- Fallback portfolio items are not promoted into report risk lines.

## Tomorrow Action Policy

`buildPortfolioDeferTomorrowActionLine(result, existingLines)` returns at most one line.

Rules:

- Tomorrow line requires real future context, such as `tomorrow_risk`, `carry_over`, `district_memory`, or `decision_consequence`.
- `safe_watch` does not create a tomorrow claim.
- High urgency is not invented without source evidence.
- The report view model accepts `portfolioDeferRisk` as an optional read-only input and places its tomorrow line after the existing DecisionConsequence tomorrow action.

## DecisionConsequence Duplicate Guard

If a DecisionConsequence thread already owns the same `sourceId`, portfolio defer binding suppresses that item. DecisionConsequence remains the primary surface for "previous decision effect" language; portfolio defer uses "not selected / watched today" language.

## Source Guard

The builder only considers visible `deferred` and `watch_only` portfolio items with non-fallback source IDs.

Additional guards:

- Memory bindings require `district_memory` or `decision_consequence` source kind.
- Recovery/opportunity bindings require `reward_comeback` or `event_gameplay_variety` source kind.
- District personality alone is not converted into fake memory or fake live opportunity.

## Report/Tomorrow Integration

`buildEndOfDayTomorrowNotes` and `buildEndOfDayReportViewModel` accept an optional `portfolioDeferRisk` result. Existing callers do not pass it, so default report behavior is unchanged.

When provided:

- Existing DecisionConsequence tomorrow action is kept first.
- Portfolio tomorrow action is considered next.
- Portfolio report summary line is considered after that.
- Existing carry-over, butterfly, quick action, highlight, summary, and personnel candidates remain in place.

## Verification

New commands:

- `npm run verify:portfolio-defer-risk`
- `npm run analyze:portfolio-defer-risk`

The verifier checks:

- Binding ID uniqueness.
- Max two bindings.
- Primary max one.
- Priority clamp.
- Source ID uniqueness.
- Non-empty player-facing lines.
- Report line max length.
- Tomorrow source guard.
- Day 1 low-noise.
- No portfolio source -> no fake binding.
- Deferred high risk -> report/tomorrow candidate.
- Safe watch -> neutral and no fake tomorrow.
- DecisionConsequence duplicate source suppression.
- No fake tomorrow, memory, or opportunity.
- Persist, SAVE_VERSION, applyDecision, day pipeline, and Hub UI remain unwired.

## Boundaries Not Changed

- No Hub UI.
- No Center portfolio component.
- No `centerAdvisorPresentation`.
- No map UI.
- No persist shape change.
- No `SAVE_VERSION` change.
- No migration.
- No `applyDecision` change.
- No day pipeline change.
- No event selection rewrite.
- No runtime state.
- No navigation change.
- No analytics, store, RevenueCat, Lottie, or asset change.

## Next Pass

One More Day Retention Pass can consume `tomorrowActionLine` as a read-only candidate for retention copy or next-day framing.
