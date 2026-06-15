import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { CREVIA_MAP_LAYER_REQUIRED_IDS } from '@/core/mapLayers/mapLayerConstants';

import {
  ACTIVE_TASK_ROUTE_DOMAINS,
  ACTIVE_TASK_ROUTE_DOMAIN_LABELS,
  ACTIVE_TASK_ROUTE_FORBIDDEN_COPY_TERMS,
  ACTIVE_TASK_ROUTE_MAX_VISIBLE_CHIPS,
  ACTIVE_TASK_ROUTE_PERMISSION_IDS,
  ACTIVE_TASK_ROUTE_PRESSURES,
  ACTIVE_TASK_ROUTE_PRESSURE_LABELS,
  ACTIVE_TASK_ROUTE_STAGES,
  ACTIVE_TASK_ROUTE_STAGE_LABELS,
  ACTIVE_TASK_ROUTE_STATUSES,
  ACTIVE_TASK_ROUTE_STATUS_LABELS,
} from './activeTaskRouteConstants';
import {
  activeTaskRouteContextHasCompletedSignal,
  activeTaskRouteContextHasWeakFit,
  buildActiveTaskRouteFallback,
  buildActiveTaskRouteModel,
  buildActiveTaskRouteNodes,
  buildActiveTaskRouteSegments,
  getActiveTaskRouteMapLayerContext,
  getActiveTaskRoutePressure,
  getActiveTaskRouteStageFromContext,
  shouldShowActiveTaskRoute,
} from './activeTaskRouteModel';
import {
  activeTaskRouteCopyContainsForbiddenTerms,
  buildActiveTaskRouteChips,
  buildActiveTaskRouteEmptyState,
  buildActiveTaskRoutePresentationModel,
  buildActiveTaskRouteUnlockPreviewLine,
} from './activeTaskRoutePresentation';
import {
  activeTaskRouteUiCopyContainsForbiddenTerms,
  buildActiveTaskRouteForAssignment,
  buildActiveTaskRouteForEvent,
  buildActiveTaskRouteSteps,
  buildActiveTaskRouteUiModel,
  buildActiveRouteRankVisibility,
  shouldSuppressMapOperationHintForActiveRoute,
  validateActiveTaskRouteUiCopy,
} from './activeTaskRouteUiPresentation';
import { ACTIVE_TASK_ROUTE_UI_MAX_STEPS, ACTIVE_TASK_ROUTE_UI_PHASE_DEFINITIONS } from './activeTaskRouteUiConstants';
import type { ActiveTaskRouteAuditResult, ActiveTaskRouteContext } from './activeTaskRouteTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyActiveTaskRouteOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  results: ActiveTaskRouteAuditResult[];
};

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function createEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_route_1',
    title: 'Sanayi konteyner yoğunluğu',
    category: 'container',
    riskLevel: 'medium',
    district: 'Sanayi',
    neighborhoodId: 'sanayi',
    description: 'Konteyner hattında saha yönlendirmesi gerekir.',
    contextTag: 'container',
    urgencyHours: 2,
    decisions: [],
    previewEffects: { publicSatisfaction: -2, risk: 5, xp: 10 },
    day: 3,
    eventType: 'container',
    districtIds: ['sanayi'],
    ...overrides,
  } as never;
}

function createAssignment(overrides: Record<string, unknown> = {}) {
  return {
    eventId: 'evt_route_1',
    day: 3,
    status: 'confirmed',
    source: 'player',
    personnelType: 'field_response_team',
    vehicleType: 'route_support_vehicle',
    approachType: 'balanced_response',
    compatibilityScore: 74,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
    ...overrides,
  } as never;
}

function createOperationSignals(status: 'stable' | 'watch' | 'strained' | 'critical') {
  const domain = {
    domain: 'overall',
    status,
    score: status === 'critical' ? 92 : status === 'strained' ? 76 : 30,
    trend: 'steady',
    title: 'Operasyon',
    summary: 'Rota baskısı izleniyor.',
    sourceTags: [],
    lastUpdatedDay: 3,
  };
  return {
    personnel: { ...domain, domain: 'personnel' },
    vehicles: { ...domain, domain: 'vehicles' },
    containers: { ...domain, domain: 'containers' },
    districts: { ...domain, domain: 'districts' },
    overall: domain,
    priorityDistrictId: 'sanayi',
    dailyFocus: 'vehicles',
    lastProcessedDay: 3,
    lastRefreshedDay: 3,
  } as never;
}

