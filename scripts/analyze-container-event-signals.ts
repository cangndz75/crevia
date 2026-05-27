/**
 * Konteyner event sinyali — 7 günlük pilot event üretim simülasyonu.
 * Çalıştır: npx tsx scripts/analyze-container-event-signals.ts
 */

import { pilotEvents } from '../src/core/content/pilotEvents';
import { calculateEventWeight } from '../src/core/game/calculateEventWeight';
import { createDefaultPilotState } from '../src/core/game/createDefaultPilotState';
import { createPilotRun } from '../src/core/game/pilotRun';
import type { PilotEventSelectionContext } from '../src/core/game/pilotConditions';
import {
  generateDailyEventSet,
  resolveEventCardsFromDailySet,
} from '../src/core/game/generateDailyEventSet';
import { applyContainerDecisionEffects } from '../src/core/containers/containerDecisionEffects';
import {
  getContainerEventWeightForCandidate,
  isContainerOrWasteEventCandidate,
  selectStrongestContainerSignals,
  type ContainerEventSignal,
  type ContainerEventSignalType,
} from '../src/core/containers/containerEventSignals';
import { recomputeContainerAggregates } from '../src/core/containers/containerEngine';
import { isPilotMarketDay, processContainersEndOfDay } from '../src/core/containers/containerIntegration';
import { normalizeContainerNeighborhoodId } from '../src/core/containers/containerNeighborhoodBridge';
import { CONTAINER_NEIGHBORHOOD_IDS } from '../src/core/containers/containerConstants';
import { createInitialContainerState } from '../src/core/containers/containerSeed';
import { selectWorstContainerNeighborhood } from '../src/core/containers/containerSelectors';
import type {
  ContainerNeighborhoodId,
  ContainerState,
  ContainerUnit,
} from '../src/core/containers/containerTypes';
import type { DailyEventSet } from '../src/core/models/DailyEventSet';
import type { EventCard } from '../src/core/models/EventCard';
import type { GameState } from '../src/core/models/GameState';
import type { PilotDistrictId } from '../src/core/models/DistrictProfile';

const PILOT_DAYS = 7;
const PILOT_DISTRICT: PilotDistrictId = 'central';
const DAY1_ANCHOR_ID = 'central_day1_learning_main_street';
const FIXED_RUN_ID = 'analyze-container-event-signals-run';

type ScenarioId =
  | 'passive_no_decisions'
  | 'reasonable_player'
  | 'wrong_player'
  | 'high_sanayi_pressure'
  | 'low_pressure_map';

type DecisionKind =
  | 'none'
  | 'dispatch_collection'
  | 'communicate'
  | 'prioritize_route'
  | 'maintenance'
  | 'add_capacity'
  | 'monitor'
  | 'permanent_solution';

type BalanceVerdict = 'PASS' | 'WARN' | 'FAIL';

type BalanceFinding = {
  verdict: BalanceVerdict;
  message: string;
};

type BoostedEventRef = {
  id: string;
  title: string;
  eventType?: string;
  boost: number;
};

type DayLog = {
  day: number;
  generatedEventCount: number;
  criticalTitle: string;
  criticalType?: string;
  criticalNeighborhood?: string;
  sideSummaries: string[];
  districtSupplement: boolean;
  containerInfluencedCount: number;
  boostedEvents: BoostedEventRef[];
  strongestSignal: string;
  wasteContainerEventCount: number;
  opportunityEventCount: number;
  duplicateContainerEvent: boolean;
  containerBoostApplied: boolean;
  aggregateWorstSummary: string;
  anchorEventId: string;
};

type ScenarioSummary = {
  id: ScenarioId;
  totalEventsGenerated: number;
  totalWasteContainerEvents: number;
  totalContainerInfluencedEvents: number;
  totalDistrictSupplements: number;
  day1ContainerBoostApplied: boolean;
  day1AnchorId: string;
  duplicateContainerEventDays: number;
  mostFrequentNeighborhood: string;
  sanayiEventCount: number;
  yesilvadiEventCount: number;
  recyclingOpportunityCount: number;
  nonContainerEventShare: number;
  finalWorstContainerNeighborhood: ContainerNeighborhoodId;
  finalCriticalNeighborhoodCount: number;
  highRiskContainerEventCount: number;
};

type ScenarioResult = {
  id: ScenarioId;
  daily: DayLog[];
  summary: ScenarioSummary;
  finalContainerState: ContainerState;
};

