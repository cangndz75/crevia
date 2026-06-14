# Crevia — Dominant Strategy Detector Planning

## Bu pass’in amacı

Oyuncunun **tekrar eden karar alışkanlıklarını** (son N gün / son N karar) tespit edecek bir **Dominant Strategy Detector** sistemini planlamak. Amaç cezalandırmak değil; Day 8+ döngüsünde sürekli aynı stratejiyle oynamayı fark edip **daha dengeli, çeşitli ve stratejik** şehir sinyalleri üretmek.

Oyuncu hissi:

> *“Ece ve şehir benim oyun tarzımı görüyor. Hep hızlı müdahale ediyorsam rota/ekip baskısı artıyor; hep kaynak koruyorsam bazı fırsatlar kaçabiliyor; hep dengeli gidiyorsam acil sinyaller daha görünür oluyor.”*

**Bu doküman yalnızca planlama/audit’tir.** Kod, runtime, persist, SAVE_VERSION, applyDecision, day pipeline ve balance değişikliği içermez.

**Paralel pass:** Positive & Comeback Event Pass ile çakışmaz; recovery neglect ve positive opportunity mapping bu planda örtüşür.

---

## Player Style vs Dominant Strategy

| Boyut | Player Style Recognition | Dominant Strategy Detector |
| --- | --- | --- |
| Soru | “Bu oyuncu genel olarak nasıl yönetiyor?” | “Son günlerde **aşırı tekrar eden** strateji pattern’i ne?” |
| Zaman | Tüm gözlemlerin ağırlıklı özeti | **Kaydırmalı pencere** (son 3/5/7 karar veya gün) |
| Çıktı | `PlayerStyleId` + advisor özeti | `DominantStrategyPatternId` + counter-pressure önerisi |
| Ton | Güçlü yön + yumuşak risk | Denge önerisi; **yargı yok** |
| Örnek | `fast_responder` — hızlı müdahale eğilimi | `rapid_response_overuse` — son 5 kararın 4’ü hızlı müdahale |

Player style **kimlik**; dominant strategy **güncel tekrar baskısı** üretir. İkisi birlikte kullanılabilir: style “sen böyle oynuyorsun”, dominant “bu hafta bunu fazla tekrarladın — şehir denge sinyali veriyor”.

---

## 1. Mevcut Player Style sistemi analizi

### Kaynak dosyalar

- `src/core/playerStyle/playerStyleTypes.ts` — tipler, `PlayerStyleObservation`, `EventEchoDecisionKind` bağlantısı
- `src/core/playerStyle/playerStyleRules.ts` — signal → style ağırlıkları, `DECISION_KIND_SIGNAL`, dominance gap
- `src/core/playerStyle/playerStylePresentation.ts` — observation inference, profile build, confidence
- `src/core/playerStyle/playerStyleValidation.ts` — yargılayıcı dil yasağı
- Production caller’lar: `HubAdvisorCard.tsx`, `ReportAdvisorCommentCard.tsx` (yerel `buildPlayerStyleProfile`)
- Ece: `eceStrategyLineModel.ts` → `player_style_reflection` (opt-in `playerStyleInsight`; `memoryFollowUpPresentationContext` henüz bağlamıyor)

### Style tablosu

