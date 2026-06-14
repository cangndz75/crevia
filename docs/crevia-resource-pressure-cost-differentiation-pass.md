# Crevia — Resource Pressure Cost Differentiation Pass

## Amaç

Day 8+ sonrası kaynak baskılarının (rota, konteyner, sosyal güven, takip, toparlanma, risk sinyali) **maliyet karakteri** bakımından birbirinden ayrışmasını sağlamak. Oyuncu her baskının farklı bir karar türü olduğunu hissetmeli; hepsi aynı “kaynak maliyeti” gibi davranmamalı.

Bu pass **core economy rewrite**, **event spawn**, **event selection rewrite**, **reward payout**, **persist/SAVE_VERSION**, **applyDecision** veya **day pipeline** değişikliği yapmaz.

## Audit bulgularına yanıt

| Audit bulgusu | Bu pass yanıtı |
|---------------|----------------|
| `container_pressure` ≈ `resource_pressure` vektör örtüşmesi | `PORTFOLIO_BASE_COSTS` ayrıştırması + domain cost policy (`container_pressure` futureRisk/trust ağırlıklı) |
| `risk_signal` sıfır maliyet | Portfolio’da `districtFocus`/`followUp`; modelde attention/futureRisk vektörü |
| Day 8 low-data boş portföy | `safe_watch` fallback profili |
| G7→G8 pressure jump | Day 8 için `0.88` intensity scale |
| recovery yüksek maliyet hissi | `recovery_opportunity` düşük direct cost; kriz domainlerinden ucuz |
| follow-up tam operasyon gibi | `follow_up_pressure` düşük direct cost vektörü |
| team pressure görünürlüğü | `team_capacity_pressure` runtime draft kaynağı |

## Domain cost profiles

Modül: `src/core/resourcePressureDifferentiation/`

- **general_resource** — bütçe/ekip/zaman dengeli
- **route_pressure** — araç + zaman dominant
- **container_pressure** — gelecek riski + güven/dikkat; general_resource ile aynı vektör üretmez
- **social_trust_pressure** — güven + dikkat dominant
- **district_neglect_pressure** — yarın riski + dikkat
- **recovery_opportunity** — düşük direct cost, futureRisk reduction odaklı
- **follow_up_pressure** — küçük aksiyon; düşük bütçe/ekip/araç
- **risk_signal** — attention/futureRisk; direct spend düşük ama sıfır değil
- **team_capacity_pressure** / **vehicle_strain_pressure** — runtime kaynakları
- **safe_watch** / **fallback** — düşük baskı, sahte pressure yok

## Cost vector policy

- Eksenler 0–100 clamp
- `dominantAxis` domain tercih sırasıyla çözülür
- `directCostSum = budget + team + vehicle`
- Max 5 profil, max 1 primary
- Day &lt; 8: inactive + `safe_watch`
- Day 8+: aktif, kaynak öncelik sırası: DailyCapacity → PortfolioDefer → OperationFeed → FollowUp → DistrictNeglect → CityRhythm → Day8Strategic → runtime → PositiveComeback → fallback

## Adapter bağlantıları

### DailyCapacityPortfolio

- `PORTFOLIO_BASE_COSTS` minimal token ayarı (`container_pressure`, `resource_pressure`, `risk_signal`, `follow_up_candidate`, `recovery_opportunity`)
- `buildOperationPortfolioCardModels` opsiyonel `resourcePressureDifferentiation` ile `enrichPortfolioItemDecisionLine`

### PortfolioDeferRisk

- `buildPortfolioDeferReportLine` opsiyonel `buildDeferRiskCostReasonLine` zenginleştirmesi

### Day8OperationFeedBinding

- `operationFeedCostHints` feed bias reason satırlarından türetilir; score boost değişmez

### Memory / Hub / Report

- `memoryFollowUpPresentationContext` pipeline’a `buildResourcePressureDifferentiation` eklendi
- Hub portfolio surface cost hint bağlantısı
- Report `resourcePressureNote` helper

## Follow-up / recovery / risk cost policy

- **follow_up_pressure**: direct cost düşük; attention/futureRisk hafif
- **recovery_opportunity**: kriz domainlerinden düşük direct cost
- **risk_signal**: attention + futureRisk taşır; tam sıfır değil

## Analyzer / verify

```bash
npm run verify:resource-pressure-differentiation
npm run analyze:resource-pressure-differentiation
```

Senaryolar: Day 1 safe, Day 8 low-data, route/container/social/recovery/follow-up/risk, Day 10 mixed, vehicle/team strain, authority detailed.

Verify zinciri: daily-capacity-portfolio, portfolio-defer-risk, day8-operation-feed-binding, follow-up-execution, gameplay-loop-qa, final-ui-visual-unification, typecheck.

## Değiştirilmeyen sınırlar

- Event spawn yok
- Event selection rewrite yok
- Reward payout yok
- Persist / SAVE_VERSION (26) yok
- applyDecision yok
- Day pipeline yok
- UI redesign yok

## Sonraki prompt

- **Dominant Strategy Detector Runtime** veya **Device Playtest** — portfolio/runtime sync gap ve baskı görünürlüğü saha doğrulaması
