import type { PersonnelRole, TaskDifficulty } from './personnelTypes';

export const PERSONNEL_MIN = 0;
export const PERSONNEL_MAX = 100;

export const MAX_FATIGUE_GAIN_PER_TASK = 35;
export const MAX_MORALE_DROP_PER_DAY = 20;
export const MAX_MORALE_GAIN_PER_DAY = 15;

export const TASK_FATIGUE_BASE: Record<
  TaskDifficulty,
  { min: number; max: number }
> = {
  light: { min: 6, max: 10 },
  normal: { min: 10, max: 16 },
  hard: { min: 18, max: 26 },
  crisis: { min: 24, max: 34 },
};

export const NIGHT_RECOVERY_BY_FATIGUE: Array<{
  min: number;
  max: number;
  recoveryMin: number;
  recoveryMax: number;
}> = [
  { min: 0, max: 25, recoveryMin: 18, recoveryMax: 24 },
  { min: 26, max: 50, recoveryMin: 20, recoveryMax: 26 },
  { min: 51, max: 70, recoveryMin: 16, recoveryMax: 22 },
  { min: 71, max: 85, recoveryMin: 10, recoveryMax: 16 },
  { min: 86, max: 100, recoveryMin: 6, recoveryMax: 12 },
];

export const OVERTIME_CARRY_PENALTY = {
  hours8to10: 5,
  hours10plus: 12,
  consecutiveOvertimeDays: 18,
} as const;

export const CONSECUTIVE_HEAVY_DAY_PENALTY = 6;
export const CONSECUTIVE_HEAVY_DAY_FATIGUE_THRESHOLD = 65;

export const MORALE_MORNING_DELTA = {
  normal: { min: 1, max: 2 },
  success: { min: 2, max: 4 },
  rest: { min: 6, max: 10 },
  overtime: { min: -8, max: -4 },
  consecutiveOvertime: { min: -14, max: -8 },
  failed: { min: -10, max: -5 },
  sentExhausted: { min: -15, max: -8 },
} as const;

export const REST_EFFECTS = {
  light_duty: { fatigue: -10, morale: 2 },
  full_rest: { fatigue: -35, morale: 8 },
  motivation: { fatigue: -5, morale: 8 },
  equipment_support: {
    nextTaskFatigueReduction: 5,
    vehiclePenaltyReduction: 3,
    durationDays: 1,
  },
} as const;

/** Dinlenme aksiyonu kaynak maliyetleri */
export const REST_ACTION_COSTS = {
  motivation: 2_500,
  equipment_support: 4_000,
} as const;

export const LIGHT_DUTY_FATIGUE_MULTIPLIER = 0.72;
export const LIGHT_DUTY_HEAVY_SUCCESS_PENALTY = 18;
export const FULL_REST_NIGHT_RECOVERY_BONUS = 10;

export const ROUTINE_BURNOUT = {
  consecutiveDistrictDays: 4,
  moralePenalty: 3,
  fatiguePenalty: 4,
} as const;

export const ROLE_TASK_TAGS: Record<PersonnelRole, string[]> = {
  cleaning: ['waste', 'market', 'clean', 'park', 'temiz', 'pazar', 'çöp'],
  driver: ['vehicle', 'rota', 'topla', 'araç', 'sürücü', 'nakil'],
  maintenance: [
    'maintenance',
    'bakım',
    'konteyner',
    'arıza',
    'sidewalk',
    'kaldırım',
  ],
  field_supervisor: [
    'staff',
    'complaint',
    'social',
    'şikayet',
    'kriz',
    'koordinasyon',
    'citizen',
  ],
};

export const RISK_TO_TASK_DIFFICULTY: Record<
  string,
  TaskDifficulty
> = {
  low: 'light',
  medium: 'normal',
  high: 'hard',
  critical: 'crisis',
};

export const EVENT_TYPE_ROLE_HINTS: Record<string, PersonnelRole> = {
  waste: 'cleaning',
  market: 'cleaning',
  vehicle: 'driver',
  staff: 'field_supervisor',
  citizen_complaint: 'field_supervisor',
  social_media: 'field_supervisor',
  sidewalk: 'maintenance',
  noise: 'maintenance',
};

