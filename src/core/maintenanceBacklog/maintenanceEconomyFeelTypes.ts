import type { MaintenanceBacklogTone } from './maintenanceBacklogTypes';
import type { MaintenanceEconomyCostBand } from './maintenanceEconomyTypes';

export type MaintenanceEconomyDensityBand = 'day1' | 'openEnded';

export type MaintenanceEconomyToneId =
  | 'readiness_strengthened'
  | 'short_term_cost'
  | 'tomorrow_risk_reduced'
  | 'pressure_growing'
  | 'resource_kept_risk_remains'
  | 'neglect_shadowed_ops'
  | 'timely_maintenance_relief'
  | 'plan_strains_capacity'
  | 'balanced'
  | 'calm';

export type MaintenanceEconomyPressureLevel = 'low' | 'moderate' | 'high' | 'critical';

export type MaintenanceEconomyChipTone = 'gain' | 'cost' | 'risk' | 'neutral' | 'teal';

export type MaintenanceEconomyChip = {
  id: string;
  label: string;
  tone: MaintenanceEconomyChipTone;
};

export type MaintenanceEconomyTradeoffStrip = {
  visible: boolean;
  gains: MaintenanceEconomyChip[];
  costs: MaintenanceEconomyChip[];
  balanceRatio: number;
  balanceLabel: string;
};

export type MaintenanceEconomyDeferRiskPreview = {
  visible: boolean;
  line: string;
  riskChip: MaintenanceEconomyChip | null;
  tomorrowChip: MaintenanceEconomyChip | null;
};

export type MaintenanceEconomyOpportunityCostPreview = {
  visible: boolean;
  line: string;
};

export type MaintenanceEconomyPostureId =
  | 'act_now'
  | 'monitor'
  | 'defer_cautious'
  | 'protect_capacity'
  | 'steady';

export type MaintenanceEconomyFeelPresentation = {
  densityBand: MaintenanceEconomyDensityBand;
  pressureLevel: MaintenanceEconomyPressureLevel;
  pressureScore: number;
  toneId: MaintenanceEconomyToneId;
  overallTone: MaintenanceBacklogTone;
  title: string;
  summary: string;
  chips: MaintenanceEconomyChip[];
  ctaHint: string;
  tradeoffStrip: MaintenanceEconomyTradeoffStrip;
  deferRisk: MaintenanceEconomyDeferRiskPreview;
  opportunityCost: MaintenanceEconomyOpportunityCostPreview;
  recommendedPosture: MaintenanceEconomyPostureId;
  postureLabel: string;
  operationImpactLine: string | null;
  portfolioBridgeLine: string | null;
  resultRevealLine: string | null;
  closureGainLabel: string | null;
  closureCostLabel: string | null;
  tomorrowFocusHint: string | null;
  memoryHistoryLine: string | null;
  eceDay1Line: string | null;
  estimatedCostBand: MaintenanceEconomyCostBand;
  collectStrings: () => string[];
};
