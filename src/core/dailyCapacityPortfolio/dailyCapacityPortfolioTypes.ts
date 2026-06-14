import type { MapGameplayVisibilityLevel } from '@/core/mapGameplayBinding/mapGameplayBindingTypes';

export const DAILY_CAPACITY_KINDS = [
  'operation_slots',
  'field_team_capacity',
  'vehicle_route_capacity',
  'resource_attention',
  'social_attention',
  'district_focus',
  'follow_up_capacity',
] as const;

export type DailyCapacityKind = (typeof DAILY_CAPACITY_KINDS)[number];

export const DAILY_CAPACITY_BANDS = ['low', 'medium', 'high', 'full'] as const;

export type DailyCapacityBand = (typeof DAILY_CAPACITY_BANDS)[number];

export const DAILY_CAPACITY_SOURCE_KINDS = [
  'post_pilot_event_quota',
  'active_events',
  'operation_signals',
  'district_personality',
  'event_gameplay_variety',
  'map_gameplay_binding',
  'active_operation_map_binding',
  'decision_consequence',
  'tomorrow_risk',
  'resource_pressure',
  'vehicle_maintenance',
  'team_specialization',
  'social_pulse',
  'district_trust',
  'district_memory',
  'reward_comeback',
  'authority_permission',
  'fallback',
] as const;

export type DailyCapacitySourceKind = (typeof DAILY_CAPACITY_SOURCE_KINDS)[number];

export type DailyCapacityEntry = {
  kind: DailyCapacityKind;
  available: number;
  used: number;
  reserved: number;
  remaining: number;
  band: DailyCapacityBand;
  label: string;
  line: string;
  sourceIds: string[];
  sourceKinds: DailyCapacitySourceKind[];
};

export const DAILY_CAPACITY_MODES = [
  'tutorial',
  'pilot',
  'post_pilot_light',
  'post_pilot_strategic',
] as const;

export type DailyCapacityMode = (typeof DAILY_CAPACITY_MODES)[number];

export type DailyCapacitySummary = {
  day: number;
  mode: DailyCapacityMode;
  title: string;
  summaryLine: string;
  capacityEntries: DailyCapacityEntry[];
  operationSlotLimit: number;
  portfolioItemLimit: number;
  selectedItemCount: number;
  availableItemCount: number;
  deferredItemCount: number;
  hasStrategicPressure: boolean;
  primaryTradeoffLine?: string;
  sourceIds: string[];
  sourceKinds: DailyCapacitySourceKind[];
};

export const OPERATION_PORTFOLIO_ITEM_KINDS = [
  'active_operation',
  'risk_signal',
  'district_pressure',
  'resource_pressure',
  'route_pressure',
  'social_pressure',
  'container_pressure',
  'maintenance_warning',
  'memory_trace',
  'recovery_opportunity',
  'positive_opportunity',
  'follow_up_candidate',
] as const;

export type OperationPortfolioItemKind = (typeof OPERATION_PORTFOLIO_ITEM_KINDS)[number];

export const OPERATION_PORTFOLIO_ITEM_STATUSES = [
  'selected',
  'available',
  'deferred',
  'watch_only',
  'locked',
  'resolved',
  'expired',
] as const;

export type OperationPortfolioItemStatus = (typeof OPERATION_PORTFOLIO_ITEM_STATUSES)[number];

export const OPERATION_PORTFOLIO_PRESSURE_LEVELS = ['low', 'medium', 'high'] as const;

export type OperationPortfolioPressureLevel = (typeof OPERATION_PORTFOLIO_PRESSURE_LEVELS)[number];

export const OPERATION_PORTFOLIO_URGENCIES = ['low', 'medium', 'high'] as const;

export type OperationPortfolioUrgency = (typeof OPERATION_PORTFOLIO_URGENCIES)[number];

export const OPERATION_PORTFOLIO_OPPORTUNITY_VALUES = [
  'none',
  'low',
  'medium',
  'high',
] as const;

