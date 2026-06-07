# Crevia Release Candidate Polish Pack — Aşama 1

## 1. Amaç

Yeni gameplay sistemi açmadan mevcut lite sistemlerin daha premium, bağlı ve az dağınık görünmesi. Presentation/wiring polish only.

## 2. Neden şimdi gerekli

Soft launch öncesi kod verify’leri PASS; Round 1 internal device test `ready_to_execute`. Kalan risk: Hub/Report/Map yüzeylerinde helper’ların UI’ya bağlanmaması ve tekrarlayan copy.

## 3. Polish scope

| Alan | Değişiklik |
|------|------------|
| Hub | Season card wiring, Advisor card, Mahalle Karnesi supporting line |
| Report | District line, secondary compact (Day 8+ max 1 line) |
| Map | CityJournal hint via MapReaction `journal_trace` (mevcut pipeline) |
| Sheet | Tab accessibilityRole/state |
| Social | MentionFeedCard numberOfLines |
| Copy | `izleme notunda` / `görünür hizmet etkisi` varyantları |

## 4. Hub polish

- `HubMainOperationSeasonCard`: Day 9+ (Day 8 yalnızca Feel gizliyse), compact Day 8+
- `HubMainOperationFeelCard`: öncelik korunur
- `HubAdvisorCard`: `showAdvisor !== hidden'` — tek priority supporting line

## 5. Advisor polish

`selectPriorityAdvisorSupportingLine` — Day 8+ city echo > resource > pilot theme.

## 6. Mahalle Karnesi Hub/Report helper

- Hub: `buildDistrictReportCardSummaryForHub` → küçük supporting line
- Report: `buildDistrictReportCardLineForReport` → duplicate guard ile tek satır

## 7. CityJournal Map hint

`buildCityJournalMapHint` → `mapReactionModel` `journal_trace` → Map bottom panel hint (max 1).

## 8. OperationalResourcesDetailSheet accessibility

Sekmeler: `accessibilityRole="tab"`, `accessibilityState.selected`, label.

## 9. Report compact/collapse lite

`resolveReportSecondaryCompactMode` — Day 8+ secondary satırlar `numberOfLines=1`.  
Full accordion: **V1.1 backlog** (`REPORT_FULL_COLLAPSE_BACKLOG`).

## 10. Social dynamic type guard

`MentionFeedCard` body `numberOfLines={2}` + model truncation.

## 11. Copy cleanup

`polishCopyPresentation.ts` — watch note / visible service varyantları (presentation-only).

## 12. Non-goals

Gameplay, persist, SAVE_VERSION, applyDecision, dayPipeline, event generation, routes, evidence fake PASS yok.

## 13. Verify sonucu

`npm run verify:release-candidate-polish` — exit 0 beklenir.

## 14. Sonraki manuel adım

Round 1 internal device playtest — `docs/crevia-internal-device-test-round-one.md`

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:release-candidate-polish
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:ui-density
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:map-ui
npm run verify:social-pulse-ui
npm run verify:district-report-card
npm run verify:city-journal
npm run verify:map-reactions
npm run verify:operational-resource-presence
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
```
