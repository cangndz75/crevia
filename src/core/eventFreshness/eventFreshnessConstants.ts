import type {
  CreviaEventFreshnessDecisionStatus,
  CreviaEventFreshnessHealthStatus,
} from './eventFreshnessTypes';

export const EVENT_FRESHNESS_SCORE_RANGE = { min: 0, max: 100 } as const;

export const EVENT_FRESHNESS_TUTORIAL_MAX_DAY = 1;

export const EVENT_FRESHNESS_GENERIC_STOP_WORDS: readonly string[] = [
  'bu',
  'bir',
  've',
  'ile',
  'icin',
  'olan',
  'gibi',
  'daha',
  'cok',
  'az',
  'her',
  'son',
  'gun',
  'mahalle',
  'operasyon',
  'durum',
  'karar',
  'saha',
  'the',
  'and',
] as const;

export const EVENT_FRESHNESS_STRONG_VARIANT_KINDS: readonly string[] = [
  'reward',
  'comeback',
  'crisis_adjacent',
] as const;

export const EVENT_FRESHNESS_HEAVY_DOMAINS: readonly string[] = [
  'crisis_adjacent',
  'authority_milestone',
  'operation_era',
] as const;

export const EVENT_FRESHNESS_PENALTIES = {
  familyRepeat1Day: 22,
  familyRepeat2To3Day: 12,
  districtRepeatSoft: 8,
  domainRepeatSoft: 10,
  domainRepeatMedium: 14,
  variantRepeatStrong: 16,
  variantRepeatNormal: 6,
  echoRepeatSameDay: 30,
  titleCopyHighSimilarity: 18,
  titleCopyMediumSimilarity: 10,
  tutorialHeavy: 25,
  duplicateGuardHigh: 15,
  duplicateGuardMedium: 8,
} as const;

export const EVENT_FRESHNESS_THRESHOLDS = {
  blockTotalPenalty: 45,
  strongPenalty: 25,
  softPenalty: 10,
  titleCopyHighSimilarity: 0.78,
  titleCopyMediumSimilarity: 0.62,
  duplicateGuardHigh: 0.82,
  duplicateGuardMedium: 0.65,
} as const;

export const EVENT_FRESHNESS_DECISION_LABELS: Record<CreviaEventFreshnessDecisionStatus, string> = {
  allow: 'İzin verildi',
  warn_repeat: 'Tekrar uyarısı',
  warn_similarity: 'Benzerlik uyarısı',
  soft_penalty: 'Hafif tazelik cezası',
  strong_penalty: 'Güçlü tazelik cezası',
  block_duplicate: 'Duplicate engeli',
  block_echo_repeat: 'Echo tekrar engeli',
  fallback_needed: 'Fallback gerekli',
};

export const EVENT_FRESHNESS_HEALTH_LABELS: Record<CreviaEventFreshnessHealthStatus, string> = {
  fresh: 'Taze',
  watch: 'İzle',
  strained: 'Baskılı',
  blocked: 'Engelli',
};

export const EVENT_FRESHNESS_FORBIDDEN_COPY_TERMS: readonly string[] = [
  '14 günlük sezon',
  'sezon sonu',
  'sezon finali',
  'oyun bitti',
  'oyun sonu',
  'panik',
  'felaket',
] as const;
