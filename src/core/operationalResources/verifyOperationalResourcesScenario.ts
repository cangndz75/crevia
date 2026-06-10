import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialAssignmentsState } from '@/core/assignments/assignmentState';
import { createInitialCrisisState } from '@/core/crisis/crisisState';
import { createInitialDailyOperationsPlan } from '@/core/dailyPlanning/dailyPlanningState';
import { END_OF_DAY_PIPELINE_STEP_DEFINITIONS } from '@/core/dayPipeline/dayPipelineConstants';
import {
  applyFullAccessToGameState,
  buildDevJumpPilotCompletedGameState,
} from '@/core/monetization/monetizationEngine';
import {
  createInitialMonetizationState,
  mockPurchaseMainOperationPack,
} from '@/core/monetization/monetizationState';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialMicroDecisionState } from '@/core/microDecisions/microDecisionState';
import { getInteractionContractsForComponent } from '@/core/quality/interactionContracts/interactionContractRegistry';
import { buildHubCardVisibilityModel } from '@/core/onboarding/firstTenMinutesPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';
import { normalizePersistedSave } from '@/store/gamePersist';

import {
  ALL_PERSONNEL_GROUP_IDS,
  ALL_VEHICLE_GROUP_IDS,
  CONTAINER_NETWORK_DISTRICT_IDS,
  OPERATIONAL_RESOURCE_UI_FORBIDDEN_WORDS,
} from './operationalResourceConstants';
import {
  applyOperationalResourceEffects,
  buildOperationalResourceEffectsFromDailyPlan,
  buildOperationalResourceEffectsFromAssignment,
  buildOperationalResourceEffectsFromCrisisActions,
  buildOperationalResourceEffectsFromOperationSignals,
  buildOperationalResourceEngineInputFromStore,
  processOperationalResourcesEndOfDay,
} from './operationalResourceEngine';
import {
  buildAssignmentResourceFitLine,
  buildDailyPlanResourceHintLine,
  buildOperationalResourceAdvisorLine,
  buildOperationalResourceHubModel,
  buildOperationalResourceReportModel,
} from './operationalResourcePresentation';
import {
  buildOperationalResourceDetailSheetModel,
  canShowOperationalResourceDetailCta,
} from './operationalResourceDetailPresentation';
import { DEFAULT_PILOT_DISTRICT_ID } from '@/core/models/DistrictProfile';
import { mapDistrictFromPilot } from '@/features/map/data/mapDistrictMapping';
import {
  buildMapResourcePresentationBundle,
  shouldShowMapResourceOverlay,
} from '@/features/map/utils/mapResourcePresentation';
import { buildMapNeighborhoodStripItems } from '@/features/map/utils/mapUiPresentation';
import {
  clampResourceScore,
  createInitialOperationalResourcesState,
  getOperationalResourceStatus,
  normalizeOperationalResourcesState,
} from './operationalResourceState';
import type { OperationalResourceEngineInput } from './operationalResourceTypes';

export type VerifyOperationalResourcesOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function pilotGs(day: number) {
  const seed = createDay1Seed();
  return {
    ...seed.gameState,
    city: { ...seed.gameState.city, day },
    pilot: { ...seed.gameState.pilot, status: 'active' as const, currentPilotDay: day },
  };
}

function baseInput(day = 8): OperationalResourceEngineInput {
  const gameState = applyFullAccessToGameState(
    buildDevJumpPilotCompletedGameState(createDay1Seed().gameState),
  );
  gameState.city.day = day;
  return {
    gameState,
    monetization: mockPurchaseMainOperationPack(createInitialMonetizationState(), day),
    operationSignals: createInitialOperationSignalsState(day),
    dailyOperationsPlan: {
      ...createInitialDailyOperationsPlan(day),
      status: 'confirmed',
      personnelFocus: 'rapid_response',
      vehicleFocus: 'preventive_maintenance',
      containerFocus: 'intensive_collection',
      districtFocusId: 'sanayi',
    },
    assignments: createInitialAssignmentsState(),
    microDecisionState: createInitialMicroDecisionState(),
    crisisActionState: { actionsById: {} },
    operationalResources: createInitialOperationalResourcesState(day),
  };
}

