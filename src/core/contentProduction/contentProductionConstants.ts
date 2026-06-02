import type {
  CreviaContentCoverageDimension,
  CreviaContentPackKind,
  CreviaContentPackStatus,
  CreviaContentIssueKind,
  CreviaContentProductionSurface,
} from './contentProductionTypes';

export const CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun bitti',
  'yeni sezona başla',
  'premium al',
  'paywall',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
  'parti',
  'seçim kampanyası',
  'siyasi vaat',
] as const;

export const CONTENT_PRODUCTION_RECOMMENDED_DISTRICT_TARGETS = [
  { id: 'merkez', label: 'Merkez', minimumCount: 1, recommendedCount: 2, priority: 90 },
  { id: 'cumhuriyet', label: 'Cumhuriyet', minimumCount: 1, recommendedCount: 2, priority: 92 },
  { id: 'sanayi', label: 'Sanayi', minimumCount: 1, recommendedCount: 2, priority: 88 },
  { id: 'istasyon', label: 'İstasyon', minimumCount: 1, recommendedCount: 2, priority: 87 },
  { id: 'yesilvadi', label: 'Yeşilvadi', minimumCount: 1, recommendedCount: 2, priority: 85 },
] as const;

export const CONTENT_PRODUCTION_RECOMMENDED_DOMAIN_TARGETS = [
  { id: 'container', label: 'Konteyner', minimumCount: 1, recommendedCount: 2, priority: 90 },
  { id: 'vehicle_route', label: 'Araç / Rota', minimumCount: 1, recommendedCount: 2, priority: 88 },
  { id: 'personnel', label: 'Personel', minimumCount: 1, recommendedCount: 2, priority: 86 },
  { id: 'social', label: 'Sosyal', minimumCount: 1, recommendedCount: 2, priority: 84 },
  { id: 'crisis_adjacent', label: 'Kriz Eşiği', minimumCount: 1, recommendedCount: 2, priority: 82 },
  { id: 'district_balance', label: 'Mahalle Dengesi', minimumCount: 1, recommendedCount: 2, priority: 80 },
  { id: 'resource_recovery', label: 'Kaynak Toparlanması', minimumCount: 1, recommendedCount: 2, priority: 78 },
  { id: 'authority_milestone', label: 'Yetki Milestone', minimumCount: 1, recommendedCount: 2, priority: 76 },
  { id: 'operation_era', label: 'Operasyon Dönemi', minimumCount: 1, recommendedCount: 2, priority: 74 },
  { id: 'generic_operation', label: 'Genel Operasyon', minimumCount: 1, recommendedCount: 2, priority: 72 },
] as const;

export const CONTENT_PRODUCTION_RECOMMENDED_VARIANT_TARGETS = [
  'normal',
  'improved',
  'worsened',
  'carry_over',
  'crisis_adjacent',
  'player_adaptive',
  'resource_fatigue',
  'district_trust',
  'reward',
  'comeback',
  'recovery',
  'operation_era',
] as const;

export const CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES: readonly CreviaContentProductionSurface[] = [
  'advisor_echo',
  'report_echo',
  'social_echo',
  'map_hint',
  'tomorrow_preview',
  'operation_result',
] as const;

export const CONTENT_PRODUCTION_OPERATION_ERA_TARGETS = [
  { id: 'core_city_operations', label: 'Temel Şehir Operasyonları', minimumCount: 1, recommendedCount: 1, priority: 95, futureOnly: false },
  { id: 'route_maintenance_era', label: 'Rota ve Bakım Dönemi', minimumCount: 1, recommendedCount: 1, priority: 88, futureOnly: false },
  { id: 'container_network_era', label: 'Konteyner Ağı Dönemi', minimumCount: 1, recommendedCount: 1, priority: 86, futureOnly: false },
  { id: 'district_trust_era', label: 'Mahalle Güveni Dönemi', minimumCount: 1, recommendedCount: 1, priority: 84, futureOnly: false },
  { id: 'crisis_recovery_era', label: 'Kriz Toparlanma Dönemi', minimumCount: 1, recommendedCount: 1, priority: 82, futureOnly: false },
  { id: 'social_pulse_era', label: 'Sosyal Nabız Dönemi', minimumCount: 1, recommendedCount: 1, priority: 80, futureOnly: false },
  { id: 'city_growth_preview_era', label: 'Şehir Gelişimi Hazırlığı', minimumCount: 0, recommendedCount: 1, priority: 70, futureOnly: true },
] as const;

