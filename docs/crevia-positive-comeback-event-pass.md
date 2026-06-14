# Crevia — Positive & Comeback Event Pass

## Amaç

Day 8+ sonrası oyun ritmini yalnızca risk, kriz, baskı ve erteleme üzerinden ilerletmek yerine; kaynaklı, stratejik, küçük olumlu dönüşler, toparlanma fırsatları, mahalle güven iyileşmeleri ve “iyi kararın geri dönüşü” hissini veren **Positive & Comeback** sistemini kurmak.

Oyuncu şunu hissetmeli:

> Crevia sadece sorun çözme oyunu değil. Doğru takip, dengeli karar ve zamanında müdahale şehirde olumlu iz bırakıyor.

## Neden positive/comeback gerekli?

Resource Pressure Balance Audit bulguları:

- Positive/recovery dengesi orta seviyede.
- Recovery fırsatları normal günlerde düşük çıkıyor.
- Recovery maliyeti risk item’larıyla benzer; oyuncu pas geçebiliyor.
- `rewardComebackSignals` adapter henüz tam bağlı değildi.
- Day 8+ loop’un hep risk odaklı olmaması gerekiyor.

Bu pass, mevcut sistemlerden gelen gerçek kaynakları okuyarak read-only/presentation-safe comeback adayları üretir.

## PositiveComebackCandidate modeli

`src/core/positiveComeback/positiveComebackTypes.ts`

- **PositiveComebackKind**: `trust_recovery`, `resource_relief`, `social_support`, `district_recovery`, `container_improvement`, `route_relief`, `follow_up_success`, `memory_positive_trace`, `opportunity_window`, `safe_momentum`, `fallback`
- **PositiveComebackSourceKind**: `reward_comeback`, `daily_capacity_portfolio`, `follow_up_action`, `one_more_day_retention`, `portfolio_defer_risk`, `city_memory_visibility`, `decision_consequence`, `carry_over`, `butterfly_effect`, `district_personality`, `district_trust`, `social_pulse`, `container_network`, `operational_resource`, `authority_gameplay_expansion`, `ece_strategy_line`, `fallback`
- Max 3 candidate, max 1 primary/report/hub/ece/portfolio surface
- priority 0–100 clamp, sourceIds unique, fallback low confidence
- Day 1 low-noise (hidden/fallback)

## Source priority

1. `rewardComeback` gerçek kaynak
2. FollowUpActions: `support_recovery`, `reinforce_trust`, `safe_watch`
3. DailyCapacityPortfolio: `recovery_opportunity`, `positive_opportunity`
4. OneMoreDayRetention recovery/opportunity hook
5. PortfolioDeferRisk: `opportunity_may_expire`
6. CityMemoryVisibility positive/memory trace
7. DecisionConsequence / CarryOver / Butterfly positive veya recovery
8. DistrictPersonality `recovery_potential` (baseline tek başına “toparlandı” demez)
9. DistrictTrust / SocialPulse / ContainerNetwork / OperationalResource relief
10. Fallback `safe_momentum`

## Content pack

`positiveComebackConstants.ts` içinde her kind için 3–4 satırlık havuz:

- Olabilir / yaratabilir / güçlendirebilir dili
- Kesin düzeltti / kesin toparlandı yok
- Aşırı ödül/reward dili yok
- Technical enum UI metninde yok

## Source mapping

| Kaynak | Kind eşlemesi |
|--------|----------------|
| DailyCapacity `recovery_opportunity` | `district_recovery` / `opportunity_window` |
| DailyCapacity `positive_opportunity` | `safe_momentum` / `social_support` |
| FollowUp `support_recovery` | `district_recovery` / `follow_up_success` |
| FollowUp `reinforce_trust` | `trust_recovery` |
| FollowUp `safe_watch` | `safe_momentum` |
| PortfolioDefer `opportunity_may_expire` | `opportunity_window` |
| CityMemory positive trace | `memory_positive_trace` |
| RewardComeback signal | En yüksek öncelikli candidate |

## Cost/fairness policy

- Recovery/support candidate copy teşvik dili taşır
- “Düşük maliyetli takip hamlesi değerli” gibi ifadeler kullanılır
- “Bunu yapmazsan kaybedersin”, “Fırsat kaçtı”, source’suz “bölge düzeldi” yasak

## Authority visibility

`authorityPermissionIds` ve `authorityExpansionSummary` ile:

- `district_trust_preview` → trust_recovery detailed
- `resource_pressure_summary` → resource_relief detailed
- `district_memory_trace_preview` → memory_positive_trace detailed
- `advisor_specialist_notes_preview` → opportunity_window detailed
- Permission yokken detailed yok; locked teaser max 1

## Presentation helpers

`positiveComebackPresentation.ts`:

- `buildPositiveComebackCardModels`
- `buildPrimaryPositiveComebackCard`
- `buildReportPositiveComebackNote`
- `buildHubPositiveComebackHint`
- `buildEcePositiveComebackLine`
- `buildPortfolioPositiveComebackSignal`

## Integration policy

- `MemoryFollowUpPresentationContext` → `positiveComeback` alanı eklendi
- `endOfDayReportPresentation` → optional `positiveComebackNote`
- Event selection rewrite yok
- Reward payout yok
- Persist yok
- CTA execution yok

## Analyzer / verify

```bash
npm run verify:positive-comeback
npm run analyze:positive-comeback
```

Verify kontrolleri: candidate limitleri, fake recovery guard, Day 1 low-noise, source mapping, authority guard, presentation max 3 card.

## Değiştirilmeyen sınırlar

- persist shape yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- event selection rewrite yok
- reward payout yok
- UI execution yok
- balance değerleri değişmedi

## Sonraki prompt

**District Neglect & Recovery Pass** — mahalle ihmal/neglect sinyallerini recovery loop’a bağlama, district-level neglect runtime ve recovery execution.
