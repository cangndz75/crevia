import type {
  CreviaDistrictTrustBand,
  CreviaDistrictTrustRuntimeHealthStatus,
} from './districtTrustRuntimeTypes';

export const DISTRICT_TRUST_RUNTIME_BANDS: readonly CreviaDistrictTrustBand[] = [
  'fragile',
  'strained',
  'watch',
  'stable',
  'trusted',
  'improving',
  'recovering',
] as const;

export const DISTRICT_TRUST_RUNTIME_SCORE_RANGE = { min: 0, max: 100 } as const;
export const DISTRICT_TRUST_RUNTIME_FALLBACK_SCORE = 55;
export const DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY = 1;
export const DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH = 88;
export const DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH = 72;

export const DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun sonu',
  'oyun bitti',
  'panik',
  'felaket',
  'çöküş',
  'güven çöktü',
  'kriz',
  'başarısız',
  'premium al',
  'paywall',
] as const;

export const DISTRICT_TRUST_RUNTIME_PANIC_TERMS: readonly string[] = [
  'panik',
  'felaket',
  'çöküş',
  'güven çöktü',
  'kaos',
] as const;

export type CreviaDistrictTrustBandDefinition = {
  band: CreviaDistrictTrustBand;
  label: string;
  shortLabel: string;
  tone: 'positive' | 'neutral' | 'warning';
  mapTone: 'calm' | 'neutral' | 'watch' | 'recovery';
  eventWeightIntent: string;
  recommendedVariantBias: readonly string[];
  reportCopyIntent: string;
  advisorCopyIntent: string;
  maxCopyLength: number;
  forbiddenTerms: readonly string[];
};

export const DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS: Record<
  CreviaDistrictTrustBand,
  CreviaDistrictTrustBandDefinition
> = {
  fragile: {
    band: 'fragile',
    label: 'Kırılgan Güven',
    shortLabel: 'Kırılgan',
    tone: 'warning',
    mapTone: 'watch',
    eventWeightIntent: 'social repair, recovery, district_trust',
    recommendedVariantBias: ['comeback', 'district_trust', 'carry_over'],
    reportCopyIntent: 'Mahallede güveni yeniden kurma ihtiyacı görünür.',
    advisorCopyIntent: 'İletişim ve dengeli adımlar güveni destekler.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  strained: {
    band: 'strained',
    label: 'Baskı Altında Güven',
    shortLabel: 'Baskılı',
    tone: 'warning',
    mapTone: 'watch',
    eventWeightIntent: 'recovery, social repair, controlled response',
    recommendedVariantBias: ['comeback', 'district_trust', 'resource_fatigue'],
    reportCopyIntent: 'Baskı görünür; kontrollü müdahale önemli.',
    advisorCopyIntent: 'Öncelikleri net tutmak güveni korur.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MOBILE_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  watch: {
    band: 'watch',
    label: 'İzlenen Güven',
    shortLabel: 'İzlemede',
    tone: 'neutral',
    mapTone: 'neutral',
    eventWeightIntent: 'district_balance, social, steady operations',
    recommendedVariantBias: ['district_trust', 'normal', 'carry_over'],
    reportCopyIntent: 'Güven izleniyor; küçük adımlar etkili olabilir.',
    advisorCopyIntent: 'Dengeli tempo güveni destekler.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  stable: {
    band: 'stable',
    label: 'Dengeli Güven',
    shortLabel: 'Dengeli',
    tone: 'neutral',
    mapTone: 'calm',
    eventWeightIntent: 'normal operations, district_balance',
    recommendedVariantBias: ['normal', 'improved', 'reward'],
    reportCopyIntent: 'Güven dengeli seyrediyor.',
    advisorCopyIntent: 'Mevcut ritim korunabilir.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  trusted: {
    band: 'trusted',
    label: 'Güçlü Güven',
    shortLabel: 'Güvenli',
    tone: 'positive',
    mapTone: 'calm',
    eventWeightIntent: 'reward, improved, positive feedback',
    recommendedVariantBias: ['reward', 'improved', 'normal'],
    reportCopyIntent: 'Mahalle operasyona güven duyuyor.',
    advisorCopyIntent: 'Olumlu etki sürdürülebilir.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  improving: {
    band: 'improving',
    label: 'İyileşen Güven',
    shortLabel: 'İyileşiyor',
    tone: 'positive',
    mapTone: 'recovery',
    eventWeightIntent: 'improved, reward, social positive',
    recommendedVariantBias: ['improved', 'reward', 'normal'],
    reportCopyIntent: 'Güven yönü olumlu.',
    advisorCopyIntent: 'Son adımlar etkisini gösteriyor.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
  recovering: {
    band: 'recovering',
    label: 'Toparlanan Güven',
    shortLabel: 'Toparlanıyor',
    tone: 'positive',
    mapTone: 'recovery',
    eventWeightIntent: 'comeback, carry_over, recovery balance',
    recommendedVariantBias: ['comeback', 'carry_over', 'district_trust'],
    reportCopyIntent: 'Toparlanma penceresi açık.',
    advisorCopyIntent: 'Kaynakları dengeli kullanmak önemli.',
    maxCopyLength: DISTRICT_TRUST_RUNTIME_MAX_COPY_LENGTH,
    forbiddenTerms: DISTRICT_TRUST_RUNTIME_FORBIDDEN_COPY_TERMS,
  },
};

export const DISTRICT_TRUST_RUNTIME_BAND_THRESHOLDS: Record<
  CreviaDistrictTrustBand,
  { min: number; max: number }
> = {
  fragile: { min: 0, max: 24 },
  strained: { min: 25, max: 34 },
  watch: { min: 35, max: 49 },
  stable: { min: 50, max: 69 },
  trusted: { min: 70, max: 100 },
  improving: { min: 45, max: 100 },
  recovering: { min: 30, max: 74 },
};

export const DISTRICT_TRUST_RUNTIME_RANK_VISIBILITY = {
  low: { mode: 'compact', showTrend: false, showRecoveryHint: false, showNextAction: false },
  medium: { mode: 'standard', showTrend: true, showRecoveryHint: false, showNextAction: false },
  high: { mode: 'detailed', showTrend: true, showRecoveryHint: true, showNextAction: true },
} as const;

export function getDistrictTrustRuntimeBandDefinition(
  band: CreviaDistrictTrustBand,
): CreviaDistrictTrustBandDefinition {
  return DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS[band];
}

export function resolveDistrictTrustRuntimeHealthStatus(
  snapshots: readonly { isFallback: boolean; band: CreviaDistrictTrustBand }[],
): CreviaDistrictTrustRuntimeHealthStatus {
  if (snapshots.every((s) => s.isFallback)) return 'fallback';
  if (snapshots.some((s) => s.band === 'fragile' || s.band === 'strained')) return 'strained';
  if (snapshots.some((s) => s.band === 'watch')) return 'watch';
  return 'healthy';
}
