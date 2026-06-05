import type {
  CreviaStoreIapMetadataDraft,
  CreviaStoreKeywordSet,
  CreviaStoreLocalizedMetadata,
} from './storeMetadataFinalizationTypes';
import {
  STORE_LISTING_IAP_ANDROID_PRODUCT_ID,
  STORE_LISTING_IAP_ENTITLEMENT_ID,
  STORE_LISTING_IAP_IOS_PRODUCT_ID,
  STORE_LISTING_IAP_OFFERING_ID,
  STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  STORE_LISTING_SUPPORT_EMAIL_PLACEHOLDER,
  STORE_LISTING_SUPPORT_URL_PLACEHOLDER,
} from './storeListingReadinessConstants';

export const STORE_METADATA_FINALIZATION_DOCS_PATH =
  'docs/crevia-store-metadata-finalization.md';

export const STORE_METADATA_TR: CreviaStoreLocalizedMetadata = {
  appName: 'Crevia',
  subtitle: 'Mahalle operasyon simülasyonu',
  shortDescription:
    'Crevia, kurgusal bir mahallede günlük operasyon kararlarını yönettiğin tek oyunculu bir simülasyon oyunudur. Rota, kaynak, sosyal güven ve konteyner ağı sistemlerini kullanarak mahalleni yönet. 7 günlük pilot sonrası ana operasyon açılır.',
  fullDescription: `Crevia kurgusal bir şehir operasyon simülasyon oyunudur — resmi kurum entegrasyonu veya canlı konum servisi kullanmaz.

Oyuncu olarak mahallelerde operasyon kararları verirsin: rota planlama, kaynak yönetimi, sosyal güven takibi, konteyner ağı düzenlemesi ve gün sonu raporlama.

Pilot Hafta (Gün 1–7):
• Günlük planını yap, olayları incele, saha kararlarını ver
• Kaynak ve kriz yönetimi
• Gün sonu rapor ve kariyer özeti

Gün 8 Sonrası — Ana Operasyon:
• Açık uçlu operasyon modunda mahalle sistemlerini takip et
• Daha fazla sistem görünürlüğü ve genişletilmiş operasyon akışı
• İsteğe bağlı tek seferlik uygulama içi satın alma ile tam erişim

IAP Hakkında:
Ana operasyon erişimi isteğe bağlı tek seferlik satın alma ile açılır (abonelik değil). Satın almasanız da pilot hafta deneyimi tamdır. Satın alma rekabetçi avantaj sağlamaz.

Bu oyun eğitim ve eğlence amaçlıdır; finansal kazanç veya kamu kurumu işlemi vaadi içermez.`,
  featureBullets: [
    'Tek oyunculu şehir operasyon simülasyonu',
    'Mahalle kararları: rota, kaynak, sosyal güven, konteyner ağı',
    'Günlük plan → olay → saha → sonuç döngüsü',
    'Harita ve mahalle istihbarat şeridi',
    'Gün sonu rapor ve kariyer vitrini',
    '7 günlük pilot sonrası açık uçlu ana operasyon',
    'İsteğe bağlı Ana Operasyon IAP (tek seferlik, abonelik değil)',
  ],
  keywords: [
    'belediye',
    'şehir yönetimi',
    'simülasyon',
    'operasyon',
    'strateji',
    'rota',
    'kaynak yönetimi',
    'mahalle',
    'rapor',
    'yönetim oyunu',
  ],
  category: 'Games / Simulation',
  ageRatingNote: 'Şiddet, kumar, yetişkin içerik yok. Tek seferlik IAP var. UGC ve reklam yok.',
  supportUrl: STORE_LISTING_SUPPORT_URL_PLACEHOLDER,
  privacyPolicyUrl: STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  marketingUrl: '',
  contactEmail: STORE_LISTING_SUPPORT_EMAIL_PLACEHOLDER,
  copyrightOwner: 'PENDING_COPYRIGHT_OWNER',
  appReviewNotes: `Bu uygulama bir şehir operasyon simülasyon oyunudur.
• Kurum entegrasyonu veya konum servisi kullanmaz; harita kurgusaldır.
• Uygulama içi satın alma: Tek seferlik non-consumable unlock (Ana Operasyon tam erişimi).
• IAP sandbox test account: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER]
• RevenueCat entitlement: main_operation_full_access / offering: default
• Day 8+ ana operasyon testi: Pilot haftayı (7 gün) tamamlayın, ardından post-pilot offer ekranı görünür. Satın alma sonrası ana operasyon sistemleri açılır.
• Dev/mock purchase path yalnızca internal test amaçlıdır, production build'de devre dışıdır.`,
  releaseNotes: `Crevia soft launch sürümü
• 7 günlük pilot operasyon
• Mahalle kararları, saha yönlendirme ve gün sonu raporları
• Rota, kaynak, sosyal güven ve konteyner ağı sistemleri
• Pilot sonrası ana operasyon önizlemesi
• İsteğe bağlı tek seferlik Ana Operasyon satın alma`,
};

