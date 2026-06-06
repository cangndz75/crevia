# Crevia Story Chain / Report Systems / District Operation Actions Regression Cleanup

## Amaç

Story Chain Persistent Runtime Review sonrası cascade verify FAIL'lerini review-only / bugfix kapsamında temizlemek. Runtime gameplay, persist shape ve SAVE_VERSION korunur.

## Kırılan verify scriptleri

| Script | FAIL sayısı | Cascade kaynağı |
|--------|-------------|-----------------|
| `verify:carry-over-memory` | 1 | Hub home integration assertion |
| `verify:report-tomorrow-preview` | 1 | carry-over-memory cascade |
| `verify:map-presence` | 1 | report-tomorrow-preview cascade |
| `verify:map-before-after-state` | 4 | map-presence + carry-over cascade |
| `verify:report-systems-integration` | 3 | tomorrow-preview, carry-over, map-before-after |
| `verify:district-operation-actions` | 1 | report-systems cascade |
| `verify:story-chains` | 1 | district-operation-actions cascade |
| `verify:story-chain-runtime-hints` | 3 | story-chains + report + district cascade |
| `verify:performance-selector-pass-two` | 1 | HubReferenceHome open-ended memoization assertion |
| `verify:soft-launch-review` | 1 | performance-selector-pass-two cascade |
| `verify:post-launch-telemetry-readiness` | 3 | soft-launch / freeze / privacy cascade |

## Kök neden

### 1. Carry-over hub integration (asıl kök)

`verifyCarryOverMemoryScenario` `HubReferenceHome.tsx` içinde `HubCarryOverMemoryCard` string arıyordu. Hub referans home refactor sonrası carry-over `PreviousDecisionEffectCard` + `hubCarryOverMemory` prop ile `HubScreen` → `HubReferenceHome` zincirinde bağlanıyor.

**Gerçek runtime regression değil** — verify expectation eski kaldı.

### 2. Performance selector hub memoization

`verifyPerformanceSelectorPassTwoScenario` open-ended model memoization için yalnızca `HubReferenceHome.tsx` okuyordu. Referans home sadeleştirildi; carry-over `HubScreen.useMemo(buildHubCarryOverMemory)` ile memoize ediliyor; `HubOpenEndedOperationCard` analytics'i `useEffect` içinde.

**Gerçek runtime regression değil** — verify expectation eski kaldı.

### 3. Cascade zinciri

carry-over → report-tomorrow → map-presence → map-before-after → report-systems → district-operation-actions → story-chains → story-chain-runtime-hints → soft-launch → post-launch-telemetry

## Yapılan düzeltmeler

| Dosya | Değişiklik |
|-------|------------|
| `src/core/carryOver/verifyCarryOverMemoryScenario.ts` | Hub integration: `PreviousDecisionEffectCard` + `hubCarryOverMemory` + `HubScreen.buildHubCarryOverMemory` |
| `src/core/quality/verifyPerformanceSelectorPassTwoScenario.ts` | Hub memoization: HubScreen carry-over useMemo + HubOpenEndedOperationCard useEffect pattern |

## Runtime'a dokunulmadı

- Event generation değişmedi
- applyDecision / dayPipeline değişmedi
- Story chain resolver behavior değişmedi
- District operation action effects değişmedi
- Persist shape değişmedi
- SAVE_VERSION 23 korundu
- Yeni UI component eklenmedi
- Yeni analytics event eklenmedi

## Kalan WARN

- Story chain / content duplicate WARN'leri soft launch review policy'sinde kalabilir
- Dashboard SDK pending WARN post-launch telemetry'de beklenen
- Performance selector audit WARN'leri (21 WARN) launch blocker değil

## Takip verify komutları

```bash
npm run typecheck
npm run verify:story-chain-persistent-runtime-review
npm run verify:story-chains
npm run verify:story-chain-runtime-hints
npm run verify:post-launch-telemetry-readiness
npm run verify:report-systems-integration
npm run verify:district-operation-actions
npm run verify:soft-launch-review
npm run verify:full-loop
npm run verify:full-ux-flow
```
