import type {
  StoreMetadataCopyIapGuidance,
  StoreMetadataCopyItem,
  StoreMetadataCopyManualLimitCheck,
} from './storeMetadataCopyTypes';
import { STORE_SCREENSHOT_NARRATIVE_DOCS_PATH } from '@/core/storeScreenshotNarrative';

export const STORE_METADATA_COPY_PACK_ID = 'crevia_store_metadata_copy_v1';

export const STORE_METADATA_COPY_DOCS_PATH = 'docs/crevia-store-metadata-copy-pack.md';

export const STORE_METADATA_COPY_MIN_FEATURE_BULLETS = 8;

export const STORE_METADATA_COPY_MIN_KEYWORD_PHRASES = 8;

export const STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED =
  'manual — verify App Store Connect / Play Console field limits before submission';

export const STORE_METADATA_COPY_MANUAL_LIMIT_CHECKS: StoreMetadataCopyManualLimitCheck[] = [
  {
    id: 'apple_metadata_limits',
    platform: 'apple',
    note: 'Apple App Store metadata field limits manual check required.',
    lastChecked: STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'google_short_full_limits',
    platform: 'google',
    note: 'Google Play short/full description limits manual check required.',
    lastChecked: STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'keyword_rules',
    platform: 'both',
    note: 'Keyword rules manual check required (ASC keywords vs Play tags).',
    lastChecked: STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'iap_product_metadata',
    platform: 'both',
    note: 'IAP product metadata rules manual check required.',
    lastChecked: STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED,
  },
  {
    id: 'privacy_data_safety',
    platform: 'both',
    note: 'Privacy/data safety copy must match actual SDKs and data use.',
    lastChecked: STORE_METADATA_COPY_OFFICIAL_DOCS_LAST_CHECKED,
  },
];

export const STORE_METADATA_COPY_POSITIONING_TR =
  'Crevia, şehir operasyonlarını günlük kararlarla yönettiğin, mahallelerin kararlarına tepki verdiği ve her günün rapora/şehir hafızasına işlendiği mobil operasyon simülasyonudur.';

export const STORE_METADATA_COPY_POSITIONING_EN =
  "Crevia is a mobile city operations simulation where your daily decisions shape neighborhoods, reports, field resources and the city's memory.";

export const STORE_METADATA_COPY_APP_NAME_OPTIONS = ['Crevia', 'Crevia — City Operations'] as const;

export const STORE_METADATA_COPY_SUBTITLE_OPTIONS_TR = [
  'Şehri kararlarınla yönet',
  'Mahalleler kararlarına tepki verir',
  'Günlük şehir operasyon simülasyonu',
] as const;

export const STORE_METADATA_COPY_SUBTITLE_OPTIONS_EN = [
  'Run daily city operations',
  'Decisions that shape a city',
  'A civic operations simulation',
] as const;

export const STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_TR = [
  'Karar ver, mahallelerin tepkisini gör, gün sonu raporuyla şehrin yönünü takip et.',
  'Günlük operasyon kararları, harita tepkileri ve Ece danışmanlığıyla şehri yönet.',
] as const;

export const STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_EN = [
  'Make daily decisions, watch neighborhoods react, and review how your city changes over time.',
  'Plan field operations, read neighborhood signals, and see each day leave a mark on the city.',
] as const;