export const CONTENT_PRODUCTION_MOBILE_LENGTH_LIMITS = {
  title: 56,
  shortLine: 110,
  body: 220,
  chip: 24,
  cta: 32,
} as const;

export const CONTENT_PRODUCTION_SCORE_THRESHOLDS = {
  passMin: 85,
  warnMin: 70,
  failBelow: 70,
} as const;

export const CONTENT_PRODUCTION_PACK_STATUS_LABELS: Record<CreviaContentPackStatus, string> = {
  draft: 'Taslak',
  qa: 'QA',
  ready: 'Hazır',
  live: 'Yayında',
  deprecated: 'Eski',
  archived: 'Arşiv',
};

export const CONTENT_PRODUCTION_ISSUE_LABELS: Record<CreviaContentIssueKind, string> = {
  missing_district_coverage: 'Mahalle kapsamı eksik',
  missing_domain_coverage: 'Domain kapsamı eksik',
  missing_variant_coverage: 'Varyant kapsamı eksik',
  missing_echo_surface: 'Echo yüzeyi eksik',
  duplicate_risk: 'Tekrar riski',
  forbidden_copy: 'Yasaklı ifade',
  weak_district_identity: 'Zayıf mahalle kimliği',
  weak_tradeoff: 'Zayıf trade-off',
  weak_carry_over: 'Zayıf carry-over',
  mobile_length_risk: 'Mobil uzunluk riski',
  missing_operation_era_link: 'Operation era bağlantısı eksik',
  missing_rank_permission_link: 'Yetki bağlantısı eksik',
  missing_map_hint: 'Harita ipucu eksik',
  stale_pack: 'Eski paket',
  future_only_content: 'Future-only içerik',
};

export const CONTENT_PRODUCTION_MINIMUM_SOFT_LAUNCH_TARGETS = {
  eventFamilyFutureTarget: 70,
  variantFutureTarget: 250,
  socialMentionFutureTarget: 150,
  reportEchoFutureTarget: 120,
  mapHintFutureTarget: 80,
  miniChainFutureTarget: 15,
  rewardRecoveryFutureTarget: 30,
  crisisAdjacentFutureTarget: 20,
  districtOperationMinimum: 15,
  operationEraMinimum: 6,
} as const;

export const CONTENT_PRODUCTION_PACK_KINDS: readonly CreviaContentPackKind[] = [
  'pilot_core',
  'open_operation_core',
  'district_pack',
  'event_family_pack',
  'operation_era_pack',
  'social_echo_pack',
  'report_echo_pack',
  'map_hint_pack',
  'recovery_reward_pack',
  'crisis_adjacent_pack',
  'live_ops_theme',
  'future_expansion',
] as const;

export const CONTENT_PRODUCTION_SURFACES: readonly CreviaContentProductionSurface[] = [
  'event_family',
  'event_variant',
  'district_operation',
  'operation_era',
  'social_echo',
  'report_echo',
  'advisor_echo',
  'map_hint',
  'tomorrow_preview',
  'operation_result',
  'hub',
  'report',
  'map',
] as const;

export const CONTENT_PRODUCTION_COVERAGE_DIMENSIONS: readonly CreviaContentCoverageDimension[] = [
  'district',
  'domain',
  'variant_kind',
  'echo_surface',
  'operation_era',
  'district_operation',
  'player_style',
  'reward_recovery',
  'crisis_adjacent',
  'map_layer',
  'rank_permission',
] as const;

export const CONTENT_PRODUCTION_DUPLICATE_FAIL_THRESHOLD = 0.82;
export const CONTENT_PRODUCTION_DUPLICATE_WARN_THRESHOLD = 0.65;

export const CONTENT_PRODUCTION_VERIFY_PACK_ID = 'content_production_verify_foundation_pack';

export const CONTENT_PRODUCTION_SCORE_WEIGHTS = {
  coverage: 30,
  echoCompleteness: 25,
  duplicateSafety: 20,
  copySafety: 15,
  mobileReadability: 10,
} as const;
