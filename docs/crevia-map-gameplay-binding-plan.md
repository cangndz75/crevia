# Crevia Map Gameplay Binding Plan

## Purpose

This is a planning-only pass. No runtime, UI, persistence, balance, navigation, analytics, store, RevenueCat, marker, route, animation, or map component implementation was changed.

Goal: define how the Crevia map should move from a good-looking state surface into a city decision board. The map should answer: "Why should I open this now, and which decision does it help me make?"

Evidence inspected:

- `src/features/map/screens/MapScreen.tsx`
- `src/features/map/presentation/mapScreenPresentation.ts`
- `src/features/map/utils/mapUiPresentation.ts`
- `src/features/map/utils/mapResourcePresentation.ts`
- `src/features/map/utils/containerMapAdapter.ts`
- `src/features/map/utils/vehicleMapAdapter.ts`
- `src/features/map/components/MapHeroPanel.tsx`
- `src/features/map/components/MapPresenceSvgLayer.tsx`
- `src/features/map/components/MapRouteHintLayer.tsx`
- `src/core/mapLayers/mapLayerUnlockModel.ts`
- `src/core/mapLayers/mapLayerConstants.ts`
- `src/core/mapPresence/mapPresencePresentation.ts`
- `src/core/map/mapDistrictIntelligencePresentation.ts`
- `src/core/activeTaskRoutes/activeTaskRouteUiPresentation.ts`
- `src/core/rankPermissions/rankPermissionMatrix.ts`
- `docs/crevia-core-loop-boredom-gameplay-depth-plan.md`

Protected boundaries:

- `SAVE_VERSION` unchanged
- Persist shape unchanged
- `applyDecision` unchanged
- Day pipeline unchanged
- Event selection unchanged
- Balance unchanged
- Navigation unchanged
- Map UI redesign not done
- Marker, route, layer animation not implemented

## Current Map System Analysis

| System | What it shows now | Source data | Link to player decision | Missing |
| --- | --- | --- | --- | --- |
| Active operation | Overview overlay, active event context, selected district focus, active route preview when available | `activeEvents`, `assignments`, `operationSignals`, `buildMapActiveOperationOverlayModel`, `buildActiveTaskRouteForEvent` | Helps understand where the current event sits in the city | Does not yet expose a clear map-first operation choice or result trace state sequence |
| Map layers | Base, identity, resource, fatigue, social, crisis, trust, memory, active route, event family, operation era, future city growth layers with day/permission gates | `CREVIA_MAP_LAYER_DEFINITIONS`, `resolveMapLayerStatus`, authority permissions | Explains what information the player is allowed to see | Layer selection is mostly visibility/summary, not always a new decision advantage |
| District trust | District intelligence trust lines and chips | `buildDistrictTrustMapLine`, district identity/trust runtime context | Helps read which district is socially sensitive | Needs clearer "choose this district/avoid this district because trust is fragile" usage |
| Social pulse | District intelligence, social-domain presence, resource/social layer definitions | `operationSignals`, event domain focus, social pulse inputs, district intelligence | Helps decide if public-facing actions need calmer strategy | Spatial social source is still compact; no strong map pressure comparison across districts |
| Resource pressure | Resource overlay panel lines, district badges, highlighted districts, presence lines | `operationalResources`, `operationSignals`, `buildMapResourcePresentationBundle`, `buildOperationalResourcePresenceLiteModel` | Helps avoid overusing strained capacity | Global resource pressure can appear without enough district-specific action framing |
| Personnel presence | Team markers when domain/day permit; fatigue-derived status | `buildTeamPresenceMarkers`, personnel groups, event domain focus | Supports dispatch/team decisions | It is a warning marker, not yet a clear "pick this team vs delay" board |
| Vehicle presence | Vehicle pins/badges and vehicle presence marker status | `vehicleState`, `vehicleMapAdapter`, `buildVehiclePresenceMarkers`, vehicle fatigue visuals | Supports vehicle/route/maintenance choices | Needs stronger route suitability and maintenance consequence comparison |
| Container presence | Container pins, cluster markers, container pressure statuses | `containerState`, `containerMapAdapter`, `operationalResources.containerNetworksByDistrictId` | Supports collection/environment priority | Strongest spatial data, but should better connect to operation selection and recovery |
| Operation signals | District intelligence, map reactions, resource overlay, active route, post-pilot context lines | `operationSignals.dailyFocus`, priority district, overall/domain signals | Helps identify today's operational pressure | Signals should map to specific spatial roles, not generic warning copy |
| Tomorrow risk | Presence inference can use report tomorrow preview domain; map can hint next-day domain | `buildReportTomorrowPreview`, carry-over/domain inference, operation signals | Helps decide what to check tomorrow | Should not display if no spatial source; needs explicit "tomorrow on this district/line" source guard |
| Result traces | Before/after summary, map reactions, district report card, city archive/report lines feed map context | `buildMapBeforeAfterSummary`, `buildMapReactionLiteModel`, city archive, district report card | Shows that past decisions affected the city | Trace is still subtle; result stamp/memory intensity should be a later implementation pass |

