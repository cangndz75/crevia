export type CrisisAccessMode = 'inactive' | 'limited_preview' | 'active';

export type CrisisRiskLevel = 'stable' | 'watch' | 'elevated' | 'critical';

export type CrisisDomain =
  | 'city'
  | 'districts'
  | 'vehicles'
  | 'personnel'
  | 'containers'
  | 'social'
  | 'assignments';

export type CrisisTrend = 'improving' | 'steady' | 'worsening';

export type CrisisSignal = {
  id: string;
  domain: CrisisDomain;
  riskLevel: CrisisRiskLevel;
  score: number;
  trend: CrisisTrend;
  title: string;
  summary: string;
  sourceTags: string[];
};

export type CrisisIncidentStatus =
  | 'none'
  | 'forming'
  | 'active'
  | 'contained'
  | 'resolved';

export type CrisisIncident = {
  id: string;
  day: number;
  status: CrisisIncidentStatus;
  title: string;
  summary: string;
  affectedDistrictIds: string[];
  primaryDomain: CrisisDomain;
  severity: 'medium' | 'high' | 'critical';
  sourceSignalIds: string[];
  resolvedDay?: number;
  reportLine?: string;
};

export type CrisisState = {
  accessMode: CrisisAccessMode;
  riskLevel: CrisisRiskLevel;
  cityCrisisScore: number;
  trend: CrisisTrend;
  activeIncident?: CrisisIncident;
  recentSignals: CrisisSignal[];
  lastProcessedDay?: number;
  lastRefreshedDay?: number;
  lastIncidentDay?: number;
  previousCityCrisisScore?: number;
};

export type CrisisImpactPreview = {
  title: string;
  summary: string;
  riskDelta: number;
  riskLabel: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
  sourceTags: string[];
};

export type CrisisReportSummary = {
  title: string;
  lines: string[];
  footerNote: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};

export type CrisisDeskHubModel = {
  title: string;
  subtitle: string;
  accessLabel: string;
  riskLabel: string;
  riskScoreLabel: string;
  activeIncidentTitle?: string;
  activeIncidentSummary?: string;
  signalRows: Array<{
    id: string;
    title: string;
    summary: string;
    tone: string;
    iconKey: string;
  }>;
  footerNote: string;
  ctaLabel?: string;
  compact: boolean;
  visible: boolean;
};

export type CrisisEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  monetization: import('@/core/monetization/monetizationTypes').MonetizationState;
  crisisState: CrisisState;
  operationSignals?: import('@/core/operations/operationSignalTypes').OperationSignalsState;
  assignments?: import('@/core/assignments/assignmentTypes').AssignmentsState;
  dailyOperationsPlan?: import('@/core/dailyPlanning/dailyPlanningTypes').DailyOperationsPlanState;
  mainOperationSeason?: import('@/core/mainOperation/mainOperationTypes').MainOperationSeasonState;
  operationalResources?: import('@/core/operationalResources/operationalResourceTypes').OperationalResourcesState;
};

/** Mahalle strip / harita rozeti */
export type CrisisMapDistrictBadge = {
  districtId: string;
  label: string;
  tone: 'neutral' | 'warning' | 'critical';
};

/** @deprecated CrisisMapDistrictBadge ile aynı — strip uyumluluğu */
export type CrisisMapLine = CrisisMapDistrictBadge;

export type CrisisMapPanelLine = {
  id: string;
  title: string;
  summary: string;
  tone: 'neutral' | 'warning' | 'critical';
  iconKey: string;
  affectedDistrictIds: string[];
};

export type CrisisMapPresentation = {
  visible: boolean;
  panelLines: CrisisMapPanelLine[];
  districtBadges: CrisisMapDistrictBadge[];
  mapTone: 'neutral' | 'warning' | 'critical';
  crisisDistrictIds: string[];
};
