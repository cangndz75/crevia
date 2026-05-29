import type { ButterflyHookState } from '@/core/events/butterflyHookTypes';
import type { AuthorityState } from '@/core/authority/authorityTypes';
import type { BadgeState } from '@/core/badges/badgeTypes';
import type { PostPilotOperationState } from '@/core/postPilot/postPilotOperationTypes';
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
  /** Event içerik varyasyonu — son üretilen başlık/profil (persist opsiyonel). */
  eventContentRecentTitles?: string[];
  eventContentRecentProfileIds?: string[];
  /** Karar yankısı hook'ları — günler arası persist. */
  butterflyHookState?: ButterflyHookState;
  /** Yetki güveni ve resmi unvan durumu — günlük gain, dönem değerlendirmesi. */
  authorityState?: AuthorityState;
  /** Rozet ilerlemesi ve kazanımları. */
  badgeState?: BadgeState;
  /** Pilot sonrası ana operasyon hazırlık fazı — staged scope activation. */
  postPilotOperation?: PostPilotOperationState;
};
