import type { MapDistrictId } from '@/features/map/data/mapDistrictConstants';

export type MainOperationSeasonStatus =
  | 'inactive'
  | 'available'
  | 'active'
  | 'completed';

export type MainOperationAccessMode = 'none' | 'limited' | 'full';

export type MainOperationDistrictStatus =
  | 'inactive'
  | 'preview'
  | 'agenda'
  | 'active';

export type MainOperationSeasonGoalStatus = 'active' | 'completed' | 'failed';

export type MainOperationGoalDomain =
  | 'city_balance'
  | 'districts'
  | 'vehicles'
  | 'personnel'
  | 'containers'
  | 'assignments'
  | 'authority';

export type MainOperationDistrictScope = {
  districtId: MapDistrictId;
  status: MainOperationDistrictStatus;
  activatedDay?: number;
  title: string;
  summary: string;
  pressureScore: number;
};

export type MainOperationSeasonGoal = {
  id: string;
  domain: MainOperationGoalDomain;
  title: string;
  description: string;
  progress: number;
  target: number;
  status: MainOperationSeasonGoalStatus;
  sourceTags: string[];
};

export type MainOperationSeasonId = 'main_operation_season_1';

export type MainOperationSeasonState = {
  seasonId: MainOperationSeasonId;
  status: MainOperationSeasonStatus;
  accessMode: MainOperationAccessMode;
  startedAtDay?: number;
  currentSeasonDay: number;
  seasonLengthDays: number;
  districtScopes: Record<string, MainOperationDistrictScope>;
  goals: MainOperationSeasonGoal[];
  lastProcessedDay?: number;
  lastRefreshedDay?: number;
  lastSummaryDay?: number;
};

export type MainOperationDailyContext = {
  accessMode: MainOperationAccessMode;
  currentSeasonDay: number;
  activeDistrictIds: string[];
  agendaDistrictIds: string[];
  previewDistrictIds: string[];
  maxDailyEvents: number;
  anchorEventCount: number;
  sideEventCount: number;
  goalProgressLines: string[];
};

export type MainOperationReportSummary = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type MainOperationHubModel = {
  title: string;
  subtitle: string;
  accessLabel: string;
  seasonProgressLabel: string;
  activeDistrictLine: string;
  goalRows: Array<{
    id: string;
    title: string;
    progressLabel: string;
    progressRatio: number;
    tone: string;
  }>;
  footerNote: string;
  ctaLabel: string;
  compact: boolean;
  visible: boolean;
};

export type MainOperationSeasonCardModel = MainOperationHubModel;

export type MainOperationDistrictScopeModel = {
  rows: Array<{
    districtId: string;
    title: string;
    statusLabel: string;
    summary: string;
    pressureLabel: string;
    tone: 'positive' | 'neutral' | 'warning';
  }>;
  footerNote: string;
};

export type MainOperationAccessSummaryModel = {
  accessLabel: string;
  detailLine: string;
  tone: 'positive' | 'neutral' | 'warning';
};

export type MainOperationMapScopeBadge = {
  districtId: string;
  label: string;
  tone: 'active' | 'agenda' | 'preview' | 'limited' | 'none';
};

export type MainOperationEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  monetization: import('@/core/monetization/monetizationTypes').MonetizationState;
  mainOperationSeason: MainOperationSeasonState;
  operationSignals?: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  assignments?: import('@/core/assignments/assignmentTypes').AssignmentsState;
};

export type PostPilotMainOperationEventContext = {
  monetization: import('@/core/monetization/monetizationTypes').MonetizationState;
  mainOperationSeason: MainOperationSeasonState;
  operationSignals?: import('@/core/operations/operationSignalTypes').OperationSignalsState;
};
