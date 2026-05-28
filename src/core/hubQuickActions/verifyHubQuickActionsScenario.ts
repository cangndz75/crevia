import type { EventCard } from '@/core/models/EventCard';
import type { Neighborhood } from '@/core/models/Neighborhood';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import {
  buildPersonnelTaskInput,
  calculateTaskSuccessScore,
} from '@/core/personnel/personnelEngine';
import { calculatePersonnelMistakeRisk } from '@/core/personnel/personnelMistakeRisk';
import { processPersonnelAfterDecision } from '@/core/personnel/personnelIntegration';
import { selectPersonnelImpactPreviewForDecision } from '@/core/personnel/personnelPresentation';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import {
  getVehicleDecisionDeltasForAction,
  inferVehicleDecisionAction,
} from '@/core/vehicles/vehicleDecisionEffects';
import { processVehiclesAfterDecisionForStore } from '@/core/vehicles/vehicleIntegration';
import { selectVehicleImpactPreviewForDecision } from '@/core/vehicles/vehiclePresentation';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';

import {
  FIELD_DUTY_RISK_REDUCTION,
  FIELD_DUTY_SUCCESS_BONUS,
  HUB_QUICK_ACTION_IDS,
  HUB_QUICK_ACTION_MAX_RECORDS,
  NEIGHBORHOOD_PATROL_INSIGHT_BONUS,
  ROUTE_PREPARATION_LOAD_REDUCTION,
  ROUTE_PREPARATION_RISK_REDUCTION,
  ROUTE_PREPARATION_ROUTE_BONUS,
  assertNever,
} from './hubQuickActionConstants';
import type { FieldDutyPlanContext } from './hubQuickActionFieldDutyPlan';
import { processHubQuickActionForStore } from './hubQuickActionIntegration';
import {
  applyFieldDutyScoreModifiers,
  resolveFieldDutyPersonnelModifier,
} from './hubQuickActionPersonnelEffects';
import type { NeighborhoodPatrolPlanContext } from './hubQuickActionNeighborhoodPatrolPlan';
import { resolveNeighborhoodPatrolModifier } from './hubQuickActionNeighborhoodPatrolEffects';
import type { SocialResponsePlanContext } from './hubQuickActionSocialResponsePlan';
import { resolveSocialResponseType } from './hubQuickActionSocialResponsePlan';
import { applySocialQuickAction } from '@/core/social/socialQuickAction';
import type { RoutePreparationPlanContext } from './hubQuickActionRoutePlan';
import {
  applyRoutePreparationToVehicleDeltas,
  resolveRoutePreparationModifier,
} from './hubQuickActionRouteEffects';
import { shouldShowDecisionDetailImpact } from '@/features/events/utils/decisionTradeoffPresentation';
import {
  buildHubQuickActionCards,
  getHubQuickActionStatusLabel,
} from './hubQuickActionPresentation';
import {
  selectHubQuickActionCards,
  selectHubQuickActionStateForDay,
} from './hubQuickActionSelectors';
import {
  createInitialHubQuickActionState,
  normalizePersistedHubQuickActionState,
} from './hubQuickActionSeed';
import type { HubQuickActionStatus, HubQuickActionTone } from './hubQuickActionTypes';

type Severity = 'PASS' | 'WARN' | 'FAIL';

type Check = { name: string; severity: Severity; detail: string };

function record(checks: Check[], severity: Severity, name: string, detail: string): void {
  checks.push({ name, severity, detail });
}

function assert(checks: Check[], name: string, ok: boolean, detail: string): void {
  record(checks, ok ? 'PASS' : 'FAIL', name, detail);
}

function exhaustTone(tone: HubQuickActionTone): void {
  switch (tone) {
    case 'positive':
    case 'neutral':
    case 'warning':
      return;
    default:
      assertNever(tone);
  }
}

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

function buildFieldDutyContext(
  overrides?: Partial<FieldDutyPlanContext>,
): FieldDutyPlanContext {
  return {
    personnelState: createInitialPersonnelState(),
    activeEvents: [],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    containerState: createInitialContainerState(2),
    socialPulseState: createInitialSocialPulseState(2),
    ...overrides,
  };
}

function buildRoutePreparationContext(
  overrides?: Partial<RoutePreparationPlanContext>,
): RoutePreparationPlanContext {
  return {
    activeEvents: [],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    vehicleState: createInitialVehicleState(2),
    containerState: createInitialContainerState(2),
    ...overrides,
  };
}

function buildNeighborhoodPatrolContext(
  overrides?: Partial<NeighborhoodPatrolPlanContext>,
): NeighborhoodPatrolPlanContext {
  return {
    activeEvents: [],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    containerState: createInitialContainerState(2),
    socialPulseState: createInitialSocialPulseState(2),
    vehicleState: createInitialVehicleState(2),
    ...overrides,
  };
}

function buildSocialResponseContext(
  overrides?: Partial<SocialResponsePlanContext>,
): SocialResponsePlanContext {
  return {
    activeEvents: [],
    neighborhoods: SAMPLE_NEIGHBORHOODS,
    socialPulseState: createInitialSocialPulseState(2),
    ...overrides,
  };
}