| Style | Mevcut source | Confidence | Ece’de kullanılıyor mu? | Dominant strategy için yeterli mi? |
| --- | --- | --- | --- | --- |
| **fast_responder** | `fast_response` / `resource_heavy` observation; `EventEchoDecisionKind.fast_response`; decision label text inference; carry-over vehicle; resource fatigue “fast_risk” | `none` (gün≤1 veya obs<2); `low` (obs≤3 veya gap<DOMINANCE_GAP); `medium`/`high` (obs sayısı + topScore≥8) | Kısmen — Hub/Report advisor kartında yerel profile; Ece strategy line yalnızca `playerStyleInsight` geçilirse | **Hayır** — tekrar oranı ve pencere yok; weighted aggregate |
| **preventive_planner** | `preventive` signal; `preventive_route` kind; carry-over tomorrow; map prevented | Aynı confidence modeli | Aynı | **Hayır** — uzun vadeli tekrar ölçülmez |
| **public_focused** | `social_priority`; `communication_first`; social echo; carry-over social | Aynı | Aynı | **Hayır** — sosyal **erteleme** ayrı pattern |
| **resource_guardian** | `resource_saving`; stable fatigue; personnel/vehicle domain fallback | Aynı | Aynı | **Kısmen** — saving tekrarı için ratio gerekir |
| **crisis_watcher** | `crisis_prevention`; `monitor_only`; map crisis prevented; report crisis keywords | Aynı | Aynı | **Kısmen** — kriz **overfocus** ayrı pattern |
| **balanced_operator** | `district_balance`; gap < BALANCED_GAP_THRESHOLD; mixed signals | Aynı | Aynı | **Hayır** — balanced **overuse** = ardışık balanced_dispatch ratio |
| **inconsistent_operator** | ≥5 unique signal kind + düşük gap | Aynı | Aynı | **Örtüşür** — `inconsistent_switching` ile yakın; detector daha net ratio kullanır |
| **unknown** | gün≤1 veya obs<2 | `none` | Gizli | N/A |

### Mevcut sistemin cevapları

| Soru | Cevap |
| --- | --- |
| Son N gün tekrar ölçüyor mu? | **Kısmen** — `inferObservationFromDecisionHistory` son **5** kaydı label’dan kind çıkarır; ancak **dominance ratio** veya “4/5 aynı” yok |
| Decision kind / strategy choice history var mı? | **Runtime’da zayıf** — `DecisionRecord` yalnızca `decisionLabel`; `selectedDecisionKind` persist edilmiyor. Plan/result anında `EventEchoDecisionKind` ve `EventPlanStrategyId` mevcut |
| Rapid/balanced/long-term dağılımı çıkarılabiliyor mu? | **Presentation-time evet** — event result + plan strategy (`eventGameplayVariety`: `rapid_response`, `balanced_plan`, `long_term_fix`) |
| Event domain dominantlığı ölçülebiliyor mu? | **Evet** — `decisionHistory.neighborhoodId`, `operationSignals.priorityDistrictId`, event domain focus |
| Resource/trust/social/route tercihi okunabiliyor mu? | **Dolaylı** — observation inference, operation signals, portfolio item kind dağılımı (günlük snapshot) |

---

## 2. Dominant strategy taxonomy

```typescript
type DominantStrategyPatternId =
  | 'rapid_response_overuse'
  | 'preventive_overuse'
  | 'balanced_default_overuse'
  | 'resource_saving_overuse'
  | 'public_trust_overfocus'
  | 'crisis_priority_overfocus'
  | 'district_repetition'
  | 'route_heavy_repetition'
  | 'social_pressure_avoidance'
  | 'recovery_opportunity_neglect'
  | 'inconsistent_switching'
  | 'none';
```

### Pattern açıklamaları ve eşik mantığı (plan)

| Pattern | Tetikleyici (plan) | Counter-pressure yönü |
| --- | --- | --- |
| `rapid_response_overuse` | Son 5 kararın ≥60% `fast_response` / `rapid_response` | vehicle strain, team fatigue, route_pressure, missed long-term fix |
| `preventive_overuse` | ≥60% `preventive_route` / `long_term_fix` | short-term social impatience, delayed visible relief |
| `balanced_default_overuse` | ≥60% `balanced_dispatch` / `balanced_plan` | high-urgency decisive action ihtiyacı |
| `resource_saving_overuse` | ≥60% `resource_heavy` veya düşük maliyetli defer + saving signals | recovery_opportunity, deferred pressure |
| `public_trust_overfocus` | ≥60% `communication_first` / social portfolio bias | route/container backlog |
| `crisis_priority_overfocus` | ≥60% risk/crisis item seçimi veya `monitor_only` + crisis domain | positive_opportunity, comeback_available |
| `district_repetition` | Aynı `neighborhoodId` ≥3/5 karar veya ≥4/7 gün | neglect_risk başka mahalle, district_pressure elsewhere |
| `route_heavy_repetition` | route/vehicle domain ≥60% karar veya portfolio | maintenance_warning, vehicle/team pressure |
| `social_pressure_avoidance` | social item’lar sürekli deferred/watch; trust criterion yüksek mahallede erteleme | trust_fragility, public_visibility |
| `recovery_opportunity_neglect` | recovery/positive item’lar ≥2 kez defer veya görünmez bırakıldı | comeback_available, safe_momentum (PositiveComeback) |
| `inconsistent_switching` | Son 5 kararda ≥4 farklı strategy kind; düşük ardışıklık | Ece stabil plan önerisi (tek net öncelik) |
| `none` | Yetersiz gözlem veya dağılım dengeli | — |

