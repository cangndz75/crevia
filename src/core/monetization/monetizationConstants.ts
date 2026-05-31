import type { MonetizationProductId } from './monetizationTypes';

export const MAIN_OPERATION_PRODUCT_ID: MonetizationProductId =
  'main_operation_season_1';

export const POST_PILOT_OFFER_ROUTE = '/post-pilot-offer';

export const MONETIZATION_UI_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
  'paywall',
  'iap',
] as const;

export const MAIN_OPERATION_PACK = {
  productId: MAIN_OPERATION_PRODUCT_ID,
  title: 'Ana Operasyon Paketi',
  subtitle: 'Sezon 1: Şehir Yönetimi',
  description:
    'Pilot operasyonu tamamladın. Ana Operasyon’da şehir kapsamı büyür; mahalle planı, saha atamaları, operasyon sinyalleri ve sezon hedefleri daha güçlü çalışır.',
  includedFeatures: [
    {
      id: 'districts',
      title: '5 Mahalle Kapsamı',
      description:
        'Merkez dışındaki mahalle sinyalleri ana operasyonda daha aktif hale gelir.',
      status: 'full_access' as const,
    },
    {
      id: 'daily_plan',
      title: 'Gelişmiş Operasyon Planı',
      description:
        'Günlük plan, saha atamaları ve operasyon dengesi daha fazla karar üretir.',
      status: 'full_access' as const,
    },
    {
      id: 'crisis_desk',
      title: 'Kriz Masası Hazırlığı',
      description:
        'Çoklu mahalle baskıları ve kritik olaylar ana operasyonda devreye alınır.',
      status: 'coming_later' as const,
    },
    {
      id: 'season_goals',
      title: 'Sezon Hedefleri',
      description:
        'Şehir güveni, kaynak dengesi ve mahalle başarısı sezon boyunca izlenir.',
      status: 'coming_later' as const,
    },
    {
      id: 'reports',
      title: 'Gelişmiş Raporlar',
      description:
        'Gün sonu ve sezon raporlarında neden-sonuç etkileri daha net görünür.',
      status: 'full_access' as const,
    },
    {
      id: 'authority',
      title: 'Liderlik ve Yetki Gelişimi',
      description:
        'Yetki, rozet ve prestij sistemi ana operasyonda daha görünür hale gelir.',
      status: 'available_now' as const,
    },
  ],
} as const;

export const MONETIZATION_COPY = {
  offerTitle: 'Ana Operasyon Açılıyor',
  offerSubtitle: 'Pilot operasyon tamamlandı. Şehir kapsamını büyütme zamanı.',
  heroLine:
    'Artık yalnızca günü kapatmıyorsun; şehir operasyonunu sezon boyunca yönetiyorsun.',
  pilotSummaryLine:
    'Pilot boyunca planlama, saha ataması, operasyon sinyalleri ve rapor akışını tamamladın.',
  primaryCta: 'Ana Operasyonu Aç',
  secondaryCta: 'Sınırlı Gündemle Devam Et',
  restoreCta: 'Erişimi Kontrol Et',
  playerFooter:
    'Sınırlı gündemle devam edersen şehir kapsamı dar kalır.',
  devFooterNote:
    'Geliştirici modu: ödeme mock olarak işlenir.',
  accessNone: 'Pilot sürüyor',
  accessOffer: 'Ana Operasyon teklifi hazır',
  accessLimited: 'Sınırlı gündem',
  accessFull: 'Ana Operasyon aktif',
  limitedWarningTitle: 'Sınırlı gündem aktif',
  limitedWarningLine:
    'Sınırlı gündemde günlük olay sayısı ve mahalle kapsamı dar kalır.',
  fullUnlockedTitle: 'Ana Operasyon erişimi tanımlandı',
  fullUnlockedLine: 'Ana Operasyon erişimi tanımlandı. Sezon kapsamı aktif.',
  restoreFeedback: 'Erişim kontrol edildi.',
  mockUnlockFeedback: 'Ana Operasyon erişimi tanımlandı.',
  reportCtaOffer: 'Ana Operasyona Geç',
  reportCtaPreview: 'Ana Operasyonu İncele',
  reportCtaFull: 'Ana Operasyona Devam Et',
  reportCtaLimited: 'Sınırlı Gündeme Devam Et',
  pilotNotCompleteHint: 'Pilot tamamlandığında Ana Operasyon teklifi açılır.',
} as const;

export const ACCESS_LABELS: Record<
  import('./monetizationTypes').MainOperationAccess,
  string
> = {
  none: MONETIZATION_COPY.accessNone,
  offer_available: MONETIZATION_COPY.accessOffer,
  limited: MONETIZATION_COPY.accessLimited,
  full: MONETIZATION_COPY.accessFull,
};
