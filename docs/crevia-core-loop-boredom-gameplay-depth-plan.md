# Crevia Core Loop Boredom & Gameplay Depth Plan

## Scope

This is a planning and audit document. No runtime, UI, persistence, balance, navigation, analytics, store, RevenueCat, or content implementation was changed.

Evidence used:

- `src/store/useGameStore.ts`
- `src/store/gamePersist.ts`
- `src/core/game/applyDecision.ts`
- `src/core/game/ensureDailyEventsForDay.ts`
- `src/core/game/refreshPilotEventsFromGameState.ts`
- `src/core/game/refreshPostPilotEventsFromGameState.ts`
- `src/core/postPilot/postPilotEventConstants.ts`
- `src/core/postPilot/postPilotEventEngine.ts`
- `src/core/contentRuntimeActivation/contentRuntimeActivationModel.ts`
- `src/core/contentRuntimeActivation/contentRuntimeActivationFullImplementationConstants.ts`
- `src/core/eventFamilies/eventFamilyVariantModel.ts`
- `src/core/eventFreshness/eventFreshnessGuard.ts`
- `src/core/authority/authorityConstants.ts`
- `src/core/authority/authorityPermissionPreviewModel.ts`
- `src/core/rankPermissions/rankPermissionMatrix.ts`
- `src/core/mapLayers/mapLayerUnlockModel.ts`
- `src/core/mapPresence/mapPresencePresentation.ts`
- `src/core/tomorrowRisk/tomorrowRiskModel.ts`
- `src/core/rewardComeback/rewardComebackModel.ts`
- `src/core/operationalResources/operationalResourceEngine.ts`
- `src/core/teamSpecialization/teamSpecializationEngine.ts`
- `src/core/vehicleMaintenance/vehicleMaintenanceEngine.ts`
- Existing planning docs under `docs/`, especially the center, operation flow, post-pilot, content activation, authority, map, tomorrow risk, reward/comeback, story chain, city archive, and soft-launch audits.

Read-only analyzers run:

- `npm run analyze:full-loop`
- `npm run analyze:event-variety`
- `npm run analyze:post-pilot`
- `npm run analyze:carry-over`

Important constraint: this document does not recommend changing `SAVE_VERSION`, persist shape, `applyDecision`, or the core day pipeline as a first move. Those are protected systems for follow-up implementation prompts unless a later prompt explicitly asks for them.

## 1. Current Core Loop

| Phase | What the player does | System response | Game feel | Risk |
| --- | --- | --- | --- | --- |
| Day start / Hub | Reads city status, active target, Ece, operation focus, quick actions, daily reward route, signals | Builds daily goals, priority, operation signals, recommended plan, next unlock hints | Strong guidance | If signals stay compact, the morning can feel like reading the same dashboard |
| Event selection | Opens active event or operation agenda | Pilot uses `ensureDailyEventsForDay`; Day 8+ uses post-pilot event generation and content activation | Clear daily task | Day 8+ light loop is capped at 2 active events, so cadence can feel fixed |
| Inspect | Reviews event context, findings, evidence | Operation flow reveals scan/findings/Ece/context | Stronger than old event cards | If findings do not alter choice pressure, it becomes presentation depth |
| Plan | Picks among strategy styles | Plan phase shows expected impact and tradeoffs | Good decision framing | Strategy families can feel cosmetic if long-term differences are not surfaced |
| Dispatch / Field | Assigns/executes, handles live timeline and micro decisions | Personnel, container, vehicle, social, economy, XP, assignments, micro decisions, crisis, and operation signals react | Strongest systemic phase | Too many effects can be hidden in summaries instead of visible consequences |
| Result | Reads outcome, impact reveal, systems echo | Decision result model, city echo, carry-over, tomorrow risk, reward/comeback, map echoes may appear | Good feedback | Result can still under-explain why a decision mattered several days later |
| Day end report | Ends day and reviews report | End-of-day pipeline processes goals, priorities, carry-over, butterfly, authority, badges, social, resources, archive, story chain, maintenance, team specialization | Systemic closure | If tomorrow hook is low priority, report closes the day without a strong reason to return |
| Next day | Starts a refreshed loop | Day advances, daily systems refresh, events regenerate, post-pilot set refreshes | Stable | Stability can become sameness after Day 8+ without new verbs |

