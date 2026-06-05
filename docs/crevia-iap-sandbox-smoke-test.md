# Crevia — IAP Sandbox Smoke Test & Manual Store Setup

## Amaç

Gerçek **App Store Connect**, **Play Console** ve **RevenueCat** dashboard işlemlerini kod dışında yaparken; EAS development build üzerinde sandbox smoke testini adım adım yürütmek. Otomatik doğrulama: `npm run verify:iap-sandbox-readiness`.

**Bu doküman gerçek API key veya store secret içermez.** Değerleri yalnızca `.env` / EAS secrets içinde tutun.

## Kimlikler (kod sabitleri)

| Alan | Değer |
|------|--------|
| Entitlement | `main_operation_full_access` |
| RevenueCat offering | `default` |
| RC package / product id | `main_operation_season_1` |
| iOS App Store product id | `crevia.main_operation.season1` |
| Android Play product id | `crevia_main_operation_season_1` |
| iOS env key | `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY` (`appl_*`) |
| Android env key | `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY` (`goog_*`) |

## RevenueCat dashboard setup

1. [RevenueCat](https://app.revenuecat.com) projesi oluştur.
2. iOS uygulaması ekle → **public** SDK key (`appl_*`) al.
3. Android uygulaması ekle → **public** SDK key (`goog_*`) al.
4. **Entitlements** → `main_operation_full_access` oluştur.
5. **Products** → iOS ve Android store ürünlerini bağla (aşağıdaki store adımlarından sonra).
6. **Offerings** → `default` offering içinde package (`main_operation_season_1`) ekle.
7. Sandbox satın alma sonrası CustomerInfo'da entitlement **active** olduğunu doğrula.

## App Store Connect IAP setup

1. Uygulama → **In-App Purchases** → yeni ürün.
2. Product ID: `crevia.main_operation.season1`
3. Tip: **Non-consumable** (tek seferlik unlock).
4. Yerelleştirme, ekran görüntüsü (gerekirse), fiyat katmanı.
5. Paid Applications sözleşmesi / banka bilgileri sandbox için uygun durumda.
6. **Sandbox Tester** Apple ID oluştur; test cihazında App Store'da sandbox hesabıyla giriş yap.

## Play Console product setup

1. Monetize → **Products** → one-time / managed product (**abonelik değil**).
2. Product ID: `crevia_main_operation_season_1`
3. Fiyatı aktif et.
4. **License testers** listesine test Gmail ekle.
5. Gerekirse internal testing track'e EAS build yükle.

## RevenueCat product mapping

| Platform | Store product id | RC entitlement |
|----------|------------------|----------------|
| iOS | `crevia.main_operation.season1` | `main_operation_full_access` |
| Android | `crevia_main_operation_season_1` | `main_operation_full_access` |

Package identifier kodda `main_operation_season_1` ile eşlenir (`revenueCatIapAdapter`).

## EAS development build

Expo Go gerçek `react-native-purchases` native modülünü çalıştırmaz. Sandbox test için **development build** şart.

```bash
# Örnek — eas.json profillerinize göre uyarlayın
eas build --profile development --platform ios
eas build --profile development --platform android
```

- EAS secrets veya `.env`: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- **Asla** secret key (`sk_`, `rcsk_`) client'a koymayın.
- Build'i cihaza kur; uygulama açılıyor mu kontrol et.

## iOS sandbox tester

- App Store Connect → Users and Access → Sandbox → tester oluştur.
- Cihazda Settings → App Store → Sandbox Account.
- Test sırasında store sheet bu hesapla açılmalı.

## Android license tester

- Play Console → Setup → License testing → tester e-postaları.
- Test cihazı aynı Google hesabıyla oturum açmış olmalı.

## Sandbox smoke test matrix

| # | Test | Platform | Beklenen sonuç | Otomatik |
|---|------|----------|----------------|----------|
| 1 | App opens with no RevenueCat key in dev | Dev | Mock path; crash yok | Evet |
| 2 | App opens with no RC key (production-safe) | Both | Purchase disabled; sakin mesaj | Evet |
| 3 | Offer screen loads product | Both | Ürün/fiyat veya fallback; crash yok | Manuel |
| 4 | Purchase started | Both | Store sheet; `iap_purchase_started` | Manuel |
| 5 | Purchase cancelled | Both | İptal mesajı; limited mode korunur | Manuel |
| 6 | Purchase failed | Both | Kontrollü hata; retry mümkün | Manuel |
| 7 | Purchase completed | Both | `mainOperationAccess=full` | Manuel |
| 8 | Entitlement active after purchase | Both | `main_operation_full_access` active | Manuel |
| 9 | Restore no purchase | Both | not_found copy; limited unchanged | Manuel |
| 10 | Restore existing purchase | Both | Full access geri gelir | Manuel |
| 11 | App restart entitlement sync | Both | Full mode kalıcı (bootstrap) | Manuel |
| 12 | Limited mode remains playable | Both | Gün 8+ sınırlı akış oynanabilir | Evet |
| 13 | Full mode unlock visible | Both | Hub'da full operasyon ipuçları | Manuel |
| 14 | Offline purchase graceful error | Both | Crash yok; ağ dönünce retry | Manuel |

## Test senaryoları (kısa akış)

### Satın alma

1. Pilot Gün 7 → PostPilotOfferScreen.
2. **Ana Operasyonu Aç** (yalnızca kullanıcı CTA — otomatik purchase yok).
3. Store sheet → tamamla / iptal / hata simüle et.
4. Hub'a dön; erişim durumunu kontrol et.

### Restore

1. **Erişimi Geri Yükle** (yalnızca CTA — mount'ta auto-restore yok).
2. Satın alma yoksa: sakin not_found mesajı.
3. Önceki satın alma varsa: full erişim.

### Entitlement sync

1. Satın alma sonrası uygulamayı kapat-aç.
2. `getCustomerInfo` bootstrap ile full mode korunmalı.
3. Otomatik `restorePurchases()` çağrısı olmamalı.

## Hata durumunda loglanacak bilgiler

- `iapRuntimeConfig` mode: `mock` | `revenuecat` | `disabled`
- Platform OS ve hangi env key set
- RevenueCat `getOfferings` / `purchasePackage` hata kodu (ham exception UI'da gösterilmez)
- Analytics: `iap_purchase_started`, `iap_purchase_completed`, `iap_purchase_failed`, `iap_restore_completed`, `iap_restore_not_found`
- CustomerInfo entitlement listesi (`main_operation_full_access` active mi)
- Store result band: `completed` | `cancelled` | `failed`

## İlgili dokümanlar

- `docs/crevia-iap-integration.md` — kod entegrasyonu
- `docs/crevia-iap-sandbox-qa.md` — geniş QA checklist
- `docs/crevia-soft-launch-readiness.md` — soft launch audit

## Verify komutları

```bash
npm run verify:iap-sandbox-readiness
npm run verify:iap-sandbox-qa
npm run verify:iap-integration
npm run verify:soft-launch-readiness
```
