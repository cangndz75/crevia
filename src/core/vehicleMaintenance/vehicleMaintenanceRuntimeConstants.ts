import type {
  VehicleFleetGroupId,
  VehicleMaintenanceWindowKind,
} from './vehicleMaintenanceRuntimeTypes';

export const VEHICLE_MAINTENANCE_V1_VERSION = 1 as const;

export const VEHICLE_MAINTENANCE_MIGRATION_FROM_SAVE_VERSION = 24;

export const VEHICLE_MAINTENANCE_TARGET_SAVE_VERSION = 25;

export const VEHICLE_MAINTENANCE_FLEET_GROUP_IDS: readonly VehicleFleetGroupId[] = [
  'light_service',
  'route_support',
  'container_support',
  'field_response',
  'backup_fleet',
] as const;

export const VEHICLE_MAINTENANCE_PLAYER_LABELS: Record<VehicleFleetGroupId, string> = {
  light_service: 'Hafif saha desteği',
  route_support: 'Rota destek ekibi',
  container_support: 'Konteyner saha ekibi',
  field_response: 'Acil saha müdahale',
  backup_fleet: 'Yedek destek hattı',
};

export const VEHICLE_MAINTENANCE_WINDOW_KIND_BY_GROUP: Record<
  VehicleFleetGroupId,
  VehicleMaintenanceWindowKind
> = {
  light_service: 'light_check',
  route_support: 'route_reset',
  container_support: 'container_vehicle_service',
  field_response: 'field_recovery',
  backup_fleet: 'route_reset',
};

export const VEHICLE_MAINTENANCE_SCORE_MAX = 100;

export const VEHICLE_MAINTENANCE_SCORE_STABLE_MAX = 24;

export const VEHICLE_MAINTENANCE_SCORE_WATCH_MAX = 44;

export const VEHICLE_MAINTENANCE_SCORE_STRAINED_MAX = 64;

export const VEHICLE_MAINTENANCE_SCORE_MAINTENANCE_DUE_MAX = 79;

export const VEHICLE_MAINTENANCE_MAX_SUGGESTED_WINDOWS_PER_DAY = 2;

export const VEHICLE_MAINTENANCE_MAX_ARCHIVE_ENTRIES_PER_DAY = 1;

export const VEHICLE_MAINTENANCE_VISIBLE_DAY_MIN = 8;

export const VEHICLE_MAINTENANCE_PASSIVE_DAY_MAX = 7;

export const VEHICLE_MAINTENANCE_COMPLETED_SCORE_REDUCTION = 20;

export const VEHICLE_MAINTENANCE_FORBIDDEN_SURFACE_TERMS = [
  'plaka',
  'gps',
  'canlı takip',
  'gerçek araç takibi',
  'araç konumu',
  'premium',
  'kilitli',
  'pack',
  'metadata',
  'runtime',
  ' ai ',
  'panik',
  'arıza felaketi',
  'takip cihazı',
  'vehicleMaintenance',
  'fleet id',
] as const;

export const VEHICLE_MAINTENANCE_ARCHIVE_KINDS = [
  'vehicle_maintenance_suggested',
  'vehicle_maintenance_completed',
  'vehicle_fatigue_warning',
  'fleet_recovered',
] as const;
