# Crevia — Store Metadata Checklist

Soft launch mağaza listeleme hazırlığı. Bu dosya **checklist**tir; gerçek App Store / Play Console gönderimi bu pass kapsamında yapılmaz.

İlgili: [crevia-eas-store-build-prep-foundation.md](./crevia-eas-store-build-prep-foundation.md), [crevia-store-listing-readiness.md](./crevia-store-listing-readiness.md)

## App identity

| Alan | Durum | Not |
|------|-------|-----|
| App name | Draft | Crevia |
| Subtitle (iOS) / Short description (Play) | Pending | Aşağıda placeholder |
| Long description | Pending | TR + EN placeholder |
| Keywords / tags | Pending | simulation, city, operations |
| Primary category | Draft | Games → Simulation |
| Secondary category | Optional | Strategy |
| Age rating considerations | Draft | 4+ / Everyone — şiddet, kumar, yetişkin içerik yok |
| Privacy policy URL | **Pending** | Launch blocker — gerçek URL gerekli |
| Support URL | Pending | support@PENDING_PLACEHOLDER veya web |
| Marketing URL | Optional | N/A |
| Contact email | Pending | support@PENDING_PLACEHOLDER |

## TR — placeholder copy (draft)

- **Kısa açıklama:** Şehir operasyon simülasyonu. Mahalleleri yönet, kararlar al, şehri dengele.
- **Uzun açıklama:** _(Mağaza final copy pass’inde yazılacak.)_

## EN — placeholder copy (draft)

- **Short description:** City operations simulation. Manage districts, make decisions, balance the city.
- **Long description:** _(To be finalized in store copy pass.)_

## Screenshots needed (future pass)

| Ekran | iOS | Android | Durum |
|-------|-----|---------|-------|
| Hub / Center home | ✓ | ✓ | Pending capture |
| Operation flow | ✓ | ✓ | Pending |
| Map | ✓ | ✓ | Pending |
| Report / end-of-day | ✓ | ✓ | Pending |
| Achievements / Profile | ✓ | ✓ | Pending |
| Feature graphic | — | ✓ | Pending |
| Promo / tablet | Optional | Optional | N/A |

## App review notes (placeholder)

- Uygulama offline-first; hesap oluşturma zorunlu değil.
- IAP: Ana Operasyon tek seferlik unlock (RevenueCat + store products pending).
- Test hesabı / sandbox: _(internal build sonrası doldurulacak)_

## Data safety (store form cross-ref)

Mağaza formları için detay: [crevia-privacy-data-safety-checklist.md](./crevia-privacy-data-safety-checklist.md)

## IAP store listing cross-ref

| Alan | Değer | Durum |
|------|-------|-------|
| iOS product id | `crevia.main_operation.season1` | Pending dashboard |
| Android product id | `crevia_main_operation_season_1` | Pending dashboard |
| Entitlement | `main_operation_full_access` | Pending RevenueCat |
| Offering | `default` | Pending RevenueCat |

## Verification

```bash
npm run analyze:build-prep
npm run verify:build-prep
```
