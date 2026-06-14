# Decision Strategy History Persist Binding Pass

Scope: add a bounded persisted `strategyHistory` slice for cross-session decision and strategy memory.

Persist contract:

- `SAVE_VERSION` moves from 26 to 27.
- Storage key remains `crevia-game-state-v1`.
- v26 saves migrate with an empty `strategyHistory`.
- Existing persisted fields keep their names and response shape.

State bounds:

- decision history: 40 records
- operation choice history: 40 records
- portfolio choice history: 60 records
- follow-up execution history: 30 records
- dominant strategy surfaced history: 30 records
- age pruning: 21 days
- duplicate IDs are replaced by the latest normalized record.

Runtime binding:

- `useGameStore.applyDecision` appends a strategy decision record beside the existing `decisionHistory` append.
- Operation, portfolio, follow-up execution, and surfaced dominant strategy records use exported append/adaptor helpers so callers can persist them without changing source model outputs.
- Follow-up execution duplicate guards can rebuild `executedActionIdsToday` from persisted history after reload.
- Dominant strategy detection can read persisted strategy history through `buildDominantStrategyInputFromPersistedHistory`.

Non-goals:

- No event generation changes.
- No day pipeline changes.
- No decision effect or cost changes.
- No storage key change.
- No raw source object persistence.