Summary: the loop is structurally clear and far more connected than a simple event picker. The main boredom risk is not missing systems; it is that many systems are already present but compressed into compact hints, previews, or report lines. The player may understand that the city changed without feeling that the next decision space changed.

## 2. First 10 Days Experience Matrix

| Period | What is new for the player? | What feels different? | What repeats? | Boredom risk |
| --- | --- | --- | --- | --- |
| Day 1 | Tutorial-safe hub, first event, first report, advanced systems hidden | Low pressure, guided first decision | Read event, choose decision, report | Low; biggest risk is too much locked/hidden context, not repetition |
| Day 2-3 | Daily goals, priority, carry-over, early map/resource hints, Ece continuity | Yesterday starts echoing forward | Same basic daily loop | Medium; carry-over works, but new gameplay verbs are still limited |
| Day 4-6 | More compact systems appear: district operation actions, reward/comeback, visible resource pressure, route/task hints | The city starts remembering and surfacing pressure | Event -> decision -> report remains stable | Medium; this is the best early window to prove decisions are remembered |
| Day 7 | Pilot completion, authority/badge evaluation, post-pilot offer/setup | Strong milestone and identity beat | Final report still closes like a report | Low-medium; milestone carries the day |
| Day 8+ | Post-pilot light mode, operation agenda, content runtime activation, operation era cues | New phase begins, more pack-origin variety can enter | Active events are still capped at 2 in light mode; many systems remain compact | High if treated as "same loop, longer"; medium if operation agenda and content activation are made visibly strategic |
| Day 10+ | Full/larger operation planning is documented, max 3 pack-origin is planned as future, deeper systems can surface | Potential for broader city management | Current light simulations still show 2 events/day | High unless Day 10+ unlocks new decision pressure, not only more content |

Answer to the Day 8+ question: Day 8+ currently begins a new layer in presentation and content eligibility, but in the light loop it does not fully become a new gameplay layer. `MAX_POST_PILOT_ACTIVE_EVENTS = 2`, with one anchor and one side event, keeps the daily rhythm intentionally controlled. Content activation adds variety, but without a new strategic constraint or new player verb, the player can still feel that the same daily loop simply continues.

## 3. Boredom Risk Categories

| Risk | Where it appears | Why it can become boring | Severity | Solution direction |
| --- | --- | --- | --- | --- |
| `same_daily_loop` | Day 8+ light operation, two-event cadence, report-to-hub cycle | The phase name changes but the action rhythm may not | high | Add Day 8+/10+ strategic pressure and new daily planning tradeoffs |
| `same_event_shape` | Event families and operation workflow | Inspect/plan/dispatch/field/result is strong, but every event can share the same shape | medium | Make domain-specific pressure change the workflow, not just copy |
| `weak_consequence` | Result/report/hub carry-over visibility | Systems update, but long-term difference may be hidden in compact lines | high | Decision Consequence Depth Pass |
| `weak_progression` | Authority/rank permissions | Many unlocks are preview/visibility oriented | medium-high | Convert key permissions into better choices or earlier information advantages |
| `weak_map_role` | Map layer/presence systems | Map has markers/layers but is mostly a surface, not a decision board | medium-high | Map Gameplay Binding Planning before visual redesign |
| `weak_resource_pressure` | Operational resources, maintenance, team specialization | Resource systems exist, but failure/strain may not force hard choices often enough | medium | Resource pressure balance audit with recovery-safe penalties |
| `too_much_text` | Hub, result, report, Ece, social, archive surfaces | Many compact summaries can still feel like reading instead of playing | medium | Prioritize fewer, sharper actionable lines |
| `too_many_locked_cards` | Early progression, map layers, authority preview | Locked content can motivate, but too much can feel like unavailable game | medium | Keep locked previews sparse and tied to next action |
| `low_retention_hook` | End-of-day report and tomorrow risk | Report can summarize today without a strong "tomorrow first move" | high | One More Day Retention Pass |
| `low_player_agency` | Strategy choices and daily planning | If balanced/default choices work everywhere, agency becomes weak | high | Strategy balance and consequence differentiation |