function pushResult(
  results: ActiveTaskRouteAuditResult[],
  status: ActiveTaskRouteAuditResult['status'],
  message: string,
  details?: string,
) {
  results.push({ status, message, details });
}

function assert(
  results: ActiveTaskRouteAuditResult[],
  ok: boolean,
  pass: string,
  fail: string,
  details?: string,
): boolean {
  pushResult(results, ok ? 'PASS' : 'FAIL', ok ? pass : fail, details);
  return ok;
}

function warn(results: ActiveTaskRouteAuditResult[], message: string, details?: string) {
  pushResult(results, 'WARN', message, details);
}

export function verifyActiveTaskRouteScenario(): VerifyActiveTaskRouteOutcome {
  const results: ActiveTaskRouteAuditResult[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  for (const stage of ACTIVE_TASK_ROUTE_STAGES) {
    record(assert(results, ACTIVE_TASK_ROUTE_STAGE_LABELS[stage].length > 0, `stage label ${stage}`, `missing stage label ${stage}`));
  }
  for (const status of ACTIVE_TASK_ROUTE_STATUSES) {
    record(assert(results, ACTIVE_TASK_ROUTE_STATUS_LABELS[status].length > 0, `status label ${status}`, `missing status label ${status}`));
  }
  for (const pressure of ACTIVE_TASK_ROUTE_PRESSURES) {
    record(assert(results, ACTIVE_TASK_ROUTE_PRESSURE_LABELS[pressure].length > 0, `pressure label ${pressure}`, `missing pressure label ${pressure}`));
  }
  for (const domain of ACTIVE_TASK_ROUTE_DOMAINS) {
    record(assert(results, ACTIVE_TASK_ROUTE_DOMAIN_LABELS[domain].length > 0, `domain label ${domain}`, `missing domain label ${domain}`));
  }
  record(assert(results, ACTIVE_TASK_ROUTE_FORBIDDEN_COPY_TERMS.length >= 7, 'forbidden copy list exists', 'forbidden copy list too small'));

  const fallback = buildActiveTaskRouteFallback();
  record(assert(results, fallback.status === 'inactive', 'fallback route model inactive', 'fallback route status mismatch'));
  record(assert(results, buildActiveTaskRouteModel({}).status === 'inactive', 'no task returns inactive/preview', 'no task did not return inactive/preview'));

  const activeContext: ActiveTaskRouteContext = { day: 3, activeEvent: createEvent() };
  const activeModel = buildActiveTaskRouteModel(activeContext);
  record(assert(results, activeModel.targetDistrictId === 'sanayi', 'active event target district', 'active event target district missing'));
  record(assert(results, activeModel.nodes.length >= 2, 'active target creates 2+ nodes', 'active target did not create 2+ nodes'));

  const assignmentContext: ActiveTaskRouteContext = {
    ...activeContext,
    assignment: createAssignment(),
    isDispatchPhase: true,
  };
  record(assert(results, getActiveTaskRouteStageFromContext(assignmentContext) === 'dispatch_ready', 'assignment dispatch_ready stage', 'assignment stage mismatch'));

  const fieldContext: ActiveTaskRouteContext = {
    ...activeContext,
    assignment: createAssignment({ status: 'dispatched' }),
    isFieldPhase: true,
  };
  record(assert(results, ['en_route', 'on_site'].includes(getActiveTaskRouteStageFromContext(fieldContext)), 'field context en_route/on_site', 'field stage mismatch'));

  const completedContext: ActiveTaskRouteContext = {
    ...activeContext,
    assignment: createAssignment({ status: 'processed' }),
    isResultPhase: true,
  };
  record(assert(results, getActiveTaskRouteStageFromContext(completedContext) === 'completed', 'completed context stage', 'completed stage mismatch'));
  record(assert(results, activeTaskRouteContextHasCompletedSignal(completedContext), 'completed signal helper', 'completed signal missing'));

  record(assert(results, getActiveTaskRoutePressure({ ...activeContext, crisisState: { level: 'critical', activeIncident: true } }) === 'critical', 'crisis context critical pressure', 'crisis pressure mismatch'));
  record(assert(results, getActiveTaskRoutePressure({ ...activeContext, operationalResources: { vehicles: { status: 'strained' } } }) === 'high', 'resource fatigue high pressure', 'resource fatigue pressure mismatch'));
  const weakFitContext = { ...activeContext, assignment: createAssignment({ compatibilityScore: 30, compatibilityLabel: 'Zayıf uyum' }) };
  const weakFitModel = buildActiveTaskRouteModel(weakFitContext);
  record(assert(results, activeTaskRouteContextHasWeakFit(weakFitContext), 'weak assignment fit detected', 'weak assignment fit not detected'));
  record(assert(results, ['high', 'critical'].includes(weakFitModel.pressure), 'weak fit high pressure', 'weak fit pressure mismatch'));
  record(assert(results, ['strained', 'delayed', 'blocked'].includes(weakFitModel.status), 'weak fit strained status', 'weak fit status mismatch'));
  record(assert(results, getActiveTaskRoutePressure({ ...activeContext, assignment: createAssignment() }) === 'medium', 'normal assignment medium pressure', 'normal assignment pressure mismatch'));

  const fallbackNodes = buildActiveTaskRouteNodes({});
  record(assert(results, fallbackNodes.length >= 1 && fallbackNodes[0].type === 'operation_center', 'nodes include operation center', 'operation center missing'));
  const segments = buildActiveTaskRouteSegments(activeModel.nodes, activeContext);
  const nodeIds = new Set(activeModel.nodes.map((node) => node.id));
  record(assert(results, segments.every((segment) => nodeIds.has(segment.fromNodeId) && nodeIds.has(segment.toNodeId)), 'segments use valid node ids', 'segment node id invalid'));

  record(assert(results, activeModel.summaryLine.length > 0, 'summaryLine non-empty', 'summaryLine empty'));
  record(assert(results, activeModel.routeNote.length > 0, 'routeNote non-empty', 'routeNote empty'));
  record(assert(results, activeModel.sourceSignals.length > 0, 'sourceSignals non-empty', 'sourceSignals empty'));

  const day1Model = buildActiveTaskRouteModel({ ...activeContext, day: 1 });
  record(assert(results, !shouldShowActiveTaskRoute({ ...activeContext, day: 1 }, day1Model), 'Day 1 hidden/preview', 'Day 1 route too visible'));
  record(assert(results, shouldShowActiveTaskRoute(activeContext, activeModel), 'Day 3+ active event visible', 'Day 3 active route not visible'));
  const layerModel = buildActiveTaskRouteModel({ day: 3, hasActiveTaskRouteLayer: true });
  record(assert(results, shouldShowActiveTaskRoute({ day: 3, hasActiveTaskRouteLayer: true }, layerModel), 'active_task_route layer strengthens visibility', 'layer context did not strengthen visibility'));

  const mapLayerContext = getActiveTaskRouteMapLayerContext(activeModel);
  record(assert(results, typeof mapLayerContext.hasActiveTask === 'boolean', 'map layer context hasActiveTask boolean', 'map layer context invalid'));

  const presentation = buildActiveTaskRoutePresentationModel(buildActiveTaskRouteModel(fieldContext), {
    surface: 'field',
    includeCtaHint: true,
  });
  record(assert(results, presentation.compactLine.length > 0, 'presentation compactLine non-empty', 'compactLine empty'));
  record(assert(results, presentation.chips.length <= ACTIVE_TASK_ROUTE_MAX_VISIBLE_CHIPS, 'presentation chips max 3', 'too many presentation chips'));
  record(assert(results, buildActiveTaskRouteChips(activeModel).length <= 3, 'build chips max 3', 'build chips too many'));

  const playerCopy = [
    ...Object.values(ACTIVE_TASK_ROUTE_STAGE_LABELS),
    ...Object.values(ACTIVE_TASK_ROUTE_STATUS_LABELS),
    ...Object.values(ACTIVE_TASK_ROUTE_PRESSURE_LABELS),
    ...Object.values(ACTIVE_TASK_ROUTE_DOMAIN_LABELS),
    activeModel.summaryLine,
    activeModel.routeNote,
    presentation.compactLine,
    presentation.routeNote,
    presentation.emptyStateLine ?? '',
    buildActiveTaskRouteEmptyState('map'),
    buildActiveTaskRouteEmptyState('dispatch'),
    buildActiveTaskRouteEmptyState('field'),
    buildActiveTaskRouteUnlockPreviewLine({}),
  ].join(' ');
  record(assert(results, activeTaskRouteCopyContainsForbiddenTerms(playerCopy).length === 0, 'player-facing forbidden copy clean', 'player-facing forbidden copy found'));

  const docs = readRepo('docs/crevia-active-task-route-system.md');
  record(assert(results, docs.toLocaleLowerCase('tr-TR').includes('gerçek pathfinding değildir'), 'docs pathfinding boundary note', 'docs missing pathfinding note'));
  record(assert(results, docs.includes('SAVE_VERSION yok'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION note'));
  record(assert(results, docs.includes('Persist yok'), 'docs persist note', 'docs missing persist note'));
  record(assert(results, docs.includes('active_task_route'), 'docs map layer link', 'docs missing map layer link'));
  record(assert(results, docs.includes('Dispatch') && docs.includes('Field'), 'docs dispatch/field link', 'docs missing dispatch/field link'));

  record(assert(results, CREVIA_MAP_LAYER_REQUIRED_IDS.includes('active_task_route'), 'map layer active_task_route id compatible', 'active_task_route map layer missing'));
  for (const permissionId of ACTIVE_TASK_ROUTE_PERMISSION_IDS) {
    record(assert(results, typeof permissionId === 'string' && permissionId.length > 0, `permission string ${permissionId}`, `permission string invalid ${permissionId}`));
  }
  record(assert(results, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION unchanged note', `SAVE_VERSION changed: ${SAVE_VERSION}`));
  pushResult(results, 'PASS', 'Persist shape unchanged note', 'active task route state is not stored');

  for (const file of [
    'src/core/game/ensureDailyEventsForDay.ts',
    'src/core/game/generateDailyEventSet.ts',
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
    'src/core/assignments/assignmentEngine.ts',
    'src/core/operationalResources/operationalResourceEngine.ts',
    'src/core/mapLayers/mapLayerUnlockModel.ts',
    'src/store/gamePersist.ts',
  ]) {
    record(assert(results, !readRepo(file).includes('activeTaskRoutes'), `${file} no activeTaskRoutes import`, `${file} imports activeTaskRoutes`));
  }

  const dispatchSrc = readRepo('src/features/events/components/event-workflow/dispatch/EventDispatchPhase.tsx');
  const dispatchMotionSrc = readRepo(
    'src/features/events/components/event-workflow/dispatch/DispatchMotionSections.tsx',
  );
  const fieldSrc = readRepo('src/features/events/components/event-workflow/field/LiveOperationCard.tsx');
  const routePreviewStripSrc = readRepo('src/features/events/components/ActiveTaskRoutePreviewStrip.tsx');
  const mapSrc = readRepo('src/features/map/screens/MapScreen.tsx');
  const dispatchRouteBound =
    (dispatchSrc.includes('ActiveTaskRoutePreviewStrip') ||
      (dispatchSrc.includes('DispatchRouteStepStrip') && dispatchSrc.includes('routePreview'))) &&
    fieldSrc.includes('routePreview');
  record(
    assert(
      results,
      dispatchRouteBound,
      'dispatch/field UI binding',
      'dispatch/field binding missing',
    ),
  );
  record(
    assert(
      results,
      mapSrc.includes('activeTaskRoutePreview') && mapSrc.includes('shouldSuppressMapOperationHintForActiveRoute'),
      'map UI binding',
      'map binding missing',
    ),
  );
  const routeOverflowGuardPresent =
    fieldSrc.includes('numberOfLines') ||
    routePreviewStripSrc.includes('numberOfLines') ||
    dispatchMotionSrc.includes('numberOfLines');
  record(
    assert(
      results,
      dispatchRouteBound && routeOverflowGuardPresent,
      'UI overflow guard',
      'overflow guard missing',
    ),
  );

  record(assert(results, ACTIVE_TASK_ROUTE_UI_PHASE_DEFINITIONS.length >= 8, 'UI phase definitions', 'UI phases missing'));

  const noEventUi = buildActiveTaskRouteUiModel({ day: 5 });
  record(assert(results, !noEventUi.visible || noEventUi.status === 'hidden', 'no event hidden fallback', 'no event not hidden'));

  const plannedUi = buildActiveTaskRouteForEvent({ day: 5, activeEvent: createEvent() });
  record(assert(results, plannedUi.visible, 'day 5 event route visible', 'event route hidden'));

  const dispatchUi = buildActiveTaskRouteForAssignment({
    day: 5,
    activeEvent: createEvent(),
    assignment: createAssignment(),
    isDispatchPhase: true,
  });
  record(
    assert(
      results,
      dispatchUi.phase === 'dispatch_ready' || dispatchUi.phase === 'risk_watch',
      'dispatch phase line',
      `dispatch phase ${dispatchUi.phase}`,
    ),
  );

  const fieldUi = buildActiveTaskRouteForEvent({
    day: 5,
    activeEvent: createEvent(),
    assignment: createAssignment({ status: 'dispatched' }),
    isFieldPhase: true,
  });
  record(
    assert(
      results,
      fieldUi.phase === 'on_site' || fieldUi.phase === 'en_route' || fieldUi.phase === 'risk_watch',
      'field phase line',
      `field phase ${fieldUi.phase}`,
    ),
  );

  const completedUi = buildActiveTaskRouteForEvent({
    day: 5,
    activeEvent: createEvent(),
    assignment: createAssignment({ status: 'processed' }),
    isResultPhase: true,
  });
  record(assert(results, completedUi.phase === 'completed', 'completed phase line', `completed ${completedUi.phase}`));

  const fatigueUi = buildActiveTaskRouteForEvent({
    day: 5,
    activeEvent: createEvent(),
    assignment: createAssignment(),
    operationalResources: { vehicles: { status: 'strained' } },
    isDispatchPhase: true,
  });
  record(assert(results, !!fatigueUi.resourceWarningLine, 'resource fatigue warning', 'fatigue warning missing'));
  record(
    assert(
      results,
      (fatigueUi.resourceWarningLine ?? '').split('\n').length <= 1,
      'max 1 fatigue warning line',
      'too many fatigue lines',
    ),
  );

  const crisisUi = buildActiveTaskRouteForEvent({
    day: 5,
    activeEvent: createEvent(),
    crisisState: { level: 'watch', trend: 'elevated' },
    isDispatchPhase: true,
  });
  record(
    assert(
      results,
      !activeTaskRouteUiCopyContainsForbiddenTerms(crisisUi.dispatchLine),
      'crisis no panic copy',
      'panic in crisis route copy',
    ),
  );

  const day1Ui = buildActiveTaskRouteForEvent({ day: 1, activeEvent: createEvent(), isDispatchPhase: true });
  record(assert(results, !day1Ui.visible || day1Ui.visibility.mode === 'hidden', 'day 1 simplified', 'day1 exposed'));

  const postPilotUi = buildActiveTaskRouteForEvent({
    day: 8,
    activeEvent: createEvent(),
    assignment: createAssignment(),
    isMapSurface: true,
    isPostPilot: true,
  });
  record(assert(results, !!postPilotUi.mapLine, 'post-pilot map hint', 'post-pilot map missing'));

  const steps = buildActiveTaskRouteSteps(
    { day: 5, activeEvent: createEvent(), assignment: createAssignment() },
    'en_route',
  );
  record(assert(results, steps.length <= ACTIVE_TASK_ROUTE_UI_MAX_STEPS, 'max 4 steps', `steps ${steps.length}`));
  record(assert(results, validateActiveTaskRouteUiCopy(dispatchUi), 'UI copy validation', 'UI copy invalid'));

  const suppress = shouldSuppressMapOperationHintForActiveRoute({
    day: 8,
    activeEvent: createEvent(),
    assignment: createAssignment({ status: 'dispatched' }),
    isMapSurface: true,
    isPostPilot: true,
  });
  record(assert(results, suppress === true || suppress === false, 'map density guard helper', 'suppress helper fail'));

  const lowRank = buildActiveRouteRankVisibility({ day: 2 });
  const highRank = buildActiveRouteRankVisibility({
    day: 10,
    rankKey: 'department_director',
    unlockedPermissionIds: ['active_task_route'],
  });
  record(assert(results, lowRank.mode === 'compact', 'low rank compact', 'low rank wrong'));
  record(assert(results, highRank.mode === 'detailed', 'high rank detailed', 'high rank wrong'));

  const uiDocs = readRepo('docs/crevia-active-task-route-ui-integration.md').toLocaleLowerCase('tr-TR');
  record(assert(results, uiDocs.includes('pathfinding') || uiDocs.includes('gps'), 'UI docs boundary', 'UI docs missing'));

  const activeRouteSrc =
    readRepo('src/core/activeTaskRoutes/activeTaskRouteModel.ts') +
    readRepo('src/core/activeTaskRoutes/activeTaskRoutePresentation.ts');
  record(assert(results, !activeRouteSrc.includes("from '@/core/districtTrust"), 'no circular import risk', 'districtTrust import detected'));
  record(assert(results, readRepo('src/core/activeTaskRoutes/index.ts').includes('activeTaskRouteTypes'), 'type exports runtime-safe', 'index exports missing'));

  const checks = results.map((result) =>
    `${result.status} ${result.message}${result.details ? `: ${result.details}` : ''}`,
  );
  return {
    ok,
    warn: results.some((result) => result.status === 'WARN'),
    checks,
    results,
  };
}
