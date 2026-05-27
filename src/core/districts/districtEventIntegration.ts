import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type {
  EventCard,
  EventDecision,
  EventDecisionCost,
  EventDecisionEffect,
  EventRiskLevel,
} from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotEventType } from '@/core/models/PilotDayPlan';

import {
  isContainerOrWasteEventCandidate,
  mapContainerSignalToDistrictEventType,
  selectContainerSignalForNeighborhood,
} from '@/core/containers/containerEventSignals';
import { normalizeContainerNeighborhoodId } from '@/core/containers/containerNeighborhoodBridge';
import type { ContainerState } from '@/core/containers/containerTypes';
import { getDistrictProfile } from '@/core/districts/districtProfiles';
import { createDistrictEvent } from '@/core/districts/districtEventEngine';
import { mapPilotDistrictToDistrictType } from '@/core/districts/pilotDistrictBridge';
import type { DistrictEvent, DistrictEventType, DistrictType } from '@/core/districts/types';

export const DISTRICT_EVENT_INTEGRATION_CONFIG = {
  enabled: true,
  maxGeneratedDistrictEventsPerDay: 1,
  preserveMockEvents: true,
} as const;

const PILOT_DISTRICT_LABELS: Record<PilotDistrictId, string> = {
  central: 'Merkez Pilot Bölge',
  cumhuriyet: 'Cumhuriyet Mahallesi',
  industrial_market: 'Sanayi & Pazar Bölgesi',
};

const DISTRICT_EVENT_TO_PILOT_TYPE: Record<DistrictEventType, PilotEventType> = {
  waste_overflow: 'waste',
  delayed_collection: 'waste',
  sidewalk_blocked: 'sidewalk',
  market_crowding: 'market',
  vehicle_breakdown_risk: 'vehicle',
  noise_complaint: 'noise',
  social_media_complaint: 'social_media',
  park_cleanliness: 'waste',
  route_delay: 'vehicle',
  staff_fatigue_pressure: 'staff',
  public_trust_drop: 'citizen_complaint',
};

type GenericDecisionSpec = {
  id: string;
  title: string;
  description: string;
  style: EventDecision['style'];
  recommended?: boolean;
  decisionStyle: EventDecision['decisionStyle'];
  effects: EventDecisionEffect;
  costs?: EventDecisionCost;
  districtBonusFlags?: EventDecision['districtBonusFlags'];
};

function buildGenericDistrictDecisions(eventId: string): EventDecision[] {
  const specs: GenericDecisionSpec[] = [
    {
      id: `${eventId}-fast`,
      title: 'Hızlı Müdahale Et',
      description: 'Ekibi hemen yönlendir; görünür sonuç, yüksek tempo.',
      style: 'bold',
      recommended: true,
      decisionStyle: 'fast',
      effects: {
        publicSatisfaction: 6,
        budget: -3000,
        morale: -4,
        risk: -10,
        xp: 12,
      },
      costs: { budget: 3000, staffHours: 8 },
      districtBonusFlags: { resolvedQuickly: true },
    },
    {
      id: `${eventId}-route`,
      title: 'Rota ve Ekip Planla',
      description: 'Planlı rota ile müdahale; risk ve yoğunluk dengelenir.',
      style: 'balanced',
      decisionStyle: 'planned',
      effects: {
        publicSatisfaction: 8,
        budget: -4500,
        morale: -2,
        risk: -15,
        xp: 16,
      },
      costs: { budget: 4500, staffHours: 10 },
      districtBonusFlags: { trafficReduced: true },
    },
    {
      id: `${eventId}-announce`,
      title: 'Duyuru ile Bilgilendir',
      description: 'Vatandaşı bilgilendir; düşük maliyet, algı yönetimi.',
      style: 'cautious',
      decisionStyle: 'communication',
      effects: {
        publicSatisfaction: 4,
        budget: -1000,
        morale: 0,
        risk: -8,
        xp: 8,
      },
      costs: { budget: 1000, staffHours: 2 },
      districtBonusFlags: {
        socialRiskPrevented: true,
        publicTrustProtected: true,
      },
    },
  ];

  return specs.map((spec) => ({
    id: spec.id,
    title: spec.title,
    description: spec.description,
    style: spec.style,
    recommended: spec.recommended,
    decisionStyle: spec.decisionStyle,
    effects: spec.effects,
    costs: spec.costs,
    districtBonusFlags: spec.districtBonusFlags,
    resultText: `${spec.title} uygulandı.`,
  }));
}