Current verdict: the map is not decorative anymore. It is a viewing and situational-awareness surface with real data. It is not yet the primary decision board because it rarely asks the player to compare spatial options and commit a choice from map pressure.

## Map Gameplay Role Model

Planning-only type shape:

```ts
type MapGameplayRole =
  | 'overview'
  | 'risk_reader'
  | 'operation_tracker'
  | 'resource_board'
  | 'district_memory'
  | 'route_support'
  | 'result_trace'
  | 'authority_unlock_surface';

type MapGameplayBinding = {
  id: string;
  role: MapGameplayRole;
  title: string;
  playerQuestion: string;
  supportedDecision: string;
  sourceSystems: string[];
  requiredPermission?: string;
  requiredRank?: string;
  visibilityLevel: 'hidden' | 'teaser' | 'summary' | 'detailed';
  dayRange: 'day_1' | 'day_2_7' | 'day_8_plus' | 'day_10_plus';
  implementationRisk: 'low' | 'medium' | 'high';
};
```

Planning bindings:

| id | role | player question | supported decision | source systems | visibility | day range | risk |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `map_overview_day1` | `overview` | Aktif olay nerede? | Event konumunu ve mahalleyi anlama | active events, district identity | summary | day_1 | low |
| `active_operation_tracker` | `operation_tracker` | Operasyon hangi fazda ve nerede? | Flow ekranina girmeden saha durumunu okuma | active event, assignment, active task route | summary/detailed | day_2_7 | medium |
| `district_risk_reader` | `risk_reader` | Hangi mahalle hassas? | Sakin/kalici/hizli strateji secimi | district trust, social pulse, operation signals | teaser/summary | day_4_7 | medium |
| `resource_pressure_board` | `resource_board` | Kaynak baskisi nerede? | Ekip/arac/konteyner onceligi | operational resources, presence, container/vehicle adapters | summary/detailed | day_8_plus | medium |
| `district_memory_trace` | `district_memory` | Onceki kararim burada iz birakti mi? | Ayni mahalleye geri donme veya toparlama karari | district memory, city archive, carry-over | teaser/summary | day_8_plus | high |
| `route_support_hint` | `route_support` | Bu hatta rota/arac baskisi var mi? | Dispatch/route/maintenance karari | active task route, vehicle maintenance, operation signals | summary/detailed | day_8_plus | medium |
| `result_trace_stamp` | `result_trace` | Sonuc sehirde nerede gorundu? | Sonraki gun hangi bolgeyi kontrol edecegini bilme | decision result, before/after, map reactions | summary | day_8_plus | medium |
| `authority_layer_surface` | `authority_unlock_surface` | Yetkim bana hangi yeni bilgiyi acti? | Daha iyi bilgiyle planlama | rank permissions, map layers | teaser/detailed | day_10_plus | medium |

## Player Questions

Day 1-3:

- Aktif olay nerede?
- Bu olay hangi mahalleyi etkiliyor?
- Operasyon sahada mi?
- Haritadaki temel risk ne kadar yakin?

Day 4-7:

- Hangi mahallede guven hassas?
- Hangi bolgede sosyal tepki var?
- Hangi operasyon izi kaldi?
- Hangi rota, ekip veya konteyner baskisi olusuyor?
- Harita bana "bugun daha sakin mi, hizli mi, kalici mi davran" sorusunda ipucu veriyor mu?

