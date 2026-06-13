# Crevia — Operation Phase UX Redesign Plan

**Amaç:** Merkez’den sonra operasyon akışını (İncele → Planla → Yönlendir → Sahada → Sonuç) düz ekran geçişlerinden çıkarıp mini etkileşim fazları gibi hissettirmek.

**Durum:** Planning / spec — implementation bu belgede tanımlanır, bu promptta kod yazılmaz.

**Referans:** [crevia-motion-language-foundation.md](./crevia-motion-language-foundation.md), `src/core/motion/*`

---

## 1. Mevcut operasyon akışı

### 1.1 Route ve orkestrasyon

| Route | Ekran | Rol |
|-------|-------|-----|
| `/events` | `EventsDecisionCenterScreen` | Olay listesi / karar merkezi |
| `/events/[id]` | `EventDetailDecisionScreen` | Workflow host (5 faz, tek ekran) |
| `/events/decision-result` | `DecisionResultScreen` | Sonuç (ayrı full-screen route) |

**Workflow tetikleyici:** `timelineStatus === 'review'` ← `gameEventStatus === 'awaiting_decision'`

**State anahtarı:** `operationStep: OperationWorkflowStepId` (`inspect` \| `plan` \| `assign` \| `field` \| `result`)

> Not: Dispatch fazı kodda `assign`, UI’da “Yönlendir”. `result` stepper’da görünür ama `operationStep === 'result'` hiç kullanılmıyor.

### 1.2 Faz tablosu — mevcut durum

| Faz | Mevcut ekran/component | Mevcut kullanıcı aksiyonu | Mevcut veri kaynağı | Sorun |
| --- | --- | --- | --- | --- |
| **İncele** | `EventInspectPhase`, `SignalSummaryCard`, `MainFindingsCard`, `EvidenceMetricsRow`, `EventWorkflowHero`, `EventWorkflowFooter` | Scroll + “Planla” CTA (`onOpenPlanning` → `setOperationStep('plan')`) | `EventCard` (risk, district, previewEffects); `buildSignalSummary`, `buildEvidenceMetrics` (kısmen event’ten); `INSPECT_MAIN_FINDINGS_TEXT` (sabit); `eventWorkflowAssets` (görsel) | **Bas-geç:** CTA anında plana atlar; scan/reveal yok. Bulgular çoğunlukla şablon/sabit metin. Ece analiz yorumu yok. Fazlar arası geri yok. |
| **Planla** | `EventPlanPhase`, `PlanOptionPicker`, `PlanSummaryCard`, `PlanEventSummaryCard`, `PlanWorkflowFooter` | Plan kartı seç (`useState<PlanOptionId>`) + “Yönlendir” CTA (`onConfirmPlan` → `assign`) | `buildPlanScreenModel(event)` — event title/category şablonları; `buildPlanDisplayOptions`, `buildPlanSummaryUi` | **Bas-geç:** Seçim local state, persist/applyDecision’a gitmiyor. Trade-off “expected impact” değil kesin yüzde gibi sunuluyor. İncele bulguları plana taşınmıyor. Seçim animasyonu yok. |
| **Yönlendir** | `EventDispatchPhase`, `EventDecisionList`, `DecisionOptionCard`, `EventAssignmentPanel`, `DispatchCommandCard`, `ActiveTaskRoutePreviewStrip`, `DispatchWorkflowFooter` | Karar seç + atama onayla + “Sahaya gönder” (`handleDispatchPress` → `field`) | `event.decisions[]`, `economyAffordability`, `assignments` (`assignmentEngine`, `assignmentPresentation`), `operationSignals`, `operationalResources`, `buildDispatchScreenModel` | **Karışık UX:** Plan + dispatch aynı ekranda hissi; “sahaya sürme” anı zayıf. Uyum skoru var ama dispatch line animasyonu yok. Riskli seçimde Ece uyarısı kısıtlı (`EventAdvisorHintCard`). |
| **Sahada** | `EventFieldPhase`, `LiveOperationCard`, `EventFieldMicroDecisionCard`, `FieldImpactMetricsRow`, `FieldWorkflowFooter` | Scroll + “Tamamla” (`handleApplyPress` → `applyDecision` → `/events/decision-result`) | `buildFieldScreenModel`, `buildActiveTaskRouteForEvent`, assignment, personnel/vehicle preview, `microDecisionState` (`getActiveMicroDecisions`) | **Statik canlılık:** Progress bar statik yüzde; timeline otomatik ilerlemiyor. Mikro karar nadiren görünür (eventId eşleşmesi + ilk 10 dk gizleme). “Operasyon akıyor” hissi zayıf. |
| **Sonuç** | `DecisionResultScreen` (ayrı route), `EventResultHeroCard`, `EventCarryOverHintCard`, `EventResultSystemsEchoStrip`, `EventResultImpactExplanationCard` | Scroll + “Merkez’e dön” / rapor CTA | `lastDecisionResult` (`DecisionResultSnapshot`), `buildDecisionResultSnapshot` (`applyDecision`), carry-over, butterfly (store’da var, UI’da eksik), `subsystemOutcomes` (kısmen kullanılmıyor) | **Kopuk geçiş:** Stepper “Sonuç” adımına hiç gelinmiyor; route değişimi sert. Sıralı reveal yok (`FadeInUp` tek blok). `ResultStatCards` sabit metrikler. `EventDecisionResultPhase`, `DecisionSubsystemOutcomeCard` yetim. Butterfly hint render edilmiyor. |