function urgencyHoursForSeverity(severity: EventRiskLevel): number {
  switch (severity) {
    case 'critical':
      return 2;
    case 'high':
      return 4;
    case 'medium':
      return 6;
    default:
      return 8;
  }
}

function filterTagsForSeverity(severity: EventRiskLevel): EventCard['filterTags'] {
  if (severity === 'critical' || severity === 'high') {
    return ['urgent'];
  }
  return undefined;
}

/**
 * District engine çıktısını mevcut EventCard shape'ine map eder.
 */
export function mapDistrictEventToPilotEvent(
  districtEvent: DistrictEvent,
  pilotDistrictId: PilotDistrictId,
): EventCard {
  const severity = districtEvent.severity as EventRiskLevel;
  const pilotEventType =
    DISTRICT_EVENT_TO_PILOT_TYPE[districtEvent.type] ?? 'citizen_complaint';

  return {
    id: districtEvent.id,
    title: districtEvent.title,
    category: 'Mahalle Operasyonu',
    riskLevel: severity,
    district:
      PILOT_DISTRICT_LABELS[pilotDistrictId] ?? districtEvent.districtName,
    description: districtEvent.description,
    contextTag: 'Mahalle karakteri',
    urgencyHours: urgencyHoursForSeverity(severity),
    decisions: buildGenericDistrictDecisions(districtEvent.id),
    previewEffects: {
      publicSatisfaction: severity === 'critical' ? -8 : -5,
      risk: severity === 'low' ? 5 : 10,
      xp: severity === 'critical' ? 20 : 14,
    },
    day: districtEvent.day,
    districtIds: [pilotDistrictId],
    eventType: pilotEventType,
    filterTags: filterTagsForSeverity(severity),
    districtBonusHints: { ...districtEvent.districtBonusHints },
    xpDistrictType: districtEvent.xpDistrictType,
    districtEventType: districtEvent.type,
  };
}

export function mergeEventCatalogs(
  baseCatalog: EventCard[],
  supplemental: EventCard[],
): EventCard[] {
  const byId = new Map(baseCatalog.map((event) => [event.id, event]));
  for (const event of supplemental) {
    if (!byId.has(event.id)) {
      byId.set(event.id, event);
    }
  }
  return [...byId.values()];
}

export type EnrichDailyEventSetParams = {
  gameState: GameState;
  day: number;
  districtId: PilotDistrictId;
  dailyEventSet: DailyEventSet;
  randomFn?: () => number;
  containerState?: ContainerState | null;
  catalog?: EventCard[];
};

function resolveEventCardById(
  id: string,
  catalog: EventCard[],
  supplemental: EventCard[] = [],
): EventCard | undefined {
  return (
    supplemental.find((event) => event.id === id) ??
    catalog.find((event) => event.id === id)
  );
}

function dailySetAlreadyHasContainerOrWasteEvent(
  dailyEventSet: DailyEventSet,
  catalog: EventCard[],
): boolean {
  const supplemental = dailyEventSet.supplementalEvents ?? [];
  const eventIds = new Set<string>([
    ...dailyEventSet.allEventIds,
    dailyEventSet.anchorEventId,
    ...dailyEventSet.sideEventIds,
    ...dailyEventSet.quickActionIds,
    ...dailyEventSet.opportunityEventIds,
    ...dailyEventSet.butterflyEventIds,
    ...dailyEventSet.signalEventIds,
  ]);

  for (const eventId of eventIds) {
    if (!eventId) {
      continue;
    }
    const card = resolveEventCardById(eventId, catalog, supplemental);
    if (
      card &&
      isContainerOrWasteEventCandidate({
        eventType: card.eventType,
        title: card.title,
        category: card.category,
        tags: card.filterTags,
        districtEventType: card.districtEventType,
      })
    ) {
      return true;
    }
  }
  return false;
}