---

## 3. Detection window ve confidence modeli

### Gün politikası

| Dönem | Detector davranışı |
| --- | --- |
| **Day 1–3** | Hidden — `patternId: none`, yüzeyde sinyal yok |
| **Day 4–7** | Low-confidence hints yalnızca debug/Ece teaser (opsiyonel); counter-pressure **yok** |
| **Day 8+** | Gerçek detection; portfolio/Ece/map counter-signal bağlanabilir |
| **Day 10+** | Aynı pattern’de confidence yükselir; copy biraz daha net ama **non-punitive** |

### Pencereler

| Pencere | Kullanım |
| --- | --- |
| Son **3** karar | Kısa vadeli eğilim (tie-breaker) |
| Son **5** karar | **Birincil dominant pattern** penceresi |
| Son **7** gün | Stratejik stil doğrulama; district repetition |
| Güncel gün portföyü | Anlık baskı (defer/social avoid/neglect) |

### Confidence

| Seviye | Koşul (plan) |
| --- | --- |
| `none` | <3 strateji gözlemi veya gün<4 |
| `low` | 3 gözlem veya dominance 50–59% |
| `medium` | 5 gözlem ve dominance ≥60% |
| `high` | 7+ gözlem veya dominance ≥70% aynı kategori |

**Kurallar:**

- High confidence bile **Ece yargılayıcı** konuşmaz (`playerStyleValidation` ile aynı guard).
- Detector **cezalandırmaz**; yalnızca counter-signal ve denge copy önerir.
- Day 1–3 ve low confidence → Ece’de dominant line **gösterilmez**.

---

## 4. Source signals planı

| Source | Beslediği pattern | Güvenilirlik | Persist gerekir mi? |
| --- | --- | --- | --- |
| `decisionHistory[]` (label, neighborhoodId, day) | Tüm kind/district pattern’leri | Orta — kind text inference | **Hayır** (mevcut store); implementation’da `selectedDecisionKind` snapshot **önerilir** |
| Plan phase `EventPlanStrategyId` (session) | rapid/balanced/long-term overuse | Yüksek | **Evet (future)** — karar başına strategy id persist veya günlük aggregate |
| `EventEchoDecisionKind` (result anı) | Kind pattern’leri | Yüksek | Future persist önerilir |
| `operationSignals` (domain scores) | route_heavy, crisis_overfocus doğrulama | Orta | Hayır |
| `dailyCapacityPortfolioResult` (selected/deferred/watch) | crisis_overfocus, social_avoidance, recovery_neglect | Orta-yüksek | Günlük snapshot yeterli; **çok günlük defer history** için future light persist |
| `portfolioDeferRisk` | defer tekrarı, opportunity_may_expire | Orta | Hayır |
| `followUpActions` (primary kind) | recovery neglect, route review | Orta | Hayır (presentation) |
| `rewardComeback` moments | recovery_neglect, comeback_available | Orta | Hayır |
| `decisionConsequenceThreads` | carry-over domain tekrarı | Orta | Hayır |
| `districtPersonalityProfiles` | social_avoidance, district_repetition counter | Orta | Hayır |
| `vehicleMaintenance` / `teamSpecialization` | rapid/route counter-pressure doğrulama | Orta | Hayır (runtime state okunur) |
| `operationalResources` fatigue | rapid_response counter | Orta | Hayır |
| `playerStyleProfile` | Style↔pattern tutarlılık; duplicate guard | Orta | Hayır |
| `authorityExpansionSummary` | Detay seviyesi (explanation depth) | Düşük-orta | Hayır |
| `eventGameplayVariety` strategyBias | Plan önerisi bias (counter değil input) | Orta | Hayır |

