import { districtProfiles } from '@/core/content/districtProfiles';
import { getContainerEventWeightForCandidate } from '@/core/containers/containerEventSignals';
import type { ContainerState } from '@/core/containers/containerTypes';
import {
  getVehicleEventWeightForCandidate,
  MAX_COMBINED_SIGNAL_BOOST,
} from '@/core/vehicles/vehicleEventSignals';
import type { VehicleState } from '@/core/vehicles/vehicleTypes';
import { conditionsMatch } from '@/core/game/pilotConditions';
import type { PilotEventSelectionContext } from '@/core/game/pilotConditions';
import type { EventCard } from '@/core/models/EventCard';
import { getNeighborhoodIdentityEventWeightBonus } from '@/core/neighborhoodIdentity/neighborhoodIdentityModel';
import type { PilotEventType } from '@/core/models/PilotDayPlan';

export type CalculateEventWeightParams = {
  event: EventCard;
  context: PilotEventSelectionContext;
  theme?: string;
  /** Son günlerde seçilen event id'leri — tekrar cezası. */
  recentEventIds?: string[];
  /** Aynı bölgeye özel mi (ALL_DISTRICTS değil). */
  districtMatch?: boolean;
  /** Opsiyonel konteyner sinyali — gün 1'de boost uygulanmaz. */
  containerState?: ContainerState | null;
  /** Opsiyonel araç sinyali — gün 1 / tutorial'da boost uygulanmaz. */
  vehicleState?: VehicleState | null;
  tutorialActive?: boolean;
};

function metricBonus(
  event: EventCard,
  context: PilotEventSelectionContext,
): number {
  const city = context.gameState.city;
  let bonus = 0;
  const type = event.eventType;

  if (city.publicSatisfaction < 50) {
    if (
      type === 'citizen_complaint' ||
      type === 'social_media' ||
      type === 'noise'
    ) {
      bonus += 12;
    }
  }

  if ((city.riskScore ?? 0) > 55) {
    if (
      type === 'vehicle' ||
      type === 'staff' ||
      type === 'waste' ||
      type === 'market'
    ) {
      bonus += 10;
    }
  }

  if (city.morale < 50 && (type === 'staff' || type === 'vehicle')) {
    bonus += 10;
  }

  if (city.budget < 60_000) {
    if (event.decisions.some((d) => (d.effects.budget ?? 0) >= -2000)) {
      bonus += 6;
    }
  }

  return bonus;
}

function districtBiasBonus(
  event: EventCard,
  context: PilotEventSelectionContext,
): number {
  const profile = districtProfiles[context.selectedDistrictId];
  const weights = profile?.eventBias?.eventTypeWeights;
  if (!weights || !event.eventType) {
    return 0;
  }
  const w = weights[event.eventType as PilotEventType];
  if (w == null) {
    return 0;
  }
  return Math.round((w - 1) * 20);
}

function themeBonus(event: EventCard, theme?: string): number {
  if (!theme || !event.theme) {
    return 0;
  }
  return event.theme === theme ? 15 : 0;
}

function repeatPenalty(
  eventId: string,
  recentEventIds: string[] | undefined,
): number {
  if (!recentEventIds?.length) {
    return 0;
  }
  const idx = recentEventIds.indexOf(eventId);
  if (idx === -1) {
    return 0;
  }
  return 25 - idx * 5;
}

/**
 * Side / quick / opportunity seçimi için basit, genişletilebilir ağırlık.
 */
export function calculateEventWeight(
  params: CalculateEventWeightParams,
): number {
  const {
    event,
    context,
    theme,
    recentEventIds,
    districtMatch,
    containerState,
    vehicleState,
    tutorialActive,
  } = params;

  let weight = (event.priority ?? 1) * 10;

  if (districtMatch === true) {
    weight += 20;
  } else if (districtMatch === false) {
    weight -= 8;
  }

  weight += themeBonus(event, theme);

  if (conditionsMatch(event.conditions, context)) {
    weight += 8;
  }

  weight += metricBonus(event, context);
  weight += districtBiasBonus(event, context);
  weight -= repeatPenalty(event.id, recentEventIds);

  let signalBoost = 0;
  if (containerState) {
    signalBoost += getContainerEventWeightForCandidate({
      containerState,
      neighborhoodId: event.neighborhoodId,
      eventType: event.eventType,
      title: event.title,
      category: event.category,
      day: context.currentDay,
    });
  }
  if (vehicleState) {
    signalBoost += getVehicleEventWeightForCandidate({
      vehicleState,
      neighborhoodId: event.neighborhoodId,
      eventType: event.eventType,
      title: event.title,
      category: event.category,
      tags: event.filterTags,
      day: context.currentDay,
      tutorialActive: tutorialActive ?? context.currentDay <= 1,
      activeDistrictId: context.selectedDistrictId,
    });
  }
  if (signalBoost > 0) {
    const clampedBoost = Math.min(signalBoost, MAX_COMBINED_SIGNAL_BOOST);
    weight = weight * (1 + clampedBoost);
  }

  weight += getNeighborhoodIdentityEventWeightBonus(event, {
    currentDay: context.currentDay,
    tutorialActive: tutorialActive ?? context.currentDay <= 1,
  });

  return Math.max(1, weight);
}
