import type { MaintenanceActionKind } from './maintenanceActionTypes';
import type {
  MaintenanceRuntimeDomain,
  MaintenanceRuntimeSeverity,
} from './maintenanceBacklogRuntimeTypes';

export type MaintenanceEconomyStatus =
  | 'none'
  | 'queued'
  | 'in_progress'
  | 'stabilized'
  | 'resolved';

export type MaintenanceEconomyEffort = 'low' | 'medium' | 'high';

export type MaintenanceEconomyCostBand = 'none' | 'low' | 'medium' | 'high';

export type MaintenanceEconomyPlan = {
  estimatedCost: number;
  costBand: MaintenanceEconomyCostBand;
  effort: MaintenanceEconomyEffort;
  estimatedDays: number;
  economyStatus: MaintenanceEconomyStatus;
  effectLabel: string;
};

export type MaintenanceEconomyPreview = {
  costLabel: string;
  effortLabel: string;
  durationLabel: string;
  effectLabel: string;
};

export type EstimateMaintenanceEconomyInput = {
  domain: MaintenanceRuntimeDomain;
  severity: MaintenanceRuntimeSeverity;
  actionKind: MaintenanceActionKind;
  currentDay: number;
};
