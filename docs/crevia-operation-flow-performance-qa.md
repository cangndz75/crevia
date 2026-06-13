# Crevia — Operation Flow Performance & QA

## Operation Phase UX final durumu

Operasyon akışı beş fazlı, bağlantılı bir deneyim olarak tamamlandı:

| Faz | Akış |
|-----|------|
| **İncele** | idle → analyzing → revealed · scan → bulgu reveal → Ece → Planla CTA |
| **Planla** | bulgu özeti (max 3) → 3 strateji → expected impact → Ece → Yönlendir CTA |
| **Yönlendir** | seçili plan → uyum etiketi → rota stepper → dispatch feedback → Sahada |
| **Sahada** | seçili plan → assignment effect → timeline → mikro karar pause → Sonucu Gör |
| **Sonuç** | outcome hero → impact reveal (3–7 kart) → Ece → Merkez / Rapor CTA |

`applyDecision`, route (`/events/decision-result`) ve `SAVE_VERSION` değiştirilmedi.

## Timing profile

| Faz | Motion | Normal | Reduced motion |
|-----|--------|--------|----------------|
| İncele | scan | 600–900 ms (700) | 0 ms |
| İncele | finding reveal | 160 ms (+45 stagger) | 0 ms |
| Planla | selection | 160–220 ms (180) | 0 ms |
| Dispatch | dispatching | 500–700 ms (600) | 0 ms |
| Field | auto-complete | 900–1400 ms (1100) | 100 ms |
| Result | total reveal | 1200–1800 ms (1500) | 100 ms |

Kaynak: `src/core/motion/operationMotionTokens.ts`

Kurallar:
- `setInterval` yok
- `setTimeout` kullanılan yerlerde `clearTimeout` cleanup var
- `withRepeat(-1)` yok
- Sonsuz pulse yok

## Reduced motion

Reduced motion açıkken:
- Scan/dispatch anında veya ≤150 ms
- Reveal kartları anında görünür
- Stagger 0
- Akış anlaşılır kalır; CTA’lar aynı sırada aktifleşir

## selectedPlanStrategyId bridge

| Nokta | Davranış |
|-------|----------|
| Planla | `EventDetailDecisionScreen` local state |
| Apply | `setLastOperationPlanStrategyId` (session-only, persist yok) |
| Yönlendir | `selectedPlan` strip + decision suggestion bridge |
| Sahada | `selectedPlan` summary korunur |
| Sonuç | `selectedPlanContext` copy olarak gösterilir |

Balance/result engine bu ID’yi hesaplamaz; yalnızca sunum bağlamıdır.

## Route / CTA safety

| Geçiş | CTA / route |
|-------|-------------|
| İncele → Planla | `go_to_plan` (revealed) |
| Planla → Yönlendir | `go_to_dispatch` |
| Yönlendir → Sahada | `send_to_field` |
| Sahada → Sonuç | `view_result` (completed) |
| Sonuç → Merkez | `/` |
| Sonuç → Raporlar | `/reports` |
| Sonuç → Yetkiler | `/profile` (opsiyonel) |

`enabled: true` olan aksiyonların route’u tanımlıdır. `next_day` varsayılan disabled.

## MicroDecision QA

- MicroDecision yokken fake kart üretilmez
- Varlığında timeline `paused_for_decision`, auto-complete durur
- Seçim sonrası devam eder
- Mevcut apply/result mekanizması korunur

## Accessibility QA

- Tüm faz presentation modellerinde `accessibilityLabel` dolu
- Result reveal kartları `accessible` + birleşik label
- CTA’larda `accessibilityRole="button"` ve `accessibilityState.disabled`
- Dekoratif ikonlar `importantForAccessibility="no"`
- Teknik enum (`rapid_response` vb.) UI metinlerinde görünmez

## Small screen / font scale

Kod güvenlikleri:
- `numberOfLines` + `ellipsizeMode` uzun başlık/gövde/Ece yorumunda
- `minWidth: 0`, `flexShrink: 1` strip ve kartlarda
- Compact phase strip’leri scroll içinde

## Performance / render

- Presentation builder’lar `useMemo` ile snapshot/state’e bağlı
- `audit*` fonksiyonları yalnızca verify senaryolarında çalışır
- Result reveal `setTimeout` stagger — unmount cleanup
- Gereksiz premature optimization yapılmadı

## Result cleanup (bu pass)

`DecisionResultScreen` içinden kaldırıldı:
- `RewardHero`, `BeforeAfterPanel`, `ResultStatCards`, `DistrictImpact`, `EceComment`
- İlişkili kullanılmayan style ve asset import’ları

Advisor tone düzeltmesi:
- Calm `tomorrow_risk` fallback artık gereksiz warning advisor tetiklemez
- `risk-line` kartı neutral ton
- Gerçek butterfly/daily-priority riski warning kalır

## Verify

```bash
npm run verify:operation-flow-qa
```

Aggregate verify tüm faz verify’lerini ve timing/route/bridge kontrollerini çalıştırır.

## Manuel QA checklist

- [ ] Day 1 ilk operasyon
- [ ] Normal operasyon
- [ ] Riskli operasyon
- [ ] Düşük veri operasyon
- [ ] MicroDecision çıkan operasyon
- [ ] MicroDecision çıkmayan operasyon
- [ ] Hızlı Müdahale planı
- [ ] Dengeli Çözüm planı
- [ ] Kalıcı Yatırım planı
- [ ] Low compatibility dispatch
- [ ] High compatibility dispatch
- [ ] Reduced motion açık
- [ ] Font scale 1.3+
- [ ] iPhone SE / küçük Android
- [ ] Result reveal tamamlanmadan hızlı tap denemesi
- [ ] Back navigation denemesi
- [ ] Merkez’e Dön
- [ ] Raporu Aç
- [ ] Yetkileri Gör (opsiyonel CTA)

## Post-QA öneriler

1. Gerçek cihaz VoiceOver/TalkBack reveal sırası turu
2. Uçtan uca pilot oturum timing profili (network yok, pure UX)
3. Operasyon dışı ekranlarla (Merkez dönüş) geçiş animasyon uyumu
4. Analytics funnel: faz tamamlanma oranları
