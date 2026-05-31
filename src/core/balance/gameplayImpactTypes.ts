import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';

export type GameplayImpactDomain =
  | 'personnel'
  | 'vehicles'
  | 'containers'
  | 'districts'
  | 'social'
  | 'crisis'
  | 'assignments'
  | 'overall'
  | 'season'
  | 'planning';

export type GameplayImpactMagnitude = 'tiny' | 'small' | 'medium' | 'strong';

export type GameplayImpactDirection =
  | 'improves'
  | 'worsens'
  | 'mixed'
  | 'neutral';

export type GameplayImpactProfile = {
  id: string;
  domain: GameplayImpactDomain;
  delta: number;
  magnitude: GameplayImpactMagnitude;
  direction: GameplayImpactDirection;
  reason: string;
  sourceTags: string[];
};

export type GameplayTradeoffProfile = {
  id: string;
  title: string;
  summary: string;
  positiveEffects: GameplayImpactProfile[];
  negativeEffects: GameplayImpactProfile[];
  carryOverRisk?: {
    domain: GameplayImpactDomain;
    delta: number;
    summary: string;
  };
};

export type GameplayImpactScaleContext = {
  gameState: GameState;
  monetization?: MonetizationState;
  isDay1Tutorial?: boolean;
  postPilotLightPhase?: boolean;
  isCrisisRelated?: boolean;
  crisisRiskElevated?: boolean;
};
