# Crevia — City Archive Persistence V1

## 1. Amaç

Şehir geçmişini güvenli şekilde kalıcı hale getirmek. Gün kapanışında idempotent arşiv kaydı; City Journal archive-backed okuma; migration 23 → 24.

**Oyuncu hissi:** “Şehrimin geçmişi gerçekten oluşuyor.”

## 2. What changed

- `SAVE_VERSION` 23 → **24**
- `gamePersist.cityArchive` alanı
- `endCurrentDay` sonrası archive append
- City Journal archive-backed read mode (fallback korunur)
- Future selectors export

## 3. Persist shape

`CityArchiveV1State`: version, createdAtDay, updatedAtDay, entries, districtSummaries, playerStyleSummary, eceRelationshipSummary, rewardComebackSummary, storyChainSummary, pruningState, migrationMeta.

## 4. SAVE_VERSION 24 migration

- v23 kayıtları yüklendiğinde `cityArchive` yoksa güvenli init + minimal backfill
- Day 1–3: boş/compact archive
- Day 4+: max 3 backfill entry
- Day 8+ pilot tamam: `main_operation_started` once
- Idempotent: `migrationMeta` + `duplicateKey`

## 5. Entry model

15 kind: decision_record, district_shift, trust_recovery, route_balanced, container_relief, resource_pressure, resource_recovery, social_response, crisis_prevented, main_operation_started, comeback_available, comeback_completed, ece_prediction_confirmed, story_chain_step, report_milestone.

## 6. Archive append timing

`endCurrentDay` içinde rapor oluşturulduktan sonra, `set()` öncesi — `appendDayCloseCityArchive`. `applyDecision` içinde persist write yok.

## 7. Idempotency guard

- `duplicateKey` tekrar yazılmaz
- same day/kind/event tekrar yazılmaz
- `main_operation_started` once
- report reopen / app resume duplicate yok (`lastClosedDay` guard + duplicateKey)

## 8. Backfill strategy

Öncelik: lastDailyReport → decisionHistory → journal/reward/district/main operation → fallback `archive_started`. Max 3 entry. Fazla akıllı değil.

## 9. Pruning strategy

- maxEntries: 120
- maxEntriesPerDistrict: 20
- keepLastNDaysDetailed: 10
- story_chain_step unresolved, main_operation_started, comeback_completed, ece_prediction_confirmed korunur
- low priority fallback önce silinir

## 10. City Journal archive-backed mode

`buildCityJournalLiteModel({ cityArchive })` — archive player-visible entries öncelikli; yoksa derived fallback. Day visibility kuralları aynı.

## 11. Selectors for future systems

- `selectRecentCityArchiveEntries`
- `selectDistrictArchiveEntries`
- `selectArchiveEntryForMapJournalTrace`
- `selectArchivePreviousDecisionReference`
- `selectArchiveRewardComebackSummary`
- `selectArchiveEceRelationshipSummary`

## 12. Privacy/data safety guard

Saklanmaz: raw event body, full save, PII, GPS, payment, analytics raw, debug, AI prompt/response.

## 13. Non-goals

Mahalle Karnesi Full, Story Chain Persistent Runtime, Content Pack Activation Full, Vehicle Maintenance Runtime, Team Specialization Runtime, applyDecision rewrite, event generation rewrite, fake PASS.

## 14. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `npm run typecheck` | PASS |
| `npm run verify:city-archive` | PASS (35) |
| `npm run verify:city-archive-planning` | PASS (85) |
| `npm run verify:city-journal` | PASS (60) |
| `npm run verify:district-report-card` | PASS |
| `npm run verify:advisor-relationship` | PASS |
| `npm run verify:reward-comeback` | PASS |
| `npm run verify:story-chains` | PASS (466) |
| `npm run verify:offline-resume` | PASS (1 WARN bilinen) |
| `npm run verify:report-ui` | PASS |
| `npm run verify:map-reactions` | PASS |
| `npm run verify:motion-foundation` | PASS |
| `npm run verify:first-10-minutes` | PASS |
| `npm run verify:post-pilot-ux` | PASS |
| `npm run verify:full-loop` | PASS |
| `npm run verify:full-ux-flow` | PASS |
| `npm run verify:release-candidate` | PASS — public launch blocked, evidence verified=0 |
| `npm run verify:manual-launch-tracker` | PASS — manual blockers açık |

Public launch blocked ve evidence verified=0 bilinçli olarak korunur; fake PASS yok.

## 15. Sonraki prompt

> **City Archive V2:** Mahalle Karnesi Full archive read, Story Chain persistent step write, Map journal trace archive selector wiring, gerçek cihaz archive resume QA.

## 16. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:city-archive
npm run verify:city-archive-planning
npm run verify:city-journal
npm run verify:district-report-card
npm run verify:advisor-relationship
npm run verify:reward-comeback
npm run verify:story-chains
npm run verify:offline-resume
npm run verify:report-ui
npm run verify:map-reactions
npm run verify:motion-foundation
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
npm run verify:release-candidate
npm run verify:manual-launch-tracker
```
