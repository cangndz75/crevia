# Crevia Daily Capacity / Operation Portfolio Plan

## Purpose

This is a **planning and audit document only**. No runtime, UI, persistence, balance, navigation, migration, or pipeline implementation was changed.

Goal: define how Crevia moves from “solve the event in front of me” to **city operation portfolio management** — where the player sees 3–4 meaningful pressures per day but cannot address all of them with limited capacity.

Target player feeling:

> “Bugün şehirde 3–4 önemli baskı var ama kapasitem sınırlı. Hangisini çözeceğim, hangisini erteleyeceğim?”

Evidence inspected:

- `src/store/useGameStore.ts`, `src/core/game/ensureDailyEventsForDay.ts`, `generateDailyEventSet.ts`
- `src/core/game/refreshPilotEventsFromGameState.ts`, `refreshPostPilotEventsFromGameState.ts`
- `src/core/postPilot/postPilotEventEngine.ts`, `postPilotEventConstants.ts` (`MAX_POST_PILOT_ACTIVE_EVENTS = 2`)
- `src/core/eventVariety/*`, `src/core/districtPersonality/*`
- `src/core/mapGameplayBinding/*`, `src/core/activeOperationMapBinding/*`
- `src/core/decisionConsequence/*`, `src/core/tomorrowRisk/*`
- `src/core/operationSignals/*`, `operationalResources/*`, `vehicleMaintenance/*`, `teamSpecialization/*`
- `src/core/socialPulse/*`, `districtTrust/*`, `districtMemory/*`, `cityArchive/*`, `storyChains/*`, `rewardComeback/*`
- `src/core/authority/*`, `rankPermissions/rankPermissionMatrix.ts`
- `src/features/hub/utils/centerHomePresentation.ts`, `centerOperationFocusPresentation.ts`, `centerOperationSignalsPresentation.ts`, `centerRecommendedPlanPresentation.ts`, `centerAdvisorPresentation.ts`
- `src/features/events/*`, `src/features/map/*`
- `docs/crevia-core-loop-boredom-gameplay-depth-plan.md`
- `docs/crevia-event-freshness-variety-gameplay-pass.md`
- `docs/crevia-district-personality-criteria-foundation.md`
- `docs/crevia-map-gameplay-binding-plan.md`, `map-gameplay-binding-model-pass.md`
- `docs/crevia-active-operation-map-binding-pass.md`
- `docs/crevia-decision-consequence-depth-pass.md`, `meaningful-authority-gameplay-pass.md`

Protected boundaries (unchanged by this pass):

- `SAVE_VERSION`, persist shape, `applyDecision`, day pipeline, event selection rewrite, balance values, map UI redesign, navigation, analytics/store

---

## 1. Current Daily Operation Structure

| Aşama | Mevcut davranış | Kapasite baskısı var mı? | Eksik |
| --- | --- | --- | --- |
| **Day 1** | Tek öğrenme eventi; hub sade; advanced sistemler gizli; `ensureDailyEventsForDay` anchor odaklı | Hayır — bilinçli düşük baskı | “Neyi erteleyeceğim?” hissi yok; doğru |
| **Day 2–7** | Pilot: 1 anchor + 0–1 side event (`generateDailyEventSet`); daily goals, priority, carry-over, operation signals, recommended plan | Kısmi — side event var ama **zorunlu seçim yok** | İkinci event opsiyonel hissi; sinyaller okunur ama kapasite maliyeti yok |
| **Day 8+** | Post-pilot light: `MAX_POST_PILOT_ACTIVE_EVENTS = 2` (1 anchor + 1 side); content runtime activation; operation agenda copy | Kısmi — **2 operasyon kotası** var ama portfolio görünümü yok | Oyuncu hâlâ “sıradaki event” modunda; 3–4 aday baskı + erteleme tradeoff yok |
| **Post-pilot active events** | `postPilotEventEngine` filtreler, anchor/side roller; authority trust ile scope genişler | Orta — kotanın kendisi kapasite ipucu | Kotanın **maliyet ve defer risk** ile bağlantısı yok |
| **Daily goals** | `dailyGoalState` — metrik hedefleri (XP, risk, memnuniyet) | Hayır — operasyon portföyü değil | Portfolio ile çakışmamalı; paralel motivasyon |
| **Operation signals** | `operationSignals` domain status; hub `CenterOperationFocus` max 4 item | Hayır — bilgi paneli | Portfolio **item** adaylarına dönüştürülmemiş |
| **Map signals** | `MapGameplayBinding` + `ActiveOperationMapBinding` — aktif operasyon + 1–2 strategic line | Hayır — tek operasyon odaklı | Map “önerilen 2. öncelik” göstermiyor |
| **Report / tomorrow risk** | `DecisionConsequenceThread`, `tomorrowRisk`, carry-over report satırları | Kısmi — yarın ipucu var | “Bugün neyi seçtin / neyi erteledin?” özeti yok |

