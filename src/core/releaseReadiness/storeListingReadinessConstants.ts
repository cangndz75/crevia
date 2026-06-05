import type {
  CreviaStoreMetadataDraft,
  CreviaStorePrivacyRequirement,
  CreviaStoreScreenshotRequirement,
} from './storeListingReadinessTypes';

export const STORE_LISTING_READINESS_DOCS_PATH = 'docs/crevia-store-listing-readiness.md';

export const STORE_LISTING_MIN_SCREENSHOT_COUNT = 7;

export const STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER =
  'https://PENDING_PLACEHOLDER.crevia.app/privacy';

export const STORE_LISTING_SUPPORT_URL_PLACEHOLDER =
  'https://PENDING_PLACEHOLDER.crevia.app/support';

export const STORE_LISTING_SUPPORT_EMAIL_PLACEHOLDER = 'support@PENDING_PLACEHOLDER.crevia.app';

export const STORE_LISTING_IAP_IOS_PRODUCT_ID = 'crevia.main_operation.season1';
export const STORE_LISTING_IAP_ANDROID_PRODUCT_ID = 'crevia_main_operation_season_1';
export const STORE_LISTING_IAP_ENTITLEMENT_ID = 'main_operation_full_access';
export const STORE_LISTING_IAP_OFFERING_ID = 'default';

export const STORE_LISTING_FALSE_CLAIM_PATTERNS = [
  'gerçek belediye verisi',
  'canlı gps',
  'gerçek zamanlı şehir yönetimi',
  'resmi belediye uygulaması',
  'gerçek para kazanma',
  'kesin sonuç',
  'real-time city management',
  'live gps',
  'official municipality app',
  'earn real money',
  'guaranteed outcome',
] as const;

export const STORE_LISTING_METADATA_DRAFT: CreviaStoreMetadataDraft = {
  appName: 'Crevia',
  subtitleTr: 'Mahalle operasyon simülasyonu',
  subtitleEn: 'Neighborhood operations simulation',
  shortDescriptionTr:
    'Crevia, kurgusal bir mahallede günlük operasyon kararlarını yönettiğin tek oyunculu bir simülasyon oyunudur. Pilot haftayı tamamla, olayları incele ve gün sonu raporunu oku.',
  shortDescriptionEn:
    'Crevia is a single-player simulation game where you manage daily operational decisions in a fictional neighborhood. Complete the pilot week, inspect events, and read end-of-day reports.',
  fullDescriptionTr: `Crevia kurgusal bir mahalle simülasyon oyunudur — resmi kurum entegrasyonu veya canlı konum servisi kullanmaz.

Pilot haftada (Gün 1–7) günlük planını yap, olayları incele, saha kararlarını ver ve gün sonu raporunu oku. Gün 8 sonrası açık uçlu operasyon modunda mahalle sistemlerini takip edebilirsin.

Özellikler:
• Günlük plan ve olay inceleme akışı
• Saha / yönlendirme ve harita üzerinden mahalle görünümü
• Kaynak ve kriz kararları
• Gün sonu rapor ve kariyer özeti
• İsteğe bağlı tek seferlik uygulama içi satın alma ile Ana Operasyon tam erişimi (sandbox test aşamasında)

Bu oyun eğitim ve eğlence amaçlıdır; finansal kazanç veya kamu kurumu işlemi vaadi içermez.`,
  fullDescriptionEn: `Crevia is a fictional neighborhood simulation game — no official agency integrations or live location services.

During the pilot week (Days 1–7), plan your day, inspect events, make field decisions, and read end-of-day reports. After Day 8, continue in open-ended operation mode with neighborhood systems.

Features:
• Daily planning and event inspection flow
• Field dispatch and map-based district view
• Resource and crisis decisions
• End-of-day report and career summary
• Optional one-time in-app purchase for full Main Operation access (sandbox testing phase)

Entertainment product only — no financial reward or public-sector operation claims.`,
  featureBullets: [
    'Tek oyunculu mahalle operasyon simülasyonu',
    'Günlük plan → olay → saha → sonuç döngüsü',
    'Harita ve mahalle istihbarat şeridi',
    'Gün sonu rapor ve kariyer vitrini',
    'İsteğe bağlı Ana Operasyon IAP (non-subscription)',
  ],
  iapProductDescription:
    'Ana Operasyon tam erişimi — tek seferlik, abonelik değil. Pilot hafta sonrası açık uçlu operasyon modunu açar. Sandbox fiyatlandırma store panelinde belirlenecek.',
  privacySummary:
    'Yapılandırılmış analitik olayları (gün, erişim modu, yüzey) toplanabilir; ham kullanıcı metni veya kayıt dökümü toplanmaz. Satın alma verisi Apple/Google ve RevenueCat üzerinden işlenir. Çökme SDK entegrasyonu henüz pending.',
  supportContact: STORE_LISTING_SUPPORT_EMAIL_PLACEHOLDER,
  privacyPolicyUrl: STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  supportUrl: STORE_LISTING_SUPPORT_URL_PLACEHOLDER,
  marketingUrl: '',
  keywords: 'simülasyon,operasyon,mahalle,strateji,tek oyunculu',
  category: 'Games / Simulation',
};

