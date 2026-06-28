import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import {
  buildOperationPortfolioPresentation,
  type OperationPortfolioBoardPresentation,
} from '@/features/events/presentation/operationPortfolio';
import { buildMemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';

export type BuildEventsOperationPortfolioInput = {
  gameState: GameState;
  activeEvents: EventCard[];
  featuredEventId: string | null;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
};

function resolveDay(gameState: GameState): number {
  return gameState.city?.day ?? gameState.pilot?.currentPilotDay ?? 1;
}

export function buildEventsOperationPortfolioPresentation(
  input: BuildEventsOperationPortfolioInput,
): OperationPortfolioBoardPresentation {
  const day = resolveDay(input.gameState);
  const operationSignals = input.operationSignals ?? createInitialOperationSignalsState(day);
  const socialPulseState = input.socialPulseState ?? createInitialSocialPulseState();

  const memoryFollowUp = buildMemoryFollowUpPresentationContext({
    day,
    gameState: input.gameState,
    operationSignals,
    socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
  });

  const hub = buildCenterHomePresentation({
    gameState: input.gameState,
    operationSignals,
    socialPulseState,
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
  });

  return buildOperationPortfolioPresentation({
    day,
    gameState: input.gameState,
    activeEvents: input.activeEvents,
    featuredEventId: input.featuredEventId,
    operationSignals,
    socialPulseState,
    hubTomorrowRisk: input.hubTomorrowRisk,
    hubVehicleMaintenanceLine: input.hubVehicleMaintenanceLine,
    hubTeamSpecializationLine: input.hubTeamSpecializationLine,
    memoryFollowUp,
    dailyCapacityPortfolioResult: memoryFollowUp.dailyCapacityPortfolio,
    hubTodayFocus: hub.gameFirst.todayFocus.goalSentence,
    hubPrimaryOperationTitle: hub.activeTarget.title,
    hubPrimaryEventId: input.featuredEventId ?? hub.activeTarget.id,
    hubPrimaryCtaLabel: hub.gameFirst.primaryCta.label,
    avoidLines: memoryFollowUp.dedupeLines,
  });
}