### 1.3 İncelenen dosya envanteri

#### Routes (`src/app/events/`)
- `index.tsx`, `[id].tsx`, `decision-result.tsx`, `_layout.tsx`, `pilot-final-report.tsx`, `main-operation-preview.tsx`

#### Screens (`src/features/events/screens/`)
- `EventDetailDecisionScreen.tsx` — workflow orkestrasyon
- `DecisionResultScreen.tsx` — sonuç
- `EventsDecisionCenterScreen.tsx`, `EventDecisionScreen.tsx`, `OperationalEventsListScreen.tsx`

#### Workflow components (`src/features/events/components/event-workflow/`)
- Ortak: `EventWorkflowStepper`, `EventWorkflowHero`, `EventWorkflowFooter`, `EventWorkflowHintBalloon`
- İncele: `EventInspectPhase`, `SignalSummaryCard`, `MainFindingsCard`, `EvidenceMetricsRow`
- Planla: `EventPlanPhase`, `plan/*` (PlanOptionPicker, PlanSummaryCard, PlanningDetailsSection, PlanningRoutePreviewCard, …)
- Yönlendir: `dispatch/EventDispatchPhase`, `DispatchCommandCard`, `DispatchWorkflowFooter`
- Sahada: `field/EventFieldPhase`, `LiveOperationCard`, `EventFieldMicroDecisionCard`, `FieldImpactMetricsRow`, `FieldWorkflowFooter`

#### Assignment UI
- `components/assignment/EventAssignmentPanel`, `AssignmentEditorModal`, `AssignmentOptionCard`, `EventFieldAssignmentSummary`
- Core: `src/core/assignments/assignmentEngine.ts`, `assignmentTypes.ts`, `assignmentState.ts`, `assignmentPresentation.ts`

#### Karar / sonuç
- `DecisionOptionCard`, `EventDecisionList`, `QuickDecisionActions`
- `EventResultHeroCard`, `EventCarryOverHintCard`, `EventDecisionResultPhase` (yetim)
- `result/EventResultSystemsEchoStrip`, `DecisionSubsystemOutcomeCard` (yetim)

#### Presentation / utils
- `eventWorkflowPresentation.ts`, `eventWorkflowPlanPresentation.ts`, `eventWorkflowPlanUiPresentation.ts`
- `eventWorkflowDispatchFieldPresentation.ts`, `decisionResultModel.ts`, `eventResultPresentation.ts`
- `decisionOptionCardIntegration.ts`, `eventDetailDecisionUtils.ts`
- `types/decisionResultTypes.ts`

