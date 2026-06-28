import type { MaintenanceEconomyStatus } from './maintenanceEconomyTypes';

export type MaintenanceRuntimeDomain =
  | 'personnel'
  | 'vehicle'
  | 'equipment'
  | 'facility'
  | 'route'
  | 'budget'
  | 'operation';

export type MaintenanceRuntimeSeverity = 'attention' | 'strained' | 'critical';

export type MaintenanceRuntimeStatus = 'open' | 'watching' | 'carried' | 'resolved';

export type MaintenanceRuntimeItem = {
  id: string;
  domain: MaintenanceRuntimeDomain;
  severity: MaintenanceRuntimeSeverity;
  status: MaintenanceRuntimeStatus;
  createdDay: number;
  updatedDay: number;
  carryOverDays: number;
  sourceReadinessId?: string;
  sourceDedupeKey: string;
  lastReasonLabels: string[];
  districtId?: string;
  districtName?: string;
  relatedEventId?: string;
  economyStatus?: MaintenanceEconomyStatus;
  estimatedCost?: number;
  estimatedDays?: number;
  startedDay?: number;
  dueDay?: number;
  paidCost?: number;
};

export type MaintenanceBacklogRuntimeState = {
  items: MaintenanceRuntimeItem[];
  lastProcessedDay?: number;
  /** Attention candidate dedupeKey → consecutive day count */
  attentionStreaks: Record<string, number>;
};

export type MaintenanceBacklogDayCloseInput = {
  day: number;
  staffMorale?: number;
  budget?: number;
  publicSatisfaction?: number;
  warningsCount?: number;
  operationSignals?: {
    personnel?: { status?: string };
    vehicles?: { status?: string };
    containers?: { status?: string };
    districts?: { status?: string };
  };
  relatedEventId?: string;
  districtId?: string;
  districtName?: string;
};

export const MAINTENANCE_RUNTIME_DOMAINS: MaintenanceRuntimeDomain[] = [
  'personnel',
  'vehicle',
  'equipment',
  'facility',
  'route',
  'budget',
  'operation',
];
