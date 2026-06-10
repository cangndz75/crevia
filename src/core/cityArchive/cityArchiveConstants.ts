import type { CityArchiveEntryKind, CityArchiveEntrySourceKind } from './cityArchiveTypes';

export const CITY_ARCHIVE_V1_VERSION = 1 as const;

export const CITY_ARCHIVE_ENTRY_KINDS: CityArchiveEntryKind[] = [
  'decision_record',
  'district_shift',
  'trust_recovery',
  'route_balanced',
  'container_relief',
  'resource_pressure',
  'resource_recovery',
  'social_response',
  'crisis_prevented',
  'main_operation_started',
  'comeback_available',
  'comeback_completed',
  'ece_prediction_confirmed',
  'story_chain_step',
  'report_milestone',
  'vehicle_maintenance_suggested',
  'vehicle_maintenance_completed',
  'vehicle_fatigue_warning',
  'fleet_recovered',
  'team_specialization_gained',
  'team_fatigue_warning',
  'team_morale_recovered',
  'team_domain_mastery',
  'backup_team_overused',
];

export const CITY_ARCHIVE_MAX_DAILY_APPEND = 3;
export const CITY_ARCHIVE_DAY1_MAX_APPEND = 1;
export const CITY_ARCHIVE_MAX_ENTRIES = 120;
export const CITY_ARCHIVE_MAX_ENTRIES_PER_DISTRICT = 20;
export const CITY_ARCHIVE_KEEP_LAST_N_DAYS_DETAILED = 10;

export const CITY_ARCHIVE_PRESERVED_KINDS = new Set<CityArchiveEntryKind>([
  'story_chain_step',
  'main_operation_started',
  'comeback_completed',
  'ece_prediction_confirmed',
]);

export const CITY_ARCHIVE_FORBIDDEN_STORED_FIELDS = [
  'raw_event_body',
  'full_raw_save',
  'pii',
  'gps',
  'payment',
  'analytics_raw',
  'debug',
  'ai_prompt',
  'ai_response',
  'coordinates',
  'plaka',
  'email',
  'phone',
] as const;

export const CITY_ARCHIVE_FORBIDDEN_COPY_WORDS = [
  'gps',
  'canlı takip',
  'plaka',
  'gerçek konum',
  'ödeme',
  'satın al',
  'premium',
  'pack',
  'metadata',
  'runtime',
  'panik',
  'alarm',
] as const;

export const CITY_ARCHIVE_ENTRY_KIND_LABELS: Record<CityArchiveEntryKind, string> = {
  decision_record: 'Karar kaydı',
  district_shift: 'Mahalle değişimi',
  trust_recovery: 'Güven toparlanması',
  route_balanced: 'Rota dengesi',
  container_relief: 'Konteyner rahatlaması',
  resource_pressure: 'Kaynak baskısı',
  resource_recovery: 'Kaynak toparlanması',
  social_response: 'Sosyal tepki',
  crisis_prevented: 'Kriz önlendi',
  main_operation_started: 'Ana operasyon başladı',
  comeback_available: 'Toparlanma fırsatı',
  comeback_completed: 'Toparlanma tamamlandı',
  ece_prediction_confirmed: 'Ece öngörüsü',
  story_chain_step: 'Hikâye adımı',
  report_milestone: 'Rapor dönüm noktası',
  vehicle_maintenance_suggested: 'Bakım penceresi',
  vehicle_maintenance_completed: 'Araç bakım izi',
  vehicle_fatigue_warning: 'Araç bakım izi',
  fleet_recovered: 'Filo toparlandı',
  team_specialization_gained: 'Ekip izi',
  team_fatigue_warning: 'Ekip yorgunluğu',
  team_morale_recovered: 'Ekip toparlandı',
  team_domain_mastery: 'Ekip gelişimi',
  backup_team_overused: 'Yedek ekip izi',
};

export const CITY_ARCHIVE_BACKFILL_MAX = 3;

export const CITY_ARCHIVE_MIGRATION_FROM_SAVE_VERSION = 24;
export const CITY_ARCHIVE_TARGET_SAVE_VERSION = 24;
export const CITY_ARCHIVE_CURRENT_SAVE_VERSION = 24;