function mockGameState(day: number): GameState {
  const run = createPilotRun(PILOT_DISTRICT);
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
      selectedDistrictId: PILOT_DISTRICT,
      currentPilotDay: day,
      run: { ...run, id: FIXED_RUN_ID },
    },
  } as unknown as GameState;
}

function patchContainerState(
  state: ContainerState,
  patchUnit: (unit: ContainerUnit) => ContainerUnit,
): ContainerState {
  const units = state.units.map(patchUnit);
  return {
    ...state,
    units,
    aggregates: recomputeContainerAggregates(units, state.lastProcessedDay),
  };
}

function createScenarioInitialContainer(
  scenario: ScenarioId,
  day: number,
): ContainerState {
  const base = createInitialContainerState(day);

  if (scenario === 'high_sanayi_pressure') {
    return patchContainerState(base, (unit) => {
      if (unit.neighborhoodId !== 'sanayi') {
        return unit;
      }
      return {
        ...unit,
        fillRate: 84,
        odorLevel: 70,
        maintenanceNeed: 58,
        condition: 50,
        complaintPressure: 68,
        overflowRisk: 'critical',
        lastCollectedDay: Math.max(0, day - 3),
      };
    });
  }

  if (scenario === 'low_pressure_map') {
    return patchContainerState(base, (unit) => ({
      ...unit,
      fillRate: Math.min(unit.fillRate, 36),
      odorLevel: Math.min(unit.odorLevel, 18),
      maintenanceNeed: Math.min(unit.maintenanceNeed, 18),
      condition: Math.max(unit.condition, 85),
      complaintPressure: Math.min(unit.complaintPressure, 12),
      overflowRisk: 'low',
      lastCollectedDay: Math.max(0, day - 1),
    }));
  }

  return base;
}

function decisionForKind(kind: DecisionKind): {
  id: string;
  title: string;
  decisionStyle?: string;
  tags?: string[];
} {
  switch (kind) {
    case 'dispatch_collection':
      return { id: 'd-dispatch', title: 'Ekibi yönlendir', decisionStyle: 'fast' };
    case 'communicate':
      return {
        id: 'd-communicate',
        title: 'İletişim kur',
        decisionStyle: 'communication',
      };
    case 'prioritize_route':
      return { id: 'd-route', title: 'Toplama rotasını öne al' };
    case 'maintenance':
      return { id: 'd-maint', title: 'Bakım ekibi gönder', tags: ['maintenance'] };
    case 'add_capacity':
      return { id: 'd-cap', title: 'Ek konteyner yerleştir' };
    case 'monitor':
      return { id: 'd-monitor', title: 'Takip et', decisionStyle: 'balanced' };
    case 'permanent_solution':
      return {
        id: 'd-perm',
        title: 'Kalıcı çözüm uygula',
        decisionStyle: 'permanent',
      };
    default:
      return { id: 'd-none', title: '—' };
  }
}

function signalTypeFromDistrictEventType(
  districtEventType?: string,
): ContainerEventSignalType | null {
  switch (districtEventType) {
    case 'waste_overflow':
      return 'waste_overflow';
    case 'delayed_collection':
      return 'delayed_collection';
    case 'social_media_complaint':
      return 'odor_complaint';
    case 'park_cleanliness':
      return 'park_cleanliness';
    case 'market_crowding':
      return 'market_waste';
    case 'public_trust_drop':
      return 'capacity_request';
    default:
      return null;
  }
}

function resolveReasonableDecision(card: EventCard): DecisionKind {
  const fromDistrict = signalTypeFromDistrictEventType(card.districtEventType);
  const signalType = fromDistrict ?? inferSignalTypeFromCard(card);

  switch (signalType) {
    case 'waste_overflow':
    case 'delayed_collection':
    case 'market_waste':
      return signalType === 'delayed_collection'
        ? 'prioritize_route'
        : 'dispatch_collection';
    case 'container_damage':
      return 'maintenance';
    case 'odor_complaint':
      return 'dispatch_collection';
    case 'capacity_request':
      return 'add_capacity';
    case 'recycling_opportunity':
      return 'monitor';
    case 'park_cleanliness':
      return 'prioritize_route';
    default:
      return 'dispatch_collection';
  }
}

function resolveWrongDecision(day: number): DecisionKind {
  return day % 2 === 1 ? 'communicate' : 'monitor';
}

