import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

export type EventEchoDomain =
  | 'container'
  | 'vehicle'
  | 'route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'pilot_learning'
  | 'pilot_final'
  | 'generic_operation';

export type EventEchoTone =
  | 'calm'
  | 'warning'
  | 'positive'
  | 'mixed'
  | 'strategic'
  | 'recovery'
  | 'preventive';

export type EventEchoSurface = 'advisor' | 'social' | 'report' | 'tomorrow_hint';

export type EventEchoOutcomeBand =
  | 'strong_success'
  | 'partial_success'
  | 'strained_success'
  | 'mixed'
  | 'weak'
  | 'unresolved';

export type EventEchoDecisionKind =
  | 'fast_response'
  | 'preventive_route'
  | 'balanced_dispatch'
  | 'communication_first'
  | 'monitor_only'
  | 'resource_heavy';

export type EventEchoTemplate = {
  id: string;
  surface: EventEchoSurface;
  domain: EventEchoDomain;
  tone: EventEchoTone;
  outcomeBand: EventEchoOutcomeBand[];
  districtIds?: MapDistrictId[];
  dayRange?: { min?: number; max?: number };
  text: string;
  tags: string[];
  maxLines: number;
  forbiddenInDay1?: boolean;
  allowInPilotFinal?: boolean;
};

export type AdvisorEchoFocus =
  | 'trade_off'
  | 'resource_warning'
  | 'social_read'
  | 'carry_over'
  | 'result_explanation'
  | 'theme_context';

export type AdvisorEchoTemplate = EventEchoTemplate & {
  surface: 'advisor';
  advisorRole: 'ece' | 'specialist_hint';
  focus: AdvisorEchoFocus;
};

export type SocialEchoTemplate = EventEchoTemplate & {
  surface: 'social';
  sentiment: 'positive' | 'neutral' | 'concerned' | 'mixed';
  speakerType:
    | 'resident'
    | 'shopkeeper'
    | 'driver'
    | 'worker'
    | 'neighborhood_group'
    | 'general_public';
  mentionStyle: 'short' | 'feed' | 'topic';
};

export type ReportEchoTemplate = EventEchoTemplate & {
  surface: 'report';
  reportSection: 'main_result' | 'resource_effect' | 'social_effect' | 'district_effect' | 'tomorrow_signal';
};

export type TomorrowHintEchoTemplate = EventEchoTemplate & {
  surface: 'tomorrow_hint';
};

export type EventEchoContext = {
  eventId?: string;
  day: number;
  districtId?: MapDistrictId;
  domain: EventEchoDomain;
  outcomeBand: EventEchoOutcomeBand;
  selectedDecisionKind?: EventEchoDecisionKind;
  hasCarryOver?: boolean;
  resourcePressure?: 'low' | 'medium' | 'high';
  socialPressure?: 'low' | 'medium' | 'high';
  crisisPressure?: 'low' | 'medium' | 'high';
  themeDomain?: string;
};

export type EventEchoBundle = {
  advisorLine?: string;
  socialMention?: string;
  reportLine?: string;
  tomorrowHint?: string;
  tags: string[];
};

export type EventLikeForEcho = {
  id?: string;
  title?: string;
  category?: string;
  eventType?: string;
  contentCategory?: string;
  neighborhoodId?: string;
  domain?: string;
  filterTags?: string[];
  contextTag?: string;
};

export type ResultLikeForEcho = {
  publicSatisfactionDelta?: number;
  riskDelta?: number;
  moraleDelta?: number;
  successLabel?: string;
  tone?: string;
};
