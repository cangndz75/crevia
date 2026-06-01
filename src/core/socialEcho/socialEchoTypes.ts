import type { EventEchoOutcomeBand } from '@/core/contentPacks/eventEchoTypes';

export type SocialEchoSource =
  | 'event_echo'
  | 'carry_over'
  | 'event_domain'
  | 'daily_report'
  | 'operation_signal'
  | 'fallback';

export type SocialEchoVisibility = 'hidden' | 'compact' | 'standard' | 'highlighted';

export type SocialEchoSentiment =
  | 'positive'
  | 'neutral'
  | 'concerned'
  | 'mixed'
  | 'recovery';

export type SocialEchoDomain =
  | 'container'
  | 'vehicle_route'
  | 'personnel'
  | 'social'
  | 'crisis_adjacent'
  | 'district_balance'
  | 'generic_operation';

export type SocialEchoTone = 'teal' | 'mint' | 'amber' | 'coral' | 'neutral';

export type SocialDecisionEchoModel = {
  id: string;
  title: string;
  mention: string;
  districtLabel?: string;
  domain: SocialEchoDomain;
  sentiment: SocialEchoSentiment;
  source: SocialEchoSource;
  visibility: SocialEchoVisibility;
  tags: string[];
  iconKey: string;
  tone: SocialEchoTone;
  maxLines: number;
  debugReason?: string;
};

export type SocialEchoContext = {
  day: number;
  currentEvent?: {
    id?: string;
    title?: string;
    description?: string;
    eventType?: string;
    contentCategory?: string;
    category?: string;
    neighborhoodId?: string;
    filterTags?: string[];
  } | null;
  eventResult?: {
    eventId?: string;
    eventTitle?: string;
    neighborhoodId?: string;
    neighborhoodName?: string;
    summaryTitle?: string;
    summaryText?: string;
    resultTone?: string;
    publicSatisfactionDelta?: number;
    riskDelta?: number;
    subsystemOutcomes?: { key: string; primaryText?: string }[];
  } | null;
  eventDomainFocus?: {
    focus?: string;
    socialEchoLine?: string;
    summary?: string;
    shortTitle?: string;
  } | null;
  carryOverMemory?: {
    summary?: string;
    domain?: string;
    tone?: string;
    title?: string;
  } | null;
  dailyReport?: {
    socialSummaryLines?: string[];
    carryOverSummaryLines?: string[];
  } | null;
  operationSignals?: {
    overall?: { summary?: string; status?: string };
    social?: { summary?: string; status?: string };
    vehicles?: { summary?: string; status?: string };
    containers?: { summary?: string; status?: string };
    personnel?: { summary?: string; status?: string };
    districts?: { summary?: string; status?: string };
  } | null;
  socialPulseState?: { score?: number } | null;
  outcomeBand?: EventEchoOutcomeBand | string;
  districtId?: string;
  selectedDecisionKind?: string;
  resultEchoText?: string;
  excludeMentions?: string[];
};

export type SocialEchoSummary = {
  visibleEchoes: SocialDecisionEchoModel[];
  primaryEcho?: SocialDecisionEchoModel | null;
  warnings: string[];
};

export const SOCIAL_ECHO_DOMAINS: SocialEchoDomain[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'generic_operation',
];

export const SOCIAL_ECHO_TITLE_LIMIT = 32;
export const SOCIAL_ECHO_MENTION_LIMIT = 160;
export const SOCIAL_ECHO_MAX_TAGS = 2;
export const SOCIAL_ECHO_MAX_LINES = 2;
