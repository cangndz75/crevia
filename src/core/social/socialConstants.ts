import type {
  NeighborhoodSocialProfile,
  SocialDecisionAction,
  SocialProfileMetricDeltas,
  SocialRiskLevel,
} from './socialTypes';

export const SOCIAL_VALUE_MIN = 0;
export const SOCIAL_VALUE_MAX = 100;

export const SOCIAL_DEFAULT_LAST_PROCESSED_DAY = 0;

export const SOCIAL_NEIGHBORHOOD_IDS = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export type SocialNeighborhoodId = (typeof SOCIAL_NEIGHBORHOOD_IDS)[number];

export const SOCIAL_RISK_LEVELS: readonly SocialRiskLevel[] = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

/** Skor yüksek → düşük risk (low). */
export const SOCIAL_RISK_SCORE_THRESHOLDS = {
  lowMin: 70,
  mediumMin: 50,
  highMin: 30,
} as const;

/** Toplam ağırlık 1.0 — risk metrikleri (100 − değer) ters katkı olarak girer. */
export const SOCIAL_SCORE_WEIGHTS = {
  trust: 0.35,
  gratitude: 0.15,
  complaintCalm: 0.18,
  informationClarity: 0.1,
  crisisControl: 0.09,
  mediaCalm: 0.06,
  fatigueReserve: 0.07,
} as const;

type SeverityGainMap = Record<SocialRiskLevel, number>;

export const SOCIAL_DAILY_DRIFT = {
  gratitudeDecay: 4,
  mediaAttentionDecay: 6,
  misinformationDecay: 3,
  complaintHeatDecay: 4,
  crisisSpreadDecay: 4,
  trustRecoveryLowComplaint: 2,
  trustLossHighComplaint: 3,
  fatigueRecovery: 2,
  fatigueGainHighComplaint: 3,

  topicComplaintHeatGain: {
    low: 2,
    medium: 4,
    high: 6,
    critical: 8,
  } satisfies SeverityGainMap,

  topicCrisisSpreadGain: {
    low: 1,
    medium: 3,
    high: 5,
    critical: 7,
  } satisfies SeverityGainMap,

  topicMediaAttentionGain: {
    low: 1,
    medium: 3,
    high: 5,
    critical: 8,
  } satisfies SeverityGainMap,

  topicMisinformationGain: {
    low: 1,
    medium: 3,
    high: 5,
    critical: 7,
  } satisfies SeverityGainMap,

  gratitudeWaveGain: {
    low: 5,
    medium: 7,
    high: 9,
    critical: 9,
  } satisfies SeverityGainMap,

  gratitudeWaveTrustGain: {
    low: 2,
    medium: 3,
    high: 4,
    critical: 4,
  } satisfies SeverityGainMap,

  misinformationTrustLoss: {
    low: 2,
    medium: 2,
    high: 3,
    critical: 3,
  } satisfies SeverityGainMap,
} as const;

export const SOCIAL_OUTCOME_HISTORY_MAX = 12;

export const SOCIAL_NEIGHBORHOOD_ALIASES: Record<string, SocialNeighborhoodId> =
  {
    merkez: 'merkez',
    central: 'merkez',
    cumhuriyet: 'cumhuriyet',
    sanayi: 'sanayi',
    industrial: 'sanayi',
    istasyon: 'istasyon',
    station: 'istasyon',
    yesilvadi: 'yesilvadi',
    yesilpark: 'yesilvadi',
    'yeni-konut': 'cumhuriyet',
    yenikonut: 'cumhuriyet',
  };

export const SOCIAL_DECISION_ACTION_PRIORITY: readonly Exclude<
  SocialDecisionAction,
  'none'
>[] = [
  'permanent_solution',
  'dispatch_team',
  'communicate',
  'stay_silent',
  'monitor',
] as const;

export const SOCIAL_DECISION_KEYWORDS: Record<
  Exclude<SocialDecisionAction, 'none'>,
  readonly string[]
