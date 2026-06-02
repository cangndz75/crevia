import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  CreviaDistrictOperationRuntimeHealthStatus,
  CreviaDistrictOperationRuntimeKind,
  CreviaDistrictOperationRuntimeKindDefinition,
} from './districtOperationsRuntimeTypes';

export const DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY = 1;
export const DISTRICT_OPERATIONS_RUNTIME_MAX_COPY_LENGTH = 88;
export const DISTRICT_OPERATIONS_RUNTIME_MOBILE_COPY_LENGTH = 72;
export const DISTRICT_OPERATIONS_RUNTIME_MAX_RECOMMENDATIONS = 2;

export const DISTRICT_OPERATIONS_RUNTIME_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun sonu',
  'oyun bitti',
  'panik',
  'felaket',
  'çöküş',
  'başarısız',
  'premium al',
  'paywall',
] as const;

export const DISTRICT_OPERATIONS_RUNTIME_PANIC_TERMS: readonly string[] = [
  'panik',
  'felaket',
  'çöküş',
  'başarısız',
] as const;

function def(
  kind: CreviaDistrictOperationRuntimeKind,
  districtId: MapDistrictId,
  label: string,
  shortLabel: string,
  domainFocus: string[],
  intents: {
    trust: string;
    memory: string;
    resource: string;
    map: string;
    report: string;
    advisor: string;
    tomorrow: string;
  },
  variantBias: readonly string[],
  foundationKind?: string,
): CreviaDistrictOperationRuntimeKindDefinition {
  return {
    kind,
    label,
    shortLabel,
    districtId,
    domainFocus,
    trustIntent: intents.trust,
    memoryIntent: intents.memory,
    resourceIntent: intents.resource,
    recommendedVariantBias: variantBias as CreviaDistrictOperationRuntimeKindDefinition['recommendedVariantBias'],
    mapHintIntent: intents.map,
    reportHintIntent: intents.report,
    advisorHintIntent: intents.advisor,
    tomorrowHintIntent: intents.tomorrow,
    maxCopyLength: DISTRICT_OPERATIONS_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_OPERATIONS_RUNTIME_FORBIDDEN_COPY_TERMS,
    foundationKind,
  };
}

