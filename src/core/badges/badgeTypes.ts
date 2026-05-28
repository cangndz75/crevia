export type BadgeId =
  | 'first_step'
  | 'steady_operator'
  | 'public_listener'
  | 'budget_guardian'
  | 'team_caretaker'
  | 'crisis_cooler'
  | 'route_mind'
  | 'container_watch'
  | 'butterfly_handler'
  | 'authority_candidate'
  | 'promoted_operator'
  | 'pilot_finisher';

export type BadgeCategory =
  | 'operations'
  | 'publicTrust'
  | 'resources'
  | 'personnel'
  | 'crisis'
  | 'authority'
  | 'consistency'
  | 'pilot';

export type BadgeRarity = 'common' | 'uncommon' | 'rare' | 'epic';

export type BadgeHistorySource =
  | 'daily_report'
  | 'pilot_completion'
  | 'authority_evaluation';

export type BadgeProgressState = {
  badgeId: BadgeId;
  current: number;
  target: number;
  completed: boolean;
  updatedDay?: number;
};

export type BadgeHistoryEntry = {
  badgeId: BadgeId;
  earnedDay: number;
  source: BadgeHistorySource;
  pilotRunId?: string;
};

export type BadgeState = {
  earnedBadgeIds: BadgeId[];
  badgeProgress: Record<BadgeId, BadgeProgressState>;
  recentlyEarnedBadgeIds: BadgeId[];
  history: BadgeHistoryEntry[];
  lastEvaluatedDay: number;
  lastEvaluatedPilotRunId?: string;
};

export type BadgeDefinition = {
  id: BadgeId;
  title: string;
  description: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  target: number;
  hidden?: boolean;
};

export type BadgeProgressUpdate = {
  badgeId: BadgeId;
  current: number;
  target: number;
  completed: boolean;
  updatedDay?: number;
};

export type BadgeEvaluationResult = {
  progressUpdates: BadgeProgressUpdate[];
  earnedBadgeIds: BadgeId[];
  reasonLines: string[];
  source: BadgeHistorySource;
  pilotRunId?: string;
};

export type BadgeEvaluationSnapshot = {
  earnedBadgeIds: BadgeId[];
  progressLines: string[];
  earnedLines: string[];
};

export type EvaluateDailyBadgesInput = {
  day: number;
  badgeState: BadgeState;
  positiveOperationDay?: boolean;
  socialPulseBalanced?: boolean;
  budgetNotSeriouslyDamaged?: boolean;
  personnelMoraleMaintained?: boolean;
  criticalRiskClosedWithoutGrowth?: boolean;
  butterflyFollowUpWellManaged?: boolean;
  vehicleDayPositive?: boolean;
  containerRiskControlled?: boolean;
};

export type EvaluatePilotCompletionBadgesInput = {
  day: number;
  badgeState: BadgeState;
  pilotRunId?: string;
  authorityEvaluationStatus?: 'stable' | 'watching' | 'promotion_candidate' | 'promoted';
  authorityPromoted?: boolean;
};