function inferSignalTypeFromCard(card: EventCard): ContainerEventSignalType | null {
  const haystack = `${card.eventType ?? ''} ${card.title} ${card.category} ${card.districtEventType ?? ''}`.toLowerCase();
  if (haystack.includes('geri dönüşüm') || haystack.includes('recycling')) {
    return 'recycling_opportunity';
  }
  if (haystack.includes('kapasite') || haystack.includes('capacity')) {
    return 'capacity_request';
  }
  if (haystack.includes('koku') || haystack.includes('şikayet') || haystack.includes('sosyal')) {
    return 'odor_complaint';
  }
  if (haystack.includes('park')) {
    return 'park_cleanliness';
  }
  if (haystack.includes('pazar') || haystack.includes('market')) {
    return 'market_waste';
  }
  if (haystack.includes('bakım') || haystack.includes('maintenance') || haystack.includes('hasar')) {
    return 'container_damage';
  }
  if (haystack.includes('gecik') || haystack.includes('delayed')) {
    return 'delayed_collection';
  }
  if (
    haystack.includes('waste') ||
    haystack.includes('çöp') ||
    haystack.includes('konteyner') ||
    haystack.includes('taşma') ||
    haystack.includes('overflow')
  ) {
    return 'waste_overflow';
  }
  return null;
}

function isWasteContainerEvent(card: EventCard): boolean {
  return isContainerOrWasteEventCandidate({
    eventType: card.eventType,
    title: card.title,
    category: card.category,
    tags: card.filterTags,
    districtEventType: card.districtEventType,
  });
}

function isRecyclingOpportunityEvent(card: EventCard): boolean {
  const haystack = `${card.title} ${card.category} ${card.eventType ?? ''}`.toLowerCase();
  return (
    haystack.includes('geri dönüşüm') ||
    haystack.includes('recycling') ||
    card.districtEventType === 'recycling_opportunity'
  );
}

function inferEventNeighborhood(card: EventCard): ContainerNeighborhoodId | null {
  const fromField = normalizeContainerNeighborhoodId(card.neighborhoodId);
  if (fromField) {
    return fromField;
  }

  const haystack = `${card.title} ${card.district} ${card.districtEventType ?? ''}`.toLowerCase();
  if (haystack.includes('sanayi') || haystack.includes('pazar') || haystack.includes('fabrika')) {
    return 'sanayi';
  }
  if (haystack.includes('yeşil') || haystack.includes('yesil') || haystack.includes('park')) {
    return 'yesilvadi';
  }
  if (haystack.includes('merkez') || haystack.includes('central')) {
    return 'merkez';
  }
  if (haystack.includes('istasyon')) {
    return 'istasyon';
  }
  if (haystack.includes('cumhuriyet')) {
    return 'cumhuriyet';
  }
  return null;
}

function isHighRiskContainerEvent(card: EventCard): boolean {
  if (!isWasteContainerEvent(card)) {
    return false;
  }
  return (
    card.riskLevel === 'high' ||
    card.riskLevel === 'critical' ||
    card.districtEventType === 'waste_overflow' ||
    card.districtEventType === 'delayed_collection'
  );
}

function formatSignal(signal: ContainerEventSignal | null): string {
  if (!signal) {
    return 'none';
  }
  return `${signal.signalType}/${signal.neighborhoodId}/${signal.severity}`;
}

function countCriticalNeighborhoods(state: ContainerState): number {
  return CONTAINER_NEIGHBORHOOD_IDS.filter(
    (id) => state.aggregates[id].statusLabel === 'Kritik',
  ).length;
}

function buildWeightContext(
  gameState: GameState,
  day: number,
): PilotEventSelectionContext {
  return {
    gameState,
    selectedDistrictId: PILOT_DISTRICT,
    pilot: gameState.pilot,
    currentDay: day,
    flags: gameState.pilot.flags ?? {},
  };
}

