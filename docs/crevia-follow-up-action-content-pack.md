# Crevia — Follow-up Action Content Pack

## Amaç

Günler arası devam hissini güçlendirmek için küçük, kaynaklı, düşük maliyetli ve stratejik **takip aksiyonu** içerik paketi. Oyuncu şunu hissetmeli:

> Dün bir şeyi erteledim ya da şehirde iz bıraktım. Bugün küçük bir takip hamlesiyle bunu yönetebilirim.

Bu pass **content/model/presentation-only** kalır. Runtime execution, persist, day pipeline veya applyDecision değiştirilmez.

City Memory / Story Chain Visibility Pass ile paralel çalışabilir; City Memory UI/presentation dosyalarına dokunulmaz.

---

## FollowUpAction modeli

```typescript
FollowUpAction = {
  id, kind, title, line, benefitLine, riskLine?,
  districtId?, districtName?,
  costBand, impactBand,
  sourceIds, sourceKinds,
  confidence, priority, dayPolicy, visibilityLevel,
  isActionable, isFallback
}

FollowUpActionResult = {
  day, actions[], primaryAction?, secondaryAction?, sourceIds
}
```

Kurallar:
- Max 3 action, max 1 primary, max 1 secondary
- priority 0–100 clamp
- sourceIds duplicate değil
- fallback → low confidence
- Day 1 → no action veya safe_watch (max 1)
- Fake tomorrow/memory/recovery yok
- Technical enum UI textte yok

---

## Content catalog

12 `FollowUpActionKind`, her biri için en az 4 varyasyon (`followUpActionContentPack.ts`):

| Kind | Örnek title |
|------|-------------|
| recheck_district | Mahalle Kontrolü |
| monitor_signal | Sinyali İzle |
| send_small_team | Küçük Ekip Yönlendir |
| rebalance_resource | Kaynağı Dengele |
| review_route | Rotayı Gözden Geçir |
| check_container_line | Konteyner Hattını Kontrol Et |
| calm_social_pulse | Sosyal Nabzı Sakinleştir |
| reinforce_trust | Güveni Pekiştir |
| capture_memory_trace | İzi Kayda Al |
| support_recovery | Toparlanmayı Destekle |
| prepare_tomorrow | Yarını Hazırla |
| safe_watch | İzlemede Tut |

Dil: "azaltabilir / görünür yapar / kolaylaştırır" — kesin vaat yok.

---

## Source mapping

Kaynak önceliği (`buildFollowUpActions`):

1. PortfolioDeferRisk deferred/watch
2. OneMoreDayRetention primaryHook
3. DailyCapacityPortfolio follow_up / recovery
4. CityMemoryVisibility trace (optional)
5. DecisionConsequence / CarryOver / Butterfly
6. DistrictPersonality neglect/recovery/trust
7. RewardComeback opportunity
8. EceStrategyLine support
9. Safe fallback (Day 1)

### PortfolioDeferRisk → kind

| deferRisk | kind |
|-----------|------|
| route_may_strain | review_route |
| social_reaction_may_grow | calm_social_pulse |
| trust_may_drop | reinforce_trust |
| resource_cost_may_rise | rebalance_resource |
| opportunity_may_expire | support_recovery |
| memory_trace_may_harden | capture_memory_trace |
| safe_to_watch | monitor_signal / safe_watch |

### DailyCapacityPortfolio → kind

| item kind | kind |
|-----------|------|
| follow_up_candidate | recheck_district / prepare_tomorrow |
| recovery_opportunity | support_recovery |
| container_pressure | check_container_line |
| route_pressure | review_route |
| social_pressure | calm_social_pulse |
| resource_pressure | rebalance_resource |

### DistrictPersonality (high criterion) → kind

| criterion | kind |
|-----------|------|
| neglect_risk | recheck_district |
| recovery_potential | support_recovery |
| route_difficulty | review_route |
| container_density | check_container_line |
| trust_fragility | reinforce_trust |
| social_sensitivity | calm_social_pulse |
| operation_history_weight | capture_memory_trace |

Source guard: kaynak yoksa action üretilmez; design_baseline tek başına fake live risk üretmez.

---

## Cost / impact policy

| Kind | Cost | Impact |
|------|------|--------|
| safe_watch, monitor_signal | none/low | low |
| recheck, capture, calm, trust, recovery, prepare | low | medium |
| review_route, check_container | low/medium | medium |
| rebalance, send_small_team | medium | medium |
| recovery + high confidence source | low (incentive) | high |

Recovery fırsatları asla medium/high cost almaz (resource audit uyumu).

---

## Authority visibility

`authorityExpansionSummary` varsa:
- Permission yok → summary, detailed reason/riskLine gizli
- portfolio_defer_reason / tomorrow_risk_preview / district_memory_trace_preview → detailed benefitLine
- Locked teaser max 1
- Fake permission yok

---

## Presentation helpers

`followUpActionPresentation.ts`:

- `buildFollowUpActionCardModels(result)` — max 3 card
- `buildPrimaryFollowUpActionCard(result)`
- `buildEceFollowUpActionLine(result)` — Ece later entegrasyonu için
- `buildReportFollowUpActionHint(result)`

CTA route execution yok; sadece candidate/presentation.

---

## Integration policy

**Allowed:** presentation helper, docs, analyzer sample

**Not allowed:** Hub/Report/Map render, store mutation, button execution, navigation route, City Memory presentation değişikliği

---

## Analyzer / verify

```bash
npm run analyze:follow-up-actions
npm run verify:follow-up-actions
```

Analyzer senaryoları: Day 1, deferred route, social watch, recovery, memory trace, district baseline, resource pressure, low data, authority detailed, duplicate actions.

Verify ayrıca sibling pass'leri ve `tsc --noEmit` uyumunu kontrol eder.

---

## Değiştirilmeyen sınırlar

- execution yok
- persist yok
- SAVE_VERSION yok
- applyDecision yok
- day pipeline yok
- UI integration yok

---

## Sonraki prompt

**Positive & Comeback Event Pass** — follow-up action candidate'larını gerçek event seçimine ve comeback loop'a bağlama.
