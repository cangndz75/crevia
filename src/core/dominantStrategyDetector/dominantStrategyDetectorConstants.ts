import type {
  DominantStrategyPattern,
  DominantStrategyTone,
} from './dominantStrategyDetectorTypes';

export const DOMINANT_STRATEGY_MIN_VISIBLE_DAY = 4;
export const DOMINANT_STRATEGY_FULL_VISIBLE_DAY = 8;
export const DOMINANT_STRATEGY_CLEARER_DAY = 10;
export const DOMINANT_STRATEGY_MAX_SIGNALS = 8;
export const DOMINANT_STRATEGY_CARD_MAX = 2;
export const DOMINANT_STRATEGY_LINE_MAX = 110;
export const DOMINANT_STRATEGY_ACCESSIBILITY_MAX = 160;

export const DOMINANT_STRATEGY_PATTERNS: DominantStrategyPattern[] = [
  'rapid_response_overuse',
  'preventive_overuse',
  'balanced_default_overuse',
  'resource_saving_overuse',
  'public_trust_overfocus',
  'crisis_priority_overfocus',
  'district_repetition',
  'route_heavy_repetition',
  'social_pressure_avoidance',
  'recovery_opportunity_neglect',
  'inconsistent_switching',
  'none',
];

export const DOMINANT_STRATEGY_TIE_BREAK_ORDER: DominantStrategyPattern[] = [
  'district_repetition',
  'recovery_opportunity_neglect',
  'social_pressure_avoidance',
  'public_trust_overfocus',
  'route_heavy_repetition',
  'resource_saving_overuse',
  'balanced_default_overuse',
  'crisis_priority_overfocus',
  'preventive_overuse',
  'rapid_response_overuse',
  'inconsistent_switching',
  'none',
];

export const DOMINANT_STRATEGY_TITLES: Record<DominantStrategyPattern, string> = {
  rapid_response_overuse: 'Hizli Mudahale Egilimi',
  preventive_overuse: 'Onleyici Plan Egilimi',
  balanced_default_overuse: 'Dengeli Varsayilan',
  resource_saving_overuse: 'Kaynak Koruma Egilimi',
  public_trust_overfocus: 'Guven Odakli Egilim',
  crisis_priority_overfocus: 'Kriz Onceligi',
  district_repetition: 'Mahalle Tekrari',
  route_heavy_repetition: 'Rota Agirligi',
  social_pressure_avoidance: 'Sosyal Sinyal Erteleme',
  recovery_opportunity_neglect: 'Toparlanma Firsati',
  inconsistent_switching: 'Dagilan Odak',
  none: 'Strateji Izleme',
};

export const DOMINANT_STRATEGY_BADGE_LABELS: Record<DominantStrategyPattern, string> = {
  rapid_response_overuse: 'Hizli',
  preventive_overuse: 'Onleyici',
  balanced_default_overuse: 'Denge',
  resource_saving_overuse: 'Kaynak',
  public_trust_overfocus: 'Guven',
  crisis_priority_overfocus: 'Kriz',
  district_repetition: 'Mahalle',
  route_heavy_repetition: 'Rota',
  social_pressure_avoidance: 'Sosyal',
  recovery_opportunity_neglect: 'Toparlanma',
  inconsistent_switching: 'Odak',
  none: 'Izleme',
};

export const DOMINANT_STRATEGY_TONES: Record<DominantStrategyPattern, DominantStrategyTone> = {
  rapid_response_overuse: 'cautious',
  preventive_overuse: 'reflective',
  balanced_default_overuse: 'strategic',
  resource_saving_overuse: 'reflective',
  public_trust_overfocus: 'reflective',
  crisis_priority_overfocus: 'cautious',
  district_repetition: 'strategic',
  route_heavy_repetition: 'cautious',
  social_pressure_avoidance: 'cautious',
  recovery_opportunity_neglect: 'encouraging',
  inconsistent_switching: 'reflective',
  none: 'neutral',
};

export const DOMINANT_STRATEGY_COPY: Record<
  DominantStrategyPattern,
  { line: string; counterSignalLine?: string }
