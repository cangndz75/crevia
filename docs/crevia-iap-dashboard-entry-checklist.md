# Crevia IAP Dashboard Entry Checklist — Aşama 2

## 1. Amaç

IAP Product Copy Pack (Aşama 1) metinlerini App Store Connect, Play Console ve RevenueCat dashboard girişlerine bağlayan manuel setup checklist’i. Gerçek dashboard setup yapılmaz; product ID, fiyat, entitlement ve sandbox hesabı uydurulmaz.

**Copy pack:** `docs/crevia-iap-product-copy-trust-review.md`  
**Tracker:** `docs/crevia-revenuecat-store-manual-setup-tracker.md`

## 2. Current IAP readiness

| Alan | Durum |
|------|-------|
| IAP product copy pack | `ready_for_dashboard_entry` |
| Dashboard entry checklist | `ready_for_manual_entry` |
| RevenueCat keys | pending |
| ASC / Play products | pending |
| Sandbox purchase | pending |
| Restore test | pending |
| Public launch | blocked |
| Evidence verified | 0 |

## 3. App Store Connect checklist

| ID | Alan | Kaynak | Kanıt | Durum |
|----|------|--------|-------|-------|
| asc.product_type | Non-consumable vs subscription | Manuel karar | manual_note | pending — kod non-consumable bekler |
| asc.product_id | Product ID | `[APP_STORE_PRODUCT_ID_PENDING]` | store_console | pending |
| asc.reference_name | Reference name | Copy pack | store_console | in_progress |
| asc.product_name_tr | Display name TR | Copy pack: Ana Operasyon Erişimi | store_console | in_progress |
| asc.product_name_en | Display name EN | Copy pack: Main Operation Access | store_console | in_progress |
| asc.product_description_tr/en | Açıklama | Copy pack | store_console | in_progress |
| asc.price_tier | Fiyat | `[PRICE_TIER_PENDING]` | store_console | pending |
| asc.localization | TR + EN | Manuel | store_console | pending |
| asc.review_screenshot | Review screenshot | Manuel | screenshot | pending |
| asc.review_note | Review notes | Copy pack + placeholder doldur | manual_note | in_progress |
| asc.sandbox_tester | Sandbox Apple ID | `[SANDBOX_TEST_ACCOUNT_PENDING]` | manual_note | pending |
| asc.product_status | Cleared for sale | ASC | store_console | pending |
| asc.ready_to_submit | Ready to submit | ASC | store_console | pending |

## 4. Play Console checklist

| ID | Alan | Kaynak | Kanıt | Durum |
|----|------|--------|-------|-------|
| play.product_type | Managed product vs subscription | Manuel karar | manual_note | pending |
| play.product_id | Product ID | `[PLAY_PRODUCT_ID_PENDING]` | store_console | pending |
| play.product_name_tr/en | Başlık | Copy pack | store_console | in_progress |
| play.product_description_tr/en | Açıklama | Copy pack | store_console | in_progress |
| play.price_tier | Fiyat | `[PRICE_TIER_PENDING]` | store_console | pending |
| play.active_status | Active | Play Console | store_console | pending |
| play.country_availability | Ülke | Manuel | store_console | pending |
| play.license_tester | License tester | `[SANDBOX_TEST_ACCOUNT_PENDING]` | manual_note | pending |
| play.build_package_link | Build bağlantısı | Internal track | store_console | pending |

## 5. RevenueCat checklist

| ID | Alan | Placeholder / kaynak | Kanıt |
|----|------|---------------------|-------|
| rc.project_created | Proje + uygulamalar | Manuel | dashboard_event |
| rc.public_sdk_keys | appl_ / goog_ EAS secrets | eas_env | manual_note |
| rc.entitlement_id | Entitlement | `[REVENUECAT_ENTITLEMENT_PENDING]` | dashboard_event |
| rc.offering_id | Offering | `[REVENUECAT_OFFERING_ID_PENDING]` | dashboard_event |
| rc.package_id | Package | `[REVENUECAT_PACKAGE_ID_PENDING]` | dashboard_event |
| rc.app_store_product_attached | iOS ürün bağlantısı | store_console | screenshot |
| rc.play_product_attached | Android ürün bağlantısı | store_console | screenshot |
| rc.purchase_event_visible | Satın alma event | RC dashboard | purchase_log |
| rc.restore_event_visible | Restore event | RC dashboard | purchase_log |

