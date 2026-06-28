import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';
import type { OperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessTypes';

export type MaintenanceBacklogDomain =
  | 'personnel'
  | 'vehicle'
  | 'equipment'
  | 'facility'
  | 'route'
  | 'budget'
  | 'operation';

export type MaintenanceBacklogSeverity = 'watch' | 'attention' | 'strained' | 'critical';

export type MaintenanceBacklogStatus =
  | 'monitoring'
  | 'recommended'
  | 'queued_preview'
  | 'blocked_preview';

export type MaintenanceBacklogTone =
  | 'positive'
  | 'mixed'
  | 'warning'
  | 'critical'
  | 'neutral';

export type MaintenanceBacklogReasonChip = {
  label: string;
  tone: MaintenanceBacklogTone;
};

export type MaintenanceBacklogItem = {
  id: string;
  domain: MaintenanceBacklogDomain;
  title: string;
  description: string;
  severity: MaintenanceBacklogSeverity;
  status: MaintenanceBacklogStatus;
  statusLabel: string;
  tone: MaintenanceBacklogTone;
  sourceReadinessId?: string;
  reasonChips: MaintenanceBacklogReasonChip[];
  nextHint?: string;
  priority: number;
  dedupeKey: string;
};

export type MaintenanceBacklogSnapshot = {
  title: string;
  summary: string;
  overallTone: MaintenanceBacklogTone;
  items: MaintenanceBacklogItem[];
  topItem?: MaintenanceBacklogItem;
  countLabel: string;
  hasCritical: boolean;
};

export type MaintenanceBacklogContext = {
  readinessSnapshot: OperationReadinessSnapshot;
  playerStyleId?: PlayerStyleId | null;
  districtRouteFlavor?: string | null;
  districtSocialFlavor?: string | null;
  day?: number;
  avoidLines?: string[];
};

export type MaintenanceSurfaceHint = {
  text: string;
  tone: MaintenanceBacklogTone;
  countLabel?: string;
};

export type MaintenanceHubSignal = {
  title: string;
  subtitle: string;
  tone: MaintenanceBacklogTone;
  dedupeKey: string;
};

export const MAINTENANCE_BACKLOG_DOMAINS: MaintenanceBacklogDomain[] = [
  'personnel',
  'vehicle',
  'equipment',
  'facility',
  'route',
  'budget',
  'operation',
];