export type OperationPortfolioOpportunityValue =
  (typeof OPERATION_PORTFOLIO_OPPORTUNITY_VALUES)[number];

export const OPERATION_PORTFOLIO_DEFER_RISKS = [
  'safe_to_watch',
  'pressure_may_grow',
  'trust_may_drop',
  'resource_cost_may_rise',
  'route_may_strain',
  'social_reaction_may_grow',
  'opportunity_may_expire',
  'memory_trace_may_harden',
  'none',
] as const;

export type OperationPortfolioDeferRisk = (typeof OPERATION_PORTFOLIO_DEFER_RISKS)[number];

export type OperationPortfolioCapacityCost = {
  operationSlots: number;
  team: number;
  vehicle: number;
  resource: number;
  social: number;
  districtFocus: number;
  followUp: number;
};

export type OperationPortfolioConfidence = 'low' | 'medium' | 'high';

export type OperationPortfolioItem = {
  id: string;
  kind: OperationPortfolioItemKind;
  status: OperationPortfolioItemStatus;
  title: string;
  subtitle?: string;
  districtId?: string;
  districtName?: string;
  pressureLevel: OperationPortfolioPressureLevel;
  urgency: OperationPortfolioUrgency;
  opportunityValue: OperationPortfolioOpportunityValue;
  deferRisk: OperationPortfolioDeferRisk;
  capacityCost: OperationPortfolioCapacityCost;
  recommendedReason: string;
  deferRiskLine?: string;
  selectBenefitLine?: string;
  mapLine?: string;
  eceLine?: string;
  authorityTeaserLine?: string;
  sourceIds: string[];
  sourceKinds: DailyCapacitySourceKind[];
  confidence: OperationPortfolioConfidence;
  priority: number;
  isActionable: boolean;
  isMapRecommended: boolean;
  isFollowUp: boolean;
  visibilityLevel: MapGameplayVisibilityLevel;
};

export type DailyCapacityPortfolioInput = {
  day: number;
  activeEvents?: unknown[];
  postPilotState?: unknown;
  operationSignals?: unknown;
  districtPersonalityProfiles?: unknown[];
  eventGameplayVarietyProfiles?: unknown[];
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  decisionConsequenceThreads?: unknown[];
  tomorrowRiskSignals?: unknown;
  resourceSignals?: unknown;
  vehicleMaintenanceSignals?: unknown;
  teamSpecializationSignals?: unknown;
  socialPulseSignals?: unknown;
  districtTrustSignals?: unknown;
  districtMemorySignals?: unknown;
  rewardComebackSignals?: unknown;
  authorityPermissionIds?: string[];
  authorityRankId?: string;
  recentPortfolioItemIds?: string[];
};

export type DailyCapacityPortfolioResult = {
  summary: DailyCapacitySummary;
  items: OperationPortfolioItem[];
  selectedItems: OperationPortfolioItem[];
  availableItems: OperationPortfolioItem[];
  deferredItems: OperationPortfolioItem[];
  watchOnlyItems: OperationPortfolioItem[];
  mapRecommendedItems: OperationPortfolioItem[];
  primaryRecommendation?: OperationPortfolioItem;
  primaryTradeoffLine?: string;
  ecePortfolioLine?: string;
  sourceIds: string[];
};

export type OperationPortfolioCardModel = {
  id: string;
  title: string;
  subtitle?: string;
  badgeLabel: string;
  statusLabel: string;
  capacityLine: string;
  decisionLine: string;
  deferRiskLine?: string;
  selectBenefitLine?: string;
  mapLine?: string;
  eceLine?: string;
  tone: 'neutral' | 'positive' | 'warning' | 'locked';
  isActionable: boolean;
  priority: number;
  accessibilityLabel: string;
};

export type DailyCapacityPortfolioSummaryCardModel = {
  id: string;
  title: string;
  summaryLine: string;
  capacityLabel: string;
  primaryTradeoffLine?: string;
  itemCountLabel: string;
  accessibilityLabel: string;
};