export const MORALE_EFFICIENCY = {
  high: { min: 80, efficiencyBonus: 0.1, fatigueMultiplier: 0.9 },
  normal: { min: 60, efficiencyBonus: 0, fatigueMultiplier: 1 },
  low: { min: 40, efficiencyBonus: -0.05, fatigueMultiplier: 1.1 },
  critical: { min: 20, efficiencyBonus: -0.15, fatigueMultiplier: 1.15 },
  broken: { min: 0, efficiencyBonus: -0.3, fatigueMultiplier: 1.2 },
} as const;

export const FAMILIARITY_TIERS = [
  { min: 0, max: 30, durationBonus: 0, errorReduction: 0, fatigueMultiplier: 1 },
  { min: 31, max: 60, durationBonus: 0.05, errorReduction: 0.05, fatigueMultiplier: 0.95 },
  { min: 61, max: 85, durationBonus: 0.1, errorReduction: 0.05, fatigueMultiplier: 0.95 },
  { min: 86, max: 100, durationBonus: 0.15, errorReduction: 0.1, fatigueMultiplier: 0.9 },
] as const;

export const CONTROLLED_RANDOM = {
  dailyMoraleSwing: { min: -2, max: 2 },
  operationalGlitchChance: 0.12,
  highFatigueGlitchChance: 0.3,
  highMoraleBonusChance: 0.15,
  cooldownDays: 2,
} as const;

export const SUCCESS_THRESHOLDS = {
  success: 80,
  partial: 60,
  weak: 40,
} as const;

/** Personel aksaklık / operasyonel hata riski — 0–28 aralığı */
export const MISTAKE_RISK = {
  base: 4,
  min: 0,
  max: 28,
  levelLowMax: 8,
  levelMediumMax: 17,
  fatigue: {
    highThreshold: 70,
    riskyThreshold: 51,
    penaltyHigh: 8,
    penaltyRisky: 4,
    penaltyModerate: 2,
  },
  morale: {
    lowThreshold: 40,
    criticalThreshold: 25,
    penaltyLow: 5,
    penaltyCritical: 7,
  },
  experience: {
    lowThreshold: 35,
    veryLowThreshold: 22,
    penaltyLow: 4,
    penaltyVeryLow: 6,
  },
  roleMatch: {
    good: 0.9,
    partial: 0.5,
    penaltyGood: 0,
    penaltyPartial: 3,
    penaltyBad: 6,
  },
  consecutiveHeavy: {
    daysThreshold: 2,
    penalty: 4,
  },
  familiarity: {
    highReduction: 5,
    midReduction: 3,
    lowReduction: 1,
    highMin: 61,
    midMin: 31,
  },
  successScore: {
    highThreshold: 80,
    partialThreshold: 60,
    weakThreshold: 40,
    bonusHigh: -4,
    penaltyPartial: 0,
    penaltyWeak: 5,
    penaltyFailed: 8,
  },
  /** Kontrollü tetikleme — seed ile */
  trigger: {
    lowRiskMaxChance: 0.07,
    lowRiskMinScore: 5,
    mediumChanceMin: 0.14,
    mediumChanceMax: 0.22,
    highChanceMin: 0.22,
    highChanceMax: 0.30,
    seriousChanceAtHigh: 0.08,
    typeRepeatLookback: 2,
  },
  outcome: {
    moraleMinor: -1,
    moraleModerate: -2,
    successPenaltyMinor: 3,
    successPenaltyModerate: 6,
    metricRiskMinor: 1,
    metricRiskModerate: 1,
    metricPublicSatMinor: -1,
    metricPublicSatModerate: -1,
  },
} as const;

export const MISTAKE_RISK_LEVEL_LABELS_TR: Record<
  'low' | 'medium' | 'high',
  string
> = {
  low: 'Düşük',
  medium: 'Orta',
  high: 'Yüksek',
};

export const ROLE_LABELS_TR: Record<PersonnelRole, string> = {
  cleaning: 'Temizlik',
  driver: 'Sürücü',
  maintenance: 'Bakım',
  field_supervisor: 'Saha Koordinasyonu',
};

export const STATUS_LABELS_TR: Record<string, string> = {
  idle: 'Hazır',
  assigned: 'Görevde',
  resting: 'Dinleniyor',
  tired: 'Yorgun',
  risky: 'Riskli',
  exhausted: 'Tükenmiş',
};

export const FATIGUE_BAND_LABELS_TR: Array<{ max: number; label: string }> = [
  { max: 25, label: 'Dinç' },
  { max: 50, label: 'Hazır' },
  { max: 70, label: 'Yorgun' },
  { max: 85, label: 'Riskli' },
  { max: 100, label: 'Tükenmiş' },
];
