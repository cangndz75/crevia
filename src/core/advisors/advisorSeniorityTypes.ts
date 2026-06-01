import type { PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';
import type { AdvisorState } from './advisorTypes';

export type AdvisorSeniorityTier =
  | 'trainee'
  | 'assistant'
  | 'field_advisor'
  | 'operations_specialist'
  | 'chief_advisor_preview';

export type AdvisorSeniorityDepth =
  | 'basic_observation'
  | 'short_term_tradeoff'
  | 'resource_and_social'
  | 'carry_over_and_style'
  | 'strategic_context';

export type AdvisorSeniorityTone = 'learning' | 'calm' | 'operational' | 'strategic' | 'cautious';

export type AdvisorSeniorityCapability =
  | 'explain_event'
  | 'explain_short_term_effect'
  | 'explain_tradeoff'
  | 'mention_resource_pressure'
  | 'mention_social_effect'
  | 'mention_carry_over'
  | 'mention_player_style'
  | 'mention_risk_signal'
  | 'mention_season_context';

export type AdvisorSenioritySurface = 'hub' | 'event' | 'report';

export type AdvisorSeniorityModel = {
  advisorId: string;
  displayName: string;
  tier: AdvisorSeniorityTier;
  title: string;
  shortTitle: string;
  depth: AdvisorSeniorityDepth;
  tone: AdvisorSeniorityTone;
  capabilityLabels: string[];
  unlockedCapabilities: AdvisorSeniorityCapability[];
  lockedPreviewCapabilities: AdvisorSeniorityCapability[];
  reliabilityLabel?: string;
  confidenceLabel?: string;
  summaryLine: string;
  insightLine: string;
  visible: boolean;
  maxLines: number;
  debugReason?: string;
};

export type AdvisorSeniorityInput = {
  day: number;
  surface?: AdvisorSenioritySurface;
  advisorState?: AdvisorState | null;
  playerStyleProfile?: PlayerStyleProfile | null;
  eventDomainFocus?: { focus?: string; summary?: string } | null;
  carryOverMemory?: { summary?: string; domain?: string } | null;
  reportTomorrowPreview?: { summary?: string; visible?: boolean } | null;
  mapBeforeAfter?: { summary?: string; outcome?: string } | null;
  resourceFatigue?: { state?: string; domain?: string } | null;
  dynamicSocialEcho?: { mention?: string } | null;
};

export const ADVISOR_SENIORITY_TIERS: AdvisorSeniorityTier[] = [
  'trainee',
  'assistant',
  'field_advisor',
  'operations_specialist',
  'chief_advisor_preview',
];

export const ADVISOR_SENIORITY_DEPTHS: AdvisorSeniorityDepth[] = [
  'basic_observation',
  'short_term_tradeoff',
  'resource_and_social',
  'carry_over_and_style',
  'strategic_context',
];

export const ADVISOR_SENIORITY_CAPABILITIES: AdvisorSeniorityCapability[] = [
  'explain_event',
  'explain_short_term_effect',
  'explain_tradeoff',
  'mention_resource_pressure',
  'mention_social_effect',
  'mention_carry_over',
  'mention_player_style',
  'mention_risk_signal',
  'mention_season_context',
];
