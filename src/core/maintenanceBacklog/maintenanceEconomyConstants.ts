import type { MaintenanceRuntimeDomain } from './maintenanceBacklogRuntimeTypes';

/** Nominal estimated cost units (presentation only — no resource mutation in lite pass). */
export const MAINTENANCE_ECONOMY_NOMINAL_COST = {
  none: 0,
  low: 450,
  medium: 1200,
  high: 2400,
} as const;

export const MAINTENANCE_ECONOMY_MAX_ACTIVE_PLANS = 3;

export const MAINTENANCE_ECONOMY_SEVERITY_WEIGHT: Record<
  import('./maintenanceBacklogRuntimeTypes').MaintenanceRuntimeSeverity,
  number
> = {
  attention: 1,
  strained: 2,
  critical: 3,
};

export const MAINTENANCE_ECONOMY_DOMAIN_WEIGHT: Record<MaintenanceRuntimeDomain, number> = {
  personnel: 1.1,
  vehicle: 1.4,
  equipment: 1.1,
  facility: 1.35,
  route: 1.15,
  budget: 1.15,
  operation: 1.2,
};