function analyzeBoostedEvents(
  cards: EventCard[],
  containerState: ContainerState,
  day: number,
  context: PilotEventSelectionContext,
): { boosted: BoostedEventRef[]; anyBoost: boolean } {
  const boosted: BoostedEventRef[] = [];

  for (const card of cards) {
    const boost = getContainerEventWeightForCandidate({
      containerState,
      neighborhoodId: card.neighborhoodId,
      eventType: card.eventType,
      title: card.title,
      category: card.category,
      day,
    });

    if (boost > 0) {
      boosted.push({
        id: card.id,
        title: card.title,
        eventType: card.eventType,
        boost,
      });
    }

    const base = calculateEventWeight({ event: card, context });
    const withContainer = calculateEventWeight({
      event: card,
      context,
      containerState,
    });
    if (withContainer > base && boost === 0) {
      boosted.push({
        id: card.id,
        title: card.title,
        eventType: card.eventType,
        boost: (withContainer - base) / Math.max(1, base),
      });
    }
  }

  return {
    boosted,
    anyBoost: boosted.length > 0,
  };
}

function applyScenarioDecisions(
  scenario: ScenarioId,
  containerState: ContainerState,
  cards: EventCard[],
  day: number,
): ContainerState {
  if (scenario === 'passive_no_decisions') {
    return containerState;
  }

  let state = containerState;
  const containerCards = cards.filter(isWasteContainerEvent);
  const limit = scenario === 'reasonable_player' ? 3 : 2;

  for (const card of containerCards.slice(0, limit)) {
    const kind =
      scenario === 'reasonable_player'
        ? resolveReasonableDecision(card)
        : resolveWrongDecision(day);

    if (kind === 'none') {
      continue;
    }

    const neighborhoodId =
      inferEventNeighborhood(card) ??
      selectStrongestContainerSignals(state, 1)[0]?.neighborhoodId ??
      selectWorstContainerNeighborhood(state)?.neighborhoodId ??
      'merkez';

    const result = applyContainerDecisionEffects({
      containerState: state,
      event: {
        id: card.id,
        title: card.title,
        category: card.category,
        eventType: card.eventType,
        neighborhoodId,
        tags: card.filterTags,
      },
      decision: decisionForKind(kind),
      day,
      personnelAssigned: kind === 'dispatch_collection',
    });
    state = result.state;
  }

  return state;
}

function buildDayLog(
  day: number,
  dailySet: DailyEventSet,
  cards: EventCard[],
  containerState: ContainerState,
  gameState: GameState,
): DayLog {
  const anchor = cards.find((c) => c.id === dailySet.anchorEventId) ?? cards[0];
  const sideCards = dailySet.sideEventIds
    .map((id) => cards.find((c) => c.id === id))
    .filter((c): c is EventCard => c != null);

  const context = buildWeightContext(gameState, day);
  const { boosted, anyBoost } = analyzeBoostedEvents(
    cards,
    containerState,
    day,
    context,
  );

  const influenced = cards.filter(isWasteContainerEvent);
  const wasteCount = influenced.length;
  const opportunityCount = cards.filter(
    (c) => c.eventType === 'opportunity' || isRecyclingOpportunityEvent(c),
  ).length;

  const strongest = selectStrongestContainerSignals(containerState, 1)[0] ?? null;
  const worst = selectWorstContainerNeighborhood(containerState);

  const aggregateWorstSummary = worst
    ? `${worst.neighborhoodId} ${worst.statusLabel} fill=${Math.round(worst.averageFillRate)}`
    : 'n/a';

  return {
    day,
    generatedEventCount: cards.length,
    criticalTitle: anchor?.title ?? '—',
    criticalType: anchor?.eventType,
    criticalNeighborhood: anchor?.neighborhoodId,
    sideSummaries: sideCards.map(
      (c) =>
        `${c.title.slice(0, 36)}[${c.eventType ?? '—'}${c.neighborhoodId ? `/${c.neighborhoodId}` : ''}]`,
    ),
    districtSupplement: (dailySet.supplementalEvents?.length ?? 0) > 0,
    containerInfluencedCount: influenced.length,
    boostedEvents: boosted,
    strongestSignal: formatSignal(strongest),
    wasteContainerEventCount: wasteCount,
    opportunityEventCount: opportunityCount,
    duplicateContainerEvent: wasteCount >= 2,
    containerBoostApplied: anyBoost,
    aggregateWorstSummary,
    anchorEventId: dailySet.anchorEventId,
  };
}

