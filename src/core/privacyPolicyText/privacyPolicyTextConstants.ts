import type {
  PrivacyPolicyDataSafetyItem,
  PrivacyPolicySdkDisclosureItem,
  PrivacyPolicyTextManualReviewItem,
  PrivacyPolicyTextSection,
} from './privacyPolicyTextTypes';

export const PRIVACY_POLICY_TEXT_PACK_ID = 'crevia_privacy_policy_text_v1';

export const PRIVACY_POLICY_TEXT_DOCS_PATH = 'docs/crevia-privacy-policy-data-safety-pack.md';

export const PRIVACY_POLICY_TEXT_MIN_SECTIONS = 10;

export const PRIVACY_POLICY_TEXT_PUBLISHED_URL_PLACEHOLDER =
  'https://PENDING_PLACEHOLDER.crevia.app/privacy';

export const PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED =
  'manual — verify Apple/Google privacy forms and SDK docs before submission';

export const PRIVACY_POLICY_TEXT_MANUAL_REVIEW_ITEMS: PrivacyPolicyTextManualReviewItem[] = [
  {
    id: 'apple_app_privacy',
    platform: 'apple',
    note: 'Apple App Privacy details manual check required.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'google_data_safety',
    platform: 'google',
    note: 'Google Play Data Safety manual check required.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'revenuecat_disclosure',
    platform: 'both',
    note: 'RevenueCat privacy/data disclosure must match actual SDK configuration.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'sentry_disclosure',
    platform: 'both',
    note: 'Sentry privacy/data disclosure must match actual SDK configuration.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'analytics_disclosure',
    platform: 'both',
    note: 'Analytics SDK/data disclosure must match actual SDK configuration.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'legal_review',
    platform: 'legal',
    note: 'Final privacy policy legal review required before public launch.',
    lastChecked: PRIVACY_POLICY_TEXT_OFFICIAL_DOCS_LAST_CHECKED,
  },
];

export const PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_TR =
  'Crevia; uygulama güvenilirliğini, oyun akışını ve satın alma durumunu yönetmek için çökme raporları, sınırlı kullanım sinyalleri ve satın alma/erişim durumunu işleyebilir. Kamu kurumu verisi, GPS konumu, ham kayıt dosyası veya kişisel serbest metin gönderilmez.';

export const PRIVACY_POLICY_TEXT_STORE_DISCLOSURE_EN =
  'Crevia may process crash diagnostics, limited usage signals and purchase/access status to improve reliability, gameplay flow and purchase handling. It does not send agency records, precise GPS location, raw save files or free-form personal text.';

export const PRIVACY_POLICY_TEXT_FORBIDDEN_PHRASES = [
  'yapay zeka',
  'ai powered',
  'gerçek zamanlı gps',
  'real-time gps',
  'canlı takip',
  'live tracking',
  'resmi belediye uygulaması',
  'official municipality app',
  'gerçek belediye verisi',
  'real municipality data',
  'çevrimiçi çok oyunculu',
  'online multiplayer',
  'hiçbir veri toplamıyoruz',
  'we collect no data',
  'we do not collect any data',
  'no data collected',
  'tam anonim',
  'completely anonymous',
  'kvkk/gdpr tamamen uyumlu',
  'gdpr fully compliant',
  'privacy url published',
  'data safety submitted',
  'legal review done',
  'ham kayıt sunucuya gönderilir',
  'raw save uploaded',
] as const;

export const PRIVACY_POLICY_TEXT_STORE_DATA_SAFETY_CHECKLIST = [
  'Confirm crash diagnostics row matches Sentry activation state.',
  'Confirm usage analytics row matches analytics SDK wiring.',
  'Confirm purchase/entitlement rows match RevenueCat + store billing.',
  'Mark precise location as not collected.',
  'Mark contacts, photos, microphone, health as not collected.',
  'Mark real municipality/citizen data as not collected.',
  'Mark raw save upload and free-form personal text as not collected.',
  'Complete Google Play Data Safety form manually — do not auto-submit.',
  'Complete Apple App Privacy questionnaire manually — do not auto-submit.',
  'Attach evidence only after real console entry — no fake PASS.',
] as const;