## 4. Decision Consequence Depth

The decision engine applies immediate metric, cost, resource, neighborhood, XP, and solved-event changes. The store then fans the result into economy, personnel, containers, vehicles, social pulse, operation signals, daily goal runtime, and reporting surfaces. End-of-day processing further links decisions into carry-over, butterfly, authority, badge, city archive, story chains, maintenance, team specialization, and tomorrow risk.

The issue is not whether consequences exist. They do. The issue is whether the player can predict, observe, and later recognize the difference between "fast", "balanced", and "lasting" styles.

| Area | Score /10 | Note |
| --- | ---: | --- |
| Short-term result | 8 | Metrics, costs, XP, solved events, and result presentation are clear. |
| Long-term trace | 6 | Carry-over, archive, story, maintenance, and team traces exist, but are not always player-salient. |
| Cross-system binding | 7 | Many systems are wired through the day pipeline; some are compact or indirect. |
| Player visibility | 6 | Result/report/hub show effects, but the causal chain can be too summarized. |
| Replayability | 6 | Different player styles are simulated, but strategy identity is not yet strongly divergent. |

Decision Consequence Depth average: 6.6/10.

Key finding: decisions are mechanically meaningful, but the game should make "I chose this yesterday, so today this opportunity/risk exists" more explicit. The next implementation pass should improve visibility and delayed consequence selection before adding new gameplay systems.

## 5. Event Variety / Freshness

Analyzer result: `analyze:event-variety` passed across 7 days x 6 scenarios, with 14 events, 13 unique titles, 8 categories, 3 neighborhoods, and no exact title repeats or two-day profile repeats in tested scenarios.

Existing content planning indicates much larger pack coverage: district, vehicle/route, container/environment, social trust, and crisis-adjacent packs, with Day 8+ runtime activation. Freshness guard penalizes family, district, domain, variant, echo, title/copy, and duplicate similarity repeats. This is a strong foundation.

Risk: variety can still be content variety rather than gameplay variety. A new title, district, or pack can still ask the player to perform the same choice pattern.

| Domain | Variety status | Repetition risk | Gap |
| --- | --- | --- | --- |
| transport | Good pack coverage and vehicle/route signals | medium | Needs route pressure to change available strategy, not only echo text |
| environment | Container/environment pack and pressure signals exist | medium | Needs different operational constraint, e.g. cleanup vs prevention vs recovery |
| social | Social trust and dynamic social echo are strong | medium | Needs social pulse to alter future risk/permission visibility more visibly |
| logistics | Daily plan, assignments, operational resources are connected | medium-high | Balanced/default plan may be too safe unless resource scarcity bites |
| maintenance | Vehicle maintenance runtime exists | medium | Maintenance windows need clear tradeoff and consequence in next-day choices |
| container | Container pressure and map presence exist | medium | Needs clearer district-level network memory and recovery/comeback rhythm |

Event Variety Risk: 6.8/10 risk quality, but 6/10 gameplay differentiation.

## 6. Progression / Authority Gameplay

Authority has ranks, trust thresholds, daily gain rules, permission preview, compact hub lines, profile/progression surfaces, and map layer gates. Rank permission definitions are broad and well organized, spanning core operation, planning, advisor, assignment, resource, district, map, crisis, story, and future city development.

The main gap is that many permissions are `isPreviewOnly`. This is safe and production-friendly, but it means progression can read as visibility/presentation rather than new agency.

