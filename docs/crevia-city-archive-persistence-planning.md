# Crevia City Archive Persistence V1 Planning

## 1. Amac

City Archive Persistence V1 implementation icin hedef persist modeli, migration guard, backfill strategy, pruning rules, integration plan ve verify kapsamini hazirlamak. Bu pass implementation degildir.

## 2. Neden simdi gerekli

City Journal Lite, District Report Card, Ece relationship, Reward/Comeback, Story Chain hint, Report, Hub, Map Echo ve Motion Foundation artik ayni sehir gecmisi hissine dokunuyor. City Archive V1 bu sinyalleri ileride kalici ama kontrollu bir sehir hafizasina baglamak icin gereklidir.

Expo SDK v54 checked: https://docs.expo.dev/versions/v54.0.0/

## 3. Current derived systems

- City Journal Lite: presentation/derived mode.
- District Report Card Lite: derived district signal summary.
- Ece Operational Relationship: previous decision, district and player style signals.
- Reward/Comeback: visible positive and recovery moments.
- City Echo, Tomorrow Risk, Decision Impact, Report, Map Reaction and Motion Foundation: completed adjacent echoes.
- Story Chain: foundation/runtime hint exists; persistent runtime is not active.
- District memory/trust runtime exists; full archive does not.

## 4. CityArchiveV1 target model

`CityArchiveV1State` target fields:

- version: 1
- createdAtDay
- updatedAtDay
- entries: `CityArchiveEntry[]`
- districtSummaries: `Record<DistrictId, CityArchiveDistrictSummary>`
- playerStyleSummary
- eceRelationshipSummary
- rewardComebackSummary
- storyChainSummary
- pruningState
- migrationMeta

`CityArchiveEntry` target fields include id, day, kind, optional district/domain/event/decision references, sourceKind, title, shortLine, optional report/ece/social/map lines, impact bands, visibility, priority, duplicateKey and createdFrom.

Entry kinds include decision_record, district_shift, trust_recovery, route_balanced, container_relief, resource_pressure, resource_recovery, social_response, crisis_prevented, main_operation_started, comeback_available, comeback_completed, ece_prediction_confirmed, story_chain_step and report_milestone.

Summary models cover district, player style, Ece relationship, reward/comeback, story chain, pruning and migration metadata.

## 5. Stored vs not stored data

Stored:

- Day number
- District reference
- Event/decision reference
- Short deterministic copy
- Kind/domain/source
- Duplicate key
- Trend bands
- Summary pointers
- Player-facing short lines

Not stored:

- Raw event body dump
- Full raw save copy
- PII
- GPS/location
- Store/payment raw data
- Analytics raw events
- Debug-only fields
- Long generated text
- AI raw prompt/response

## 6. Migration V24 plan

Current baseline is SAVE_VERSION 23. Implementation likely targets SAVE_VERSION 24, but this pass does not bump version.

Plan:

- Existing saves without cityArchive initialize empty archive.
- Day 1-3 saves create no heavy archive, or only compact empty metadata.
- Day 4+ saves may backfill minimal entries from lastDailyReport, decisionHistory and CityJournal Lite signals if available.
- Day 8+ saves may initialize one main_operation_started entry if pilot completed and main operation is active.
- Corrupt archive falls back to empty archive plus warning marker.
- Migration is idempotent.
- Re-running migration does not create duplicate entries.
- Missing district memory/trust/contentPackMeta never crashes migration.

`MigrationMeta` fields: migratedFromSaveVersion, migratedAtDay, backfillStrategy, backfillEntryCount and warnings.

## 7. Backfill strategy

Backfill source priority:

1. city.day / lastDailyReport
2. decisionHistory / previous decision effect
3. CityJournalLite model outputs
4. RewardComeback primary moments
5. DistrictReportCard current dominant issue
6. MainOperationFeel day 8 marker
7. Carry-over memory
8. fallback city archive started marker

Rules:

- Backfill max 3 entries.
- Day 1 has no heavy archive.
- Backfill copy must not imply reconstructed history.
- User-facing lines are deterministic.
- Duplicate key guard is required.

## 8. Pruning / size guard

Default maxEntries is 120. Rationale: 120 keeps roughly two weeks of meaningful moments while staying small for persisted saves.

