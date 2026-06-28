import type { AdvisorOperationalRelationshipModel } from '@/core/advisorRelationship/advisorRelationshipTypes';
import type { DominantStrategyDetectorResult } from '@/core/dominantStrategyDetector/dominantStrategyDetectorTypes';
import type { EventCard } from '@/core/models/EventCard';
import type { PlayerStyleProfile } from '@/core/playerStyle/playerStyleTypes';
import type { StrategyHistoryStateV1 } from '@/core/strategyHistory/strategyHistoryTypes';

export type EceTone =
  | 'supportive'
  | 'cautionary'
  | 'direct'
  | 'strategic'
  | 'skeptical'
  | 'calm';

export type EceConfidence = 'low' | 'medium' | 'high';

export type EcePlayerDecisionPattern =
  | 'rapid_response'
  | 'balanced'
  | 'preventive'
  | 'resource_saving'
  | 'public_trust_focus'
  | 'crisis_priority'
  | 'district_repetition'
  | 'unknown';

export type EceSignalLevel = 'improving' | 'stable' | 'declining' | 'unknown';
export type EceResourceSignal = 'safe' | 'strained' | 'critical' | 'unknown';
export type EceSocialSignal = 'calm' | 'watching' | 'heated' | 'unknown';
export type EceOutcomeTone = 'positive' | 'mixed' | 'warning' | 'critical' | 'neutral';

export type EceAdvisorPhase =
  | 'inspect'
  | 'plan'
  | 'dispatch'
  | 'field'
  | 'result'
  | 'hub'
  | 'report';

export type EceAdvisorLineSource =
  | 'fallback'
  | 'phase'
  | 'strategy'
  | 'memory'
  | 'result'
  | 'report';

export type EceMemorySnapshot = {
  playerStyleLabel?: string;
  recentDecisionPattern: EcePlayerDecisionPattern;
  dominantTone: EceTone;
  confidence: EceConfidence;
  recentDistrictName?: string;
  repeatedDistrictName?: string;
  lastPlanId?: string;
  lastPlanLabel?: string;
  recentOutcomeTone?: EceOutcomeTone;
  pressureFlags: string[];
  trustSignal: EceSignalLevel;
  resourceSignal: EceResourceSignal;
  socialSignal: EceSocialSignal;
};

export type EceAdvisorLine = {
  id: string;
  phase: EceAdvisorPhase;
  tone: EceTone;
  toneLabel: string;
  message: string;
  shortMessage?: string;
  source: EceAdvisorLineSource;
  confidence: EceConfidence;
};

export type EceMemoryContextInput = {
  day?: number;
  event?: EventCard | null;
  eventId?: string;
  districtName?: string;
  dominantStrategy?: DominantStrategyDetectorResult | null;
  strategyHistory?: StrategyHistoryStateV1 | null;
  advisorRelationship?: AdvisorOperationalRelationshipModel | null;
  playerStyleProfile?: PlayerStyleProfile | null;
  socialPulseLevel?: EceSocialSignal;
  resourcePressure?: boolean;
  socialPressure?: boolean;
  trustPressure?: boolean;
  recentOutcomeTone?: EceOutcomeTone;
  selectedPlanId?: string;
  selectedPlanLabel?: string;
  evidenceSufficient?: boolean;
  socialSignalHeated?: boolean;
  avoidLines?: string[];
};

export type BuildEcePhaseLineInput = {
  memory: EceMemorySnapshot;
  context: EceMemoryContextInput;
  seed: string;
  avoidLines?: string[];
};
