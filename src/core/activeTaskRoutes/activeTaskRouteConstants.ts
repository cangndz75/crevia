import type {
  ActiveTaskRouteDomain,
  ActiveTaskRouteNode,
  ActiveTaskRoutePressure,
  ActiveTaskRouteStage,
  ActiveTaskRouteStatus,
} from './activeTaskRouteTypes';

export const ACTIVE_TASK_ROUTE_STAGES: readonly ActiveTaskRouteStage[] = [
  'planned',
  'assigned',
  'dispatch_ready',
  'en_route',
  'on_site',
  'resolving',
  'completed',
  'delayed',
  'blocked',
  'monitoring',
] as const;

export const ACTIVE_TASK_ROUTE_STATUSES: readonly ActiveTaskRouteStatus[] = [
  'inactive',
  'ready',
  'active',
  'delayed',
  'strained',
  'blocked',
  'completed',
  'preview',
] as const;

export const ACTIVE_TASK_ROUTE_PRESSURES: readonly ActiveTaskRoutePressure[] = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const ACTIVE_TASK_ROUTE_DOMAINS: readonly ActiveTaskRouteDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis',
  'district_balance',
  'generic',
] as const;

export const ACTIVE_TASK_ROUTE_STAGE_LABELS: Record<ActiveTaskRouteStage, string> = {
  planned: 'Planlandı',
  assigned: 'Atandı',
  dispatch_ready: 'Yönlendirmeye Hazır',
  en_route: 'Yolda',
  on_site: 'Sahada',
  resolving: 'Müdahale Sürüyor',
  completed: 'Tamamlandı',
  delayed: 'Gecikiyor',
  blocked: 'Engelli',
  monitoring: 'İzlemede',
};

export const ACTIVE_TASK_ROUTE_STATUS_LABELS: Record<ActiveTaskRouteStatus, string> = {
  inactive: 'Pasif',
  ready: 'Hazır',
  active: 'Aktif',
  delayed: 'Gecikmeli',
  strained: 'Baskıda',
  blocked: 'Engelli',
  completed: 'Tamamlandı',
  preview: 'Önizleme',
};

export const ACTIVE_TASK_ROUTE_PRESSURE_LABELS: Record<ActiveTaskRoutePressure, string> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const ACTIVE_TASK_ROUTE_DOMAIN_LABELS: Record<ActiveTaskRouteDomain, string> = {
  container: 'Konteyner',
  vehicle_route: 'Araç / Rota',
  personnel: 'Personel',
  social: 'Sosyal',
  crisis: 'Kriz',
  district_balance: 'Mahalle Dengesi',
  generic: 'Operasyon',
};

export const ACTIVE_TASK_ROUTE_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'premium al',
  'paywall',
  'panik',
  'felaket',
  'çöküş',
  'gerçek belediye adı',
  'gerçek kişi adı',
] as const;

export const ACTIVE_TASK_ROUTE_PLAYER_FORBIDDEN_COPY_TERMS: readonly string[] = [
  ...ACTIVE_TASK_ROUTE_FORBIDDEN_COPY_TERMS,
  'gerçek gps',
  'optimizasyon motoru',
  'pathfinding',
  'simülasyon',
] as const;

export const ACTIVE_TASK_ROUTE_SAFE_CENTER_NODE: ActiveTaskRouteNode = {
  id: 'operation_center',
  type: 'operation_center',
  title: 'Operasyon Merkezi',
  shortLabel: 'Merkez',
  description: 'Saha yönlendirmesi için güvenli başlangıç noktası.',
  iconKey: 'business-outline',
  tone: 'neutral',
};

export const ACTIVE_TASK_ROUTE_DEFAULT_STAGE_BY_PHASE = {
  plan: 'planned',
  review: 'planned',
  assign: 'dispatch_ready',
  field: 'en_route',
  result: 'completed',
} as const satisfies Record<string, ActiveTaskRouteStage>;

export const ACTIVE_TASK_ROUTE_MAX_VISIBLE_CHIPS = 3;

export const ACTIVE_TASK_ROUTE_VISIBLE_MIN_DAY = {
  hiddenOrPreview: 1,
  preview: 2,
  standard: 3,
} as const;

export const ACTIVE_TASK_ROUTE_PERMISSION_IDS = [
  'active_task_route',
  'assignment_fit_preview',
  'map_resource_layer',
] as const;
