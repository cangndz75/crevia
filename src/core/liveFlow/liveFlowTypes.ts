import type { EventCard } from '@/core/models/EventCard';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export type EventLifecycleStatus =
  | 'active'
  | 'resolved_today'
  | 'follow_up'
  | 'watching'
  | 'expired'
  | 'archived';

export type EventLifecycleTone = 'positive' | 'warning' | 'info' | 'neutral';

export type EventLifecycleMeta = {
  status: EventLifecycleStatus;
  label: string;
  tone: EventLifecycleTone;
  canOpen: boolean;
  canDecide: boolean;
  ctaLabel?: string;
  summaryText?: string;
};

export type LiveFlowEntryType =
  | 'event_created'
  | 'decision_applied'
  | 'decision_resolved'
  | 'event_resolved'
  | 'follow_up_created'
  | 'carry_over_signal'
  | 'butterfly_echo'
  | 'daily_goal_progress'
  | 'priority_progress'
  | 'report_ready';

export type LiveFlowEntry = {
  id: string;
  day: number;
  timestampOrder: number;
  type: LiveFlowEntryType;
  title: string;
  text: string;
  tone: EventLifecycleTone;
  relatedEventId?: string;
  relatedNeighborhoodId?: string;
  iconName?: string;
  /** Derived-only: birleştirilmiş kaynak tipler (persist edilmez). */
  mergedFrom?: LiveFlowEntryType[];
};

export type EventLifecycleContext = {
  currentDay: number;
  resolvedTodayIds: Set<string>;
  resolvedAllIds: Set<string>;
  decisionRecordsToday: DecisionRecord[];
  lastDecisionResult?: DecisionResultSnapshot | null;
  isDay1Tutorial?: boolean;
};

export type LiveFlowBuildInput = {
  currentDay: number;
  activeEvents: EventCard[];
  decisionHistory: DecisionRecord[];
  lastDecisionResult?: DecisionResultSnapshot | null;
  lastDailyReportDay?: number | null;
  carryOverLine?: string | null;
  butterflyLine?: string | null;
  isDay1Tutorial?: boolean;
};
