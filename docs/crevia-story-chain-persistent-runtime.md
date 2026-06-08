# Crevia — Story Chain Persistent Runtime Aşama 1

## 1. Amaç

Mini Story Chain foundation’ı City Archive üzerinde kalıcı, günler arası takip edilen operasyon zincirlerine dönüştürmek.

**Oyuncu hissi:** “Bu mesele dün başladı, bugün ilerledi.”

## 2. Why after City Archive

`cityArchive.storyChainSummary` + `story_chain_step` entry kind mevcut. Yeni persist field açılmadan özet ve adımlar archive içinde tutulur.

## 3. Persistent model

`PersistentStoryChainState`: activeChains, recentlyClosedChains, unresolvedChainKinds, duplicateKeys, summaryLine.

## 4. Chain start rules

| Gün | Max active |
|-----|------------|
| 1 | 0 |
| 2–3 | 1 |
| 4–7 | 2 |
| 8+ | 3 |

Kaynaklar: carry-over, district report, operation signals, crisis watch, reward/comeback, main operation.

## 5. Chain advance rules

trigger → follow_up → pressure_shift / recovery_window → prevention_check → closure. Max age 5 gün → expired_soft. Aynı gün tek advance.

## 6. Chain kind behavior

8 kind: route_pressure_chain, container_recovery_chain, social_trust_chain, crisis_watch_chain, district_recovery_chain, visible_service_chain, resource_fatigue_chain, operation_followup_chain.

## 7. Archive write timing

`endCurrentDay` → `appendDayCloseCityArchiveWithStoryChains` → archive entries + `storyChainSummary` güncelleme. `applyDecision` içinde yazım yok.

## 8. Idempotency guard

day + chainId + stepKind duplicateKey; same day double advance yok; closed chain re-close yok.

## 9. Surface integration

- **City Journal:** `story_chain_step` archive entries
- **Hub:** max 1 “Devam eden iz”
- **Report:** max 1 “Operasyon zinciri”
- **Ece:** supporting hint (duplicate guard)
- **Map:** journal trace via archive `story_chain_step`

## 10. Duplicate/copy guard

City Journal, District Report Card, Tomorrow Risk, Reward/Comeback, AdvisorRelationship ile overlap bastırılır.

## 11. Non-goals

Quest UI, yeni route, event generation rewrite, SAVE_VERSION bump, fake PASS.

## 12. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `typecheck` | PASS |
| `verify:story-chain-persistent-runtime` | PASS (33) |
| `verify:story-chains` | PASS (466) |
| `verify:city-archive` | PASS (35) |
| `verify:city-journal` | PASS (60) |
| `verify:district-report-card` | PASS (94) |
| `verify:advisor-relationship` | PASS |
| `verify:reward-comeback` | PASS |
| `verify:tomorrow-risk` | PASS (37) |
| `verify:map-reactions` | PASS (52) |
| `verify:report-ui` / `verify:hub-ui` | PASS |
| `verify:first-10-minutes` / `verify:post-pilot-ux` | PASS |
| `verify:full-loop` / `verify:full-ux-flow` | PASS |
| `verify:motion-foundation` | PASS (71) |
| `verify:release-candidate` | PASS — public launch blocked, internal device test ready_to_execute |
| `verify:manual-launch-tracker` | PASS (87 PASS, 1 WARN) — public launch blocked, evidence verified=0 |

SAVE_VERSION **24** korunur. Public launch blocked, evidence verified=0 bilinçli.

## 13. Sonraki prompt

> **Story Chain Persistent Aşama 2:** Story detail backlog, gerçek cihaz multi-day chain resume QA, Map motion trace polish.

## 14. Commands

```bash
npm run typecheck
npm run verify:story-chain-persistent-runtime
npm run verify:story-chains
npm run verify:city-archive
npm run verify:full-loop
npm run verify:release-candidate
```