Day 8+:

- Bugun hangi bolgeye oncelik vermeliyim?
- Kaynak baskisi nerede yogunlasiyor?
- Hangi arac/ekip/konteyner hatti riskli?
- Hangi mahalle gecmis kararlarimdan etkilenmis?
- Hangi operasyon harita baskisina gore daha mantikli?

Day 10+:

- Bir operasyonu sadece listeden degil, harita baskisindan secebilir miyim?
- Layer acilimlari yeni karar alani yaratiyor mu?
- Sehir hafizasi spatial olarak okunuyor mu?
- Yetki artisi bana sadece daha cok renk degil, daha iyi karar bilgisi verdi mi?

## Active Operation Binding Plan

Active operation must be the clearest element on the map.

Planned states:

| Operation phase | Map role | Copy direction | Data source |
| --- | --- | --- | --- |
| Before inspect | Event point | "Olay noktasi" | active event district/neighborhood |
| After plan | Impact expectation | "Plan etkisi bekleniyor" | selected plan, event domain focus |
| After dispatch | Field movement | "Ekip yolda" | assignment, active task route |
| Field | Live status | "Operasyon suruyor" | event in progress, route stage |
| Result | City trace | "Sehir izi olustu" | result snapshot, before/after, map reaction |

Rules:

- The map must not repeat the whole operation flow.
- The map should show the operation's position and spatial consequence.
- Active marker should include domain color/icon, risk band, selected-plan hint if real, route/impact hint if sourced, and field/result state.
- No fake route: route line/hint only if active task route, assignment, or map presence route source exists.

## District Trust And Memory Layer Plan

District trust and memory are the strongest map-gameplay identity systems because they make the city feel like it remembers the player.

Visibility:

- Low authority: teaser only, such as "bolge etkisi var".
- District supervisor / `district_trust_preview`: trust band and short reason.
- `district_memory_trace_preview`: memory trace and previous-decision hint.
- Higher map permissions: compare districts and show which district needs action first.

Copy examples:

- "Bu mahallede guven hassas."
- "Dunku karar burada iz birakti."
- "Sosyal tepki bu bolgede daha hizli buyuyebilir."

Guards:

- No fake district memory. If no real trust/memory/carry-over/archive signal exists, use identity-only, neutral, or hidden state.
- Crisis overlay may compress trust/memory to avoid noisy map priority.
- Repeated decisions may raise memory intensity later, but that belongs to a later implementation prompt.

## Resource, Vehicle, Personnel, Container Role

These markers should be decision support, not decoration.

Personnel:

- Shows fatigue, availability, field status, or social-watch role.
- Supports dispatch decisions: assign now, delay, or choose lower-load team.
- If personnel data is not real, do not show a staffing gameplay claim.

Vehicle:

- Shows maintenance risk, route suitability, workload, fuel/charge pressure.
- Supports vehicle choice and maintenance-window decisions.
- Vehicle marker should answer "Is this route safe for this fleet state?"

Container:

- Shows network pressure, critical points, fill/maintenance/social pressure.
- Supports collection priority and environment/container event differentiation.
- Container is the best current candidate for map-first priority because it already has district/unit data.

Resource:

- Shows district-specific pressure only when the source can identify a district or line.
- If pressure is global only, prefer a panel/chip outside the spatial layer; do not pretend it belongs to a district.

## Operation Signals And Tomorrow Risk Map Role

Signals should become spatial only when they have a spatial source.

| Signal | Map expression | Guard |
| --- | --- | --- |
| `route_pressure` | Route/hatt highlight, vehicle marker warning | Needs route/vehicle/assignment source |
| `social_sensitivity` | District soft warning, trust/social layer hint | Needs district/social source |
| `vehicle_maintenance_pressure` | Vehicle marker warning or route support note | Needs vehicle group/source |
| `container_network_pressure` | Container cluster warning | Needs container district/network source |
| `tomorrow_risk` | "Yarin dikkat" marker or layer teaser | Needs district/domain source; otherwise report/hub only |

