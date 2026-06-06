export type TomorrowRiskKind =
  | 'route_pressure_tomorrow'
  | 'container_pressure_tomorrow'
  | 'social_trust_recovery'
  | 'personnel_fatigue_watch'
  | 'vehicle_fatigue_watch'
  | 'district_trust_watch'
  | 'crisis_prevention_watch'
  | 'resource_balance_watch'
  | 'recovery_momentum'
  | 'operation_era_hint'
  | 'post_pilot_next_scope'
  | 'generic_city_preparation'
  | 'fallback';

export type TomorrowRiskTone =
  | 'calm'
  | 'watch'
  | 'recovery'
  | 'opportunity'
  | 'risk';

export type TomorrowRiskPriority = 'low' | 'medium' | 'high';

export type TomorrowRiskSource =
  | 'carry_over'
  | 'tomorrow_hint'
  | 'operation_signals'
  | 'resource_fatigue'
  | 'district_trust'
  | 'social_recovery'
  | 'post_pilot'
  | 'operation_era'
  | 'fallback';

export type TomorrowRiskDomain =
  | 'route'
  | 'container'
  | 'social'
  | 'personnel'
  | 'vehicle'
  | 'district'
  | 'crisis'
  | 'resource'
  | 'operation'
  | 'city';

export type TomorrowRiskModel = {
  id: string;
  kind: TomorrowRiskKind;
  title: string;
  mainLine: string;
  supportLine?: string;
  ctaLine?: string;
  tone: TomorrowRiskTone;
  priority: TomorrowRiskPriority;
  relatedDistrictId?: string;
  relatedDomain?: TomorrowRiskDomain;
  relatedResource?: string;
  sourceSignals: TomorrowRiskSource[];
  shouldShowInReport: boolean;
  shouldShowInHub: boolean;
  shouldShowAsCompact: boolean;
  maxVisibleLines: number;
};

export type TomorrowRiskOperationSignal = {
  summary?: string;
  status?: string;
  score?: number;
};

export type TomorrowRiskInput = {
  day: number;
  carryOver?: {
    summary?: string;
    detail?: string;
    domain?: string;
    visible?: boolean;
    districtId?: string;
  } | null;
  tomorrowHint?: string | null;
  reportTomorrowPreview?: {
    summary?: string;
    domain?: string;
    visible?: boolean;
  } | null;
  operationSignals?: {
    dailyFocus?: string;
    priorityDistrictId?: string;
    containers?: TomorrowRiskOperationSignal;
    vehicles?: TomorrowRiskOperationSignal;
    personnel?: TomorrowRiskOperationSignal;
    districts?: TomorrowRiskOperationSignal;
    overall?: TomorrowRiskOperationSignal;
  } | null;
  resourceFatigue?: unknown;
  districtTrustRuntime?: unknown;
  districtMemoryRuntime?: unknown;
  socialPulse?: {
    globalPulseScore?: number;
    previousGlobalPulseScore?: number;
    score?: number;
    trend?: string;
  } | null;
  postPilotOperation?: {
    phase?: string;
    operationDay?: number;
    scopes?: Record<string, string>;
  } | null;
  existingLines?: string[];
};

export type TomorrowRiskPresentation = {
  report: TomorrowRiskModel | null;
  hub: TomorrowRiskModel | null;
  oneMoreDayCta: string | null;
};
