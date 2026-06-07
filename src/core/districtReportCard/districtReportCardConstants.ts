import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

import type {
  DistrictReportCardDominantIssueKind,
  DistrictReportCardLiteStatusTone,
} from './districtReportCardTypes';

export const DISTRICT_REPORT_CARD_LITE_DISTRICT_IDS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const DISTRICT_REPORT_CARD_LITE_MAX_VISIBLE_LINES = 4;

export const DISTRICT_REPORT_CARD_LITE_MAX_COPY_LENGTH = 96;

export const DISTRICT_REPORT_CARD_LITE_FORBIDDEN_WORDS = [
  'pack',
  'metadata',
  'runtime',
  'activation',
  'candidate',
  'variant',
  'premium',
  'kilitli',
  'satın al',
  'kaçırma',
  'ödül kazan',
  'başarısız oldun',
  'panik',
  'felaket',
  'viral',
  'trend oldu',
  'district_pack_one',
  'vehicle_route_pack_one',
  'container_environment_pack_one',
] as const;

export const DISTRICT_REPORT_CARD_LITE_TRUST_LABELS: Record<CreviaDistrictTrustBand, string> = {
  fragile: 'Sosyal güven hassas',
  strained: 'İzleme notunda',
  watch: 'İzleme notunda',
  stable: 'Denge korunuyor',
  trusted: 'Mahalle güveni güçleniyor',
  improving: 'Güven toparlanıyor',
  recovering: 'Güven toparlanıyor',
};

export const DISTRICT_REPORT_CARD_LITE_ISSUE_LABELS: Record<DistrictReportCardDominantIssueKind, string> = {
  route_pressure: 'Rota baskısı',
  container_pressure: 'Konteyner çevresi',
  personnel_fatigue: 'Personel yorgunluğu',
  vehicle_fatigue: 'Araç yorgunluğu',
  social_trust: 'Sosyal güven',
  district_trust: 'Mahalle güveni',
  visible_service: 'Görünür hizmet',
  environmental_care: 'Çevre bakımı',
  recovery_momentum: 'Toparlanma',
  crisis_prevention: 'Kriz önleme',
  resource_balance: 'Kaynak dengesi',
  operation_scope: 'Ana operasyon kapsamı',
  stable_identity: 'Mahalle dengesi',
  fallback: 'Operasyon dengesi',
};

export const DISTRICT_REPORT_CARD_LITE_BAND_STATUS_TONE: Record<
  CreviaDistrictTrustBand,
  DistrictReportCardLiteStatusTone
> = {
  fragile: 'fragile',
  strained: 'strained',
  watch: 'watch',
  stable: 'stable',
  trusted: 'trusted',
  improving: 'improving',
  recovering: 'recovering',
};

export const DISTRICT_REPORT_CARD_LITE_DISTRICT_IDENTITY_HINTS: Record<
  MapDistrictId,
  {
    fallbackIssue: DistrictReportCardDominantIssueKind;
    identityLine: string;
    eceFallback: string;
  }
> = {
  merkez: {
    fallbackIssue: 'visible_service',
    identityLine: 'Merkezde görünür hizmet ve koordinasyon dengesi izleniyor.',
    eceFallback: 'Ece Merkez’de görünür hizmet etkisini ve rapor dengesini birlikte izlemeni öneriyor.',
  },
  cumhuriyet: {
    fallbackIssue: 'social_trust',
    identityLine: 'Cumhuriyet’te sosyal güven ve apartman çevresi dengesi öne çıkıyor.',
    eceFallback: 'Ece, Cumhuriyet’te görünür hizmet etkisinin korunmasını öneriyor.',
  },
  sanayi: {
    fallbackIssue: 'route_pressure',
    identityLine: 'Sanayi’de rota baskısı ve vardiya çıkışı birlikte izleniyor.',
    eceFallback: 'Ece bu mahallede rota ve kaynak dengesini birlikte izlemeni öneriyor.',
  },
  istasyon: {
    fallbackIssue: 'route_pressure',
    identityLine: 'İstasyon’da aktarma yoğunluğu ve rota akışı izleniyor.',
    eceFallback: 'Ece, İstasyon hattında yoğunluk ve rota dengesini birlikte takip etmeni öneriyor.',
  },
  yesilvadi: {
    fallbackIssue: 'environmental_care',
    identityLine: 'Yeşilvadi’de çevre bakımı ve sakin toparlanma çizgisi izleniyor.',
    eceFallback: 'Ece, Yeşilvadi’de çevre baskısının tekrar gündeme gelebileceğini not ediyor.',
  },
};

export const DISTRICT_REPORT_CARD_LITE_FALLBACK_LINE =
  'Bu mahallede operasyon dengesi izleniyor.';
