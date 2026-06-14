export type DominantStrategyPattern =
  | 'rapid_response_overuse'
  | 'preventive_overuse'
  | 'balanced_default_overuse'
  | 'resource_saving_overuse'
  | 'public_trust_overfocus'
  | 'crisis_priority_overfocus'
  | 'district_repetition'
  | 'route_heavy_repetition'
  | 'social_pressure_avoidance'
  | 'recovery_opportunity_neglect'
  | 'inconsistent_switching'
  | 'none';

export type DominantStrategySignalKind =
  | 'decision_choice'
  | 'portfolio_choice'
  | 'operation_feed_choice'
  | 'follow_up_execution'
  | 'defer_risk'
  | 'district_focus'
  | 'city_rhythm'
  | 'day8_strategic_focus'
  | 'report_outcome'
  | 'fallback';

export type DominantStrategyTone =
  | 'neutral'
  | 'reflective'
  | 'cautious'
  | 'encouraging'
  | 'strategic';

export type DominantStrategyConfidence = 'low' | 'medium' | 'high';

export type DominantStrategyVisibilityLevel = 'hidden' | 'teaser' | 'summary' | 'detailed';

export type DominantStrategySignal = {
  id: string;
  kind: DominantStrategySignalKind;
  patternHint: DominantStrategyPattern;
  districtId?: string;
  districtName?: string;
  domainTag?: string;
  decisionKind?: string;
  sourceIds: string[];
  weight: number;
  day?: number;
};

export type DominantStrategyPresentationCandidate = {
  id: string;
  title: string;
  line: string;
  badgeLabel: string;
  tone: DominantStrategyTone;
  visibilityLevel: DominantStrategyVisibilityLevel;
  sourceIds: string[];
};

export type DominantStrategyDetectorResult = {
  day: number;
  isVisible: boolean;
  pattern: DominantStrategyPattern;
  confidence: DominantStrategyConfidence;
  tone: DominantStrategyTone;
  title: string;
  line: string;
  counterSignalLine?: string;
  signals: DominantStrategySignal[];
  sourceIds: string[];
  reportCandidate?: DominantStrategyPresentationCandidate;
  hubCandidate?: DominantStrategyPresentationCandidate;
  eceCandidate?: DominantStrategyPresentationCandidate;
};

export type DominantStrategyDetectorInput = {
  day: number;
  decisionRecords?: unknown[];
  portfolioHistory?: unknown[];
  operationFeedChoiceHistory?: unknown[];
  followUpExecutionHistory?: unknown[];
  deferRiskHistory?: unknown[];
  districtFocusHistory?: unknown[];
  cityRhythmHistory?: unknown[];
  day8StrategicContentHistory?: unknown[];
  reportOutcomeHistory?: unknown[];
  recentDistrictIds?: string[];
  recentDomainTags?: string[];
  authorityExpansionSummary?: unknown;
};

export type DominantStrategyCardModel = {
  id: string;
  title: string;
  line: string;
  counterSignalLine?: string;
  badgeLabel: string;
  tone: DominantStrategyTone;
  visibilityLevel: DominantStrategyVisibilityLevel;
  accessibilityLabel: string;
};
