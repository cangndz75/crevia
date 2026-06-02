import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  ContainerNetworkHealthLevel,
  ContainerNetworkImpactDomain,
  ContainerNetworkPressureLevel,
  ContainerNetworkDistrictProfile,
  ContainerNetworkUpgradeKind,
  ContainerNetworkUpgradeStatus,
} from './containerNetworkTypes';

export const CONTAINER_NETWORK_HEALTH_LABELS: Record<ContainerNetworkHealthLevel, string> = {
  fragile: 'Kırılgan',
  strained: 'Baskıda',
  functional: 'İşlevsel',
  stable: 'Dengeli',
  optimized: 'Güçlü',
  showcase: 'Örnek Ağ',
};

export const CONTAINER_NETWORK_STATUS_LABELS: Record<ContainerNetworkUpgradeStatus, string> = {
  unavailable: 'Uygun Değil',
  preview: 'Sırada',
  available: 'Hazır',
  recommended: 'Öneriliyor',
  active: 'Aktif',
  completed: 'Tamamlandı',
  cooldown: 'Dinlenmede',
  future: 'İleride',
};

export const CONTAINER_NETWORK_UPGRADE_KIND_LABELS: Record<ContainerNetworkUpgradeKind, string> = {
  capacity_rebalance: 'Kapasite Dengeleme',
  visible_clean_point: 'Görünür Temizlik Noktası',
  school_residential_order: 'Konut / Okul Çevresi Düzeni',
  industrial_heavy_use_point: 'Ağır Kullanım Noktası',
  transit_flow_support: 'Geçiş Akışı Desteği',
  environmental_sensitivity_point: 'Çevre Hassasiyeti Noktası',
  recovery_cleanup_focus: 'Toparlanma Temizliği',
  operation_era_upgrade: 'Operasyon Dönemi Geliştirmesi',
  future_smart_network: 'Akıllı Ağ Gelişimi',
};

export const CONTAINER_NETWORK_PRESSURE_LABELS: Record<ContainerNetworkPressureLevel, string> = {
  low: 'Düşük',
  moderate: 'Orta',
  elevated: 'Yükseliyor',
  high: 'Yüksek',
  critical: 'Kritik',
};

export const CONTAINER_NETWORK_IMPACT_DOMAIN_LABELS: Record<
  ContainerNetworkImpactDomain,
  string
> = {
  container: 'Konteyner',
  district_trust: 'Mahalle Güveni',
  social: 'Sosyal',
  vehicle_route: 'Araç/Rota',
  personnel: 'Personel',
  environmental_care: 'Çevre Bakımı',
  resource_recovery: 'Kaynak Toparlanması',
  city_development: 'Şehir Gelişimi',
};

