# Crevia Store Screenshot Capture Plan

## Amaç

Crevia'nın App Store ve Play Store listelemeleri için gerekli screenshot ve görsel asset'leri sistematik olarak yakalamak. Bu doküman hangi ekranların, hangi state ile, hangi cihaz profillerinde yakalanacağını tanımlar.

**Durum:** Bu plan Aşama 1'dir — gerçek screenshot henüz çekilmedi, görsel dosya üretilmedi, store'a upload yapılmadı.

---

## Screenshot Capture Checklist (8 Ekran)

### 1. Hub / Merkez
- **Amaç:** Ana operasyon merkezi ve günlük plan girişi
- **Target Day:** Day 4 veya Day 8+
- **State:** Hub open-ended card görünür; carry-over duplicate yok; kalabalık crisis/devtools state yok
- **Zorunlu kartlar:** daily_plan_card, hub_open_ended_card
- **Yasak kartlar:** devtools_panel, crisis_overload_overlay
- **Overlay:** İzin var — "Mahalle operasyon merkezi"
- **Risk:** Resmi belediye logosu veya kurum iddiası kullanma

### 2. Event Inspect + Plan
- **Amaç:** Olay inceleme ve planlama fazı
- **Target Day:** Day 3+
- **State:** İncele/Planla akışı net; CTA görünür; metin taşması yok; decision card premium görünür
- **Zorunlu kartlar:** event_detail_card, decision_cta
- **Yasak kartlar:** devtools_panel
- **Overlay:** İzin var — "Olay inceleme ve planlama"
- **Risk:** Abartılı sonuç vaadi overlay ekleme

### 3. Dispatch / Active Route
- **Amaç:** Yönlendirme ve aktif rota önizlemesi
- **Target Day:** Day 3+
- **State:** Ekip/araç seçimi görünür; active route strip görünür; GPS/canlı takip iddiası yok
- **Zorunlu kartlar:** dispatch_team_selection, active_route_strip
- **Yasak kartlar:** gps_navigation_overlay
- **Overlay:** İzin var — "Saha yönlendirme"
- **Risk:** GPS / canlı navigasyon iddiası yok — simülasyon olduğunu belirt

### 4. Map District Intelligence
- **Amaç:** Harita ve mahalle istihbarat şeridi
- **Target Day:** Day 4+
- **State:** Seçili mahalle; trust/memory/operation intelligence makul yoğunlukta; route accent olabilir; crisis overlay varsa sade
- **Zorunlu kartlar:** map_district_overlay, intelligence_strip
- **Yasak kartlar:** real_map_data_overlay
- **Overlay:** İzin var — "Mahalle istihbarat haritası"
- **Risk:** Gerçek harita verisi veya canlı trafik iddiası yok

### 5. Operation Result
- **Amaç:** Olay sonucu ve sistem yankısı
- **Target Day:** Day 3+
- **State:** Result hero görünür; systems echo strip; map before/after impact; tomorrow/carry-over hint
- **Zorunlu kartlar:** result_hero_card, systems_echo_strip
- **Yasak kartlar:** devtools_panel
- **Overlay:** İzin var — "Operasyon sonucu"
- **Risk:** Kesin sonuç / garanti vaadi yok

### 6. End-of-Day Report
- **Amaç:** Gün sonu rapor özeti
- **Target Day:** Day 3+
- **State:** Report hero; systems integration card; tomorrow preview; advisor comment; scroll overflow dikkat
- **Zorunlu kartlar:** report_hero, systems_integration_card, tomorrow_preview
- **Yasak kartlar:** devtools_panel
- **Overlay:** İzin var — "Gün sonu raporu"
- **Risk:** Çok uzun scroll başlangıcı — üst kısmı temiz yakala

### 7. Profile / Career
- **Amaç:** Kariyer vitrini ve yetki rozeti
- **Target Day:** Day 4+
- **State:** Authority card; career showcase; badge showcase; next unlock / permission chip
- **Zorunlu kartlar:** authority_card, career_showcase, badge_section
- **Yasak kartlar:** devtools_panel
- **Overlay:** İzin var — "Kariyer vitrini"
- **Risk:** Gerçek meslek sertifikası iddiası yok

### 8. Post-Pilot Offer / Main Operation Preview
- **Amaç:** Pilot sonrası teklif ve tam operasyon önizlemesi
- **Target Day:** Day 8+
- **State:** Değer önerisi görünür; baskıcı paywall dili yok; IAP fiyatı gerçek olmalı
- **Zorunlu kartlar:** post_pilot_value_card
- **Yasak kartlar:** placeholder_price_tag, aggressive_paywall_cta
- **Overlay:** İZİN YOK
- **Risk:** IAP fiyatı store'dan gelmeli; placeholder varsa screenshot rejected. Paywall baskısı yok.

---

## Cihaz Profilleri