### Net cevap

**Oyuncu şu an çoğunlukla önüne gelen aktif eventleri çözüyor; “neyi erteleyeceğim?” baskısını sistematik hissetmiyor.**

Day 8+’da iki event kotası kapasite fikrine yakın ama:

- Portfolio adayları (risk, follow-up, fırsat) ayrı item olarak sunulmuyor
- Erteleme maliyeti ve defer risk görünür değil
- Hub/Map/Ece “2 slot, 4 sinyal — hangisini seçersin?” tradeoff’unu söylemiyor

---

## 2. Daily Capacity Concept

**Daily Capacity** = oyuncunun bir günde etkili yönetebileceği operasyon kapasitesi. Tek sayı değil; çok boyutlu.

```ts
type DailyCapacityKind =
  | 'operation_slots'
  | 'field_team_capacity'
  | 'vehicle_route_capacity'
  | 'resource_attention'
  | 'social_attention'
  | 'district_focus'
  | 'follow_up_capacity';
```

| Kind | Meaning | Primary sources |
| --- | --- | --- |
| `operation_slots` | Kaç ana operasyon seçilebilir | Post-pilot `MAX_POST_PILOT_ACTIVE_EVENTS = 2`; pilot Day 1–7 ≈ 1–2 |
| `field_team_capacity` | Saha ekip yükü | `operationalResources.personnel`, assignment fit, team specialization, fatigue |
| `vehicle_route_capacity` | Araç/rota yükü | `vehicleMaintenance`, `activeTaskRoute`, route_difficulty personality |
| `resource_attention` | Kaynak/konteyner odağı | `operationalResources`, container network, resource_dependency |
| `social_attention` | Sosyal/güven odağı | `socialPulse`, district trust, social_sensitivity, public_visibility |
| `district_focus` | Güçlü mahalle odağı sayısı | `districtPersonality`, `districtMemory`, city archive |
| `follow_up_capacity` | Küçük takip aksiyonları | `decisionConsequence`, story chains, carry-over, city archive |

**Planning rule:** Capacity is **derived presentation**, not a new persisted counter. Initial implementation reads existing runtime signals and computes “remaining capacity” per kind for the day.

---

## 3. Operation Portfolio Concept

**Operation Portfolio** = gün başında sunulan tüm aday baskı / fırsat / operasyon sinyalleri kümesi.

```ts
type OperationPortfolioItemKind =
  | 'active_operation'
  | 'risk_signal'
  | 'district_pressure'
  | 'resource_pressure'
  | 'route_pressure'
  | 'social_pressure'
  | 'container_pressure'
  | 'maintenance_warning'
  | 'memory_trace'
  | 'recovery_opportunity'
  | 'positive_opportunity'
  | 'follow_up_candidate';

type OperationPortfolioItemStatus =
  | 'selected'
  | 'available'
  | 'deferred'
  | 'watch_only'
  | 'locked'
  | 'resolved'
  | 'expired';

type OperationPortfolioItem = {
  id: string;
  kind: OperationPortfolioItemKind;
  status: OperationPortfolioItemStatus;
  title: string;
  districtId?: string;
  districtName?: string;
  sourceIds: string[];
  sourceKinds: string[];
  pressureLevel: 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high';
  opportunityValue: 'none' | 'low' | 'medium' | 'high';
  capacityCost: {
    operationSlots: number;
    team: number;
    vehicle: number;
    resource: number;
    social: number;
    followUp: number;
  };
  recommendedReason: string;
  deferRiskLine?: string;
  selectBenefitLine?: string;
  mapLine?: string;
  eceLine?: string;
};
```

**Planning-only.** No store field until a dedicated Model Pass.

---

## 4. Selection Pressure by Day

| Period | Portfolio shape | Capacity | Player lesson |
| --- | --- | --- | --- |
| **Day 1–3** | 1 active operation + 0–1 light signal (watch_only) | `operation_slots: 1`; diğerleri düşük/soft cap | “Önce tek operasyonu öğren” |
| **Day 4–7** | 1 anchor + 1–2 supporting signals; carry-over bağlanır | `operation_slots: 1` ana + 1 side opsiyonel; hafif defer | “İkinci sinyali okuyabilirsin ama zorunlu değil” |
| **Day 8+** | 2 selectable operation slots + 3–4 portfolio items total | `operation_slots: 2`; 1 risk + 0–1 recovery + 0–1 follow-up | **“Hepsini yapamam”** |
| **Day 10+** | Çeşitlilik artar; map-first candidate; authority detailed cost | Aynı slot; daha zengin defer/cost detail | Stratejik portföy yönetimi |

