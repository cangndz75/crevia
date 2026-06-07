import type { ContentRuntimeActivationEventMeta } from '@/core/contentRuntimeActivation/contentRuntimeActivationTypes';
import type { DecisionImpactExplanation } from '@/core/decisionImpactExplanation';
import type { EventCard } from '@/core/models/EventCard';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk';
import type { DecisionResultSnapshot } from '@/features/events/types/decisionResultTypes';

export type CityEchoBindingSourceKind =
  | 'decision_impact'
  | 'tomorrow_risk'
  | 'event_echo'
  | 'carry_over'
  | 'operation_signal'
  | 'district_trust'
  | 'resource_fatigue'
  | 'social_pulse'
  | 'fallback';

export type CityEchoBindingKind =
  | 'decision_tradeoff_echo'
  | 'tomorrow_risk_echo'
  | 'route_balance_echo'
  | 'container_pressure_echo'
  | 'personnel_fatigue_echo'
  | 'vehicle_fatigue_echo'
  | 'social_trust_echo'
  | 'district_trust_echo'
  | 'crisis_prevention_echo'
  | 'recovery_momentum_echo'
  | 'carry_over_echo'
  | 'operation_era_echo'
  | 'post_pilot_scope_echo'
  | 'generic_city_echo'
  | 'fallback';

export type CityEchoBindingPriority = 'low' | 'medium' | 'high';

export type CityEchoBindingTone =
  | 'calm'
  | 'positive'
  | 'watch'
  | 'recovery'
  | 'risk'
  | 'operational';

export type CityEchoBindingConfidence = 'high' | 'medium' | 'fallback';

export type CityEchoBindingSourceSignals = {
  hasDecisionImpact: boolean;
  hasTomorrowRisk: boolean;
  hasCarryOver: boolean;
  hasOperationSignal: boolean;
  hasSocialPulse: boolean;
  hasResourcePressure: boolean;
};

export type CityEchoBinding = {
  id: string;
  kind: CityEchoBindingKind;
  sourceKind: CityEchoBindingSourceKind;
  relatedEventId?: string;
  relatedDistrictId?: string;
  relatedDomain?: string;
  relatedResource?: string;
  priority: CityEchoBindingPriority;
  tone: CityEchoBindingTone;
  eceLine?: string;
  socialLine?: string;
  reportLine?: string;
  tomorrowLine?: string;
  hubLine?: string;
  sourceSignals: CityEchoBindingSourceSignals;
  duplicateKey: string;
  confidence: CityEchoBindingConfidence;
  maxVisibleLines: number;
  shouldShowAdvisor: boolean;
  shouldShowSocial: boolean;
  shouldShowReport: boolean;
  shouldShowHub: boolean;
  shouldShowTomorrow: boolean;
};

export type CityEchoBindingInput = {
  day: number;
  decisionImpact?: DecisionImpactExplanation | null;
  tomorrowRisk?: TomorrowRiskModel | null;
  snapshot?: DecisionResultSnapshot | null;
  carryOverSummary?: string | null;
  eventEchoLine?: string | null;
  operationSignals?: {
    priorityDistrictId?: string;
    dailyFocus?: string;
    overall?: { status?: string; summary?: string; score?: number };
    vehicles?: { status?: string; summary?: string; score?: number };
    containers?: { status?: string; summary?: string; score?: number };
    personnel?: { status?: string; summary?: string; score?: number };
    districts?: { status?: string; summary?: string; score?: number };
  } | null;
  socialPulse?: {
    globalPulseScore?: number;
    score?: number;
  } | null;
  postPilotPhase?: string | null;
  event?: EventCard | null;
  contentPackMeta?: ContentRuntimeActivationEventMeta | null;
  existingLines?: string[];
  eventPool?: EventCard[];
  postPilotCatalog?: EventCard[];
};