#### MicroDecision
- Core: `src/core/microDecisions/microDecisionEngine.ts`, `microDecisionState.ts`, `microDecisionPresentation.ts`, `microDecisionTypes.ts`
- UI: `EventFieldMicroDecisionCard`, `features/hub/components/LiveOperationDecisionCard`, `features/reports/components/ReportMicroDecisionsCard`

#### Operations signals
- `src/core/operations/operationSignalEngine.ts`, `operationSignalPresentation.ts`, `operationSignalState.ts`

#### Verify (mevcut)
- `verify:dispatch-field-ui`, `verify:event-result-ui`, `verify:event-result-systems-echo`, `verify:main-operation-feel`, `verify:operation-signals`, `features/events/verifyDispatchFieldUiScenario.ts`, `verifyEventResultUiScenario.ts`

#### Motion foundation
- `src/core/motion/motionConstants.ts`, `motionTokens.ts`, `motionPresets.ts`, `motionAccessibility.ts`
- `src/shared/motion/*` (Merkez odaklı; operasyon preset’i henüz yok)

### 1.4 En zayıf “bas-geç” noktaları (özet)

1. **Faz geçişleri anlık** — `setOperationStep` ile içerik swap; motion/stagger yok.
2. **Plan seçimi oyuna bağlı değil** — strateji hissi yüzeysel.
3. **İncele içeriği mock ağırlıklı** — analiz dramaturjisi yok.
4. **Sonuç route kopması** — stepper ile sonuç ekranı bağlantısız.
5. **Engine verisi, UI’da kullanılmıyor** — butterfly, subsystem outcomes, yetim result phase component’leri.

---

## 2. Yeni phase experience modeli (planning-only)

Bu tipler yalnızca bu belgede kalır; implementation sonraki promptlarda.

```typescript
type OperationPhaseId =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result';

type OperationPhaseExperience = {
  id: OperationPhaseId;
  playerFeeling: string;
  primaryInteraction: string;
  revealMoment: string;
  decisionMoment?: string;
  feedbackMoment: string;
  nextPhaseTrigger: string;
  motionNeed: 'none' | 'light' | 'medium';
};
```

### 2.1 Faz deneyim matrisi

| id | playerFeeling | primaryInteraction | revealMoment | decisionMoment | feedbackMoment | nextPhaseTrigger | motionNeed |
|----|---------------|-------------------|--------------|----------------|------------------|------------------|------------|
| `inspect` | “Olayı analiz ediyorum” | İncele CTA / ilk giriş | Scan çizgisi + bulgu kartları stagger | — | Ece kısa analiz | Planla CTA | medium |
| `plan` | “Strateji kuruyorum” | Plan yaklaşımı seç | Bulgular panoya taşınır | Trade-off karşılaştırma | Seçili plan büyür, preview çubukları güncellenir | Yönlendir CTA | light |
| `dispatch` | “Ekibi sahaya sürüyorum” | Personel/araç/rota + karar onayı | Uyum etiketi + rota strip | Riskli atama uyarısı | Dispatch line + “sahaya çıktı” | Sahada takip CTA | medium |
| `field` | “Operasyon canlı akıyor” | İzle / mikro karar (opsiyonel) | Timeline ilerler | Mini karar (nadir) | Progress tamamlanır | Otomatik → sonuç | medium |
| `result` | “Kararım şehirde iz bıraktı” | Sıralı impact reveal | Görev durumu → metrikler | — | Ece yorum + carry-over kartı | Merkez / Rapor CTA | medium |

---

## 3. İncele fazı UX planı

### 3.1 UX hedefi
Oyuncuya “olayı analiz ediyorum” hissi: kısa scan, ardından 2–3 bulgu kartının sırayla açılması ve Ece’nin tek cümlelik analizi.

### 3.2 Önerilen interaction pattern

1. Oyuncu workflow’a girer veya “İncele”ye basar.
2. **600–900ms** scan/reveal: olay kartı üzerinde analiz çizgisi veya highlight geçer.
3. Bulgu kartları **180–240ms** stagger ile açılır:
   - Risk (`event.riskLevel`, `getRiskLevelLabel`)
   - Mahalle etkisi (`event.district`, `previewEffects`, district context)
   - Kaynak ihtiyacı (`event.decisions[].costs`, operational resources sinyali)
   - Sosyal tepki (`previewEffects.publicSatisfaction`, social pulse level)
