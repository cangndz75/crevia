# Crevia Ece Memory & Strategy Line Pack

## Scope

This pass adds a deterministic, source-guarded Ece strategy line pack for presentation-time use.

It does not add persistence, does not change `SAVE_VERSION`, does not call LLM/OpenAI/network APIs, and does not wire into `applyDecision`, `endDay`, balance, analytics, RevenueCat, navigation, assets, or core day pipeline behavior.

## Runtime Model

The module lives under `src/core/eceStrategyLines/` and accepts optional existing subsystem outputs:

- one more day retention
- portfolio defer risk
- daily capacity portfolio
- authority gameplay expansion
- decision consequence / carry-over / butterfly traces
- district memory / city archive / story chain signals
- map gameplay binding / active operation map binding
- resource pressure
- player style, only when visible and medium/high confidence

If a source is absent, the model does not invent that source's claim. For example, it does not mention city memory without memory input, authority without authority input, or map pressure without map input.

## Selection Rules

- Day 1 returns a single calm fallback line.
- Later days sort candidates by deterministic priority and source rank.
- One More Day and portfolio defer sources are prioritized for report/continuation use when present.
- Exact recent line IDs/texts are skipped.
- Technical enum tokens are removed from displayed line text.
- Presentation helpers clamp line, short line, and accessibility lengths.

## Optional Presentation Hooks

The existing surfaces accept optional `eceStrategyLines` input:

- Hub advisor can use a non-duplicate strategy line as a reason fallback.
- End-of-day report view model exposes `eceStrategyLine` as an optional field without changing existing tomorrow notes or One More Day card behavior.
- Center continuation cards may add one optional Ece note card when unique.

No caller is required to pass this input, so existing behavior remains unchanged unless the new result is provided.

## Verification

Run:

```bash
npm run verify:ece-strategy-lines
npm run analyze:ece-strategy-lines
```

Recommended adjacent checks after changes:

```bash
npm run verify:center-advisor
npm run verify:report-ui
npm run verify:center-continuation-cards
npm run typecheck:tsc
```