function section(
  partial: Omit<PrivacyPolicyTextSection, 'status' | 'legalReviewRequired'> & {
    legalReviewRequired?: boolean;
  },
): PrivacyPolicyTextSection {
  return {
    ...partial,
    status: 'ready_for_review',
    legalReviewRequired: partial.legalReviewRequired ?? true,
  };
}

export const PRIVACY_POLICY_TEXT_SECTIONS: PrivacyPolicyTextSection[] = [
  section({
    id: 'overview',
    titleTR: 'Giriş',
    titleEN: 'Overview',
    bodyTR: `Crevia, kurgusal bir şehir operasyon simülasyonu sunan mobil bir oyundur. Bu gizlilik politikası taslağı, Crevia uygulamasının veri işleme uygulamalarını açıklar.

Crevia resmi bir belediye veya kamu kurumu uygulaması değildir. Gerçek belediye kayıtları veya canlı konum servisleri kullanılmaz. Bu metin hukuki danışmanlık yerine geçmez; yayın öncesi hukuki inceleme gereklidir.

Yayınlanmış politika URL'si: [PRIVACY_URL_PENDING — henüz yayınlanmadı]`,
    bodyEN: `Crevia is a mobile game that offers a fictional city operations simulation. This privacy policy draft explains how the Crevia app may process data.

Crevia is not an official municipality or government application. It does not use real municipal records or live location services. This text is not legal advice; legal review is required before publication.

Published policy URL: [PRIVACY_URL_PENDING — not yet published]`,
    dataCategories: ['overview'],
    appliesTo: ['app'],
  }),
  section({
    id: 'data_collected',
    titleTR: 'Toplanabilecek veri türleri',
    titleEN: 'Data we may collect',
    bodyTR: `Crevia aşağıdaki veri kategorilerini işleyebilir:

• Cihaz ve uygulama tanılama bilgileri (sürüm, platform, oturum bağlamı)
• Çökme ve hata raporları (Sentry etkinleştirildiğinde)
• Yapılandırılmış kullanım olayları / analitik sinyaller (SDK etkinleştirildiğinde)
• Satın alma durumu ve entitlement/erişim durumu (IAP etkinleştirildiğinde)
• Mağaza işlem durumu (Apple/Google tarafından işlenir; ödeme bilgileri uygulamada tutulmaz)
• Yerel oyun ilerlemesi (cihazda saklanır)
• Destek iletişimi (yalnızca kullanıcı manuel olarak iletişime geçerse)

Hangi kategorilerin aktif olduğu SDK yapılandırmasına bağlıdır; bazıları henüz production ortamında pending olabilir.`,
    bodyEN: `Crevia may process the following data categories:

• Device and app diagnostic information (version, platform, session context)
• Crash and error reports (when Sentry is enabled)
• Structured usage events / analytics signals (when analytics SDK is enabled)
• Purchase status and entitlement/access status (when IAP is enabled)
• Store transaction status (processed by Apple/Google; payment details are not stored in the app)
• Local gameplay progress (stored on device)
• Support contact (only if the user contacts support manually)

Which categories are active depends on SDK configuration; some may still be pending in production.`,
    dataCategories: [
      'device_diagnostics',
      'crash_reports',
      'usage_analytics',
      'purchase_status',
      'entitlement_status',
      'local_save',
      'support_contact',
    ],
    appliesTo: ['app', 'sentry', 'analytics', 'revenuecat', 'store_purchase', 'local_save', 'support_contact'],
  }),
  section({
    id: 'data_not_collected',
    titleTR: 'Toplamadığımız veriler',
    titleEN: 'Data we do not collect',
    bodyTR: `Crevia şu verileri toplamaz veya telemetri olarak göndermez:

• Hassas GPS / kesin konum
• Gerçek belediye veya vatandaş kayıtları
• Ham kayıt dosyası (save dump) veya oyun içi serbest metin
• Sağlık verisi
• Kişi rehberi / contacts
• Fotoğraf, kamera veya mikrofon (şu an kullanılmıyor; gelecekte eklenirse politika güncellenir)
• Çok oyunculu sosyal hesap grafiği
• Reklam kimliği veya izleme amaçlı profilleme`,
    bodyEN: `Crevia does not collect or transmit the following as telemetry:

• Precise GPS / fine location
• Real municipality or citizen records
• Raw save files (save dumps) or in-game free-form personal text
• Health data
• Contacts / address book
• Photos, camera, or microphone (not used today; policy will be updated if added later)
• Multiplayer social account graphs
• Advertising identifiers or tracking profiles`,
    dataCategories: ['excluded'],
    appliesTo: ['app'],
  }),
  section({
    id: 'sentry_crash',
    titleTR: 'Çökme raporlama (Sentry)',
    titleEN: 'Crash reporting (Sentry)',
    bodyTR: `Crevia kod tabanında Sentry çökme raporlama entegrasyonu içerir. DSN, dashboard smoke testi ve source maps yapılandırması production öncesi pending olabilir.

Etkinleştirildiğinde Sentry; çökme ve hata tanıları, gizlilik-güvenli breadcrumb'lar (ekran, oyun fazı, kişisel olmayan kimlikler) toplayabilir. Ham kayıt JSON'u, olay metni, kişisel serbest metin veya kesin konum gönderilmez.

Sentry yapılandırması değişirse bu bölüm ve mağaza formları güncellenmelidir.`,
    bodyEN: `Crevia includes Sentry crash reporting integration in the codebase. DSN, dashboard smoke testing, and source maps configuration may remain pending before production.

When enabled, Sentry may collect crash and error diagnostics and privacy-safe breadcrumbs (screen, game phase, non-personal identifiers). Raw save JSON, event body text, free-form personal text, and precise location are not sent.

If Sentry configuration changes, this section and store forms must be updated.`,
    dataCategories: ['crash_diagnostics'],
    appliesTo: ['sentry'],
  }),
  section({
    id: 'analytics',
    titleTR: 'Analitik',
    titleEN: 'Analytics',
    bodyTR: `Crevia yapılandırılmış analitik olay şeması kullanır. SDK ve dashboard entegrasyonu production öncesi pending olabilir.

Etkinleştirildiğinde kullanım sinyalleri; onboarding, Gün 1 akışı, rapor kullanımı, harita kullanımı ve IAP teklif akışı gibi ürün iyileştirmelerine yardımcı olabilir. Kişisel serbest metin, ham kayıt veya gerçek dünya kimliği iddiası taşıyan veriler gönderilmez.`,
    bodyEN: `Crevia uses a structured analytics event schema. SDK and dashboard integration may remain pending before production.

When enabled, usage signals may help improve onboarding, Day 1 flow, report usage, map usage, and IAP offer flow. Free-form personal text, raw save data, and real-world identity claims are not transmitted.`,
    dataCategories: ['usage_analytics'],
    appliesTo: ['analytics'],
  }),
  section({
    id: 'purchases_revenuecat',
    titleTR: 'Satın almalar / RevenueCat / Mağazalar',
    titleEN: 'Purchases / RevenueCat / Stores',
    bodyTR: `Crevia isteğe bağlı uygulama içi satın alma (Ana Operasyon erişimi) sunabilir. Ödeme bilgileri Apple veya Google tarafından işlenir; Crevia doğrudan kart bilgisi tutmaz.

Satın alma ve entitlement durumu RevenueCat ve mağaza faturalandırma sistemleri üzerinden senkronize edilebilir. Ürün kimlikleri, fiyatlar ve sandbox/restore testleri mağaza kurulumu tamamlanana kadar pending kalabilir.

Satın alma olmadan pilot hafta deneyimi tamamlanabilir; satın alma rekabetçi avantaj sağlamaz.`,
    bodyEN: `Crevia may offer optional in-app purchases (Main Operation access). Payment details are processed by Apple or Google; Crevia does not directly store card information.

Purchase and entitlement status may sync via RevenueCat and store billing systems. Product IDs, prices, and sandbox/restore tests may remain pending until store setup is complete.

The pilot week can be completed without purchasing; purchases do not provide competitive advantage.`,
    dataCategories: ['purchase_status', 'entitlement_status'],
    appliesTo: ['revenuecat', 'store_purchase'],
  }),
  section({
    id: 'local_save',
    titleTR: 'Yerel kayıt / Oyun ilerlemesi',
    titleEN: 'Local save / Gameplay progress',
    bodyTR: `Oyun ilerlemesi cihazda yerel olarak saklanabilir. Bu veri oyun durumunu sürdürmek ve çevrimdışı/devam etme desteği sağlamak için kullanılır.

Ham kayıt verisi telemetri veya çökme raporu olarak sunucuya gönderilmez. Uygulama verilerini cihaz ayarlarından silmek yerel ilerlemeyi kaldırabilir.`,
    bodyEN: `Gameplay progress may be stored locally on the device. This data is used to resume game state and support offline/resume flows.

Raw save data is not sent to servers as telemetry or crash reporting. Clearing app data from device settings may remove local progress.`,
    dataCategories: ['local_gameplay_progress'],
    appliesTo: ['local_save', 'app'],
    legalReviewRequired: true,
  }),
  section({
    id: 'children_age',
    titleTR: 'Çocuklar / Yaş uygunluğu',
    titleEN: 'Children / Age suitability',
    bodyTR: `Crevia çocuklara yönelik bilinçli veri toplama ürünü olarak tasarlanmamıştır. Yaş derecelendirmesi ve mağaza yaş hedeflemesi manuel olarak doğrulanmalıdır.

Çocuklara yönelik özel iddia eklenmemelidir; ürün gerçekten çocuklara yönelik hedeflenmedikçe COPPA/çocuk odaklı beyan yapılmaz.`,
    bodyEN: `Crevia is not designed as a child-directed data collection product. Age rating and store age targeting must be confirmed manually.

Do not add child-directed claims unless the product is actually targeted and reviewed as such; no COPPA/child-focused declarations otherwise.`,
    dataCategories: ['age_rating'],
    appliesTo: ['app'],
    legalReviewRequired: true,
  }),
  section({
    id: 'data_sharing',
    titleTR: 'Veri paylaşımı',
    titleEN: 'Data sharing',
    bodyTR: `Veriler yalnızca uygulama işlevselliği için gerekli hizmet sağlayıcılar (çökme raporlama, analitik, satın alma yönetimi) aracılığıyla işlenebilir.

Kişisel veri satışı yapılmaz. Resmi belediye veya kamu kurumu ile veri paylaşımı yoktur. Üçüncü taraf işlemcilerin veri işleme şartları manuel olarak doğrulanmalıdır.`,
    bodyEN: `Data may be processed only through service providers required for app functionality (crash reporting, analytics, purchase management).

Personal data is not sold. There is no data sharing with official municipalities or government agencies. Third-party processor terms must be confirmed manually.`,
    dataCategories: ['sharing'],
    appliesTo: ['app', 'sentry', 'analytics', 'revenuecat'],
    legalReviewRequired: true,
  }),
  section({
    id: 'user_choices',
    titleTR: 'Kullanıcı seçenekleri',
    titleEN: 'Your choices',
    bodyTR: `Kullanıcılar IAP varsa Apple/Google platform ayarları üzerinden satın alma ve abonelik yönetimini kontrol edebilir.

Gizlilik soruları için destek kanalına başvurulabilir: [SUPPORT_EMAIL_PENDING — TODO]. Cihaz izinleri (varsa) cihaz ayarlarından yönetilebilir.`,
    bodyEN: `Users can manage purchases and subscriptions via Apple/Google platform settings when IAP is available.

Privacy questions may be sent to support: [SUPPORT_EMAIL_PENDING — TODO]. Device permissions (if any) can be managed in device settings.`,
    dataCategories: ['user_rights'],
    appliesTo: ['app', 'store_purchase', 'support_contact'],
  }),
  section({
    id: 'contact_support',
    titleTR: 'İletişim / Destek',
    titleEN: 'Contact / Support',
    bodyTR: `Gizlilik ile ilgili sorular için: [SUPPORT_EMAIL_PENDING — TODO]

Resmi hukuki adres veya şirket unvanı bu taslakta uydurulmaz; yayın öncesi manuel olarak eklenir.`,
    bodyEN: `For privacy questions: [SUPPORT_EMAIL_PENDING — TODO]

Official legal address or entity name is not invented in this draft; add manually before publication.`,
    dataCategories: ['contact'],
    appliesTo: ['support_contact'],
  }),
  section({
    id: 'policy_changes',
    titleTR: 'Politika değişiklikleri',
    titleEN: 'Changes to this policy',
    bodyTR: `Bu politika özellikler geliştikçe güncellenebilir. Son güncelleme tarihi yayın sırasında manuel olarak eklenir: [LAST_UPDATED_PENDING].

Önemli değişiklikler uygulama içi bildirim veya mağaza notu ile duyurulabilir.`,
    bodyEN: `This policy may be updated as features evolve. Last updated date will be added manually at publication: [LAST_UPDATED_PENDING].

Material changes may be announced via in-app notice or store release notes.`,
    dataCategories: ['policy_meta'],
    appliesTo: ['app'],
  }),
];

