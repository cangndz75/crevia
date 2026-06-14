import type {
  ResourcePressureCostAxis,
  ResourcePressureCostVector,
  ResourcePressureDomain,
} from './resourcePressureDifferentiationTypes';
import { mergeCopyPools } from '@/core/contentVarietyQuality';
import {
  DOMAIN_CAUTION_EXPANSION,
  DOMAIN_OPPORTUNITY_EXPANSION,
  DOMAIN_REASON_EXPANSION,
} from './resourcePressureDifferentiationCopyExpansion';

export const RESOURCE_PRESSURE_DIFFERENTIATION_MAX_PROFILES = 5;
export const RESOURCE_PRESSURE_DIFFERENTIATION_MAX_CARDS = 3;
export const RESOURCE_PRESSURE_DIFFERENTIATION_DAY_ACTIVE = 8;
export const RESOURCE_PRESSURE_DIFFERENTIATION_REASON_MAX = 110;
export const RESOURCE_PRESSURE_DIFFERENTIATION_BADGE_MAX = 24;
export const RESOURCE_PRESSURE_DIFFERENTIATION_ACCESSIBILITY_MAX = 160;

export const DOMINANT_AXIS_LABELS: Record<ResourcePressureCostAxis, string> = {
  budget: 'Bütçe',
  team: 'Ekip',
  vehicle: 'Araç',
  time: 'Zaman',
  trust: 'Güven',
  attention: 'Dikkat',
  future_risk: 'Yarın riski',
};

export const INTENSITY_LABELS = {
  low: 'Hafif',
  medium: 'Orta',
  high: 'Güçlü',
} as const;

export const DOMAIN_TITLES: Record<ResourcePressureDomain, string> = {
  general_resource: 'Kaynak dengesi',
  route_pressure: 'Rota baskısı',
  container_pressure: 'Konteyner hattı',
  social_trust_pressure: 'Sosyal güven',
  district_neglect_pressure: 'İlçe ihmal riski',
  recovery_opportunity: 'Toparlanma fırsatı',
  follow_up_pressure: 'Takip aksiyonu',
  risk_signal: 'Erken risk sinyali',
  team_capacity_pressure: 'Ekip kapasitesi',
  vehicle_strain_pressure: 'Araç yükü',
  safe_watch: 'Güvenli izleme',
  fallback: 'Genel izleme',
};

const DOMAIN_REASON_LINES_BASE: Record<ResourcePressureDomain, string[]> = {
  general_resource: [
    'Bugün kaynak ve ekip dengesini koruyan seçimler daha güvenli.',
    'Genel kaynak baskısı hem bütçe hem ekip paylaşımı ister.',
  ],
  route_pressure: [
    'Rota kararı araç ve zaman yükünü doğrudan taşır.',
    'Bu baskı hız ve rota esnekliğini önceleyen seçimler ister.',
  ],
  container_pressure: [
    'Konteyner hattı gelecekte daha pahalı hale gelmeden izlenebilir.',
    'Hat baskısı ekip ve güven paylaşımıyla büyür; saf kaynak gibi hissetmez.',
  ],
  social_trust_pressure: [
    'Sosyal güven baskısı dikkat ve güven ekseninde okunur.',
    'Bu seçim sosyal güven baskısını erken yumuşatabilir.',
  ],
  district_neglect_pressure: [
    'İhmal edilen ilçe yarın daha sert geri dönebilir.',
    'İlçe odağı ertelenirse yarın riski artar.',
  ],
  recovery_opportunity: [
    'Toparlanma fırsatı kriz müdahalesinden daha hafif maliyet taşır.',
    'Küçük bir hamle gelecek riskini düşürebilir.',
  ],
  follow_up_pressure: [
    'Bu takip düşük maliyetli ama hafıza etkisi taşır.',
    'Kısa takip hamlesi tam operasyondan daha ucuz hissedilir.',
  ],
  risk_signal: [
    'Erken sinyal doğrudan kaynak harcamaz; dikkat ve yarın riski taşır.',
    'İzleme maliyeti kaynak yerine dikkat ekseninde okunur.',
  ],
  team_capacity_pressure: [
    'Ekip kapasitesi bugün dar; dağıtım dikkat ister.',
    'Ekip yükü zaman ve dikkat paylaşımını zorlar.',
  ],
  vehicle_strain_pressure: [
    'Araç yükü rota ve bakım maliyetini birlikte büyütür.',
    'Araç baskısı zaman ve araç ekseninde yoğunlaşır.',
  ],
  safe_watch: [
    'Bugün güvenli izleme yeterli; zorlayıcı maliyet yok.',
    'Düşük baskı; acele karar gerektirmez.',
  ],
  fallback: [
    'Şehir sakin; net baskı sinyali henüz yok.',
    'Hafif izleme modu yeterli.',
  ],
};

export const DOMAIN_REASON_LINES = mergeCopyPools(
  DOMAIN_REASON_LINES_BASE,
  DOMAIN_REASON_EXPANSION,
);

const DOMAIN_OPPORTUNITY_LINES_BASE: Partial<Record<ResourcePressureDomain, string[]>> = {
  route_pressure: ['Erteleme rota yükünü yarına taşıyabilir.'],
  container_pressure: ['Hat izlenmezse gelecek maliyet artabilir.'],
  social_trust_pressure: ['Güven zayıflarsa sosyal maliyet büyür.'],
  recovery_opportunity: ['Küçük hamle yarın riskini düşürebilir.'],
  follow_up_pressure: ['Takip edilmezse iz kalıcılaşabilir.'],
  risk_signal: ['Sinyal görmezden gelinirse yarın riski artar.'],
};

