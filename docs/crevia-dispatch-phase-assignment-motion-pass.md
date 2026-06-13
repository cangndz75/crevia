# Crevia — Dispatch Phase Assignment Motion Pass

## Amaç

Yönlendir (Dispatch) fazını düz atama panelinden çıkarıp sahaya gönderme deneyimine dönüştürmek. Oyuncu Planla fazında seçtiği stratejiyi burada görür, ekip/araç/rota uyumunu anlar, riskli seçimlerde Ece’den kısa uyarı alır ve “sahaya çıktı” feedback’iyle Sahada fazına geçer.

## Eski bas-geç problemi

Önceki dispatch ekranı atama paneli + footer CTA’dan ibaretti. Plan seçimi yalnızca footer özet satırında görünüyordu; uyum, rota hattı ve dispatch feedback yoktu.

## Seçili plan özeti

`eventDispatchPhasePresentation.ts` içinde `EventDispatchSelectedPlanSummary`:

- `selectedPlanStrategyId` + label → compact strip (`DispatchPlanSummaryStrip`)
- Kısa beklenen etki metni (tam impact preview tekrar edilmez)
- Fallback: `balanced_plan` özeti

## Assignment compatibility mantığı

Mevcut `assignmentEngine.calculateAssignmentCompatibility` sonuçları kullanılır:

| Engine label   | UI etiketi      | scoreBand |
|----------------|-----------------|-----------|
| Güçlü uyum     | Uyum iyi        | high      |
| Dengeli uyum   | Uyum dengeli    | medium    |
| Zayıf uyum     | Riskli atama    | low       |
| (veri yok)     | Uyum izleniyor  | unknown   |

En fazla 3 reason chip; fake skor veya başarı yüzdesi üretilmez.

## Route preview / dispatch line

`DispatchRouteStepStrip`: Ekip → Araç → Rota → Saha stepper. Harita çizimi yok. CTA sonrası `dispatching` / `sent` state’lerinde hat highlight edilir.

## Dispatch feedback state machine

`EventDispatchPhase` lokal state:

1. **idle** — CTA aktif (atama + karar hazırsa)
2. **dispatching** — 500–700 ms, “Ekip sahaya çıkıyor”
3. **sent** — 180–200 ms, “Ekip sahaya çıktı”
4. `onDispatch()` → mevcut `handleDispatchPress` → `setOperationStep('field')`

Reduced motion: süreler 0 ms.

## Ece dispatch yorumu

`buildEventDispatchAdvisorComment` plan, uyum ve gün bağlamına göre 1–2 cümle üretir. Plan fazı Ece metnini birebir tekrar etmez.

## Plan seçimi → dispatch bridge

- `selectedPlanStrategyId` dispatch presentation’a prop olarak geçer.
- `suggestDecisionIdForPlanStrategy` → `mapStrategyIdToPlanOptionId` → karar stili eşlemesi ile varsayılan `selectedDecisionId` önerilir (presentation/UX köprüsü).

## Result engine binding — scope dışı

Bu pass `applyDecision` veya result balance motorunu değiştirmez. Plan stratejisi → sonuç etkisi bağlantısı sonraki prompt’ta yapılacaktır.

## Motion / reduced motion

`operationMotionTokens.ts`:

- `OPERATION_MOTION_DISPATCH_MS` (600)
- `OPERATION_MOTION_DISPATCH_SENT_MS` (200)
- Reduced motion’da 0

Yasak: sonsuz pulse, `withRepeat(-1)`, `setInterval` animasyon, Lottie/Rive.

## Verify

```bash
npm run verify:operation-dispatch-motion
```

Mevcut kritik verify’ler bozulmamalı:

- `verify:operation-plan-ui`
- `verify:operation-inspect-ui`
- `verify:dispatch-field-ui`
- `verify:motion-foundation`
- `verify:main-operation-feel`

## Sonraki prompt

**Field Phase Live Operation Pass** — canlı progress, mikro karar, auto-complete timing, saha operasyon hissi.