### Persist gerektiren eksikler (implementation notu)

1. **`DecisionRecord.selectedDecisionKind`** veya eşdeğeri — text inference kırılgan.
2. **Günlük portfolio choice log** (hangi item selected/deferred) — 3–7 günlük neglect/recovery neglect için.
3. **Opsiyonel:** `dominantStrategyLastSurfacedDay` — spam önleme (surface başına cooldown).

Planning pass persist **eklemez**; read-only detector ilk sürümde mevcut `decisionHistory` + günlük portfolio snapshot + operation signals ile başlayabilir.

---

## 5. Counter-pressure design (non-punitive)

Her pattern için **yumuşak** karşı sinyal. Dil: “denge”, “izle”, “fırsat”, “başka mahalle” — “ceza”, “yanlış”, “başarısız” yok.

### `rapid_response_overuse`

| Yüzey | Plan |
| --- | --- |
| Portfolio | `maintenance_warning`, `route_pressure` urgency +1 (presentation modifier) |
| Ece | *“Hızlı kararların etkili; bugün araç ve ekip yükünü izlemek değerli olabilir.”* |
| Map | route_support_hint (mevcut map signal copy) |
| Follow-up | `review_route` |
| Positive | `recovery_opportunity` / long-term fix fırsatı (comeback) |

### `preventive_overuse`

| Portfolio | `social_pressure` veya `district_pressure` (kısa vadeli görünürlük) |
| Ece | *“Yarını rahatlatıyorsun; bugünkü görünür şikayetler için küçük bir adım da düşünülebilir.”* |
| Positive | `decision_worked` momentum |

### `balanced_default_overuse`

| Portfolio | `risk_signal` veya yüksek urgency `active_operation` |
| Ece | *“Denge iyi; bugün acil bir sinyal netleşirse daha keskin bir adım gerekebilir.”* |

### `resource_saving_overuse`

| Portfolio | `recovery_opportunity`, `positive_opportunity` |
| Ece | *“Kaynağı koruyorsun; düşük maliyetli bir toparlanma fırsatını kaçırmamak değerli olabilir.”* |
| Follow-up | `support_recovery` |

### `public_trust_overfocus`

| Portfolio | `container_pressure`, `resource_pressure` |
| Ece | *“Güveni iyi okuyorsun; bugün saha yükünü de dengelemek gerekebilir.”* |

### `crisis_priority_overfocus`

| Portfolio | `positive_opportunity`, `recovery_opportunity` |
| Ece | *“Riskleri iyi seçiyorsun; küçük bir toparlanma fırsatı da var.”* |
| PositiveComeback | `comeback_available` |

### `district_repetition`

| Portfolio | başka mahalle `district_pressure` / neglect_risk modifier |
| Ece | *“Aynı bölgeyi takip etmek iyi; başka mahallede sinyal birikiyor olabilir.”* |
| DistrictNeglect | neglect candidate başka district |

### `route_heavy_repetition`

| Portfolio | `maintenance_warning` |
| Resource | vehicle/team strain hint |
| Map | route layer emphasis |

### `social_pressure_avoidance`

| Portfolio | `social_pressure` visibility boost (watch → available) |
| Ece | *“Sosyal sinyaller birikebilir; küçük bir iletişim adımı yarın işini kolaylaştırır.”* |

### `recovery_opportunity_neglect`

