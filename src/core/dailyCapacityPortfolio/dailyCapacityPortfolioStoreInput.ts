import type { GameState } from '@/core/models/GameState';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';
import type { SocialPulseState } from '@/core/social/socialTypes';
import type { TomorrowRiskModel } from '@/core/tomorrowRisk/tomorrowRiskTypes';
import type { EventCard } from '@/core/models/EventCard';

import type { DailyCapacityPortfolioInput } from './dailyCapacityPortfolioTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function makeGenericSignal(id: string, title: string, summary: string, score = 55) {
  return { id, title, summary, score, sourceIds: [id] };
}

function buildSocialPulseSignal(socialPulseState?: SocialPulseState | null) {
  if (!socialPulseState) return undefined;
  const score =
    typeof socialPulseState.globalPulseScore === 'number'
      ? socialPulseState.globalPulseScore
      : 56;
  return makeGenericSignal('hub_social_pulse', 'Sosyal nabiz', 'Sehir tepkisi izleniyor.', score);
}

function filterLiveEvents(events: unknown[]): unknown[] {
  return events.filter((event) => {
    if (!isRecord(event)) return true;
    const status = asString(event.status);
    return status !== 'resolved' && status !== 'completed' && status !== 'expired';
  });
}

function readAuthorityPermissionIds(gameState: GameState): string[] {
  const authority = gameState.pilot.authorityState;
  if (!authority?.unlockedPermissionIds) return [];
  return authority.unlockedPermissionIds.filter((id) => typeof id === 'string' && id.length > 0);
}

export type BuildDailyCapacityPortfolioStoreInputParams = {
  day: number;
  gameState: GameState;
  operationSignals?: OperationSignalsState | null;
  socialPulseState?: SocialPulseState | null;
  hubTomorrowRisk?: TomorrowRiskModel | null;
  hubVehicleMaintenanceLine?: string | null;
  hubTeamSpecializationLine?: string | null;
  mapGameplayBindings?: unknown[];
  activeOperationMapBindings?: unknown[];
  catalogOperationEvents?: EventCard[];
  deferredOperationEventIds?: string[];
};

export function buildDailyCapacityPortfolioStoreInput(
  params: BuildDailyCapacityPortfolioStoreInputParams,
): DailyCapacityPortfolioInput {
  const rawState = params.gameState as unknown as Record<string, unknown>;
  const pilot = isRecord(rawState.pilot) ? rawState.pilot : undefined;
  const events = filterLiveEvents(asArray(rawState.events));
  const postPilotSet = isRecord(pilot?.postPilotOperation)
    ? (pilot.postPilotOperation as Record<string, unknown>).postPilotDailyEventSet
    : undefined;
  const catalogFromPostPilot =
    params.catalogOperationEvents ??
    (isRecord(postPilotSet) && Array.isArray(postPilotSet.catalog)
      ? (postPilotSet.catalog as EventCard[])
      : undefined);
  const deferredFromPostPilot =
    params.deferredOperationEventIds ??
    (isRecord(postPilotSet) && Array.isArray(postPilotSet.deferredEventIds)
      ? postPilotSet.deferredEventIds.filter((id): id is string => typeof id === 'string')
      : undefined);

  return {
    day: params.day,
    activeEvents: catalogFromPostPilot?.length ? undefined : events,
    catalogOperationEvents: catalogFromPostPilot,
    deferredOperationEventIds: deferredFromPostPilot,
    postPilotState: pilot?.postPilotOperation,
    operationSignals: params.operationSignals ?? undefined,
    tomorrowRiskSignals: params.hubTomorrowRisk ?? undefined,
    vehicleMaintenanceSignals: params.hubVehicleMaintenanceLine
      ? makeGenericSignal(
          'hub_vehicle_maintenance',
          'Bakim uyarisi',
          params.hubVehicleMaintenanceLine,
          62,
        )
      : undefined,
    teamSpecializationSignals: params.hubTeamSpecializationLine
      ? makeGenericSignal(
          'hub_team_specialization',
          'Ekip odağı',
          params.hubTeamSpecializationLine,
          54,
        )
      : undefined,
    socialPulseSignals: buildSocialPulseSignal(params.socialPulseState),
    mapGameplayBindings: params.mapGameplayBindings,
    activeOperationMapBindings: params.activeOperationMapBindings,
    authorityPermissionIds: readAuthorityPermissionIds(params.gameState),
    authorityRankId: params.gameState.pilot.authorityState?.formalRankId,
  };
}
