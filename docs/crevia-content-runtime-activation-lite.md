# Crevia — Content Pack Runtime Activation Lite (Aşama 1)

## Amaç

Day 8+ ana operasyon hissini gerçek event çeşitliliğiyle desteklemek. Authoring-only content pack’lerin kontrollü, güvenli ve sınırlı şekilde oyuncunun karşısına çıkmasını sağlamak.

Ana oyuncu hissi: “Pilot sonrası şehir gerçekten genişledi. Farklı mahallelerde farklı operasyon türleri karşıma çıkıyor.”

## Neden şimdi gerekli

Main Operation Feel pass Day 8+ scope/tempo satırları üretiyordu ancak content variety sınırlıydı. District, Vehicle/Route ve Container/Environment pack’leri authoring tamamlandı; lite runtime activation ile Day 8+ çeşitlilik görünür hale getirildi.

## Lite activation vs full activation

| Lite (bu pass) | Full (gelecek) |
|----------------|----------------|
| Günde max 1–2 pack-origin event | Tam pack havuzu entegrasyonu |
| 3 pack (district, route, container) | Tüm pack’ler + Live-Ops |
| Candidate provider pattern | eventFamilySelectionEngine tam bağlantı |
| Presentation metadata on EventCard | Persisted pack runtime state |

## Eligible day/phase rules

- **Day 1:** activation off
- **Day 2–7:** pilot güvenliği — pack injection yok
- **Day 8+ post_pilot_light:** max 1 pack candidate
- **Day 8+ main_operation_full:** max 2 pack candidates

## Pack eligibility

**District Pack 1:** mahalle kimliği, trust/memory/operation signal uyumu  
**Vehicle & Route Pack 1:** vehicle/route pressure sinyali; maintenance intent yalnızca hint  
**Container & Environment Pack 1:** container/environment pressure; network intent yalnızca hint

## Variant selection rules

Deterministic `stableContentRuntimeHash` — Math.random yok. Sinyaller: day, districtId, operationSignals, districtTrust, resourceFatigue, previous family ids.

Variant guard:
- `district_trust` → fragile/strained/recovering trust
- `resource_fatigue` → resource pressure gerekli
- `reward/comeback` → recovery context
- `operation_era` → Day 8+ only
- `crisis_adjacent` → günde max 1

## Duplicate/freshness guard

- Aynı family kısa sürede tekrar etmez
- Aynı district+domain spam engellenir
- Crisis-adjacent / resource_fatigue günde max 1
- Pilot Day 1–7 akışına sızma yok

## Event mapping

Pack family → `EventCard` via `mapContentRuntimeActivationCandidateToEventCard`. Metadata `contentPackMeta` optional field’da taşınır (applyDecision dokunulmaz). Echo alanları: advisor, report, social, map, tomorrow, result.

## MainOperationFeel integration

`buildContentRuntimeActivationSelection` → `presentationHint` → `MainOperationFeelInput.contentPackPresentationHint` → scope line zenginleştirme. Hub’da ekstra kart yok.

## DecisionImpact / TomorrowRisk / CityEcho interaction

Aşama 2 ile pack-origin event metadata otomatik yüzeylere bağlandı (`contentRuntimeActivationWiring.ts`):

- **Decision Impact:** `tryBuildDecisionImpactFromPackMeta` — carryOver sonrası, generic fallback öncesi
- **Tomorrow Risk:** `buildTomorrowRiskFromPackMeta` — carryOver sonrası, duplicate guard ile
- **City Echo:** `buildPackEchoSurfaceLines` — ece/social/report/hub/tomorrow ayrı ton
- **Social Pulse:** mevcut mention slot’u pack socialLine ile zenginleşir (count artmaz)
- **Report/Hub:** `resolveContentPackMetaForWiring` + eventPool lookup
- **Event chip:** `buildContentPackEventChipLabel` — max 1, Day 8+ only

## Non-goals

- Event generation komple rewrite
- applyDecision / dayPipeline büyük refactor
- SAVE_VERSION / persist shape değişikliği
- Container/Vehicle/Team full runtime
- AI, Remote Config, Live-Ops
- Story Chain Persistent Runtime
- Sınırsız random pack injection
- Pack caps artırma
- eventFamilySelectionEngine full gating

## Verify sonucu (Aşama 1 + 2)

```bash
npm run verify:content-runtime-activation
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
```

Aşama 2 wiring kontrolleri `verifyContentRuntimeActivationScenario` içinde genişletildi.

---

# Aşama 2 — Decision Impact & Echo Wiring

## Amaç

Pack-origin event geldiğinde Decision Impact, Tomorrow Risk, City Echo, Social Pulse, Report ve Hub yüzeyleri domain-specific konuşsun. Oyuncu hissi: “Bu olay ana operasyon bağlamının parçası.”

## Pack metadata wiring

`EventCard.contentPackMeta` → `resolveContentPackMetaForWiring` (event, eventPool, cra_ id parse). Day 1–7 wiring kapalı.

## Decision Impact integration

`decisionImpactExplanationModel.ts` → carryOver sonrası `tryBuildDecisionImpactFromPackMeta`. District/route/container kind seçimi pack metadata ile güçlenir.

## Tomorrow Risk integration

`tomorrowRiskModel.ts` → `fromContentPackMeta` carryOver sonrası. `TomorrowRiskInput.contentPackMeta` / `event` opsiyonel.

## City Echo integration

`cityEchoBindingModel.ts` → pack kind map (`route_balance_echo`, `container_pressure_echo`, `district_trust_echo`, vb.). Surface lines duplicate guard ile ayrışır.

## Social Pulse integration

`socialPulsePresentation.ts` → `lastDecisionEvent` + `eventPool` ile city echo coordination; mention count sabit.

## Report/Hub integration

`EndOfDayReportView.tsx`, `HubScreen.tsx` → dünkü karar eventId ile pack meta resolve; MainOperationFeel hint ile duplicate guard.

## Event chip presentation hints

`PostPilotEventContextChip.tsx` → pack chip öncelikli (Mahalle odağı, Rota baskısı, Konteyner çevresi, vb.). Teknik pack adı yok.

## Duplicate guard

`isDuplicatePackLine` + `makeContentPackDuplicateKey` — DecisionImpact, TomorrowRisk, CityEcho, Report, Hub, Social arasında birebir tekrar engellenir.

## Sonraki önerilen prompt

> **Content Pack Runtime Activation Lite Aşama 3 — eventFamilySelectionEngine Pack Gating:** Lite caps korunarak family selection engine’e pack eligibility guard ekle; Story Chain hint coordination polish.

## Modül yapısı

```
src/core/contentRuntimeActivation/
  contentRuntimeActivationWiring.ts   ← Aşama 2
  ...
```