| Portfolio | `recovery_opportunity` badge/urgency |
| PositiveComeback | `comeback_available`, `district_recovered` teşvik |
| Ece | *“Toparlanma penceresi açık; bugün küçük bir hamle yeterli olabilir.”* |

### `inconsistent_switching`

| Ece | *“Farklı baskılara farklı tepkiler verdin; bugün tek bir net öncelik seçmek işini kolaylaştırır.”* |
| Portfolio | tek `active_operation` + düşük gürültü |

---

## 6. Integration planı

### DailyCapacityPortfolio

- `DominantStrategyResult` → item **priority modifier** (+urgency, +visibility, kind boost).
- Mapping read-only; `buildDailyCapacityPortfolio` içinde optional input.
- **Max 1** pattern modifier / gün; aynı item’a çift boost yok.
- `resource-pressure-balance-audit` ile uyum: container/resource örtüşmesini artırmamak için modifier **kind çeşitliliği** korunur.

### EceStrategyLines

- Yeni source kind: `dominant_strategy` (plan).
- Mevcut `player_style_reflection` ile **max 1** line; dominant pattern **yüksek confidence** ise style line yerine veya style line’a ek context (duplicate guard).
- `memoryFollowUpPresentationContext` build sırasına eklenebilir: … → DominantStrategy → EceStrategyLines.
- Low confidence → suppress.

### PositiveComeback

- `crisis_priority_overfocus` + `resource_saving_overuse` → `recovery_opportunity` / `comeback_available` moment önceliği.
- `recovery_opportunity_neglect` → comeback line duplicate guard ile portfolio recovery item.

### DistrictNeglect (future / planning)

- `district_repetition` → başka mahalle neglect candidate.
- `social_pressure_avoidance` → trust_fragility + neglect_risk criterion boost.

### ResourcePressure

- `rapid_response_overuse`, `route_heavy_repetition` → vehicle/team presentation hint (operationalResources, vehicleMaintenance).
- Audit önerisiyle uyumlu: clamp sonrası fark kaybını önlemek için **urgency/status** ayrımı.

### Map

- `route_heavy_repetition`, `district_repetition` → map signal copy (`mapSignalCopy` / `mapGameplayBinding`).
- UI redesign yok; mevcut hint slot.

### Authority

- `authorityExpansionSummary` + permission → counter-pressure **explanation depth** (defer reason, maintenance preview).
- Yetki yoksa generic denge copy.

---

## 7. Analyzer planı

**Komut (future):** `npm run analyze:dominant-strategy-detector`

**Senaryolar:**

| Senaryo | Beklenen pattern |
| --- | --- |
| no data | `none`, confidence `none` |
| rapid repeated (5/5 fast) | `rapid_response_overuse` |
| balanced repeated | `balanced_default_overuse` |
| resource saving repeated | `resource_saving_overuse` |
| social avoidance (defer social) | `social_pressure_avoidance` |
| district repetition | `district_repetition` |
| crisis overfocus | `crisis_priority_overfocus` |
| recovery neglected | `recovery_opportunity_neglect` |
| inconsistent switching | `inconsistent_switching` |

**Output satırı:** `patternId | confidence | observations | dominantRatio | counterPressure | eceLine | portfolioMapping | overPunishmentRisk`

**WARN/FAIL kuralları:**

| Durum | Seviye |
| --- | --- |
| <3 observation ile pattern ≠ none | FAIL |
| Copy’de punishment language | FAIL |
| Tüm pattern’ler aynı portfolio pressure’a map | WARN |
| recovery_neglect positive üretemiyor | WARN |
| high confidence + <5 observation | FAIL |

---

## 8. Verify planı

**Komut (future):** `npm run verify:dominant-strategy-detector`

**Kontroller:**

- Day 1 hidden (`none`)
- <3 observations → `none`
- Repeated rapid → `rapid_response_overuse`
- Repeated balanced → `balanced_default_overuse`
- Repeated resource saving → `resource_saving_overuse`
- Repeated district → `district_repetition`
- Social avoidance → `social_pressure_avoidance`
- Recovery ignored → `recovery_opportunity_neglect`
- Confidence clamp (none/low/medium/high)
- No punishment copy (`validatePlayerStyleNoJudgementLanguage` benzeri guard)
- Ece line max 1 per surface
- SAVE_VERSION / persist / applyDecision / day pipeline **değişmedi** (dosya grep)