Rules:

- No fake urgent.
- Tomorrow risk should not be forced onto the map without a district, route, vehicle, team, or container anchor.
- Operation signals should help the player decide "where first" or "which resource first", not only say "risk exists".

## Authority To Map Layer Binding

Authority should make the player see better information, not just more colored overlays.

| Layer | Unlock condition | Information given | Decision supported | Risk |
| --- | --- | --- | --- | --- |
| `map_trust_layer` / `district_trust` | `district_trust_preview`, later `map_trust_layer`; district supervisor/city operations manager | Which districts have fragile/stable trust | Choose calm vs visible-service vs recovery strategy | Medium: can become passive color layer |
| `map_resource_layer` / `resource_pressure` | `map_resource_layer`, field coordinator/city operations manager; resource pressure source | Where resource strain is concentrated | Pick district/operation/resource priority | High: fake spatial pressure if no district source |
| `map_social_layer` / `social_pulse` | `map_social_layer`, city operations manager | Where social reaction may grow | Choose communication/safety/permanent strategy | Medium: needs social source guard |
| `map_route_layer` / `active_task_route` | `assignment_fit_preview` and active task route context | Route/assignment line, stage, pressure | Dispatch and route support decision | Medium: route can look like pathfinding when it is only a hint |
| `map_memory_layer` / `district_memory` | `district_memory_trace_preview`, later trust/map permissions | Where past decisions left traces | Return, repair, or avoid repeating pressure | High: must not invent memory |
| `crisis_watch` | `map_crisis_layer` and crisis state | Crisis priority district/line | Choose response priority | High: visual urgency must be capped |
| `event_family_signal` | `event_family_rotation_preview`, Day 8+ | Repetition/family signal | Choose variety or prepare for repeated domain | Medium: can feel meta if not tied to city |
| `operation_era` | `operation_era_preview`, Day 8+ | Current era focus | Interpret Day 8+ strategic layer | Medium: needs concrete decision hook |

## Map Animation Planning

Implementation is explicitly out of scope. Candidate plan:

| Animation | Purpose | Timing | Guard |
| --- | --- | --- | --- |
| Active operation marker pulse | Show current operation focus | 2-3 bounded pulses | No infinite pulse |
| Dispatch route line draw | Show route/assignment direction | 500-900ms | Only with sourced route hint |
| Vehicle/personnel soft move | Show field movement | 400-700ms small offset | Density cap; no fake live tracking |
| District layer fade | Switch layer context | 180-300ms | Reduced motion: instant/short |
| Result trace stamp | Show city memory after result | 300-600ms | Only after real result |
| Before/after reveal | Show changed district status | 300-600ms | No claim without before/after source |
| Warning attention pulse | Focus risk without panic | 1-2 pulses | Never infinite; crisis priority cap |
| Selected layer transition | Help layer comprehension | 180-300ms | Avoid map pan/zoom excess |

Motion rules:

- Reduced motion must be supported.
- No endless pulse.
- Dense marker states must cap animation count.
- Pan/zoom animation should be restrained.
- Animation should explain state transition, not decorate static data.

## Day 8+ Map Gameplay Plan

Day 8+ should make the map feel like a new strategic layer.

Minimum expectation: each Day 8+ map open should do at least one of these when sourced:

1. Operation priority: "Bugun bu bolgede baski artiyor."
2. Resource/route visibility: "Bu hatta arac/ekip baskisi var."
3. Memory trace: "Gecmis kararin bu mahallede etki birakti."

Day 10+ should add combination value:

- Trust + social: choose low-conflict communication or visible service.
- Resource + route: choose dispatch timing or maintenance-safe operation.
- Container + memory: choose cleanup/recovery where previous neglect left pressure.
- Authority + layer: unlock explains why the player now sees the signal.

The map should not become "more markers". It should become "better spatial decisions".

## Implementation Prompt Order