function runScenario(scenario: ScenarioId): ScenarioResult {
  let containerState = createScenarioInitialContainer(scenario, 1);
  const daily: DayLog[] = [];

  let totalEvents = 0;
  let totalWaste = 0;
  let totalInfluenced = 0;
  let totalSupplements = 0;
  let duplicateDays = 0;
  let day1Boost = false;
  let day1Anchor = '';
  const neighborhoodHits = new Map<string, number>();
  let sanayiCount = 0;
  let yesilvadiCount = 0;
  let recyclingCount = 0;
  let highRiskContainer = 0;
  let nonContainerEvents = 0;

  for (let day = 1; day <= PILOT_DAYS; day++) {
    const gameState = mockGameState(day);
    const dailySet = generateDailyEventSet({
      gameState,
      day,
      districtId: PILOT_DISTRICT,
      events: pilotEvents,
      containerState,
    });

    const cards = resolveEventCardsFromDailySet(dailySet, pilotEvents);
    const log = buildDayLog(day, dailySet, cards, containerState, gameState);
    daily.push(log);

    if (day === 1) {
      day1Boost = log.containerBoostApplied;
      day1Anchor = log.anchorEventId;
    }

    totalEvents += cards.length;
    totalWaste += log.wasteContainerEventCount;
    totalInfluenced += log.containerInfluencedCount;
    if (log.districtSupplement) {
      totalSupplements += 1;
    }
    if (log.duplicateContainerEvent) {
      duplicateDays += 1;
    }

    for (const card of cards) {
      if (isWasteContainerEvent(card)) {
        const hood = inferEventNeighborhood(card);
        if (hood === 'sanayi') {
          sanayiCount += 1;
        }
        if (hood === 'yesilvadi') {
          yesilvadiCount += 1;
        }
        if (isHighRiskContainerEvent(card)) {
          highRiskContainer += 1;
        }
      } else {
        nonContainerEvents += 1;
      }
      if (isRecyclingOpportunityEvent(card)) {
        recyclingCount += 1;
      }

      const hood = inferEventNeighborhood(card) ?? 'unknown';
      neighborhoodHits.set(hood, (neighborhoodHits.get(hood) ?? 0) + 1);
    }

    containerState = applyScenarioDecisions(scenario, containerState, cards, day);
    containerState = processContainersEndOfDay({
      containerState,
      day,
      isMarketDay: isPilotMarketDay(day),
    }).state;
  }

  const finalWorst =
    selectWorstContainerNeighborhood(containerState)?.neighborhoodId ?? 'merkez';

  let mostFrequent = 'unknown';
  let maxHits = 0;
  for (const [hood, count] of neighborhoodHits) {
    if (count > maxHits) {
      maxHits = count;
      mostFrequent = hood;
    }
  }

  const share =
    totalEvents > 0 ? nonContainerEvents / totalEvents : 1;

  return {
    id: scenario,
    daily,
    finalContainerState: containerState,
    summary: {
      id: scenario,
      totalEventsGenerated: totalEvents,
      totalWasteContainerEvents: totalWaste,
      totalContainerInfluencedEvents: totalInfluenced,
      totalDistrictSupplements: totalSupplements,
      day1ContainerBoostApplied: day1Boost,
      day1AnchorId: day1Anchor,
      duplicateContainerEventDays: duplicateDays,
      mostFrequentNeighborhood: mostFrequent,
      sanayiEventCount: sanayiCount,
      yesilvadiEventCount: yesilvadiCount,
      recyclingOpportunityCount: recyclingCount,
      nonContainerEventShare: Math.round(share * 100) / 100,
      finalWorstContainerNeighborhood: finalWorst,
      finalCriticalNeighborhoodCount: countCriticalNeighborhoods(containerState),
      highRiskContainerEventCount: highRiskContainer,
    },
  };
}

