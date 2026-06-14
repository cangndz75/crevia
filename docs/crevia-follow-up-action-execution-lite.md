# Crevia Follow-up Action Execution Lite

This pass adds a transient execution-lite layer for Day 8+ follow-up suggestions.

## Scope

- Source: existing FollowUpActions, Day 8 operation feed binding, positive comeback, city memory, and adjacent presentation-safe results.
- Runtime: `buildFollowUpExecution` builds available/executed presentation candidates.
- Command: `executeFollowUpActionLite` marks one candidate executed inside the returned result only.
- Surfaces: Hub/Ece/Report presentation helpers can show the executed line when a caller provides the result.

## Non-goals

- No persisted game state.
- No `SAVE_VERSION` change.
- No migration.
- No `applyDecision` call.
- No day pipeline or event spawn rewrite.
- No resource payout, personnel dispatch, vehicle dispatch, map motion, analytics, route, or UI redesign.

## Persist Note

Execution state is intentionally caller-provided through `executedActionIdsToday`.
If the game later needs this to survive app restarts, that should be a separate persist pass with explicit migration and store contract review.

## Verification

- `npm run verify:follow-up-execution`
- `npm run analyze:follow-up-execution`
- `npm run verify:memory-followup-wiring`
- `npm run verify:gameplay-loop-qa`
- `npm run typecheck:tsc`
