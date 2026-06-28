import type { EventEchoDecisionKind } from '@/core/contentPacks/eventEchoTypes';

export type PlayerStyleId =
  | 'fast_responder'
  | 'preventive_planner'
  | 'public_focused'
  | 'resource_guardian'
  | 'crisis_watcher'
  | 'balanced_operator'
  | 'route_focused'
  | 'district_loyalist'
  | 'inconsistent_operator'
  | 'unknown';

export type PlayerStyleConfidence = 'none' | 'low' | 'medium' | 'high';

export type PlayerStyleEvidenceTone = 'positive' | 'mixed' | 'warning' | 'neutral';

export type PlayerStyleEvidenceChip = {
  label: string;
  value: string;
  tone: PlayerStyleEvidenceTone;
};

export type PlayerStylePresentationCard = {
  visible: boolean;
  sectionTitle: string;
  microcopy: string;
  label: string;
  shortLabel: string;
  description: string;
  strengths: string[];
  watchouts: string[];
  currentSignal: string;
  confidence: PlayerStyleConfidence;
  confidenceLabel: string;
  tone: PlayerStyleTone;
  evidenceChips: PlayerStyleEvidenceChip[];
  styleId: PlayerStyleId;
};

export type PlayerStyleSignalKind =
  | 'fast_response'
  | 'preventive'
  | 'resource_saving'
  | 'resource_heavy'
  | 'social_priority'
  | 'crisis_prevention'
  | 'district_balance'
  | 'route_continuity'
  | 'district_focus'
  | 'delayed_response'
  | 'mixed';

export type PlayerStyleTone = 'calm' | 'encouraging' | 'strategic' | 'warning' | 'neutral';

export type PlayerStyleObservationSource =
  | 'event_result'
  | 'daily_report'
  | 'carry_over'
  | 'resource_fatigue'
  | 'social_echo'
  | 'map_before_after'
  | 'fallback';

export type PlayerStyleObservation = {
  id: string;
  day: number;
  kind: PlayerStyleSignalKind;
  domain?: string;
  districtId?: string;
  weight: number;
  source: PlayerStyleObservationSource;
  decisionKind?: EventEchoDecisionKind;
  debugReason?: string;
};

export type PlayerStyleProfile = {
  styleId: PlayerStyleId;
  confidence: PlayerStyleConfidence;
  score: number;
  title: string;
  shortLabel: string;
  summary: string;
  strengthLine: string;
  riskLine?: string;
  advisorLine: string;
  tags: string[];
  tone: PlayerStyleTone;
  visible: boolean;
  observations: PlayerStyleObservation[];
  debugReason?: string;
};

export type PlayerStyleSurface = 'hub' | 'report' | 'event' | 'debug';

export type PlayerStyleInput = {
  day: number;
  surface?: PlayerStyleSurface;
  strategyHistory?: import('@/core/strategyHistory/strategyHistoryTypes').StrategyHistoryStateV1;
  dominantStrategy?: import('@/core/dominantStrategyDetector/dominantStrategyDetectorTypes').DominantStrategyDetectorResult | null;
  recentEvents?: Array<{ id?: string; title?: string; decisionLabel?: string }>;
  recentResults?: Array<{
    summaryText?: string;
    summaryTitle?: string;
    resultTone?: string;
    selectedDecisionKind?: EventEchoDecisionKind;
    decisionLabel?: string;
  }>;
  dailyReports?: Array<{ day?: number; summary?: string }>;
  carryOverMemory?: { domain?: string; summary?: string; direction?: string } | null;
  resourceFatigue?: { domain?: string; state?: string } | null;
  socialEcho?: { mention?: string; tone?: string; domain?: string } | null;
  mapBeforeAfter?: { domain?: string; outcome?: string } | null;
  eventDomainFocus?: { focus?: string; summary?: string } | null;
  advisorState?: { experience?: number } | null;
  decisionHistory?: Array<{
    day?: number;
    decisionLabel?: string;
    eventTitle?: string;
  }>;
  hasRealPostPilotData?: boolean;
};

export const PLAYER_STYLE_IDS: PlayerStyleId[] = [
  'fast_responder',
  'preventive_planner',
  'public_focused',
  'resource_guardian',
  'crisis_watcher',
  'balanced_operator',
  'route_focused',
  'district_loyalist',
  'inconsistent_operator',
  'unknown',
];

export const PLAYER_STYLE_SIGNAL_KINDS: PlayerStyleSignalKind[] = [
  'fast_response',
  'preventive',
  'resource_saving',
  'resource_heavy',
  'social_priority',
  'crisis_prevention',
  'district_balance',
  'route_continuity',
  'district_focus',
  'delayed_response',
  'mixed',
];