Plan:

- maxEntries: 120
- maxEntriesPerDistrict: 20
- keepLastNDaysDetailed: 10
- Older entries compact into summaries.
- Unresolved story chain entries are preserved.
- Main operation milestone entries are preserved.
- Positive/comeback important entries are preserved.
- Low priority fallback entries are pruned first.

## 9. Integration plan

A) City Journal

- Archive-backed mode can take priority when archive exists.
- Current derived fallback remains when archive is absent.

B) District Report Card Full

- Last 3 events can come from archive entries.
- Dominant issue, social tone and player style can come from district summary.

C) Ece Relationship

- previousDecisionReference can be strengthened from archive.
- prediction confirmed/softened can point to archive entry.

D) Reward/Comeback

- Completed comeback and recent positive entries can be stored.
- Repeat reward spam can be blocked with archive duplicate keys.

E) Story Chain Persistent Runtime

- Chain steps can create archive entries in a later implementation.
- Unresolved chain summary can be retained.

F) Report

- Day-end report close is the safest persistent write point.
- Report generation can create transient archive candidates first.

G) Map

- journal_trace can read recent archive entries later.

## 10. Write timing design

Options:

- applyDecision sonrası immediate write
- endCurrentDay/report close sonrası write
- post-day refresh write

Recommended approach:

- Primary persistent archive write happens after endCurrentDay/report close.
- applyDecision may produce transient candidates later, but should not persist append immediately in V1.
- Idempotency marker is required: lastArchivedDay, archivedDecisionIds or duplicateKey.

## 11. Idempotency guard

Implementation guards:

- same duplicateKey is not written twice
- same day + same eventId + same kind is not written twice
- migration re-run creates no duplicate
- report reopen creates no duplicate
- app resume creates no duplicate
- Day 8 main_operation_started writes once
- story chain step writes once per chain step
- reward/comeback completed writes once

## 12. Risk table

| Risk | Guard |
| --- | --- |
| Persist shape changed too early | This pass is planning only; Persist shape degismez |
| SAVE_VERSION bumped too early | SAVE_VERSION 23 kalir |
| Duplicate archive entries | duplicateKey and once-only guards |
| Archive grows without bound | maxEntries, per-district cap and pruning |
| Raw/private data stored | no PII, no GPS, no raw save/event/payment/analytics dumps |
| Migration crashes old saves | empty fallback and missing-source tolerant plan |
| Story Chain runtime opened early | dependency documented only |
| Public launch state faked | no manual blocker or evidence state changes |

## 13. Implementation prompt scope

Future implementation prompt should be narrow:

- Add `cityArchive` persist field under SAVE_VERSION 24.
- Add migration function with idempotency tests.
- Add append/compact helpers.
- Wire day-close/report-close candidate write only.
- Keep derived fallbacks until archive exists.

## 14. Non-goals

- No persist shape change.
- No SAVE_VERSION bump.
- No migration implementation.
- No City Archive runtime activation.
- No Story Chain Persistent Runtime activation.
- No District Report Card Full.
- No applyDecision change.
- No dayPipeline change.
- No event generation change.
- No gameplay balance change.
- No new route.
- No new UI screen.
- No manual launch blocker close.
- No fake evidence.
- No AI, Remote Config or Live-Ops.

## 15. Verify sonucu

Expected:

- `npm run verify:city-archive-planning` exits 0.
- `npm run typecheck` exits 0.
- SAVE_VERSION remains 23.
- Persist shape remains unchanged.
- Public launch remains blocked.
- Evidence verified may remain 0.

## 16. Sonraki prompt

City Archive Persistence V1 Implementation: SAVE_VERSION 24 migration + persisted `cityArchive` field + idempotent day-close archive append, without Story Chain Persistent Runtime or District Report Card Full activation.

## 17. Commands

```bash
npm run typecheck
npm run verify:city-archive-planning
npm run verify:city-journal
npm run verify:district-report-card
npm run verify:advisor-relationship
npm run verify:reward-comeback
npm run verify:story-chains
npm run verify:report-ui
npm run verify:map-reactions
npm run verify:motion-foundation
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
npm run verify:release-candidate
npm run verify:manual-launch-tracker
```