> = {
  permanent_solution: [
    'kalıcı',
    'kalici',
    'altyapı',
    'altyapi',
    'yenile',
    'yatırım',
    'yatirim',
    'kökten',
    'kokten',
    'uzun vadeli',
    'sistemli çözüm',
    'sistemli cozum',
    'iyileştir',
    'iyilestir',
    'permanent',
  ],
  dispatch_team: [
    'ekip',
    'yönlendir',
    'yonlendir',
    'müdahale',
    'mudahale',
    'saha',
    'temizlik',
    'bakım',
    'bakim',
    'sevk',
    'gönder',
    'gonder',
    'çözüm başlat',
    'cozum baslat',
    'dispatch',
  ],
  communicate: [
    'açıklama',
    'aciklama',
    'bilgilendir',
    'duyuru',
    'şeffaf',
    'seffaf',
    'halka açıkla',
    'halka acikla',
    'bilgi ver',
    'paylaş',
    'paylas',
    'basın',
    'basin',
    'kamuoyu',
    'communication',
  ],
  stay_silent: [
    'sessiz',
    'bekle',
    'görmezden',
    'gormezden',
    'müdahale etme',
    'mudahale etme',
    'açıklama yapma',
    'aciklama yapma',
    'risk al',
    'pasif',
    'silent',
  ],
  monitor: [
    'izle',
    'takip',
    'gözlem',
    'gozlem',
    'analiz',
    'raporla',
    'ölç',
    'olc',
    'monitor',
  ],
};

export const SOCIAL_EVENT_RELEVANCE_KEYWORDS = [
  'sosyal',
  'kamuoyu',
  'şikayet',
  'sikayet',
  'kriz',
  'söylenti',
  'soylenti',
  'teşekkür',
  'tesekkur',
  'medya',
  'güven',
  'guven',
  'halk',
  'protesto',
  'social',
  'crisis',
  'rumor',
] as const;

export const SOCIAL_DECISION_EFFECTS: Record<
  Exclude<SocialDecisionAction, 'none'>,
  SocialProfileMetricDeltas
> = {
  communicate: {
    trust: 6,
    misinformation: -10,
    mediaAttention: -3,
    complaintHeat: -2,
    gratitude: 2,
  },
  dispatch_team: {
    trust: 4,
    complaintHeat: -8,
    crisisSpread: -10,
    mediaAttention: -4,
    gratitude: 5,
    fatigue: -2,
  },
  stay_silent: {
    trust: -5,
    misinformation: 8,
    crisisSpread: 7,
    complaintHeat: 5,
    mediaAttention: 4,
    fatigue: 2,
  },
  permanent_solution: {
    trust: 10,
    complaintHeat: -12,
    misinformation: -4,
    crisisSpread: -12,
    mediaAttention: -6,
    gratitude: 8,
    fatigue: -8,
  },
  monitor: {
    mediaAttention: -1,
    misinformation: -1,
    trust: 1,
  },
};

export const SOCIAL_OUTCOME_TITLES: Record<
  Exclude<SocialDecisionAction, 'none'>,
  string
> = {
  communicate: 'Açıklama Yapıldı',
  dispatch_team: 'Ekip Yönlendirildi',
  stay_silent: 'Sessiz Kalındı',
  permanent_solution: 'Kalıcı Çözüm Başlatıldı',
  monitor: 'Sosyal Takip Yapıldı',
};

type SeedProfileMetrics = Omit<
  NeighborhoodSocialProfile,
  'neighborhoodId' | 'activeTopicIds' | 'lastUpdatedDay'
>;

export const SOCIAL_SEED_PROFILES: Record<SocialNeighborhoodId, SeedProfileMetrics> =
  {
    merkez: {
      trust: 68,
      complaintHeat: 34,
      misinformation: 18,
      gratitude: 42,
      crisisSpread: 22,
      mediaAttention: 45,
      fatigue: 24,
    },
    cumhuriyet: {
      trust: 62,
      complaintHeat: 38,
      misinformation: 26,
      gratitude: 36,
      crisisSpread: 24,
      mediaAttention: 34,
      fatigue: 28,
    },
    sanayi: {
      trust: 58,
      complaintHeat: 42,
      misinformation: 20,
      gratitude: 31,
      crisisSpread: 28,
      mediaAttention: 30,
      fatigue: 36,
    },
    istasyon: {
      trust: 61,
      complaintHeat: 40,
      misinformation: 22,
      gratitude: 34,
      crisisSpread: 32,
      mediaAttention: 38,
      fatigue: 31,
    },
    yesilvadi: {
      trust: 72,
      complaintHeat: 26,
      misinformation: 14,
      gratitude: 45,
      crisisSpread: 18,
      mediaAttention: 26,
      fatigue: 20,
    },
  };
