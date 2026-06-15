# Crevia — SAVE_VERSION 27 Verify Policy Cleanup Pass

## Neden gerekli?

Decision & Strategy History Persist Binding Pass sonrası `SAVE_VERSION` 26 → 27 yükseldi. Yüzlerce verify/analyzer senaryosu hâlâ `SAVE_VERSION === 26` veya `EXPECTED_SAVE_VERSION = 26` ile compile-time karşılaştırma yapıyordu; TypeScript `TS2367` (literal overlap yok) üretiyor ve regression verify zinciri yanıltıcı FAIL/WARN veriyordu. Bu pass gameplay değiştirmeden policy borcunu temizler.

## SAVE_VERSION 27 — current policy

- Runtime: `src/store/gamePersist.ts` → `export const SAVE_VERSION: number = 27`
- Merkezi verify helper: `src/core/quality/saveVersionPolicy.ts`
  - `getExpectedSaveVersionForCurrentBuild()`
  - `isCurrentSaveVersion()`
  - `assertCurrentSaveVersion()`
  - `assertMigrationSupportsVersion(26, 27)`
  - `EXPECTED_SAVE_VERSION_FOR_VERIFY` (runtime `SAVE_VERSION` ile senkron)
- Aktif verify script’ler **hard-coded 26 beklentisi kullanmaz**; policy helper veya `EXPECTED_SAVE_VERSION_FOR_VERIFY` import eder.

## v26→v27 migration guarantee

- v26 kayıt `strategyHistory` olmadan yüklenir → boş `StrategyHistoryStateV1` ile v27’ye migrate edilir.
- v27 kayıt no-op migration ile güvenli kalır.
- Storage key değişmedi: `crevia-game-state-v1`
- Yeni migration eklenmedi; mevcut `normalizePersistedSave` zinciri kullanılır.

## StrategyHistoryState ilişkisi

- `strategyHistory` persist shape’e bağlandı (v27).
- `verify:strategy-history-persist` ve `verify:save-version-policy` smoke:
  - bounded arrays
  - duplicate normalized record replace
  - corrupted fallback
  - v26 load / v27 no-op

## Güncellenen verifier listesi (özet)

166 verify/analyzer/constants dosyası `isCurrentSaveVersion(SAVE_VERSION)` veya `EXPECTED_SAVE_VERSION_FOR_VERIFY` kullanacak şekilde hizalandı.

Yeni komutlar:

| Komut | Amaç |
| ----- | ---- |
| `npm run verify:save-version-policy` | Current version, migration, legacy scan |
| `npm run analyze:save-version-policy` | Hard-code tarama raporu |
| `npm run verify:quality-audit` | Policy helper + script registry dahil |

## Historical docs vs current policy

- Eski pass dokümanlarında “SAVE_VERSION 26 değişmedi” ifadeleri **tarihsel snapshot** olarak kalabilir.
- Aktif verify/policy check’ler current version **27** bekler.
- `docs/crevia-decision-strategy-history-persist-binding-pass.md` migration geçmişini anlatır; current policy bu dosyadaki 27 satırıdır.

## Remaining warnings

- Eski feature pass markdown’larında `SAVE_VERSION === 26` örnek kodu tarihsel olarak kalabilir; aktif `.ts` verify’de kalmamalı.
- `verify:all` tüm verify zincirini çalıştırmaz; kritik subset preflight ile doğrulanır.

## Değiştirilmeyen sınırlar

- Yeni migration yok
- Store shape değişikliği yok
- Gameplay mutation yok
- Event selection rewrite yok
- Reward payout yok
- UI redesign yok
- Day pipeline değişikliği yok
