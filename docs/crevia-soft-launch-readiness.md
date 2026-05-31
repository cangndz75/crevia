# Crevia Soft Launch Readiness

> Bu doküman gerçek IAP SDK, analytics SDK veya store yayını değildir. Pre-SDK / pre-soft-launch denetim çerçevesidir.

## Amaç

First 10 Minutes, tam Ana Operasyon, sezon sonu, analytics şeması ve IAP ürün tasarımı tamamlandıktan sonra tüm ürün, teknik, UX, monetization, analytics ve QA risklerini tek audit altında toplamak.

```bash
npm run verify:soft-launch-readiness
```

## Current readiness status (Aşama 1)

| Metrik | Beklenen |
| --- | --- |
| Health | **WARN** (pre-SDK) |
| Blocker | **0** |
| Release decision | **Ready for SDK Integration** |
| Public soft-launch | **Hazır değil** |

## What is ready

- SAVE_VERSION 23 ve migration hydrate
- Pilot Gün 1–7 + full loop simülasyonu
- Post-pilot offer, limited continue, mock full access
- IAP ürün modeli (`one_time_unlock`, entitlement mapping)
- Analytics event schema (60 event, 9 funnel, privacy)
- Season end evaluation (full mod)
- Interaction contracts + dev tool `__DEV__` guard’ları
- Yasak paywall dili taraması (constants)

## What is not ready

- Gerçek IAP SDK (StoreKit / Play Billing / RevenueCat)
- Runtime analytics instrumentation
- Analytics dashboard
- Manuel playtest (4 profil + gerçek cihaz)
- Store product ID oluşturma (console)
- Fiyatlandırma finalize
- Sezon 2 restart / paylaşım

## Known WARNs

- Real IAP SDK pending
- Runtime analytics instrumentation pending
- Manual playtest pending
- Performance selector WARN (full gameState selectors)
- Store product IDs / pricing pending
- Season 2 restart pending
- Full season simulation balance WARN

## Release blockers

Aşağıdakiler **BLOCKED** veya **FAIL** üretir:

- `tsc --noEmit` fail
- `verify:full-loop` fail
- Save migration hydrate fail
- `verify:day-pipeline` fail
- `verify:monetization-gate` fail
- Analytics privacy fail
- Dev tools production’da görünür
- Oyuncu metinlerinde yasak kelime (premium, satın al, kilitli, …)
- Event duplicate / report crash (full-loop)

Pre-SDK modunda IAP SDK ve instrumentation **WARN**; `launch_candidate` modunda **blocker**.

## Pre-SDK checklist

- [ ] `npm run typecheck` PASS
- [ ] `npm run verify:full-loop` PASS
- [ ] `npm run verify:monetization-gate` PASS
- [ ] `npm run verify:iap-product-design` PASS
- [ ] `npm run verify:analytics-events` PASS
- [ ] `npm run verify:soft-launch-readiness` WARN, 0 blocker

## Pre-soft-launch checklist

- [ ] `IapAdapter` implementasyonu
- [ ] Store product IDs (App Store + Play)
- [ ] Fiyat onayı
- [ ] `trackAnalyticsEvent` UI instrumentation
- [ ] Analytics dashboard
- [ ] Manuel playtest tamamlandı
- [ ] Release build smoke test
- [ ] Dev/mock CTA production’da gizli
- [ ] Gizlilik metni gözden geçirildi

## QA device checklist

- [ ] iOS fiziksel cihaz — Gün 1, Gün 7 offer, Gün 8 limited/full
- [ ] Android fiziksel cihaz — aynı akış
- [ ] Düşük RAM cihazda Hub scroll / Report
- [ ] Map overlay + crisis badge çakışması
- [ ] Operational resources detail sheet
- [ ] Season end kartı (gün 14 full)

## Manual playtest requirements

`docs/crevia-player-flow-playtest-checklist.md` kullan:

- En az 4 profil (güçlü, zayıf, sınırlı, full)
- Gün 7 “pilot bitti” netliği
- Full vs limited değer farkı
- Mock purchase yalnızca dev’de

## Store / IAP checklist

- [ ] Ürün: `main_operation_season_1` (one_time_unlock)
- [ ] iOS: `crevia.main_operation.season1`
- [ ] Android: `crevia_main_operation_season_1`
- [ ] Restore: “Erişimi Geri Yükle”
- [ ] Yasak kelime yok (bkz. `docs/crevia-iap-product-design.md`)

## Analytics checklist

- [ ] Schema v1 — 60 event, 9 funnel
- [ ] Privacy audit PASS
- [ ] Post-pilot funnel eventleri
- [ ] IAP Aşama 2 eventleri (instrumentation sonrası)

## Performance checklist

- [ ] `verify:performance-selectors` — FAIL yok
- [ ] Hub dar selector refactor planı
- [ ] Düşük cihazda jank notu

## Final go/no-go criteria

### Go for SDK integration

- typecheck PASS
- full-loop PASS
- monetization-gate PASS
- iap-product-design PASS
- analytics-events PASS
- soft-launch-readiness: **0 blocker**

### Go for public soft-launch

- Gerçek IAP SDK entegre ve test edildi
- Runtime analytics çalışıyor
- Manuel playtest tamamlandı
- Store product IDs + fiyat finalize
- Release build smoke PASS
- Dev tools gizli
- Privacy copy onaylı

### No-go

- Herhangi release blocker
- FAIL health (blocker olmadan fail)
- Store review yasak copy

## İlgili dokümanlar

- `docs/crevia-iap-product-design.md`
- `docs/crevia-analytics-event-schema.md`
- `docs/crevia-player-flow-playtest-checklist.md`
