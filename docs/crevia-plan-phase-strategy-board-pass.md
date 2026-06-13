# Crevia — Plan Phase Strategy Board Pass

**Referans:** [crevia-operation-phase-ux-redesign-plan.md](./crevia-operation-phase-ux-redesign-plan.md), [crevia-inspect-phase-interaction-pass.md](./crevia-inspect-phase-interaction-pass.md)

---

## Amaç

Planla fazını strateji panosuna dönüştürmek: İncele bulguları → strateji seçimi → beklenen etki → Yönlendir.

---

## Eski problem

- Plan seçimi yalnızca local `PlanOptionId` state.
- Kesin yüzde/başarı metinleri.
- İncele bulguları plana taşınmıyordu.
- Seçim dispatch fazına geçmiyordu.

---

## Yeni akış

1. İncele özeti chip row (max 3)
2. 3 strateji kartı: Hızlı Müdahale / Dengeli Çözüm / Kalıcı Yatırım
3. Seçim → impact preview güncellenir
4. Ece plan yorumu
5. CTA “Yönlendirmeye Geç” → `setOperationStep('assign')`

---

## Presentation modeli

Kaynak: `src/features/events/utils/eventPlanPhasePresentation.ts`

- `buildEventPlanPhasePresentation`
- `buildEventPlanInspectSummary` (inspect finding kaynaklarından)
- `resolveRecommendedPlanStrategyId`
- `mapStrategyIdToPlanOptionId` (legacy `PlanOptionId` köprüsü)

---

## Strateji kartları

| ID | Başlık | Legacy PlanOptionId |
|----|--------|---------------------|
| `rapid_response` | Hızlı Müdahale | `fast` |
| `balanced_plan` | Dengeli Çözüm | `balanced` |
| `long_term_fix` | Kalıcı Yatırım | `economy` |

Trade-off ve expected impact **band** dili kullanır; kesin yüzde yok.

---

## Selection state

`EventDetailDecisionScreen`:

- `selectedPlanStrategyId` state
- Event değişince recommended ile reset
- `EventPlanPhase` controlled selection
- Dispatch’e `selectedPlanStrategyLabel` prop

---

## Dispatch’e devredilen veri

- `getPlanStrategyLabel(effectivePlanStrategyId)` → dispatch footer özeti
- `mapStrategyIdToPlanOptionId` — ileride karar önerisi için hazır
- **TODO:** Seçili planı `applyDecision` / result engine’e bağlama (bu pass kapsam dışı)

---

## Motion

- Strategy select: `operationMotionPlanSelectDurationMs` (180ms)
- Reduced motion: anında güncelleme
- Impact preview: `CreviaMotionView` line_appear

---

## Verify

```bash
npm run verify:operation-plan-ui
npm run verify:operation-inspect-ui
npm run verify:dispatch-field-ui
npm run verify:motion-foundation
npx tsc --noEmit
```

---

## Sonraki prompt

**Dispatch Phase Assignment Motion Pass** — rota strip animasyonu, uyum etiketi, sahaya çıkış feedback; plan label dispatch command card’da görünür hale getirilebilir.
