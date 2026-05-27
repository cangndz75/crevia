import type { LeaderboardCategory } from './leaderboardTypes';

export const LEADERBOARD_MIN_SCORE = 0;
export const LEADERBOARD_MAX_SCORE = 10_000;
export const LEADERBOARD_BASE_MAX = 100;
export const LEADERBOARD_BASE_TO_POINTS = 100;

export const DEFAULT_COMPONENT_SCORE = 70;

export const SCORE_WEIGHTS = {
  citizenSatisfaction: 0.22,
  riskControl: 0.18,
  budgetEfficiency: 0.16,
  personnelSustainability: 0.16,
  complaintResolution: 0.12,
  butterflyControl: 0.1,
  neighborhoodFit: 0.06,
} as const;

export const NEIGHBORHOOD_DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  cumhuriyet: 1.0,
  merkez: 1.05,
  yesilvadi: 1.08,
  istasyon: 1.1,
  sanayi: 1.15,
};

export const DEFAULT_NEIGHBORHOOD_DIFFICULTY = 1.0;

export const LEADERBOARD_TITLE_THRESHOLDS: ReadonlyArray<{
  minScore: number;
  title: string;
}> = [
  { minScore: 9000, title: 'Stratejik Koordinatör' },
  { minScore: 8000, title: 'Usta Bölge Yöneticisi' },
  { minScore: 7000, title: 'Güvenilir Operasyon Şefi' },
  { minScore: 6000, title: 'Gelişen Koordinatör' },
  { minScore: 0, title: 'Stajyer Yönetici' },
];

export const PENALTY_CRITICAL_FATIGUE_THRESHOLD = 85;
export const PENALTY_CRITICAL_FATIGUE_AMOUNT = 280;

export const PENALTY_HIGH_RISK_THRESHOLD = 75;
export const PENALTY_HIGH_RISK_AMOUNT = 320;

export const PENALTY_NEGATIVE_BUDGET_AMOUNT = 450;

export const PENALTY_TEMPORARY_SOLUTION_THRESHOLD = 4;
export const PENALTY_TEMPORARY_SOLUTION_AMOUNT = 120;

export const PENALTY_SOCIAL_MEDIA_RISK_THRESHOLD = 70;
export const PENALTY_SOCIAL_MEDIA_RISK_AMOUNT = 200;

export const PENALTY_REPEATED_PROBLEM_THRESHOLD = 3;
export const PENALTY_REPEATED_PROBLEM_AMOUNT = 90;

export const BUDGET_EFFICIENCY_LOW_RATIO = 0.35;
export const BUDGET_EFFICIENCY_SATISFACTION_PER_SPEND_UNIT = 0.18;

export const PERSONNEL_FATIGUE_WARNING = 70;
export const PERSONNEL_FATIGUE_CRITICAL = 85;
export const PERSONNEL_MORALE_LOW = 45;

export const COMPLAINT_MIN_COMPLETED_EVENTS = 1;
export const BUTTERFLY_PARTIAL_PENALTY_PER = 4;
export const BUTTERFLY_PERMANENT_BONUS_PER = 6;
export const BUTTERFLY_PARTIAL_DECISION_CAP = 8;

export const NEIGHBORHOOD_FIT_MATCH_BONUS = 8;
export const NEIGHBORHOOD_FIT_MISMATCH_PENALTY = 5;

export const MOCK_LEADERBOARD_SIZE = 26;
export const MOCK_SCORE_MIN = 5200;
export const MOCK_SCORE_MAX = 9300;

export const CURRENT_PLAYER_ID = 'local-player';

export const NEIGHBORHOOD_DISPLAY_NAMES: Record<string, string> = {
  cumhuriyet: 'Cumhuriyet',
  merkez: 'Merkez',
  yesilvadi: 'Yeşilvadi',
  istasyon: 'İstasyon',
  sanayi: 'Sanayi',
};

export type LeaderboardWeightMap = {
  [K in keyof typeof SCORE_WEIGHTS]: number;
};

export const CATEGORY_SCORE_WEIGHTS: Record<
  LeaderboardCategory,
  Partial<LeaderboardWeightMap>
> = {
  overall: {},
  efficient_municipality: {
    budgetEfficiency: 0.28,
    riskControl: 0.24,
    citizenSatisfaction: 0.14,
    personnelSustainability: 0.14,
    complaintResolution: 0.08,
    butterflyControl: 0.08,
    neighborhoodFit: 0.04,
  },
  citizen_favorite: {
    citizenSatisfaction: 0.32,
    complaintResolution: 0.22,
    neighborhoodFit: 0.12,
    riskControl: 0.12,
    budgetEfficiency: 0.08,
    personnelSustainability: 0.08,
    butterflyControl: 0.06,
  },
  crisis_master: {
    riskControl: 0.28,
    butterflyControl: 0.22,
    complaintResolution: 0.14,
    citizenSatisfaction: 0.14,
    budgetEfficiency: 0.1,
    personnelSustainability: 0.08,
    neighborhoodFit: 0.04,
  },
  personnel_friendly: {
    personnelSustainability: 0.34,
    citizenSatisfaction: 0.16,
    riskControl: 0.14,
    budgetEfficiency: 0.12,
    complaintResolution: 0.12,
    butterflyControl: 0.08,
    neighborhoodFit: 0.04,
  },
};
