export type OperationSignalStatus = 'stable' | 'watch' | 'strained' | 'critical';

export type OperationSignalDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'overall';

export type OperationSignalTrend = 'improving' | 'steady' | 'worsening';

export type OperationDailyFocus =
  | 'balanced'
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts';

export type OperationDomainSignal = {
  domain: OperationSignalDomain;
  status: OperationSignalStatus;
  /** 0–100 baskı/risk skoru — yüksek kötü */
  score: number;
  trend: OperationSignalTrend;
  title: string;
  summary: string;
  sourceTags: string[];
  lastUpdatedDay: number;
};

export type OperationSignalsState = {
  personnel: OperationDomainSignal;
  vehicles: OperationDomainSignal;
  containers: OperationDomainSignal;
  districts: OperationDomainSignal;
  overall: OperationDomainSignal;
  priorityDistrictId: string;
  dailyFocus: OperationDailyFocus;
  lastProcessedDay: number;
  lastRefreshedDay: number;
};

export type OperationSignalsSnapshot = {
  day: number;
  personnelScore: number;
  vehicleScore: number;
  containerScore: number;
  districtScore: number;
  overallScore: number;
  priorityDistrictId: string;
};

export type OperationImpactPreview = {
  personnelDelta: number;
  vehicleDelta: number;
  containerDelta: number;
  districtDelta: number;
  summary: string;
  severityLabel: string;
};

export type OperationSignalsEngineInput = {
  gameState: import('@/core/models/GameState').GameState;
  personnelState?: import('@/core/personnel/personnelTypes').PersonnelState;
  vehicleState?: import('@/core/vehicles/vehicleTypes').VehicleState;
  containerState?: import('@/core/containers/containerTypes').ContainerState;
  decisionHistory?: import('@/core/models/DecisionRecord').DecisionRecord[];
  isDay1Tutorial?: boolean;
  operationSignals?: OperationSignalsState;
};

export type OperationSignalsHubRow = {
  key: OperationSignalDomain;
  label: string;
  value: string;
  summary: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
  iconKey: string;
};

export type OperationSignalsHubModel = {
  title: string;
  subtitle: string;
  overallLabel: string;
  overallTone: 'positive' | 'neutral' | 'warning' | 'critical';
  priorityLine: string;
  rows: OperationSignalsHubRow[];
  footerNote: string;
  compact: boolean;
};

export type OperationSignalsReportModel = {
  title: string;
  overallLabel: string;
  overallTone: 'positive' | 'neutral' | 'warning' | 'critical';
  lines: string[];
  footerNote: string;
};

export type OperationImpactPreviewModel = {
  title: string;
  summary: string;
  severityLabel: string;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
};
