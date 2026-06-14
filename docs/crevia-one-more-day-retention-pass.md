# Crevia One More Day Retention Pass

## Purpose

This pass adds a read-only "one more day" retention model for the end-of-day and next-day bridge. It uses existing signals from Portfolio Defer Risk, Daily Capacity Portfolio, Decision Consequence, Tomorrow Risk, carry-over, city memory, story, map, and report summaries.

The player-facing goal:

> I made choices today. Some things are solved, some are being watched, and I know what to check tomorrow.

## Core Model

New module:

- `src/core/oneMoreDayRetention/oneMoreDayRetentionTypes.ts`
- `src/core/oneMoreDayRetention/oneMoreDayRetentionConstants.ts`
- `src/core/oneMoreDayRetention/oneMoreDayRetentionModel.ts`
- `src/core/oneMoreDayRetention/oneMoreDayRetentionPresentation.ts`
- `src/core/oneMoreDayRetention/verifyOneMoreDayRetentionScenario.ts`

Main builder:

```ts
buildOneMoreDayRetention(input): OneMoreDayRetentionResult
```

The result has at most one primary hook and one secondary hook.

## Source Priority

Priority order:

1. `PortfolioDeferRisk` primary `tomorrowActionLine`
2. real `TomorrowRisk` source
3. DecisionConsequence / carry-over / butterfly source
4. district memory / city archive / story chain source
5. Daily Capacity Portfolio recovery opportunity
6. map gameplay binding
7. calm fallback

## Day Behavior

Day 1:

- Low-noise fallback.
- Title: `Ilk gun tamamlandi`
- No defer risk or strategic pressure.
- CTA: `Devam Et`

Day 2-7:

- Pilot momentum.
- Uses carry-over or decision consequence if a real source exists.

Day 8+:

- Strategic next-day motivation.
- Portfolio deferred/watch source wins when present.
- Max two hooks.

Day 10+:

- Can use city memory, story, district, and portfolio sources.
- No fake memory claim.

## Source Guard

- `tomorrowLine` requires real tomorrow/defer/follow-up source.
- `memory_trace` requires DecisionConsequence, carry-over, district memory, city archive, or story source.
- `recovery_opportunity` requires Daily Capacity Portfolio or Portfolio Defer Risk source.
- Route pressure requires route, portfolio, or map source.
- Fallback is always calm and low confidence.
- District personality alone is not treated as live tomorrow risk.

## Report Integration

`buildEndOfDayReportViewModel` accepts optional `oneMoreDayRetention`.

It produces optional:

```ts
oneMoreDayCard?: ReportOneMoreDayCardModel | null
```

The card is presentation-only. Existing callers that do not pass the model keep previous report behavior.

## Hub Continuation Integration

`buildCenterContinuationCards` accepts optional `oneMoreDayRetention`.

When present and not duplicate, it can add one compact `Devam Odagi` continuation card. This is not a Hub Portfolio Surface implementation and does not touch Hub component files.

## CTA Policy

- Uses only provided route hints.
- No route is invented.
- Missing route means the hook is not actionable.
- Map source can use map route.
- Other sources prefer hub route.

## Copy Policy

Copy is short and mobile-safe:

- No technical enum text.
- No crisis language.
- No fake urgency.
- No punitive copy.

## Verification

New commands:

- `npm run verify:one-more-day-retention`
- `npm run analyze:one-more-day-retention`

The verifier checks:

- Hook id uniqueness.
- Primary max one.
- Secondary max one.
- Priority clamp.
- Source id uniqueness.
- Fallback low confidence.
- Day 1 low-noise.
- Day 8+ portfolio defer priority.
- Tomorrow, memory, and opportunity source guards.
- CTA route safety.
- Report card availability and accessibility.
- Hub continuation optional retention card and max item cap.
- Technical enum guard.
- Persist, SAVE_VERSION, applyDecision, day pipeline, Authority, and Hub Portfolio Surface boundaries.

## Boundaries Not Changed

- No persist shape change.
- No `SAVE_VERSION` change.
- No `applyDecision` change.
- No day pipeline mutation.
- No Authority Gameplay Expansion changes.
- No Hub Portfolio Surface changes.
- No Daily Capacity Portfolio core behavior change.
- No Portfolio Defer Risk core behavior change.
- No event selection rewrite.
- No map UI.
- No navigation routes.
- No RevenueCat, analytics, store, Lottie, or assets.

## Next Pass

Ece Memory & Strategy Line Pack can consume the retention model as a read-only source.
