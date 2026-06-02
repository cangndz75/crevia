import type {
  VehicleMaintenanceRiskLevel,
  VehicleMaintenanceTradeoffType,
  VehicleMaintenanceWindowKind,
  VehicleMaintenanceWindowStatus,
} from './vehicleMaintenanceTypes';

export const VEHICLE_MAINTENANCE_STATUS_LABELS: Record<
  VehicleMaintenanceWindowStatus,
  string
> = {
  unavailable: 'Uygun Değil',
  preview: 'Sırada',
  open: 'Bakım Penceresi Açık',
  recommended: 'Öneriliyor',
  urgent: 'Öncelikli',
  deferred: 'Ertelendi',
  completed: 'Tamamlandı',
  cooldown: 'Dinlenmede',
  future: 'İleride',
};

export const VEHICLE_MAINTENANCE_RISK_LABELS: Record<VehicleMaintenanceRiskLevel, string> = {
  low: 'Düşük',
  moderate: 'Orta',
  elevated: 'Yükseliyor',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const VEHICLE_MAINTENANCE_KIND_LABELS: Record<VehicleMaintenanceWindowKind, string> = {
  preventive_check: 'Önleyici Kontrol',
  route_load_rebalance: 'Rota Yükü Dengeleme',
  fatigue_recovery: 'Yorgunluk Toparlanması',
  technical_inspection: 'Teknik İnceleme',
  emergency_stabilization: 'Acil Dengeleme',
  capacity_planning: 'Kapasite Planlama',
  operation_era_maintenance: 'Operasyon Dönemi Bakımı',
  future_upgrade: 'Gelecek Yükseltme',
};

export const VEHICLE_MAINTENANCE_TRADEOFF_LABELS: Record<
  VehicleMaintenanceTradeoffType,
  string
> = {
  protect_tomorrow: 'Yarını Koru',
  push_today: 'Bugünü Zorla',
  rebalance_route: 'Rotayı Dengele',
  assign_technical_team: 'Teknik Ekibi Kullan',
  monitor_only: 'İzlemeye Al',
  crisis_prevention: 'Krizi Önle',
};

export const VEHICLE_MAINTENANCE_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'yeni sezona başla',
  'premium al',
  'paywall',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
] as const;

export const VEHICLE_MAINTENANCE_SCORE_RANGE = {
  min: 0,
  max: 100,
} as const;

export const VEHICLE_MAINTENANCE_RISK_THRESHOLDS = {
  lowMax: 24,
  moderateMax: 44,
  elevatedMax: 64,
  highMax: 84,
} as const;

export const VEHICLE_MAINTENANCE_MIN_DAY_VISIBILITY = {
  hiddenMaxDay: 1,
  previewMaxDay: 2,
  openMinDay: 3,
} as const;

export const VEHICLE_MAINTENANCE_REQUIRED_PERMISSION_IDS: readonly string[] = [
  'vehicle_maintenance_window_preview',
  'resource_pressure_summary',
  'map_resource_layer',
  'assignment_fit_preview',
  'team_specialization_preview',
  'district_specific_operations_preview',
] as const;

export const VEHICLE_MAINTENANCE_MAX_VISIBLE_CHIPS = 3;

export const VEHICLE_MAINTENANCE_SAFE_FALLBACK_SCORE = {
  readiness: 45,
  urgency: 35,
} as const;

export const VEHICLE_MAINTENANCE_WINDOW_STATUSES: readonly VehicleMaintenanceWindowStatus[] = [
  'unavailable',
  'preview',
  'open',
  'recommended',
  'urgent',
  'deferred',
  'completed',
  'cooldown',
  'future',
] as const;

export const VEHICLE_MAINTENANCE_RISK_LEVELS: readonly VehicleMaintenanceRiskLevel[] = [
  'low',
  'moderate',
  'elevated',
  'high',
  'critical',
] as const;

export const VEHICLE_MAINTENANCE_WINDOW_KINDS: readonly VehicleMaintenanceWindowKind[] = [
  'preventive_check',
  'route_load_rebalance',
  'fatigue_recovery',
  'technical_inspection',
  'emergency_stabilization',
  'capacity_planning',
  'operation_era_maintenance',
  'future_upgrade',
] as const;

export const VEHICLE_MAINTENANCE_TRADEOFF_TYPES: readonly VehicleMaintenanceTradeoffType[] = [
  'protect_tomorrow',
  'push_today',
  'rebalance_route',
  'assign_technical_team',
  'monitor_only',
  'crisis_prevention',
] as const;

export const VEHICLE_MAINTENANCE_PRESSURE_DOMAINS = [
  'vehicle_route',
  'resource_fatigue',
  'personnel',
  'container',
  'crisis',
  'district_balance',
  'generic',
] as const;
