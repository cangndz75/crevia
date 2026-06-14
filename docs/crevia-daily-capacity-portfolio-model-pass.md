# Crevia — Daily Capacity Portfolio Model Pass

## Amaç

Day 8+ sonrası oyuncuya **“bugün 3–4 önemli sinyal var ama kapasitem sınırlı”** hissi verecek read-only, presentation-time **Daily Capacity / Operation Portfolio** core modelini kurmak.

Bu pass:

- Persist / runtime mutation yapmaz
- Hub UI implement etmez
- Event selection rewrite yapmaz
- Day pipeline değiştirmez

Oyuncu hedef hissi: *“Hangisini çözeceğim, hangisini erteleyeceğim?”*

---

## DailyCapacitySummary

`buildDailyCapacityPortfolio(input)` ile üretilir. Alanlar:

| Alan | Açıklama |
|------|----------|
| `day`, `mode` | Gün ve ritim modu (`tutorial` / `pilot` / `post_pilot_light` / `post_pilot_strategic`) |
| `capacityEntries` | 7 kapasite türü için available/used/reserved/remaining |
| `operationSlotLimit` | Day 1 → 1; Day 8+ → 2 (`MAX_POST_PILOT_ACTIVE_EVENTS`) |
| `portfolioItemLimit` | Day 1 → 2; Day 8+ → 4 |
| `selectedItemCount` / `availableItemCount` / `deferredItemCount` | Portföy durum özeti |
| `hasStrategicPressure` | Day 8+ ve ertelenen item varsa true |
| `primaryTradeoffLine` | Seçilen vs ertelenen özet satırı |

### Kapasite türleri (`DailyCapacityKind`)

- `operation_slots` — eşzamanlı operasyon kotası
- `field_team_capacity` — saha ekibi dikkati
- `vehicle_route_capacity` — araç/rota uygunluğu
- `resource_attention` — malzeme/lojistik odağı
- `social_attention` — mahalle tepkisi
- `district_focus` — bölge derinliği
- `follow_up_capacity` — izleme/takip adayı işleri

---

## OperationPortfolioItem

Her portföy adayı tek bir `OperationPortfolioItem`:

- **kind** — `active_operation`, `risk_signal`, `route_pressure`, `recovery_opportunity`, vb. (12 tür)
- **status** — `selected`, `available`, `deferred`, `watch_only`, `locked`, `resolved`, `expired`
- **capacityCost** — 7 boyutlu maliyet vektörü (0–3 clamp, presentation-only)
- **deferRisk** + `deferRiskLine` — kaynak guard’lı erteleme riski
- **priority** — 0–100 deterministik sıralama
- **visibilityLevel** — authority + source’a göre `summary` / `detailed` / `teaser` / `hidden`

Kurallar: id deterministik; sourceIds tekil; fake tomorrow/memory/route/opportunity yok.

---

## Source adapter mantığı

`dailyCapacityPortfolioSourceAdapters.ts` read-only adapter’lar:

| Kaynak | Üretilen item türleri |
|--------|----------------------|
| `activeEvents` | `active_operation` (selected adayı) |
| `operationSignals` | `risk_signal`, `route_pressure`, `container_pressure`, `district_pressure`, `resource_pressure` |
| `districtPersonality` | criterion high band → pressure/opportunity/follow-up/memory |
| `eventGameplayVariety` | pressure kind → portfolio kind eşlemesi |
| `mapGameplayBinding` | role → item; `isMapRecommended` |
| `activeOperationMapBinding` | aktif operasyon / result trace |
| `tomorrowRisk` | `risk_signal` / domain pressure |
| `decisionConsequence` | `memory_trace` / `follow_up_candidate` |
| resource / vehicle / social / trust / memory / rewardComeback | yalnızca source varsa |

`unknown` input → güvenli boş dizi. Kaynak yoksa Day 1 fallback `watch_only` risk sinyali.

---

## Capacity cost calculation

`PORTFOLIO_BASE_COSTS` + district criterion modifier’ları (`social_sensitivity` → social +1, vb.). Day 1 maliyetler düşük tutulur. Balance değiştirmez; yalnızca presentation/analysis.

---

## Defer risk calculation

`computeDeferRisk` — tomorrow risk, trust, resource, route, social, opportunity, memory source’larına göre enum seçer. `DEFER_RISK_COPY` ile oyuncu satırı. Source yoksa `safe_to_watch` veya `none`; fake tomorrow yok.

---

## Priority scoring

Base kind skoru + urgency/pressure/opportunity/map/confidence/day8 modifier − duplicate district/kind − low confidence − watch_only. Clamp 0–100.

---

## Status assignment

- **selected** — aktif event; Day 8+ max 2
- **available** — seçilebilir aday
- **deferred** — slot dolu; presentation-only (persist yok)
- **watch_only** — düşük urgency / düşük confidence
- **locked** — authority teaser (bu pass’te sınırlı)

---

## Authority visibility

`DETAILED_PORTFOLIO_PERMISSION_IDS` ile `resource_pressure_summary`, `tomorrow_risk_preview`, `district_trust_preview`, `district_memory_trace_preview`, `assignment_fit_preview`, `map_resource_layer` → `detailed` visibility. Permission yokken `detailed` üretilmez.

---

## Presentation

`buildDailyCapacityPortfolioSummaryCard`, `buildOperationPortfolioCardModels`, `buildEcePortfolioLine`:

- Max 4 kart; Day 1 max 1–2
- Hidden item kart üretmez
- Mobil satır limitleri (title 44, summary 90, decision 96, a11y 160)
- Teknik enum UI metninde yok

---

## Analyzer / Verify

```bash
npm run analyze:daily-capacity-portfolio
npm run verify:daily-capacity-portfolio
```

Verify: tip güvenliği, negatif kapasite yok, selected ≤ 2, visible ≤ 4, defer/map/permission guard’ları, SAVE_VERSION / useGameStore wiring yok.

---

## Guard’lar (bu pass dokunmaz)

- Persist shape / SAVE_VERSION / migration
- `applyDecision`
- Day pipeline
- Event selection rewrite
- Balance değerleri
- Hub / Report / Map UI
- Navigation, Lottie, RevenueCat

---

## Modül yapısı

```
src/core/dailyCapacityPortfolio/
  dailyCapacityPortfolioTypes.ts
  dailyCapacityPortfolioConstants.ts
  dailyCapacityPortfolioModel.ts
  dailyCapacityPortfolioPresentation.ts
  dailyCapacityPortfolioSourceAdapters.ts
  verifyDailyCapacityPortfolioScenario.ts
  index.ts
```

Ana API: `buildDailyCapacityPortfolio(input)`.

---

## Sonraki prompt’lar

1. **Hub Portfolio Surface Lite** — summary + kartların Hub’a bağlanması
2. **Portfolio Defer Risk Binding Pass** — erteleme riskinin yarın pipeline’a read-only bağlanması
3. **One More Day Retention Pass** — portföy tradeoff’unun retention döngüsüne entegrasyonu