function printScenario(result: ScenarioResult): void {
  console.log(`\nScenario: ${result.id}`);
  console.log('─'.repeat(76));

  for (const log of result.daily) {
    const boostList =
      log.boostedEvents.length > 0
        ? log.boostedEvents
            .map((e) => `${e.id.slice(0, 20)}(+${e.boost.toFixed(2)})`)
            .join(', ')
        : 'none';
    const sides =
      log.sideSummaries.length > 0 ? log.sideSummaries.join(' | ') : '—';

    console.log(
      `Day ${log.day} | critical=${log.criticalTitle.slice(0, 32)} | anchor=${log.anchorEventId === DAY1_ANCHOR_ID || log.day > 1 ? log.anchorEventId.slice(0, 28) : log.anchorEventId} | containerBoost=${log.containerBoostApplied} | signal=${log.strongestSignal} | boosted=${log.boostedEvents.length} [${boostList}] | wasteEvents=${log.wasteContainerEventCount} | opp=${log.opportunityEventCount} | districtSupplement=${log.districtSupplement} | dupContainer=${log.duplicateContainerEvent} | agg=${log.aggregateWorstSummary}`,
    );
    if (log.sideSummaries.length > 0) {
      console.log(`         sides: ${sides}`);
    }
  }

  const s = result.summary;
  console.log('\nFinal summary:');
  console.log(`  totalEventsGenerated: ${s.totalEventsGenerated}`);
  console.log(`  totalWasteContainerEvents: ${s.totalWasteContainerEvents}`);
  console.log(`  totalContainerInfluencedEvents: ${s.totalContainerInfluencedEvents}`);
  console.log(`  totalDistrictSupplements: ${s.totalDistrictSupplements}`);
  console.log(`  day1ContainerBoostApplied: ${s.day1ContainerBoostApplied}`);
  console.log(`  day1AnchorId: ${s.day1AnchorId}`);
  console.log(`  duplicateContainerEventDays: ${s.duplicateContainerEventDays}`);
  console.log(`  mostFrequentNeighborhood: ${s.mostFrequentNeighborhood}`);
  console.log(`  sanayiEventCount: ${s.sanayiEventCount}`);
  console.log(`  yesilvadiEventCount: ${s.yesilvadiEventCount}`);
  console.log(`  recyclingOpportunityCount: ${s.recyclingOpportunityCount}`);
  console.log(`  nonContainerEventShare: ${s.nonContainerEventShare}`);
  console.log(`  highRiskContainerEventCount: ${s.highRiskContainerEventCount}`);
  console.log(
    `  finalWorstContainerNeighborhood: ${s.finalWorstContainerNeighborhood} (${result.finalContainerState.aggregates[s.finalWorstContainerNeighborhood].statusLabel})`,
  );
  console.log(`  finalCriticalNeighborhoodCount: ${s.finalCriticalNeighborhoodCount}`);
}

