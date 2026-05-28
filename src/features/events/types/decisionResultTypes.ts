export type DecisionResultTone =
  | 'safe'
  | 'balanced'
  | 'bold'
  | 'risky'
  | 'supportive'
  | 'resource_saving'
  | 'unknown';

export type DecisionResultSummaryTone =
  | 'positive'
  | 'mixed'
  | 'negative'
  | 'neutral';

export type DecisionMetricKey =
  | 'publicSatisfaction'
  | 'budget'
  | 'personnelMorale'
  | 'operationRisk';

export type DecisionMetricChange = {
  key: DecisionMetricKey;
  label: string;
  before?: number;
  after?: number;
  delta: number;
  direction: 'up' | 'down' | 'flat';
  isGood: boolean;
};

export type DecisionSubsystemKey =
  | 'personnel'
  | 'container'
  | 'vehicle'
  | 'social';

export type DecisionSubsystemOutcome = {
  key: DecisionSubsystemKey;
  title: string;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  primaryText: string;
  secondaryText?: string;
  iconName?: string;
};

export type DecisionResultSnapshot = {
  id: string;
  day: number;
  eventId: string;
  eventTitle: string;
  eventType?: string;
  neighborhoodId?: string;
  neighborhoodName?: string;
  decisionId: string;
  decisionTitle: string;
  decisionTone: DecisionResultTone;
  createdAt: number;

  summaryTitle: string;
  summaryText: string;
  resultTone: DecisionResultSummaryTone;

  metricChanges: DecisionMetricChange[];
  subsystemOutcomes: DecisionSubsystemOutcome[];
  highlightLines: string[];
  riskLines: string[];
  nextSuggestion?: string;
  dailyGoalImpact?: string;
  dailyPriorityImpact?: {
    title: string;
    text: string;
    tone: 'supportive' | 'balanced' | 'risky' | 'neutral';
    scoreDelta: number;
  };
  butterflyHint?: {
    title: string;
    text: string;
    tone: 'info' | 'warning' | 'opportunity';
    dueText?: string;
  };
};