Post-pilot constants already support Day 8+ anchor model:

- `POST_PILOT_FIRST_OPERATION_DAY = 8`
- `MAX_POST_PILOT_ACTIVE_EVENTS = 2`
- `POST_PILOT_ANCHOR_COUNT = 1`, `POST_PILOT_SIDE_COUNT = 1`

Portfolio layer **wraps** these events plus non-event signals — does not replace event engine.

---

## 5. Portfolio Item Sources

| Kaynak | Portfolio kind | Guard |
| --- | --- | --- |
| Active events (`events`, post-pilot set) | `active_operation` | Event id required |
| `operationSignals` | `risk_signal`, `route_pressure`, `social_pressure` | Domain status strained/critical |
| `districtPersonality` | `district_pressure`, `recovery_opportunity` | Not fallback; criterion-driven |
| `districtTrust` | `social_pressure` | Trust signal present |
| `districtMemory` / `cityArchive` | `memory_trace`, `follow_up_candidate` | Memory/archive source id |
| `decisionConsequence` / carry-over | `memory_trace`, `follow_up_candidate`, tomorrow hook | Thread sourceIds |
| `tomorrowRisk` | `risk_signal`, `district_pressure` | Spatial or district-scoped only on map |
| `operationalResources` | `resource_pressure` | Strained group or network signal |
| `vehicleMaintenance` | `maintenance_warning`, `route_pressure` | Maintenance risk source |
| `teamSpecialization` / fatigue | field_team_capacity warning (meta, not always item) | Fatigue source |
| Container network | `container_pressure` | District network data |
| `rewardComeback` | `recovery_opportunity`, `positive_opportunity` | Comeback model source |
| `storyChains` | `follow_up_candidate`, `memory_trace` | Active chain hint |
| `mapGameplayBinding` | map-first recommended candidate | Binding `isActionable` + role |
| `activeOperationMapBinding` | enriches `active_operation` item | Phase + map line |

**Rule:** No source → no item. Safe fallback: single `active_operation` “aktif operasyonu takip et” only when event exists.

---

## 6. Capacity Cost Model (planning-only, no balance numbers)

Each item carries a **relative** cost vector (0–2 per axis). Examples:

| Profile | operationSlots | team | vehicle | resource | social | followUp |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Transport / high route pressure | 1 | 1 | 2 | 1 | 0 | 0 |
| Social sensitivity district | 1 | 1 | 0 | 1 | 2 | 0 |
| Container network | 1 | 1 | 1 | 2 | 0 | 0 |
| Follow-up candidate | 0 | 0–1 | 0 | 1 | 0 | 1 |
| Recovery opportunity | 1 | 1 | 0 | 1 | 1 | 0 |
| Watch-only risk signal | 0 | 0 | 0 | 0 | 0 | 0 |

**District personality modifiers** (multiply or add, implementation later):

- `social_sensitivity` high → social cost +1
- `route_difficulty` high → vehicle cost +1
- `container_density` high → resource cost +1
- `resource_dependency` high → resource cost +1
- `maintenance_exposure` high → vehicle cost +1

**Rule:** Costs are deterministic from kind + personality + gameplay variety profile — not random.

---

## 7. Defer Risk Model

```ts
type PortfolioDeferRisk =
  | 'safe_to_watch'
  | 'pressure_may_grow'
  | 'trust_may_drop'
  | 'resource_cost_may_rise'
  | 'route_may_strain'
  | 'social_reaction_may_grow'
  | 'opportunity_may_expire'
  | 'memory_trace_may_harden';
```

| Defer risk | When allowed | Example copy |
| --- | --- | --- |
| `safe_to_watch` | Low urgency + no live crisis source | “Bugün izlenebilir; yarın tekrar kontrol et.” |
| `pressure_may_grow` | `operationSignals` strained + personality neglect_risk | “Erteleme rota baskısını büyütebilir.” |
| `trust_may_drop` | `trust_fragility` + live social signal | “Sosyal tepki yarına taşınabilir.” |
| `opportunity_may_expire` | `recovery_potential` + positive_opportunity | “Bu fırsat bugün daha değerli.” |
| `memory_trace_may_harden` | `operation_history_weight` + memory trace | “Küçük takip hamlesi yarınki maliyeti azaltabilir.” |

