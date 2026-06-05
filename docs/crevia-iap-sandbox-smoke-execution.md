# Crevia IAP Sandbox Smoke Test — Execution (Round 1)

## Amaç

IAP sandbox smoke testini **yürütülebilir ve raporlanabilir** hale getirmek. Bu doküman manuel test adımlarını ve sonuç kayıt formatını tanımlar.

**Gerçek dashboard işlemi bu patch kapsamında yapılmaz.** Sonuçlar manuel doldurulmadan `passed_sandbox_smoke` sayılmaz.

Otomatik plan doğrulama: `npm run verify:iap-sandbox-smoke-execution`

İlgili: `docs/crevia-iap-sandbox-smoke-test.md` (readiness), `docs/crevia-iap-integration.md`

## Ön koşullar

- [ ] EAS **development build** (Expo Go değil)
- [ ] `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (`appl_*`)
- [ ] `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (`goog_*`)
- [ ] RevenueCat entitlement: `main_operation_full_access`
- [ ] Offering: `default`
- [ ] iOS product: `crevia.main_operation.season1`
- [ ] Android product: `crevia_main_operation_season_1`
- [ ] Real Device Playtest Round 1 **ayrı** tamamlanmalı (launch candidate için)
- [ ] **Secret key (`sk_`) asla client'a konmaz**

## RevenueCat dashboard checklist

- [ ] Proje + iOS/Android uygulamaları
- [ ] Public SDK keys (appl_/goog_)
- [ ] Entitlement `main_operation_full_access`
- [ ] Products bağlı (iOS + Android store id)
- [ ] Default offering + package `main_operation_season_1`
- [ ] Sandbox satın alma sonrası CustomerInfo entitlement active

## App Store Connect checklist

- [ ] Product `crevia.main_operation.season1` (non-consumable)
- [ ] Metadata + fiyat
- [ ] Sandbox tester Apple ID

## Play Console checklist

- [ ] Product `crevia_main_operation_season_1`
- [ ] Fiyat aktif
- [ ] License tester e-postası

## EAS secrets checklist

```bash
eas secret:create --name EXPO_PUBLIC_REVENUECAT_IOS_API_KEY --value appl_...
eas secret:create --name EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY --value goog_...
```

- [ ] Development profile build alındı
- [ ] iOS + Android cihaza kuruldu

## iOS smoke test adımları

1. Sandbox Apple ID ile cihazda giriş
2. Pilot Gün 7 → PostPilotOfferScreen
3. Ürün yükleme (`offer_screen_loads`, `product_metadata_visible`)
4. Satın alma başlat / iptal / hata / tamamla
5. Entitlement + restart sync
6. Restore (boş hesap + mevcut satın alma)
7. Offline offer graceful error
8. Her case için observation sheet doldur

## Android smoke test adımları

1. License tester hesabı
2. Aynı case matrisi (yukarıdaki 15 case — dev-only hariç sandbox pass)
3. Platform sonuçlarını ayrı logla

## Test case matrix (15)

| ID | Sandbox pass | Blocker if fail |
|----|--------------|-----------------|
| app_open_no_key_dev_mock | No (dev only) | No |
| app_open_no_key_production_disabled | No | No |
| offer_screen_loads | Yes | Yes |
| product_metadata_visible | Yes | No |
| purchase_started | Yes | No |
| purchase_cancelled | Yes | No |
| purchase_failed | Yes | No |
| purchase_completed | Yes | **Yes** |
| entitlement_active_after_purchase | Yes | **Yes** |
| restore_no_purchase | Yes | No |
| restore_existing_purchase | Yes | **Yes** |
| restart_entitlement_sync | Yes | **Yes** |
| limited_mode_remains_playable | No | No |
| full_mode_unlock_visible | Yes | No |
| offline_offer_graceful_error | Yes | Yes/High |

## Manual result template

Her platform + case için doldurun:

| Alan | Örnek |
|------|--------|
| platform | ios / android |
| device | iPhone 14 / Pixel 6a |
| buildProfile | EAS development |
| revenueCatAppIdVisible | yes / no |
| offeringId | default |
| entitlementId | main_operation_full_access |
| productId | crevia.main_operation.season1 |
| testerAccountType | sandbox Apple ID |
| testCaseResult | passed / failed / blocked |
| screenshotPath | link veya dosya yolu |
| videoPath | link veya dosya yolu |
| logs | RC/store hata kodları |
| notes | serbest metin |
| severity | blocker / high / medium / low |

## Blocker sınıfları

- Eksik RC keys → `blocked_missing_revenuecat_keys`
- Eksik store setup → `blocked_missing_store_setup`
- Manuel sonuç yok → `blocked_manual_results_missing`
- purchase_completed / restore / entitlement sync fail → `failed_smoke_test`

## Launch candidate karar kuralları

| Durum | Karar |
|-------|--------|
| Keys + store + iOS/Android sandbox pass loglandı | `passed_sandbox_smoke` (playtest de gerekli) |
| Sadece dev mock pass | Launch candidate **ready değil** |
| iOS veya Android eksik | Platform BLOCKER/WARN |
| Real device playtest pending | Launch candidate **BLOCKED** kalır |

## Verify

```bash
npm run verify:iap-sandbox-smoke-execution
npm run verify:iap-sandbox-readiness
npm run verify:iap-integration
npm run verify:soft-launch-review
```