4. Ece kısa analiz yorumu (`eventAdvisor`, `buildWorkflowStepHintModel` genişletmesi).
5. CTA “Planla” — plan fazına geçmeden önce kısa **settled** state (kartlar görünür, CTA pulse yok).

### 3.3 Mevcut state’lerden bulgu üretimi

| Bulgu | Kaynak | Not |
|-------|--------|-----|
| Risk | `EventCard.riskLevel`, `buildSignalSummary` | Mevcut `SignalSummaryCard` genişletilir |
| Mahalle etkisi | `event.district`, `neighborhoodId`, `buildEventResultDistrictContextLine` | Carry-over: `buildEventCarryOverHint` |
| Kaynak ihtiyacı | `event.decisions[].costs`, `economyAffordability`, `operationalResources` | Affordability henüz inspect’te yok — eklenebilir |
| Sosyal tepki | `previewEffects`, `operationSignals` social band | `buildSignalSummary` citizen/social satırları |

**Şablon kalan:** `INSPECT_MAIN_FINDINGS_TEXT`, `buildEvidenceMetrics` foto/süre sayıları — event authoring veya `eventContentPresentation` ile gerçek veriye bağlanmalı (balance değişmeden copy/presentation katmanında).

### 3.4 Motion ihtiyacı
- **medium** — scan line, kart stagger, Ece speech reveal (`centerSpeechReveal` benzeri operasyon preset’i)
- Reduced motion: anında tam layout, stagger kapalı

### 3.5 İleride dokunulacak dosyalar
- `EventInspectPhase.tsx`, `MainFindingsCard.tsx`, `SignalSummaryCard.tsx`
- `eventWorkflowPresentation.ts` — `buildInspectFindingsModel` (yeni presentation helper)
- `EventWorkflowFooter.tsx` — CTA timing gate (reveal bitmeden disabled)
- `src/core/motion/` — `useOperationMotionPresets` (yeni, Merkez pattern’i kopyalamadan)
- Opsiyonel: `EventWorkflowHintBalloon` → Ece analiz satırı

---

## 4. Planla fazı UX planı

### 4.1 UX hedefi
“Strateji kuruyorum” — İncele bulguları plan panosuna taşınır; 2–3 yaklaşım ve trade-off preview.

### 4.2 Önerilen interaction pattern

1. Üstte compact “İncele özeti” şeridi (risk + mahalle + sosyal chip).
2. Üç plan yaklaşımı (`fast` / `balanced` / `economy` → copy: Hızlı müdahale / Dengeli çözüm / Kalıcı yatırım):
   - Süre (`durationLabel`)
   - Kaynak maliyeti (`costLabel` / `costNote`)
   - Sosyal etki (türetilmiş band: düşük/orta/yüksek)
   - Güven etkisi (`previewEffects` türevi)
   - Yarın riski (copy band, kesin sayı değil)
3. Seçim: kart **160–220ms** scale/border; `PlanSummaryCard` preview çubukları güncellenir.
4. CTA “Yönlendir”.

### 4.3 Decision option model bağlantısı

| Katman | Model | Bağlantı |
|--------|-------|----------|
| UI-only plan | `PlanOptionId`, `PlanScreenModel` | Mevcut — genişletilir |
| Gerçek karar | `EventDecision` (`event.decisions[]`) | Plan seçimi → dispatch’te önerilen `decisionId` eşlemesi (presentation mapping, balance değişmeden) |
| Trade-off sunumu | `DecisionOptionCardPresentation`, `decisionTradeoffPresentation` | Plan kartlarında “beklenen etki” dili; `getDecisionRiskLevel` benzeri bandlar |

**Önemli:** `PlanOptionId` seçimi dispatch fazında `selectedDecisionId` önerisi veya default highlight olarak bağlanabilir; `applyDecision` hâlâ `EventDecision.id` kullanır — persist şeması değişmez.