export const CONTAINER_NETWORK_FORBIDDEN_COPY_TERMS: readonly string[] = [
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

export const CONTAINER_NETWORK_SCORE_RANGE = { min: 0, max: 100 } as const;

export const CONTAINER_NETWORK_HEALTH_THRESHOLDS = {
  fragileMax: 24,
  strainedMax: 39,
  functionalMax: 59,
  stableMax: 74,
  optimizedMax: 89,
} as const;

export const CONTAINER_NETWORK_PRESSURE_THRESHOLDS = {
  lowMax: 24,
  moderateMax: 44,
  elevatedMax: 64,
  highMax: 84,
} as const;

export const CONTAINER_NETWORK_MIN_DAY_VISIBILITY = {
  hiddenMaxDay: 1,
  previewMaxDay: 2,
  availableMinDay: 3,
  trustMemoryMinDay: 4,
} as const;

export const CONTAINER_NETWORK_REQUIRED_PERMISSION_IDS: readonly string[] = [
  'container_network_upgrade_preview',
  'resource_pressure_summary',
  'district_trust_preview',
  'district_specific_operations_preview',
  'map_resource_layer',
  'map_trust_layer',
] as const;

export const CONTAINER_NETWORK_MAX_VISIBLE_CHIPS = 3;

export const CONTAINER_NETWORK_SAFE_FALLBACK_SCORE = {
  health: 55,
  pressure: 35,
  readiness: 45,
  impact: 40,
} as const;

export const CONTAINER_NETWORK_SAFE_FALLBACK_DISTRICT: MapDistrictId = 'merkez';

export const CONTAINER_NETWORK_HEALTH_LEVELS: readonly ContainerNetworkHealthLevel[] = [
  'fragile',
  'strained',
  'functional',
  'stable',
  'optimized',
  'showcase',
] as const;

export const CONTAINER_NETWORK_UPGRADE_STATUSES: readonly ContainerNetworkUpgradeStatus[] = [
  'unavailable',
  'preview',
  'available',
  'recommended',
  'active',
  'completed',
  'cooldown',
  'future',
] as const;

export const CONTAINER_NETWORK_UPGRADE_KINDS: readonly ContainerNetworkUpgradeKind[] = [
  'capacity_rebalance',
  'visible_clean_point',
  'school_residential_order',
  'industrial_heavy_use_point',
  'transit_flow_support',
  'environmental_sensitivity_point',
  'recovery_cleanup_focus',
  'operation_era_upgrade',
  'future_smart_network',
] as const;

export const CONTAINER_NETWORK_PRESSURE_LEVELS: readonly ContainerNetworkPressureLevel[] = [
  'low',
  'moderate',
  'elevated',
  'high',
  'critical',
] as const;

export const CONTAINER_NETWORK_IMPACT_DOMAINS: readonly ContainerNetworkImpactDomain[] = [
  'container',
  'district_trust',
  'social',
  'vehicle_route',
  'personnel',
  'environmental_care',
  'resource_recovery',
  'city_development',
] as const;

export const DISTRICT_CONTAINER_NETWORK_PROFILES: Record<
  MapDistrictId,
  ContainerNetworkDistrictProfile
> = {
  merkez: {
    districtId: 'merkez',
    title: 'Merkez Konteyner Ağı',
    flavorLine: 'Görünür temizlik ve prestij odaklı konteyner düzeni.',
    preferredUpgradeKinds: ['visible_clean_point', 'capacity_rebalance'],
    sensitiveImpactDomains: ['container', 'social', 'district_trust'],
    pressureDomains: ['container', 'social', 'vehicle_route'],
    baseHealthOffset: 2,
    priority: 88,
  },
  cumhuriyet: {
    districtId: 'cumhuriyet',
    title: 'Cumhuriyet Konteyner Ağı',
    flavorLine: 'Konut düzeni ve okul çevresi konteyner ağı.',
    preferredUpgradeKinds: ['school_residential_order', 'recovery_cleanup_focus'],
    sensitiveImpactDomains: ['container', 'social', 'district_trust'],
    pressureDomains: ['container', 'social', 'resource_recovery'],
    priority: 90,
  },
  sanayi: {
    districtId: 'sanayi',
    title: 'Sanayi Konteyner Ağı',
    flavorLine: 'Ağır kullanım ve vardiya akışına uygun konteyner noktaları.',
    preferredUpgradeKinds: ['industrial_heavy_use_point', 'capacity_rebalance'],
    sensitiveImpactDomains: ['container', 'vehicle_route', 'personnel'],
    pressureDomains: ['container', 'vehicle_route', 'personnel'],
    priority: 86,
  },
  istasyon: {
    districtId: 'istasyon',
    title: 'İstasyon Konteyner Ağı',
    flavorLine: 'Geçiş yoğunluğu ve akış destekli konteyner düzeni.',
    preferredUpgradeKinds: ['transit_flow_support', 'visible_clean_point'],
    sensitiveImpactDomains: ['container', 'social', 'vehicle_route'],
    pressureDomains: ['container', 'vehicle_route', 'social'],
    priority: 87,
  },
  yesilvadi: {
    districtId: 'yesilvadi',
    title: 'Yeşilvadi Konteyner Ağı',
    flavorLine: 'Çevre hassasiyeti ve sakinlik odaklı konteyner ağı.',
    preferredUpgradeKinds: ['environmental_sensitivity_point', 'recovery_cleanup_focus'],
    sensitiveImpactDomains: ['container', 'environmental_care', 'district_trust'],
    pressureDomains: ['container', 'environmental_care', 'social'],
    baseHealthOffset: 4,
    priority: 85,
  },
};

export const CONTAINER_NETWORK_DISTRICT_IDS = MAP_DISTRICT_IDENTITY_IDS;

export function getDistrictContainerNetworkProfile(
  districtId: string,
): ContainerNetworkDistrictProfile {
  const normalized = districtId.toLowerCase() as MapDistrictId;
  return (
    DISTRICT_CONTAINER_NETWORK_PROFILES[normalized] ??
    DISTRICT_CONTAINER_NETWORK_PROFILES[CONTAINER_NETWORK_SAFE_FALLBACK_DISTRICT]
  );
}
