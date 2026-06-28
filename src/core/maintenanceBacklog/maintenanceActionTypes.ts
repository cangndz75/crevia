import type { MaintenanceRuntimeDomain } from './maintenanceBacklogRuntimeTypes';

export type MaintenanceActionKind =
  | 'monitor'
  | 'rebalance'
  | 'inspect'
  | 'stabilize'
  | 'defer';

export type MaintenanceActionTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral';

export type MaintenanceActionSurface = 'dispatch' | 'field' | 'result';

export type MaintenanceActionPresentation = {
  itemId: string;
  actionKind: MaintenanceActionKind;
  label: string;
  description: string;
  tone: MaintenanceActionTone;
  enabled: boolean;
  disabledReason?: string;
  resultPreview: string;
  costPreview?: string;
  effortPreview?: string;
  durationPreview?: string;
  effectPreview?: string;
  compactPreview?: string;
};

export type MaintenanceActionResultPresentation = {
  title: string;
  description: string;
  tone: MaintenanceActionTone;
  updatedStatusLabel: string;
};

export type MaintenanceActionUiBundle = {
  hintText?: string;
  hintTone?: MaintenanceActionTone;
  countLabel?: string;
  action?: MaintenanceActionPresentation | null;
  feedback?: MaintenanceActionResultPresentation | null;
};

export const MAINTENANCE_ACTION_DOMAIN_KINDS: Record<
  MaintenanceRuntimeDomain,
  MaintenanceActionKind[]
> = {
  personnel: ['monitor', 'rebalance', 'stabilize'],
  vehicle: ['monitor', 'inspect'],
  equipment: ['monitor', 'inspect'],
  facility: ['monitor', 'inspect'],
  route: ['monitor', 'inspect', 'stabilize'],
  budget: ['monitor', 'rebalance'],
  operation: ['monitor', 'rebalance', 'stabilize'],
};
