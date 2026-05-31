# Crevia IAP Ürün Tasarımı

> Bu doküman gerçek ödeme entegrasyonu değildir; SDK entegrasyonu bir sonraki aşamadır (Aşama 2).

## Amaç

Post-pilot monetization gate, mock purchase ve analytics schema hazır. Gerçek StoreKit / Google Play Billing / RevenueCat bağlanmadan önce ürün modeli, entitlement, restore akışı ve adapter sözleşmesi netleştirilir.

## Launch monetization kararı

**İlk launch ürünü: tek seferlik unlock (`one_time_unlock`).**

| Alan | Değer |
| --- | --- |
| productId | `main_operation_season_1` |
| entitlementId | `main_operation_full_access` |
| iOS store id (öneri) | `crevia.main_operation.season1` |
| Android store id (öneri) | `crevia_main_operation_season_1` |
| RevenueCat entitlement (öneri) | `main_operation_full_access` |

## Neden tek seferlik unlock?

- Pilot sonrası değer önerisi net: “Ana Operasyon Paketi / Sezon 1”.
- Oyuncu tek seferlik erişim satın alır; sezon sonu değerlendirmesi dahil tam kapsam açılır.
- Mock purchase ve mevcut `ownedPacks` modeliyle uyumlu.
- Store review’da abonelik yönetimi ve iptal akışı riski yok.

## Neden subscription değil?

- Fiyatlandırma ve yenileme politikası henüz finalize değil.
- Soft-launch metrikleri önce tam operasyon değerini ölçmeli.
- Abonelik Aşama 2+ değerlendirmesine ertelendi.

## Ürün tanımı

**Başlık:** Ana Operasyon Paketi  
**Alt başlık:** Sezon 1: Şehir Yönetimi  
**Açıklama:** Pilot sonrası geniş şehir operasyonunu açar.

**Unlock maddeleri:**

- Geniş mahalle kapsamı
- Ana operasyon sezon hedefleri
- Kriz Masası ve kriz hamleleri
- Saha kaynakları ve harita sinyalleri
- Canlı operasyon kararları
- Sezon sonu değerlendirmesi

## Entitlement mapping

Aktif `main_operation_full_access` entitlement:

- `monetization.mainOperationAccess` → `full`
- `ownedPacks` → `main_operation_season_1`
- `gameState.pilot.fullMainOperationUnlocked` → `true`
- `postPilotOperation.phase` → `main_operation_full`

Aktif değil / bulunamadı:

- Mevcut erişim korunur
- `Sınırlı Gündemle Devam Et` seçimi çalışmaya devam eder

## Restore purchase flow

1. Oyuncu **Erişimi Geri Yükle** seçer.
2. SDK `restoreIapPurchases()` çağrılır (Aşama 2).
3. Sonuç:
   - **restored:** “Ana Operasyon erişimi geri yüklendi.”
   - **not_found:** “Bu hesapta aktif Ana Operasyon erişimi bulunamadı.”
   - **failed:** “Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin.”

## Purchase flow

1. **Ana Operasyonu Aç** → `iap_purchase_started` (Aşama 2) veya şimdilik `main_operation_mock_purchase_started` (dev).
2. Store onayı → entitlement aktif.
3. `syncIapEntitlementToMonetizationState` → mevcut monetization patch (shape değişmez).
4. Tamamlandı: “Ana Operasyon erişimi aktif”.

## Error / loading states

| Durum | Oyuncu metni |
| --- | --- |
| pending | Erişim kontrol ediliyor |
| failed | Erişim kontrolü tamamlanamadı. Daha sonra tekrar deneyebilirsin. |
| not_found | Bu hesapta aktif Ana Operasyon erişimi bulunamadı. |
| restored | Ana Operasyon erişimi geri yüklendi. |

## Offline / local state

- Satın alma öncesi: `offer_available` / `limited` / mock state.
- Başarılı entitlement: local monetization `full` + owned pack.
- Restore offline: son bilinen entitlement cache (SDK) + yeniden doğrulama (Aşama 2).
- Bu patch persist alanı eklemez.

## Mock purchase nasıl korunacak?

- `mockPurchaseMainOperationPack` dev/test akışında kalır.
- `buildMockEntitlementForMainOperation` IAP entitlement modelini simüle eder.
- Production’da mock yalnızca `__DEV__` guard ile görünür.

## Analytics event mapping

| Davranış | Mevcut event (şimdi) | Gerçek IAP (Aşama 2) |
| --- | --- | --- |
| Teklif açıldı | `post_pilot_offer_opened` | aynı |
| Ana CTA | `post_pilot_offer_primary_cta_pressed` | `iap_purchase_started` |
| Mock tamamlandı | `main_operation_mock_purchase_completed` | `iap_purchase_completed` |
| Sınırlı devam | `limited_continue_selected` | aynı |
| Restore | `access_restore_pressed` | `iap_restore_started` / `completed` / `not_found` |
| Ürün listesi | — | `iap_product_list_loaded` |

## Store review copy kuralları

**Kullan:**

- Ana Operasyonu Aç
- Sınırlı Gündemle Devam Et
- Erişimi Geri Yükle
- Ana Operasyon erişimi aktif

**Kullanma:**

- premium, satın al, kilitli, paywall, ödeme yap, reklamsız, zorunlu

## IAP SDK entegrasyonu — Aşama 2 planı

1. `IapAdapter` implementasyonu (RevenueCat veya native wrapper).
2. `PostPilotOfferScreen` → `purchaseIapProduct` / `restoreIapPurchases`.
3. `trackAnalyticsEvent` instrumentation (schema hazır).
4. App Store Connect + Play Console product id oluşturma.
5. Fiyatlandırma finalize + store listing.

Adapter fonksiyonları (`src/core/iap/iapAdapterContract.ts`):

- `fetchIapProducts()`
- `purchaseIapProduct(productId)`
- `restoreIapPurchases()`
- `getActiveEntitlements()`
- `syncIapEntitlementToMonetizationState(entitlement)` → store actions

## Test checklist

- [ ] Pilot Gün 7 → teklif ekranı
- [ ] Sınırlı gündem → limited access
- [ ] Mock purchase → full access
- [ ] Restore not_found / restored copy
- [ ] Analytics schema validate
- [ ] `npm run verify:iap-product-design`
- [ ] Store product id’ler console’da oluşturuldu

## Verify

```bash
npm run verify:iap-product-design
```