### 4.4 Trade-off “expected impact” sunumu
- Kesin `%94 başarı` yerine: “Yüksek başarı şansı”, “Orta maliyet”, “Yarın riski: hafif artış”
- `PlanDetail.successLabel` → band + tooltip copy
- `decisionTradeoffPresentation.ts` ile ortak dil

### 4.5 İleride dokunulacak dosyalar
- `EventPlanPhase.tsx`, `PlanOptionPicker.tsx`, `PlanSummaryCard.tsx`
- `eventWorkflowPlanPresentation.ts`, `eventWorkflowPlanUiPresentation.ts`
- Yeni: `eventWorkflowPlanImpactPresentation.ts` (trade-off bandları)
- `EventDetailDecisionScreen.tsx` — plan seçimini dispatch’e taşıma (local state lift veya workflow context)

### 4.6 Implementation prompt
**Plan Phase Strategy Board Pass**

---

## 5. Yönlendir fazı UX planı

### 5.1 UX hedefi
“Ekibi sahaya sürüyorum” — atama + karar + dispatch onayı tek dramatik an.

### 5.2 Önerilen interaction pattern

1. Plan özeti chip (seçilen plan yaklaşımı).
2. Personel / araç / yaklaşım kartları (`EventAssignmentPanel`, `AssignmentOptionCard`).
3. Uyum etiketi: `calculateAssignmentCompatibility` → `CompatibilityLabel`.
4. Riskli seçim: `getAssignmentAdvisorComment` → Ece uyarı balonu.
5. Rota preview: `ActiveTaskRoutePreviewStrip` / `PlanningRoutePreviewCard` — harita olmadan metin + step dots.
6. Onayla → **500–700ms** dispatch line animasyonu + haptic + “Ekip sahaya çıktı”.
7. CTA “Sahada takip et”.

### 5.3 Assignment model kullanımı

- `buildAssignmentPanelModel` → panel satırları
- `buildAssignmentImpactPreview` → dispatch öncesi önizleme
- `confirmEventAssignment` / `markAssignmentDispatched` — mevcut state machine korunur
- `assignmentReady` gate (`EventDetailDecisionScreen`) — animasyon sonrası field geçişi

### 5.4 Vehicle/personnel compatibility
- `assignmentEngine.calculateAssignmentCompatibility`
- `assignmentPresentation` → tone + label
- `personnelPresentation` / `vehiclePresentation` impact preview (field’da zaten var)

### 5.5 Rota preview (harita olmadan)
- `buildActiveTaskRouteForEvent` → `CreviaActiveTaskRouteUiModel.fieldLine`, `steps[]`
- `ActiveTaskRoutePreviewStrip` — animasyonlu step progression
- `PlanningRoutePreviewCard` — plan fazından reuse (read-only)

### 5.6 Yanlış seçim feedback’i
- Mevcut: `Alert` (affordability, assignment blocked)
- Hedef: inline shake/border warn on card + Ece hint; Alert yalnızca kritik blok için
- `decisionAffordability` → `DecisionOptionCard` disabled state (mevcut)

### 5.7 İleride dokunulacak dosyalar
- `EventDispatchPhase.tsx`, `DispatchCommandCard.tsx`, `DispatchWorkflowFooter.tsx`
- `EventAssignmentPanel.tsx`, `AssignmentEditorModal.tsx`
- `eventWorkflowDispatchFieldPresentation.ts`
- `assignmentPresentation.ts`, `assignmentEngine.ts` (yalnızca presentation export)

### 5.8 Implementation prompt
**Dispatch Phase Assignment Motion Pass**

---

## 6. Sahada fazı UX planı

### 6.1 UX hedefi
“Operasyon canlı akıyor” — timeline ilerler, nadiren mikro karar.

### 6.2 Önerilen interaction pattern

1. `LiveOperationCard`: progress **800–1200ms** ile hedef yüzdeye animasyon (tek shot, loop yok).
2. Timeline dots aktif adım sırayla yanar.
3. 0–1 mikro olay (operasyon başına):
   - Trafik sıkıştı / Vatandaş desteği / Araç gecikti / Ekip yoruldu
