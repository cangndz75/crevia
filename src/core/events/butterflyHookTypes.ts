import type { DailyPriorityKey } from '@/core/dailyPriority/dailyPriorityTypes';
import type { EventCard, EventDecision } from '@/core/models/EventCard';

export type ButterflyHookStatus =
  | 'active'
  | 'resolved'
  | 'expired'
  | 'suppressed';

export type ButterflyHookSource =
  | 'decision'
  | 'daily_priority'
  | 'event_content'
  | 'system_signal';

export type ButterflyHookSeverity = 'low' | 'medium' | 'high';

export type ButterflyHookKind =
  | 'follow_up_event'
  | 'report_echo'
  | 'risk_signal'
  | 'opportunity_return'
  | 'permanent_solution_prompt';

export type ButterflyHook = {
  id: string;
  source: ButterflyHookSource;
  kind: ButterflyHookKind;
  status: ButterflyHookStatus;

  createdDay: number;
  dueDay: number;
  expiresDay: number;

  sourceEventId?: string;
  sourceEventTitle?: string;
  sourceDecisionId?: string;
  sourceDecisionTitle?: string;

  neighborhoodId?: string;
  category?: string;
  profileId?: string;

  severity: ButterflyHookSeverity;
  title: string;
  description: string;

  triggerTag: string;
  followUpProfileId?: string;
  preferredCategories?: string[];
  preferredPriorityKeys?: DailyPriorityKey[];

  reportLine?: string;
  resultHint?: string;

  createdAt: number;
  resolvedAt?: number;
};

export type ButterflyHookState = {
  hooks: ButterflyHook[];
  lastProcessedDay: number;
};

export type ButterflyHookDecisionInput = {
  day: number;
  event: EventCard;
  decision: EventDecision;
  dailyPriorityKey?: DailyPriorityKey;
  neighborhoodId?: string;
  hookState: ButterflyHookState;
};

export type ButterflyHookGenerationContext = {
  day: number;
  hooks: ButterflyHook[];
  existingEventIds: string[];
  dailyPriorityKey?: DailyPriorityKey;
  isButterflySeedDay?: boolean;
};

export type ButterflyHookDecisionHint = {
  title: string;
  text: string;
  tone: 'info' | 'warning' | 'opportunity';
  dueText?: string;
};
