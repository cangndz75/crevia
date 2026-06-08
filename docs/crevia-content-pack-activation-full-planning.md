# Crevia — Content Pack Activation Full Planning + Balance Guard

## 1. Amaç

Content Pack Activation Full implementation öncesi aktivasyon kapsamı, gün cap’leri, district/domain balance, story/archive spam guard ve verify matrix netleştirmek. **Bu pass implementation değildir.**

## 2. Current Lite activation

- Day 8+ light max 1, full max 2 pack-origin event
- Pilot Day 1–7 protected
- `content_runtime_activation_lite` source

## 3. Why full activation needs guard

City Archive, Story Chain, Mahalle Karnesi, Report/Hub/Map duplicate resolver hazır. Full activation olmadan önce spam, district overload ve story chain tetikleme riskleri planlanmalı.

## 4. Pack groups (8)

District, Vehicle & Route, Container & Environment, Personnel & Morale, Social & Trust, Crisis-adjacent, Reward/Comeback, Operation Follow-up.

## 5. Domain groups (10)

district_balance, vehicle_route, container_environment, personnel_morale, social_trust, crisis_adjacent, reward_positive, comeback_recovery, operation_followup, resource_pressure.

## 6. Activation phases

| Phase | Durum |
|-------|-------|
| 0 Lite | Aktif (mevcut) |
| 1 Expanded safe | Plan hazır, runtime kapalı |
| 2 Full main op | Day 10+, plan hazır |
| 3 Future | V1.1/V2, kapalı |

## 7. Day/access caps

- Gün 1: 0 pack-origin
- Gün 2–7: 0
- Gün 8–9 light: max 1 event, 1 archive, 1 story trigger
- Gün 8+ full: max 2 event, 2 archive, 1 story trigger
- Gün 10+ full (gelecek): max 3 yalnızca balance guard sonrası

## 8. District balance guard

5 mahalle; 2 günlük pencerede aynı mahallede max 2 pack event; aktif story chain varken closure/recovery tercih; Yeşilvadi tekrar guard.

## 9. Freshness / duplicate guard

3 gün event family, aynı gün district+domain, 2 gün copy cluster, story chain kind tekrar yok.

## 10. City Archive spam guard

Pack-origin archive max 2/gün; light max 1; story_chain_step bugün varsa pack archive düşük öncelik; raw pack metadata saklanmaz; maxEntries 120.

## 11. Story Chain trigger guard

Pack start min Day 4 (derived) / Day 8 (full); max 1 pack-origin start/gün; reward closes, crisis spam yok.

## 12. Report/Hub/Map/Social density guard

Report continuity max 1 pack line; Hub max 1; Map journal_trace story öncelikli; Social slot reuse, extra count yok.

## 13. Balance score model

`ContentPackFullReadinessScore` — overall: `ready_for_limited_full` (bu pass). Full implementation runtime hâlâ kapalı.

## 14. Implementation scope recommendation

**Aşama 1:** Day 8+ full max 2, crisis limited, archive 1–2, story trigger max 1/gün.  
**Not included:** Remote config, live ops, AI, yeni event screen.

## 15. Non-goals

Runtime injection, event generation, applyDecision, SAVE_VERSION bump, fake PASS.

## 16. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `verify:content-runtime-activation-full-planning` | PASS |
| `verify:content-runtime-activation` | PASS (lite unchanged) |
| SAVE_VERSION | 24 |

## 17. Sonraki prompt

> **Content Pack Activation Full Implementation Aşama 1:** Phase 1 expanded safe runtime, max 2 pack-origin, guard’ları audit modülünden runtime selector’a bağla.

## 18. Commands

```bash
npm run verify:content-runtime-activation-full-planning
npm run verify:content-runtime-activation
npm run typecheck
```
