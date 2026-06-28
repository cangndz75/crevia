import type { PlayerStyleId } from '@/core/playerStyle/playerStyleTypes';
import type { MaintenanceBacklogSnapshot } from '@/core/maintenanceBacklog/maintenanceBacklogTypes';
import type { MaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeTypes';
import type { OperationReadinessSnapshot } from '@/core/operationReadiness/operationReadinessTypes';
import type { EventPlanStrategyId } from '@/features/events/utils/eventPlanPhasePresentation';

export type ReadinessPriorityDomain =
  | 'personnel'
  | 'vehicle'
  | 'facility'
  | 'equipment'
  | 'budget'
  | 'ready_positive';

export type ReadinessStrategicDensityBand = 'day1' | 'strategic';

export type ReadinessPriorityChipTone =
  | 'positive'
  | 'neutral'
  | 'warning'
  | 'critical'
  | 'teal';

export type ReadinessPriorityChip = {
  id: string;
  label: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessPriorityCtaActionKey =
  | 'check_maintenance'
  | 'swap_team'
  | 'soften_plan'
  | 'defer_operation'
  | 'proceed';

export type ReadinessStrategicPriority = {
  id: string;
  domain: ReadinessPriorityDomain;
  title: string;
  description: string;
  riskChip: ReadinessPriorityChip;
  affectedOperationChip: ReadinessPriorityChip | null;
  recommendedActionChip: ReadinessPriorityChip;
  ctaHint: string;
  ctaActionKey: ReadinessPriorityCtaActionKey;
  tone: 'positive' | 'neutral' | 'warning' | 'critical';
  severity: number;
};

export type ReadinessRiskPresentation = {
  label: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessRecoveryPresentation = {
  label: string;
  tone: 'positive' | 'teal';
} | null;

export type ReadinessMemoryPresentation = {
  label: string;
} | null;

export type ReadinessStrategicPriorityResult = {
  densityBand: ReadinessStrategicDensityBand;
  priority: ReadinessStrategicPriority;
  risk: ReadinessRiskPresentation;
  recovery: ReadinessRecoveryPresentation;
  memory: ReadinessMemoryPresentation;
};

export type ReadinessStrategicPriorityInput = {
  day: number;
  readinessSnapshot: OperationReadinessSnapshot;
  maintenanceBacklog?: MaintenanceBacklogSnapshot | null;
  maintenanceRuntime?: MaintenanceBacklogRuntimeState | null;
  planStrategyId?: EventPlanStrategyId | null;
  eventRiskLevel?: string;
  operationsToday?: number;
  operationTitle?: string | null;
  playerStyleId?: PlayerStyleId | null;
  socialPressure?: boolean;
  memoryStreakDays?: number;
  portfolioConflict?: boolean;
  avoidLines?: string[];
};

export type ReadinessPrioritySurfacePresentation = {
  visibility: 'visible' | 'hidden';
  hero: {
    title: string;
    description: string;
    accessibilityLabel: string;
  };
  chips: ReadinessPriorityChip[];
  ctaHint: string;
  ctaActionKey: ReadinessPriorityCtaActionKey;
  tone: ReadinessStrategicPriority['tone'];
};

export type ReadinessFitBadge = {
  id: string;
  label: string;
  tone: 'strong_match' | 'weak_match' | 'risky' | 'neutral';
  outcomePreview: string;
  warning?: string;
};

export type ReadinessPlanFitPresentation = {
  visibility: 'visible' | 'hidden';
  strategyFits: Partial<Record<EventPlanStrategyId, ReadinessFitBadge>>;
};

export type ReadinessDispatchFitPresentation = {
  visibility: 'visible' | 'hidden';
  fitBadge: ReadinessFitBadge | null;
  riskChip: ReadinessPriorityChip | null;
};

export type ReadinessFieldSignalPresentation = {
  visibility: 'visible' | 'hidden';
  signal: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessResultBridgePresentation = {
  visibility: 'visible' | 'hidden';
  impactLine: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessHubCompactPresentation = {
  visibility: 'visible' | 'hidden';
  pulseLine: string;
  reasonChip?: string;
  subtitle?: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessPortfolioWarningPresentation = {
  visibility: 'visible' | 'hidden';
  warningLine: string;
  tone: ReadinessPriorityChipTone;
};

export type ReadinessReportMemoryPresentation = {
  visibility: 'visible' | 'hidden';
  closureLine: string;
  replayChip?: string;
  tone: ReadinessPriorityChipTone;
};
