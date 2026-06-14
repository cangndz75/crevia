# Crevia City Rhythm Director Pass

## Purpose

This pass introduces a read-only **City Rhythm Director** that governs how Day 8+ city signals are framed for the player: intensity, order, tone, and repetition control across Hub, Report, Ece, and Portfolio surfaces.

Player-facing intent:

> The city does not shout at the same volume every day. Sometimes risk rises, sometimes a recovery window opens, sometimes a memory trace surfaces, and sometimes a calm watch day is enough.

## Model

New module:

- `src/core/cityRhythmDirector/cityRhythmDirectorTypes.ts`
- `src/core/cityRhythmDirector/cityRhythmDirectorConstants.ts`
- `src/core/cityRhythmDirector/cityRhythmDirectorModel.ts`
- `src/core/cityRhythmDirector/cityRhythmDirectorPresentation.ts`
- `src/core/cityRhythmDirector/verifyCityRhythmDirectorScenario.ts`

Main builder:

```ts
buildCityRhythmDirector(input: CityRhythmDirectorInput): CityRhythmDirectorResult
```

## Rhythm Kind Taxonomy

| Kind | Meaning |
|------|---------|
| `calm_watch_day` | Low-data or safe momentum; observation is strategic |
| `strategic_pressure_day` | Multiple pressures; prioritization matters |
| `recovery_window_day` | Recovery / comeback / defer opportunity |
| `neglect_attention_day` | District neglect needs attention |
| `resource_strain_day` | Resource / route / container pressure |
| `social_trust_day` | Social trust sensitivity |
| `memory_echo_day` | City memory trace prominent |
| `follow_up_day` | Follow-up action framing |
| `mixed_city_day` | Balanced multi-signal day |
| `fallback` | Low-data safe watch |

## Intensity Policy

- **low**: low-data fallback, calm watch, Day 8 first low source, no high risk
- **medium**: 2+ medium sources, recovery+risk mix, memory+follow-up
- **high**: district neglect high, defer risk high, stacked pressure, Day 10+ mixed confidence

Rules:

- Day 8–9: high intensity is rare
- Day 10+: high allowed but not spammed
- Recovery days usually medium
- Calm watch days low

## Source Priority

1. Day8StrategicContent primary/secondary
2. DistrictNeglectRecovery high/rising or active/strong
3. PositiveComeback primary
4. PortfolioDeferRisk high-impact
5. FollowUpActions primary
6. CityMemoryVisibility primary
7. OneMoreDayRetention primary
8. DailyCapacityPortfolio selected/deferred mix
9. Event variety / decision consequence / carry-over
10. Authority explanation depth
11. fallback

Authority deepens explanation/visibility only; it does not fabricate rhythm sources.

## Day Behavior

- **Day < 8**: hidden, no rhythm spam
- **Day 8–9**: strategic phase entry, low-data calm fallback required, high intensity rare
- **Day 10+**: richer mix, diversity guard prefers ≥2 source kinds when possible

## Density / Repetition Guard

- Max 4 internal slots; presentation max 3
- Same `rhythmKind` in last 2 days → prefer alternative when available
- Same primary source kind 2 days in a row → suppress when alternative exists
- Same district 2 days in a row → demote to secondary when alternative exists
- Positive/recovery source present → no risk-only rhythm
- High risk source present → no positive-only rhythm
- Cautious tone spam avoided

**Stateless note:** `recentRhythmKinds`, `recentPrimarySourceKinds`, and `recentDistrictIds` are optional inputs. Without them, only same-result duplicate guards apply. Cross-day cooldown via persist is a future enhancement.

## Copy Pack

Copy lives in `cityRhythmDirectorConstants.ts` (`CITY_RHYTHM_COPY`). Rules:

- Single sentence, mobile-friendly
- No technical enum strings in UI text
- No blaming language
- No fake risk/recovery/memory claims
- Strategic but restrained Day 8+ tone

## Presentation Helpers

`cityRhythmDirectorPresentation.ts`:

- `buildCityRhythmCardModels(result)` — max 3 cards
- `buildPrimaryCityRhythmCard(result)` — hub continuation card
- `buildHubCityRhythmHint(result)` — max 1 hint
- `buildReportCityRhythmNote(result)` — max 1 note
- `buildEceCityRhythmLine(result)` — max 1 Ece line
- `buildPortfolioCityRhythmSignal(result)` — max 1 portfolio signal

Line max 110 chars; accessibility label max 160 chars.

## Optional Wiring

Build order in `memoryFollowUpPresentationContext.ts`:

1. DailyCapacityPortfolio
2. PortfolioDeferRisk
3. OneMoreDayRetention
4. CityMemoryVisibility
5. FollowUpActions
6. PositiveComeback
7. DistrictNeglectRecovery
8. Day8StrategicContent
9. **CityRhythmDirector**
10. EceStrategyLines

Wired surfaces:

- `memoryFollowUpPresentationContext.ts` — builds rhythm director result
- `endOfDayReportPresentation.ts` — optional `cityRhythmNote`
- `centerContinuationCardsPresentation.ts` — optional rhythm card
- `centerAdvisorPresentation.ts` — optional Ece rhythm line
- `eceStrategyLineTypes.ts` — optional `cityRhythmDirectorResult` input

## Duplicate Guard

Priority when the same message could appear on multiple surfaces:

1. OneMoreDay CTA/hook
2. Ece strategy line
3. **CityRhythm daily framing**
4. Day8StrategicContent strategic focus
5. DistrictNeglectRecovery district state
6. PositiveComeback opportunity
7. CityMemory trace
8. FollowUp action

CityRhythm uses “günün ritmi” language; Day8StrategicContent uses “stratejik odak”; DistrictNeglectRecovery uses “mahalle durumu”; etc.

## Analyzer / Verify

```bash
npm run analyze:city-rhythm-director
npm run verify:city-rhythm-director
```

Analyzer scenarios: Day 1/7 hidden, Day 8 low data, strategic pressure, recovery, neglect, memory echo, Day 10 mixed, repetition guards, positive+risk conflict, authority detailed.

Verify checks: hidden before Day 8, fallback on low data, slot limits, mapping rules, duplicate guard, presentation safety, no map wiring, no persist/applyDecision/day pipeline changes.

## Out of Scope (unchanged)

- Map UI / animation / marker motion
- Event selection rewrite
- Event spawn
- Follow-up execution
- Reward payout
- Persist shape / SAVE_VERSION / migration
- applyDecision
- Day pipeline
- Balance constant changes
- Hub / Report UI redesign
- Navigation
- Analytics / RevenueCat / store
- Lottie / assets
- LLM / API

## Next Prompt

- **Map Motion & Marker Animation Pass** — visual map rhythm (parallel-safe)
- **Gameplay Loop QA** — end-to-end Day 8+ loop validation with rhythm director in place