4. 0–1 mini karar (`MicroDecision`):
   - Ek destek gönder / Planı koru / Rotayı değiştir
5. Progress %100 → kısa “tamamlandı” → `handleApplyPress` (veya otomatik tetik + reduced motion’da manuel CTA).

### 6.3 Mevcut microDecision sistemi

**Kullanılabilir:** Evet.

- `getActiveMicroDecisions` + `relatedEventId === event.id`
- `buildMicroDecisionCardModel` → `EventFieldMicroDecisionCard` → `LiveOperationDecisionCard`
- `applyMicroDecision` (store) — balance dokunulmadan UI timing ile sınırla

**Kısıt:** `shouldHideAdvancedSystemForFirstTenMinutes` — Day 1’de gizleme korunur.

### 6.4 Timeline sade tutma
- Max 4 step dot (`LiveOperationCard` zaten `Math.min(stepCount, 4)`)
- Tek progress bar + tek status satırı
- Mikro karar kartı progress altında, footer üstünde

### 6.5 Mikro karar sıklığı
- **Nadir:** operasyon başına 0–1 (yüksek risk veya post-pilot)
- Day 1 tutorial: 0 mikro karar
- `verify:main-operation-feel` senaryolarıyla uyum

### 6.6 Motion ve timing sınırı
- Progress animasyonu: max **1200ms**, `withRepeat` yok
- Mikro karar girişi: **180–240ms** fade
- Toplam sahada bekleme: **≤ 3s** (reduced motion: **≤ 0.5s** + manuel Tamamla)

### 6.7 İleride dokunulacak dosyalar
- `EventFieldPhase.tsx`, `LiveOperationCard.tsx`, `EventFieldMicroDecisionCard.tsx`
- `eventWorkflowDispatchFieldPresentation.ts` — `buildFieldLiveTimelineModel`
- `microDecisionPresentation.ts`
- `EventDetailDecisionScreen.tsx` — field phase auto-complete timing

### 6.8 Implementation prompt
**Field Phase Live Operation Pass**

---

## 7. Sonuç fazı UX planı

### 7.1 UX hedefi
“Kararım şehirde iz bıraktı” — sıralı impact reveal, Ece yorumu, carry-over/butterfly.

### 7.2 Önerilen interaction pattern (reveal sırası)

1. Görev tamamlandı / kısmi (`DecisionResultSnapshot.outcomeLabel`, hero)
2. Kaynak etkisi (`costs`, resource fatigue)
3. Mahalle güveni (`district` metrics, map before/after özeti)
4. Sosyal nabız (`buildSocialOutcome` → `subsystemOutcomes`)
5. Yarın riski (`carryOver`, risk delta band)
6. Rozet/yetki progress (varsa, kompakt chip)
7. Ece kısa sonuç yorumu
8. Carry-over / butterfly: “Bu karar hatırlanacak” kartı
9. CTA: “Merkez’e dön” / “Raporu aç”

### 7.3 Mevcut sistem bağlantıları

| Sistem | Engine / builder | UI (mevcut / hedef) |
|--------|------------------|---------------------|
| Result snapshot | `decisionResultModel.buildDecisionResultSnapshot` | `DecisionResultScreen` |
| Carry-over | `buildResultCarryOverMemory`, `shouldShowCarryOverMemory` | `EventCarryOverHintCard` ✓ |
| Butterfly | `butterflyHookEngine`, snapshot.`butterflyHint` | **Eksik** — `EventDecisionResultPhase` veya yeni strip |
| Social pulse | `buildSocialOutcome` | **Eksik** — `DecisionSubsystemOutcomeCard` bağlanmalı |
| Systems echo | `buildEventResultSystemsEchoModel` | `EventResultSystemsEchoStrip` ✓ |
| Impact explanation | `buildDecisionImpactExplanation` | `EventResultImpactExplanationCard` ✓ |

