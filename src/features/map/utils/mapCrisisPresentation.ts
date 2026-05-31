import { buildCrisisEngineInput, buildCrisisMapPresentation } from '@/core/crisis/crisisEngine';
import type { CrisisMapPresentation } from '@/core/crisis/crisisTypes';
import type { CrisisState } from '@/core/crisis/crisisTypes';
import type { GameState } from '@/core/models/GameState';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import type { MainOperationSeasonState } from '@/core/mainOperation/mainOperationTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

export type MapCrisisPresentationBundle = CrisisMapPresentation;

export function buildMapCrisisPresentationBundle(params: {
  gameState: GameState;
  monetization: MonetizationState;
  crisisState: CrisisState;
  mainOperationSeason?: MainOperationSeasonState;
  operationSignals?: OperationSignalsState;
}): MapCrisisPresentationBundle {
  return buildCrisisMapPresentation(
    buildCrisisEngineInput({
      gameState: params.gameState,
      monetization: params.monetization,
      crisisState: params.crisisState,
      mainOperationSeason: params.mainOperationSeason,
      operationSignals: params.operationSignals,
    }),
  );
}