| Authority / Unlock | Current status | Gameplay impact | Gap |
| --- | --- | --- | --- |
| Basic event inspection | Active from start | Establishes event loop | Mostly baseline, not a new unlock |
| Daily plan preview | Authority-gated preview | Helps morning planning | Needs stronger plan consequence feedback |
| Ece specialist notes | Authority-gated preview | Better advice | Needs advice to alter decision confidence, not only copy |
| Assignment fit preview | Authority-gated preview | Helps dispatch choices | Strong candidate for meaningful gameplay |
| Resource pressure summary | Authority-gated preview | Helps avoid overuse | Needs sharper resource scarcity decisions |
| District trust preview | Authority-gated preview | Helps choose district/social strategy | Needs clearer district memory carry-forward |
| District memory trace | Authority-gated preview | Strong retention potential | Needs "you caused this" visibility |
| District-specific operations | Preview plus runtime-lite actions | Adds scoped district operation layer | Good, but should remain narrow and not mutate core pipeline without explicit prompt |
| Crisis map layer | Preview/map gate | Adds risk awareness | Needs actionable map decisions |
| Team specialization preview | Runtime exists | Can affect team choice | Needs clearer assignment tradeoff loop |
| Vehicle maintenance window | Runtime exists | Can force short-vs-long-term vehicle choice | Needs player-facing cost and resolution clarity |
| Container network upgrade | Preview | Future resource progression | Needs real action or investment later |
| Map resource/social/trust layers | Map layer gates exist | Better spatial awareness | Needs map to support decisions, not just inspect state |
| Event family rotation/player adaptive/reward recovery previews | Later-rank previews | Strong future variety promise | Needs actual gameplay differentiation |

Meaningful Authority Gap: medium-high. Authority is motivational and coherent, but the next progression pass should pick a small number of permissions and make them change choices or information quality materially.

## 7. Map Gameplay Binding

Map systems are no longer purely decorative. Map layers gate by day, permission, authority, XP, crisis state, active task, district trust, district memory, and operation era. Map presence infers domain from active event, carry-over, tomorrow preview, operation signals, assignment state, operational resources, and post-pilot state. It can show containers, vehicles, teams, route hints, fatigue statuses, and before/after traces.

The gap is that the map mostly visualizes decisions already made or risks already computed elsewhere. It is not yet the primary place where the player compares options and commits a strategy.

| Area | Score /10 | Note |
| --- | ---: | --- |
| Active operation visibility | 7 | Active events, domain focus, route/task and presence markers are supported. |
| Risk/trust layers | 6 | Gated layers exist, but trust/social/resource layers are still preview-heavy. |
| Decision traces | 6 | Before/after, reward/comeback, archive, map reactions exist, but need stronger persistence/legibility. |
| Personnel/vehicle/container presence | 7 | Presence and fatigue markers are meaningful. |
| Gameplay decision support | 5 | Map does not yet drive enough choices directly. |

Map Gameplay Binding average: 6.2/10.

## 8. One More Day / Retention

Crevia has several retention hooks: daily reward route, tomorrow risk, carry-over, city archive, reward/comeback, authority next unlock, story chain, Ece notes, and report tomorrow preview. The systems are present; the weakness is priority and sharpness.

The strongest retention sentence should be: "Tomorrow, start here because your choice caused this risk/opportunity." That should be visible in the report close and next hub open.

| Hook | Current status | Strength | Gap |
| --- | --- | --- | --- |
| Tomorrow risk | Built from carry-over, hints, operation signals, resource fatigue, district/social, post-pilot, operation era | medium-high | Needs stronger "first move tomorrow" CTA |
| Streak / daily reward | Exists as XP/progression route | medium | Feels reward-like more than gameplay advantage |
| Next unlock | Authority permission preview and progression surfaces exist | medium | Many unlocks are preview-only |
| Ece next-day note | Multiple Ece/advisor systems exist | medium-high | Needs one prioritized next-day instruction, not many supportive lines |
| Comeback | Reward/comeback model is rich and multi-source | medium-high | Needs clearer bad-play recovery loop and visible comeback event selection |
| Positive event | Pack/reward/recovery variants exist | medium | Needs pacing so good play creates new opportunity, not only praise |

Retention Hook score: 6.5/10.

## 9. Resource Pressure / Strategy Balance

