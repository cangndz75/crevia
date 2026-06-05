# Crevia Store Metadata Finalization Pack — Aşama 1

## Amaç

App Store ve Play Store metadata alanlarını final submission'a yaklaşacak şekilde yapılandırılmış, doğrulanabilir ve risk taraması yapılmış hale getirir. Bu patch store'a gönderim yapmaz, gerçek dashboard işlemi yapmaz ve privacy URL placeholder'ı gerçekmiş gibi işaretlemez.

```bash
npm run verify:store-metadata-finalization
```

İlgili: `docs/crevia-store-listing-readiness.md`, `docs/crevia-privacy-policy-draft.md`, `docs/crevia-data-safety-draft.md`

---

## TR Metadata

### App name

**Crevia**

### Subtitle / Short description

Mahalle operasyon simülasyonu

### Short description (Play Store)

Crevia, kurgusal bir mahallede günlük operasyon kararlarını yönettiğin tek oyunculu bir simülasyon oyunudur. Rota, kaynak, sosyal güven ve konteyner ağı sistemlerini kullanarak mahalleni yönet. 7 günlük pilot sonrası ana operasyon açılır.

### Full description

Crevia kurgusal bir şehir operasyon simülasyon oyunudur — resmi kurum entegrasyonu veya canlı konum servisi kullanmaz.

Oyuncu olarak mahallelerde operasyon kararları verirsin: rota planlama, kaynak yönetimi, sosyal güven takibi, konteyner ağı düzenlemesi ve gün sonu raporlama.

**Pilot Hafta (Gün 1–7):**
- Günlük planını yap, olayları incele, saha kararlarını ver
- Kaynak ve kriz yönetimi
- Gün sonu rapor ve kariyer özeti

**Gün 8 Sonrası — Ana Operasyon:**
- Açık uçlu operasyon modunda mahalle sistemlerini takip et
- Daha fazla sistem görünürlüğü ve genişletilmiş operasyon akışı
- İsteğe bağlı tek seferlik uygulama içi satın alma ile tam erişim

**IAP Hakkında:**
Ana operasyon erişimi isteğe bağlı tek seferlik satın alma ile açılır (abonelik değil). Satın almasanız da pilot hafta deneyimi tamdır. Satın alma rekabetçi avantaj sağlamaz.

Bu oyun eğitim ve eğlence amaçlıdır; finansal kazanç veya kamu kurumu işlemi vaadi içermez.

### Feature bullets

1. Tek oyunculu şehir operasyon simülasyonu
2. Mahalle kararları: rota, kaynak, sosyal güven, konteyner ağı
3. Günlük plan → olay → saha → sonuç döngüsü
4. Harita ve mahalle istihbarat şeridi
5. Gün sonu rapor ve kariyer vitrini
6. 7 günlük pilot sonrası açık uçlu ana operasyon
7. İsteğe bağlı Ana Operasyon IAP (tek seferlik, abonelik değil)

---

## EN Metadata

### App name

**Crevia**

### Subtitle / Short description

Municipal operations simulation

### Short description (Play Store)

Crevia is a single-player municipal operations simulation game. Make district decisions across routes, resources, public trust, and container networks. Complete the 7-day pilot, then unlock the main operation.

### Full description

Crevia is a fictional municipal operations simulation game — no official agency integrations or live location services.

As a player you make operational decisions across districts: route planning, resource management, public trust tracking, container network organization, and end-of-day reporting.

**Pilot Week (Days 1–7):**
- Plan your day, inspect events, make field decisions
- Resource and crisis management
- End-of-day report and career summary

**Day 8+ — Main Operation:**
- Open-ended operation mode with expanded district systems
- Greater system visibility and extended operation flow
- Optional one-time in-app purchase for full access

**About IAP:**
Main operation access is an optional one-time purchase (not a subscription). The pilot week experience is complete without purchasing. The purchase does not provide competitive advantage.

Entertainment product only — no financial reward or public-sector operation claims.

### Feature bullets

1. Single-player municipal operations simulation
2. District decisions: routes, resources, public trust, container networks
3. Daily plan → event → field → outcome loop
4. Map and district intelligence strip
5. End-of-day report and career showcase
6. 7-day pilot followed by open-ended main operation
7. Optional Main Operation IAP (one-time, not subscription)

---

## Keywords

### TR Keywords

belediye, şehir yönetimi, simülasyon, operasyon, strateji, rota, kaynak yönetimi, mahalle, rapor, yönetim oyunu

### EN Keywords

city management, municipal simulation, strategy, operations, resource management, district, route planning, public trust, simulation game, management game

### Keyword Guard (forbidden)

Aşağıdaki terimler keyword veya store copy'de **kullanılmaz**:

- official / resmi
- government app / devlet uygulaması
- real city data / gerçek şehir verisi
- GPS tracker / gps takip
- earn money / para kazan

---

## IAP Metadata Draft

