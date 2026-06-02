import type { PersonnelGroupId } from '@/core/operationalResources/operationalResourceTypes';
import type { PersonnelAssignmentType } from '@/core/assignments/assignmentTypes';

import type {
  TeamSpecializationCapability,
  TeamSpecializationDomain,
  TeamSpecializationFitLevel,
  TeamSpecializationGroupId,
  TeamSpecializationStatus,
} from './teamSpecializationTypes';

export const TEAM_SPECIALIZATION_GROUP_LABELS: Record<TeamSpecializationGroupId, string> = {
  field_team: 'Saha Ekibi',
  technical_team: 'Teknik Ekip',
  public_communication_team: 'Halk İletişim Ekibi',
  route_support_team: 'Rota Destek Ekibi',
  crisis_support_team: 'Kriz Destek Ekibi',
};

export const TEAM_SPECIALIZATION_DOMAIN_LABELS: Record<TeamSpecializationDomain, string> = {
  container: 'Konteyner',
  vehicle_route: 'Araç/Rota',
  personnel: 'Personel',
  social: 'Sosyal',
  crisis: 'Kriz',
  district_balance: 'Mahalle Dengesi',
  resource_recovery: 'Kaynak Toparlanması',
  public_trust: 'Halk Güveni',
  environmental_care: 'Çevre Bakımı',
  generic_operation: 'Genel Operasyon',
};

export const TEAM_SPECIALIZATION_CAPABILITY_LABELS: Record<
  TeamSpecializationCapability,
  string
> = {
  fast_response: 'Hızlı Müdahale',
  preventive_maintenance: 'Önleyici Bakım',
  route_discipline: 'Rota Disiplini',
  public_communication: 'Halk İletişimi',
  crisis_coordination: 'Kriz Koordinasyonu',
  container_network_support: 'Konteyner Ağı',
  field_execution: 'Saha Uygulaması',
  morale_stabilization: 'Moral Dengeleme',
  recovery_support: 'Toparlanma Desteği',
  district_memory_response: 'Mahalle Hafızası',
  operation_era_support: 'Operasyon Dönemi',
};

export const TEAM_SPECIALIZATION_FIT_LABELS: Record<TeamSpecializationFitLevel, string> = {
  poor: 'Zayıf Uyum',
  weak: 'Düşük Uyum',
  acceptable: 'Kabul Edilebilir',
  good: 'İyi Uyum',
  strong: 'Güçlü Uyum',
  excellent: 'Mükemmel Uyum',
};

export const TEAM_SPECIALIZATION_STATUS_LABELS: Record<TeamSpecializationStatus, string> = {
  unavailable: 'Uygun Değil',
  preview: 'Sırada',
  available: 'Kullanılabilir',
  recommended: 'Öneriliyor',
  active: 'Aktif',
  strained: 'Baskı Altında',
  future: 'İleride',
};

export const TEAM_SPECIALIZATION_FORBIDDEN_COPY_TERMS: readonly string[] = [
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

export const TEAM_SPECIALIZATION_MAX_VISIBLE_CHIPS = 3;

export const TEAM_SPECIALIZATION_SAFE_DEFAULT_GROUP: TeamSpecializationGroupId = 'field_team';

export const TEAM_SPECIALIZATION_MIN_DAY_VISIBILITY = {
  hiddenMaxDay: 1,
  previewMaxDay: 3,
  standardMinDay: 4,
} as const;

export const TEAM_SPECIALIZATION_REQUIRED_PERMISSION_IDS: readonly string[] = [
  'team_specialization_preview',
  'assignment_fit_preview',
  'resource_pressure_summary',
  'district_specific_operations_preview',
  'vehicle_maintenance_window_preview',
  'container_network_upgrade_preview',
] as const;

export const TEAM_SPECIALIZATION_GROUPS: readonly TeamSpecializationGroupId[] = [
  'field_team',
  'technical_team',
  'public_communication_team',
  'route_support_team',
  'crisis_support_team',
] as const;

export const TEAM_SPECIALIZATION_DOMAINS: readonly TeamSpecializationDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis',
  'district_balance',
  'resource_recovery',
  'public_trust',
  'environmental_care',
  'generic_operation',
] as const;

export const TEAM_SPECIALIZATION_CAPABILITIES: readonly TeamSpecializationCapability[] = [
  'fast_response',
  'preventive_maintenance',
  'route_discipline',
  'public_communication',
  'crisis_coordination',
  'container_network_support',
  'field_execution',
  'morale_stabilization',
  'recovery_support',
  'district_memory_response',
  'operation_era_support',
] as const;

export const TEAM_SPECIALIZATION_FIT_LEVELS: readonly TeamSpecializationFitLevel[] = [
  'poor',
  'weak',
  'acceptable',
  'good',
  'strong',
  'excellent',
] as const;

export const TEAM_SPECIALIZATION_STATUSES: readonly TeamSpecializationStatus[] = [
  'unavailable',
  'preview',
  'available',
  'recommended',
  'active',
  'strained',
  'future',
] as const;

/** Operational resources personel group id → specialization group id */
export const OPERATIONAL_PERSONNEL_TO_SPECIALIZATION_GROUP: Record<
  PersonnelGroupId,
  TeamSpecializationGroupId
> = {
  field_team: 'field_team',
  technical_team: 'technical_team',
  public_relations_team: 'public_communication_team',
};

/** Assignment personnel type → specialization group id */
export const ASSIGNMENT_PERSONNEL_TO_SPECIALIZATION_GROUP: Record<
  PersonnelAssignmentType,
  TeamSpecializationGroupId
> = {
  balanced_team: 'field_team',
  field_response_team: 'field_team',
  technical_team: 'technical_team',
  public_relations_team: 'public_communication_team',
  inspection_team: 'field_team',
};

export const TEAM_SPECIALIZATION_FIT_THRESHOLDS = {
  poorMax: 24,
  weakMax: 39,
  acceptableMax: 54,
  goodMax: 69,
  strongMax: 84,
} as const;
