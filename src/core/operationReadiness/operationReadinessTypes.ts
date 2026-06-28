import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

export type ReadinessDomain =
  | 'personnel'
  | 'vehicle'
  | 'equipment'
  | 'facility'
  | 'budget'
  | 'route'
  | 'social'
  | 'operation';

export type ReadinessStatus = 'ready' | 'limited' | 'strained' | 'blocked' | 'unknown';

export type ReadinessTone = 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';

export type ReadinessPhase = 'dispatch' | 'field' | 'result' | 'report' | 'hub';

export type ReadinessSignalPresentation = {
  id: string;
  domain: ReadinessDomain;
  label: string;
  status: ReadinessStatus;
  statusLabel: string;
  tone: ReadinessTone;
  description: string;
  reason?: string;
  nextHint?: string;
  icon?: string;
  priority: number;
};

export type OperationReadinessSnapshot = {
  overallStatus: ReadinessStatus;
  overallLabel: string;
  overallTone: ReadinessTone;
  summary: string;
  signals: ReadinessSignalPresentation[];
  blockers: ReadinessSignalPresentation[];
  warnings: ReadinessSignalPresentation[];
};

export type OperationReadinessAssignmentStatus = 'ready' | 'partial' | 'missing' | 'locked';

export type OperationReadinessCompatibilityBand = 'low' | 'medium' | 'high' | 'unknown';

export type OperationReadinessContext = {
  phase?: ReadinessPhase;
  day?: number;
  assignmentStatus?: OperationReadinessAssignmentStatus;
  hasVehicle?: boolean;
  compatibilityBand?: OperationReadinessCompatibilityBand;
  compatibilityTone?: 'positive' | 'neutral' | 'warning';
  planStrategyId?: EventPlanStrategyId | null;
  publicSatisfactionPreview?: number;
  eventRiskLevel?: string;
  assignmentEffectBand?: OperationReadinessCompatibilityBand;
  budgetDelta?: number;
  moraleDelta?: number;
  outcomeTone?: 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';
  hasEquipmentData?: boolean;
  hasFacilityData?: boolean;
  playerStyleId?: PlayerStyleId | null;
  districtSocialFlavor?: string | null;
  districtRouteFlavor?: string | null;
};

export const READINESS_DOMAINS: ReadinessDomain[] = [
  'personnel',
  'vehicle',
  'equipment',
  'facility',
  'budget',
  'route',
  'social',
  'operation',
];

export const READINESS_STATUSES: ReadinessStatus[] = [
  'ready',
  'limited',
  'strained',
  'blocked',
  'unknown',
];