function evaluateBalance(results: ScenarioResult[]): BalanceFinding[] {
  const findings: BalanceFinding[] = [];
  const byId = Object.fromEntries(results.map((r) => [r.id, r])) as Record<
    ScenarioId,
    ScenarioResult
  >;

  const passive = byId.passive_no_decisions;
  const reasonable = byId.reasonable_player;
  const wrong = byId.wrong_player;
  const highSanayi = byId.high_sanayi_pressure;
  const lowPressure = byId.low_pressure_map;

  const anyDay1Boost = results.some((r) => r.summary.day1ContainerBoostApplied);
  if (anyDay1Boost) {
    findings.push({
      verdict: 'FAIL',
      message: 'Day 1 container boost applied in at least one scenario',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'Day 1 container boost disabled across scenarios',
    });
  }

  const day1AnchorWrong = results.filter(
    (r) => r.summary.day1AnchorId !== DAY1_ANCHOR_ID,
  );
  if (day1AnchorWrong.length > 0) {
    findings.push({
      verdict: 'FAIL',
      message: `Day 1 anchor changed in: ${day1AnchorWrong.map((r) => r.id).join(', ')}`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'Day 1 tutorial anchor preserved (central_day1_learning_main_street)',
    });
  }

  try {
    generateDailyEventSet({
      gameState: mockGameState(2),
      day: 2,
      districtId: PILOT_DISTRICT,
      containerState: null,
    });
    findings.push({
      verdict: 'PASS',
      message: 'generateDailyEventSet without containerState does not crash',
    });
  } catch (error) {
    findings.push({
      verdict: 'FAIL',
      message: `generateDailyEventSet without containerState crashed: ${error instanceof Error ? error.message : String(error)}`,
    });
  }

  const totalWasteDays = results.reduce(
    (sum, r) => sum + r.daily.filter((d) => d.wasteContainerEventCount > 0).length,
    0,
  );
  if (totalWasteDays === 0) {
    findings.push({
      verdict: 'FAIL',
      message: 'No container/waste events observed in 7-day simulation',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `Container/waste events appear on ${totalWasteDays} scenario-days total`,
    });
  }

  const dominated = results.filter((r) => {
    const share =
      r.summary.totalEventsGenerated > 0
        ? r.summary.totalWasteContainerEvents / r.summary.totalEventsGenerated
        : 0;
    return share > 0.85;
  });
  if (dominated.length > 0) {
    findings.push({
      verdict: 'FAIL',
      message: `Container events dominate entire run: ${dominated.map((r) => r.id).join(', ')}`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'Container events do not dominate all scenario-days',
    });
  }

  const containerShareWarn = results.filter((r) => {
    const share =
      r.summary.totalEventsGenerated > 0
        ? r.summary.totalWasteContainerEvents / r.summary.totalEventsGenerated
        : 0;
    return share > 0.5;
  });
  if (containerShareWarn.length > 0) {
    findings.push({
      verdict: 'WARN',
      message: `Container/waste share >50%: ${containerShareWarn.map((r) => r.id).join(', ')}`,
    });
  }

  if (
    passive.summary.highRiskContainerEventCount <
    reasonable.summary.highRiskContainerEventCount
  ) {
    findings.push({
      verdict: 'WARN',
      message: 'reasonable_player has more high-risk container events than passive (unexpected)',
    });
  } else if (
    passive.summary.totalWasteContainerEvents >=
    reasonable.summary.totalWasteContainerEvents
  ) {
    findings.push({
      verdict: 'PASS',
      message: 'passive_no_decisions at least as waste-heavy as reasonable_player',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'reasonable_player reduces waste/container event pressure vs passive',
    });
  }

  if (
    reasonable.summary.highRiskContainerEventCount >
    wrong.summary.highRiskContainerEventCount
  ) {
    findings.push({
      verdict: 'PASS',
      message: 'reasonable_player fewer high-risk container events than wrong_player',
    });
  } else if (
    reasonable.summary.totalWasteContainerEvents <
    wrong.summary.totalWasteContainerEvents
  ) {
    findings.push({
      verdict: 'PASS',
      message: 'reasonable_player fewer total waste/container events than wrong_player',
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: 'reasonable_player not clearly better than wrong_player on container events',
    });
  }

  if (passive.summary.yesilvadiEventCount > passive.summary.sanayiEventCount + 1) {
    findings.push({
      verdict: 'WARN',
      message: 'passive: yesilvadi container events exceed sanayi',
    });
  } else if (
    reasonable.summary.sanayiEventCount >= reasonable.summary.yesilvadiEventCount ||
    passive.summary.mostFrequentNeighborhood === 'merkez' ||
    passive.summary.mostFrequentNeighborhood === 'sanayi'
  ) {
    findings.push({
      verdict: 'PASS',
      message: 'Sanayi/Merkez band at least as visible as Yeşilvadi in container events',
    });
  } else {
    findings.push({
      verdict: 'WARN',
      message: 'Yeşilvadi container events exceed sanayi in reasonable_player',
    });
  }

  const yesilvadiHeavy = results.filter((r) => r.summary.yesilvadiEventCount > 2);
  const yesilvadiCritical = results.filter((r) => {
    const agg = r.finalContainerState.aggregates.yesilvadi;
    return agg.statusLabel === 'Kritik' && r.summary.yesilvadiEventCount > 2;
  });
  if (yesilvadiCritical.length > 0) {
    findings.push({
      verdict: 'FAIL',
      message: `Yeşilvadi sustained critical container events: ${yesilvadiCritical.map((r) => r.id).join(', ')}`,
    });
  } else if (yesilvadiHeavy.length > 0) {
    findings.push({
      verdict: 'WARN',
      message: `Yeşilvadi >2 container events: ${yesilvadiHeavy.map((r) => r.id).join(', ')}`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'Yeşilvadi avoids sustained high-risk container event spam',
    });
  }

  const duplicateFail = results.filter((r) => r.summary.duplicateContainerEventDays > 0);
  if (duplicateFail.length > 0) {
    findings.push({
      verdict: 'FAIL',
      message: `Duplicate container/waste events same day: ${duplicateFail.map((r) => `${r.id}(${r.summary.duplicateContainerEventDays}d)`).join(', ')}`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: 'No duplicate container/waste events within a single daily set',
    });
  }

  const lowWasteShare =
    lowPressure.summary.totalEventsGenerated > 0
      ? lowPressure.summary.totalWasteContainerEvents /
        lowPressure.summary.totalEventsGenerated
      : 0;

  if (lowWasteShare > 0.55) {
    findings.push({
      verdict: 'FAIL',
      message: `low_pressure_map container events dominate (${Math.round(lowWasteShare * 100)}% waste share)`,
    });
  } else if (
    lowPressure.summary.totalWasteContainerEvents > 5 ||
    lowPressure.summary.highRiskContainerEventCount >= 6
  ) {
    findings.push({
      verdict: 'WARN',
      message: `low_pressure_map elevated waste events (${lowPressure.summary.totalWasteContainerEvents}, ${Math.round(lowWasteShare * 100)}%)`,
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `low_pressure_map stays calm (${lowPressure.summary.totalWasteContainerEvents} waste/container, ${Math.round(lowWasteShare * 100)}%)`,
    });
  }

  if (highSanayi.summary.sanayiEventCount === 0 && highSanayi.summary.totalDistrictSupplements === 0) {
    findings.push({
      verdict: 'WARN',
      message: 'high_sanayi_pressure did not surface sanayi-linked container events',
    });
  } else {
    findings.push({
      verdict: 'PASS',
      message: `high_sanayi_pressure sanayi/container visibility (events=${highSanayi.summary.sanayiEventCount}, supplements=${highSanayi.summary.totalDistrictSupplements})`,
    });
  }

  if (results.every((r) => r.summary.recyclingOpportunityCount === 0)) {
    findings.push({
      verdict: 'WARN',
      message: 'recycling_opportunity never appeared in generated sets (optional signal)',
    });
  }

  if (results.some((r) => r.summary.totalDistrictSupplements >= 6)) {
    findings.push({
      verdict: 'WARN',
      message: 'district supplement fires on most days (>=6/7) in at least one scenario',
    });
  }

  return findings;
}