**Guards:**

- No fake tomorrow claim without `tomorrowRisk` or `decisionConsequence` source
- Baseline personality alone → “bu bölge duyarlı” OK; “bugün baskı büyüyor” NOT OK without live signal
- `confidence: low` on defer lines when only baseline

---

## 8. District Personality Integration

| Criterion | Portfolio effect |
| --- | --- |
| `social_sensitivity` | ↑ social_attention cost; `social_pressure` candidate |
| `route_difficulty` | ↑ vehicle_route_capacity cost; `route_pressure` |
| `container_density` | ↑ resource_attention; `container_pressure` |
| `trust_fragility` | defer `trust_may_drop` when live trust signal |
| `recovery_potential` | `recovery_opportunity` candidate |
| `neglect_risk` | `follow_up_candidate`, `district_pressure` |
| `maintenance_exposure` | `maintenance_warning`, route cost |
| `operation_history_weight` | `memory_trace`, story candidate |
| `public_visibility` | ↑ social cost; visible defer copy |
| `resource_dependency` | ↑ resource cost |

Uses existing `DistrictPersonalityProfile` + `mapBias.mapSignalLine` — no new archetype data.

---

## 9. Map Integration

Map does **not** list full portfolio. Plan:

- Max **1–2 map-recommended** items (`mapGameplayBinding` role + priority)
- `active_operation_tracker` → primary map card (existing `ActiveOperationMapBinding`)
- `district_risk_reader` / `route_support_hint` / `resource_pressure_board` → secondary chip or panel line
- `district_memory_trace` → follow-up hint only with memory source

**Rules:**

- No marker spam; no fake spatial source
- Portfolio `mapLine` only when binding has spatial/district source
- Day 1: overview only; Day 8+: one strategic recommended district/route line

---

## 10. Ece Integration

Ece speaks **one portfolio tradeoff line** per day (hub advisor / `centerAdvisorPresentation`).

Examples:

- “Bugün iki operasyon kapasiten var; rota baskısı ve güven hassasiyeti aynı anda geliyor.”
- “Konteyner hattı kalıcı baskı yaratıyor, ama sosyal tepki daha görünür.”
- “Bu fırsatı ertelemek güvenli olabilir; rota baskısını öncelemek daha iyi.”

**Guards:** Day 1 teaching tone; low-data no certainty; max 1 recommendation; uses `eceToneHint` from district personality.

---

## 11. Hub Surface Plan (no UI in this pass)

Current hub stack: `CenterActiveTarget`, `CenterOperationFocus` (≤4), `CenterOperationSignals`, `CenterRecommendedPlan`, `CenterAdvisor`, continuation cards.

**Planned lite surface (implementation later):**

```
Bugün 2 operasyon kapasitesi · 4 sinyal
Öncelik: rota baskısı
İzlenecek: güven hassasiyeti
Fırsat: toparlanma penceresi
```

- Does **not** replace main quest / active target hero
- `CenterRecommendedPlan` can absorb portfolio context (`planType` extensions or parallel `portfolioSummary` field)
- Day 8+ only for capacity line; Day 1–7 hidden or teaching variant

Note: `HubReferenceHome` visual shell may differ from `centerHomePresentation` data layer — portfolio reads from presentation builders, not hard-coded hub cards.

---

## 12. Report / Tomorrow Hook Integration

End-of-day report additions (presentation-only):

- Selected portfolio items → `DecisionConsequenceThread` alignment
- Deferred items → tomorrow risk / carry-over with defer risk type
- Opportunities used/missed → `rewardComeback` / recovery lines

Examples:

- “Bugün rota baskısını çözdün; sosyal hassasiyeti yarına izleme olarak bıraktın.”
- “Ertelenen konteyner hattı yarın kaynak baskısı yaratabilir.”

**Rule:** Same source guards as `verify:decision-consequence-depth` — no fake butterfly/carry-over.

---

## 13. Authority Integration

| Permission | Portfolio visibility |
| --- | --- |
| `resource_pressure_summary` | Detailed capacity cost (resource axis) |
| `assignment_fit_preview` | Team/vehicle capacity reason lines |
| `district_trust_preview` | Defer risk trust effect |
| `tomorrow_risk_preview` | Clearer defer / tomorrow hint |
| `map_resource_layer` | Map resource portfolio item |
| `district_memory_trace_preview` | Follow-up / memory candidates |

No permission → summary/teaser only; no locked spam.

---

## 14. Positive / Comeback Integration

