import type { EventLikeForEcho } from '@/core/contentPacks/eventEchoTypes';
import type { EventDomainFocusModel } from '@/core/events/eventDomainPresentationTypes';
import type { DailyReport } from '@/core/models/DailyReport';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { PilotThemeDefinition } from '@/core/pilotRhythm/pilotRhythmTypes';

export type CarryOverSurface =
  | 'hub'
  | 'event_detail'
  | 'plan'
  | 'result'
  | 'report';

export type CarryOverDirection =
  | 'yesterday_to_today'
  | 'today_to_tomorrow'
  | 'unresolved_from_previous'
  | 'positive_memory'
  | 'warning_memory';

export type CarryOverDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'generic_operation';

export type CarryOverTone = 'calm' | 'positive' | 'warning' | 'strategic' | 'muted';

export type CarryOverMemorySource =
  | 'daily_report'
  | 'event_result'
  | 'operation_signals'
  | 'event_echo'
  | 'pilot_theme'
  | 'fallback';

export type CarryOverMemoryModel = {
  id: string;
  surface: CarryOverSurface;
  direction: CarryOverDirection;
  domain: CarryOverDomain;
  tone: CarryOverTone;
  title: string;
  summary: string;
  detail?: string;
  districtLabel?: string;
  primaryTag: string;
  secondaryTag?: string;
  iconKey: string;
  source: CarryOverMemorySource;
  visible: boolean;
  maxLines: number;
  debugReason?: string;
};

export type CarryOverMemoryInput = {
  day: number;
  currentEvent?: EventLikeForEcho | null;
  lastDailyReport?: DailyReport | null;
  currentDailyReport?: DailyReport | null;
  operationSignals?: OperationSignalsState | null;
  recentDecisions?: DecisionRecord[];
  eventResult?: {
    summaryText?: string;
    summaryTitle?: string;
    resultTone?: string;
    neighborhoodName?: string;
    eventId?: string;
  } | null;
  pilotTheme?: PilotThemeDefinition | null;
  eventDomainFocus?: EventDomainFocusModel | null;
  suppressEchoDuplicate?: boolean;
};

export type CarryOverSummary = {
  hasVisibleMemory: boolean;
  memories: CarryOverMemoryModel[];
  strongestMemory?: CarryOverMemoryModel;
  warnings: string[];
};
