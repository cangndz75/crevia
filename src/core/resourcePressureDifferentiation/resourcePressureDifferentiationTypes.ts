export type ResourcePressureDomain =
  | 'general_resource'
  | 'route_pressure'
  | 'container_pressure'
  | 'social_trust_pressure'
  | 'district_neglect_pressure'
  | 'recovery_opportunity'
  | 'follow_up_pressure'
  | 'risk_signal'
  | 'team_capacity_pressure'
  | 'vehicle_strain_pressure'
  | 'safe_watch'
  | 'fallback';

export type ResourcePressureCostAxis =
  | 'budget'
  | 'team'
  | 'vehicle'
  | 'time'
  | 'trust'
  | 'attention'
  | 'future_risk';

export type ResourcePressureCostVector = {
  budget: number;
  team: number;
  vehicle: number;
  time: number;
  trust: number;
  attention: number;
  futureRisk: number;
};

export type ResourcePressureIntensity = 'low' | 'medium' | 'high';

export type ResourcePressureConfidence = 'low' | 'medium' | 'high';

export type ResourcePressureDifferentiationProfile = {
  id: string;
  domain: ResourcePressureDomain;
  title: string;
  reasonLine: string;
  costVector: ResourcePressureCostVector;
  dominantAxis: ResourcePressureCostAxis;
  opportunityCostLine?: string;
  cautionLine?: string;
  sourceIds: string[];
  priority: number;
  intensity: ResourcePressureIntensity;
  confidence: ResourcePressureConfidence;
  isFallback: boolean;
};

export type ResourcePressureDifferentiationResult = {
  day: number;
  isActive: boolean;
  profiles: ResourcePressureDifferentiationProfile[];
  primaryProfile?: ResourcePressureDifferentiationProfile;
  dailyCapacityCostHints: ResourcePressureDifferentiationProfile[];
  portfolioCostHints: ResourcePressureDifferentiationProfile[];
  deferRiskCostHints: ResourcePressureDifferentiationProfile[];
  operationFeedCostHints: ResourcePressureDifferentiationProfile[];
  sourceIds: string[];
};

export type ResourcePressureDifferentiationInput = {
  day: number;
  dailyCapacityPortfolioResult?: unknown;
  portfolioDeferRiskResult?: unknown;
  day8OperationFeedBindingResult?: unknown;
  followUpExecutionResult?: unknown;
  day8StrategicContentResult?: unknown;
  cityRhythmDirectorResult?: unknown;
  districtNeglectRecoveryResult?: unknown;
  positiveComebackResult?: unknown;
  operationalResourceState?: unknown;
  vehicleMaintenanceState?: unknown;
  teamSpecializationState?: unknown;
  containerNetworkState?: unknown;
  socialPulseState?: unknown;
  authorityExpansionSummary?: unknown;
};

export type ResourcePressureCostHintCard = {
  id: string;
  title: string;
  reasonLine: string;
  dominantAxisLabel: string;
  intensityLabel: string;
  badgeLabel: string;
  accessibilityLabel: string;
};
