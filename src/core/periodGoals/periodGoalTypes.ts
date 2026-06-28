export type PeriodGoalId =
  | 'restore_trust'
  | 'control_resource_pressure'
  | 'stabilize_service_rhythm'
  | 'reduce_social_heat'
  | 'strengthen_readiness'
  | 'balance_district_attention'
  | 'prevent_tomorrow_risk'
  | 'adaptive_management';

export type PeriodGoalTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral'
  | 'strategic';

export type PeriodGoalProgressBand =
  | 'starting'
  | 'moving'
  | 'steady'
  | 'strained'
  | 'at_risk';

export type PeriodGoalSurface = 'hub' | 'report' | 'growth' | 'advisor';

export type PeriodGoalChip = {
  label: string;
  value: string;
  tone: PeriodGoalTone;
};

export type PeriodGoalPresentation = {
  id: PeriodGoalId;
  title: string;
  shortTitle: string;
  description: string;
  tone: PeriodGoalTone;
  progressBand: PeriodGoalProgressBand;
  progressLabel: string;
  progressValue?: number;
  chips: PeriodGoalChip[];
  currentSignal: string;
  nextHint: string;
  relatedSurfaces: PeriodGoalSurface[];
};

export type PeriodGoalDashboardPresentation = {
  title: string;
  subtitle: string;
  activeGoal: PeriodGoalPresentation;
  secondaryGoals: PeriodGoalPresentation[];
  summary: string;
  countLabel: string;
};

export type HubPeriodGoalCardPresentation = {
  visibility: 'visible' | 'hidden';
  sectionTitle: string;
  goalTitle: string;
  summary: string;
  progressLabel: string;
  progressTone: PeriodGoalTone;
  chips: PeriodGoalChip[];
  nextHint: string;
  secondaryChip?: string | null;
  eceHint?: string | null;
};

export type GrowthPeriodFocusCardPresentation = {
  visibility: 'visible' | 'hidden';
  sectionTitle: string;
  microcopy: string;
  goalTitle: string;
  progressLabel: string;
  progressTone: PeriodGoalTone;
  evidenceChips: PeriodGoalChip[];
};

export type ReportPeriodGoalInsight = {
  label: string;
  line: string;
  tone: PeriodGoalTone;
};

export type PeriodGoalContextInput = {
  day: number;
  socialPulseScore?: number;
  socialRiskLevel?: 'low' | 'medium' | 'high' | 'critical';
  maintenanceActiveCount?: number;
  maintenanceCriticalCount?: number;
  maintenanceStrainedCount?: number;
  readinessReady?: boolean;
  budgetPressureHigh?: boolean;
  resourcePressureHigh?: boolean;
  trustFragile?: boolean;
  trustDeclining?: boolean;
  trustImproving?: boolean;
  serviceSensitive?: boolean;
  routeSensitive?: boolean;
  marketPressure?: boolean;
  repeatedDistrictFocus?: boolean;
  repeatedDistrictName?: string | null;
  tomorrowRiskHigh?: boolean;
  tomorrowRiskLine?: string | null;
  playerStyleId?: string | null;
  dominantStrategyId?: string | null;
  selectedDistrictName?: string | null;
  publicSatisfactionLow?: boolean;
  avoidGoalIds?: PeriodGoalId[];
};
