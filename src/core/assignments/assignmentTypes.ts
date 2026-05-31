export type AssignmentStatus = 'draft' | 'confirmed' | 'dispatched' | 'processed';

export type AssignmentSource = 'player' | 'advisor_suggested' | 'auto_default';

export type PersonnelAssignmentType =
  | 'balanced_team'
  | 'field_response_team'
  | 'technical_team'
  | 'public_relations_team'
  | 'inspection_team';

export type VehicleAssignmentType =
  | 'standard_truck'
  | 'high_capacity_vehicle'
  | 'compact_service_vehicle'
  | 'maintenance_vehicle'
  | 'route_support_vehicle';

export type ResponseApproachType =
  | 'balanced_response'
  | 'rapid_response'
  | 'lasting_fix'
  | 'low_resource'
  | 'public_first';

export type AssignmentEffectDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'overall';

export type CompatibilityLabel = 'Zayıf uyum' | 'Dengeli uyum' | 'Güçlü uyum';

export type AssignmentEffect = {
  domain: AssignmentEffectDomain;
  delta: number;
  reason: string;
  sourceTags: string[];
};

export type EventAssignmentState = {
  eventId: string;
  day: number;
  status: AssignmentStatus;
  source: AssignmentSource;
  personnelType: PersonnelAssignmentType;
  vehicleType: VehicleAssignmentType;
  approachType: ResponseApproachType;
  compatibilityScore: number;
  compatibilityLabel: CompatibilityLabel;
  confirmedAtDay?: number;
  dispatchedAtDay?: number;
  processedAtDay?: number;
  effects: AssignmentEffect[];
  advisorNote?: string;
};

export type AssignmentsState = {
  assignmentsByEventId: Record<string, EventAssignmentState>;
  lastProcessedDay?: number;
  dailyAssignmentSummary?: {
    day: number;
    confirmedCount: number;
    strongFitCount: number;
    weakFitCount: number;
    dominantDomain?: AssignmentEffectDomain;
  };
};

export type AssignmentOptionTone = 'balanced' | 'positive' | 'warning';

export type AssignmentOption = {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  upside: string;
  tradeoff: string;
  tone: AssignmentOptionTone;
  sourceTags: string[];
};

export type AssignmentCompatibilityResult = {
  score: number;
  label: CompatibilityLabel;
  summary: string;
  warnings: string[];
  strengths: string[];
  effects: AssignmentEffect[];
};

export type AssignmentImpactPreview = {
  title: string;
  summary: string;
  compatibilityLabel: CompatibilityLabel;
  effects: AssignmentEffect[];
  tone: 'positive' | 'neutral' | 'warning';
};

export type AssignmentPresentationTone = 'positive' | 'neutral' | 'warning';

export type AssignmentPanelRow = {
  key: string;
  label: string;
  value: string;
  summary: string;
  iconKey: string;
  tone: string;
};

export type AssignmentPanelModel = {
  title: string;
  subtitle: string;
  statusLabel: string;
  compatibilityLabel: string;
  compatibilitySummary: string;
  rows: AssignmentPanelRow[];
  advisorLine: string;
  ctaLabel: string;
  editLabel: string;
  compact: boolean;
  isConfirmed: boolean;
};

export type AssignmentEditorSection = {
  key: 'personnel' | 'vehicle' | 'approach';
  title: string;
  options: AssignmentOption[];
};

export type AssignmentEditorModel = {
  title: string;
  sections: AssignmentEditorSection[];
  warningLines: string[];
  strengths: string[];
  confirmLabel: string;
};

export type AssignmentImpactPreviewModel = {
  title: string;
  summary: string;
  compatibilityLabel: string;
  tone: AssignmentPresentationTone;
  visible: boolean;
};

export type AssignmentResultSummaryModel = {
  title: string;
  lines: string[];
  compatibilityLabel: string;
};

export type AssignmentReportModel = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: AssignmentPresentationTone;
};

export type AssignmentEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  operationSignals?: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  advisorState?: import('@/core/advisors/advisorTypes').AdvisorState;
  dailyOperationsPlan?: import('@/core/dailyPlanning/dailyPlanningTypes').DailyOperationsPlanState;
  assignments: AssignmentsState;
  isDay1Tutorial?: boolean;
  postPilotLightPhase?: boolean;
};