function resolveContainerDistrictEventType(
  containerState: ContainerState,
  pilotDistrictId: PilotDistrictId,
  day: number,
): DistrictEventType | undefined {
  if (day <= 1) {
    return undefined;
  }

  const neighborhoodId = normalizeContainerNeighborhoodId(pilotDistrictId);
  if (!neighborhoodId) {
    return undefined;
  }

  const signal = selectContainerSignalForNeighborhood(
    containerState,
    neighborhoodId,
  );
  if (!signal || signal.severity === 'none' || signal.severity === 'low') {
    return undefined;
  }

  return mapContainerSignalToDistrictEventType(signal) ?? undefined;
}

/**
 * Günlük sete district engine event ekler; mock seçimi korunur.
 */
export function enrichDailyEventSetWithDistrictEvents(
  params: EnrichDailyEventSetParams,
): DailyEventSet {
  if (!DISTRICT_EVENT_INTEGRATION_CONFIG.enabled) {
    return params.dailyEventSet;
  }

  const maxCount = DISTRICT_EVENT_INTEGRATION_CONFIG.maxGeneratedDistrictEventsPerDay;
  if (maxCount <= 0) {
    return params.dailyEventSet;
  }

  const catalog = params.catalog ?? [];
  if (
    dailySetAlreadyHasContainerOrWasteEvent(params.dailyEventSet, catalog)
  ) {
    return params.dailyEventSet;
  }

  const districtType = mapPilotDistrictToDistrictType(params.districtId);
  const profile = getDistrictProfile(districtType);
  const currentRisk =
    params.gameState.city.riskScore ?? profile.baseRisk;
  const baseCount = params.dailyEventSet.allEventIds.length;

  const containerEventTypeOverride =
    params.containerState != null
      ? resolveContainerDistrictEventType(
          params.containerState,
          params.districtId,
          params.day,
        )
      : undefined;

  const supplemental: EventCard[] = [];
  const existingIds = new Set(params.dailyEventSet.allEventIds);

  for (let i = 0; i < maxCount; i += 1) {
    const districtEvent = createDistrictEvent({
      districtType,
      day: params.day,
      currentRisk,
      activeEventCount: baseCount + supplemental.length,
      randomFn: params.randomFn,
      eventType: containerEventTypeOverride,
    });

    if (existingIds.has(districtEvent.id)) {
      continue;
    }

    const pilotCard = mapDistrictEventToPilotEvent(
      districtEvent,
      params.districtId,
    );

    if (existingIds.has(pilotCard.id)) {
      continue;
    }

    supplemental.push(pilotCard);
    existingIds.add(pilotCard.id);
  }

  if (supplemental.length === 0) {
    return params.dailyEventSet;
  }

  const sideEventIds = [...params.dailyEventSet.sideEventIds];
  const eventRoles = { ...params.dailyEventSet.eventRoles };
  const eventStatuses = { ...params.dailyEventSet.eventStatuses };

  for (const card of supplemental) {
    sideEventIds.push(card.id);
    eventRoles[card.id] = 'side';
    eventStatuses[card.id] = 'awaiting_decision';
  }

  const allEventIds = [
    ...new Set([...params.dailyEventSet.allEventIds, ...supplemental.map((c) => c.id)]),
  ];

  return {
    ...params.dailyEventSet,
    sideEventIds,
    allEventIds,
    eventRoles,
    eventStatuses,
    supplementalEvents: [
      ...(params.dailyEventSet.supplementalEvents ?? []),
      ...supplemental,
    ],
  };
}

export function resolveCurrentRisk(
  gameState: GameState,
  districtType: DistrictType,
): number {
  const profile = getDistrictProfile(districtType);
  return gameState.city.riskScore ?? profile.baseRisk;
}

export function resolvePilotDistrictId(
  gameState: GameState,
  fallback: PilotDistrictId = DEFAULT_PILOT_DISTRICT_ID,
): PilotDistrictId {
  return gameState.pilot.selectedDistrictId ?? fallback;
}