export const STORE_LISTING_SCREENSHOT_REQUIREMENTS: CreviaStoreScreenshotRequirement[] = [
  {
    screenName: 'Hub / Merkez',
    purpose: 'Ana operasyon merkezi ve günlük plan girişi',
    requiredState: 'Gün 2+ hub, günlük plan kartı görünür',
    copyOverlayAllowed: true,
    riskNotes: 'Gerçek belediye logosu veya resmi kurum iddiası kullanma',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Event inspect / plan',
    purpose: 'Olay inceleme ve planlama fazı',
    requiredState: 'Aktif olay, İncele veya Planla fazı',
    copyOverlayAllowed: true,
    riskNotes: 'Abartılı sonuç vaadi overlay ekleme',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Dispatch / active route',
    purpose: 'Yönlendirme ve aktif rota önizlemesi',
    requiredState: 'Yönlendir fazı, rota şeridi',
    copyOverlayAllowed: true,
    riskNotes: 'GPS / canlı navigasyon iddiası yok — simülasyon olduğunu belirt',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Map district intelligence',
    purpose: 'Harita ve mahalle istihbarat şeridi',
    requiredState: 'MapScreen, pin veya overlay seçili',
    copyOverlayAllowed: true,
    riskNotes: 'Gerçek harita verisi veya canlı trafik iddiası yok',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Operation result',
    purpose: 'Olay sonucu ve sistem yankısı',
    requiredState: 'Event result ekranı, sonuç kartları',
    copyOverlayAllowed: true,
    riskNotes: 'Kesin sonuç / garanti vaadi yok',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'End-of-day report',
    purpose: 'Gün sonu rapor özeti',
    requiredState: 'Gün 3+ rapor, kaynak/kriz bölümleri',
    copyOverlayAllowed: true,
    riskNotes: 'Pilot Gün 7 tamamlanma CTA dikkatli göster',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Profile / career',
    purpose: 'Kariyer vitrini ve yetki rozeti',
    requiredState: 'ProfileScreen, badge/authority kartları',
    copyOverlayAllowed: true,
    riskNotes: 'Gerçek meslek sertifikası iddiası yok',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
  {
    screenName: 'Post-pilot offer / full operation preview',
    purpose: 'Pilot sonrası teklif ve tam operasyon önizlemesi',
    requiredState: 'PostPilotOfferScreen, limited/full copy',
    copyOverlayAllowed: false,
    riskNotes: 'IAP fiyatı store panelinden; abonelik değil vurgusu; dikkatli kullan',
    deviceSize: '6.7" iPhone + phone Android',
    status: 'pending',
    platform: 'both',
  },
];

export const STORE_LISTING_PRIVACY_MATRIX: CreviaStorePrivacyRequirement[] = [
  {
    collectedDataType: 'Analytics events (structured)',
    purpose: 'Product improvement, funnel understanding',
    linkedToUser: false,
    usedForTracking: false,
    requiredForAppFunctionality: false,
    notes: 'Payload allowlist; no raw event copy or free text.',
  },
  {
    collectedDataType: 'Purchase / entitlement status',
    purpose: 'Unlock full Main Operation access',
    linkedToUser: 'pending',
    usedForTracking: false,
    requiredForAppFunctionality: true,
    notes: 'Processed via Apple/Google store + RevenueCat; no card data in app.',
  },
  {
    collectedDataType: 'Crash logs',
    purpose: 'Stability monitoring',
    linkedToUser: 'pending',
    usedForTracking: false,
    requiredForAppFunctionality: false,
    notes: 'Crash SDK not integrated yet — declare pending/WARN in store forms.',
  },
  {
    collectedDataType: 'User ID / account',
    purpose: 'N/A — no login in MVP',
    linkedToUser: false,
    usedForTracking: false,
    requiredForAppFunctionality: false,
    notes: 'No account system; local save only.',
  },
  {
    collectedDataType: 'Raw text / user copy / save dump',
    purpose: 'Must NOT be collected',
    linkedToUser: false,
    usedForTracking: false,
    requiredForAppFunctionality: false,
    notes: 'Explicitly excluded — analytics privacy-safe payloads only.',
  },
  {
    collectedDataType: 'Device / app identifiers (analytics base)',
    purpose: 'Session-scoped diagnostics in verify only',
    linkedToUser: false,
    usedForTracking: false,
    requiredForAppFunctionality: false,
    notes: 'No ATT required unless tracking SDK added later.',
  },
];
