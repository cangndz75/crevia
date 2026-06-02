import type {
  CreviaDistrictMemoryIntensity,
  CreviaDistrictMemoryKind,
  CreviaDistrictMemoryRuntimeHealthStatus,
} from './districtMemoryRuntimeTypes';

export const DISTRICT_MEMORY_RUNTIME_KINDS: readonly CreviaDistrictMemoryKind[] = [
  'unresolved_carry_over',
  'repeated_pressure',
  'recent_improvement',
  'recovery_window',
  'trust_shift',
  'resource_strain',
  'social_echo',
  'crisis_watch',
  'operation_followup',
  'quiet_stable',
] as const;

export const DISTRICT_MEMORY_RUNTIME_MAX_TRACES = 3;
export const DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY = 1;
export const DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH = 88;
export const DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH = 72;
export const DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND: CreviaDistrictMemoryKind = 'quiet_stable';

export const DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun sonu',
  'oyun bitti',
  'mahalle çöktü',
  'kriz patladı',
  'başarısız oldun',
  'panik',
  'felaket',
  'çöküş',
  'bedelsiz',
  'bedava kurtarma',
  'premium al',
  'paywall',
] as const;

export const DISTRICT_MEMORY_RUNTIME_PANIC_TERMS: readonly string[] = [
  'panik',
  'felaket',
  'çöküş',
  'mahalle çöktü',
  'kriz patladı',
  'başarısız',
] as const;

export type CreviaDistrictMemoryKindDefinition = {
  kind: CreviaDistrictMemoryKind;
  label: string;
  shortLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
  mapTone: 'calm' | 'neutral' | 'watch' | 'recovery';
  selectionIntent: string;
  variantBias: readonly string[];
  freshnessModifierIntent: string;
  reportCopyIntent: string;
  advisorCopyIntent: string;
  tomorrowCopyIntent: string;
  maxCopyLength: number;
  forbiddenTerms: readonly string[];
};

export const DISTRICT_MEMORY_RUNTIME_KIND_DEFINITIONS: Record<
  CreviaDistrictMemoryKind,
  CreviaDistrictMemoryKindDefinition