export const STORE_METADATA_COPY_LONG_DESCRIPTION_TR = `Crevia, kurgusal bir şehirde günlük operasyon kararlarını yönettiğin mobil bir operasyon simülasyonudur. Resmi kurum uygulaması değildir; canlı kurum verisi veya konum takibi kullanmaz.

Ne yaparsın?
Her gün operasyon masandan plan yaparsın, saha olaylarını incelersin ve mahalleleri etkileyen kararlar verirsin. Kaynaklarını, ekip ve araç kapasiteni dengeleyerek şehrin ritmini taşırsın.

Karar etkisi
Her seçim kısa vadeli etki ve yarına kalan risk taşır. Crevia kararını açıklar; sonuçlar rastgele değil, sistemlerin birbirine bağlı olduğu bir simülasyon hissi verir.

Harita ve mahalleler
Haritada mahalleler kararlarına tepki verir. Risk, toparlanma ve saha kapasitesi görünür kalır; Mahalle Karnesi ile mahalle kimliği okunur.

Ece, Sosyal Nabız ve raporlar
Ece operasyon danışmanın olarak karar tarzını ve mahalle sinyallerini birlikte yorumlar. Sosyal Nabız sahadaki değişimi konuşur. Gün sonu raporları kararlarını, riskleri ve toparlanmayı hatırlar; Şehir Günlüğü şehrin hafızasını taşır.

Ana operasyon
7 günlük pilot sonrası şehir kapsamı büyür. Ana operasyon döneminde daha geniş sorumluluk, içerik paketi kökenli olaylar ve kariyer hissi derinleşir.

Neden farklı?
Crevia bir şehir kurma sandbox'ı veya paylaşımlı çevrimiçi rekabet oyunu değildir. Sakin strateji, oyuncu sahipliği ve başarı/toparlanma görünürlüğü ön plandadır.

Soft launch notu: Bu sürüm erken erişim/soft launch kapsamındadır; içerik ve denge iterasyonu devam edebilir.`;

export const STORE_METADATA_COPY_LONG_DESCRIPTION_EN = `Crevia is a mobile city operations simulation set in a fictional district. It is not an official government app and does not use real municipal data or live location tracking.

What you do
Each day you plan from your operations desk, inspect field events, and make decisions that ripple through neighborhoods. Balance teams, vehicles, and resources as the city's rhythm responds to your choices.

Decision impact
Every choice carries short-term impact and tomorrow's risk. Crevia explains outcomes clearly — results feel connected, not random.

Map and neighborhoods
Districts react on the map. Risk, recovery, and field capacity stay visible. Neighborhood report cards help you read local identity and pressure.

Ece, social pulse, and reports
Ece, your operations advisor, connects your decision style with neighborhood signals. Social pulse surfaces how citizens notice change in the field. End-of-day reports remember decisions, risks, and recovery; the city journal carries the city's memory forward.

Main operation
After a 7-day pilot, the city scope expands. The main operation phase deepens responsibility, pack-origin events, and your civic career arc.

Why it stands out
Crevia is not a city-building sandbox or shared-online competitive title. It favors calm strategy, player ownership, and visible recovery moments over panic or pay-to-win pressure.

Soft launch note: This build is an early access / soft launch release; content and balance may continue to evolve.`;

export const STORE_METADATA_COPY_FEATURE_BULLETS_TR = [
  'Günlük operasyon kararları ve planlama döngüsü',
  'Mahalle tepkileri ve harita görünürlüğü',
  'Ece operasyon danışmanı ve karar tarzı yorumu',
  'Sosyal Nabız ile saha geri bildirimi',
  'Gün sonu raporları ve yarın riski özeti',
  'Şehir Günlüğü ile karar hafızası',
  'Ekip ve araç kaynaklarını dengeleme',
  'Pilot sonrası ana operasyon dönemi',
  'Toparlanma ve olumlu iz görünürlüğü',
] as const;

export const STORE_METADATA_COPY_FEATURE_BULLETS_EN = [
  'Daily operation decisions and planning loop',
  'Neighborhood reactions and map visibility',
  'Ece, your operations advisor, and decision-style insight',
  'Social pulse feedback from the field',
  'End-of-day reports and tomorrow risk summary',
  'City journal and decision memory',
  'Balance teams and vehicle resources',
  'Main operation phase after the pilot',
  'Recovery and positive outcome visibility',
] as const;

export const STORE_METADATA_COPY_KEYWORD_PHRASES_TR = [
  'belediye oyunu',
  'şehir yönetimi',
  'operasyon simülasyonu',
  'karar oyunu',
  'mahalle yönetimi',
  'strateji simülasyonu',
  'günlük rapor',
  'kaynak yönetimi',
  'sosyal nabız',
  'şehir hafızası',
] as const;

export const STORE_METADATA_COPY_KEYWORD_PHRASES_EN = [
  'city operations',
  'civic simulation',
  'decision game',
  'neighborhood management',
  'operations strategy',
  'daily reports',
  'resource management',
  'city pulse',
  'simulation game',
  'management strategy',
] as const;

