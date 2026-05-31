export type MicroDecisionType =
  | 'advisor_warning'
  | 'field_update'
  | 'crisis_threshold'
  | 'district_representative'
  | 'operation_opportunity';

export type MicroDecisionStatus =
  | 'available'
  | 'resolved'
  | 'expired'
  | 'skipped';

export type MicroDecisionAccessMode =
  | 'inactive'
  | 'pilot_limited'
  | 'limited'
  | 'full';

export type MicroDecisionDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'social'
  | 'crisis'
  | 'assignments'
  | 'planning'
  | 'season';

export type MicroDecisionTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type MicroDecisionEffect = {
  domain: MicroDecisionDomain;
  targetId?: string;
  delta: number;
  reason: string;
  sourceTags: string[];
};

export type MicroDecisionOption = {
  id: string;
  label: string;
  description: string;
  upside: string;
  tradeoff: string;
  tone: MicroDecisionTone;
  effects: MicroDecisionEffect[];
  sourceTags: string[];
};

export type MicroDecision = {
  id: string;
  day: number;
  type: MicroDecisionType;
  status: MicroDecisionStatus;
  domain: MicroDecisionDomain;
  title: string;
  summary: string;
  reasonLine: string;
  advisorLine?: string;
  districtId?: string;
  relatedEventId?: string;
  relatedIncidentId?: string;
  options: MicroDecisionOption[];
  selectedOptionId?: string;
  createdAtDay: number;
  resolvedAtDay?: number;
  expiresAtDay?: number;
  effectsApplied?: boolean;
  sourceTags: string[];
};

export type MicroDecisionDailySummary = {
  day: number;
  generatedCount: number;
  resolvedCount: number;
  skippedCount: number;
  dominantDomain?: MicroDecisionDomain;
  reportLines: string[];
};

export type MicroDecisionState = {
  decisionsById: Record<string, MicroDecision>;
  activeDecisionIds: string[];
  dailySummary?: MicroDecisionDailySummary;
  lastGeneratedDay?: number;
  lastProcessedDay?: number;
  lastPrunedDay?: number;
};

export type MicroDecisionGenerationContext = {
  accessMode: MicroDecisionAccessMode;
  day: number;
  maxDailyDecisions: number;
  allowedTypes: MicroDecisionType[];
  candidateDomains: MicroDecisionDomain[];
};

export type MicroDecisionEngineInput = {
  day: number;
  gameState: import('@/core/models/GameState').GameState;
  monetization: import('@/core/monetization/monetizationTypes').MonetizationState;
  operationSignals: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  crisisState: import('@/core/crisis/crisisTypes').CrisisState;
  dailyOperationsPlan: import('@/core/dailyPlanning/dailyPlanningTypes').DailyOperationsPlanState;
  assignments: import('@/core/assignments/assignmentTypes').AssignmentsState;
  mainOperationSeason: import('@/core/mainOperation/mainOperationTypes').MainOperationSeasonState;
  advisorState: import('@/core/advisors/advisorTypes').AdvisorState;
  microDecisionState: MicroDecisionState;
  activeEvents: import('@/core/models/EventCard').EventCard[];
};

export type MicroDecisionCardModel = {
  id: string;
  title: string;
  typeLabel: string;
  summary: string;
  reasonLine: string;
  advisorLine?: string;
  tone: MicroDecisionTone;
  iconKey: string;
  optionRows: Array<{
    id: string;
    label: string;
    description: string;
    upside: string;
    tradeoff: string;
    tone: MicroDecisionTone;
  }>;
  footerNote: string;
  compact: boolean;
};

export type ActiveMicroDecisionsModel = {
  title: string;
  subtitle: string;
  decisions: MicroDecisionCardModel[];
  emptyLine?: string;
};

export type MicroDecisionReportModel = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: MicroDecisionTone;
};

export type MicroDecisionImpactPreviewModel = {
  line: string;
  tone: MicroDecisionTone;
};
