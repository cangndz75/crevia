import type {
  AdvisorClarityLabel,
  AdvisorDomain,
  AdvisorLevel,
  AdvisorReliabilityBand,
  AdvisorState,
} from './advisorTypes';

export const ADVISOR_ID = 'ece_operations_assistant' as const;

export const ADVISOR_LEVEL_THRESHOLDS: Record<AdvisorLevel, number> = {
  1: 0,
  2: 100,
  3: 260,
};

export const ADVISOR_DAILY_USES_BY_LEVEL: Record<AdvisorLevel, number> = {
  1: 1,
  2: 2,
  3: 3,
};

export const ADVISOR_END_OF_DAY_EXPERIENCE = 12;

export const ADVISOR_MAX_INSIGHT_BODY_LENGTH = 160;

export const ADVISOR_MAX_PENDING_PREDICTIONS = 5;

export const DEFAULT_RELIABILITY_SCORE = 52;

export const RELIABILITY_BAND_THRESHOLDS = {
  earlyMax: 54,
  developingMax: 69,
  reliableMax: 84,
} as const;

export const RELIABILITY_LABELS: Record<AdvisorReliabilityBand, AdvisorClarityLabel> = {
  early_observation: 'Ön gözlem',
  developing: 'Gelişen analiz',
  reliable: 'Güvenilir okuma',
  expert: 'Uzman değerlendirme',
};

export const MISSED_SIGNAL_RELIABILITY_DELTA = -2;
export const ACKNOWLEDGE_RELIABILITY_DELTA = 3;
export const ACKNOWLEDGE_DOMAIN_LEARNING_DELTA = 8;
export const ACKNOWLEDGE_EXPERIENCE_DELTA = 6;

/** Gelecek seviye — bu patch'te level 3 kullanılmıyor */
export const ADVISOR_FUTURE_EXPERT_ROLE = 'Operasyon Uzmanı';

export const DEFAULT_ADVISOR_STATE: AdvisorState = {
  advisorId: ADVISOR_ID,
  level: 1,
  experience: 0,
  dailyUsesRemaining: 1,
  lastRefreshedDay: 1,
  totalSuccessfulHints: 0,
  reliabilityScore: DEFAULT_RELIABILITY_SCORE,
  reliabilityBand: 'early_observation',
  domainLearning: {
    personnel: 0,
    vehicles: 0,
    containers: 0,
    districts: 0,
    social: 0,
    crisis: 0,
  },
  pendingPredictions: [],
  acknowledgedMissCount: 0,
};

export const ADVISOR_COPY = {
  advisorName: 'Ece',
  hubTitle: 'Ece’den Operasyon Notu',
  missedNoteTitle: 'Ece’nin Notu',
  missedNoteFooter: 'Bu analiz Ece’nin saha öğrenimine işlendi.',
  missedNoteCta: 'Notu İncele',
  eventHintTitle: 'Danışman Yorumu',
  endDayTitle: 'Danışman Yorumu',
  ctaAsk: 'Danışmana Sor',
  usesExhausted: 'Bugünkü analiz hakkı kullanıldı',
  eventUsesExhausted:
    'Bugünkü analiz hakkı bitti. Gün sonu raporunda genel yorum alacaksın.',
  endDayExperienceLine: (amount: number) =>
    `Danışman deneyimi +${amount}`,
  limitedSignalFooter: 'Bu analiz sınırlı sinyale dayanıyor.',
  learningAckLine: (domain: string) =>
    `Ece bu gün ${domain} sinyali okumasında gelişim kazandı.`,
  roleByLevel: {
    1: 'Stajyer Operasyon Asistanı',
    2: 'Operasyon Asistanı',
    3: 'Saha Danışmanı',
  } as const satisfies Record<AdvisorLevel, string>,
  levelLabelByLevel: {
    1: 'Stajyer Operasyon Asistanı',
    2: 'Operasyon Asistanı',
    3: 'Saha Danışmanı',
  } as const satisfies Record<AdvisorLevel, string>,
  maxLevelProgress: 'En güçlü analiz seviyesi',
  usesLabel: (remaining: number) =>
    remaining === 1
      ? 'Bugün 1 analiz hakkı'
      : `Bugün ${remaining} analiz hakkı`,
  levelUpLine: (role: string) =>
    `Ece artık ${role} seviyesinde analiz yapabilir.`,
} as const;

export const DOMAIN_DISPLAY_NAMES: Record<AdvisorDomain, string> = {
  personnel: 'personel',
  vehicles: 'araç',
  containers: 'konteyner',
  districts: 'mahalle',
  social: 'sosyal',
  crisis: 'kriz',
};

export const ADVISOR_UI_FORBIDDEN_WORDS = [
  'xp',
  'premium',
  'kilitli',
  'satın al',
  'paywall',
] as const;
