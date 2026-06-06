# Crevia IAP Conversion Readiness — Offer Friction Pass Aşama 1

## Amaç

Post-pilot offer ve IAP değer önerisi yüzeylerini pre-launch seviyede denetlemek:

- Offer friction riskleri
- Paywall pressure wording
- False claim wording
- Copy clarity (limited vs full)
- Purchase CTA safety
- Restore CTA visibility
- Product metadata pending behavior
- RevenueCat disabled/fail-safe mode
- Store metadata consistency
- Privacy/purchase disclosure consistency

**Bu patch gerçek conversion review değildir** — soft launch data yoktur. Amaç post-launch conversion optimizasyonu değil, offer ekranı ve IAP flow etrafında pre-launch risk azaltımıdır.

## No-New-System Freeze Uyumu

Bu patch yalnızca freeze allowed scope içinde çalışır:

- `false_claim_copy_fix`
- `privacy_store_fix`
- `iap_setup_tracker_update`
- `verification_only`
- `documentation_only`
- `layout_overflow_fix`

**Yapmaz:**
- Yeni monetization sistemi
- Yeni purchase flow
- RevenueCat adapter rewrite
- Yeni paywall UI
- Yeni analytics event
- Pricing experiment
- Store product değişikliği
- Persist shape / SAVE_VERSION değişikliği

## Offer Friction Riskleri

| Risk | Kontrol |
|------|---------|
| Paywall pressure wording | 24+ pattern taranır |
| False claim | Store metadata claim patterns taranır |
| Monetization forbidden words | XP, premium, satın al, kilitli, paywall, iap |
| IAP forbidden words | ödeme yap, reklamsız, zorunlu |
| Auto-purchase on mount | bootstrapIap block incelenir |
| Auto-restore on mount | useEffect restore guard |
| Hardcoded price | $, ₺, TL, USD patterns taranır |

## Copy Guard — Yasak İfadeler

Aşağıdaki ifadeler offer/IAP copy'de **yasaktır**:

- satın almazsan oynayamazsın
- premium ile kazan / kazanmak için satın al
- garantili başarı / özel güç
- pay to win / buy to win
- gerçek para kazan / earn money
- resmi belediye / official municipality
- gerçek şehir verisi / real city data
- canlı gps / live gps
- sezon finali / season final
- oyun sonu / game over

## Limited vs Full Value Proposition

### Limited Mode (Sınırlı Gündem)
- Pilot sonrası oynanabilir kalır
- Şehir kapsamı dar kalır
- Günlük olay sayısı ve mahalle kapsamı sınırlı
- CTA: "Sınırlı Gündemle Devam Et"

### Full Mode (Ana Operasyon)
- Genişletilmiş operasyon akışı
- 5 mahalle kapsamı aktif
- Gelişmiş operasyon planı
- Kriz masası hazırlığı
- Milestone hedefleri
- Gelişmiş raporlar
- CTA: "Ana Operasyonu Aç"

Messaging kuralı: full mode value açık ama baskıcı olmayacak. "kilitli" dili dikkatli kullanılacak veya yumuşatılacak.

## Disabled / Pending State Policy

RevenueCat key/store setup yoksa:

1. Purchase CTA production'da güvenli disabled/fallback olmalı
2. Dev mock sadece `__DEV__` koruması altında olmalı
3. Gerçek ürün fiyatı yoksa fake price gösterilmemeli
4. Product loading error user-friendly olmalı
5. Launch candidate blocker devam etmeli

Runtime config modları:
- `revenuecat` — SDK keys mevcut, gerçek store flow
- `mock` — `__DEV__` only, test amaçlı
- `disabled` — production'da keys yokken, güvenli fallback

## Restore CTA Policy

- Restore CTA offer ekranında her zaman görünür olmalı
- Label: "Erişimi Geri Yükle"
- Otomatik restore yapılmamalı (CTA-only)
- Restore sonucu user-friendly copy ile gösterilmeli

## Store Metadata Consistency

Store Metadata Finalization'daki IAP draft ile offer copy çelişmemeli:

| Alan | Beklenen Değer |
|------|---------------|
| Entitlement ID | `main_operation_full_access` |
| Offering ID | `default` |
| Product type | `non_consumable` |
| iOS product ID | `crevia.main_operation.season1` |
| Android product ID | `crevia_main_operation_season_1` |
| Price tier status | `pending_manual` → UI fake price göstermemeli |

## Privacy / Purchase Disclosure Consistency

Privacy Data Safety Draft ile uyum:

- Purchase data: store/RevenueCat üzerinden → declared
- Entitlement status: RevenueCat sync → declared
- Raw user text: toplanmaz → declared
- Location data: toplanmaz → declared
- Tracking: yapılmaz → declared
- Yanıltıcı "hiç veri toplamıyoruz" copy yok

## Yapılmayanlar

- [ ] Gerçek conversion rate analizi (soft launch data yok)
- [ ] A/B test pricing
- [ ] Paywall redesign
- [ ] Purchase flow rewrite
- [ ] Analytics event eklenmesi
- [ ] Store product / entitlement değişikliği

## Post-Launch Gerçek Conversion Review

Soft launch data geldiğinde:

1. Offer view → purchase started funnel
2. Purchase started → completed rate
3. Restore usage frequency
4. Limited → full upgrade timing
5. Day 7 → Day 8 offer visibility rate
6. Churn at offer screen
7. Price sensitivity (eğer A/B test yapılırsa)

Bu metrikler `docs/crevia-post-launch-telemetry-readiness.md` KPI tanımlarıyla uyumludur.

## Verify

```bash
npm run verify:iap-conversion-readiness
```

Kontroller:
- Offer copy forbidden paywall pressure içermez
- Limited mode playable copy vardır
- Restore CTA policy vardır
- Product metadata pending safe fallback vardır
- Fake price guard çalışır
- RevenueCat disabled state güvenli kabul edilir
- Dev mock production pass sayılmaz
- Store metadata IAP draft ile consistency vardır
- Privacy purchase disclosure consistency vardır
- No-New-System Freeze forbidden scope ihlal edilmez
- Soft Launch Review IAP conversion findings'i okur
- Tüm mevcut verify komutları bozulmaz
- SAVE_VERSION değişmez