| Alan | Değer |
|------|-------|
| iOS product id | `crevia.main_operation.season1` |
| Android product id | `crevia_main_operation_season_1` |
| Display name TR | Ana Operasyon — Tam Erişim |
| Display name EN | Main Operation — Full Access |
| Description TR | Ana operasyon erişimi — pilot sonrası genişletilmiş operasyon akışı ve daha fazla sistem görünürlüğü. Tek seferlik satın alma, abonelik değil. |
| Description EN | Main operation access — expanded operation flow and greater system visibility after the pilot week. One-time purchase, not a subscription. |
| Entitlement | `main_operation_full_access` |
| Offering | `default` |
| Type | Non-consumable |
| Price tier | **pending_manual** |
| Store setup | **pending_manual** |

**IAP Copy Kuralları:**
- "Ana operasyon erişimi" — açık ve doğru
- "Pilot sonrası genişletilmiş operasyon akışı" — işlevselliği anlatır
- "Daha fazla sistem görünürlüğü" — ne kazandığını anlatır
- Pay-to-win dili **yok**
- "Satın almazsan oynayamazsın" **yok**
- "Premium ile kazan" **yok**

---

## App Review Notes Draft

### TR

Bu uygulama bir şehir operasyon simülasyon oyunudur.
- Kurum entegrasyonu veya konum servisi kullanmaz; harita kurgusaldır.
- Uygulama içi satın alma: Tek seferlik non-consumable unlock (Ana Operasyon tam erişimi).
- IAP sandbox test account: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER]
- RevenueCat entitlement: main_operation_full_access / offering: default
- Day 8+ ana operasyon testi: Pilot haftayı (7 gün) tamamlayın, ardından post-pilot offer ekranı görünür.
- Dev/mock purchase path yalnızca internal test amaçlıdır, production build'de devre dışıdır.

### EN

This app is a municipal operations simulation game.
- No agency integrations or location services; the map is fictional.
- In-app purchase: One-time non-consumable unlock (full Main Operation access).
- IAP sandbox test account: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER]
- RevenueCat entitlement: main_operation_full_access / offering: default
- Day 8+ main operation testing: Complete the pilot week (7 days), then the post-pilot offer screen appears.
- Dev/mock purchase path is internal-test only, disabled in production builds.

---

## Release Notes Draft

### TR

Crevia soft launch sürümü
- 7 günlük pilot operasyon
- Mahalle kararları, saha yönlendirme ve gün sonu raporları
- Rota, kaynak, sosyal güven ve konteyner ağı sistemleri
- Pilot sonrası ana operasyon önizlemesi

### EN

Crevia soft launch release
- 7-day pilot operation
- District decisions, field dispatch, and end-of-day reports
- Routes, resources, public trust, and container network systems
- Post-pilot main operation preview

---

## False Claim Scanner Policy

Otomatik risk scanner aşağıdaki claim'leri yakalar:

| Pattern | Dil |
|---------|-----|
| resmi belediye uygulaması | TR |
| government official | EN |
| real-time GPS / canlı GPS | TR/EN |
| live tracking / canlı takip | TR/EN |
| real city data / gerçek şehir verisi | TR/EN |
| guaranteed result / kesin sonuç | TR/EN |
| earn money / para kazan | TR/EN |
| pay to win / pay-to-win | EN |
| premium advantage / premium avantaj | TR/EN |
| no data collected / hiçbir veri toplamıyoruz | TR/EN |
| fully anonymous / tam anonim | TR/EN |
| GDPR/KVKK fully compliant | TR/EN |
| season final / sezon finali | TR/EN |
| 14 gün bitti / oyun sonu | TR |

Scanner `scanMetadataForFalseClaims()` ile çalışır. Tüm metadata metinleri (TR/EN description, feature bullets, IAP copy, review notes, release notes) taranır.

---

## Manual Console Entry Checklist

Bu repo'daki taslaklar store dashboard'a henüz girilmemiştir. Aşağıdaki adımlar manueldir:

- [ ] App Store Connect — App name, subtitle, description (TR + EN)
- [ ] App Store Connect — Keywords
- [ ] App Store Connect — Privacy policy URL (gerçek URL gerekli)
- [ ] App Store Connect — IAP product (non-consumable) oluştur
- [ ] App Store Connect — App review notes
- [ ] Play Console — Store listing (TR + EN)
- [ ] Play Console — IAP product (managed) oluştur
- [ ] Play Console — Data safety form doldur
- [ ] App icon ve screenshots yükle
- [ ] Feature graphic (Play) yükle
- [ ] Contact email ve support URL finalize et
- [ ] Copyright owner bilgisi gir
- [ ] Age/content rating questionnaire'ı tamamla

**Status:** Tümü pending — console entry bu patch kapsamında yapılmaz.

---

## Launch Candidate Karar Kuralları

| Durum | launch_candidate | soft_launch_candidate | internal_device_test |
|-------|------------------|----------------------|----------------------|
| Privacy URL placeholder | BLOCKER | WARN | WARN |
| Screenshots pending | BLOCKER | WARN | WARN |
| Console entry pending | BLOCKER | BLOCKER (unless manual confirm) | WARN |
| False claim detected | BLOCKER | BLOCKER | BLOCKER |
| Keyword forbidden hit | WARN | WARN | WARN |

---

## Verify

```bash
npm run verify:store-metadata-finalization
npm run verify:store-listing-readiness
npm run verify:privacy-policy-readiness
npm run verify:soft-launch-review
```
