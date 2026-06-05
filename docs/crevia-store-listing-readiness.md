# Crevia Store Listing / Privacy Readiness (Soft Launch)

## Amaç

App Store ve Play Store soft launch hazırlığı için **listing metinleri**, **görsel asset checklist**, **privacy/data safety matrix** ve **yaş derecelendirme** rehberi. Bu doküman otomatik audit ile doğrulanır; gerçek store dashboard işlemi bu patch kapsamında yapılmaz.

```bash
npm run verify:store-listing-readiness
```

İlgili: `docs/crevia-soft-launch-readiness-review.md`, `docs/crevia-iap-sandbox-smoke-execution.md`, `docs/crevia-real-device-playtest-round-1.md`

## Ön koşullar

- [ ] Real Device Playtest Round 1 (ayrı)
- [ ] IAP sandbox smoke execution (ayrı)
- [ ] EAS development build
- [ ] RevenueCat + store product setup (pending)
- [ ] **Gerçek privacy policy URL** (şu an placeholder — launch_candidate BLOCKER)

## A. App metadata checklist

| Alan | Durum | Not |
|------|-------|-----|
| App name | Draft | Crevia |
| Subtitle / short description | Draft | TR + EN aşağıda |
| Full description | Draft | TR + EN aşağıda |
| Keywords / tags | Draft | simulation, operasyon |
| Category | Draft | Games / Simulation |
| Support URL | Pending | Placeholder |
| Marketing URL | N/A | Opsiyonel |
| Privacy policy URL | **Pending placeholder** | launch_candidate blocker |
| Contact email | Pending | support@PENDING_PLACEHOLDER |

## B. Visual assets checklist

| Asset | iOS | Android | Durum |
|-------|-----|---------|-------|
| App icon | ✓ | ✓ | Draft (`assets/images/icon.png`) |
| Phone screenshots | ✓ | ✓ | Pending (8 screen matrix) |
| Feature graphic | — | ✓ | Pending |
| Promo graphic | — | Opsiyonel | N/A |
| Tablet screenshots | Opsiyonel | Opsiyonel | N/A |
| Dil politikası | TR birincil | TR birincil | EN ikinci locale |

## C. IAP metadata checklist

| Alan | Değer | Durum |
|------|-------|-------|
| iOS product id | `crevia.main_operation.season1` | Pending (dashboard) |
| Android product id | `crevia_main_operation_season_1` | Pending |
| Display name | Ana Operasyon — Tam Erişim | Draft |
| Description | Tek seferlik unlock | Draft |
| Price tier | — | Pending |
| Tip | Non-subscription / non-consumable | Draft |
| RC offering | `default` | Pending |
| RC entitlement | `main_operation_full_access` | Pending |

## D. Privacy / data safety matrix

| Veri tipi | Amaç | Kullanıcıya bağlı | İzleme | Not |
|-----------|------|-------------------|--------|-----|
| Analytics (yapılandırılmış) | Ürün iyileştirme | Hayır | Hayır | Ham metin/kopya **toplanmaz** |
| Satın alma / entitlement | Tam erişim | Store bağımlı | Hayır | Apple/Google + RevenueCat |
| Crash logları | Kararlılık | Pending | Hayır | SDK henüz yok → WARN |
| Kullanıcı hesabı | — | Hayır | Hayır | Login yok; yerel kayıt |
| Ham metin / save dump | **Toplanmaz** | Hayır | Hayır | Açıkça hariç |

**Kurallar:**
- Raw event copy, raw user text, save dump toplanmıyor.
- Analytics payload structured ve privacy-safe.
- Purchase data store + RevenueCat üzerinden işlenir.
- Crash SDK yoksa formlarda pending/WARN işaretle.
- Privacy policy URL yoksa → `launch_candidate` BLOCKER.

## E. Age rating / content rating

| Soru | Cevap |
|------|-------|
| Şiddet / kumar / tıbbi / yetişkin içerik | Hayır |
| Uygulama içi satın alma | Evet (tek seferlik) |
| Kategori | Simülasyon oyunu |
| Kullanıcı içeriği (UGC) | Hayır |
| Reklam | Hayır |
| ATT | Hayır (tracking SDK yok) |

## F. Build / compliance

| Alan | Durum |
|------|-------|
| EAS build profile | Pending (`eas.json` repo dışı) |
| Bundle id / package name | Pending |
| Version | 1.0.0 (app.json) |
| iOS Privacy Manifest | Pending |
| Android Data safety form | Pending |
| iOS export compliance | Pending |

---

## Draft store copy

### App name

**Crevia**

### Short description TR

Crevia, kurgusal bir mahallede günlük operasyon kararlarını yönettiğin tek oyunculu bir simülasyon oyunudur. Pilot haftayı tamamla, olayları incele ve gün sonu raporunu oku.

### Short description EN