> = {
  unresolved_carry_over: {
    kind: 'unresolved_carry_over',
    label: 'Açık Hafıza İzi',
    shortLabel: 'Devam Eden',
    tone: 'neutral',
    mapTone: 'watch',
    selectionIntent: 'carry_over continuity, district_trust repair',
    variantBias: ['carry_over', 'district_trust'],
    freshnessModifierIntent: 'soften repeat on same unresolved thread',
    reportCopyIntent: 'Dünkü tercih bugünkü saha tonunu taşıyor.',
    advisorCopyIntent: 'Devam eden etkiyi dengeli yönetmek iyi olur.',
    tomorrowCopyIntent: 'Bugünkü adım yarınki baskıyı şekillendirebilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  repeated_pressure: {
    kind: 'repeated_pressure',
    label: 'Tekrarlayan Baskı',
    shortLabel: 'Tekrar Baskı',
    tone: 'warning',
    mapTone: 'watch',
    selectionIntent: 'recovery, comeback, resource_fatigue awareness',
    variantBias: ['comeback', 'resource_fatigue', 'district_trust'],
    freshnessModifierIntent: 'reduce same-problem family repeat',
    reportCopyIntent: 'Aynı baskı kısa aralıkta tekrar görünüyor.',
    advisorCopyIntent: 'Öncelikleri sadeleştirmek tekrarı azaltır.',
    tomorrowCopyIntent: 'Tekrarlayan baskı yarın da görünür olabilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  recent_improvement: {
    kind: 'recent_improvement',
    label: 'Son İyileşme',
    shortLabel: 'İyileşme',
    tone: 'positive',
    mapTone: 'calm',
    selectionIntent: 'reward, improved visibility',
    variantBias: ['reward', 'improved'],
    freshnessModifierIntent: 'reward spam guard active',
    reportCopyIntent: 'Son adımlar mahallede olumlu iz bıraktı.',
    advisorCopyIntent: 'Olumlu etkiyi sürdürmek mümkün.',
    tomorrowCopyIntent: 'İyileşme izi yarın da görünür kalabilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  recovery_window: {
    kind: 'recovery_window',
    label: 'Toparlanma Penceresi',
    shortLabel: 'Toparlanma',
    tone: 'positive',
    mapTone: 'recovery',
    selectionIntent: 'comeback with managed cost',
    variantBias: ['comeback', 'carry_over'],
    freshnessModifierIntent: 'soften recovery/comeback repeat penalty',
    reportCopyIntent: 'Toparlanma fırsatı açık; kaynak baskısı yönetilmeli.',
    advisorCopyIntent: 'Fırsat var ama maliyet görünür kalmalı.',
    tomorrowCopyIntent: 'Toparlanma penceresi kısa süreli olabilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: [...DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS, 'bedelsiz', 'bedava'],
  },
  trust_shift: {
    kind: 'trust_shift',
    label: 'Güven Kayması',
    shortLabel: 'Güven',
    tone: 'neutral',
    mapTone: 'neutral',
    selectionIntent: 'district_trust, social repair',
    variantBias: ['district_trust', 'comeback'],
    freshnessModifierIntent: 'moderate trust-related repeat',
    reportCopyIntent: 'Mahalle güveni operasyon tonunu etkiliyor.',
    advisorCopyIntent: 'İletişim tonu güven algısını şekillendirir.',
    tomorrowCopyIntent: 'Güven sinyali yarınki önceliği etkileyebilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  resource_strain: {
    kind: 'resource_strain',
    label: 'Kaynak Baskısı',
    shortLabel: 'Kaynak',
    tone: 'warning',
    mapTone: 'watch',
    selectionIntent: 'resource_fatigue, operational balance',
    variantBias: ['resource_fatigue', 'normal'],
    freshnessModifierIntent: 'reduce resource-strain event spam',
    reportCopyIntent: 'Kaynak yükü karar maliyetini artırıyor.',
    advisorCopyIntent: 'Kaynakları dengeli kullanmak önemli.',
    tomorrowCopyIntent: 'Kaynak baskısı yarın da etkili olabilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  social_echo: {
    kind: 'social_echo',
    label: 'Sosyal Yankı',
    shortLabel: 'Sosyal',
    tone: 'neutral',
    mapTone: 'neutral',
    selectionIntent: 'social, district_balance',
    variantBias: ['district_trust', 'normal'],
    freshnessModifierIntent: 'moderate social echo repeat',
    reportCopyIntent: 'Mahallede operasyon konuşuluyor.',
    advisorCopyIntent: 'Sosyal algı operasyon tonunu etkiler.',
    tomorrowCopyIntent: 'Sosyal yankı yarın da sürebilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  crisis_watch: {
    kind: 'crisis_watch',
    label: 'Kriz Eşiği İzleme',
    shortLabel: 'Kriz Eşiği',
    tone: 'warning',
    mapTone: 'watch',
    selectionIntent: 'crisis_adjacent controlled response',
    variantBias: ['crisis_adjacent'],
    freshnessModifierIntent: 'no panic repeat escalation',
    reportCopyIntent: 'Risk büyümeden kontrol penceresi açık.',
    advisorCopyIntent: 'Erken adım riski yönetilebilir tutar.',
    tomorrowCopyIntent: 'Kontrollü tempo yarın da önemli.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: [...DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS, ...DISTRICT_MEMORY_RUNTIME_PANIC_TERMS],
  },
  operation_followup: {
    kind: 'operation_followup',
    label: 'Operasyon Takibi',
    shortLabel: 'Takip',
    tone: 'neutral',
    mapTone: 'neutral',
    selectionIntent: 'operation continuity, carry_over',
    variantBias: ['carry_over', 'operation_era', 'normal'],
    freshnessModifierIntent: 'moderate follow-up repeat',
    reportCopyIntent: 'Önceki operasyon adımı takip bekliyor.',
    advisorCopyIntent: 'Takip adımı operasyon ritmini korur.',
    tomorrowCopyIntent: 'Takip konusu yarın gündeme gelebilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  quiet_stable: {
    kind: 'quiet_stable',
    label: 'Sakin Operasyon',
    shortLabel: 'Sakin',
    tone: 'positive',
    mapTone: 'calm',
    selectionIntent: 'low priority problem spam, optional reward',
    variantBias: ['normal', 'reward', 'improved'],
    freshnessModifierIntent: 'block problem spam on quiet district',
    reportCopyIntent: 'Mahallede belirgin baskı izi yok.',
    advisorCopyIntent: 'Sakin tempo korunabilir.',
    tomorrowCopyIntent: 'Sakin akış yarın da sürebilir.',
    maxCopyLength: DISTRICT_MEMORY_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_MEMORY_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
};

export function getDistrictMemoryRuntimeKindDefinition(
  kind: CreviaDistrictMemoryKind,
): CreviaDistrictMemoryKindDefinition {
  return DISTRICT_MEMORY_RUNTIME_KIND_DEFINITIONS[kind];
}

export function resolveDistrictMemoryRuntimeHealthStatus(
  districts: readonly { isFallback: boolean; primaryKind: CreviaDistrictMemoryKind }[],
): CreviaDistrictMemoryRuntimeHealthStatus {
  if (districts.every((d) => d.isFallback)) return 'fallback';
  if (districts.some((d) => d.primaryKind === 'crisis_watch' || d.primaryKind === 'repeated_pressure')) {
    return 'strained';
  }
  if (districts.some((d) => d.primaryKind !== 'quiet_stable' && d.primaryKind !== 'recent_improvement')) {
    return 'watch';
  }
  return 'healthy';
}

export function intensityWeight(intensity: CreviaDistrictMemoryIntensity): number {
  if (intensity === 'high') return 3;
  if (intensity === 'medium') return 2;
  return 1;
}
