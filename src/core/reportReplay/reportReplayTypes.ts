export type ReportReplayItemType =
  | 'operation'
  | 'decision'
  | 'field'
  | 'cityImpact'
  | 'socialEcho'
  | 'maintenance'
  | 'periodGoal'
  | 'playerStyle'
  | 'tomorrowRisk';

export type ReportReplayTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral'
  | 'strategic';

export type ReportReplayChip = {
  label: string;
  value?: string;
  tone: ReportReplayTone;
};

export type ReportReplayItem = {
  id: string;
  type: ReportReplayItemType;
  title: string;
  description: string;
  timeLabel?: string;
  sourceLabel: string;
  tone: ReportReplayTone;
  icon?: string;
  chips?: ReportReplayChip[];
  priority: number;
  dedupeKey: string;
};

export type ReportReplayPresentation = {
  title: string;
  subtitle: string;
  summary: string;
  items: ReportReplayItem[];
  countLabel: string;
  emptyFallback?: ReportReplayItem;
};

export type ReportReplayDecisionContext = {
  eventTitle?: string | null;
  decisionLabel?: string | null;
  neighborhoodName?: string | null;
  eventId?: string | null;
};

export type ReportReplayCityReactionContext = {
  headline?: string | null;
  shortSummary?: string | null;
  reportMemoryLine?: string | null;
  socialEchoLine?: string | null;
  nextRiskHint?: string | null;
  tone?: ReportReplayTone | null;
};

export type ReportReplayContextInput = {
  day: number;
  decision?: ReportReplayDecisionContext | null;
  cityReaction?: ReportReplayCityReactionContext | null;
  metrics?: {
    publicSatisfaction?: number;
    staffMorale?: number;
    budget?: number;
  };
  socialEchoMessage?: string | null;
  socialEchoTitle?: string | null;
  cityEchoLine?: string | null;
  decisionImpactLine?: string | null;
  maintenanceActiveCount?: number;
  maintenanceCriticalCount?: number;
  maintenanceSummaryLine?: string | null;
  maintenanceEconomyReplayLine?: string | null;
  periodGoalTitle?: string | null;
  periodGoalProgressLabel?: string | null;
  periodGoalImpactLine?: string | null;
  playerStyleLabel?: string | null;
  managementStyleLine?: string | null;
  tomorrowRiskLine?: string | null;
  tomorrowRiskSupportLine?: string | null;
  tomorrowPreparationLine?: string | null;
  cliffhangerLine?: string | null;
  operationalTempoLine?: string | null;
  avoidLines?: string[];
  districtPersonalityCityImpactLine?: string | null;
  districtPersonalitySocialLine?: string | null;
  districtPersonalityMaintenanceLine?: string | null;
};