Portfolio must not be risk-only. Planned item kinds:

- `recovery_opportunity` — `recovery_potential`, reward comeback
- `positive_opportunity` — opportunity_window from event variety
- `follow_up_candidate` — low-cost, high retention value

Tempo softener: at least one non-punitive item candidate on Day 8+ when sources exist.

---

## 15. Dominant Strategy Detector (future prep)

No detector in this pass. Mapping for later:

| Player pattern | Portfolio counter-pressure |
| --- | --- |
| Always rapid | ↑ vehicle_route + team fatigue items |
| Always balanced | High-urgency “dengeli plan yetersiz” signal |
| Always long_term | Short-term social_attention item |

Feeds `EventGameplayVariety` repetition + portfolio diversity analyzer.

---

## 16. Analyzer Plan

**Script (future):** `npm run analyze:daily-capacity-portfolio`

| Check | PASS | WARN | FAIL |
| --- | --- | --- | --- |
| Day 8+ portfolio item count | ≥ 3 | < 3 | — |
| Risk-only portfolio | — | 100% risk | — |
| Same district spam | — | > 2 same district | — |
| Defer risk without source | — | — | any |
| Detailed info without permission | — | — | any |
| Identical capacity cost on all items | — | all same | — |
| Positive/comeback never appears | — | Day 8+ zero | — |
| Map item without spatial source | — | — | any |

Samples: Day 1, 3, 7, 8, 10.

---

## 17. Verify Plan

**Script (future):** `npm run verify:daily-capacity-portfolio`

Checks:

- Portfolio item `id` unique; `sourceIds` unique
- `status` / `kind` / `pressure` / `urgency` enums valid
- Capacity cost non-negative
- Day 1 low-noise (≤ 2 items, no defer panic)
- Day 8+ strategic sample
- No fake risk without source
- Defer risk source guard
- Permission gating for detailed fields
- Map items require spatial/district source
- Positive items no fake reward
- No collision with `DecisionConsequenceThread` caps
- Boundary: no `activeOperationMapBinding` / `mapGameplayBinding` behavior change
- `SAVE_VERSION`, persist, `applyDecision`, day pipeline untouched

---

## 18. Implementation Prompt Sequence

Recommended order:

1. **Daily Capacity Portfolio Model Pass** — read-only `buildOperationPortfolio` + types + verify/analyze
2. **Hub Portfolio Surface Lite** — capacity summary line in `centerHomePresentation` / recommended plan
3. **Portfolio Defer Risk Binding Pass** — defer → report/tomorrow/carry-over presentation
4. **Portfolio Map Recommendation Pass** — 1–2 map priority items from portfolio
5. **Portfolio Positive/Comeback Candidate Pass** — recovery/opportunity item generation
6. **Portfolio QA Pass** — Day 1–10 boredom + dominance simulation
7. **Documentation** — implementation pass doc + core-loop plan update

Dependencies:

- Requires completed: Event Variety, District Personality, Map Binding, Active Operation Map Binding, Decision Consequence, Meaningful Authority
- Does **not** require persist migration if portfolio is derived daily from existing state

---

## 19. Relationship to Existing Systems

| System | Relationship |
| --- | --- |
| Post-pilot event engine | Supplies `active_operation` items; portfolio does not replace generation |
| `CenterOperationFocus` | Upstream signal pool → portfolio candidates |
| `CenterRecommendedPlan` | Natural home for “today’s priority choice” |
| `ActiveOperationMapBinding` | Single-operation map face; portfolio picks which operation is “selected” |
| `MapGameplayBinding` | Cross-item map recommendations |
| `DecisionConsequenceThread` | End-of-day narrative for select/defer |
| Daily goals | Orthogonal — keep separate from operation_slots |

---

## 20. Guards Summary

| Guard | Rule |
| --- | --- |
| Persist | No new keys in first model pass |
| Fake risk | No item without sourceIds |
| Fake route/map | Spatial source required for mapLine |
| Fake tomorrow | Defer risk needs tomorrow/consequence/signal source |
| Fake opportunity | recovery/positive needs comeback or variety source |
| Day 1 | Teaching; no capacity panic |
| UI | This pass plans only; no component changes |
| Balance | Cost vectors relative; numeric tuning later |

---

## Next Prompt Options

- **Daily Capacity Portfolio Model Pass** (recommended first implementation)
- **One More Day Retention Pass** (report tomorrow hook — can run parallel if portfolio model delayed)

---

## Document Status

- **Type:** Planning / audit only
- **Code changed:** None
- **SAVE_VERSION / persist / applyDecision / day pipeline:** Unchanged