Resource pressure is real at the system level. Daily plan effects, assignment effects, operational resources, personnel fatigue, vehicle maintenance, team specialization, container pressure, and operation signals all interact. The engine also scales early-day impact down for Day 1-3 and keeps post-pilot light mode controlled.

The risk is that the player may not often hit a hard enough tradeoff to stop using the same safe strategy. Resource pressure should create "not today" decisions without feeling punitive.

| Strategy | Strong situation | Weak situation | Gap |
| --- | --- | --- | --- |
| Fast response | Crisis, high public pressure, urgent route/container issues | Consecutive use should raise personnel fatigue, vehicle pressure, social backlash risk | Needs clearer delayed cost and "fast is necessary today" moments |
| Balanced solution | Normal-risk operations, mixed signals, early pilot | Can become always-optimal if penalties stay soft | Needs occasional insufficient impact or missed prevention |
| Lasting investment | Recurring district/resource pressure, Day 8+ operation depth, maintenance/container network | Expensive or slow when tomorrow risk is high | Needs stronger future payoff visibility |

Strategy Balance Risk: medium-high. The systems can support strategy depth, but the next pass should make dominant strategy detection and counter-pressure more visible.

## 10. System Connection Map

| System | Gives data to | Receives data from | Player-visible? | Connection strength |
| --- | --- | --- | --- | --- |
| Event selection | Daily events, active event list, content activation | day, pilot/post-pilot state, signals, family/freshness context | yes | strong |
| Decision result | Result screen, history, economy, city metrics, resources | event, decision, affordability, current state | yes | strong |
| Carry-over | Hub, report, tomorrow risk, archive/story context | daily priority, goals, previous report, decisions | yes | strong |
| Butterfly | Report, badges, story/chain context | decision outcomes, hooks, day close | yes | medium |
| City archive | Hub/report/map/story/team/maintenance context | day close, decisions, carry-over, tomorrow, reward/comeback, operation signals | yes | strong |
| Story chain | Hub/report hints, archive, maintenance/team signals | archive, district report, tomorrow risk, reward/comeback, team/vehicle state | partly | medium |
| District trust | Event selection, report, map, authority previews | decisions, social/district state | yes | medium |
| District memory | Map/report/hub hints, content activation | archive, carry-over, district results | partly | medium |
| Social pulse | Decision/result/report, reward/comeback, tomorrow risk | decisions, day close, operation context | yes | strong |
| Resource pressure | Hub, report, map, tomorrow risk, operation signals | daily plan, assignments, vehicles, personnel, containers | yes | strong |
| Personnel fatigue | Operational resources, report, map, team specialization | decisions, assignments, day close | yes | medium |
| Vehicle maintenance | Report/map/story/team, maintenance windows | operation signals, assignments, resource pressure, archive/story | yes | medium |
| Team specialization | Report/map/story, assignment guidance | assignments, outcomes, fatigue, maintenance, archive | yes | medium |
| Authority permissions | Progression, hub, map layers, permission previews | authority trust, XP, daily gain, pilot completion | yes | medium |
| Badges | Profile/progression/report | daily and pilot evaluations | yes | medium |
| Map layers | Map UI, progression motivation | permissions, day, authority, task/crisis/district context | yes | medium |
| Reports | Hub next day, archive, tomorrow risk, social/resource summaries | end-of-day pipeline | yes | strong |
| Ece | Hub, event, result, report, tomorrow notes | many presentation models and advisor state | yes | medium |

## 11. Critical Gaps For 90+ Gameplay

