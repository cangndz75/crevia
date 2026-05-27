import { pilotEvents } from '@/core/content/pilotEvents';
import { enrichDailyEventSetWithDistrictEvents } from '@/core/districts/districtEventIntegration';
import { calculateEventWeight } from '@/core/game/calculateEventWeight';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { generateDailyEventSet } from '@/core/game/generateDailyEventSet';
import type { PilotEventSelectionContext } from '@/core/game/pilotConditions';
import type { DailyEventSet } from '@/core/models/DailyEventSet';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';

import {
  buildContainerEventSignals,
  getContainerEventWeightForCandidate,
  isContainerOrWasteEventCandidate,
  selectStrongestContainerSignals,
} from './containerEventSignals';
import { recomputeContainerAggregates } from './containerEngine';
import { createInitialContainerState } from './containerSeed';
import type { ContainerNeighborhoodId, ContainerState, ContainerUnit } from './containerTypes';

export type VerifyContainerEventSignalsResult = {
  ok: boolean;
  checks: string[];
};

function mockGameState(day: number, districtId: PilotDistrictId): GameState {
  return {
    city: {
      day,
      publicSatisfaction: 55,
      budget: 75_000,
      morale: 65,
      riskScore: 55,
    },
    player: {
      name: 'Can',
      xp: 0,
      xpToNextLevel: 100,
      authorityPoints: 0,
      level: 1,
      title: 'Koordinatör',
      role: 'Pilot',
      notificationCount: 0,
      streakDays: 1,
    },
    cityPulse: [],
    dailyMissions: [],
    events: [],
    featuredEventId: '',
    eventOpportunity: { id: 'o', title: '', description: '', xpReward: 0 },
    solvedEvents: [],
    eventAdvisor: { body: '', attribution: '', tokenCost: 0 },
    risks: { total: 0, activeThreats: 0, critical: 0 },
    abilities: [],
    dailyReport: { day, title: '', stats: [], rewardTitle: '' },
    riskSummary: { total: 0, activeThreats: 0, critical: 0 },
    operationsBrief: { title: '', summary: '' },
    pilot: {
      ...createDefaultPilotState(),
      status: 'active',
      selectedDistrictId: districtId,
      currentPilotDay: day,
    },
  } as unknown as GameState;
}

function patchUnits(
  state: ContainerState,
  patch: (unit: ContainerUnit) => ContainerUnit,
): ContainerState {
  const units = state.units.map(patch);
  return {
    ...state,
    units,
    aggregates: recomputeContainerAggregates(units, state.lastProcessedDay),
  };
}

function countContainerInfluencedEvents(dailySet: DailyEventSet): number {
  const catalog = [
    ...pilotEvents,
    ...(dailySet.supplementalEvents ?? []),
  ];
  const byId = new Map(catalog.map((event) => [event.id, event]));
  let count = 0;
  for (const id of dailySet.allEventIds) {
    const card = byId.get(id);
    if (!card) {
      continue;
    }
    const haystack = `${card.eventType ?? ''} ${card.title} ${card.category} ${card.districtEventType ?? ''}`.toLowerCase();
    if (
      haystack.includes('waste') ||
      haystack.includes('konteyner') ||
      haystack.includes('atık') ||
      haystack.includes('çöp') ||
      haystack.includes('park') ||
      haystack.includes('market') ||
      haystack.includes('overflow') ||
      haystack.includes('collection')
    ) {
      count += 1;
    }
  }
  return count;
}

function buildWeightContext(
  gameState: GameState,
  day: number,
  districtId: PilotDistrictId,
): PilotEventSelectionContext {
  return {
    gameState,
    selectedDistrictId: districtId,
    pilot: gameState.pilot,
    currentDay: day,
    flags: gameState.pilot.flags ?? {},
  };
}

