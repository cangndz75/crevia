# Crevia Dominant Strategy Detector Model Pass

This pass implements a read-only model that detects repeated recent strategy patterns and turns them into non-punitive presentation signals.

## Purpose

The detector helps Ece, Hub, and Report notice the player's recent decision style without blaming the player or changing gameplay balance.

## From Planning To Implementation

The planning pass described a sliding-window detector. This implementation keeps that boundary: it reads optional histories, infers weak signals when structured fields are missing, and returns a single dominant pattern plus a soft counter-signal.

## Pattern Taxonomy

- `rapid_response_overuse`
- `preventive_overuse`
- `balanced_default_overuse`
- `resource_saving_overuse`
- `public_trust_overfocus`
- `crisis_priority_overfocus`
- `district_repetition`
- `route_heavy_repetition`
- `social_pressure_avoidance`
- `recovery_opportunity_neglect`
- `inconsistent_switching`
- `none`

## Signal Extraction

Inputs are optional and read-only:

- decision records
- portfolio history
- operation feed choice history
- follow-up execution history
- defer risk history
- district focus history
- city rhythm history
- Day 8 strategic content history
- report outcome history
- recent district IDs
- recent domain tags

Missing history is safe and returns `none`.

## Scoring And Confidence

Signals receive small weights by source. Recent repeated decision, district, and domain signals are scored by pattern. Tie-breaks are deterministic and prioritize district repetition, recovery neglect, social avoidance, trust overfocus, route repetition, resource saving, balanced default, inconsistent switching, and then none.

Confidence is clamped to `low`, `medium`, or `high`.

## Day Behavior

- Day 1-3: hidden.
- Day 4-7: teaser and no high confidence.
- Day 8+: visible when enough history exists.
- Day 10+: high-confidence patterns may use detailed visibility.

## Counter-Signal Policy

Every visible pattern has one short advisory counter-signal. Copy avoids shame language, hard penalties, technical enum labels, and fake claims.

## Presentation Helpers

- `buildDominantStrategyCardModels`
- `buildPrimaryDominantStrategyCard`
- `buildEceDominantStrategyLine`
- `buildReportDominantStrategyNote`
- `buildHubDominantStrategyHint`

## Optional Wiring

The shared memory follow-up context can build the detector after FollowUpExecution and before EceStrategyLines. Hub, Ece, and Report presentation helpers can read the result without changing routes or state.

## Future Persist Requirement

A later explicit persist pass would be needed for stronger tracking:

- `selectedDecisionKind`
- operation choice history
- portfolio choice history
- follow-up execution history
- optional surfaced-day cooldown

## Boundaries Not Changed

- no persist
- no `SAVE_VERSION`
- no `applyDecision`
- no day pipeline rewrite
- no event selection rewrite
- no resource/cost mutation
- no reward payout

## Next Prompt

Possible next pass: Dominant Strategy Persist Binding or Device Playtest.
