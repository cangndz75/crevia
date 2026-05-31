# Crevia — IAP Sandbox QA & Native Setup

## Amaç

IAP **kod entegrasyonu** (Aşama 2) tamamlandı; **sandbox “bitti”** sayılmaz ta ki store dashboard, native capability ve cihaz testleri doğrulanana kadar. Bu doküman ve `npm run verify:iap-sandbox-qa` eksikleri tek raporda toplar.

## Current state

| Katman | Durum |
|--------|--------|
| Kod (adapter, runtime, UI) | Hazır — `verify:iap-integration` |
| Env public keys | Genelde **pending** |
| App Store / Play ürünleri | **Manuel pending** |
| RevenueCat dashboard | **Manuel pending** |
| EAS dev build + sandbox test | **Manuel pending** |

**Expo Go:** Gerçek `react-native-purchases` native modülü için **development build** gerekir. Expo Go yalnızca preview/mock; gerçek satın alma test edilemez.

## RevenueCat setup checklist

- [ ] Proje oluşturuldu
- [ ] iOS uygulama + `appl_*` public SDK key
- [ ] Android uygulama + `goog_*` public SDK key
- [ ] Entitlement: `main_operation_full_access`
- [ ] iOS ürün: `crevia.main_operation.season1` bağlı
- [ ] Android ürün: `crevia_main_operation_season_1` bağlı
- [ ] Default offering + package (`main_operation_season_1` eşlemesi)
- [ ] Sandbox satın alma sonrası CustomerInfo’da entitlement active

## App Store Connect checklist

- [ ] Product ID: `crevia.main_operation.season1`
- [ ] Type: **Non-consumable** (one-time unlock)
- [ ] Metadata / yerelleştirme
- [ ] Price tier
- [ ] Agreements — sandbox için uygun durum
- [ ] Sandbox tester Apple ID cihazda

## Play Console checklist

- [ ] Product ID: `crevia_main_operation_season_1`
- [ ] One-time / managed product (**subscription değil**)
- [ ] Fiyat aktif
- [ ] License tester e-postası
- [ ] Gerekirse internal testing track + build yüklü

## Native capability checklist

- [ ] **iOS:** In-App Purchase capability (Xcode, prebuild sonrası)
- [ ] **iOS:** Deployment target ≥ **13.4**
- [ ] **Android:** `minSdkVersion` ≥ **23**
- [ ] **Android:** `com.android.vending.BILLING` (`AndroidManifest.xml`, prebuild sonrası)
- [ ] **EAS development build** oluşturuldu ve cihaza kuruldu

## EAS development build checklist

```bash
# Örnek — profiller projenize göre uyarlayın
eas build --profile development --platform ios
eas build --profile development --platform android
```

- [ ] `.env` veya EAS secrets: `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY`
- [ ] **Secret key (`sk_`, `rcsk_`) asla client’a konmaz**
- [ ] Build kuruldu; uygulama açılıyor
- [ ] Post-pilot offer açılıyor; crash yok

## iOS sandbox test flow

1. Pilot Gün 7 tamamla → Ana Operasyon teklif ekranı
2. Sandbox Apple ID ile giriş
3. **Ana Operasyonu Aç** → Store sheet
4. Satın almayı tamamla veya iptal et (iptal = sakin mesaj, korkutucu hata yok)
5. Tamamlanınca: full erişim, hub, `main_operation_full`
6. Analytics: `iap_purchase_started` / `completed` (no-op tracker, schema valid)

## Android sandbox / internal test flow

1. License tester hesabı Play’de tanımlı
2. Internal track build yüklü (gerekirse)
3. Aynı offer → satın alma / iptal senaryoları
4. `getOfferings` boşsa RevenueCat offering kontrol et

## Restore smoke test

1. Satın alma tamamlanmış hesap
2. Uygulamayı kaldır / temiz kurulum (veya ikinci cihaz)
3. Teklif ekranında **Erişimi Geri Yükle** (yalnızca kullanıcı aksiyonu)
4. Restored → full erişim; not_found → dostane kopya
5. Mount’ta **otomatik restore yok** (`getActiveIapEntitlements` sync ayrı)

## Mock fallback smoke test

- Key yok + `__DEV__` → mock satın alma full açar
- **Sınırlı Gündemle Devam Et** hâlâ çalışır
- Production key yok → disabled, crash yok

## Troubleshooting

| Belirti | Olası neden | Çözüm |
|---------|-------------|--------|
| getOfferings empty | RC offering/package yok | Dashboard offering + product bağla |
| Entitlement inactive | Product id uyuşmazlığı | iOS/Android id’leri RC ile eşle |
| restore not_found | Hesapta satın alma yok | Sandbox hesabı / aynı store ID |
| Expo Go hata | Native modül yok | EAS dev build kullan |
| BILLING missing | Prebuild yapılmadı | `expo prebuild` + manifest kontrol |
| iOS capability missing | Xcode IAP kapalı | Capability aç, yeniden build |
| Wrong key | Secret veya yanlış platform key | `appl_` / `goog_` public key |
| Secret in .env | `sk_` client’ta | BLOCKER — kaldır, rotate |

## Go / no-go

| Aşama | Kriter |
|-------|--------|
| Kod merge | `verify:iap-integration` PASS |
| Sandbox QA hazır | `verify:iap-sandbox-qa` WARN, 0 FAIL/BLOCKED |
| Manuel sandbox | iOS + Android purchase + restore PASS |
| Public launch | Store canlı + fiyat + soft launch audit |

## Rollback

1. Env key’leri kaldır → runtime `mock`/`disabled`
2. Offer ekranı dev mock ile çalışır
3. `react-native-purchases` dependency kaldırmak için adapter revert + yeniden build

İlgili: [crevia-iap-integration.md](./crevia-iap-integration.md), [crevia-iap-product-design.md](./crevia-iap-product-design.md)
