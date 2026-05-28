export type DailyPriorityKey =
  | 'public_relief'
  | 'operation_stability'
  | 'resource_protection';

export type DailyPriorityStatus =
  | 'not_selected'
  | 'active'
  | 'fulfilled'
  | 'partial'
  | 'failed';

export type DailyPriorityTone =
  | 'supportive'
  | 'balanced'
  | 'risky'
  | 'neutral';

export type DailyPriorityVisualTone = 'green' | 'blue' | 'amber';

export type DailyPriorityGoalWeights = {
  publicSatisfaction: number;
  operationRisk: number;
  budget: number;
  personnelMorale: number;
  containerPressure: number;
  vehicleRisk: number;
  socialPulse: number;
};

export type DailyPriorityDecisionBiasHints = {
  positiveKeywords: string[];
  riskyKeywords: string[];
};

export type DailyPriorityChoice = {
  key: DailyPriorityKey;
  title: string;
  shortTitle: string;
  description: string;
  promiseText: string;
  tradeoffText: string;
  iconName: string;
  visualTone: DailyPriorityVisualTone;
  goalWeights: DailyPriorityGoalWeights;
  decisionBiasHints: DailyPriorityDecisionBiasHints;
};

export type DailyPriorityMetricSnapshot = {
  publicSatisfaction?: number;
  budget?: number;
  personnelMorale?: number;
  operationRisk?: number;
  socialPulse?: number;
  containerPressure?: number;
  vehicleRisk?: number;
};

export type DailyPriorityImpactSource =
  | 'decision'
  | 'social_quick_action'
  | 'end_of_day'
  | 'carry_over';

export type DailyPriorityImpactEntry = {
  id: string;
  day: number;
  source: DailyPriorityImpactSource;
  tone: DailyPriorityTone;
  title: string;
  text: string;
  scoreDelta: number;
  createdAt: number;
  relatedEventId?: string;
  relatedNeighborhoodId?: string;
};

export type DailyPriorityFinalStatus = 'fulfilled' | 'partial' | 'failed';

export type DailyPriorityFinalResult = {
  status: DailyPriorityFinalStatus;
  title: string;
  text: string;
  xpBonus: number;
  carryOverText?: string;
};

export type DailyPriorityState = {
  day: number;
  selectedKey?: DailyPriorityKey;
  status: DailyPriorityStatus;
  selectedAt?: number;
  score: number;
  progressPercent: number;
  startedMetricSnapshot?: DailyPriorityMetricSnapshot;
  currentMetricSnapshot?: DailyPriorityMetricSnapshot;
  impactLog: DailyPriorityImpactEntry[];
  finalResult?: DailyPriorityFinalResult;
  /** Aynı olay için tekrar skor değişimini engeller. */
  processedDecisionEventIds?: string[];
  isDay1Auto?: boolean;
};

export type DailyPriorityByDay = Record<number, DailyPriorityState>;

export type DailyPriorityReportResult = {
  key: DailyPriorityKey;
  title: string;
  status: DailyPriorityFinalStatus;
  text: string;
  carryOverText?: string;
  score: number;
};

export type DecisionPriorityImpact = {
  title: string;
  text: string;
  tone: DailyPriorityTone;
  scoreDelta: number;
};