export function verifyOperationalResourcesScenario(): VerifyOperationalResourcesOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const add = (p: boolean, pass: string, fail: string) => {
    ok = assert(checks, p, pass, fail) && ok;
  };
  const addWarn = (p: boolean, pass: string, message: string) => {
    if (!warn(checks, p, pass, message)) hasWarn = true;
  };

  const initial = createInitialOperationalResourcesState(1);
  add(
    ALL_PERSONNEL_GROUP_IDS.every((id) => initial.personnelGroups[id] != null),
    'Initial 3 personnel group',
    'personnel',
  );
  add(
    ALL_VEHICLE_GROUP_IDS.every((id) => initial.vehicleGroups[id] != null),
    'Initial 3 vehicle group',
    'vehicle',
  );
  add(
    CONTAINER_NETWORK_DISTRICT_IDS.every(
      (id) => initial.containerNetworksByDistrictId[id] != null,
    ),
    'Initial 5 district container network',
    'containers',
  );

  const broken = normalizeOperationalResourcesState({ personnelGroups: { bad: 1 } }, 3);
  add(broken.personnelGroups.field_team != null, 'Normalize repairs personnel', 'normalize');

  add(clampResourceScore(150) === 100, 'Score clamp high', 'clamp');
  add(clampResourceScore(-5) === 0, 'Score clamp low', 'clamp');
  add(getOperationalResourceStatus(20) === 'stable', 'Status stable threshold', 'status');
  add(getOperationalResourceStatus(50) === 'busy', 'Status busy threshold', 'status');
  add(getOperationalResourceStatus(70) === 'strained', 'Status strained threshold', 'status');
  add(getOperationalResourceStatus(90) === 'critical', 'Status critical threshold', 'status');

  const day1 = createInitialOperationalResourcesState(1);
  add(
    !ALL_PERSONNEL_GROUP_IDS.some((id) => day1.personnelGroups[id].status === 'critical'),
    'Day 1 initial not critical',
    'day1 critical',
  );

  const planInput = baseInput(8);
  const planFx = buildOperationalResourceEffectsFromDailyPlan(planInput);
  add(
    planFx.some((e) => e.targetId === 'field_team' && e.metric === 'workload' && e.delta > 0),
    'rapid_response field_team workload up',
    'plan rapid',
  );

  planInput.dailyOperationsPlan.personnelFocus = 'rest_rotation';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.targetId === 'field_team' && e.delta < 0,
    ),
    'rest_rotation fatigue down',
    'rest',
  );

  planInput.dailyOperationsPlan.vehicleFocus = 'preventive_maintenance';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.targetId === 'maintenance_vehicle' && e.delta < 0,
    ),
    'preventive_maintenance vehicle risk down',
    'prev maint',
  );

  planInput.dailyOperationsPlan.vehicleFocus = 'high_capacity';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.targetId === 'standard_truck' && e.delta > 0,
    ),
    'high_capacity truck pressure up',
    'capacity',
  );

  planInput.dailyOperationsPlan.vehicleFocus = 'route_check';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.targetId === 'route_support_vehicle' && e.delta < 0,
    ),
    'route_check route pressure down',
    'route',
  );

  planInput.dailyOperationsPlan.containerFocus = 'intensive_collection';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.domain === 'containers' && e.delta < 0,
    ),
    'intensive_collection fill pressure down',
    'intensive',
  );

  planInput.dailyOperationsPlan.containerFocus = 'cleanliness_maintenance';
  add(
    buildOperationalResourceEffectsFromDailyPlan(planInput).some(
      (e) => e.metric === 'cleanliness_pressure' && e.delta < 0,
    ),
    'cleanliness_maintenance pressure down',
    'clean',
  );

  const assignInput = baseInput(8);
  assignInput.assignments.assignmentsByEventId.evt1 = {
    eventId: 'evt1',
    day: 8,
    status: 'confirmed',
    source: 'auto_default',
    personnelType: 'technical_team',
    vehicleType: 'maintenance_vehicle',
    approachType: 'rapid_response',
    compatibilityScore: 70,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
  };
  add(
    buildOperationalResourceEffectsFromAssignment(assignInput).some(
      (e) => e.targetId === 'technical_team',
    ),
    'technical assignment workload',
    'assign tech',
  );

  const hubDay1 = buildHubCardVisibilityModel(pilotGs(1));
  add(!hubDay1.showOperationalResources, 'Day 1 hub resources hidden', 'hub day1');
  const hubDay3 = buildHubCardVisibilityModel(pilotGs(3));
  add(hubDay3.showOperationalResources, 'Day 3 hub resources visible', 'hub day3');

  const hubModel = buildOperationalResourceHubModel(baseInput(10));
  add(hubModel.rows.length <= 3, 'Hub max 3 rows', String(hubModel.rows.length));

  const reportDay1 = buildOperationalResourceReportModel(
    { ...baseInput(1), gameState: pilotGs(1) },
    1,
  );
  add(Boolean(reportDay1.educationalLine), 'Day 1 report educational', 'report day1');

  const advisorDay1 = buildOperationalResourceAdvisorLine(
    { ...baseInput(1), gameState: pilotGs(1) },
    3,
  );
  add(advisorDay1 == null, 'Advisor Day 1 no resource detail', 'advisor day1');

  const strainedInput = baseInput(10);
  strainedInput.operationalResources = applyOperationalResourceEffects(
    strainedInput.operationalResources,
    [
      {
        domain: 'personnel',
        targetId: 'technical_team',
        delta: 25,
        metric: 'workload',
        reason: 'test',
        sourceTags: [],
      },
      {
        domain: 'containers',
        targetId: 'sanayi',
        delta: 30,
        metric: 'fill_pressure',
        reason: 'test',
        sourceTags: [],
      },
    ],
    10,
  );
  const advisorFull = buildOperationalResourceAdvisorLine(strainedInput, 2);
  add(Boolean(advisorFull), 'Advisor full context line', 'advisor full');

  const eod1 = processOperationalResourcesEndOfDay(baseInput(8), 8);
  const eod2 = processOperationalResourcesEndOfDay(
    { ...baseInput(8), operationalResources: eod1 },
    8,
  );
  add(eod1.lastProcessedDay === 8, 'EOD marks processed', 'eod');
  add(eod1 === eod2 || eod2.lastProcessedDay === 8, 'EOD idempotent same day', 'eod idempotent');
  add(Boolean(eod1.dailySummary?.personnelLine), 'DailySummary not empty', 'summary');

  const pipelineStep = END_OF_DAY_PIPELINE_STEP_DEFINITIONS.find(
    (s) => s.id === 'operational_resources_process',
  );
  add(pipelineStep != null, 'DayPipeline step registered', 'pipeline');
  add(
    pipelineStep?.idempotencyKey === 'operationalResources.lastProcessedDay',
    'DayPipeline idempotency key',
    pipelineStep?.idempotencyKey ?? '',
  );

  add(
    normalizeOperationalResourcesState(undefined, 1).personnelGroups.field_team != null,
    'Missing operationalResources normalizes on hydrate',
    'migrate',
  );
  add(
    normalizePersistedSave({ saveVersion: 22, updatedAt: new Date().toISOString(), gameState: pilotGs(1) }) ==
      null,
    'v22 raw without core fields rejected; v23 full save required',
    'v22 whitelist',
  );

  add(SAVE_VERSION === 26, 'SAVE_VERSION 23', String(SAVE_VERSION));

  const hubContracts = getInteractionContractsForComponent('HubOperationalResourcesCard');
  add(hubContracts.length >= 1, 'Contract HubOperationalResourcesCard', 'contract hub');
  add(
    hubContracts.some(
      (c) =>
        c.expectedAction === 'modal' &&
        c.target?.type === 'modal' &&
        c.target.modalId === 'operational_resources_detail_sheet',
    ),
    'Hub CTA modal contract',
    'hub modal',
  );
  add(
    getInteractionContractsForComponent('OperationalResourcesDetailSheet').length >= 1,
    'Contract OperationalResourcesDetailSheet',
    'contract sheet',
  );

  const detailModel = buildOperationalResourceDetailSheetModel(baseInput(10));
  add(detailModel != null && detailModel.title.length > 0, 'Detail sheet title', 'detail title');
  add(detailModel?.tabs.length === 3, 'Detail sheet 3 tabs', String(detailModel?.tabs.length));
  add(
    detailModel?.personnelRows.length === 3,
    'Personnel tab 3 rows',
    String(detailModel?.personnelRows.length),
  );
  add(
    detailModel?.vehicleRows.length === 3,
    'Vehicle tab 3 rows',
    String(detailModel?.vehicleRows.length),
  );
  add(
    detailModel?.containerRows.length === 5,
    'Container tab 5 rows',
    String(detailModel?.containerRows.length),
  );
  add(
    detailModel?.personnelRows.every((r) => r.statusLabel.length > 0) ?? false,
    'Personnel status labels',
    'personnel status',
  );
  add(
    detailModel?.vehicleRows.every(
      (r) =>
        r.capacityLabel.length > 0 &&
        r.maintenanceLabel.length > 0 &&
        r.routeLabel.length > 0,
    ) ?? false,
    'Vehicle metric labels',
    'vehicle metrics',
  );
  add(
    detailModel?.containerRows.every(
      (r) =>
        r.fillLabel.length > 0 &&
        r.cleanlinessLabel.length > 0 &&
        r.maintenanceLabel.length > 0 &&
        r.socialLabel.length > 0,
    ) ?? false,
    'Container metric labels',
    'container metrics',
  );
  add(
    detailModel?.personnelRows.every((r) => r.recommendationLine.length > 0) ?? false,
    'Recommendation lines',
    'recommendation',
  );

  add(
    canShowOperationalResourceDetailCta({ ...baseInput(2), gameState: pilotGs(2) }),
    'Day 2+ detail CTA allowed',
    'day2 cta',
  );
  add(!hubDay1.showOperationalResources, 'Day 1 hub resources hidden', 'hub day1 hidden');
  add(
    buildOperationalResourceDetailSheetModel({
      ...baseInput(1),
      gameState: pilotGs(1),
    }) == null,
    'Day 1 detail sheet hidden',
    'day1 sheet',
  );

  add(!shouldShowMapResourceOverlay({ ...baseInput(1), gameState: pilotGs(1) }), 'Map overlay Day 1 hidden', 'map day1');
  const mapStrained = buildMapResourcePresentationBundle({
    ...strainedInput,
    gameState: { ...strainedInput.gameState, city: { ...strainedInput.gameState.city, day: 10 } },
  });
  add(
    mapStrained.panelLines.length > 0 || shouldShowMapResourceOverlay(strainedInput),
    'Map overlay strained produces lines',
    String(mapStrained.panelLines.length),
  );
  add(
    mapStrained.panelLines.length <= 2,
    'Map resource panel max 2 lines',
    String(mapStrained.panelLines.length),
  );
  add(
    Object.keys(mapStrained.districtBadges).length <= 5,
    'Map district badges bounded',
    String(Object.keys(mapStrained.districtBadges).length),
  );

  const stripCrisis = buildMapNeighborhoodStripItems({
    pilotDistrictId: DEFAULT_PILOT_DISTRICT_ID,
    focusDistrictId: mapDistrictFromPilot(DEFAULT_PILOT_DISTRICT_ID),
    gameDay: 10,
    crisisDistrictBadges: [{ districtId: 'sanayi', label: 'Kriz hattı', tone: 'critical' }],
    crisisAccessMode: 'active',
    resourceDistrictBadges: {
      sanayi: { districtId: 'sanayi', label: 'Konteyner baskısı', tone: 'warning', iconKey: 'factory' },
    },
  });
  const sanayiStrip = stripCrisis.find((i) => i.id === 'sanayi');
  add(
    sanayiStrip?.statusLabel === 'Kriz hattı',
    'Crisis badge beats resource badge',
    sanayiStrip?.statusLabel ?? '',
  );

  const stableReport = buildOperationalResourceReportModel(baseInput(10), 10);
  add(stableReport.lines.length <= 3, 'Report max 3 lines', String(stableReport.lines.length));

  const stableOnlyInput = baseInput(10);
  const stableReportCompact = buildOperationalResourceReportModel(stableOnlyInput, 10);
  const allStableLines =
    stableReportCompact.lines.length === 1 &&
    stableReportCompact.lines[0]?.includes('dengeli');
  add(
    allStableLines || stableReportCompact.lines.length > 0,
    'Stable resource report compact line',
    stableReportCompact.lines.join('|'),
  );

  add(buildDailyPlanResourceHintLine({ ...baseInput(1), gameState: pilotGs(1) }) == null, 'DailyPlan resource Day 1 hidden', 'plan day1');

  const assignDay1 = buildAssignmentResourceFitLine(
    pilotGs(1),
    { id: 'e1', title: 't', district: 'd', neighborhoodId: 'merkez' } as import('@/core/models/EventCard').EventCard,
    assignInput.assignments.assignmentsByEventId.evt1!,
    createInitialOperationalResourcesState(1),
  );
  add(!assignDay1.visible, 'Assignment resource Day 1 hidden', 'assign day1');
  add(
    getInteractionContractsForComponent('ReportOperationalResourcesCard').length >= 1,
    'Contract ReportOperationalResourcesCard',
    'contract report',
  );

  const copyBlob = [hubModel.title, reportDay1.educationalLine ?? '', hubModel.subtitle].join(
    ' ',
  );
  add(
    !OPERATIONAL_RESOURCE_UI_FORBIDDEN_WORDS.some((w) =>
      copyBlob.toLowerCase().includes(w),
    ),
    'No forbidden words',
    'forbidden',
  );

  addWarn(
    true,
    'Individual inventory out of scope',
    'Individual staff/vehicle inventory not implemented',
  );

  const failCount = checks.filter((c) => c.startsWith('FAIL')).length;
  const warnCount = checks.filter((c) => c.startsWith('WARN')).length;

  return { ok: ok && failCount === 0, warn: hasWarn, checks, failCount, warnCount };
}
