# Crevia — Authority Gameplay Expansion Final Pass

## Amaç

Yetki/rank sistemini yalnızca “daha fazla bilgi görme” seviyesinden çıkarıp, oyuncuya **açıkça hissedilen gameplay avantajları** sunan final **authority gameplay contract** katmanını kurmak.

Terfi hissi hedefi:

> “Artık sadece unvanım değişmedi; şehri daha iyi okuyabiliyorum, daha iyi öncelik verebiliyorum ve bazı kararların neden önemli olduğunu daha net görebiliyorum.”

Bu pass read-only presentation-time çalışır. Persist, balance, day pipeline ve gerçek slot/resource bonusu yoktur.

---

## Neden authority sadece visibility olmamalı?

Mevcut `AuthorityGameplayUnlockProfile` information advantage sağlıyor; bu pass bunu **Permission → Benefit catalog** ile sözleşmeye bağlar:

| Önce | Sonra |
|------|-------|
| “Yeni özellik açıldı” | “Bu yetki bana şunu kazandırdı” |
| Tekil faz copy | Map / portföy / Ece / profil domain avantajları |
| Dağınık permission listesi | `AuthorityGameplayBenefit` contract |

---

## AuthorityGameplayBenefit modeli

`src/core/authorityGameplayExpansion/`:

- **kind** — `map_layer_detail`, `portfolio_cost_explanation`, `ece_analysis_depth`, vb.
- **domain** — `map`, `district`, `portfolio`, `advisor`, `operation`, `memory`, `profile`, …
- **visibility** — `hidden` / `teaser` / `summary` / `detailed`
- **isUnlocked** — `permissionIds`’ten türetilir; fake unlock yok

---

## Permission → benefit catalog

`PERMISSION_BENEFIT_CATALOG` yalnızca `rankPermissionMatrix` canonical id’lerini kullanır.

Örnekler:

| Permission | Benefit kinds |
|------------|---------------|
| `district_trust_preview` | district_context_detail, portfolio_defer_reason, ece_analysis_depth |
| `resource_pressure_summary` | resource_pressure_detail, portfolio_cost_explanation, operation_tradeoff_hint |
| `assignment_fit_preview` | assignment_fit_reason, route_support_reason, operation_tradeoff_hint |
| `advisor_specialist_notes_preview` | tomorrow_priority_reason, portfolio_defer_reason, ece_analysis_depth |
| `map_trust_layer` | map_layer_detail, district_context_detail |
| `map_resource_layer` | map_layer_detail, resource_pressure_detail, portfolio_extra_signal_visibility |
| `district_memory_trace_preview` | district_memory_trace_detail, city_archive_reading, decision_consequence_explanation |

**futureKey (henüz rank matrix’te yok):** `authority_profile_showcase`, `advisor_strategy_hint` — dokümante, production’da fake permission yok.

---

## Rank → benefit summary

`buildAuthorityGameplayExpansionSummary(input)`:

- `unlockedBenefits` — mevcut `permissionIds`
- `teaserBenefits` — `nextRankPermissionIds` (max 1 locked teaser)
- `primaryBenefit` / `nextBenefit`
- Domain satırları: `eceAuthorityLine`, `mapAuthorityLine`, `portfolioAuthorityLine`, `profileAuthorityLine`

Day 1 düşük gürültü; Day 8+ stratejik benefit öncelikli.

---

## Gameplay benefit gerçekliği

### Allowed (bu pass)

- Daha detaylı explanation / reason text
- Portfolio sinyal **gerekçesi** (limit artmaz)
- Map layer reason line
- District context reason
- Ece analiz derinliği
- Profile/achievement showcase copy
- Locked teaser

### Not allowed

- Gerçek operation slot artırma
- Gerçek resource cost azaltma
- Event unlock / applyDecision / day pipeline
- Reward/economy değişimi

---

## Sistem bağlantıları (read-only helper)

| Sistem | Helper |
|--------|--------|
| Daily Capacity Portfolio | `buildAuthorityPortfolioBenefitLine` — mevcut permission visibility ile uyumlu |
| Map Gameplay Binding | `buildAuthorityMapBenefitLine` |
| District Personality | `district_context_detail` benefit açıklaması |
| Ece / Advisor | `buildAuthorityAdvisorCapabilityLine` |
| Profile | `buildAuthorityProfileBenefitLine` |

Hub Portfolio Surface / `centerDailyCapacityPortfolioPresentation` — **dokunulmadı**.

---

## Meaningful authority verify timeout cleanup

**Kök neden:** `verifyMeaningfulAuthorityGameplayScenario` içinde 9 nested full verify (`verify:operation-flow-qa`, `verify:event-gameplay-variety`, vb.) — 180s+ timeout.

**Çözüm:** Nested full verify kaldırıldı; authority’nin kendi faz copy + unlock profile kontrolleri korundu. Downstream verify’ler package script olarak ayrı çalıştırılır.

---

## Komutlar

```bash
npm run verify:authority-gameplay-expansion
npm run analyze:authority-gameplay-expansion
npm run verify:meaningful-authority-gameplay
```

---

## Guard’lar

- Persist / SAVE_VERSION / migration — yok
- applyDecision / day pipeline — yok
- Balance / gerçek slot bonus — yok
- Hub Portfolio Surface — yok
- Portfolio Defer Risk — yok
- Report / tomorrow binding — yok

---

## Sonraki prompt

**One More Day Retention Pass** — authority benefit contract’ın retention döngüsüne bağlanması.