export const STORE_METADATA_EN: CreviaStoreLocalizedMetadata = {
  appName: 'Crevia',
  subtitle: 'Municipal operations simulation',
  shortDescription:
    'Crevia is a single-player municipal operations simulation game. Make district decisions across routes, resources, public trust, and container networks. Complete the 7-day pilot, then unlock the main operation.',
  fullDescription: `Crevia is a fictional municipal operations simulation game — no official agency integrations or live location services.

As a player you make operational decisions across districts: route planning, resource management, public trust tracking, container network organization, and end-of-day reporting.

Pilot Week (Days 1–7):
• Plan your day, inspect events, make field decisions
• Resource and crisis management
• End-of-day report and career summary

Day 8+ — Main Operation:
• Open-ended operation mode with expanded district systems
• Greater system visibility and extended operation flow
• Optional one-time in-app purchase for full access

About IAP:
Main operation access is an optional one-time purchase (not a subscription). The pilot week experience is complete without purchasing. The purchase does not provide competitive advantage.

Entertainment product only — no financial reward or public-sector operation claims.`,
  featureBullets: [
    'Single-player municipal operations simulation',
    'District decisions: routes, resources, public trust, container networks',
    'Daily plan → event → field → outcome loop',
    'Map and district intelligence strip',
    'End-of-day report and career showcase',
    '7-day pilot followed by open-ended main operation',
    'Optional Main Operation IAP (one-time, not subscription)',
  ],
  keywords: [
    'city management',
    'municipal simulation',
    'strategy',
    'operations',
    'resource management',
    'district',
    'route planning',
    'public trust',
    'simulation game',
    'management game',
  ],
  category: 'Games / Simulation',
  ageRatingNote: 'No violence, gambling, or adult content. One-time IAP. No UGC or ads.',
  supportUrl: STORE_LISTING_SUPPORT_URL_PLACEHOLDER,
  privacyPolicyUrl: STORE_LISTING_PRIVACY_POLICY_PLACEHOLDER,
  marketingUrl: '',
  contactEmail: STORE_LISTING_SUPPORT_EMAIL_PLACEHOLDER,
  copyrightOwner: 'PENDING_COPYRIGHT_OWNER',
  appReviewNotes: `This app is a municipal operations simulation game.
• No agency integrations or location services; the map is fictional.
• In-app purchase: One-time non-consumable unlock (full Main Operation access).
• IAP sandbox test account: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER]
• RevenueCat entitlement: main_operation_full_access / offering: default
• Day 8+ main operation testing: Complete the pilot week (7 days), then the post-pilot offer screen appears. After purchase, main operation systems unlock.
• Dev/mock purchase path is internal-test only, disabled in production builds.`,
  releaseNotes: `Crevia soft launch release
• 7-day pilot operation
• District decisions, field dispatch, and end-of-day reports
• Routes, resources, public trust, and container network systems
• Post-pilot main operation preview
• Optional one-time Main Operation purchase`,
};

export const STORE_KEYWORDS_TR: CreviaStoreKeywordSet = {
  locale: 'tr',
  keywords: STORE_METADATA_TR.keywords,
  forbiddenKeywords: [
    'resmi',
    'devlet uygulaması',
    'gerçek şehir verisi',
    'gps takip',
    'para kazan',
    'official',
    'government app',
  ],
  forbiddenHits: [],
};

export const STORE_KEYWORDS_EN: CreviaStoreKeywordSet = {
  locale: 'en',
  keywords: STORE_METADATA_EN.keywords,
  forbiddenKeywords: [
    'official',
    'government app',
    'real city data',
    'gps tracker',
    'earn money',
    'resmi',
  ],
  forbiddenHits: [],
};

export const STORE_IAP_METADATA_DRAFT: CreviaStoreIapMetadataDraft = {
  productIdIos: STORE_LISTING_IAP_IOS_PRODUCT_ID,
  productIdAndroid: STORE_LISTING_IAP_ANDROID_PRODUCT_ID,
  displayNameTr: 'Ana Operasyon — Tam Erişim',
  displayNameEn: 'Main Operation — Full Access',
  descriptionTr:
    'Ana operasyon erişimi — pilot sonrası genişletilmiş operasyon akışı ve daha fazla sistem görünürlüğü. Tek seferlik satın alma, abonelik değil.',
  descriptionEn:
    'Main operation access — expanded operation flow and greater system visibility after the pilot week. One-time purchase, not a subscription.',
  entitlementId: STORE_LISTING_IAP_ENTITLEMENT_ID,
  offeringId: STORE_LISTING_IAP_OFFERING_ID,
  productType: 'non_consumable',
  priceTierStatus: 'pending_manual',
  storeSetupStatus: 'pending_manual',
};

export const STORE_METADATA_FALSE_CLAIM_PATTERNS = [
  'resmi belediye uygulaması',
  'government official',
  'real-time gps',
  'real time gps',
  'live tracking',
  'canlı takip',
  'real city data',
  'gerçek şehir verisi',
  'guaranteed result',
  'kesin sonuç',
  'earn money',
  'para kazan',
  'pay to win',
  'pay-to-win',
  'premium advantage',
  'premium avantaj',
  'no data collected',
  'hiçbir veri toplamıyoruz',
  'fully anonymous',
  'tam anonim',
  'gdpr fully compliant',
  'kvkk tamamen uyumlu',
  'gdpr/kvkk fully compliant',
  'kvkk/gdpr tamamen uyumlu',
  'season final',
  'sezon finali',
  '14 gün bitti',
  'oyun sonu',
  'game over',
  'gerçek zamanlı gps',
  'canlı gps',
  'gerçek belediye verisi',
  'gerçek para kazanma',
  'official municipality app',
] as const;

export const STORE_METADATA_RELEASE_NOTES_TR = `Crevia soft launch sürümü
• 7 günlük pilot operasyon
• Mahalle kararları, saha yönlendirme ve gün sonu raporları
• Rota, kaynak, sosyal güven ve konteyner ağı sistemleri
• Pilot sonrası ana operasyon önizlemesi`;

export const STORE_METADATA_RELEASE_NOTES_EN = `Crevia soft launch release
• 7-day pilot operation
• District decisions, field dispatch, and end-of-day reports
• Routes, resources, public trust, and container network systems
• Post-pilot main operation preview`;