export function verifyContainerEventSignals(): VerifyContainerEventSignalsResult {
  const checks: string[] = [];
  let ok = true;

  const seedState = createInitialContainerState(1);
  const seedSignals = buildContainerEventSignals(seedState);

  if (seedSignals.length === 0) {
    ok = false;
    checks.push('FAIL seed state produced no container signals');
  } else {
    checks.push(`OK seed signals generated (${seedSignals.length})`);
  }

  const sanayiSignals = seedSignals.filter((s) => s.neighborhoodId === 'sanayi');
  const yesilvadiSignals = seedSignals.filter(
    (s) => s.neighborhoodId === 'yesilvadi',
  );
  const yesilvadiMaxSeverity = yesilvadiSignals.reduce(
    (max, signal) =>
      Math.max(
        max,
        signal.severity === 'critical'
          ? 4
          : signal.severity === 'high'
            ? 3
            : signal.severity === 'medium'
              ? 2
              : signal.severity === 'low'
                ? 1
                : 0,
      ),
    0,
  );

  if (
    sanayiSignals.length === 0 &&
    seedSignals.filter((s) => s.neighborhoodId === 'merkez').length === 0
  ) {
    ok = false;
    checks.push('FAIL no sanayi/merkez pressure signal on seed');
  } else {
    checks.push('OK sanayi or merkez signal present on seed');
  }

  if (yesilvadiMaxSeverity >= 3) {
    ok = false;
    checks.push('FAIL yesilvadi seed severity too high');
  } else {
    checks.push('OK yesilvadi seed stays low/medium severity');
  }

  const calmState = patchUnits(createInitialContainerState(1), (unit) => ({
    ...unit,
    fillRate: 25,
    odorLevel: 10,
    maintenanceNeed: 8,
    condition: 90,
    complaintPressure: 5,
    overflowRisk: 'low',
    lastCollectedDay: unit.lastCollectedDay,
  }));
  const calmSignals = buildContainerEventSignals(calmState);
  const calmBoost = getContainerEventWeightForCandidate({
    containerState: calmState,
    eventType: 'waste',
    title: 'Konteyner taşması',
    neighborhoodId: 'sanayi',
    day: 3,
  });

  if (calmSignals.some((s) => s.severity === 'critical' || s.severity === 'high')) {
    ok = false;
    checks.push('FAIL calm mock still emits high/critical signals');
  } else {
    checks.push('OK calm mock avoids high severity signals');
  }

  if (calmBoost > 0.02) {
    ok = false;
    checks.push(`FAIL calm mock boost too high (${calmBoost})`);
  } else {
    checks.push('OK calm mock boost near zero');
  }

  const stressedSanayi = patchUnits(createInitialContainerState(3), (unit) => {
    if (unit.neighborhoodId !== 'sanayi') {
      return unit;
    }
    return {
      ...unit,
      fillRate: 92,
      odorLevel: 80,
      maintenanceNeed: 70,
      condition: 42,
      complaintPressure: 78,
      overflowRisk: 'critical',
      lastCollectedDay: 0,
    };
  });
  const wasteSignal = buildContainerEventSignals(stressedSanayi).find(
    (s) => s.signalType === 'waste_overflow' && s.neighborhoodId === 'sanayi',
  );
  if (
    !wasteSignal ||
    (wasteSignal.severity !== 'high' && wasteSignal.severity !== 'critical')
  ) {
    ok = false;
    checks.push('FAIL stressed sanayi waste_overflow not high/critical');
  } else {
    checks.push(`OK stressed sanayi waste_overflow=${wasteSignal.severity}`);
  }

  const parkStress = patchUnits(createInitialContainerState(2), (unit) => {
    if (unit.type !== 'park_bin') {
      return unit;
    }
    return {
      ...unit,
      fillRate: 72,
      odorLevel: 58,
      overflowRisk: 'high',
    };
  });
  const parkSignal = buildContainerEventSignals(parkStress).find(
    (s) => s.signalType === 'park_cleanliness',
  );
  if (!parkSignal) {
    ok = false;
    checks.push('FAIL park_bin stress did not emit park_cleanliness');
  } else {
    checks.push('OK park_cleanliness signal emitted');
  }

  const recyclingState = patchUnits(createInitialContainerState(2), (unit) => {
    if (unit.type !== 'recycling' || unit.neighborhoodId !== 'yesilvadi') {
      return unit;
    }
    return {
      ...unit,
      fillRate: 38,
      condition: 88,
      maintenanceNeed: 12,
      odorLevel: 8,
      overflowRisk: 'low',
    };
  });
  const recyclingSignal = buildContainerEventSignals(recyclingState).find(
    (s) => s.signalType === 'recycling_opportunity',
  );
  if (!recyclingSignal) {
    checks.push('WARN recycling_opportunity not emitted (optional)');
  } else if (
    recyclingSignal.severity !== 'low' &&
    recyclingSignal.severity !== 'medium'
  ) {
    ok = false;
    checks.push('FAIL recycling_opportunity severity too high');
  } else {
    checks.push(`OK recycling_opportunity=${recyclingSignal.severity}`);
  }

  const wasteEvent = {
    eventType: 'waste' as const,
    title: 'Konteyner taşması şikayeti',
    category: 'Atık',
    neighborhoodId: 'sanayi',
  };
  const securityEvent = {
    eventType: 'vehicle' as const,
    title: 'Araç arıza riski',
    category: 'Operasyon',
    neighborhoodId: 'sanayi',
  };

  const sanayiBoost = getContainerEventWeightForCandidate({
    containerState: stressedSanayi,
    ...wasteEvent,
    day: 3,
  });
  const securityBoost = getContainerEventWeightForCandidate({
    containerState: stressedSanayi,
    ...securityEvent,
    day: 3,
  });
  const pazarBoost = getContainerEventWeightForCandidate({
    containerState: stressedSanayi,
    ...wasteEvent,
    neighborhoodId: 'pazar',
    day: 3,
  });

  if (sanayiBoost <= 0) {
    ok = false;
    checks.push('FAIL waste candidate boost on stressed sanayi is zero');
  } else {
    checks.push(`OK waste candidate boost=${sanayiBoost.toFixed(3)}`);
  }

  if (securityBoost > 0) {
    ok = false;
    checks.push(`FAIL unrelated security event got boost (${securityBoost})`);
  } else {
    checks.push('OK unrelated security event boost=0');
  }

  const yesilvadiStress = patchUnits(stressedSanayi, (unit) => {
    if (unit.neighborhoodId !== 'yesilvadi') {
      return unit;
    }
    return {
      ...unit,
      fillRate: 78,
      odorLevel: 70,
      complaintPressure: 72,
      overflowRisk: 'high',
      lastCollectedDay: 0,
    };
  });
  const yesilparkBoostBridged = getContainerEventWeightForCandidate({
    containerState: yesilvadiStress,
    ...wasteEvent,
    neighborhoodId: 'yesilpark',
    day: 3,
  });

  if (yesilparkBoostBridged <= 0) {
    ok = false;
    checks.push('FAIL yesilpark -> yesilvadi bridge did not receive boost');
  } else {
    checks.push('OK yesilpark -> yesilvadi bridge boost');
  }

  if (pazarBoost <= 0 && sanayiBoost > 0) {
    ok = false;
    checks.push('FAIL pazar bridge did not receive boost');
  } else {
    checks.push('OK pazar bridge resolves for boost');
  }

  const day1Boost = getContainerEventWeightForCandidate({
    containerState: stressedSanayi,
    ...wasteEvent,
    day: 1,
  });
  const day2Boost = getContainerEventWeightForCandidate({
    containerState: stressedSanayi,
    ...wasteEvent,
    day: 2,
  });

  if (day1Boost !== 0) {
    ok = false;
    checks.push(`FAIL day1 boost should be 0 (got ${day1Boost})`);
  } else {
    checks.push('OK day1 container boost disabled');
  }

  if (day2Boost <= 0) {
    ok = false;
    checks.push('FAIL day2+ boost inactive');
  } else {
    checks.push('OK day2+ container boost active');
  }

  const gameState = mockGameState(2, 'central');
  const context = buildWeightContext(gameState, 2, 'central');
  const wasteCard: EventCard = {
    id: 'test-waste-weight',
    title: 'Konteyner ve atık baskısı',
    category: 'Atık',
    riskLevel: 'high',
    district: 'Merkez',
    description: 'test',
    contextTag: 'test',
    urgencyHours: 4,
    decisions: [],
    previewEffects: { publicSatisfaction: -5, risk: 10, xp: 10 },
    eventType: 'waste',
    priority: 2,
  };

  const baseWeight = calculateEventWeight({
    event: wasteCard,
    context,
  });
  const boostedWeight = calculateEventWeight({
    event: wasteCard,
    context,
    containerState: stressedSanayi,
  });

  if (boostedWeight <= baseWeight) {
    checks.push('WARN calculateEventWeight container boost not visible on generic card');
  } else {
    checks.push('OK calculateEventWeight applies container multiplier');
  }

  try {
    const withoutContainer = generateDailyEventSet({
      gameState: mockGameState(3, 'central'),
      day: 3,
      districtId: 'central',
    });
    const withContainer = generateDailyEventSet({
      gameState: mockGameState(3, 'central'),
      day: 3,
      districtId: 'central',
      containerState: stressedSanayi,
    });

    if (withoutContainer.allEventIds.length < 1) {
      ok = false;
      checks.push('FAIL daily set without container is empty');
    } else {
      checks.push(
        `OK daily set without container (${withoutContainer.allEventIds.length} events)`,
      );
    }

    if (withContainer.allEventIds.length < 1) {
      ok = false;
      checks.push('FAIL daily set with container is empty');
    } else {
      checks.push(
        `OK daily set with container (${withContainer.allEventIds.length} events)`,
      );
    }

    const influenced = countContainerInfluencedEvents(withContainer);
    if (influenced > 3) {
      ok = false;
      checks.push(`FAIL container-influenced event spam (${influenced})`);
    } else {
      checks.push(`OK container-influenced events in set=${influenced}`);
    }
  } catch (error) {
    ok = false;
    checks.push(
      `FAIL daily generation smoke threw: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const day1Set = generateDailyEventSet({
    gameState: mockGameState(1, 'central'),
    day: 1,
    districtId: 'central',
    containerState: stressedSanayi,
  });
  if (!day1Set.anchorEventId) {
    ok = false;
    checks.push('FAIL day1 anchor missing');
  } else {
    checks.push(`OK day1 anchor preserved (${day1Set.anchorEventId})`);
  }

  const strongest = selectStrongestContainerSignals(stressedSanayi, 3);
  if (strongest.length === 0) {
    ok = false;
    checks.push('FAIL selectStrongestContainerSignals empty on stress');
  } else {
    checks.push(`OK strongest signals=${strongest.length}`);
  }

  const baseSet: DailyEventSet = {
    id: 'daily-test',
    day: 3,
    districtId: 'central',
    generatedAt: new Date().toISOString(),
    seed: 1,
    anchorEventId: 'central_day1_learning_main_street',
    sideEventIds: ['waste-side-mock'],
    quickActionIds: [],
    opportunityEventIds: [],
    butterflyEventIds: [],
    signalEventIds: [],
    allEventIds: ['central_day1_learning_main_street', 'waste-side-mock'],
    eventRoles: {
      central_day1_learning_main_street: 'anchor',
      'waste-side-mock': 'side',
    },
    eventStatuses: {
      central_day1_learning_main_street: 'awaiting_decision',
      'waste-side-mock': 'awaiting_decision',
    },
  };

  const wasteOnlyCatalog: EventCard[] = [
    {
      id: 'waste-side-mock',
      title: 'Konteyner taşması',
      category: 'Atık',
      riskLevel: 'high',
      district: 'Merkez',
      description: 'test',
      contextTag: 'test',
      urgencyHours: 4,
      decisions: [],
      previewEffects: { publicSatisfaction: -5, risk: 10, xp: 10 },
      eventType: 'waste',
      districtIds: ['central'],
    },
  ];

  const enrichedDuplicate = enrichDailyEventSetWithDistrictEvents({
    gameState: mockGameState(3, 'central'),
    day: 3,
    districtId: 'central',
    dailyEventSet: baseSet,
    containerState: stressedSanayi,
    catalog: wasteOnlyCatalog,
  });

  if ((enrichedDuplicate.supplementalEvents?.length ?? 0) > 0) {
    ok = false;
    checks.push('FAIL duplicate container district event added when set already has waste');
  } else {
    checks.push('OK spam guard skips second container district event');
  }

  const securitySideSet: DailyEventSet = {
    ...baseSet,
    sideEventIds: ['security-side-mock'],
    allEventIds: ['central_day1_learning_main_street', 'security-side-mock'],
    eventRoles: {
      central_day1_learning_main_street: 'anchor',
      'security-side-mock': 'side',
    },
    eventStatuses: {
      central_day1_learning_main_street: 'awaiting_decision',
      'security-side-mock': 'awaiting_decision',
    },
  };
  const securityCatalog: EventCard[] = [
    {
      id: 'security-side-mock',
      title: 'Araç arıza riski',
      category: 'Operasyon',
      riskLevel: 'medium',
      district: 'Merkez',
      description: 'test',
      contextTag: 'test',
      urgencyHours: 4,
      decisions: [],
      previewEffects: { publicSatisfaction: -3, risk: 8, xp: 8 },
      eventType: 'vehicle',
      districtIds: ['central'],
    },
  ];
  if (
    isContainerOrWasteEventCandidate({
      eventType: 'vehicle',
      title: 'Araç arıza riski',
      category: 'Operasyon',
    })
  ) {
    ok = false;
    checks.push('FAIL vehicle event misclassified as container/waste');
  } else {
    checks.push('OK vehicle event not treated as container/waste');
  }

  const enrichedWithSecurity = enrichDailyEventSetWithDistrictEvents({
    gameState: mockGameState(3, 'central'),
    day: 3,
    districtId: 'central',
    dailyEventSet: securitySideSet,
    containerState: stressedSanayi,
    catalog: securityCatalog,
  });
  if ((enrichedWithSecurity.supplementalEvents?.length ?? 0) === 0) {
    checks.push('WARN container supplement skipped with only non-waste side event');
  } else {
    checks.push('OK supplement allowed when side event is non-waste');
  }

  const emptySet: DailyEventSet = {
    ...baseSet,
    sideEventIds: [],
    allEventIds: ['central_day1_learning_main_street'],
  };
  const enrichedNoWaste = enrichDailyEventSetWithDistrictEvents({
    gameState: mockGameState(3, 'central'),
    day: 3,
    districtId: 'central',
    dailyEventSet: emptySet,
    containerState: stressedSanayi,
    catalog: pilotEvents,
  });
  if ((enrichedNoWaste.supplementalEvents?.length ?? 0) > 0) {
    checks.push('OK supplement added when daily set has no waste yet');
  } else {
    checks.push('WARN supplement not added without existing waste (signal may be low)');
  }

  return { ok, checks };
}

export function runVerifyContainerEventSignals(): void {
  const result = verifyContainerEventSignals();
  const label = result.ok ? 'PASS' : 'FAIL';
  console.log(
    `[container-signals] ${label}`,
    result.checks.join(' | '),
  );
  if (!result.ok) {
    process.exit(1);
  }
}