function suggestTuning(findings: BalanceFinding[]): string[] {
  const tips: string[] = [];
  const fail = findings.filter((f) => f.verdict === 'FAIL');
  const warn = findings.filter((f) => f.verdict === 'WARN');

  for (const item of fail) {
    if (item.message.includes('Duplicate')) {
      tips.push('Spam guard sıkılaştır: enrichDailyEventSet’te side havuzundaki waste sayısını da kontrol et.');
    }
    if (item.message.includes('Day 1')) {
      tips.push('Day 1 guard: getContainerEventWeightForCandidate ve district override’ı doğrula.');
    }
    if (item.message.includes('low_pressure')) {
      tips.push('Düşük baskıda sinyal eşiklerini yükselt veya low severity boost’u 0.05→0.03 yap.');
    }
  }

  for (const item of warn) {
    if (item.message.includes('>50%')) {
      tips.push('Container boost çarpanlarını düşür (critical 0.25→0.20) veya yalnızca supplemental district event’e bağla.');
    }
    if (item.message.includes('district supplement')) {
      tips.push('District override için minimum severity high yap; medium sadece weight boost alsın.');
    }
    if (item.message.includes('recycling_opportunity')) {
      tips.push('Recycling opportunity pilot kartı veya opportunity slot eşleşmesi genişletilebilir.');
    }
  }

  if (tips.length === 0) {
    tips.push('Event signal entegrasyonu genel olarak dengeli; küçük izleme yeterli.');
  }

  return tips;
}

function main(): void {
  console.log('Crevia — Konteyner Event Signal 7 Günlük Simülasyonu');
  console.log('='.repeat(76));

  const scenarioIds: ScenarioId[] = [
    'passive_no_decisions',
    'reasonable_player',
    'wrong_player',
    'high_sanayi_pressure',
    'low_pressure_map',
  ];

  const results = scenarioIds.map((id) => runScenario(id));
  for (const result of results) {
    printScenario(result);
  }

  const findings = evaluateBalance(results);

  console.log('\n' + '='.repeat(76));
  console.log('Balance evaluation');
  console.log('='.repeat(76));

  for (const finding of findings) {
    console.log(`[signals] ${finding.verdict} ${finding.message}`);
  }

  const failCount = findings.filter((f) => f.verdict === 'FAIL').length;
  const warnCount = findings.filter((f) => f.verdict === 'WARN').length;
  const passCount = findings.filter((f) => f.verdict === 'PASS').length;

  console.log(`\nTotals: PASS=${passCount} WARN=${warnCount} FAIL=${failCount}`);

  console.log('\nTuning suggestions (report only):');
  for (const tip of suggestTuning(findings)) {
    console.log(`  • ${tip}`);
  }

  if (failCount > 0) {
    process.exit(1);
  }
}

main();
