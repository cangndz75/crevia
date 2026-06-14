# Crevia Active Operation Map Binding Pass

## Purpose

Turn the map from a passive “event exists” indicator into a sourced, phase-aware operation board. The player should understand where today’s operation sits in the city, which district pressure matters, which phase the operation is in, and what decision the map supports.

This pass is presentation-time only. No persistence, SAVE_VERSION, applyDecision, day pipeline, navigation, animation, or map redesign changes were made.

## Model

Core module: `src/core/activeOperationMapBinding/`

- `activeOperationMapBindingTypes.ts` — phases, signal kinds, binding + card models
- `activeOperationMapBindingModel.ts` — `resolveActiveOperationMapPhase`, `buildActiveOperationMapBinding`
- `activeOperationMapBindingPresentation.ts` — `buildActiveOperationMapCardModel`, `enrichMapGameplayActiveOperationTracker`
- `verifyActiveOperationMapBindingScenario.ts`
- `index.ts`

Scripts:

- `npm run verify:active-operation-map-binding`
- `npm run analyze:active-operation-map-binding`

## Phase sequence

| Phase | Player label (examples) | Spatial meaning |
| --- | --- | --- |
| `before_inspect` | Olay noktasi | Event located; flow not started (Day 1) |
| `inspecting` | Inceleme | Findings shape district/resource pressure |
| `planning` | Plan secimi | Strategy choice affects district impact |
| `dispatch_ready` | Yonlendirme hazir | Assignment fit matters |
| `dispatching` | Ekip yolda | Route/team pressure in transit |
| `field_active` | Sahada | Operation executing on site |
| `field_paused` | Saha karari | Micro-decision pause |
| `completed` | Tamamlandi | Operation closing locally |
| `result_trace_available` | Sehir izi | Explicit result trace source only |
| `unknown` | Operasyon | Safe fallback |

Phase copy is selected via `mapSignalCopy` (`selectActiveOperationMapCopy`) — no technical enums reach UI.

## Source guards

- **Route:** `canShowRouteHint` and `routeLine` only when `activeTaskRoute.visible` + `mapLine` source exists. No fake path animation.
- **District personality:** `districtLine` only from `DistrictPersonalityProfile.mapBias.mapSignalLine` when not fallback. Day 1 hidden. Summary/detailed requires permission on Day 2–7; Day 8+ with permission.
- **Gameplay pressure:** `pressureLine` from `EventGameplayVarietyProfile` only when `primaryPressure !== calm_standard`. Day 8+ always eligible; Day 2–7 requires resource/assignment permission.
- **Result trace:** `result_trace_available` only when `resultRouteAvailable` flag is passed explicitly.
- **Tomorrow risk / memory / crisis:** not invented by this module.
- **Fallback:** `unknown` phase + low confidence when no active event.

## Integrations

### MapGameplayBinding

`enrichMapGameplayActiveOperationTracker` enriches `active_operation_tracker` decision lines from `ActiveOperationMapBinding` without duplicating the full binding model.

### Map UI (minimal)

- `MapScreen.tsx` — builds binding + card from active event, assignment, route preview, district personality, gameplay variety, authority permissions
- `MapHeroPanel.tsx` / `CityMapCard.tsx` — existing live-operation card reads `ActiveOperationMapCardModel` (phase, map line, decision line, supporting lines, CTA)
- Overflow guards preserved: `numberOfLines`, `minWidth: 0`, `flexShrink`

## Day behavior

| Range | Behavior |
| --- | --- |
| Day 1 | Summary only; `before_inspect`; no district/route/pressure spam |
| Day 2–7 | Phase + limited sourced context with permission |
| Day 8+ | At least one strategic sourced line when sources exist |
| Day 10+ | Max 2 supporting lines on card (route > district > pressure priority) |

## Authority visibility

Detailed visibility requires relevant permissions (`assignment_fit_preview`, `district_trust_preview`, `resource_pressure_summary`, map layer permissions). Without permission: teaser/summary only — no locked spam.

## Verification

`verify:active-operation-map-binding` checks phase resolver, source guards, card overflow integration, MapScreen wiring, SAVE_VERSION/persist boundaries.

Related suites that must stay PASS:

- `verify:map-gameplay-binding`
- `verify:map-ui`
- `verify:active-task-route`
- `verify:district-personality`
- `verify:event-gameplay-variety`

## Unchanged boundaries

- Map UI redesign — no
- Marker/route animation — no
- Persist shape / SAVE_VERSION — no
- applyDecision / day pipeline / event selection / balance / navigation — no

## Next prompt

- **Map Signal Copy Pack** — expand copy variety and repetition guards
- **Daily Capacity / Operation Portfolio Planning** — multi-operation prioritization board
