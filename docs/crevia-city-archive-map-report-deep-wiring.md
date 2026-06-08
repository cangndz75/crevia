# Crevia — City Archive Map/Report Deep Wiring Aşama 1

## 1. Amaç

Kalıcı archive, story chain, reward ve district verilerinin Map, Report, Hub ve Ece yüzeylerinde doğru önceliklendirilmesi, duplicate bastırma ve Day 8+ yoğunluk kontrolü.

## 2. Why after Story Chain Persistent

Story chain `story_chain_step` entry’leri ve `storyChainSummary` artık günler arası persist. Yüzeylerin aynı olayı farklı cümlelerle tekrar etmemesi gerekir.

## 3. Map journal trace priority

1. `story_chain_step` (aktif / bugün ilerlemiş)
2. `comeback_completed`
3. `comeback_available` (aktif story yoksa)
4. `main_operation_started` (Gün 8+)
5. `district_shift` (yüksek öncelik)
6. `trust_recovery` / `route_balanced` / `container_relief`
7. `report_milestone`
8. City Journal fallback

Max 1 `journal_trace`. Gün 1 yok.

## 4. Report archive continuity resolver

`buildReportArchiveContinuityFromCandidates` — story → reward → district → city journal → main operation. Gün cap: 1 / 1 / 2 / 2 (full max 3).

## 5. Hub continuity resolver

`buildHubArchiveContinuityModel` — max 1 archive/story satırı. Story > reward > district > şehir hafızası.

## 6. Ece hint coordination

`buildEceArchiveHintModel` — story Ece hint > advisor relationship > reward ece > district ece > city echo.

## 7. City Journal grouping labels

`CITY_ARCHIVE_JOURNAL_ENTRY_LABELS` — Operasyon zinciri, Toparlanma tamamlandı, Ana operasyon, vb. `filterArchiveEntriesForJournalDisplay` aynı gün/mahalle spam’ini azaltır.

## 8. Offline/resume guard

Verify: report reopen idempotent, resume hub stable, corrupt/missing archive crash yok.

## 9. Duplicate key strategy

`buildArchiveSurfaceDuplicateKey` + `isArchiveSurfaceDuplicate` + semantic cluster overlap (toparlanma, rota, konteyner, güven, risk, ana operasyon).

## 10. Copy guard

Forbidden: GPS, quest, premium, runtime, panik, vb. Preferred: devam eden iz, şehir hafızası, operasyon zinciri.

## 11. Non-goals

SAVE_VERSION bump, persist shape, applyDecision, event generation, yeni route, fake PASS.

## 12. Verify sonucu

| Komut | Sonuç |
|-------|-------|
| `typecheck:tsc` | PASS |
| `verify:city-archive-surface-wiring` | PASS (32) |
| `verify:city-archive` | PASS (35) |
| `verify:story-chain-persistent-runtime` | PASS (33) |
| `verify:city-journal` | PASS (60) |
| `verify:map-reactions` | PASS (52) |
| `verify:hub-ui` / `verify:report-ui` | PASS |
| `verify:full-loop` | PASS |

SAVE_VERSION **24**. Public launch blocked, evidence verified=0.

## 13. Sonraki prompt

> **Deep Wiring Aşama 2:** Gerçek cihazda Gün 2→8 archive resume QA, Map motion trace polish, Report full-mode 3-line cap görsel doğrulama.

## 14. Commands

```bash
npm run typecheck
npm run verify:city-archive-surface-wiring
npm run verify:city-archive
npm run verify:story-chain-persistent-runtime
npm run verify:map-reactions
npm run verify:full-loop
```