export const STORE_METADATA_COPY_REVIEW_NOTES_TR = `Crevia — inceleme notları (simülasyon oyunu)

Bu uygulama resmi bir belediye veya kamu kurumu uygulaması DEĞİLDİR.
• Kurgusal şehir operasyon simülasyonu; kamu kurumu veri entegrasyonu yoktur.
• GPS / canlı konum takibi yoktur; harita ve mahalleler oyun içi simülasyondur.
• Paylaşımlı çevrimiçi veya yapay zeka sohbet ürünü değildir.

IAP (varsa):
• Tek seferlik non-consumable: Ana Operasyon erişimi pilot sonrası daha geniş şehir kapsamını açar.
• Pilot hafta (Gün 1–7) satın alma olmadan tamamlanabilir.
• Satın alma rekabetçi avantaj veya pay-to-win sağlamaz.
• Restore purchase: Ayarlar / mağaza ekranından geri yükleme akışı mevcuttur.

Gizlilik ve SDK:
• Sentry çökme raporları ve analitik kullanım sinyalleri gizlilik politikasında açıklanır.
• Kişisel serbest metin veya ham kayıt dosyası gönderilmez.
• Gizlilik politikası URL: [PRIVACY_POLICY_URL_PLACEHOLDER — yayınlanınca güncellenecek]

İnceleme akışı önerisi:
1) Onboarding / şehir girişi
2) Gün 1: plan → karar → sonuç → gün sonu raporu
3) Gün 4–7: Sosyal Nabız, harita tepkisi, Ece ilişki satırları
4) Gün 8+: ana operasyon hissi (pilot tamamlandıktan sonra doğal ilerleme)

Sandbox test hesabı: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER — TODO: gerçek hesap bilgisi eklenecek]
Dev/mock satın alma yolu yalnızca internal test içindir; production build'de devre dışıdır.`;

export const STORE_METADATA_COPY_REVIEW_NOTES_EN = `Crevia — review notes (simulation game)

This app is NOT an official municipality or government application.
• Fictional city operations simulation; no agency data integrations are used.
• No GPS / live location tracking; map and neighborhoods are in-game simulation.
• Not a shared-online or AI chatbot product.

IAP (if applicable):
• One-time non-consumable: Main Operation access expands city scope after the pilot.
• Pilot week (Days 1–7) is completable without purchasing.
• Purchase does not provide competitive advantage or pay-to-win benefits.
• Restore purchase: available via Settings / store flow.

Privacy and SDKs:
• Sentry crash reports and analytics usage signals are described in the privacy policy.
• Free-form personal text or raw save files are not transmitted.
• Privacy policy URL: [PRIVACY_POLICY_URL_PLACEHOLDER — update when published]

Suggested reviewer flow:
1) Onboarding / city entry
2) Day 1: plan → decision → outcome → end-of-day report
3) Days 4–7: social pulse, map reactions, Ece relationship lines
4) Day 8+: main operation feel (natural progression after pilot)

Sandbox test account: [SANDBOX_TEST_ACCOUNT_PLACEHOLDER — TODO: add real credentials]
Dev/mock purchase path is internal-test only; disabled in production builds.`;

export const STORE_METADATA_COPY_RELEASE_NOTES_TR = `Crevia — ilk soft launch sürümü
• Pilot operasyon akışı (Gün 1–7)
• Mahalle tepkileri ve harita görünürlüğü
• Ece operasyon danışmanlığı ve karar tarzı yorumu
• Sosyal Nabız ve gün sonu raporları
• Şehir Günlüğü ve toparlanma/olumlu iz görünürlüğü
• Ana operasyon önizlemesi (pilot sonrası)

Not: Bu sürüm public launch final değildir; erken erişim kapsamındadır.`;

export const STORE_METADATA_COPY_RELEASE_NOTES_EN = `Crevia — initial soft launch build
• Pilot operation flow (Days 1–7)
• Neighborhood reactions and map visibility
• Ece advisor notes and decision-style insight
• Social pulse and end-of-day reports
• City journal and recovery/positive outcome visibility
• Main operation preview (after pilot)

Note: This is not a final public launch build; early access scope applies.`;

