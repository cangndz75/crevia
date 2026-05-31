export type CrisisActionType =
  | 'crisis_coordination'
  | 'public_briefing'
  | 'field_rebalance'
  | 'preventive_maintenance'
  | 'monitor_only';

export type CrisisActionStatus = 'available' | 'selected' | 'processed' | 'expired';

export type CrisisActionAccessMode = 'inactive' | 'limited_preview' | 'active';

export type CrisisActionDomain =
  | 'city'
  | 'districts'
  | 'vehicles'
  | 'personnel'
  | 'containers'
  | 'social'
  | 'assignments'
  | 'crisis'
  | 'season';

export type CrisisActionTone = 'neutral' | 'positive' | 'warning' | 'critical';

export type CrisisActionEffect = {
  domain: CrisisActionDomain;
  targetId?: string;
  delta: number;
  reason: string;
  sourceTags: string[];
};

export type CrisisResolutionAction = {
  id: string;
  day: number;
  type: CrisisActionType;
  status: CrisisActionStatus;
  title: string;
  summary: string;
  reasonLine: string;
  tradeoffLine: string;
  advisorLine?: string;
  relatedIncidentId?: string;
  affectedDistrictIds: string[];
  effects: CrisisActionEffect[];
  selectedAtDay?: number;
  processedAtDay?: number;
  expiresAtDay?: number;
  sourceTags: string[];
};

export type CrisisActionDailySummary = {
  day: number;
  availableCount: number;
  selectedCount: number;
  processedCount: number;
  selectedActionType?: CrisisActionType;
  reportLines: string[];
};

export type CrisisActionState = {
  actionsById: Record<string, CrisisResolutionAction>;
  activeActionId?: string;
  dailySummary?: CrisisActionDailySummary;
  lastGeneratedDay?: number;
  lastProcessedDay?: number;
  lastPrunedDay?: number;
};

export type CrisisActionImpactPreview = {
  title: string;
  summary: string;
  effects: CrisisActionEffect[];
  tone: CrisisActionTone;
};

export type CrisisActionHubModel = {
  title: string;
  subtitle: string;
  actionLabel: string;
  summary: string;
  reasonLine: string;
  tradeoffLine: string;
  advisorLine?: string;
  tone: CrisisActionTone;
  ctaLabel: string;
  selectedLabel?: string;
  compact: boolean;
  visible: boolean;
};

export type CrisisActionSheetModel = {
  title: string;
  subtitle: string;
  actionRows: Array<{
    id: CrisisActionType;
    label: string;
    summary: string;
    tradeoff: string;
    tone: CrisisActionTone;
    iconKey: string;
    isRecommended: boolean;
  }>;
  confirmLabel: string;
  footerNote: string;
};

export type CrisisActionReportModel = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: CrisisActionTone;
  visible: boolean;
};

export type CrisisActionEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  monetization: import('@/core/monetization/monetizationTypes').MonetizationState;
  crisisState: import('@/core/crisis/crisisTypes').CrisisState;
  operationSignals: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  assignments?: import('@/core/assignments/assignmentTypes').AssignmentsState;
  dailyOperationsPlan?: import('@/core/dailyPlanning/dailyPlanningTypes').DailyOperationsPlanState;
  mainOperationSeason?: import('@/core/mainOperation/mainOperationTypes').MainOperationSeasonState;
  advisorState?: import('@/core/advisors/advisorTypes').AdvisorState;
  crisisActionState: CrisisActionState;
};
