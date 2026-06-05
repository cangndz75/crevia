# Crevia — Privacy Policy Draft (TR / EN)

> **Önemli:** Bu belge yalnızca bir **taslaktır** ve hukuki danışmanlık yerine geçmez. Yayınlamadan önce gerçek SDK davranışı, RevenueCat ayarları, store formları ve gerekiyorsa KVKK/GDPR hukuk incelemesi ile onaylanmalıdır.

**Yayın URL (placeholder):** `https://PENDING_PLACEHOLDER.crevia.app/privacy`  
**Son güncelleme taslağı:** Soft launch hazırlık — SAVE_VERSION 23

---

## Giriş / Introduction

**TR:** Bu Gizlilik Politikası, Crevia mobil oyununun (“Uygulama”) veri uygulamalarını açıklar. Crevia, kurgusal bir mahalle operasyon **simülasyon oyunudur**; resmi bir belediye veya kamu kurumu uygulaması değildir.

**EN:** This Privacy Policy describes data practices for the Crevia mobile game (“App”). Crevia is a **simulation game** set in a fictional neighborhood; it is not an official government or municipality application.

---

## Crevia Nedir / What Crevia Is

**TR:** Crevia tek oyunculu bir şehir/mahalle operasyon simülasyonudur. Oyun içi harita ve rota görünümleri **gerçek GPS veya canlı konum takibi değildir**; kurgusal oyun durumunu temsil eder.

**EN:** Crevia is a single-player neighborhood operations simulation. In-game maps and route views are **not live GPS or real-world location tracking**; they represent fictional game state.

---

## Topladığımız Veriler / Data We Collect

Aşağıdaki veri türleri, Uygulamanın mevcut tasarımına göre **toplanabilir veya işlenebilir** (SDK entegrasyonu doğrulanmalıdır):

| Tür | Açıklama |
|-----|----------|
| Yapılandırılmış analitik olayları | Ekran/yüzey, gün, erişim modu gibi allowlist alanlar |
| Uygulama etkileşimleri | Özellik kullanımı (structured) |
| Satın alma / entitlement durumu | Tek seferlik Ana Operasyon kilidi |
| Sınırlı cihaz/uygulama teknik verileri | Oturum kapsamlı bağlam (reklam kimliği yok) |

**EN:** We may collect or process: structured analytics events, app interaction signals, purchase/entitlement status, and limited device/app technical context. **Some categories apply when IAP and analytics SDKs are enabled** — see matrices below for detail.

---

## Toplamadığımız Veriler / Data We Do Not Collect

**TR — açıkça toplanmaz:**
- Ham kullanıcı metni / serbest metin girişi
- Oyun kaydı (save) dökümü veya analytics payload’ına save gönderimi
- Kullanıcı hesabı / giriş kimliği (MVP’de hesap yok)
- Hassas veya kesin konum (GPS)
- Reklam kimliği / cross-app izleme
- Fotoğraf, video, dosya, kişiler, sağlık verisi
- Oyun içi harita **gerçek dünya konumu değildir**

**EN — explicitly not collected:** raw user free text, save dumps to analytics, account/login data (no account in MVP), precise location/GPS, advertising IDs, photos/videos/files/contacts/health data. In-game map is not real-world location.

---

## Analitik Kullanımı / Analytics

**TR:** Analitik olayları yapılandırılmış payload’larla gönderilir; olay adları ve allowlist alanlar kullanılır. **Ham olay metni veya oyuncu kopyası analytics’e eklenmez.** Gerçek analytics SDK entegrasyonu doğrulanana kadar formlarda “manuel onay gerekli” notu düşülür.

**EN:** Analytics uses structured payloads with allowlisted fields. **Raw event copy or player text is not sent.** Store forms should note manual confirmation until the production analytics SDK is verified.

---

## Satın Alma ve RevenueCat / Purchases and RevenueCat

**TR:** Uygulama içi satın almalar Apple App Store (StoreKit) veya Google Play Billing üzerinden işlenir. Ödeme kartı bilgisi uygulama tarafından işlenmez. Entitlement senkronizasyonu için **RevenueCat** üçüncü taraf işlemci olarak kullanılabilir (public SDK keys ile). Satın alma geçmişi ve ürün erişim durumu store ve RevenueCat politikalarına tabidir.

