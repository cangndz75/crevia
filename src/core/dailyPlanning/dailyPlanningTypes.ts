export type DailyPlanStatus =
  | 'unplanned'
  | 'suggested'
  | 'confirmed'
  | 'processed';

export type DailyPersonnelFocus =
  | 'balanced_shift'
  | 'rapid_response'
  | 'rest_rotation'
  | 'field_inspection';

export type DailyVehicleFocus =
  | 'ready_fleet'
  | 'preventive_maintenance'
  | 'high_capacity'
  | 'route_check';

export type DailyContainerFocus =
  | 'standard_collection'
  | 'intensive_collection'
  | 'cleanliness_maintenance'
  | 'risk_inspection';

export type DailyPlanSource = 'player' | 'advisor_suggested' | 'auto_default';

export type DailyPlanEffectDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'overall';

export type DailyPlanTone = 'balanced' | 'positive' | 'warning';

export type DailyPlanPresentationTone = 'positive' | 'neutral' | 'warning';

export type DailyPlanEffect = {
  domain: DailyPlanEffectDomain;
  /** Negatif iyileştirme, pozitif risk artışı */
  delta: number;
  reason: string;
};

export type DailyOperationsPlanState = {
  day: number;
  status: DailyPlanStatus;
  source: DailyPlanSource;
  districtFocusId: string;
  personnelFocus: DailyPersonnelFocus;
  vehicleFocus: DailyVehicleFocus;
  containerFocus: DailyContainerFocus;
  operationFocusPoints: {
    total: number;
    used: number;
    remaining: number;
  };
  confirmedAtDay?: number;
  lastProcessedDay?: number;
  lastEditedDay?: number;
  advisorSuggested: boolean;
  appliedEffects: DailyPlanEffect[];
};

export type DailyPlanOption = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  upside: string;
  tradeoff: string;
  tone: DailyPlanTone;
  cost: number;
  sourceTags: string[];
};

export type DailyPlanImpactPreview = {
  title: string;
  summary: string;
  effects: DailyPlanEffect[];
  tone: DailyPlanPresentationTone;
};

export type DailyPlanReportSummary = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: DailyPlanPresentationTone;
};

export type DailyPlanHubFocusRow = {
  key: string;
  label: string;
  value: string;
  summary: string;
  iconKey: string;
  tone: string;
};

export type DailyPlanHubModel = {
  title: string;
  subtitle: string;
  statusLabel: string;
  districtLine: string;
  focusRows: DailyPlanHubFocusRow[];
  focusPointsLabel: string;
  advisorLine: string;
  ctaLabel: string;
  secondaryCtaLabel?: string;
  compact: boolean;
  canConfirm: boolean;
  canEdit: boolean;
  overBudget: boolean;
};

export type DailyPlanEditSection = {
  key: 'district' | 'personnel' | 'vehicles' | 'containers';
  title: string;
  options: DailyPlanOption[];
};

export type DailyPlanEditModel = {
  title: string;
  sections: DailyPlanEditSection[];
  confirmLabel: string;
  warningLine?: string;
  focusPointsLabel: string;
  selectedDistrictId: string;
  selectedPersonnel: DailyPersonnelFocus;
  selectedVehicle: DailyVehicleFocus;
  selectedContainer: DailyContainerFocus;
  totalCost: number;
  canConfirm: boolean;
};

export type DailyPlanImpactPreviewModel = {
  title: string;
  summary: string;
  tone: DailyPlanPresentationTone;
  visible: boolean;
};

export type DailyPlanningEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  operationSignals?: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  advisorState?: import('@/core/advisors/advisorTypes').AdvisorState;
  dailyOperationsPlan?: DailyOperationsPlanState;
  isDay1Tutorial?: boolean;
  postPilotLightPhase?: boolean;
};