export const DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG: readonly CreviaDistrictOperationRuntimeKindDefinition[] = [
  def('visible_service', 'merkez', 'Görünür Hizmet', 'Görünür', ['social', 'generic_operation'], {
    trust: 'stable visibility',
    memory: 'quiet follow-up',
    resource: 'balanced staffing',
    map: 'Merkezde görünür hizmet odağı öneriliyor.',
    report: 'Merkez — kamu alanlarında görünür hizmet dengesi korunmalı.',
    advisor: 'Merkez prestij baskısında görünür adımlar etkili olur.',
    tomorrow: 'Görünür hizmet yarın da öncelikli kalabilir.',
  }, ['normal', 'improved'], 'visible_service'),
  def('public_flow', 'merkez', 'Kamu Akışı', 'Akış', ['social', 'vehicle_route'], {
    trust: 'flow stability',
    memory: 'crowd timing',
    resource: 'route balance',
    map: 'Merkez akışında rota ve kamu alanı koordinasyonu öneriliyor.',
    report: 'Merkez — yoğun akışta rota disiplini desteklenmeli.',
    advisor: 'Akış yoğunluğunda küçük rota düzenlemeleri işe yarar.',
    tomorrow: 'Akış baskısı yarın tekrar görünebilir.',
  }, ['normal', 'district_trust'], 'resource_balance'),
  def('rapid_response', 'merkez', 'Hızlı Müdahale', 'Müdahale', ['generic_operation', 'personnel'], {
    trust: 'rapid trust repair',
    memory: 'carry_over response',
    resource: 'quick dispatch',
    map: 'Merkezde hızlı müdahale penceresi açık.',
    report: 'Merkez — hızlı müdahale görünürlüğü artırabilir.',
    advisor: 'Kısa müdahale penceresi prestij etkisini yönetir.',
    tomorrow: 'Hızlı müdahale yarın da gerekebilir.',
  }, ['carry_over', 'improved'], 'visible_service'),

  def('social_trust_repair', 'cumhuriyet', 'Sosyal Güven Onarımı', 'Güven Onarımı', ['social', 'district_balance'], {
    trust: 'fragile recovery',
    memory: 'trust_shift',
    resource: 'social focus',
    map: 'Cumhuriyet’te sosyal güven onarımı öneriliyor.',
    report: 'Cumhuriyet — sosyal güven onarımı öncelikli.',
    advisor: 'Konut çevresinde iletişim tonu güveni destekler.',
    tomorrow: 'Güven onarımı yarın da sürebilir.',
  }, ['district_trust', 'comeback'], 'public_trust'),
  def('bulky_waste_control', 'cumhuriyet', 'Hacimli Atık Kontrolü', 'Atık Kontrolü', ['container', 'social'], {
    trust: 'service visibility',
    memory: 'repeated pressure',
    resource: 'container focus',
    map: 'Cumhuriyet’te hacimli atık kontrolü öneriliyor.',
    report: 'Cumhuriyet — hacimli atık düzeni sosyal algıyı etkiler.',
    advisor: 'Konteyner düzeni konut çevresinde güveni destekler.',
    tomorrow: 'Atık kontrolü yarın da izlenebilir.',
  }, ['normal', 'resource_fatigue'], 'container_network'),
  def('night_pressure_softening', 'cumhuriyet', 'Gece Baskısı Yumuşatma', 'Gece Baskısı', ['social', 'resource_recovery'], {
    trust: 'watch recovery',
    memory: 'recovery_window',
    resource: 'night staffing',
    map: 'Cumhuriyet’te gece baskısı yumuşatma öneriliyor.',
    report: 'Cumhuriyet — gece operasyon tonu dengelenmeli.',
    advisor: 'Gece operasyonlarında sakin tempo güveni korur.',
    tomorrow: 'Gece baskısı yarın da görünür olabilir.',
  }, ['comeback', 'district_trust'], 'recovery_focus'),

  def('route_efficiency', 'sanayi', 'Rota Verimliliği', 'Rota Verimi', ['vehicle_route', 'personnel'], {
    trust: 'operational stability',
    memory: 'resource_strain',
    resource: 'route relief',
    map: 'Sanayi rotasında verimlilik öneriliyor.',
    report: 'Sanayi — rota verimliliği kaynak baskısını azaltır.',
    advisor: 'Rota disiplini Sanayi’de maliyeti düşürür.',
    tomorrow: 'Rota baskısı yarın devam edebilir.',
  }, ['resource_fatigue', 'normal'], 'route_discipline'),
  def('vehicle_flow', 'sanayi', 'Araç Akışı', 'Araç Akışı', ['vehicle_route', 'container'], {
    trust: 'flow stability',
    memory: 'repeated_pressure',
    resource: 'vehicle maintenance',
    map: 'Sanayi araç akışında denge öneriliyor.',
    report: 'Sanayi — araç akışı operasyon maliyetini etkiler.',
    advisor: 'Araç yükünü dengelemek Sanayi’de kritik.',
    tomorrow: 'Araç akışı yarın da izlenmeli.',
  }, ['resource_fatigue', 'carry_over'], 'route_discipline'),
  def('industrial_waste_pressure', 'sanayi', 'Endüstriyel Atık Baskısı', 'Atık Baskısı', ['container', 'resource_recovery'], {
    trust: 'pressure watch',
    memory: 'repeated_pressure',
    resource: 'container network',
    map: 'Sanayi atık baskısında kontrollü operasyon öneriliyor.',
    report: 'Sanayi — endüstriyel atık baskısı görünür.',
    advisor: 'Atık akışını dengelemek operasyonu rahatlatır.',
    tomorrow: 'Atık baskısı yarın tekrar öne çıkabilir.',
  }, ['resource_fatigue', 'comeback'], 'container_network'),

  def('transfer_flow', 'istasyon', 'Transfer Akışı', 'Transfer', ['vehicle_route', 'personnel'], {
    trust: 'crowd timing',
    memory: 'operation_followup',
    resource: 'transfer balance',
    map: 'İstasyon transfer akışında koordinasyon öneriliyor.',
    report: 'İstasyon — transfer akışı yoğunluğu yönetilmeli.',
    advisor: 'Transfer penceresinde tempo kritik.',
    tomorrow: 'Transfer akışı yarın da yoğun olabilir.',
  }, ['normal', 'carry_over'], 'route_discipline'),
  def('crowd_timing', 'istasyon', 'Kalabalık Zamanlaması', 'Kalabalık', ['social', 'personnel'], {
    trust: 'public flow',
    memory: 'social_echo',
    resource: 'staff timing',
    map: 'İstasyon kalabalık zamanlaması öneriliyor.',
    report: 'İstasyon — kalabalık zamanlaması operasyonu etkiler.',
    advisor: 'Yoğun saatlerde küçük adımlar etkili olur.',
    tomorrow: 'Kalabalık penceresi yarın da açık.',
  }, ['district_trust', 'normal'], 'visible_service'),
  def('route_coordination', 'istasyon', 'Rota Koordinasyonu', 'Koordinasyon', ['vehicle_route', 'generic_operation'], {
    trust: 'route stability',
    memory: 'repeated_pressure',
    resource: 'route rebalance',
    map: 'İstasyon rota koordinasyonu öneriliyor.',
    report: 'İstasyon — rota koordinasyonu transferi destekler.',
    advisor: 'Rota koordinasyonu gecikmeyi azaltır.',
    tomorrow: 'Koordinasyon yarın da gerekli olabilir.',
  }, ['resource_fatigue', 'improved'], 'resource_balance'),

  def('environmental_care', 'yesilvadi', 'Çevre Bakımı', 'Çevre', ['social', 'container'], {
    trust: 'quiet service',
    memory: 'quiet_stable',
    resource: 'environmental balance',
    map: 'Yeşilvadi çevre bakımı odağı öneriliyor.',
    report: 'Yeşilvadi — çevre bakımı sakin operasyonu destekler.',
    advisor: 'Çevre bakımı mahalle algısını güçlendirir.',
    tomorrow: 'Çevre odağı yarın da sürdürülebilir.',
  }, ['improved', 'reward'], 'environmental_care'),
  def('container_balance', 'yesilvadi', 'Konteyner Dengesi', 'Konteyner', ['container', 'district_balance'], {
    trust: 'balance recovery',
    memory: 'recovery_window',
    resource: 'container network',
    map: 'Yeşilvadi konteyner dengesi öneriliyor.',
    report: 'Yeşilvadi — konteyner dengesi görünür kalmalı.',
    advisor: 'Konteyner düzeni Yeşilvadi’de güveni destekler.',
    tomorrow: 'Konteyner dengesi yarın da izlenmeli.',
  }, ['comeback', 'district_trust'], 'container_network'),
  def('low_noise_service', 'yesilvadi', 'Düşük Gürültülü Hizmet', 'Sakin Hizmet', ['social', 'resource_recovery'], {
    trust: 'trusted calm',
    memory: 'recent_improvement',
    resource: 'quiet staffing',
    map: 'Yeşilvadi sakin hizmet tonu öneriliyor.',
    report: 'Yeşilvadi — düşük gürültülü hizmet tonu korunmalı.',
    advisor: 'Sakin tempo Yeşilvadi güvenini destekler.',
    tomorrow: 'Sakin hizmet yarın da tercih edilebilir.',
  }, ['reward', 'improved'], 'environmental_care'),
] as const;

export const DISTRICT_OPERATIONS_RUNTIME_SCORE_WEIGHTS = {
  trustMatch: 18,
  memoryMatch: 16,
  resourceMatch: 14,
  eraBonus: 10,
  domainMatch: 8,
  freshnessPenalty: 12,
  tutorialFallback: 0,
} as const;

export function getDistrictOperationRuntimeKindDefinition(
  kind: CreviaDistrictOperationRuntimeKind,
): CreviaDistrictOperationRuntimeKindDefinition | undefined {
  return DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG.find((d) => d.kind === kind);
}

export function getDistrictOperationRuntimeKindsForDistrict(
  districtId: MapDistrictId,
): CreviaDistrictOperationRuntimeKindDefinition[] {
  return DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG.filter((d) => d.districtId === districtId);
}

export function resolveDistrictOperationsRuntimeHealthStatus(
  districts: readonly { isFallback: boolean }[],
): CreviaDistrictOperationRuntimeHealthStatus {
  if (districts.every((d) => d.isFallback)) return 'fallback';
  return 'healthy';
}