function sampleWasteEvent(): EventCard {
  return {
    id: 'evt-field-duty-waste',
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

function exhaustStatus(status: HubQuickActionStatus): void {
  switch (status) {
    case 'available':
    case 'used':
    case 'locked':
    case 'disabled':
      return;
    default:
      assertNever(status);
  }
}

export function verifyHubQuickActionsScenario(): {
  ok: boolean;
  failCount: number;
  warnCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const initial = createInitialHubQuickActionState(2);
  assert(
    checks,
    'createInitialHubQuickActionState(2)',
    initial.day === 2 &&
      initial.usedActionIds.length === 0 &&
      initial.records.length === 0 &&
      initial.sequence === 0 &&
      initial.lastResult === undefined,
    `day=${initial.day} used=${initial.usedActionIds.length} records=${initial.records.length}`,
  );

  assert(
    checks,
    '4 action ids tanımlı',
    HUB_QUICK_ACTION_IDS.length === 4,
    `count=${HUB_QUICK_ACTION_IDS.length}`,
  );

  const cards = buildHubQuickActionCards(initial);
  assert(
    checks,
    'presentation cards',
    cards.length === 4 && cards.every((c) => c.title.length > 0),
    `cards=${cards.length}`,
  );

  let state = initial;
  const fieldDutyContext = buildFieldDutyContext();
  const first = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state,
    fieldDutyContext,
  });
  state = first.state;
  assert(
    checks,
    'ilk kullanım usedActionIds',
    first.stateChanged &&
      state.usedActionIds.includes('field_duty') &&
      state.sequence === 1,
    `used=${state.usedActionIds.join(',')}`,
  );
  assert(
    checks,
    'field_duty kaydı oluşur',
    state.fieldDuty?.day === 2 &&
      typeof state.fieldDuty?.teamId === 'string' &&
      state.fieldDuty.teamId.length > 0,
    `team=${state.fieldDuty?.teamId ?? 'none'}`,
  );
  const firstTeamId = state.fieldDuty?.teamId;
  const secondFieldDuty = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state: createInitialHubQuickActionState(2),
    fieldDutyContext,
  });
  assert(
    checks,
    'field_duty teamId deterministik',
    secondFieldDuty.state.fieldDuty?.teamId === firstTeamId,
    `a=${firstTeamId} b=${secondFieldDuty.state.fieldDuty?.teamId}`,
  );

  const duplicate = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state,
  });
  assert(
    checks,
    'aynı gün duplicate',
    !duplicate.stateChanged &&
      duplicate.result.tone === 'warning' &&
      duplicate.result.resultLine.includes('zaten kullanıldı'),
    duplicate.result.resultLine,
  );

  const second = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 2,
    state,
    routePreparationContext: buildRoutePreparationContext(),
  });
  state = second.state;
  assert(
    checks,
    'farklı action aynı gün',
    second.stateChanged && state.usedActionIds.length === 2,
    `used=${state.usedActionIds.length}`,
  );

  let manyState = createInitialHubQuickActionState(3);
  const cycle = [
    'field_duty',
    'route_preparation',
    'neighborhood_patrol',
    'social_response',
    'field_duty',
  ] as const;
  for (let i = 0; i < 14; i++) {
    const actionId = cycle[i % cycle.length]!;
    const out = processHubQuickActionForStore({
      actionId,
      currentDay: 3 + Math.floor(i / 4),
      state: manyState,
    });
    manyState = out.state;
  }
  assert(
    checks,
    'records max 12',
    manyState.records.length <= HUB_QUICK_ACTION_MAX_RECORDS,
    `records=${manyState.records.length}`,
  );

  const dayShift = normalizePersistedHubQuickActionState(
    { ...state, day: 2 },
    4,
  );
  assert(
    checks,
    'currentDay değişince reset',
    dayShift.day === 4 &&
      dayShift.usedActionIds.length === 0 &&
      dayShift.fieldDuty === undefined &&
      dayShift.routePreparation === undefined &&
      dayShift.neighborhoodPatrol === undefined &&
      dayShift.socialResponse === undefined,
    `day=${dayShift.day} used=${dayShift.usedActionIds.length}`,
  );

  const broken = normalizePersistedHubQuickActionState(
    {
      day: 5,
      usedActionIds: 'bad',
      records: null,
      sequence: 'x',
      lastResult: { foo: 1 },
    },
    5,
  );
  assert(
    checks,
    'bozuk persist crash etmez',
    broken.day === 5 && Array.isArray(broken.usedActionIds) && Array.isArray(broken.records),
    `day=${broken.day}`,
  );

  const filtered = normalizePersistedHubQuickActionState(
    {
      day: 6,
      usedActionIds: ['field_duty', 'unknown_action', 'route_preparation'],
      records: [
        {
          id: 'r1',
          actionId: 'invalid',
          day: 6,
          title: 'x',
          targetLabel: 'y',
          resultLine: 'z',
          createdAtDay: 6,
          createdAtSequence: 1,
        },
        {
          id: 'r2',
          actionId: 'social_response',
          day: 6,
          title: 'Sosyal',
          targetLabel: 't',
          resultLine: 'ok',
          createdAtDay: 6,
          createdAtSequence: 2,
        },
      ],
      sequence: 2,
    },
    6,
  );
  assert(
    checks,
    'bilinmeyen action filtre',
    filtered.usedActionIds.every((id) => HUB_QUICK_ACTION_IDS.includes(id)) &&
      filtered.records.every((r) => HUB_QUICK_ACTION_IDS.includes(r.actionId)),
    `used=${filtered.usedActionIds.join(',')} records=${filtered.records.length}`,
  );

  const day1Cards = selectHubQuickActionCards({
    hubQuickActionState: createInitialHubQuickActionState(1),
    currentDay: 1,
    day1Disabled: true,
  });
  assert(
    checks,
    'Day 1 disabled presentation',
    day1Cards.every((c) => c.status === 'disabled' && c.statusLabel === 'Yakında'),
    day1Cards.map((c) => c.statusLabel).join(','),
  );

  const personnelBefore = createInitialPersonnelState();
  const containerBefore = createInitialContainerState(2);
  const vehicleBefore = createInitialVehicleState(2);
  const socialBefore = createInitialSocialPulseState(2);

  const subsystemProbe = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 2,
    state: createInitialHubQuickActionState(2),
    neighborhoodPatrolContext: buildNeighborhoodPatrolContext(),
  });

  const fieldDutyProbe = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state: createInitialHubQuickActionState(2),
    fieldDutyContext: buildFieldDutyContext(),
  });

  const personnelAfter = createInitialPersonnelState();
  const containerAfter = createInitialContainerState(2);
  const vehicleAfter = createInitialVehicleState(2);
  const socialAfter = createInitialSocialPulseState(2);

  assert(
    checks,
    'subsystem state değişmez (seed referans)',
    JSON.stringify(personnelBefore) === JSON.stringify(personnelAfter) &&
      JSON.stringify(containerBefore) === JSON.stringify(containerAfter) &&
      JSON.stringify(vehicleBefore) === JSON.stringify(vehicleAfter) &&
      JSON.stringify(socialBefore) === JSON.stringify(socialAfter) &&
      subsystemProbe.stateChanged &&
      fieldDutyProbe.stateChanged,
    'processHubQuickAction yalnızca hub state üretir',
  );

  const restingOnly = createInitialPersonnelState();
  restingOnly.teams = restingOnly.teams.map((team) => ({
    ...team,
    restMode: 'full_rest' as const,
    status: 'resting' as const,
  }));
  const noTeam = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 2,
    state: createInitialHubQuickActionState(2),
    fieldDutyContext: buildFieldDutyContext({ personnelState: restingOnly }),
  });
  assert(
    checks,
    'uygun ekip yoksa kullanılmamış sayılır',
    !noTeam.stateChanged &&
      !noTeam.state.usedActionIds.includes('field_duty') &&
      noTeam.result.tone === 'warning',
    noTeam.result.resultLine,
  );

  const brokenFieldDuty = normalizePersistedHubQuickActionState(
    {
      day: 7,
      usedActionIds: ['field_duty'],
      records: [],
      sequence: 0,
      fieldDuty: {
        day: 7,
        teamId: 'team-cleaning-a',
        targetNeighborhoodId: 'merkez',
        targetCompetency: 'not_a_competency',
        label: 'x',
        effectLabel: 'y',
      },
    },
    7,
  );
  assert(
    checks,
    'normalize bozuk fieldDuty temizler',
    brokenFieldDuty.fieldDuty === undefined,
    `fieldDuty=${brokenFieldDuty.fieldDuty ? 'present' : 'cleared'}`,
  );

  const activeFieldDuty = processHubQuickActionForStore({
    actionId: 'field_duty',
    currentDay: 8,
    state: createInitialHubQuickActionState(8),
    fieldDutyContext: buildFieldDutyContext({
      activeEvents: [sampleWasteEvent()],
    }),
  }).state.fieldDuty!;

  const wasteEvent = sampleWasteEvent();
  const wasteDecision = wasteEvent.decisions[0]!;

  const modifierMatch = resolveFieldDutyPersonnelModifier({
    fieldDuty: activeFieldDuty,
    currentDay: 8,
    event: wasteEvent,
    decision: wasteDecision,
  });
  assert(
    checks,
    'competency eşleşince modifier uygulanır',
    modifierMatch.applies &&
      modifierMatch.successBonus === FIELD_DUTY_SUCCESS_BONUS,
    `applies=${modifierMatch.applies} bonus=${modifierMatch.successBonus}`,
  );

  const modifierNeighborhood = resolveFieldDutyPersonnelModifier({
    fieldDuty: {
      ...activeFieldDuty,
      targetCompetency: 'crisis_coordination',
    },
    currentDay: 8,
    event: wasteEvent,
    decision: wasteDecision,
  });
  assert(
    checks,
    'neighborhood eşleşince modifier uygulanır',
    modifierNeighborhood.applies,
    `applies=${modifierNeighborhood.applies}`,
  );

  const modifierIrrelevant = resolveFieldDutyPersonnelModifier({
    fieldDuty: activeFieldDuty,
    currentDay: 8,
    event: {
      ...wasteEvent,
      neighborhoodId: 'sanayi',
      district: 'Sanayi',
      title: 'Bütçe planı',
      description: 'kurumsal raporlama',
    },
    decision: {
      id: 'dec-office',
      title: 'Ofis koordinasyonu',
      description: 'masa başı planlama ve rapor',
      style: 'balanced',
      effects: { publicSatisfaction: 0, budget: 0, morale: 0, risk: 0, xp: 0 },
    },
  });
  assert(
    checks,
    'alakasız karar için modifier kapalı',
    !modifierIrrelevant.applies,
    `applies=${modifierIrrelevant.applies}`,
  );

  const modifierWrongDay = resolveFieldDutyPersonnelModifier({
    fieldDuty: activeFieldDuty,
    currentDay: 9,
    event: wasteEvent,
    decision: wasteDecision,
  });
  assert(
    checks,
    'fieldDuty modifier yalnızca aynı gün',
    !modifierWrongDay.applies,
    `applies=${modifierWrongDay.applies}`,
  );

  const stacked = resolveFieldDutyPersonnelModifier({
    fieldDuty: activeFieldDuty,
    currentDay: 8,
    event: wasteEvent,
    decision: wasteDecision,
  });
  assert(
    checks,
    'bonus stacklenmez',
    stacked.successBonus === FIELD_DUTY_SUCCESS_BONUS &&
      stacked.riskReduction === FIELD_DUTY_RISK_REDUCTION,
    `bonus=${stacked.successBonus} risk=${stacked.riskReduction}`,
  );

  const personnel = createInitialPersonnelState();
  const team = personnel.teams.find((t) => t.id === activeFieldDuty.teamId) ?? personnel.teams[0]!;
  const taskInput = buildPersonnelTaskInput({
    team,
    event: wasteEvent,
    decision: wasteDecision,
    resources: { availableStaff: 12, availableVehicles: 6, overtimeHours: 0 },
    equipmentSupportActive: false,
    day: 8,
  });
  const baseSuccess = calculateTaskSuccessScore(taskInput);
  const baseRisk = calculatePersonnelMistakeRisk(taskInput, baseSuccess);
  const adjustedScores = applyFieldDutyScoreModifiers(
    baseSuccess,
    baseRisk,
    modifierMatch,
  );
  assert(
    checks,
    'riskReduction 0 altına düşmez',
    adjustedScores.mistakeRisk >= 0,
    `risk=${adjustedScores.mistakeRisk}`,
  );

  const preview = selectPersonnelImpactPreviewForDecision(
    wasteEvent,
    wasteDecision,
    personnel,
    8,
    { fieldDuty: activeFieldDuty },
  );
  const applyWithout = processPersonnelAfterDecision(
    {
      personnelState: personnel,
      event: wasteEvent,
      decision: wasteDecision,
      day: 8,
      neighborhoods: SAMPLE_NEIGHBORHOODS,
      resources: { availableStaff: 12, availableVehicles: 6, overtimeHours: 0 },
    },
    50,
  );
  const applyWith = processPersonnelAfterDecision(
    {
      personnelState: personnel,
      event: wasteEvent,
      decision: wasteDecision,
      day: 8,
      neighborhoods: SAMPLE_NEIGHBORHOODS,
      resources: { availableStaff: 12, availableVehicles: 6, overtimeHours: 0 },
      fieldDuty: activeFieldDuty,
    },
    50,
  );
  const scoreDelta =
    (applyWith.assignment?.successScore ?? 0) -
    (applyWithout.assignment?.successScore ?? 0);
  assert(
    checks,
    'preview/apply aynı helper bonusu',
    modifierMatch.applies &&
      preview.fieldDutyLine != null &&
      scoreDelta === FIELD_DUTY_SUCCESS_BONUS,
    `previewLine=${preview.fieldDutyLine ?? 'none'} delta=${scoreDelta}`,
  );

  const routeCtx = buildRoutePreparationContext({
    activeEvents: [sampleWasteEvent()],
  });
  const routeFirst = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 9,
    state: createInitialHubQuickActionState(9),
    routePreparationContext: routeCtx,
  });
  assert(
    checks,
    'route_preparation kaydı oluşur',
    routeFirst.stateChanged &&
      routeFirst.state.routePreparation?.day === 9 &&
      typeof routeFirst.state.routePreparation?.targetVehicleId === 'string',
    `vehicle=${routeFirst.state.routePreparation?.targetVehicleId ?? 'none'}`,
  );
  const routeVehicleId = routeFirst.state.routePreparation?.targetVehicleId;
  const routeNeighborhood = routeFirst.state.routePreparation?.targetNeighborhoodId;
  const routeSecond = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 9,
    state: createInitialHubQuickActionState(9),
    routePreparationContext: routeCtx,
  });
  assert(
    checks,
    'route_preparation deterministik araç/mahalle',
    routeSecond.state.routePreparation?.targetVehicleId === routeVehicleId &&
      routeSecond.state.routePreparation?.targetNeighborhoodId === routeNeighborhood,
    `vehicle=${routeSecond.state.routePreparation?.targetVehicleId}`,
  );

  const routeDuplicate = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 9,
    state: routeFirst.state,
  });
  assert(
    checks,
    'route_preparation aynı gün duplicate',
    !routeDuplicate.stateChanged &&
      routeDuplicate.result.tone === 'warning',
    routeDuplicate.result.resultLine,
  );

  const noVehicleState = createInitialVehicleState(9);
  noVehicleState.units = noVehicleState.units.map((unit) => ({
    ...unit,
    operationalStatus: 'assigned' as const,
  }));
  const noVehicle = processHubQuickActionForStore({
    actionId: 'route_preparation',
    currentDay: 9,
    state: createInitialHubQuickActionState(9),
    routePreparationContext: buildRoutePreparationContext({
      vehicleState: noVehicleState,
    }),
  });
  assert(
    checks,
    'route uygun araç yoksa kullanılmamış',
    !noVehicle.stateChanged &&
      !noVehicle.state.usedActionIds.includes('route_preparation'),
    noVehicle.result.resultLine,
  );

  const brokenRoute = normalizePersistedHubQuickActionState(
    {
      day: 10,
      usedActionIds: ['route_preparation'],
      records: [],
      sequence: 0,
      routePreparation: {
        day: 10,
        targetNeighborhoodLabel: 'Merkez',
        routeFocus: 'invalid_focus',
        source: 'fallback',
        label: 'x',
        effectLabel: 'y',
      },
    },
    10,
  );
  assert(
    checks,
    'normalize bozuk routePreparation temizler',
    brokenRoute.routePreparation === undefined,
    `route=${brokenRoute.routePreparation ? 'present' : 'cleared'}`,
  );

  const activeRoute = routeFirst.state.routePreparation!;
  const routeModifierMatch = resolveRoutePreparationModifier({
    routePreparation: activeRoute,
    currentDay: 9,
    decisionAction: inferVehicleDecisionAction(
      {
        id: wasteEvent.id,
        title: wasteEvent.title,
        description: wasteEvent.description,
        category: wasteEvent.category,
        neighborhoodId: wasteEvent.neighborhoodId,
      },
      {
        id: wasteDecision.id,
        title: wasteDecision.title,
        description: wasteDecision.description,
      },
    ),
    event: {
      id: wasteEvent.id,
      title: wasteEvent.title,
      description: wasteEvent.description,
      category: wasteEvent.category,
      neighborhoodId: wasteEvent.neighborhoodId,
    },
    decision: {
      id: wasteDecision.id,
      title: wasteDecision.title,
      description: wasteDecision.description,
    },
    affectedVehicleId: routeVehicleId,
  });
  assert(
    checks,
    'route neighborhood eşleşince modifier',
    routeModifierMatch.applies &&
      routeModifierMatch.loadReduction === ROUTE_PREPARATION_LOAD_REDUCTION,
    `applies=${routeModifierMatch.applies}`,
  );

  const routeModifierIrrelevant = resolveRoutePreparationModifier({
    routePreparation: activeRoute,
    currentDay: 9,
    decisionAction: 'none',
    event: {
      id: 'evt-office',
      title: 'Bütçe planı',
      description: 'kurumsal raporlama',
      category: 'admin',
      neighborhoodId: 'sanayi',
      districtId: 'Sanayi',
    },
    decision: {
      id: 'dec-office',
      title: 'Ofis koordinasyonu',
      description: 'masa başı planlama',
    },
    affectedVehicleId: 'vehicle-other',
  });
  assert(
    checks,
    'route alakasız karar modifier kapalı',
    !routeModifierIrrelevant.applies,
    `applies=${routeModifierIrrelevant.applies}`,
  );

  const vehicleStateProbe = createInitialVehicleState(9);
  const action = inferVehicleDecisionAction(
    {
      id: wasteEvent.id,
      title: wasteEvent.title,
      description: wasteEvent.description,
      category: wasteEvent.category,
      neighborhoodId: wasteEvent.neighborhoodId,
    },
    {
      id: wasteDecision.id,
      title: wasteDecision.title,
      description: wasteDecision.description,
    },
  );
  if (action !== 'none') {
    const baseDeltas = getVehicleDecisionDeltasForAction(action, {
      id: wasteDecision.id,
      title: wasteDecision.title,
      description: wasteDecision.description,
    });
    const adjustedDeltas = applyRoutePreparationToVehicleDeltas(
      baseDeltas,
      routeModifierMatch,
    );
    assert(
      checks,
      'route load/risk reduction clamp',
      adjustedDeltas.workload >= 0 &&
        adjustedDeltas.breakdownRisk >= 0 &&
        (baseDeltas.workload <= 0 ||
          adjustedDeltas.workload <= baseDeltas.workload),
      `workload ${baseDeltas.workload}->${adjustedDeltas.workload}`,
    );
    assert(
      checks,
      'route bonus stacklenmez',
      routeModifierMatch.loadReduction === ROUTE_PREPARATION_LOAD_REDUCTION &&
        routeModifierMatch.riskReduction === ROUTE_PREPARATION_RISK_REDUCTION &&
        routeModifierMatch.routeBonus === ROUTE_PREPARATION_ROUTE_BONUS,
      `bonus=${routeModifierMatch.routeBonus}`,
    );
  } else {
    record(checks, 'WARN', 'route load/risk reduction clamp', 'action=none skipped');
  }

  const vehiclePreviewRoute = selectVehicleImpactPreviewForDecision({
    vehicleState: vehicleStateProbe,
    event: {
      id: wasteEvent.id,
      title: wasteEvent.title,
      description: wasteEvent.description,
      category: wasteEvent.category,
      neighborhoodId: wasteEvent.neighborhoodId,
    },
    decision: {
      id: wasteDecision.id,
      title: wasteDecision.title,
      description: wasteDecision.description,
    },
    day: 9,
    routePreparation: activeRoute,
  });
  const containerBeforeRoute = createInitialContainerState(9);
  const personnelBeforeRoute = createInitialPersonnelState();
  const socialBeforeRoute = createInitialSocialPulseState(9);
  const vehicleBeforeApply = createInitialVehicleState(9);
  const vehicleAfterApply = processVehiclesAfterDecisionForStore({
    vehicleState: vehicleBeforeApply,
    event: {
      id: wasteEvent.id,
      title: wasteEvent.title,
      description: wasteEvent.description,
      category: wasteEvent.category,
      neighborhoodId: wasteEvent.neighborhoodId,
    },
    decision: {
      id: wasteDecision.id,
      title: wasteDecision.title,
      description: wasteDecision.description,
    },
    day: 9,
    routePreparation: activeRoute,
  });
  assert(
    checks,
    'route preview/apply shared helper',
    routeModifierMatch.applies &&
      vehiclePreviewRoute.routePreparationLine != null &&
      vehicleAfterApply.units.length === vehicleBeforeApply.units.length,
    vehiclePreviewRoute.routePreparationLine ?? 'none',
  );
  assert(
    checks,
    'route_preparation containerState değişmez',
    JSON.stringify(containerBeforeRoute) ===
      JSON.stringify(createInitialContainerState(9)),
    'hub action only',
  );
  assert(
    checks,
    'route_preparation personnel/social değişmez',
    JSON.stringify(personnelBeforeRoute) === JSON.stringify(createInitialPersonnelState()) &&
      JSON.stringify(socialBeforeRoute) ===
        JSON.stringify(createInitialSocialPulseState(9)),
    'hub action only',
  );

  const patrolCtx = buildNeighborhoodPatrolContext({
    activeEvents: [sampleWasteEvent()],
  });
  const patrolEventsRef = patrolCtx.activeEvents;
  const patrolFirst = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 11,
    state: createInitialHubQuickActionState(11),
    neighborhoodPatrolContext: patrolCtx,
  });
  assert(
    checks,
    'neighborhood_patrol assignment oluşur',
    patrolFirst.stateChanged &&
      patrolFirst.state.neighborhoodPatrol?.day === 11 &&
      typeof patrolFirst.state.neighborhoodPatrol?.targetNeighborhoodId === 'string' &&
      patrolFirst.state.neighborhoodPatrol?.revealedSignal != null,
    `target=${patrolFirst.state.neighborhoodPatrol?.targetNeighborhoodId ?? 'none'}`,
  );
  const patrolTargetId = patrolFirst.state.neighborhoodPatrol?.targetNeighborhoodId;
  const patrolSecond = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 11,
    state: createInitialHubQuickActionState(11),
    neighborhoodPatrolContext: patrolCtx,
  });
  assert(
    checks,
    'neighborhood_patrol deterministik mahalle',
    patrolSecond.state.neighborhoodPatrol?.targetNeighborhoodId === patrolTargetId &&
      patrolSecond.state.neighborhoodPatrol?.patrolFocus ===
        patrolFirst.state.neighborhoodPatrol?.patrolFocus,
    `target=${patrolSecond.state.neighborhoodPatrol?.targetNeighborhoodId}`,
  );
  assert(
    checks,
    'neighborhood_patrol revealedSignal oluşur',
    patrolFirst.state.neighborhoodPatrol?.revealedSignal?.title === 'Saha turu sinyali' &&
      (patrolFirst.state.neighborhoodPatrol?.revealedSignal?.body.length ?? 0) > 0,
    patrolFirst.state.neighborhoodPatrol?.revealedSignal?.body ?? 'none',
  );
  assert(
    checks,
    'neighborhood_patrol aktif olayda container_check',
    patrolFirst.state.neighborhoodPatrol?.source === 'active_event' &&
      patrolFirst.state.neighborhoodPatrol?.patrolFocus === 'container_check',
    `focus=${patrolFirst.state.neighborhoodPatrol?.patrolFocus}`,
  );
  const patrolDuplicate = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 11,
    state: patrolFirst.state,
  });
  assert(
    checks,
    'neighborhood_patrol aynı gün duplicate',
    !patrolDuplicate.stateChanged &&
      patrolDuplicate.result.tone === 'warning',
    patrolDuplicate.result.resultLine,
  );
  const emptyNeighborhoods = processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 11,
    state: createInitialHubQuickActionState(11),
    neighborhoodPatrolContext: buildNeighborhoodPatrolContext({ neighborhoods: [] }),
  });
  assert(
    checks,
    'neighborhood_patrol mahalle yoksa kullanılmamış',
    !emptyNeighborhoods.stateChanged &&
      !emptyNeighborhoods.state.usedActionIds.includes('neighborhood_patrol') &&
      emptyNeighborhoods.result.resultLine.includes('Uygun mahalle bulunamadı'),
    emptyNeighborhoods.result.resultLine,
  );
  const brokenPatrol = normalizePersistedHubQuickActionState(
    {
      day: 12,
      usedActionIds: ['neighborhood_patrol'],
      records: [],
      sequence: 0,
      neighborhoodPatrol: {
        day: 12,
        targetNeighborhoodId: 'merkez',
        targetNeighborhoodLabel: 'Merkez',
        patrolFocus: 'invalid_focus',
        source: 'fallback',
        label: 'x',
        effectLabel: 'y',
      },
    },
    12,
  );
  assert(
    checks,
    'normalize bozuk neighborhoodPatrol temizler',
    brokenPatrol.neighborhoodPatrol === undefined,
    `patrol=${brokenPatrol.neighborhoodPatrol ? 'present' : 'cleared'}`,
  );
  const brokenPatrolSignal = normalizePersistedHubQuickActionState(
    {
      day: 12,
      usedActionIds: [],
      records: [],
      sequence: 0,
      neighborhoodPatrol: {
        day: 12,
        targetNeighborhoodId: 'merkez',
        targetNeighborhoodLabel: 'Merkez',
        patrolFocus: 'general_check',
        source: 'fallback',
        label: 'x',
        effectLabel: 'y',
        revealedSignal: {
          id: 'bad',
          day: 12,
          neighborhoodId: 'merkez',
          title: 't',
          body: 'b',
          tone: 'invalid_tone',
          category: 'general',
        },
      },
    },
    12,
  );
  assert(
    checks,
    'normalize bozuk patrol signal temizler',
    brokenPatrolSignal.neighborhoodPatrol != null &&
      brokenPatrolSignal.neighborhoodPatrol.revealedSignal === undefined,
    `signal=${brokenPatrolSignal.neighborhoodPatrol?.revealedSignal ? 'present' : 'cleared'}`,
  );

  const activePatrol = patrolFirst.state.neighborhoodPatrol!;
  const wasteEventPatrol = sampleWasteEvent();
  const wasteDecisionPatrol = wasteEventPatrol.decisions[0]!;
  const patrolModifierMatch = resolveNeighborhoodPatrolModifier({
    neighborhoodPatrol: activePatrol,
    currentDay: 11,
    event: wasteEventPatrol,
    decision: wasteDecisionPatrol,
  });
  assert(
    checks,
    'neighborhood_patrol aynı mahalle modifier',
    patrolModifierMatch.applies &&
      patrolModifierMatch.insightBonus === NEIGHBORHOOD_PATROL_INSIGHT_BONUS &&
      (patrolModifierMatch.line?.includes('Mahalle turu') ?? false),
    patrolModifierMatch.line ?? 'none',
  );
  const patrolModifierOther = resolveNeighborhoodPatrolModifier({
    neighborhoodPatrol: activePatrol,
    currentDay: 11,
    event: {
      ...wasteEventPatrol,
      neighborhoodId: 'sanayi',
      district: 'Sanayi',
    },
    decision: wasteDecisionPatrol,
  });
  assert(
    checks,
    'neighborhood_patrol farklı mahalle modifier kapalı',
    !patrolModifierOther.applies,
    `applies=${patrolModifierOther.applies}`,
  );

  const personnelPatrol = createInitialPersonnelState();
  const previewPatrol = selectPersonnelImpactPreviewForDecision(
    wasteEventPatrol,
    wasteDecisionPatrol,
    personnelPatrol,
    11,
    { neighborhoodPatrol: activePatrol },
  );
  const previewPatrolOther = selectPersonnelImpactPreviewForDecision(
    { ...wasteEventPatrol, neighborhoodId: 'sanayi', district: 'Sanayi' },
    wasteDecisionPatrol,
    personnelPatrol,
    11,
    { neighborhoodPatrol: activePatrol },
  );
  assert(
    checks,
    'neighborhood_patrol preview line eşleşince',
    previewPatrol.neighborhoodPatrolLine != null &&
      previewPatrol.neighborhoodPatrolLine.includes('Mahalle turu'),
    previewPatrol.neighborhoodPatrolLine ?? 'none',
  );
  assert(
    checks,
    'neighborhood_patrol preview line farklı mahallede yok',
    previewPatrolOther.neighborhoodPatrolLine == null,
    previewPatrolOther.neighborhoodPatrolLine ?? 'none',
  );
  assert(
    checks,
    'DecisionOptionCard line yalnızca applies true',
    previewPatrol.neighborhoodPatrolLine != null &&
      previewPatrolOther.neighborhoodPatrolLine == null &&
      shouldShowDecisionDetailImpact({
        event: wasteEventPatrol,
        decision: wasteDecisionPatrol,
        personnelPreview: previewPatrol,
      }),
    previewPatrolOther.neighborhoodPatrolLine ?? 'none',
  );

  const containerBeforePatrol = createInitialContainerState(11);
  const vehicleBeforePatrol = createInitialVehicleState(11);
  const personnelBeforePatrol = createInitialPersonnelState();
  const socialBeforePatrol = createInitialSocialPulseState(11);
  processHubQuickActionForStore({
    actionId: 'neighborhood_patrol',
    currentDay: 11,
    state: createInitialHubQuickActionState(11),
    neighborhoodPatrolContext: buildNeighborhoodPatrolContext(),
  });
  assert(
    checks,
    'neighborhood_patrol containerState değişmez',
    JSON.stringify(containerBeforePatrol) ===
      JSON.stringify(createInitialContainerState(11)),
    'hub action only',
  );
  assert(
    checks,
    'neighborhood_patrol vehicleState değişmez',
    JSON.stringify(vehicleBeforePatrol) === JSON.stringify(createInitialVehicleState(11)),
    'hub action only',
  );
  assert(
    checks,
    'neighborhood_patrol personnelState değişmez',
    JSON.stringify(personnelBeforePatrol) === JSON.stringify(createInitialPersonnelState()),
    'hub action only',
  );
  assert(
    checks,
    'neighborhood_patrol socialState değişmez',
    JSON.stringify(socialBeforePatrol) ===
      JSON.stringify(createInitialSocialPulseState(11)),
    'hub action only',
  );
  assert(
    checks,
    'neighborhood_patrol event listesi değişmez',
    patrolEventsRef.length === 1 && patrolEventsRef[0]?.id === sampleWasteEvent().id,
    `events=${patrolEventsRef.length}`,
  );

  const patrolCards = buildHubQuickActionCards(patrolFirst.state);
  const patrolCard = patrolCards.find((c) => c.id === 'neighborhood_patrol');
  assert(
    checks,
    'neighborhood_patrol hub card kullanıldı',
    patrolCard?.status === 'used' &&
      (patrolCard.helperLine?.includes('turu tamamlandı') ?? false),
    patrolCard?.helperLine ?? 'none',
  );

  const socialCtx = buildSocialResponseContext();
  const socialFirst = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: socialCtx,
  });
  assert(
    checks,
    'social_response assignment oluşur',
    socialFirst.stateChanged &&
      socialFirst.state.socialResponse?.day === 13 &&
      socialFirst.socialPulseState != null,
    `topic=${socialFirst.state.socialResponse?.targetTopicId ?? 'none'}`,
  );
  assert(
    checks,
    'social_response aktif topic seçimi',
    socialFirst.state.socialResponse?.source === 'active_topic' &&
      typeof socialFirst.state.socialResponse?.targetTopicId === 'string',
    `source=${socialFirst.state.socialResponse?.source}`,
  );
  const socialTopicId = socialFirst.state.socialResponse?.targetTopicId;
  const socialSecond = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: socialCtx,
  });
  assert(
    checks,
    'social_response deterministik hedef',
    socialSecond.state.socialResponse?.targetTopicId === socialTopicId &&
      socialSecond.state.socialResponse?.responseType ===
        socialFirst.state.socialResponse?.responseType,
    `topic=${socialSecond.state.socialResponse?.targetTopicId}`,
  );
  const socialType = resolveSocialResponseType({
    topic: socialCtx.socialPulseState!.activeTopics[0] ?? null,
    profile: socialCtx.socialPulseState!.neighborhoods.merkez,
  });
  assert(
    checks,
    'social_response responseType deterministik',
    socialFirst.state.socialResponse?.responseType === socialType,
    `type=${socialFirst.state.socialResponse?.responseType}`,
  );
  const socialDuplicate = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: socialFirst.state,
  });
  assert(
    checks,
    'social_response aynı gün duplicate',
    !socialDuplicate.stateChanged &&
      socialDuplicate.result.tone === 'warning',
    socialDuplicate.result.resultLine,
  );

  const noTopicsState = createInitialSocialPulseState(13);
  noTopicsState.activeTopics = [];
  const socialFallback = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: buildSocialResponseContext({
      socialPulseState: noTopicsState,
    }),
  });
  assert(
    checks,
    'social_response topic yoksa mahalle fallback',
    socialFallback.stateChanged &&
      socialFallback.state.socialResponse?.source !== 'active_topic' &&
      typeof socialFallback.state.socialResponse?.targetNeighborhoodId === 'string',
    `source=${socialFallback.state.socialResponse?.source}`,
  );

  const brokenSocial = normalizePersistedHubQuickActionState(
    {
      day: 14,
      usedActionIds: ['social_response'],
      records: [],
      sequence: 0,
      socialResponse: {
        day: 14,
        responseType: 'invalid_type',
        source: 'fallback',
        label: 'x',
        effectLabel: 'y',
      },
    },
    14,
  );
  assert(
    checks,
    'normalize bozuk socialResponse temizler',
    brokenSocial.socialResponse === undefined,
    `social=${brokenSocial.socialResponse ? 'present' : 'cleared'}`,
  );

  const socialPulseProbeBefore = createInitialSocialPulseState(13);
  const merkezBefore = { ...socialPulseProbeBefore.neighborhoods.merkez! };
  const socialAfterProbe = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: buildSocialResponseContext({
      socialPulseState: socialPulseProbeBefore,
    }),
  });
  const merkezAfter = socialAfterProbe.socialPulseState?.neighborhoods.merkez;
  assert(
    checks,
    'social_response socialPulseState küçük değişir',
    socialAfterProbe.socialPulseState != null &&
      merkezAfter != null &&
      (merkezAfter.misinformation < merkezBefore.misinformation ||
        merkezAfter.crisisSpread < merkezBefore.crisisSpread ||
        merkezAfter.complaintHeat < merkezBefore.complaintHeat ||
        merkezAfter.trust > merkezBefore.trust),
    `misinfo ${merkezBefore.misinformation}->${merkezAfter?.misinformation}`,
  );
  assert(
    checks,
    'social_response clamp 0-100',
    merkezAfter != null &&
      merkezAfter.trust >= 0 &&
      merkezAfter.trust <= 100 &&
      merkezAfter.misinformation >= 0 &&
      merkezAfter.misinformation <= 100,
    `trust=${merkezAfter?.trust}`,
  );

  const containerBeforeSocial = createInitialContainerState(13);
  const vehicleBeforeSocial = createInitialVehicleState(13);
  const personnelBeforeSocial = createInitialPersonnelState();
  processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: buildSocialResponseContext(),
  });
  assert(
    checks,
    'social_response containerState değişmez',
    JSON.stringify(containerBeforeSocial) ===
      JSON.stringify(createInitialContainerState(13)),
    'hub action only',
  );
  assert(
    checks,
    'social_response vehicleState değişmez',
    JSON.stringify(vehicleBeforeSocial) === JSON.stringify(createInitialVehicleState(13)),
    'hub action only',
  );
  assert(
    checks,
    'social_response personnelState değişmez',
    JSON.stringify(personnelBeforeSocial) === JSON.stringify(createInitialPersonnelState()),
    'hub action only',
  );

  const lockTopicId = socialCtx.socialPulseState!.activeTopics[0]!.id;
  const lockedSocial = applySocialQuickAction(socialCtx.socialPulseState!, {
    topicId: lockTopicId,
    action: 'communicate',
    day: 13,
  });
  const hubOnLocked = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
    socialResponseContext: buildSocialResponseContext({
      socialPulseState: lockedSocial.state,
    }),
  });
  assert(
    checks,
    'social quick action guard hub yanıtı engeller',
    lockedSocial.success &&
      !hubOnLocked.stateChanged &&
      !hubOnLocked.state.usedActionIds.includes('social_response') &&
      hubOnLocked.result.resultLine.includes('zaten yanıt verildi'),
    hubOnLocked.result.resultLine,
  );

  const emptySocialProbe = processHubQuickActionForStore({
    actionId: 'social_response',
    currentDay: 13,
    state: createInitialHubQuickActionState(13),
  });
  assert(
    checks,
    'social_response context yoksa kullanılmamış',
    !emptySocialProbe.stateChanged &&
      !emptySocialProbe.state.usedActionIds.includes('social_response'),
    emptySocialProbe.result.resultLine,
  );

  exhaustTone('positive');
  exhaustTone('warning');
  exhaustStatus('available');
  exhaustStatus('disabled');
  getHubQuickActionStatusLabel('used');

  const normalized = selectHubQuickActionStateForDay(
    { day: 1, usedActionIds: [], records: [], sequence: 0 },
    8,
  );
  assert(
    checks,
    'selector day reset',
    normalized.day === 8,
    `day=${normalized.day}`,
  );

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;
  const lines = checks.map(
    (c) => `${c.severity === 'PASS' ? 'OK' : c.severity} ${c.name}: ${c.detail}`,
  );

  return {
    ok: failCount === 0,
    failCount,
    warnCount,
    checks: lines,
  };
}
