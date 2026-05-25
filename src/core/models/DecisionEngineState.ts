import type { GameResources } from '@/core/models/GameResources';
import type { GameState } from '@/core/models/GameState';
import type { Neighborhood } from '@/core/models/Neighborhood';

/** Karar motoru için GameState + opsiyonel mahalle/kaynak verisi. */
export type DecisionEngineState = GameState & {
  neighborhoods?: Neighborhood[];
  resources?: GameResources;
};