| Priority | Gap | Why it matters | Solution type | Risk |
| ---: | --- | --- | --- | --- |
| 1 | Day 8+ feels controlled but not strategically new enough | This is the main long-term boredom risk | retention | high |
| 2 | Delayed consequences are too compact | Players need to recognize their own decisions later | decision_depth | high |
| 3 | Strategy styles may not diverge enough | Same safe choice can dominate | resource_balance | high |
| 4 | Authority unlocks are mostly visibility/previews | Progression must open better play, not only more text | progression | medium-high |
| 5 | Map is not yet a decision board | A city game needs spatial choice pressure | map_binding | medium-high |
| 6 | Event variety can be copy/content variety more than gameplay variety | New events can still feel same-shaped | event_variety | medium |
| 7 | One More Day hook needs one clear next action | End-of-day must create tomorrow curiosity | retention | high |
| 8 | Recovery/comeback loop needs sharper bad-play path | Players who do poorly need hope and a plan | retention | medium |
| 9 | Positive events need gameplay value | Good play should unlock opportunities, not only praise | event_variety | medium |
| 10 | Systems are rich but can overwhelm as text | Too many compact lines can flatten meaning | polish | medium |

## 12. Recommended Implementation Prompt Order

| Prompt | Goal | When to do it | Risk |
| --- | --- | --- | --- |
| 1. Decision Consequence Depth Pass | Make delayed consequences visible and causal across result, report, hub, Ece, and archive | First | Touching too many surfaces; keep presentation-only if possible |
| 2. Event Freshness & Variety Gameplay Pass | Make domain/family differences alter pressure, not just copy | After consequence visibility | Could drift into content rewrite; keep scoped |
| 3. Meaningful Authority Gameplay Pass | Pick 2-3 permission unlocks that change information or decisions | After variety pass | Avoid broad rank/persist changes |
| 4. Map Gameplay Binding Planning | Design map as decision support before UI changes | Before visual redesign | Avoid map UI rewrite |
| 5. One More Day Retention Pass | Make report close and next hub open point to one tomorrow action | After consequence pass | Avoid adding noisy extra cards |
| 6. Resource Pressure Balance Audit | Validate whether fast/balanced/lasting strategies have real tradeoffs | After retention pass | Balance changes can destabilize first week |
| 7. City Memory / Story Chain Visibility Pass | Show the city remembering specific player choices | After resource audit | Avoid new story runtime unless required |
| 8. Positive & Comeback Event Pass | Add reward/recovery moments that affect next choices | After city memory visibility | Avoid pure praise spam |
| 9. Gameplay Loop QA | Simulate Day 1-10 and Day 8+/10+ across styles | After implementation passes | Must compare feel, not only pass/fail |
| 10. Final UI Redesign / Visual Unification | Polish once gameplay depth is real | Last | Visual polish can hide systemic gaps if done too early |

## 13. Gameplay Depth Scores

| Area | Score | Note |
| --- | ---: | --- |
| Core loop clarity | 82 | The loop is clear and well-structured. |
| Decision consequence | 66 | Consequences exist, but delayed causality needs stronger player-facing visibility. |
| Event variety | 72 | Freshness/content systems are good; gameplay differentiation is the weaker part. |
| Progression depth | 64 | Coherent authority path, but many unlocks are preview-only. |
| Retention hook | 65 | Many hooks exist; the strongest next-day action needs priority. |
| Map gameplay role | 62 | Strong surface, medium gameplay agency. |
| Resource strategy | 68 | Resource systems are real; balance pressure needs sharper expression. |
| Long-term city memory | 70 | Archive/story/carry-over exist; causality needs more legibility. |
| Overall gameplay depth | 68 | Strong foundation, not yet 90+ because Day 8+ agency and delayed consequence feel are not sharp enough. |

Estimated current gameplay score: 72/100.

Reachable score if the recommended order is followed: 88-92/100. The path to 90+ is not another broad UI package; it is making existing systems change tomorrow's decisions in ways the player can see and anticipate.

## 14. Bottom Line

Crevia does not look shallow at the system level. It has a strong loop, many connected runtime systems, and good safety guards. The boredom risk comes from compression: several systems are real but expressed as compact hints, previews, or report lines. If Day 8+ and Day 10+ do not introduce clearer strategic pressure, the player can reasonably feel that they are repeating the pilot loop with more labels.

The next prompt should be the Decision Consequence Depth Pass. It should be documentation/planning first or a tightly scoped presentation-layer implementation. It should not change persistence, `SAVE_VERSION`, `applyDecision`, or the day pipeline unless explicitly requested.