## 6. Sandbox test matrix

12 test case (`sandbox.ios_purchase_success` … `sandbox.restore_no_purchase`):

- iOS: purchase success, restore, cancel, failed/network
- Android: purchase, restore/sync, cancel, failed
- Both: RC entitlement active, app state unlock, limited mode safe on cancel, restore with no purchase

Her test için: precondition, steps, expectedResult, requiredEvidence, relatedBlocker, pass/fail criteria.

**Evidence türleri:** purchase_log, store_console screenshot, RC dashboard screenshot, screen recording, manual_note.

## 7. Review notes placeholder mapping

| Placeholder | Checklist item | ready_for_review |
|-------------|----------------|------------------|
| `[APP_STORE_PRODUCT_ID_PENDING]` | asc.product_id | false |
| `[PLAY_PRODUCT_ID_PENDING]` | play.product_id | false |
| `[REVENUECAT_ENTITLEMENT_PENDING]` | rc.entitlement_id | false |
| `[SANDBOX_TEST_ACCOUNT_PENDING]` | sandbox.ios_tester | false |
| `[REVIEWER_DAY8_ACCESS_METHOD_PENDING]` | sandbox.reviewer_day8_access | false |

Placeholder kalırsa → public launch blocked.

## 8. Offer screen trust QA

| Kural | Durum |
|-------|-------|
| Fiyat store’dan geliyor | pending_manual |
| Restore görünür | pending_manual |
| Cancel/fail sakin copy | pending_manual |
| Pay-to-win yok | documented (copy pack guard) |
| FOMO yok | documented |
| Main Operation değeri net | documented |
| Limited mode tutarlı | pending_manual |
| Privacy/terms notu | documented |
| Purchase success state | pending_manual |
| Restore success state | pending_manual |

## 9. Evidence requirements

| Evidence | Kapatır | Olmadan kapanmaz |
|----------|---------|------------------|
| store_console screenshot | app_store_product_created, play_console_product_created | Ürün ID + Active/Cleared durumu |
| purchase_log | iap_sandbox_purchase_test | Gerçek sandbox transaction |
| purchase_log / dashboard_event | iap_restore_test | Restore sonrası entitlement |
| RC screenshot | revenuecat_entitlement_config | Entitlement/offering mapping |
| manual_note (placeholders dolu) | review submission | PENDING token kalmamalı |

## 10. What can close each blocker

- **revenuecat_public_keys** → EAS’te gerçek appl_/goog_ + manual_note (key değeri repo’da yok)
- **app_store_product_created** → ASC screenshot + gerçek product ID review notes’ta
- **play_console_product_created** → Play screenshot + Active status
- **iap_sandbox_purchase_test** → purchase_log + device screenshot
- **iap_restore_test** → restore purchase_log veya RC dashboard_event

## 11. What cannot close each blocker

- Verify script PASS tek başına blocker kapatmaz
- Placeholder ID repo’ya yazmak blocker kapatmaz
- `configured_unverified` sandbox PASS sayılmaz
- Mock purchase / dev-only flow production blocker kapatmaz
- Copy pack `ready_for_dashboard_entry` ≠ product created

## 12. Non-goals

- Product ID / fiyat / entitlement uydurma
- Sandbox PASS işaretleme
- Fake evidence
- Paywall behavior / IAP runtime değişikliği
- SAVE_VERSION / persist değişikliği

## 13. Verify sonucu

`npm run verify:iap-manual-setup-tracker` — dashboard checklist, matrix, placeholder guard, entegrasyon kontrolleri.

## 14. Sonraki manuel adım

1. ASC + Play’de ürün oluştur (copy pack metinlerini yapıştır)
2. RevenueCat proje + entitlement + offering yapılandır
3. EAS secrets ekle → dev build
4. Sandbox matrix’i cihazda çalıştır → evidence attach
5. Review notes placeholder’larını doldur

## 15. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:iap-manual-setup-tracker
npm run verify:iap-product-copy
npm run verify:iap-sandbox-qa
npm run verify:iap-integration
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:store-metadata-finalization
```