### 7.4 Kompakt tutma
- Her reveal bloğu: başlık + 1 satır + mini bar/chip
- `ResultStatCards` sabit metinler → snapshot metriklerine bağla
- Max 6 reveal adımı; geri kalanı “Detayları gör” collapse

### 7.5 Motion
- Sonuç reveal: **800–1400ms** toplam stagger (adım başına **180–240ms`)
- Reduced motion: tüm bloklar anında
- Rozet anı: opsiyonel `centerRewardPulse` benzeri **tek shot** (Lottie yok)

### 7.6 Stepper / route notu
Route değiştirilmez (`/events/decision-result` kalır). Opsiyonel: geçiş öncesi field’da stepper’ı `result` olarak highlight (presentation only).

### 7.7 İleride dokunulacak dosyalar
- `DecisionResultScreen.tsx`
- `EventDecisionResultPhase.tsx` (yeniden kullanım veya silme kararı)
- `DecisionSubsystemOutcomeCard.tsx`
- `eventResultPresentation.ts`, `decisionResultModel.ts`
- Yeni: `eventWorkflowResultRevealPresentation.ts`

### 7.8 Implementation prompt
**Result Phase Impact Reveal Pass** (motion ayrı alt görev olarak bu prompt içinde)

---

## 8. Fazlar arası motion dili

Merkez Motion Foundation ile uyumlu operasyon token önerileri (`motionTokens` genişletmesi — sonraki implementation):

| An | Süre | Preset adı (öneri) | Not |
|----|------|-------------------|-----|
| İncele scan | 600–900ms | `operationInspectScan` | Tek pass highlight, loop yok |
| Kart reveal | 180–240ms | `operationCardReveal` | stagger 45–75ms |
| Plan seçimi | 160–220ms | `operationPlanSelect` | border + hafif scale |
| Dispatch line | 500–700ms | `operationDispatchLine` | rota strip draw |
| Sahada progress | 800–1200ms | `operationFieldProgress` | tek animasyon |
| Sonuç reveal | 800–1400ms | `operationResultReveal` | staggered sections |

### 8.1 Kurallar (Merkez ile ortak)
- `useCreviaReducedMotion()` — tüm fazlarda zorunlu
- Sonsuz pulse yok; `softRepeatCount ≤ 2`
- `setInterval` animasyon zinciri yok
- Scroll içi ağır Reanimated layout animasyonu yok
- Lottie/Rive yalnızca rozet/ödül özel anlarında opsiyonel (bu pakette yok)
- Hub motion cap’leri operasyona taşınmaz; operasyon için ayrı density cap (ör. max 4 eşzamanlı reveal)

### 8.2 Verify
```bash
npm run verify:motion-foundation
# Yeni (ileride):
# npm run verify:operation-phase-motion
```

---

## 9. Implementation prompt planı

### 9.1 Inspect Phase Interaction Pass
| | |
|--|--|
| **Hedef** | Scan + bulgu stagger + Ece analiz; CTA gate |
| **Dosyalar** | `EventInspectPhase`, `MainFindingsCard`, `SignalSummaryCard`, `eventWorkflowPresentation.ts`, motion presets |
| **Risk** | Mock bulgu metinlerinin gerçek veriye geçişi content pack’leri etkileyebilir |
| **Verify** | Yeni `verify:operation-inspect-ui`; mevcut `verify:event-content` regresyon |

### 9.2 Plan Phase Strategy Board Pass
| | |
|--|--|
| **Hedef** | İncele özeti + trade-off bandları + seçim motion; plan→dispatch state lift |
| **Dosyalar** | `EventPlanPhase`, `PlanOptionPicker`, `eventWorkflowPlan*`, `EventDetailDecisionScreen` |
| **Risk** | Plan seçiminin dispatch default’una bağlanması tutorial akışını bozabilir |
| **Verify** | `verify:main-operation-feel`; plan presentation unit senaryoları |

### 9.3 Dispatch Phase Assignment Motion Pass
| | |
|--|--|
| **Hedef** | Uyum etiketi, Ece uyarısı, dispatch line, sahaya çıkış feedback |
| **Dosyalar** | `EventDispatchPhase`, `DispatchCommandCard`, `EventAssignmentPanel`, `assignmentPresentation`, `ActiveTaskRoutePreviewStrip` |
| **Risk** | `assignmentReady` gate ile animasyon timing çakışması |
| **Verify** | `verify:dispatch-field-ui` |

### 9.4 Field Phase Live Operation Pass
| | |
|--|--|
| **Hedef** | Animasyonlu progress, timeline, opsiyonel mikro karar, auto-complete timing |
| **Dosyalar** | `EventFieldPhase`, `LiveOperationCard`, `EventFieldMicroDecisionCard`, `eventWorkflowDispatchFieldPresentation` |
| **Risk** | Auto-complete vs manuel CTA; Day 1 hide policy |
| **Verify** | `verify:dispatch-field-ui`, `verify:main-operation-feel` |

### 9.5 Result Phase Impact Reveal Pass
| | |
|--|--|
| **Hedef** | Sıralı reveal, butterfly + subsystem outcomes, sabit metrik temizliği |
| **Dosyalar** | `DecisionResultScreen`, `DecisionSubsystemOutcomeCard`, `eventResultPresentation`, `decisionResultModel` |
| **Risk** | `DecisionResultScreen` büyük dosya; merge conflict yüksek |
| **Verify** | `verify:event-result-ui`, `verify:event-result-systems-echo` |

### 9.6 Operation Flow Performance & QA
| | |
|--|--|
| **Hedef** | Motion density audit, reduced motion, faz geçiş süreleri, legacy scroll path regresyon |
| **Dosyalar** | Tüm workflow + `EventDetailDecisionScreen`, motion tokens |
| **Risk** | İki paralel UX (`review` vs legacy) tutarsız kalabilir |
| **Verify** | `tsc --noEmit`, `verify:motion-foundation`, `verify:all` subset, manuel Day 1 + post-pilot smoke |

---

## 10. Riskler ve scope dışı

### 10.1 Riskler
| Risk | Etki | Azaltma |
|------|------|---------|
| `EventDetailDecisionScreen` god-component | Yüksek merge conflict | Faz başına presentation helper; minimal screen diff |
| Plan state persist edilmezse dispatch kopuk | Orta | Workflow local context (save version değişmeden) |
| Legacy scroll path (`timelineStatus !== 'review'`) | İki UX | Performance QA prompt’ta parity checklist |
| `DecisionResultScreen` refactor | Yüksek conflict | Küçük PR’lar, reveal helper ayrı dosya |
| Motion performans (düşük cihaz) | Orta | Density cap + reduced motion |

### 10.2 Scope dışı (bu program)
- Merkez / Hub dosyalarına dokunma
- Navigation route değiştirme
- `SAVE_VERSION` / persist şema değişikliği
- Gameplay balance / `applyDecision` hesapları
- Harita ekranı (`MapScreen`)
- Yeni dependency (Lottie/Rive)
- Büyük yeni runtime sistemi

### 10.3 Merge conflict riski alanları
1. `EventDetailDecisionScreen.tsx` — tüm fazlar
2. `DecisionResultScreen.tsx` — sonuç reveal
3. `eventWorkflowPresentation.ts` / `eventWorkflowPlanPresentation.ts`
4. `package.json` — yeni verify script’leri
5. `src/core/motion/motionTokens.ts` — operasyon token ekleme (Merkez ile paylaşımlı)

---

## 11. Kabul kriterleri (bu planning prompt)

- [x] Mevcut operasyon akışı analiz edildi
- [x] İncele / Planla / Yönlendir / Sahada / Sonuç için UX hedefi yazıldı
- [x] Her faz için interaction pattern ve motion ihtiyacı tanımlandı
- [x] Implementation prompt sırası netleştirildi
- [x] `docs/crevia-operation-phase-ux-redesign-plan.md` eklendi
- [x] Kod implementation yapılmadı
- [x] Merkez / Hub / route / persist / balance dokunulmadı

---

*Son güncelleme: Operation Phase UX Redesign Planning prompt.*
