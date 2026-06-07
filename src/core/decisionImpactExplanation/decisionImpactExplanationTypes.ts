import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { OperationalResourcesState } from '@/core/operationalResources/operationalResourceTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export type DecisionImpactExplanationKind =
  | 'positive_tradeoff'
  | 'risk_tradeoff'
  | 'resource_pressure'
  | 'district_trust_shift'
  | 'social_response'
  | 'route_balance'
  | 'container_pressure'
  | 'personnel_fatigue'
  | 'crisis_prevention'
  | 'carry_over_warning'
  | 'recovery_signal'
  | 'neutral_learning'
  | 'fallback';

export type DecisionImpactExplanationTone =
  | 'positive'
  | 'watch'
  | 'neutral'
  | 'recovery'
  | 'risk';

export type DecisionImpactExplanationConfidence = 'high' | 'medium' | 'fallback';

export type DecisionImpactExplanationSourceSignals = {
  metricKeys: string[];
  operationSignalDomains: string[];
  hasCarryOver: boolean;
  hasResourcePressure: boolean;
  hasDistrictContext: boolean;
  hasSocialContext: boolean;
};

export type DecisionImpactExplanation = {
  id: string;
  kind: DecisionImpactExplanationKind;
  title: string;
  mainLine: string;
  tomorrowLine?: string;
  tone: DecisionImpactExplanationTone;
  relatedDomain: string;
  relatedDistrictId?: string;
  relatedResource?: string;
  confidence: DecisionImpactExplanationConfidence;
  sourceSignals: DecisionImpactExplanationSourceSignals;
  maxVisibleLines: number;
  shouldShowInResult: boolean;
  shouldEchoInReport: boolean;
  shouldEchoInHub: boolean;
};

export type DecisionImpactExplanationInput = {
  snapshot?: DecisionResultSnapshot | null;
  event?: EventCard | null;
  day?: number;
  operationSignals?: OperationSignalsState | null;
  resourceFatigue?: OperationalResourcesState | null;
  carryOverSummary?: string | null;
  dailyReport?: DailyReport | null;
  recentDecisions?: DecisionRecord[];
  existingLines?: string[];
  eventPool?: EventCard[];
  postPilotCatalog?: EventCard[];
};