> = {
  rapid_response_overuse: {
    line: 'Hizli cozumleri sik seciyorsun; bu sehir ritmini hizli ama yuklu tutabilir.',
    counterSignalLine: 'Hizli cozum ise yariyor; bugun kucuk takip hamlesi yuku azaltabilir.',
  },
  preventive_overuse: {
    line: 'Onleyici adimlari sik seciyorsun; bugunun gorunur baskisi da dikkat isteyebilir.',
    counterSignalLine: 'Yarini rahatlatirken bugunku gorunur sikayet icin kucuk bir adim da degerli olabilir.',
  },
  balanced_default_overuse: {
    line: 'Dengeli secimleri sik kullaniyorsun; bazi gunler net oncelik daha okunur iz birakir.',
    counterSignalLine: 'Dengeli secim guvenli; bugun tek bir oncelik daha fazla iz birakabilir.',
  },
  resource_saving_overuse: {
    line: 'Kaynak koruma egilimin guclu; dusuk maliyetli firsatlar da gorunur kalmali.',
    counterSignalLine: 'Kaynagi koruyorsun; dusuk maliyetli toparlanma firsati deger yaratabilir.',
  },
  public_trust_overfocus: {
    line: 'Guven odagini iyi kuruyorsun; rota ve kaynak yuku da gorunur kalmali.',
    counterSignalLine: 'Guveni koruyorsun; rota ve kaynak yuku de gorunur kalmali.',
  },
  crisis_priority_overfocus: {
    line: 'Riskleri hizli seciyorsun; kucuk toparlanma firsatlari da denge saglayabilir.',
    counterSignalLine: 'Riskleri iyi kapatiyorsun; kucuk bir toparlanma firsati da var.',
  },
  district_repetition: {
    line: 'Ayni bolgeyi yakindan izliyorsun; baska bir mahalle sessizce birikiyor olabilir.',
    counterSignalLine: 'Bu bolgeyi iyi izliyorsun; baska bir mahalle sessizce birikiyor olabilir.',
  },
  route_heavy_repetition: {
    line: 'Rota ve arac sinyalleri kararlarinda one cikiyor; sosyal ve konteyner hatlari da izlenmeli.',
    counterSignalLine: 'Rota hattini iyi okuyorsun; bugun sosyal veya konteyner sinyali denge katabilir.',
  },
  social_pressure_avoidance: {
    line: 'Sosyal sinyal gorunuyor ama yanit dusuk kaliyor; kucuk iletisim yarini rahatlatabilir.',
    counterSignalLine: 'Sosyal sinyaller birikebilir; kucuk bir iletisim adimi yarin isini kolaylastirir.',
  },
  recovery_opportunity_neglect: {
    line: 'Riskleri kapatirken toparlanma firsatlari arka planda kaliyor olabilir.',
    counterSignalLine: 'Riskleri kapatiyorsun; toparlanma firsati dusuk maliyetle deger yaratabilir.',
  },
  inconsistent_switching: {
    line: 'Gundemler hizli degisiyor; bugun tek bir odak daha okunur ilerleme saglayabilir.',
    counterSignalLine: 'Gundem degisiyor; bugun tek bir odagi sabitlemek daha okunur olabilir.',
  },
  none: {
    line: 'Karar tarzin icin henuz guvenli bir tekrar sinyali yok.',
  },
};

import { mergeCopyPools } from '@/core/contentVarietyQuality';

import {
  DOMINANT_STRATEGY_BADGE_VARIANTS as DOMINANT_STRATEGY_BADGE_VARIANTS_EXPANSION,
  DOMINANT_STRATEGY_COUNTER_LINES as DOMINANT_STRATEGY_COUNTER_LINES_EXPANSION,
  DOMINANT_STRATEGY_REFLECTION_LINES as DOMINANT_STRATEGY_REFLECTION_LINES_EXPANSION,
} from './dominantStrategyDetectorCopyExpansion';

function buildDominantReflectionLines(): Record<DominantStrategyPattern, string[]> {
  const result = {} as Record<DominantStrategyPattern, string[]>;
  for (const pattern of DOMINANT_STRATEGY_PATTERNS) {
    const base = DOMINANT_STRATEGY_COPY[pattern].line;
    result[pattern] = [base, ...(DOMINANT_STRATEGY_REFLECTION_LINES_EXPANSION[pattern] ?? [])];
  }
  return result;
}

function buildDominantCounterLines(): Record<DominantStrategyPattern, string[]> {
  const result = {} as Record<DominantStrategyPattern, string[]>;
  for (const pattern of DOMINANT_STRATEGY_PATTERNS) {
    const base = DOMINANT_STRATEGY_COPY[pattern].counterSignalLine;
    const extras = DOMINANT_STRATEGY_COUNTER_LINES_EXPANSION[pattern] ?? [];
    result[pattern] = base ? [base, ...extras] : extras;
  }
  return result;
}

function buildDominantBadgeVariants(): Record<DominantStrategyPattern, string[]> {
  const result = {} as Record<DominantStrategyPattern, string[]>;
  for (const pattern of DOMINANT_STRATEGY_PATTERNS) {
    result[pattern] = [
      DOMINANT_STRATEGY_BADGE_LABELS[pattern],
      ...(DOMINANT_STRATEGY_BADGE_VARIANTS_EXPANSION[pattern] ?? []),
    ];
  }
  return result;
}

export const DOMINANT_STRATEGY_REFLECTION_LINES = buildDominantReflectionLines();
export const DOMINANT_STRATEGY_COUNTER_LINES = buildDominantCounterLines();
export const DOMINANT_STRATEGY_BADGE_VARIANTS = buildDominantBadgeVariants();

export const DOMINANT_STRATEGY_SHAME_PATTERNS = [
  /hep yanlis/i,
  /yanlis yapiyorsun/i,
  /basarisiz/i,
  /ceza/i,
  /kotu oyn/i,
  /suclusun/i,
];
