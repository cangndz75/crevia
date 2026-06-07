# Crevia — Offline / Resume Robustness Pass (Aşama 1)

## Amaç

Soft launch öncesi app kapat-aç, yarım kalmış event, Day 8+ post-pilot event set, content pack-origin event ve türev presentation katmanlarının (Decision Impact, Tomorrow Risk, City Echo, Şehir Günlüğü, Mahalle Karnesi, Resource Presence, Dynamic Map Reaction, Report, Hub) güvenli devam etmesini denetlemek ve minimum fix uygulamak.

Ana oyuncu hissi: “Oyun kaldığı yerden güvenli devam ediyor.”

## Neden şimdi gerekli

Birden fazla lite presentation katmanı aynı post-pilot state zincirinden sinyal alıyor. Bilinen geçmiş issue: `SolvedEvent` stub `contentPackMeta` taşımıyor. Restart sonrası recovery deterministic olmalı.

## Resume senaryoları

| Faz | Senaryo |
|-----|---------|
| Day 1 | Tutorial resume — ağır post-pilot sızmaz |
| Day 2-7 | Pilot daily set idempotent hydrate |
| Day 7→8 | Main operation feel görünür |
| Day 8+ light | Pack-origin event + presentation recovery |
| Surface | Map/Hub/Result eventPool + postPilotCatalog wiring |
| Offline | Monetization safe default |

## Day 1-7 pilot safety

`ensureDailyEventsForDay` mevcut `dailyEventSet` varsa yeniden üretmez. Day 1 Hub visibility ağır sistemleri gizler.

## Day 7 → Day 8 transition

Pilot `status: completed` + `postPilotOperation.phase: main_operation_light` ile post-pilot loop eligible. Main operation feel Day 8+ görünür.

## Day 8+ pack-origin event resume

`postPilotDailyEventSet.catalog` ve `eventPool` persist edilir. Solved stub meta taşımaz; recovery sırası:

1. Direct `contentPackMeta`
2. `event.contentPackMeta`
3. `eventPool` lookup
4. `postPilotDailyEventSet.catalog` lookup
5. `cra_*` id parse → synthetic meta
6. Domain-specific safe fallback

## contentPackMeta recovery strategy

**Seçenek A (uygulandı):** Persist shape değiştirmeden `resolveContentPackMetaForWiring` güçlendirildi — `postPilotCatalog`, `mergeContentPackLookupCards`, caller’lara `eventPool` propagation.

**Seçenek B:** eventPool/catalog persist zaten var — verify ile garanti.

**Seçenek C (yapılmadı):** SAVE_VERSION bump + solved stub persist field — blocker değil, backlog.

## Derived presentation fallback safety

DistrictReportCard, CityJournal, MapReaction, OperationalResourcePresence undefined/missing input’ta fallback üretir; crash yok.

## Idempotency checks

- `ensureDailyEventsForDay` — aynı gün duplicate set yok
- `ensurePostPilotDailyEventsForDay` — `already_generated_for_day`
- Light mode max 1 pack-origin event cap
- CityJournal duplicate guard
- Tomorrow Risk aynı input → aynı line

## UI safety checks

- `contentPackMeta` undefined → crash yok
- `tomorrowRisk` null → kart gizlenir / fallback
- MapScreen, DecisionResultScreen, HubScreen resume wiring

## Known issue triage

| Issue | Karar |
|-------|-------|
| Solved stub meta persist yok | WARN — pool/catalog/parse recovery PASS |
| eventFamilySelectionEngine full gating | V1.1 backlog |
| HubMainOperationSeasonCard Reference Home | WARN/backlog — resume blocker değil |
| verify:soft-launch-review FAIL | Release Candidate cleanup |
| verify:post-launch-telemetry-readiness FAIL | Release Candidate cleanup |

## Fixed issues (Aşama 1)

- `resolveContentPackMetaForWiring` — `postPilotCatalog` + merged lookup
- `DecisionImpactExplanationInput` — `eventPool`, `postPilotCatalog`
- `CityEchoBindingInput`, `TomorrowRiskInput` — resume context alanları
- MapScreen, DecisionResultScreen, HubScreen — eventPool/catalog wiring

## Remaining issues

- Synthetic `cra_*` meta zengin pack echo intent kaybedebilir — tam meta için pool/catalog şart
- SolvedEvent stub bilinçli olarak meta taşımaz
- Release Candidate öncesi soft-launch-review ve telemetry-readiness cleanup

## Non-goals

SAVE_VERSION bump, persist shape, applyDecision, generateDailyEventSet, dayPipeline rewrite, yeni route, pack caps artırma, Day 1-7 injection açma.

## Verify sonucu

```bash
npm run verify:offline-resume
```

## Sonraki önerilen prompt

**Offline / Resume Robustness Aşama 2:** Real-device restart QA matrisi; solved stub minimal meta snapshot (SAVE_VERSION bump ayrı prompt); postPilotDailyEventSet loss recovery hardening; HubMainOperationSeasonCard Reference Home wiring polish.

## Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:offline-resume
npm run verify:content-runtime-activation
npm run verify:decision-impact-explanation
npm run verify:tomorrow-risk
npm run verify:city-echo-binding
npm run verify:main-operation-feel
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:operational-resource-presence
npm run verify:map-reactions
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:report-ui
npm run verify:hub-ui
npm run verify:map-ui
npm run verify:event-result-ui
npm run verify:decision-result
npm run verify:carry-over-memory
npm run verify:full-loop
npm run verify:full-ux-flow
```

Release Candidate Audit öncesi (zorunlu pass kriteri değil):

```bash
npm run verify:soft-launch-review
npm run verify:post-launch-telemetry-readiness
npm run verify:no-new-system-freeze
npm run verify:privacy-policy-readiness
```