export const DOMAIN_OPPORTUNITY_LINES = mergeCopyPools(
  DOMAIN_OPPORTUNITY_LINES_BASE as Record<ResourcePressureDomain, string[]>,
  DOMAIN_OPPORTUNITY_EXPANSION as Partial<Record<ResourcePressureDomain, string[]>>,
);

export const DOMAIN_CAUTION_LINES = mergeCopyPools(
  {} as Record<ResourcePressureDomain, string[]>,
  DOMAIN_CAUTION_EXPANSION,
);

export const DOMAIN_BASE_VECTORS: Record<ResourcePressureDomain, ResourcePressureCostVector> = {
  general_resource: {
    budget: 55,
    team: 55,
    vehicle: 40,
    time: 55,
    trust: 25,
    attention: 55,
    futureRisk: 55,
  },
  route_pressure: {
    budget: 45,
    team: 55,
    vehicle: 85,
    time: 80,
    trust: 40,
    attention: 55,
    futureRisk: 65,
  },
  container_pressure: {
    budget: 45,
    team: 55,
    vehicle: 55,
    time: 55,
    trust: 55,
    attention: 55,
    futureRisk: 80,
  },
  social_trust_pressure: {
    budget: 25,
    team: 45,
    vehicle: 20,
    time: 55,
    trust: 85,
    attention: 80,
    futureRisk: 80,
  },
  district_neglect_pressure: {
    budget: 55,
    team: 55,
    vehicle: 45,
    time: 55,
    trust: 65,
    attention: 75,
    futureRisk: 85,
  },
  recovery_opportunity: {
    budget: 30,
    team: 40,
    vehicle: 15,
    time: 45,
    trust: 60,
    attention: 55,
    futureRisk: 25,
  },
  follow_up_pressure: {
    budget: 25,
    team: 25,
    vehicle: 15,
    time: 30,
    trust: 40,
    attention: 40,
    futureRisk: 35,
  },
  risk_signal: {
    budget: 15,
    team: 15,
    vehicle: 15,
    time: 35,
    trust: 25,
    attention: 55,
    futureRisk: 70,
  },
  team_capacity_pressure: {
    budget: 40,
    team: 85,
    time: 55,
    vehicle: 35,
    trust: 30,
    attention: 55,
    futureRisk: 55,
  },
  vehicle_strain_pressure: {
    budget: 55,
    team: 45,
    vehicle: 85,
    time: 70,
    trust: 35,
    attention: 50,
    futureRisk: 70,
  },
  safe_watch: {
    budget: 15,
    team: 15,
    vehicle: 10,
    time: 20,
    trust: 20,
    attention: 25,
    futureRisk: 20,
  },
  fallback: {
    budget: 20,
    team: 20,
    vehicle: 15,
    time: 25,
    trust: 20,
    attention: 25,
    futureRisk: 25,
  },
};

export const DOMAIN_PRIORITY_BASE: Record<ResourcePressureDomain, number> = {
  district_neglect_pressure: 92,
  route_pressure: 88,
  container_pressure: 86,
  social_trust_pressure: 84,
  vehicle_strain_pressure: 82,
  team_capacity_pressure: 80,
  general_resource: 78,
  risk_signal: 76,
  recovery_opportunity: 74,
  follow_up_pressure: 72,
  safe_watch: 40,
  fallback: 30,
};

export const DOMAIN_AXIS_PREFERENCE: Partial<Record<ResourcePressureDomain, ResourcePressureCostAxis[]>> = {
  route_pressure: ['vehicle', 'time', 'future_risk', 'team', 'attention', 'budget', 'trust'],
  social_trust_pressure: ['trust', 'attention', 'future_risk', 'time', 'team', 'budget', 'vehicle'],
  container_pressure: ['future_risk', 'trust', 'attention', 'team', 'vehicle', 'time', 'budget'],
  risk_signal: ['future_risk', 'attention', 'time', 'trust', 'budget', 'team', 'vehicle'],
};

export const OPERATION_FEED_COST_REASON_BY_BIAS: Record<string, string> = {
  route_pressure_bias: 'Bu operasyon rota ve zaman yükünü azaltabileceği için öne çıkıyor.',
  container_pressure_bias: 'Konteyner hattı gelecekte daha pahalı hale gelmeden izlenebilir.',
  social_trust_bias: 'Bu seçim sosyal güven baskısını erken yumuşatabilir.',
  follow_up_bias: 'Bu takip düşük maliyetli ama hafıza etkisi taşır.',
  district_recovery_bias: 'Toparlanma fırsatı kriz müdahalesinden daha hafif maliyet taşır.',
  resource_pressure_bias: 'Kaynak dengesi bugün ekip ve bütçe paylaşımı ister.',
  defer_risk_bias: 'Erteleme yarın riskini büyütebilir; maliyet ekseni farklı okunur.',
  district_neglect_bias: 'İhmal edilen ilçe yarın daha sert geri dönebilir.',
};

export const TECHNICAL_ENUM_PATTERN = /\b[a-z]+_[a-z_]+\b/;