| Order | Prompt | Target | Files likely touched | Verify need | Risk |
| ---: | --- | --- | --- | --- | --- |
| 1 | Map Gameplay Binding Model Pass | Add docs-backed `MapGameplayBinding` model and verifier, no UI redesign | `src/core/mapGameplayBinding/*`, script, package | `verify:map-gameplay-binding`, typecheck | Low |
| 2 | Active Operation Map Binding Pass | Active operation marker/state/route hint/result status | `MapScreen`, `mapUiPresentation`, active task route/map components | `verify:active-operation-map-binding`, map UI verify | Medium |
| 3 | District Trust & Memory Layer Pass | Trust/memory visibility and source guards | `mapDistrictIntelligencePresentation`, map layer tests | `verify:map-layer-permission-binding`, district runtime verifiers | Medium |
| 4 | Resource / Vehicle / Personnel / Container Presence Pass | Make markers explicitly decision-supporting | `mapPresencePresentation`, resource/container/vehicle adapters | `verify:map-presence-gameplay`, resource/container/vehicle verifies | Medium-high |
| 5 | Result Trace / City Memory Map Pass | Result trace stamp and city memory spatial line | map before/after, reactions, decision consequence binding | `verify:map-result-trace`, decision consequence verify | Medium |
| 6 | Map Motion & Marker Animation Pass | Bounded pulse/route/layer fade/reduced motion | map motion/reaction components | `verify:map-motion-density`, screenshot/manual QA if UI changed | High |
| 7 | Map Gameplay QA | Day 1-10, Day 8+, density, performance, touch, accessibility | verifiers/analyzers/docs | `analyze:map-gameplay-depth`, map UI verify | Medium |

## Risks

| Risk | Explanation | Severity | Mitigation |
| --- | --- | --- | --- |
| Marker crowding | Too many markers turns the game into a noisy dashboard | high | Density caps, priority ordering, one primary marker cluster |
| Fake gameplay data | Claiming district/resource/route meaning without source | high | Source guards and hidden/neutral fallback |
| UI redesign drift | Planning turns into visual overhaul | medium | Docs-only now; later prompts scoped by pass |
| Performance | Marker/layer render and motion cost | high | Memoization, density cap, reduced motion, bounded animations |
| Permission confusion | Player cannot tell why a layer is hidden/visible | medium | Unlock copy tied to authority/rank and supported decision |
| Map repeats operation flow | Map becomes another operation screen | medium | Spatial-only role; flow details stay in operation screens |
| Over-urgency | Warning markers make the city feel constantly critical | medium-high | Panic term guard, capped pulse, no fake urgent |
| Day 8+ sameness | More layers but same daily loop | high | Map must introduce priority/resource/memory decisions |

## Analyze And Verify Plan

Future commands and what they should check:

- `verify:map-gameplay-binding`: binding ids unique, roles valid, day gates valid, no unsupported source claims.
- `verify:active-operation-map-binding`: active operation state sequence, sourced route hint, no flow duplication, safe copy.
- `verify:map-layer-permission-binding`: layer status follows day/rank/permission/source rules, no locked/paywall copy.
- `verify:map-presence-gameplay`: personnel/vehicle/container markers require real source and support a named decision.
- `verify:map-result-trace`: result trace appears only after real result and does not fabricate memory.
- `verify:map-motion-density`: bounded animation counts, reduced motion, marker density cap.
- `analyze:map-gameplay-depth`: Day 1-10 matrix for player questions answered, Day 8+ strategic layer score, map decision-support score.

Existing adjacent checks likely relevant after implementation:

- `npm run verify:map-ui`
- `npm run verify:map-layers`
- `npm run verify:map-presence`
- `npm run verify:map-before-after-state`
- `npm run verify:map-reactions`
- `npm run verify:map-reaction-motion`
- `npm run verify:map-district-intelligence`
- `npm run verify:active-task-route`
- `npm run verify:operational-resources`
- `npm run verify:vehicle-maintenance`
- `npm run verify:container-network`
- `npm run verify:rank-permissions`

## Acceptance Notes

This pass only adds `docs/crevia-map-gameplay-binding-plan.md`.

No code implementation was done, so TypeScript is not required by this prompt. If later prompts change code, run `npx tsc --noEmit` plus the relevant map verifiers.

Next prompt recommendation: `Map Gameplay Binding Model Pass` if the priority is map implementation sequencing; `One More Day Retention Pass` if the priority is retention before map implementation.