**Modül yapısı (implementation önerisi):**

```
src/core/dominantStrategy/
  dominantStrategyTypes.ts
  dominantStrategyConstants.ts
  dominantStrategyModel.ts
  dominantStrategyPresentation.ts
  verifyDominantStrategyScenario.ts
  index.ts
scripts/analyze-dominant-strategy-detector.ts
scripts/verify-dominant-strategy-detector.ts
```

---

## 9. Implementation prompt sırası

| Sıra | Pass | Kapsam |
| --- | --- | --- |
| 1 | **Dominant Strategy Detector Model Pass** | Read-only `buildDominantStrategyResult(input)`; verify/analyze; persist yok |
| 2 | **Ece Dominant Strategy Reflection Pass** | `eceStrategyLines` + Hub advisor counter-line; max 1; duplicate guard |
| 3 | **Portfolio Counter-Signal Binding Pass** | DailyCapacityPortfolio priority modifier; read-only |
| 4 | **Positive/Neglect Integration Pass** | recovery neglect + district repetition → comeback/neglect |
| 5 | **Dominant Strategy QA Pass** | Day 8+ spam, over-punishment, analyzer WARN triage |
| 6 | **Opsiyonel persist micro-pass** | `selectedDecisionKind` on DecisionRecord + günlük portfolio choice log (ayrı prompt, SAVE_VERSION onayı ile) |

Positive & Comeback Event Pass ile **sıra 4** koordine edilmeli; comeback moment kinds hazır.

---

## 10. Guard’lar

- **No runtime** — ilk pass presentation-only detector
- **No persist** — planning ve Model Pass read-only
- **No SAVE_VERSION** — persist micro-pass ayrı onay
- **No punishment** — copy guard zorunlu
- **No balance change** — modifier yalnızca presentation priority/urgency
- **No event selection rewrite**
- **No UI redesign** — mevcut kart/satır slotları

---

## 11. Riskler ve mitigasyon

| Risk | Mitigasyon |
| --- | --- |
| Text inference yanlış kind | Future `selectedDecisionKind` persist |
| Player style ile duplicate Ece | Öncelik: dominant (gün 8+, high) > player_style (genel) |
| Counter-pressure spam | Surface cooldown + max 1 pattern/gün |
| “Cezalandırıyor” hissi | Audit copy; recovery/positive her zaman bir counter-offer |
| Portfolio modifier dominance | WARN if all patterns → same item kind |

---

## İncelenen dosyalar

- `src/core/playerStyle/*`
- `src/core/models/DecisionRecord.ts`
- `src/core/contentPacks/eventEchoTypes.ts`
- `src/core/eceStrategyLines/*`
- `src/core/dailyCapacityPortfolio/*`
- `src/core/portfolioDeferRisk/*`
- `src/core/followUpActions/*`
- `src/core/rewardComeback/*`
- `src/core/decisionConsequence/*`
- `src/core/eventVariety/eventGameplayVarietyModel.ts`
- `src/core/districtPersonality/*` (docs + types)
- `src/features/shared/utils/memoryFollowUpPresentationContext.ts`
- `docs/crevia-resource-pressure-balance-audit.md`
- `docs/crevia-ece-memory-strategy-line-pack.md`
- `docs/crevia-daily-capacity-portfolio-model-pass.md`
- `docs/crevia-positive-reward-comeback-loop.md`
- `docs/crevia-core-loop-boredom-gameplay-depth-plan.md`
- `docs/crevia-district-personality-criteria-foundation.md`

**Değişmeyen:** runtime, persist, SAVE_VERSION (26), applyDecision, day pipeline, balance.

**Sonraki adım:** Dominant Strategy Detector Model Pass (read-only + verify/analyze).