Crevia is a single-player simulation game where you manage daily operational decisions in a fictional neighborhood. Complete the pilot week, inspect events, and read end-of-day reports.

### Full description TR

Crevia **kurgusal bir mahalle simülasyon oyunudur** — resmi kurum entegrasyonu veya canlı konum servisi kullanmaz.

Pilot haftada (Gün 1–7) günlük planını yap, olayları incele, saha kararlarını ver ve gün sonu raporunu oku. Gün 8 sonrası açık uçlu operasyon modunda mahalle sistemlerini takip edebilirsin.

**Özellikler:**
- Günlük plan ve olay inceleme akışı
- Saha / yönlendirme ve harita üzerinden mahalle görünümü
- Kaynak ve kriz kararları
- Gün sonu rapor ve kariyer özeti
- İsteğe bağlı tek seferlik uygulama içi satın alma ile Ana Operasyon tam erişimi

Bu oyun eğitim ve eğlence amaçlıdır; finansal kazanç veya kamu kurumu işlemi vaadi içermez.

### Full description EN

Crevia is a **fictional neighborhood simulation game** — no official agency integrations or live location services.

During the pilot week (Days 1–7), plan your day, inspect events, make field decisions, and read end-of-day reports. After Day 8, continue in open-ended operation mode.

**Features:**
- Daily planning and event inspection
- Field dispatch and map-based district view
- Resource and crisis decisions
- End-of-day report and career summary
- Optional one-time in-app purchase for full Main Operation access

Entertainment product only — no financial reward or public-sector operation claims.

### Feature bullets

1. Tek oyunculu mahalle operasyon simülasyonu
2. Günlük plan → olay → saha → sonuç döngüsü
3. Harita ve mahalle istihbarat şeridi
4. Gün sonu rapor ve kariyer vitrini
5. İsteğe bağlı Ana Operasyon IAP (abonelik değil)

### IAP product description (draft)

Ana Operasyon tam erişimi — tek seferlik, abonelik değil. Pilot hafta sonrası açık uçlu operasyon modunu açar. Fiyat store panelinde belirlenecek.

### Privacy summary (draft)

Yapılandırılmış analitik olayları toplanabilir; ham kullanıcı metni veya kayıt dökümü toplanmaz. Satın alma Apple/Google ve RevenueCat üzerinden işlenir.

### Support / contact (placeholder)

- E-posta: `support@PENDING_PLACEHOLDER.crevia.app`
- Destek URL: `https://PENDING_PLACEHOLDER.crevia.app/support`
- Gizlilik: `https://PENDING_PLACEHOLDER.crevia.app/privacy`

---

## Screenshot checklist (8 screens)

| # | Screen | Purpose | Required state | Overlay | Risk |
|---|--------|---------|----------------|---------|------|
| 1 | Hub / Merkez | Ana merkez | Gün 2+ hub | Evet | Resmi kurum iddiası yok |
| 2 | Event inspect/plan | Olay akışı | İncele/Planla fazı | Evet | Abartılı vaat yok |
| 3 | Dispatch / route | Yönlendirme | Aktif rota şeridi | Evet | GPS iddiası yok |
| 4 | Map intelligence | Harita | MapScreen overlay | Evet | Canlı veri iddiası yok |
| 5 | Operation result | Sonuç | Result ekranı | Evet | Kesin sonuç vaadi yok |
| 6 | End-of-day report | Rapor | Gün 3+ rapor | Evet | Pilot Gün 7 CTA dikkat |
| 7 | Profile / career | Kariyer | ProfileScreen | Evet | Gerçek sertifika iddiası yok |
| 8 | Post-pilot offer | IAP önizleme | PostPilotOfferScreen | **Hayır** | Fiyat store'dan; abonelik değil |

**Device size:** 6.7" iPhone + phone Android (TR set öncelikli)

**Status:** Tümü `pending` — manuel capture gerekli.

---

## Copy kuralları (yasak iddialar)

Aşağıdakiler store metinlerinde **kullanılmaz**:

- Gerçek belediye verisi
- Canlı GPS / gerçek zamanlı şehir yönetimi
- Resmi belediye uygulaması
- Gerçek para kazanma
- Kesin sonuç garantisi

Otomatik tarama: `scanStoreCopyForFalseClaims()` — draft metinler geçer.

---

## Launch candidate karar kuralları

| Durum | launch_candidate | soft_launch_candidate | internal_device_test |
|-------|------------------|----------------------|----------------------|
| Privacy URL placeholder | BLOCKER | WARN | WARN |
| Screenshots pending | BLOCKER | WARN | WARN |
| Metadata draft/pending | BLOCKER | WARN | WARN |
| IAP metadata placeholder | WARN | WARN | WARN |
| Real device playtest pending | BLOCKER | — | WARN |

---

## Verify

```bash
npm run verify:store-listing-readiness
npm run verify:soft-launch-review
```
