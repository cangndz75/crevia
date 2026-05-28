import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { DailyPriorityKey, DailyPriorityState } from '@/core/dailyPriority/dailyPriorityTypes';
import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { DailyReport } from '@/core/models/DailyReport';

export type CarryOverSignalKind =
  | 'priority_echo'
  | 'goal_echo'
  | 'neighborhood_pressure'
  | 'subsystem_relief'
  | 'subsystem_warning'
  | 'butterfly_overlap'
  | 'opportunity_memory';

export type CarryOverSignalTone = 'positive' | 'mixed' | 'warning' | 'neutral';

export type CarryOverSignalStrength = 'none' | 'soft' | 'medium';

export type CarryOverTarget =
  | 'public_satisfaction'
  | 'operation_risk'
  | 'budget'
  | 'personnel'
  | 'container'
  | 'vehicle'
  | 'social'
  | 'neighborhood'
  | 'general';

export type CarryOverEventWeightHint = {
  category?: string;
  neighborhoodId?: string;
  delta: number;
};

export type CarryOverSignal = {
  id: string;
  sourceDay: number;
  activeDay: number;

  kind: CarryOverSignalKind;
  tone: CarryOverSignalTone;
  strength: CarryOverSignalStrength;

  title: string;
  text: string;
  shortLabel: string;

  target: CarryOverTarget;
  categoryHint?: string;
  neighborhoodId?: string;
  dailyPriorityKey?: DailyPriorityKey;

  eventWeightHint?: CarryOverEventWeightHint;
  suppressIfButterflyHookExists?: boolean;
  createdAt: number;
};

export type CarryOverEvaluationInput = {
  day: number;
  previousDay: number;
  dailyPriorityByDay?: Record<number, DailyPriorityState>;
  dailyGoalsByDay?: Record<number, DailyGoalState>;
  dailyReportsByDay?: Record<number, DailyReport>;
  butterflyHookState?: ButterflyHookState;
  focalNeighborhoodId?: string;
};

export type CarryOverGenerationContext = {
  day: number;
  candidateEvents: EventCard[];
  carryOverSignals: CarryOverSignal[];
};

export type CarryOverHubLine = {
  label: string;
  text: string;
  tone: CarryOverSignalTone;
};
