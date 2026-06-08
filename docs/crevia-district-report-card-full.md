# Crevia — Mahalle Karnesi Full Aşama 1

## 1. Amaç

Mahalle Karnesi Lite’ı City Archive Persistence V1 üzerine genişleterek her mahalle için geçmişe dayalı, karakterli ve oyuncu sahipliği hissi veren bir profil üretmek.

**Oyuncu hissi:** “Bu mahalle sadece bir isim değil.”

## 2. Neden City Archive sonrası

Kalıcı `cityArchive` ile gün kapanışı kayıtları, duplicate-safe entry’ler ve district summary’ler artık mevcut. Full pass bu veriyi okuyarak Lite derived fallback’i zenginleştirir; yeni gameplay motoru açmaz.

## 3. Full model

`DistrictReportCardFullModel`: districtId, visibility, trustBand, trustTrend, dominantIssue, recentArchiveEvents, publicTone, playerStyleInDistrict, recoveryState, resourcePressureState, eceDistrictLine, map/hub/report line’ları, detailLines, sourceSignals.

## 4. Archive read strategy

- `selectDistrictArchiveEntries` — mahalle bazlı player-visible entries
- `selectArchiveRewardComebackSummary` / `selectArchiveEceRelationshipSummary` — özet sinyaller
- Archive yoksa `buildDistrictReportCardLiteModel` fallback

## 5. Recent events

| Gün | Max recent event |
|-----|------------------|
| 1 | 0 |
| 2–3 | 1 |
| 4–7 | 2 |
| 8+ | 3 |

## 6. Public tone

Kinds: calm, watchful, thankful, strained, recovering, frustrated_soft, confident, mixed, unknown. Archive social_response, trust trend, carry-over ve resource pressure kaynaklarından türetilir.

## 7. Player style in district

Kinds: fast_responder, social_trust_focused, route_balancer, resource_guardian, recovery_builder, balanced_operator, unknown. “Son karar çizgin” tonu; sert etiketleme yok.

## 8. Recovery/comeback state

Kinds: stable, improving, recovering, comeback_available, comeback_completed, still_under_watch, unknown. Archive comeback/trust_recovery + RewardComeback sinyalleri.

## 9. Ece district line

Archive district summary, archive eceLine, dominant issue ve player style birleşimi. AdvisorRelationship / City Echo / Tomorrow Risk ile duplicate guard.

## 10. UI integration

- **Map:** `MapDistrictReportCard` — compact, recent events max 3, numberOfLines/flexShrink
- **Hub:** max 1 mahalle line (`buildDistrictReportCardSummaryForHub`)
- **Report:** Day 4+ “Mahalle notu” (`buildDistrictReportCardLineForReport`)
- Yeni route yok

## 11. Duplicate/copy guard

City Journal, Tomorrow Risk, City Echo, Reward/Comeback, Map Reaction ile aynı cümle bastırılır. Forbidden: GPS, panik, viral, premium, pack, metadata, runtime, AI.

## 12. Non-goals

Trust engine rewrite, applyDecision/dayPipeline/event generation değişikliği, SAVE_VERSION bump, persist shape değişikliği, Story Chain Persistent, yeni route, büyük UI redesign, fake PASS.

## 13. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `typecheck` | PASS |
| `verify:district-report-card` | PASS (94) |
| `verify:city-archive` | PASS (35) |
| `verify:city-journal` | PASS (60) |
| `verify:advisor-relationship` | PASS |
| `verify:reward-comeback` | PASS |
| `verify:map-reactions` | PASS (52) |
| `verify:map-ui` / `hub-ui` / `report-ui` | PASS |
| `verify:ui-density` | PASS |
| `verify:first-10-minutes` / `post-pilot-ux` | PASS |
| `verify:full-loop` / `full-ux-flow` | PASS |
| `verify:release-candidate` | PASS — public blocked |
| `verify:manual-launch-tracker` | PASS (87, 1 WARN) |

SAVE_VERSION **24** korunur. Public launch blocked, evidence verified=0 bilinçli.

## 14. Sonraki prompt

> **Mahalle Karnesi Full Aşama 2:** Mahalle detail ekranı (route), Story Chain archive step wiring, gerçek cihaz mahalle profili QA.

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:district-report-card
npm run verify:city-archive
npm run verify:city-journal
npm run verify:advisor-relationship
npm run verify:reward-comeback
npm run verify:map-reactions
npm run verify:map-ui
npm run verify:hub-ui
npm run verify:report-ui
npm run verify:ui-density
npm run verify:first-10-minutes
npm run verify:post-pilot-ux
npm run verify:full-loop
npm run verify:full-ux-flow
npm run verify:release-candidate
npm run verify:manual-launch-tracker
```
