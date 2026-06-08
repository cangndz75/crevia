# Crevia IAP Product Copy + Offer Screen Trust Review — Aşama 1

## 1. Amaç

IAP / Ana Operasyon erişimi / offer screen / restore purchase / store product copy dilini güvenli, şeffaf ve oyuncu güvenini artıracak şekilde hazırlamak. RevenueCat, App Store Connect veya Play Console ürünü oluşturmaz; gerçek satın alma testi yapmaz.

## 2. IAP value positioning

**TR:** Ana Operasyon erişimi pilot sonrası şehir kapsamını genişletir ve sezon akışını sürdürür. Karar başarısı veya skor garantisi vermez.

**EN:** Main Operation access expands city scope after the pilot. Not guaranteed success or score advantage.

**Satılan:** Ana Operasyon erişimi, geniş mahalle kapsamı, sezon akışı, uzun vadeli operasyon hissi.

**Satılmayan:** Pay-to-win, FOMO, başarı garantisi, gerçek para ödülü, “oyun kilitli” tonu.

## 3. TR product copy

### Product name alternatives
- Ana Operasyon Erişimi
- Crevia Ana Operasyon
- Ana Operasyon Sezon Erişimi

### Product description
- Pilot operasyon sonrası daha geniş mahalle kapsamı, ana operasyon akışı ve sezon ilerleyişine erişim sağlar.

## 4. EN product copy

### Product name alternatives
- Main Operation Access
- Crevia Main Operation
- Main Operation Season Access

### Product description
- Unlocks the broader city scope, main operation flow and season progression after the pilot.

## 5. Offer screen copy

### TR titles
- Ana Operasyon Seni Bekliyor
- Şehir Kapsamı Genişliyor
- Pilot Bitti, Ana Operasyon Başlıyor

### TR subtitle
Pilot sonrası Crevia’da daha geniş mahalle kapsamı, yeni operasyon ritmi ve uzun vadeli şehir takibi açılır.

### EN titles
- The Main Operation Awaits
- The City Scope Expands
- The Pilot Ends. The Main Operation Begins.

### EN subtitle
After the pilot, Crevia opens a broader neighborhood scope, a deeper operation rhythm and long-term city tracking.

## 6. Benefit bullets

| TR | EN |
|----|-----|
| Pilot sonrası ana operasyon akışı | Main operation flow after the pilot |
| Daha geniş mahalle kapsamı | Broader neighborhood scope |
| Şehir hafızası ve gün sonu raporlarıyla devam hissi | City memory and end-of-day continuity |
| Ece’nin daha stratejik operasyon yorumları | More strategic Ece advisor notes |
| Harita, kaynak ve sosyal nabız sinyallerinin büyüyen etkisi | Expanding map, resource and social pulse signals |

## 7. Restore / success / failed / cancelled copy

| State | TR | EN |
|-------|----|----|
| Restore CTA | Satın almanı geri yükle | Restore purchase |
| Restore helper | Daha önce yaptıysan erişimini geri yükleyebilirsin. | If you already purchased access, you can restore it. |
| Success | Ana Operasyon erişimi etkin. | Main Operation access is active. |
| Cancelled | Satın alma tamamlanmadı. | Purchase was not completed. |
| Failed | Satın alma doğrulanamadı. | Purchase could not be verified. |

## 8. Review notes

Placeholders (no fabricated values):
- `[APP_STORE_PRODUCT_ID_PENDING]`
- `[PLAY_PRODUCT_ID_PENDING]`
- `[REVENUECAT_ENTITLEMENT_PENDING]`
- `[SANDBOX_TEST_ACCOUNT_PENDING]`
- `[REVIEWER_DAY8_ACCESS_METHOD_PENDING]`

IAP unlocks Main Operation after pilot; not pay-to-win; restore available; payment via Apple/Google.

## 9. Trust checklist

- Ne alındığı açık; başarı/skor garantisi yok
- Restore görünür
- Fiyat hardcode edilmez; Product ID UI’da görünmez
- Failed/cancelled sakin ton
- Limited mode ile çelişmez
- FOMO / acele ettirme yok

## 10. Dark pattern guard

`scanIapProductCopyForFalsePressure` — kaçırma, son şans, pay-to-win, premium baskısı, başarı garantisi, resmi kurum/AI iddiası vb.

## 11. Store readiness integration

| Modül | Bağlantı |
|-------|----------|
| `iapManualSetupTracker` | `productCopyPackId`, `productCopyPackStatus`, `productCopyDocsPath` |
| `iapSandboxQa` | next steps → copy pack docs |
| `storeMetadataFinalization` | `iapProductCopyDocsPath` |
| `storeMetadataCopy` | IAP guidance aligned |
| `releaseCandidate` | IAP setup blocked |
| `manualLaunchTracker` | IAP blockers pending |

**Durum:** Copy `ready_for_dashboard_entry`; product setup, sandbox, restore **pending**.

## 12. Manual placeholders

Product ID, fiyat, entitlement, sandbox hesap ve reviewer Day 8 yöntemi placeholder — uydurulmaz.

## 13. Non-goals

- Product oluşturma / sandbox PASS fake
- IAP behavior değişikliği
- Fake evidence

## 14. Verify sonucu

```bash
npm run verify:iap-product-copy
```

## 15. Sonraki önerilen prompt

> IAP Product Copy Pack Aşama 2: App Store Connect ve Play Console’da ürünleri oluştur; RevenueCat offering’e TR/EN copy yapıştır; sandbox purchase + restore device test; evidence attach.

## 16. Çalıştırılacak komutlar

```bash
npm run typecheck
npm run verify:iap-product-copy
npm run verify:iap-integration
npm run verify:iap-sandbox-qa
npm run verify:iap-manual-setup-tracker
npm run verify:store-metadata-copy
npm run verify:store-metadata-finalization
npm run verify:privacy-policy-text
npm run verify:release-candidate
npm run verify:manual-launch-tracker
npm run verify:soft-launch-regression-cleanup
npm run verify:first-10-minutes
npm run verify:full-loop
npm run verify:full-ux-flow
```
