import type {
  OperationEraCadence,
  OperationEraContentHook,
  OperationEraFocusDomain,
  OperationEraStatus,
} from './operationEraTypes';

export const OPERATION_ERA_STATUS_LABELS: Record<OperationEraStatus, string> = {
  unavailable: 'Uygun Değil',
  preview: 'Sırada',
  available: 'Hazır',
  recommended: 'Öneriliyor',
  active: 'Aktif Dönem',
  cooling_down: 'Dinlenmede',
  completed_review: 'Dönem Özeti',
  future: 'İleride',
};

export const OPERATION_ERA_CADENCE_LABELS: Record<OperationEraCadence, string> = {
  milestone_based: 'Milestone Bazlı',
  weekly_theme: 'Haftalık Tema',
  biweekly_theme: 'İki Haftalık Tema',
  monthly_theme: 'Aylık Tema',
  rank_unlock: 'Ünvan Açılımı',
  content_pack: 'İçerik Paketi',
  future_live_ops: 'İleride Canlı Operasyon',
};

export const OPERATION_ERA_FOCUS_DOMAIN_LABELS: Record<OperationEraFocusDomain, string> = {
  core_operations: 'Temel Operasyon',
  vehicle_route: 'Araç / Rota',
  container_network: 'Konteyner Ağı',
  personnel_team: 'Ekip Uzmanlığı',
  district_trust: 'Mahalle Güveni',
  crisis_recovery: 'Kriz / Toparlanma',
  social_pulse: 'Sosyal Nabız',
  city_development: 'Şehir Gelişimi',
  content_expansion: 'İçerik Genişlemesi',
  operation_efficiency: 'Operasyon Verimliliği',
};

export const OPERATION_ERA_CONTENT_HOOK_LABELS: Record<OperationEraContentHook, string> = {
  event_family: 'Olay Ailesi',
  district_operation: 'Mahalle Operasyonu',
  map_layer: 'Harita Katmanı',
  active_task_route: 'Aktif Rota',
  team_specialization: 'Ekip Uzmanlığı',
  vehicle_maintenance: 'Araç Bakımı',
  container_network: 'Konteyner Ağı',
  district_trust: 'Mahalle Güveni',
  advisor_note: 'Danışman Notu',
  social_pulse: 'Sosyal Nabız',
  report_review: 'Rapor Değerlendirme',
  city_development: 'Şehir Gelişimi',
};

export const OPERATION_ERA_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun bitti',
  'yeni sezona başla',
  'final sezon',
  'season completed',
  'premium al',
  'paywall',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
] as const;

export const OPERATION_ERA_SCORE_RANGE = { min: 0, max: 100 } as const;

export const OPERATION_ERA_MIN_DAY_VISIBILITY = {
  pilotHiddenMaxDay: 7,
  previewMinDay: 8,
  availableMinDay: 8,
} as const;

export const OPERATION_ERA_REQUIRED_PERMISSION_IDS: readonly string[] = [
  'operation_era_preview',
  'event_family_rotation_preview',
  'district_specific_operations_preview',
  'map_resource_layer',
  'map_trust_layer',
  'vehicle_maintenance_window_preview',
  'container_network_upgrade_preview',
  'city_development_preview',
] as const;

export const OPERATION_ERA_MAX_VISIBLE_CANDIDATES = 3;
export const OPERATION_ERA_MAX_VISIBLE_CHIPS = 3;

export const OPERATION_ERA_SAFE_FALLBACK_SCORE = {
  readiness: 35,
  relevance: 40,
} as const;

export const OPERATION_ERA_IS_TERMINAL_GAME_STATE = false;

export const OPERATION_ERA_PLAYER_COPY_RULES: readonly string[] = [
  'Era oyuncu kariyerini kapatmaz.',
  'Era içerik/tema odağıdır.',
  'Era bittiğinde oyun bitmez; sadece dönemsel değerlendirme üretilebilir.',
  'Daily live-ops zorunlu değildir.',
] as const;

export const OPERATION_ERA_STATUSES: readonly OperationEraStatus[] = [
  'unavailable',
  'preview',
  'available',
  'recommended',
  'active',
  'cooling_down',
  'completed_review',
  'future',
] as const;

export const OPERATION_ERA_CADENCES: readonly OperationEraCadence[] = [
  'milestone_based',
  'weekly_theme',
  'biweekly_theme',
  'monthly_theme',
  'rank_unlock',
  'content_pack',
  'future_live_ops',
] as const;

export const OPERATION_ERA_FOCUS_DOMAINS: readonly OperationEraFocusDomain[] = [
  'core_operations',
  'vehicle_route',
  'container_network',
  'personnel_team',
  'district_trust',
  'crisis_recovery',
  'social_pulse',
  'city_development',
  'content_expansion',
  'operation_efficiency',
] as const;

export const OPERATION_ERA_CONTENT_HOOKS: readonly OperationEraContentHook[] = [
  'event_family',
  'district_operation',
  'map_layer',
  'active_task_route',
  'team_specialization',
  'vehicle_maintenance',
  'container_network',
  'district_trust',
  'advisor_note',
  'social_pulse',
  'report_review',
  'city_development',
] as const;

export const OPERATION_ERA_PILOT_MAX_DAY = 7;
