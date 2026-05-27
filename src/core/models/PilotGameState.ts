import type { DailyEventSet } from './DailyEventSet';
import type { PilotDistrictId } from './DistrictProfile';
import type { PilotRun } from './PilotRun';

export type PilotStatus = 'not_started' | 'active' | 'completed';

export type PendingConsequenceType =
  | 'metric_effect'
  | 'unlock_event'
  | 'character_reaction'
  | 'risk_modifier';

export type PendingConsequence = {
  id: string;
  sourceEventId: string;
  sourceDecisionId: string;
  triggerDay: number;
  type: PendingConsequenceType;
  payload: Record<string, unknown>;
};

export type PilotFinalResultStatus =
  | 'successful'
  | 'controlled'
  | 'risky'
  | 'failed';

export type PilotFinalResult = {
  status: PilotFinalResultStatus;
  score: number;
  summary: string;
  completedAtDay: number;
};

export type PilotGameState = {
  selectedDistrictId: PilotDistrictId | null;
  currentPilotDay: number;
  status: PilotStatus;
  flags: Record<string, string | number | boolean>;
  completedEventIds: string[];
  pendingConsequences: PendingConsequence[];
  lastDecisionId?: string;
  lastEventId?: string;
  finalResult?: PilotFinalResult;
  /** 7 günlük pilot koşusu — kararlar, günlük özetler ve kilit durumu. */
  run: PilotRun | null;
  /** Günlük çoklu olay seti — aynı gün/bölge için deterministik. */
  dailyEventSet?: DailyEventSet;
};
