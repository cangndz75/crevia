# Crevia — Real IAP Integration (RevenueCat MVP)

Aşama 2: `react-native-purchases` yalnızca `src/core/iap/revenueCatIapAdapter.ts` içinde import edilir. Eksik API key veya native modül durumunda uygulama çökmez; dev’de mock akış korunur.

## Runtime modları

| Mod | Koşul |
|-----|--------|
| `revenuecat` | `EXPO_PUBLIC_REVENUECAT_*` public key (platform) tanımlı |
| `mock` | `__DEV__` ve key yok |
| `disabled` | Production ve key yok |

## Ortam değişkenleri

```env
EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_...
EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_...
EXPO_PUBLIC_REVENUECAT_APP_USER_ID=          # opsiyonel
```

- Secret key (`sk_`, `rcsk_`) asla kullanılmaz.
- Placeholder key’ler yok sayılır.

## RevenueCat setup checklist

- [ ] RevenueCat projesi oluşturuldu
- [ ] Entitlement `main_operation_full_access` oluşturuldu
- [ ] Ürün `main_operation_season_1` entitlement’a bağlandı
- [ ] Default/current offering’e package eklendi
- [ ] iOS public SDK key `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`
- [ ] Android public SDK key `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`

## App Store Connect

- [ ] Product `crevia.main_operation.season1` (non-consumable / non-renewing uygun tipe göre)
- [ ] Sandbox tester tanımlı
- [ ] iOS target **In-App Purchase** capability açık (Xcode)
- [ ] iOS deployment target ≥ 13.4

## Google Play Console

- [ ] Product `crevia_main_operation_season_1`
- [ ] License testers tanımlı
- [ ] `AndroidManifest.xml` → `com.android.vending.BILLING` (EAS/prebuild sonrası kontrol)
- [ ] `launchMode` `standard` veya `singleTop`
- [ ] minSdk / API ≥ 23

## Ürün eşlemesi (API)

`getOfferings()` → `current.availablePackages` içinde store product id:

- iOS: `crevia.main_operation.season1`
- Android: `crevia_main_operation_season_1`

Satın alma: `purchasePackage(matchedPackage)`.

## PostPilotOfferScreen akışı

1. Mount: `initializeIapRuntime` + `fetchIapProducts`
2. RevenueCat modunda: `getCustomerInfo` ile aktif entitlement → `applyIapEntitlementToMonetization` (otomatik **restore** değil)
3. Primary CTA: mock (dev) veya `purchaseIapProduct(main_operation_season_1)`
4. Restore CTA: yalnızca kullanıcı aksiyonu → `restoreIapPurchases` → `restorePurchases` (SDK)

## Analytics (schema uyumlu)

- `post_pilot_offer_opened`
- `post_pilot_offer_primary_cta_pressed`
- `limited_continue_selected`
- `iap_product_list_loaded`
- `iap_purchase_started` / `completed` / `failed`
- `iap_restore_started` / `completed` / `not_found`
- `main_operation_mock_purchase_started` / `completed`

Ham hata metni gönderilmez; `resultBand` / `source` enum.

## Mock akış

`__DEV__` + key yok → `mockPurchaseMainOperationPack` korunur.

## Sandbox / restore test

- [ ] Sandbox purchase works (development build)
- [ ] Restore works (aynı Apple/Google hesabı)
- [ ] Limited flow still works
- [ ] Mock dev flow still works

## Bilinen sınırlar

- Expo Go: Preview API; gerçek satın alma için development build gerekir
- Store ürünleri / fiyat finalize değilse WARN
- Backend receipt validation yok
- RevenueCat Paywalls UI yok
- `syncPurchases` MVP’de yok

## Rollback

1. Env key’leri kaldır → runtime `disabled` / dev `mock`
2. `PostPilotOfferScreen` mock dalına döner
3. Dependency kaldırmak için `react-native-purchases` sil + adapter dosyası revert

## Verify

```bash
npm run verify:iap-integration
npm run verify:iap-sandbox-qa
```

Sandbox QA checklist: [crevia-iap-sandbox-qa.md](./crevia-iap-sandbox-qa.md)