export const PRIVACY_POLICY_TEXT_DATA_SAFETY_MATRIX: PrivacyPolicyDataSafetyItem[] = [
  {
    category: 'Crash diagnostics',
    collected: 'conditional',
    purpose: ['crash_diagnostics', 'app_functionality'],
    linkedToUser: 'pending_manual_review',
    sharedWithThirdParties: 'service_provider_only',
    encryptedInTransit: 'platform_default',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'Sentry kod entegrasyonu var; DSN/smoke pending.',
    notesEN: 'Sentry code present; DSN/smoke pending.',
    sourceSystem: 'sentry',
  },
  {
    category: 'Usage analytics',
    collected: 'pending_manual_review',
    purpose: ['analytics'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'service_provider_only',
    encryptedInTransit: 'platform_default',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'Şema hazır; SDK/dashboard pending.',
    notesEN: 'Schema ready; SDK/dashboard pending.',
    sourceSystem: 'analytics',
  },
  {
    category: 'Purchase status',
    collected: 'conditional',
    purpose: ['purchases', 'app_functionality'],
    linkedToUser: 'pending_manual_review',
    sharedWithThirdParties: 'service_provider_only',
    encryptedInTransit: 'yes',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'Apple/Google işler; sandbox pending.',
    notesEN: 'Processed by Apple/Google; sandbox pending.',
    sourceSystem: 'store_purchase',
  },
  {
    category: 'Entitlement status',
    collected: 'conditional',
    purpose: ['purchases', 'app_functionality'],
    linkedToUser: 'pending_manual_review',
    sharedWithThirdParties: 'service_provider_only',
    encryptedInTransit: 'yes',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'RevenueCat senkronu; keys pending.',
    notesEN: 'RevenueCat sync; keys pending.',
    sourceSystem: 'revenuecat',
  },
  {
    category: 'Device/app information',
    collected: 'yes',
    purpose: ['app_functionality', 'analytics', 'crash_diagnostics'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'service_provider_only',
    encryptedInTransit: 'platform_default',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'Sürüm, platform, oturum bağlamı.',
    notesEN: 'Version, platform, session context.',
    sourceSystem: 'app',
  },
  {
    category: 'Local gameplay progress',
    collected: 'yes',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'yes',
    notesTR: 'Yalnızca cihazda; sunucuya ham dump gönderilmez.',
    notesEN: 'Device only; no raw dump to server.',
    sourceSystem: 'local_save',
  },
  {
    category: 'Support contact info',
    collected: 'conditional',
    purpose: ['support'],
    linkedToUser: 'pending_manual_review',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'platform_default',
    userCanRequestDeletion: 'support_contact',
    notesTR: 'Yalnızca kullanıcı manuel iletişim kurarsa.',
    notesEN: 'Only if user contacts support manually.',
    sourceSystem: 'support_contact',
  },
  {
    category: 'Precise location',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'GPS/kesin konum kullanılmaz.',
    notesEN: 'No GPS/precise location.',
    sourceSystem: 'app',
  },
  {
    category: 'Contacts',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Rehber erişimi yok.',
    notesEN: 'No contacts access.',
    sourceSystem: 'app',
  },
  {
    category: 'Photos/videos',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Kamera/galeri şu an kullanılmıyor.',
    notesEN: 'Camera/gallery not used currently.',
    sourceSystem: 'app',
  },
  {
    category: 'Microphone',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Mikrofon kullanılmıyor.',
    notesEN: 'Microphone not used.',
    sourceSystem: 'app',
  },
  {
    category: 'Health data',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Sağlık verisi yok.',
    notesEN: 'No health data.',
    sourceSystem: 'app',
  },
  {
    category: 'Real municipality data',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Kurgusal simülasyon; gerçek kurum verisi yok.',
    notesEN: 'Fictional simulation; no agency data.',
    sourceSystem: 'app',
  },
  {
    category: 'Real citizen data',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Gerçek vatandaş kaydı yok.',
    notesEN: 'No real citizen records.',
    sourceSystem: 'app',
  },
  {
    category: 'Free-form user content',
    collected: 'no',
    purpose: ['app_functionality'],
    linkedToUser: 'no',
    sharedWithThirdParties: 'no',
    encryptedInTransit: 'no',
    userCanRequestDeletion: 'no',
    notesTR: 'Serbest metin telemetri olarak gönderilmez.',
    notesEN: 'Free-form text not sent as telemetry.',
    sourceSystem: 'app',
  },
];

export const PRIVACY_POLICY_TEXT_SDK_DISCLOSURE_MATRIX: PrivacyPolicySdkDisclosureItem[] = [
  {
    id: 'sentry',
    name: 'Sentry',
    codeIntegration: 'present',
    envOrDashboard: 'pending',
    dataCollected: ['crash/error diagnostics', 'privacy-safe breadcrumbs'],
    prohibited: ['raw save JSON', 'event body', 'PII', 'precise location'],
    notesTR: 'DSN, dashboard smoke, source maps pending.',
    notesEN: 'DSN, dashboard smoke, source maps pending.',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    codeIntegration: 'present',
    envOrDashboard: 'pending',
    dataCollected: ['gameplay usage events', 'funnel events', 'screen/action status'],
    prohibited: ['personal text', 'raw save', 'precise location'],
    notesTR: 'Şema hazır; SDK/dashboard pending.',
    notesEN: 'Schema ready; SDK/dashboard pending.',
  },
  {
    id: 'revenuecat',
    name: 'RevenueCat / IAP',
    codeIntegration: 'present',
    envOrDashboard: 'pending',
    dataCollected: ['purchase status', 'entitlement status', 'offering status'],
    prohibited: ['payment card details', 'invented product claims'],
    notesTR: 'Keys, products, sandbox/restore pending.',
    notesEN: 'Keys, products, sandbox/restore pending.',
  },
  {
    id: 'app_stores',
    name: 'App Store / Google Play',
    codeIntegration: 'present',
    envOrDashboard: 'pending',
    dataCollected: ['store transaction status'],
    prohibited: ['direct payment storage in app'],
    notesTR: 'Ödeme platform tarafından işlenir; privacy formları pending.',
    notesEN: 'Payments handled by platform; privacy forms pending.',
  },
];
