import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  DistrictOperationImpactDomain,
  DistrictOperationKind,
  DistrictOperationStatus,
} from './districtOperationTypes';

export const DISTRICT_OPERATION_KIND_LABELS: Record<DistrictOperationKind, string> = {
  visible_service: 'Görünür Hizmet',
  route_discipline: 'Rota Disiplini',
  container_network: 'Konteyner Ağı',
  public_trust: 'Halk Güveni',
  recovery_focus: 'Toparlanma Odağı',
  crisis_prevention: 'Kriz Önleme',
  resource_balance: 'Kaynak Dengesi',
  environmental_care: 'Çevre Bakımı',
  district_memory_response: 'Hafıza Yanıtı',
  operation_era_special: 'Operasyon Dönemi',
};

export const DISTRICT_OPERATION_STATUS_LABELS: Record<DistrictOperationStatus, string> = {
  unavailable: 'Uygun Değil',
  preview: 'Sırada',
  ready: 'Hazır',
  recommended: 'Öneriliyor',
  active: 'Aktif',
  completed: 'Tamamlandı',
  cooldown: 'Dinlenmede',
  future: 'İleride',
};

export const DISTRICT_OPERATION_IMPACT_DOMAIN_LABELS: Record<
  DistrictOperationImpactDomain,
  string
> = {
  container: 'Konteyner',
  vehicle_route: 'Araç/Rota',
  personnel: 'Personel',
  social: 'Sosyal',
  trust: 'Güven',
  crisis: 'Kriz',
  map: 'Harita',
  city_development: 'Şehir Gelişimi',
};

export const DISTRICT_OPERATION_FORBIDDEN_COPY_TERMS: readonly string[] = [
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

export const DISTRICT_OPERATION_MAX_VISIBLE_CANDIDATES = 3;

export const DISTRICT_OPERATION_MAX_IMPACT_CHIPS = 3;

export const DISTRICT_OPERATION_SAFE_FALLBACK_DISTRICT: MapDistrictId = 'merkez';

export const DISTRICT_OPERATION_MIN_DAY_VISIBILITY = {
  hiddenMaxDay: 1,
  previewMaxDay: 3,
  readyMinDay: 4,
} as const;

export const DISTRICT_OPERATION_REQUIRED_PERMISSION_IDS: readonly string[] = [
  'district_specific_operations_preview',
  'district_trust_preview',
  'district_memory_trace_preview',
  'map_trust_layer',
  'active_task_route',
  'event_family_rotation_preview',
] as const;

export const DISTRICT_OPERATION_KINDS: readonly DistrictOperationKind[] = [
  'visible_service',
  'route_discipline',
  'container_network',
  'public_trust',
  'recovery_focus',
  'crisis_prevention',
  'resource_balance',
  'environmental_care',
  'district_memory_response',
  'operation_era_special',
] as const;

export const DISTRICT_OPERATION_STATUSES: readonly DistrictOperationStatus[] = [
  'unavailable',
  'preview',
  'ready',
  'recommended',
  'active',
  'completed',
  'cooldown',
  'future',
] as const;

export const DISTRICT_OPERATION_IMPACT_DOMAINS: readonly DistrictOperationImpactDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'trust',
  'crisis',
  'map',
  'city_development',
] as const;

export const DISTRICT_OPERATION_LOW_TRUST_LEVELS = ['fragile', 'watch'] as const;

export const DISTRICT_OPERATION_HIGH_TRUST_LEVELS = [
  'stable',
  'trusted',
  'supportive',
] as const;
