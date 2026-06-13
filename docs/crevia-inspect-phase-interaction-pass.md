# Crevia — Inspect Phase Interaction Pass

Bu belge operasyon akışındaki **İncele** fazının interaction pass uygulamasını açıklar.

**Planlama referansı:** [crevia-operation-phase-ux-redesign-plan.md](./crevia-operation-phase-ux-redesign-plan.md)  
**Motion referansı:** [crevia-motion-language-foundation.md](./crevia-motion-language-foundation.md)

---

## Amaç

İncele fazını düz bilgi ekranından çıkarıp kısa, kontrollü bir **analiz etkileşimi** haline getirmek. Oyuncu “olayı analiz ettim” hissini alır; ardından Planla fazına geçer.

---

## Eski problem (bas-geç)

- CTA doğrudan `setOperationStep('plan')` ile plana atlıyordu.
- `MainFindingsCard` sabit şablon metin (`INSPECT_MAIN_FINDINGS_TEXT`) kullanıyordu.
- Scan/reveal dramaturjisi yoktu.
- Ece inspect yorumu yoktu.

---

## Yeni inspect interaction akışı

1. Oyuncu İncele fazına gelir → **idle**
2. Olay özeti, domain pill, sinyal özeti (ön bağlam) görünür
3. CTA: **“İncelemeyi Başlat”**
4. Basınca → **analyzing** (CTA disabled, scan çizgisi)
5. **600–900ms** (token: 700ms) sonra → **revealed**
6. 2–3 bulgu kartı stagger ile açılır
7. Ece kısa analiz yorumu
8. CTA: **“Planlamaya Geç”** → mevcut `setOperationStep('plan')`

---

## Presentation modeli

Kaynak: `src/features/events/utils/eventInspectPhasePresentation.ts`

- `buildEventInspectPhasePresentation` — faz UI modeli
- `buildEventInspectFindings` — bulgu üretimi
- `buildEventInspectAdvisorComment` — Ece yorumu
- `auditEventInspectPhasePresentation` — verify audit

`EventInspectPhase` raw store okumaz; yalnızca `EventCard` + lokal interaction state ile çalışır.

---

## Finding kaynakları

Öncelik sırası:

1. Event domain (`inferEventDomainUiFocus`)
2. District / mahalle
3. Risk (`riskLevel`, `previewEffects.risk`)
4. Resource (`decisions[].costs`)
5. Social (`previewEffects.publicSatisfaction`)
6. Fallback: “Olay bağlamı” + “Operasyon etkisi”

Kurallar: min 2, max 3; kind duplicate yok; düşük veride fake urgent yok.

---

## CTA state makinesi

| State | CTA | actionKey |
|-------|-----|-----------|
| idle | İncelemeyi Başlat | `start_inspection` |
| analyzing | Analiz ediliyor… (disabled) | `disabled` |
| revealed | Planlamaya Geç | `go_to_plan` |

Planla geçişi: `EventDetailDecisionScreen` içindeki mevcut `onOpenPlanning={() => setOperationStep('plan')}` korunur. Route değişmez.

---

## Motion / reduced motion

Token'lar: `operationInspectScanConfig`, `operationFindingRevealConfig` (`motionPresets.ts`)

| An | Süre |
|----|------|
| Scan | 700ms (600–900 bandı) |
| Bulgu reveal | 160ms + 45ms stagger |
| Reduced motion | Scan 0ms, kartlar anında |

Yasaklar: sonsuz pulse, `withRepeat(-1)`, setInterval animasyon, Lottie.

---

## Ece inspect yorumu

- Day 1 / öğrenme: `teaching` tonu
- Risk/uyarı bulguları: `warning`
- Diğer: `calm`
- 1–2 kısa cümle; Merkez Ece cümlesi tekrar edilmez

---

## Planla fazına devredilen işler

Bu pass **yapmadı**:

- İncele bulgularını plan panosuna taşıma
- Plan seçiminin dispatch’e bağlanması
- Trade-off bandları

→ Sonraki prompt: **Plan Phase Strategy Board Pass**

---

## Verify

```bash
npm run verify:operation-inspect-ui
npm run verify:motion-foundation
npm run verify:dispatch-field-ui
npm run verify:main-operation-feel
npx tsc --noEmit
```

---

## Değişen dosyalar

- `eventInspectPhasePresentation.ts` (yeni)
- `EventInspectPhase.tsx`
- `EventInspectFindingCard.tsx` (yeni)
- `EventDetailDecisionScreen.tsx` (props)
- `motionPresets.ts`, `motion/index.ts`
- `verifyOperationInspectUiScenario.ts`, `scripts/verify-operation-inspect-ui.ts`
- `package.json` (verify script)