| ID | Cihaz | Platform | Kategori | Store Boyutu |
|----|-------|----------|----------|--------------|
| ios_small_phone | iPhone SE / 8 (4.7") | iOS | small_phone | Manuel onay bekliyor |
| ios_large_phone | iPhone 15/16 Pro Max (6.7") | iOS | large_phone | Manuel onay bekliyor |
| android_small_phone | Android compact (~5.4–5.8") | Android | small_phone | Manuel onay bekliyor |
| android_medium_phone | Android standard (~6.1–6.5") | Android | medium_phone | Manuel onay bekliyor |
| android_low_mid_device | Android low-mid (~5.5–6.0") | Android | low_mid_device | Manuel onay bekliyor |
| tablet_optional | iPad / Android tablet | iOS | tablet | Manuel onay bekliyor |

**Not:** Gerçek App Store / Play Store screenshot boyutları hardcode edilmemiştir. Boyutlar store console'dan manuel olarak doğrulanmalıdır.

---

## Overlay Copy Politikası

- Her screenshot için overlay copy izni ayrı belirtilmiştir.
- Post-pilot offer ekranında overlay YASAKTIR.
- Tüm overlay metinleri false claim taramasından geçmelidir.
- Overlay'de şu ifadeler YASAKTIR:
  - Resmi belediye uygulaması / official municipality
  - Gerçek şehir verisi / canlı GPS / gerçek zamanlı konum
  - Para kazan / garantili sonuç / premium ile kazan
  - Satın almazsan oynayamazsın / zorunlu satın alma
  - Sezon finali / oyun sonu / 14 gün bitti

---

## False Claim Guard

Screenshot copy scanner şu kontrolleri yapar:

1. **False claim:** Resmi kurum, gerçek veri, kesin sonuç iddiaları
2. **Paywall baskısı:** Zorunlu satın alma, son şans, kaçırma dili
3. **GPS/konum iddiası:** Canlı GPS, gerçek zamanlı navigasyon
4. **Resmi kurum iddiası:** Resmi belediye, official municipality
5. **Eski sezon dili:** Sezon finali, 14 gün bitti, oyun sonu
6. **Ham gizlilik iddiası:** Raw privacy/data claim

---

## Screenshot Kabul Kriterleri

Bir screenshot **kabul edilir** eğer:
- Doğru state'te, doğru cihaz profilinde yakalanmışsa
- Zorunlu kartlar görünürse
- Yasak kartlar görünmüyorsa
- Overlay copy false claim taramasını geçmişse
- Metin taşması, kırpılma veya layout overflow yoksa
- IAP fiyatı (post-pilot) gerçek store fiyatı ise veya ekran yoksa

Bir screenshot **reddedilir** eğer:
- Yanlış state'te yakalanmışsa
- Yasak kart görünüyorsa
- False claim veya paywall baskısı overlay'de varsa
- Placeholder fiyat gösteriliyorsa (post-pilot)
- Layout taşması veya UI hatası varsa

---

## Re-Capture Kriterleri

Screenshot yeniden yakalanmalıdır eğer:
- UI redesign sonrası görünüm değişmişse
- Copy/overlay metni değişmişse
- Yeni false claim pattern eklenmiş ve mevcut overlay ihlal ediyorsa
- Cihaz profili değişmişse
- Store screenshot boyut gereksinimleri değişmişse

---

## Asset Checklist

| Asset | Platform | Durum | Blocker |
|-------|----------|-------|---------|
| App icon (1024×1024 master) | Both | Pending | Evet |
| Adaptive Android icon | Android | Pending | Evet |
| iOS icon source | iOS | Pending | Evet |
| Play Store feature graphic (1024×500) | Android | Pending | Evet |
| App Store screenshots | iOS | Pending | Evet |
| Play Store screenshots | Android | Pending | Evet |
| Optional promo graphic | Android | N/A | Hayır |
| Optional tablet screenshots | Both | N/A | Hayır |
| Screenshot state docs | Both | Pending | Hayır |
| Asset export folder | Both | Pending | Hayır |

---

## Manuel Checklist

- [ ] Tüm 8 ekran için doğru game state'e ulaş
- [ ] iOS large phone (6.7") ve Android medium phone'da yakala
- [ ] Her screenshot'ta zorunlu kartların görünürlüğünü kontrol et
- [ ] Yasak kartların görünmediğini doğrula
- [ ] Overlay copy'yi false claim guard'dan geçir
- [ ] Post-pilot ekranında IAP fiyatının gerçek olduğunu doğrula
- [ ] App icon 1024×1024 master hazırla
- [ ] Feature graphic 1024×500 hazırla
- [ ] Store console'da screenshot boyutlarını doğrula
- [ ] Tüm asset'leri export folder'a yerleştir

---

## Capture State Adımları

1. Temiz save ile oyunu başlat
2. Pilot haftayı Day 4+ veya Day 8+'a kadar oyna
3. Her ekran için belirlenen state'e ulaş
4. Screenshot'ı doğru cihaz profilinde yakala
5. False claim guard'ı çalıştır
6. Kabul kriterlerini kontrol et
7. Geçenleri "captured", kalmayanları "needs_recapture" olarak işaretle

---

*Bu doküman Aşama 1'dir. Gerçek screenshot'lar çekildiğinde güncellenecektir.*