export const STORE_METADATA_COPY_IAP_GUIDANCE: StoreMetadataCopyIapGuidance = {
  toneTr:
    'Ana Operasyon erişimi, pilot sonrası daha geniş şehir kapsamını ve sezon akışını açar.',
  toneEn: 'Main Operation access expands the city scope and season flow after the pilot.',
  displayNameToneTr: 'Ana Operasyon — Tam Erişim',
  displayNameToneEn: 'Main Operation — Full Access',
  descriptionToneTr:
    'Pilot sonrası genişletilmiş operasyon akışı ve daha fazla sistem görünürlüğü. Tek seferlik satın alma; abonelik değil. Pilot hafta satın alma olmadan tamamlanabilir.',
  descriptionToneEn:
    'Expanded operation flow and greater system visibility after the pilot. One-time purchase; not a subscription. The pilot week is complete without purchasing.',
  restorePurchaseNoteTr:
    'Satın alımınızı cihaz değişikliğinde Ayarlar üzerinden geri yükleyebilirsiniz.',
  restorePurchaseNoteEn: 'Restore your purchase from Settings if you change devices.',
  forbiddenPressurePhrases: [
    'kazanmak için satın al',
    'premium kilidi',
    'kaçırma',
    'sınırsız',
    'buy to win',
    'unlock premium',
    'limited time only',
  ],
  complianceNotes: [
    'Do not invent product IDs, prices, or entitlement names in store copy — use configured listing constants only.',
    'Do not imply the game is worthless without purchase.',
    'Align with limited/light mode behavior after pilot.',
    'No FOMO or panic language in IAP descriptions.',
  ],
};

export const STORE_METADATA_COPY_PRIVACY_DISCLOSURE_TR =
  'Çökme raporları ve kullanım sinyalleri, uygulama güvenilirliğini ve oyun akışını iyileştirmek için kullanılabilir. Kişisel serbest metin veya kayıt dosyası içerikleri gönderilmez. Bu metin gizlilik politikasının yerine geçmez.';

export const STORE_METADATA_COPY_PRIVACY_DISCLOSURE_EN =
  'Crash reports and usage signals may be used to improve app reliability and gameplay flow. Free-form personal text or raw save data is not sent. This text does not replace the privacy policy.';

export const STORE_METADATA_COPY_FORBIDDEN_PHRASES = [
  'yapay zeka ile yönet',
  'ai powered',
  'ai chatbot',
  'gerçek zamanlı gps',
  'real-time gps',
  'canlı takip',
  'live tracking',
  'resmi belediye uygulaması',
  'official municipality app',
  'gerçek belediye verisi',
  'real municipality data',
  'online multiplayer',
  'çevrimiçi çok oyunculu',
  'sınırsız',
  'unlimited',
  'ücretsiz her şey',
  'free forever',
  'kazanmak için satın al',
  'buy to win',
  'premium kilidi',
  'unlock premium',
  'garanti başarı',
  'guaranteed result',
  'gerçek para ödülü',
  'real money reward',
  'crypto',
  'nft',
  'tıbbi',
  'medical claim',
] as const;

export const STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_TR = [
  'mahalle',
  'karar',
  'ece',
  'rapor',
  'operasyon',
  'şehir',
] as const;

export const STORE_METADATA_COPY_NARRATIVE_ALIGNMENT_THEMES_EN = [
  'neighborhood',
  'decision',
  'ece',
  'report',
  'operation',
  'city',
] as const;

function item(
  partial: Omit<StoreMetadataCopyItem, 'status' | 'blocksSubmission'> & {
    blocksSubmission?: boolean;
  },
): Omit<StoreMetadataCopyItem, 'status'> {
  return {
    ...partial,
    blocksSubmission: partial.blocksSubmission ?? true,
  };
}