**EN:** In-app purchases are processed by Apple App Store (StoreKit) or Google Play Billing. Card data is not processed in-app. **RevenueCat** may act as a processor for entitlement sync. Purchase history and access status are subject to store and RevenueCat policies.

---

## Çökme / Tanılama Verileri / Crash and Diagnostic Data

**TR:** **Çökme raporlama SDK’sı henüz entegre değildir (pending).** Entegrasyon sonrası store formları ve bu politika güncellenmelidir. Şu an için otomatik crash log toplama beyan edilmemelidir.

**EN:** **Crash reporting SDK is not integrated yet (pending).** Update store forms and this policy after integration. Do not declare automatic crash log collection until then.

---

## Cihaz / Uygulama Teknik Verileri / Device and App Technical Data

**TR:** Uygulama, analitik veya tanılama bağlamında sınırlı teknik bilgi (ör. uygulama sürümü, erişim modu) kullanabilir. **Reklam veya cross-app izleme kimliği kullanılmaz.** ATT (App Tracking Transparency) gerektiren izleme SDK’sı yoktur.

**EN:** Limited technical context (e.g. app version, access mode) may be used for analytics/diagnostics. **No advertising or cross-app tracking identifiers.** No ATT-required tracking SDK in MVP.

---

## Verilerin Kullanımı / How Data Is Used

- Ürün iyileştirme ve kullanım anlama (analitik)
- Satın alınan içeriğe erişimi doğrulama (IAP)
- Kararlılık izleme (crash SDK sonrası)
- Destek taleplerini yanıtlama (kullanıcı e-posta ile iletişirse)

---

## Üçüncü Taraf Hizmetler / Third-Party Services

| Hizmet | Rol | Durum |
|--------|-----|-------|
| RevenueCat | Entitlement sync | Pending (keys + sandbox) |
| Apple StoreKit | iOS satın alma | Pending |
| Google Play Billing | Android satın alma | Pending |
| Analytics provider | Structured events | Pending (no-op in verify) |
| Crash reporting | Diagnostics | Not integrated |
| OpenAI / external AI | Runtime inference | **Not used** |

---

## Verilerin Paylaşımı / Data Sharing

**TR:** Veriler yalnızca uygulama işlevi için gerekli işlemcilerle paylaşılır. Ham metin veya save dump paylaşılmaz. Üçüncü taraflar kendi gizlilik politikalarına tabidir.

**EN:** Data is shared only with processors required for app functionality. No raw text or save dumps are shared.

---

## Saklama Süresi / Retention

Analitik ve satın alma verilerinin saklama süreleri ilgili sağlayıcı (analytics SDK, RevenueCat, Apple, Google) politikalarına bağlıdır. Yerel oyun kaydı cihazda kalır; uygulama kaldırılınca veya veri temizlenince silinebilir.

---

## Çocukların Gizliliği / Children's Privacy

**TR:** Crevia çocuklardan bilinçli olarak kişisel veri toplamayı hedeflemez. Yaş derecelendirmesi store formlarında belirlenir. Ebeveynler destek e-postasından iletişime geçebilir.

**EN:** Crevia does not knowingly target collection from children. Age rating is set via store forms. Parents may contact support.

---

## Haklarınız ve İletişim / Your Rights and Contact

**TR:** KVKK/GDPR kapsamındaki haklarınız için bölgenize göre başvuru yapabilirsiniz. Yerel kayıt cihazınızda saklanır; kaldırma için uygulamayı silmeniz veya cihaz verisini temizlemeniz mümkündür. Satın alma verisi için store hesabınız üzerinden işlem yapılabilir.

**EN:** You may exercise rights under applicable privacy laws in your region. Local save is on your device. Purchase data may be managed via your store account.

**İletişim / Contact (placeholder):** support@PENDING_PLACEHOLDER.crevia.app

---

## Uluslararası Erişim / International Availability

Veri işleme, sunucu konumu ve geçerli hukuk bölgenize göre değişebilir. Yayın öncesi hukuk incelemesi önerilir.

---

## Politika Değişiklikleri / Changes

Bu politika güncellenebilir. Önemli değişiklikler yayınlanan URL veya uygulama/store bildirimi ile duyurulabilir.

---

## İletişim / Contact

- **E-posta:** support@PENDING_PLACEHOLDER.crevia.app  
- **Destek URL:** https://PENDING_PLACEHOLDER.crevia.app/support  
- **Gizlilik URL (yayınlanınca):** https://PENDING_PLACEHOLDER.crevia.app/privacy
