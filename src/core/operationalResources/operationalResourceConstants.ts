import { CANONICAL_NEIGHBORHOOD_IDS } from '@/core/neighborhoodIdentity/neighborhoodIdentityConstants';

import type {
  PersonnelGroupId,
  PersonnelGroupState,
  VehicleGroupId,
  VehicleGroupState,
  DistrictContainerNetworkState,
  OperationalResourceStatus,
} from './operationalResourceTypes';

export const OPERATIONAL_RESOURCE_UI_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'satın al',
  'kilitli',
] as const;

export const OPERATIONAL_RESOURCE_MAX_LINE_LENGTH = 120;
export const OPERATIONAL_RESOURCE_HUB_MAX_ROWS = 3;
export const OPERATIONAL_RESOURCE_REPORT_MAX_LINES = 3;

export const OPERATIONAL_RESOURCE_STATUS_THRESHOLDS = {
  stableMax: 34,
  busyMax: 59,
  strainedMax: 79,
} as const;

export const OPERATIONAL_RESOURCE_STATUS_LABELS: Record<
  OperationalResourceStatus,
  string
> = {
  stable: 'Dengeli',
  busy: 'Yoğun',
  strained: 'Baskı altında',
  critical: 'Kritik eşik',
};

export const OPERATIONAL_RESOURCE_HUB_COPY = {
  title: 'Saha Kaynakları',
  subtitle: 'Ekip, filo ve konteyner ağı',
  personnelPrefix: 'Personel',
  vehiclePrefix: 'Araç',
  containerPrefix: 'Konteyner',
  detailCta: 'Kaynakları Gör',
} as const;

export const OPERATIONAL_RESOURCE_DETAIL_COPY = {
  close: 'Kapat',
  footerNote:
    'Kaynaklar ekip, filo ve mahalle konteyner ağı düzeyinde izlenir; bugünkü plan ve atamayı etkiler.',
  tabPersonnel: 'Ekipler',
  tabVehicles: 'Araçlar',
  tabContainers: 'Konteyner',
} as const;

export const OPERATIONAL_RESOURCE_REPORT_COPY = {
  title: 'Saha Kaynakları',
  day1Educational:
    'Kaynak dengesi sonraki günlerde rapora daha net yansır.',
} as const;

export const PERSONNEL_GROUP_DEFINITIONS: Record<
  PersonnelGroupId,
  Pick<PersonnelGroupState, 'label' | 'summary' | 'specialtyTags'>
> = {
  field_team: {
    label: 'Saha Ekibi',
    summary: 'Hızlı müdahale ve günlük operasyon akışı.',
    specialtyTags: ['field_response', 'rapid_response', 'districts'],
  },
  technical_team: {
    label: 'Teknik Ekip',
    summary: 'Bakım, konteyner ve araç kaynaklı sorunlar.',
    specialtyTags: ['maintenance', 'containers', 'vehicles'],
  },
  public_relations_team: {
    label: 'Halk İletişim Ekibi',
    summary: 'Sosyal tepki, mahalle temsilcisi ve açıklama süreçleri.',
    specialtyTags: ['public_response', 'social', 'districts'],
  },
};

export const VEHICLE_GROUP_DEFINITIONS: Record<
  VehicleGroupId,
  Pick<VehicleGroupState, 'label' | 'summary' | 'specialtyTags'>
> = {
  standard_truck: {
    label: 'Standart Kamyon',
    summary: 'Dengeli toplama ve günlük saha kapasitesi.',
    specialtyTags: ['standard_collection', 'containers', 'balanced'],
  },
  maintenance_vehicle: {
    label: 'Bakım Aracı',
    summary: 'Bakım, teknik arıza ve konteyner ağı müdahaleleri.',
    specialtyTags: ['maintenance', 'technical', 'vehicles'],
  },
  route_support_vehicle: {
    label: 'Rota Destek Aracı',
    summary: 'Rota, gecikme ve İstasyon hattı destekleri.',
    specialtyTags: ['route', 'delay', 'planning'],
  },
};

export const CONTAINER_NETWORK_DISTRICT_IDS: readonly string[] =
  CANONICAL_NEIGHBORHOOD_IDS;

export const CONTAINER_NETWORK_DISTRICT_LABELS: Record<string, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

export const ALL_PERSONNEL_GROUP_IDS: PersonnelGroupId[] = [
  'field_team',
  'technical_team',
  'public_relations_team',
];

export const ALL_VEHICLE_GROUP_IDS: VehicleGroupId[] = [
  'standard_truck',
  'maintenance_vehicle',
  'route_support_vehicle',
];

export function buildDefaultContainerNetwork(
  districtId: string,
): Pick<
  DistrictContainerNetworkState,
  'districtId' | 'summary' | 'sourceTags'
> {
  const label = CONTAINER_NETWORK_DISTRICT_LABELS[districtId] ?? districtId;
  return {
    districtId,
    summary: `${label} konteyner hattı izleniyor.`,
    sourceTags: ['containers', districtId],
  };
}

/** Day 1 başlangıç — yumuşak, kritik değil */
export const DAY1_INITIAL_PERSONNEL_SCORES: Record<
  PersonnelGroupId,
  { workload: number; fatigue: number; morale: number }
> = {
  field_team: { workload: 32, fatigue: 28, morale: 62 },
  technical_team: { workload: 28, fatigue: 26, morale: 64 },
  public_relations_team: { workload: 24, fatigue: 22, morale: 66 },
};

export const DAY1_INITIAL_VEHICLE_SCORES: Record<
  VehicleGroupId,
  { capacity: number; maintenance: number; route: number }
> = {
  standard_truck: { capacity: 30, maintenance: 26, route: 28 },
  maintenance_vehicle: { capacity: 24, maintenance: 30, route: 26 },
  route_support_vehicle: { capacity: 26, maintenance: 24, route: 30 },
};

export const DAY1_INITIAL_CONTAINER_PRESSURES = {
  fill: 30,
  cleanliness: 28,
  maintenance: 26,
  social: 24,
} as const;
