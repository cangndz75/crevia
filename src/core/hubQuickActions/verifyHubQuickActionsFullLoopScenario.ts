import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { selectPersonnelImpactPreviewForDecision } from '@/core/personnel/personnelPresentation';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { selectVehicleImpactPreviewForDecision } from '@/core/vehicles/vehiclePresentation';

import { HUB_QUICK_ACTION_IDS, HUB_QUICK_ACTION_MAX_RECORDS } from './hubQuickActionConstants';
import { processHubQuickActionForStore } from './hubQuickActionIntegration';
import {
  createInitialHubQuickActionState,
  normalizePersistedHubQuickActionState,
} from './hubQuickActionSeed';
import { selectHubQuickActionCards } from './hubQuickActionSelectors';
import type { FieldDutyPlanContext } from './hubQuickActionFieldDutyPlan';
import type { NeighborhoodPatrolPlanContext } from './hubQuickActionNeighborhoodPatrolPlan';
import type { RoutePreparationPlanContext } from './hubQuickActionRoutePlan';
import type { SocialResponsePlanContext } from './hubQuickActionSocialResponsePlan';

type Severity = 'PASS' | 'FAIL';
type Check = { name: string; severity: Severity; detail: string };

const SAMPLE_NEIGHBORHOODS: Neighborhood[] = [
  {
    id: 'merkez',
    name: 'Merkez',
    cleanliness: 55,
    trust: 60,
    longTermNeglect: 18,
  },
  {
    id: 'sanayi',
    name: 'Sanayi',
    cleanliness: 42,
    trust: 48,
    longTermNeglect: 32,
  },
];

function record(checks: Check[], severity: Severity, name: string, detail: string): void {
  checks.push({ name, severity, detail });
}

function assert(checks: Check[], name: string, ok: boolean, detail: string): void {
  record(checks, ok ? 'PASS' : 'FAIL', name, detail);
}

function sampleWasteEvent(): EventCard {
  return {
    id: 'evt-loop-waste',
    title: 'Konteyner taşması',
    description: 'Merkez atık toplama gecikti',
    category: 'operations',
    contextTag: 'waste',
    district: 'Merkez',
    neighborhoodId: 'merkez',
    riskLevel: 'high',
    urgencyHours: 6,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [
      {
        id: 'dec-waste',
        title: 'Acil toplama',
        description: 'Çöp ve atık toplama ekibi yönlendir',
        style: 'bold',
        effects: { publicSatisfaction: 1, budget: 0, morale: 0, risk: 0, xp: 0 },
      },
    ],
  };
}

function buildFieldDutyContext(): FieldDutyPlanContext {
  return {
    personnelState: createInitialPersonnelState(),
    activeEvents: [sampleWasteEvent()],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    containerState: createInitialContainerState(2),
    socialPulseState: createInitialSocialPulseState(2),
  };
}

function buildRouteContext(): RoutePreparationPlanContext {
  return {
    activeEvents: [sampleWasteEvent()],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    vehicleState: createInitialVehicleState(2),
    containerState: createInitialContainerState(2),
  };
}

function buildPatrolContext(): NeighborhoodPatrolPlanContext {
  return {
    activeEvents: [sampleWasteEvent()],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    containerState: createInitialContainerState(2),
    socialPulseState: createInitialSocialPulseState(2),
    vehicleState: createInitialVehicleState(2),
  };
}

function buildSocialContext(socialPulseState = createInitialSocialPulseState(2)) {
  return {
    activeEvents: [],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    socialPulseState,
  } satisfies SocialResponsePlanContext;
}

export function verifyHubQuickActionsFullLoopScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1Cards = selectHubQuickActionCards({
    hubQuickActionState: createInitialHubQuickActionState(1),
    currentDay: 1,
    day1Disabled: true,
  });
  assert(
    checks,
    'full-loop Day 1 disabled',
    day1Cards.every((c) => c.status === 'disabled'),
    day1Cards.map((c) => c.statusLabel).join(','),
  );

  let hub = createInitialHubQuickActionState(2);
  const containerBefore = createInitialContainerState(2);
  const vehicleBefore = createInitialVehicleState(2);
  const personnelBefore = createInitialPersonnelState();
  let socialState = createInitialSocialPulseState(2);
  const socialBeforeJson = JSON.stringify(socialState);

  const fieldOut = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state: hub,
    fieldDutyContext: buildFieldDutyContext(),
  });
  hub = fieldOut.state;

  const routeOut = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 2,
    state: hub,
    routePreparationContext: buildRouteContext(),
  });
  hub = routeOut.state;

  const patrolOut = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 2,
    state: hub,
    neighborhoodPatrolContext: buildPatrolContext(),
  });
  hub = patrolOut.state;

  const socialOut = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 2,
    state: hub,
    socialResponseContext: buildSocialContext(socialState),
  });
  hub = socialOut.state;
  if (socialOut.socialPulseState) {
    socialState = socialOut.socialPulseState;
  }

  assert(
    checks,
    'full-loop 4 aksiyon usedActionIds',
    hub.usedActionIds.length === 4 &&
      HUB_QUICK_ACTION_IDS.every((id) => hub.usedActionIds.includes(id)),
    hub.usedActionIds.join(','),
  );
  assert(
    checks,
    'full-loop assignment kayıtları',
    hub.fieldDuty?.day === 2 &&
      hub.routePreparation?.day === 2 &&
      hub.neighborhoodPatrol?.day === 2 &&
      hub.socialResponse?.day === 2,
    'assignments',
  );
  assert(
    checks,
    'full-loop records max',
    hub.records.length <= HUB_QUICK_ACTION_MAX_RECORDS,
    `records=${hub.records.length}`,
  );
  assert(
    checks,
    'full-loop socialPulseState yalnızca social_response',
    JSON.stringify(socialBeforeJson) !== JSON.stringify(socialState) &&
      JSON.stringify(containerBefore) === JSON.stringify(createInitialContainerState(2)) &&
      JSON.stringify(vehicleBefore) === JSON.stringify(createInitialVehicleState(2)) &&
      JSON.stringify(personnelBefore) === JSON.stringify(createInitialPersonnelState()),
    'isolation',
  );

  const report = buildDailyReport({
    day: 2,
    metrics: {
      publicSatisfaction: 55,
      budget: 100_000,
      staffMorale: 60,
    },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
    hubQuickActionState: hub,
  });
  assert(
    checks,
    'full-loop report quickActionSummaryLines',
    (report.quickActionSummaryLines?.length ?? 0) > 0 &&
      report.quickActionSummaryLines!.length <= 2,
    report.quickActionSummaryLines?.join(' | ') ?? 'none',
  );

  const dup = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state: hub,
  });
  assert(
    checks,
    'full-loop duplicate guard',
    !dup.stateChanged && dup.result.tone === 'warning',
    dup.result.resultLine,
  );

  const nextDayHub = normalizePersistedHubQuickActionState(hub, 3);
  assert(
    checks,
    'full-loop yeni gün reset',
    nextDayHub.day === 3 &&
      nextDayHub.usedActionIds.length === 0 &&
      nextDayHub.fieldDuty === undefined &&
      nextDayHub.socialResponse === undefined,
    `day=${nextDayHub.day}`,
  );

  const broken = normalizePersistedHubQuickActionState(
    {
      day: 2,
      usedActionIds: ['field_duty'],
      records: [],
      sequence: 0,
      fieldDuty: { day: 2, teamId: 'x', targetCompetency: 'bad', label: 'a', effectLabel: 'b', targetNeighborhoodId: 'merkez' },
      routePreparation: { day: 2, routeFocus: 'bad', source: 'fallback', label: 'a', effectLabel: 'b', targetNeighborhoodLabel: 'Merkez' },
    },
    2,
  );
  assert(
    checks,
    'full-loop normalize bozuk nested',
    broken.fieldDuty === undefined && broken.routePreparation === undefined,
    'cleared',
  );

  const wasteEvent = sampleWasteEvent();
  const decision = wasteEvent.decisions[0]!;
  const personnelPreview = selectPersonnelImpactPreviewForDecision(
    wasteEvent,
    decision,
    createInitialPersonnelState(),
    2,
    { fieldDuty: hub.fieldDuty, neighborhoodPatrol: hub.neighborhoodPatrol },
  );
  const vehiclePreview = selectVehicleImpactPreviewForDecision({
    vehicleState: createInitialVehicleState(2),
    event: wasteEvent,
    decision,
    day: 2,
    routePreparation: hub.routePreparation,
  });
  assert(
    checks,
    'full-loop preview merkez eşleşmesi',
    personnelPreview.fieldDutyLine != null &&
      vehiclePreview.routePreparationLine != null &&
      personnelPreview.neighborhoodPatrolLine != null,
    'lines',
  );
  const otherPreview = selectPersonnelImpactPreviewForDecision(
    { ...wasteEvent, neighborhoodId: 'sanayi', district: 'Sanayi' },
    decision,
    createInitialPersonnelState(),
    2,
    { fieldDuty: hub.fieldDuty, neighborhoodPatrol: hub.neighborhoodPatrol },
  );
  assert(
    checks,
    'full-loop preview farklı mahalle yok',
    otherPreview.neighborhoodPatrolLine == null,
    otherPreview.neighborhoodPatrolLine ?? 'none',
  );

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map(
      (c) => `${c.severity === 'PASS' ? 'OK' : 'FAIL'} ${c.name}: ${c.detail}`,
    ),
  };
}