export const STORE_METADATA_COPY_ITEMS_TEMPLATE: Omit<StoreMetadataCopyItem, 'status'>[] = [
  ...STORE_METADATA_COPY_APP_NAME_OPTIONS.map((text, i) =>
    item({
      id: `smc_app_name_${i + 1}`,
      locale: 'tr',
      storeTarget: 'both',
      fieldType: 'app_name',
      text,
      characterGuidance: 'App name — verify ASC / Play title rules manually.',
      tone: 'brand',
      claimRisk: 'low',
      storeComplianceNotes: 'Use consistent brand spelling.',
      blocksSubmission: false,
    }),
  ),
  ...STORE_METADATA_COPY_SUBTITLE_OPTIONS_TR.map((text, i) =>
    item({
      id: `smc_subtitle_tr_${i + 1}`,
      locale: 'tr',
      storeTarget: 'both',
      fieldType: 'subtitle',
      text,
      characterGuidance: 'Apple subtitle — manual length check before submit.',
      tone: 'premium civic',
      claimRisk: 'low',
      storeComplianceNotes: 'No official municipality claim.',
    }),
  ),
  ...STORE_METADATA_COPY_SUBTITLE_OPTIONS_EN.map((text, i) =>
    item({
      id: `smc_subtitle_en_${i + 1}`,
      locale: 'en',
      storeTarget: 'both',
      fieldType: 'subtitle',
      text,
      characterGuidance: 'Apple subtitle — manual length check before submit.',
      tone: 'premium civic',
      claimRisk: 'low',
      storeComplianceNotes: 'Natural EN — not literal TR translation.',
    }),
  ),
  ...STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_TR.map((text, i) =>
    item({
      id: `smc_short_tr_${i + 1}`,
      locale: 'tr',
      storeTarget: 'google_play',
      fieldType: 'short_description',
      text,
      characterGuidance: 'Play short description — manual character limit check.',
      tone: 'clear hook',
      claimRisk: 'low',
      storeComplianceNotes: 'Align with screenshot narrative order.',
    }),
  ),
  ...STORE_METADATA_COPY_SHORT_DESCRIPTION_OPTIONS_EN.map((text, i) =>
    item({
      id: `smc_short_en_${i + 1}`,
      locale: 'en',
      storeTarget: 'google_play',
      fieldType: 'short_description',
      text,
      characterGuidance: 'Play short description — manual character limit check.',
      tone: 'clear hook',
      claimRisk: 'low',
      storeComplianceNotes: 'Natural EN phrasing.',
    }),
  ),
  item({
    id: 'smc_full_tr',
    locale: 'tr',
    storeTarget: 'both',
    fieldType: 'full_description',
    text: STORE_METADATA_COPY_LONG_DESCRIPTION_TR,
    characterGuidance: 'Full description — manual ASC / Play limit check.',
    tone: 'premium calm',
    claimRisk: 'low',
    storeComplianceNotes: 'Sections: hook, actions, impact, map, Ece, main op, differentiator.',
  }),
  item({
    id: 'smc_full_en',
    locale: 'en',
    storeTarget: 'both',
    fieldType: 'full_description',
    text: STORE_METADATA_COPY_LONG_DESCRIPTION_EN,
    characterGuidance: 'Full description — manual ASC / Play limit check.',
    tone: 'premium calm',
    claimRisk: 'low',
    storeComplianceNotes: 'Natural EN — not word-for-word TR translation.',
  }),
  ...STORE_METADATA_COPY_FEATURE_BULLETS_TR.map((text, i) =>
    item({
      id: `smc_bullet_tr_${i + 1}`,
      locale: 'tr',
      storeTarget: 'both',
      fieldType: 'feature_bullet',
      text,
      characterGuidance: 'Feature bullet — store listing bullet or promo text.',
      tone: 'player benefit',
      claimRisk: 'low',
      storeComplianceNotes: 'Matches screenshot narrative themes.',
      blocksSubmission: false,
    }),
  ),
  ...STORE_METADATA_COPY_FEATURE_BULLETS_EN.map((text, i) =>
    item({
      id: `smc_bullet_en_${i + 1}`,
      locale: 'en',
      storeTarget: 'both',
      fieldType: 'feature_bullet',
      text,
      characterGuidance: 'Feature bullet — store listing bullet or promo text.',
      tone: 'player benefit',
      claimRisk: 'low',
      storeComplianceNotes: 'Natural EN bullet.',
      blocksSubmission: false,
    }),
  ),
  ...STORE_METADATA_COPY_KEYWORD_PHRASES_TR.map((text, i) =>
    item({
      id: `smc_kw_tr_${i + 1}`,
      locale: 'tr',
      storeTarget: 'both',
      fieldType: 'keyword_phrase',
      text,
      characterGuidance: 'Keyword phrase — avoid stuffing; manual ASC keyword rules.',
      tone: 'discovery',
      claimRisk: 'medium',
      storeComplianceNotes: 'No forbidden official/GPS claims in keywords.',
      blocksSubmission: false,
    }),
  ),
  ...STORE_METADATA_COPY_KEYWORD_PHRASES_EN.map((text, i) =>
    item({
      id: `smc_kw_en_${i + 1}`,
      locale: 'en',
      storeTarget: 'both',
      fieldType: 'keyword_phrase',
      text,
      characterGuidance: 'Keyword phrase — Play tags manual check.',
      tone: 'discovery',
      claimRisk: 'medium',
      storeComplianceNotes: 'Natural EN search phrases.',
      blocksSubmission: false,
    }),
  ),
  item({
    id: 'smc_review_tr',
    locale: 'tr',
    storeTarget: 'both',
    fieldType: 'review_note',
    text: STORE_METADATA_COPY_REVIEW_NOTES_TR,
    characterGuidance: 'App Review Information — manual paste in ASC / Play.',
    tone: 'reviewer clarity',
    claimRisk: 'low',
    storeComplianceNotes: 'Sandbox placeholder — no fake credentials.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_review_en',
    locale: 'en',
    storeTarget: 'both',
    fieldType: 'review_note',
    text: STORE_METADATA_COPY_REVIEW_NOTES_EN,
    characterGuidance: 'App Review Information — manual paste in ASC / Play.',
    tone: 'reviewer clarity',
    claimRisk: 'low',
    storeComplianceNotes: 'Sandbox placeholder — no fake credentials.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_release_tr',
    locale: 'tr',
    storeTarget: 'both',
    fieldType: 'release_note',
    text: STORE_METADATA_COPY_RELEASE_NOTES_TR,
    characterGuidance: 'Release notes — version changelog field.',
    tone: 'soft launch',
    claimRisk: 'low',
    storeComplianceNotes: 'Does not claim final public launch ready.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_release_en',
    locale: 'en',
    storeTarget: 'both',
    fieldType: 'release_note',
    text: STORE_METADATA_COPY_RELEASE_NOTES_EN,
    characterGuidance: 'Release notes — version changelog field.',
    tone: 'soft launch',
    claimRisk: 'low',
    storeComplianceNotes: 'Does not claim final public launch ready.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_iap_tone_tr',
    locale: 'tr',
    storeTarget: 'both',
    fieldType: 'iap_description',
    text: STORE_METADATA_COPY_IAP_GUIDANCE.descriptionToneTr,
    characterGuidance: 'IAP product description — use configured product IDs only.',
    tone: 'value clarity',
    claimRisk: 'medium',
    storeComplianceNotes: 'No invented price or product ID.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_iap_tone_en',
    locale: 'en',
    storeTarget: 'both',
    fieldType: 'iap_description',
    text: STORE_METADATA_COPY_IAP_GUIDANCE.descriptionToneEn,
    characterGuidance: 'IAP product description — use configured product IDs only.',
    tone: 'value clarity',
    claimRisk: 'medium',
    storeComplianceNotes: 'No pay-to-win framing.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_privacy_tr',
    locale: 'tr',
    storeTarget: 'both',
    fieldType: 'privacy_disclosure',
    text: STORE_METADATA_COPY_PRIVACY_DISCLOSURE_TR,
    characterGuidance: 'Data safety / privacy summary — must match SDK reality.',
    tone: 'transparent',
    claimRisk: 'medium',
    storeComplianceNotes: 'Does not replace privacy policy URL.',
    blocksSubmission: false,
  }),
  item({
    id: 'smc_privacy_en',
    locale: 'en',
    storeTarget: 'both',
    fieldType: 'privacy_disclosure',
    text: STORE_METADATA_COPY_PRIVACY_DISCLOSURE_EN,
    characterGuidance: 'Data safety / privacy summary — must match SDK reality.',
    tone: 'transparent',
    claimRisk: 'medium',
    storeComplianceNotes: 'Does not close privacy URL placeholder blocker.',
    blocksSubmission: false,
  }),
];

export const STORE_METADATA_COPY_NARRATIVE_DOCS_PATH = STORE_SCREENSHOT_NARRATIVE_DOCS_PATH;
