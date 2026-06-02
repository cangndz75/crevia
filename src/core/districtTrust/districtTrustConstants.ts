import type {
  DistrictTrustLevel,
  DistrictTrustMemoryKind,
  DistrictTrustPressureDomain,
  DistrictTrustTrend,
  DistrictTrustVisibilityMode,
} from './districtTrustTypes';

export const DISTRICT_TRUST_SCORE_RANGE = {
  min: 0,
  max: 100,
} as const;

export const DISTRICT_TRUST_LEVELS: readonly DistrictTrustLevel[] = [
  'fragile',
  'watch',
  'neutral',
  'stable',
  'trusted',
  'supportive',
] as const;

export const DISTRICT_TRUST_TRENDS: readonly DistrictTrustTrend[] = [
  'falling',
  'strained',
  'steady',
  'improving',
  'recovering',
] as const;

export const DISTRICT_TRUST_PRESSURE_DOMAINS: readonly DistrictTrustPressureDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis',
  'district_balance',
  'resource_recovery',
  'generic',
] as const;

export const DISTRICT_TRUST_LEVEL_THRESHOLDS: Record<
  DistrictTrustLevel,
  { min: number; max: number }
> = {
  fragile: { min: 0, max: 24 },
  watch: { min: 25, max: 39 },
  neutral: { min: 40, max: 59 },
  stable: { min: 60, max: 74 },
  trusted: { min: 75, max: 89 },
  supportive: { min: 90, max: 100 },
};

export const DISTRICT_TRUST_LEVEL_LABELS: Record<DistrictTrustLevel, string> = {
  fragile: 'Kırılgan',
  watch: 'İzlemede',
  neutral: 'Dengeli',
  stable: 'Güvenli',
  trusted: 'Güveniyor',
  supportive: 'Destekleyici',
};

export const DISTRICT_TRUST_TREND_LABELS: Record<DistrictTrustTrend, string> = {
  falling: 'Düşüyor',
  strained: 'Baskıda',
  steady: 'Sabit',
  improving: 'İyileşiyor',
  recovering: 'Toparlanıyor',
};

export const DISTRICT_TRUST_PRESSURE_DOMAIN_LABELS: Record<
  DistrictTrustPressureDomain,
  string
> = {
  container: 'Konteyner',
  vehicle_route: 'Araç / Rota',
  personnel: 'Personel',
  social: 'Sosyal Nabız',
  crisis: 'Kriz',
  district_balance: 'Mahalle Dengesi',
  resource_recovery: 'Toparlanma',
  generic: 'Operasyon',
};

export const DISTRICT_TRUST_MEMORY_KIND_LABELS: Record<DistrictTrustMemoryKind, string> = {
  recent_improvement: 'Son İyileşme',
  repeated_pressure: 'Tekrarlayan Baskı',
  unresolved_carry_over: 'Açık Hafıza İzi',
  public_confidence_gain: 'Güven Kazancı',
  resource_strain: 'Kaynak Baskısı',
  crisis_watch: 'Kriz Eşiği',
  recovery_window: 'Toparlanma Penceresi',
  stable_operation: 'Sakin Operasyon',
};

export const DISTRICT_TRUST_VISIBILITY_RULES = {
  day1: 'compact',
  day2To3: 'compact',
  day4Plus: 'standard',
  detailed: 'detailed',
} satisfies Record<string, DistrictTrustVisibilityMode>;

export const DISTRICT_TRUST_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'yeni sezona başla',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
  'paywall',
  'premium al',
] as const;

export const DISTRICT_TRUST_SAFE_FALLBACK_SCORE = 55;

export const DISTRICT_TRUST_MAX_VISIBLE_PRESSURE_CHIPS = 3;

export const DISTRICT_TRUST_RANK_PERMISSION_IDS = {
  trustPreview: 'district_trust_preview',
  memoryTracePreview: 'district_memory_trace_preview',
  districtOperationsPreview: 'district_specific_operations_preview',
} as const;

export const DISTRICT_TRUST_EVENT_FAMILY_LINKS = {
  variantKind: 'district_trust',
  echoSurface: 'district_memory',
  triggerLow: 'district_trust_low',
  triggerHigh: 'district_trust_high',
} as const;
