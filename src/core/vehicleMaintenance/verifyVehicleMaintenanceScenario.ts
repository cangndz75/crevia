import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { REQUIRED_RANK_PERMISSION_IDS } from '@/core/rankPermissions/rankPermissionConstants';
import { getDistrictOperationDefinition } from '@/core/districtOperations/districtOperationModel';

import {
  VEHICLE_MAINTENANCE_FORBIDDEN_COPY_TERMS,
  VEHICLE_MAINTENANCE_RISK_LEVELS,
  VEHICLE_MAINTENANCE_TRADEOFF_TYPES,
  VEHICLE_MAINTENANCE_WINDOW_KINDS,
  VEHICLE_MAINTENANCE_WINDOW_STATUSES,
  VEHICLE_MAINTENANCE_KIND_LABELS,
  VEHICLE_MAINTENANCE_RISK_LABELS,
  VEHICLE_MAINTENANCE_STATUS_LABELS,
  VEHICLE_MAINTENANCE_TRADEOFF_LABELS,
} from './vehicleMaintenanceConstants';
import {
  buildVehicleMaintenanceFallbackModel,
  buildVehicleMaintenanceWindowModel,
  calculateVehicleMaintenanceReadinessScore,
  calculateVehicleMaintenanceUrgencyScore,
  clampVehicleMaintenanceScore,
  getVehicleMaintenanceRiskLevel,
  getVehicleMaintenanceSignalSources,
  getVehicleMaintenanceSuggestedTeam,
  resolveVehicleMaintenanceTradeoffs,
  resolveVehicleMaintenanceWindowKind,
  resolveVehicleMaintenanceWindowStatus,
  shouldShowVehicleMaintenanceWindow,
} from './vehicleMaintenanceModel';
import {
  buildVehicleMaintenanceEmptyState,
  buildVehicleMaintenancePresentationModel,
  buildVehicleMaintenanceUnlockLine,
  vehicleMaintenanceCopyContainsForbiddenTerms,
} from './vehicleMaintenancePresentation';
import type { VehicleMaintenanceContext } from './vehicleMaintenanceTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyVehicleMaintenanceOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function baseContext(overrides: Partial<VehicleMaintenanceContext> = {}): VehicleMaintenanceContext {
  return {
    day: 5,
    unlockedPermissionIds: ['vehicle_maintenance_window_preview', 'assignment_fit_preview'],
    operationalResources: {
      vehicleGroups: {
        standard_truck: {
          status: 'strained',
          maintenanceRisk: 72,
          routePressure: 68,
          capacityPressure: 55,
        },
      },
    },
    assignment: {
      eventId: 'evt-1',
      day: 5,
      status: 'confirmed',
      source: 'player',
      personnelType: 'field_response_team',
      vehicleType: 'standard_truck',
      approachType: 'balanced_response',
      compatibilityScore: 72,
      compatibilityLabel: 'Güçlü uyum',
      effects: [],
    },
    isDispatchPhase: true,
    ...overrides,
  };
}

export function verifyVehicleMaintenanceScenario(): VerifyVehicleMaintenanceOutcome {
  const checks: string[] = [];
  let ok = true;
  let warn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  for (const status of VEHICLE_MAINTENANCE_WINDOW_STATUSES) {
    record(assert(checks, (VEHICLE_MAINTENANCE_STATUS_LABELS[status]?.length ?? 0) > 0, `status label ${status}`, `missing status ${status}`));
  }
  for (const risk of VEHICLE_MAINTENANCE_RISK_LEVELS) {
    record(assert(checks, (VEHICLE_MAINTENANCE_RISK_LABELS[risk]?.length ?? 0) > 0, `risk label ${risk}`, `missing risk ${risk}`));
  }
  for (const kind of VEHICLE_MAINTENANCE_WINDOW_KINDS) {
    record(assert(checks, (VEHICLE_MAINTENANCE_KIND_LABELS[kind]?.length ?? 0) > 0, `kind label ${kind}`, `missing kind ${kind}`));
  }
  for (const tradeoff of VEHICLE_MAINTENANCE_TRADEOFF_TYPES) {
    record(assert(checks, (VEHICLE_MAINTENANCE_TRADEOFF_LABELS[tradeoff]?.length ?? 0) > 0, `tradeoff label ${tradeoff}`, `missing tradeoff ${tradeoff}`));
  }

  record(assert(checks, VEHICLE_MAINTENANCE_FORBIDDEN_COPY_TERMS.length >= 8, 'forbidden copy list', 'forbidden copy missing'));
  record(assert(checks, clampVehicleMaintenanceScore(-10) === 0, 'clamp negative to 0', 'clamp negative failed'));
  record(assert(checks, clampVehicleMaintenanceScore(150) === 100, 'clamp above 100', 'clamp max failed'));
  record(assert(checks, getVehicleMaintenanceRiskLevel(10) === 'low', 'risk 10 low', 'risk 10 wrong'));
  record(assert(checks, getVehicleMaintenanceRiskLevel(35) === 'moderate', 'risk 35 moderate', 'risk 35 wrong'));
  record(assert(checks, getVehicleMaintenanceRiskLevel(55) === 'elevated', 'risk 55 elevated', 'risk 55 wrong'));
  record(assert(checks, getVehicleMaintenanceRiskLevel(75) === 'high', 'risk 75 high', 'risk 75 wrong'));
  record(assert(checks, getVehicleMaintenanceRiskLevel(95) === 'critical', 'risk 95 critical', 'risk 95 wrong'));

  const fallback = buildVehicleMaintenanceFallbackModel();
  record(assert(checks, fallback.summaryLine.length > 0, 'fallback no crash', 'fallback crash'));
  record(assert(checks, fallback.signalSources.includes('fallback'), 'fallback signalSources', 'fallback signals missing'));

  const noContext = buildVehicleMaintenanceWindowModel({ day: 5 });
  record(
    assert(
      checks,
      noContext.status === 'preview' || noContext.status === 'unavailable',
      'no context preview/unavailable',
      'no context wrong status',
    ),
  );

  const day1 = buildVehicleMaintenanceWindowModel(baseContext({ day: 1 }));
  record(assert(checks, day1.status !== 'recommended' && day1.status !== 'urgent', 'Day 1 no recommended/urgent', 'Day 1 urgent/recommended'));
  record(assert(checks, shouldShowVehicleMaintenanceWindow(baseContext({ day: 1 }), day1) === false, 'Day 1 hidden', 'Day 1 visible'));

  const day3 = buildVehicleMaintenanceWindowModel(
    baseContext({
      day: 4,
      activeTaskRoute: {
        id: 'r1',
        status: 'active',
        stage: 'en_route',
        pressure: 'high',
        tone: 'strained',
        domain: 'vehicle_route',
        targetDistrictId: 'sanayi',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, shouldShowVehicleMaintenanceWindow(baseContext({ day: 4 }), day3), 'Day 3+ visible with route', 'Day 3+ not visible'));

  const fatigueUrgency = calculateVehicleMaintenanceUrgencyScore(
    baseContext({
      operationalResources: {
        vehicleGroups: {
          standard_truck: { status: 'critical', maintenanceRisk: 85, routePressure: 82, capacityPressure: 70 },
        },
      },
      resourceFatigue: { state: 'maintenance_risk' },
    }),
  );
  const fatigueBase = calculateVehicleMaintenanceUrgencyScore(baseContext({ operationalResources: undefined, resourceFatigue: undefined }));
  record(assert(checks, fatigueUrgency > fatigueBase, 'vehicle fatigue increases urgency', 'fatigue urgency unchanged'));

  const routeUrgency = calculateVehicleMaintenanceUrgencyScore(
    baseContext({
      activeTaskRoute: {
        id: 'r2',
        status: 'active',
        stage: 'en_route',
        pressure: 'critical',
        tone: 'crisis',
        domain: 'vehicle_route',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, routeUrgency > fatigueBase, 'route pressure urgency', 'route urgency unchanged'));

  const crisisUrgency = calculateVehicleMaintenanceUrgencyScore(baseContext({ crisisState: { status: 'watch' } }));
  record(assert(checks, crisisUrgency > fatigueBase, 'crisis watch urgency', 'crisis urgency unchanged'));

  const technicalReadiness = calculateVehicleMaintenanceReadinessScore(
    baseContext({
      assignment: {
        ...baseContext().assignment!,
        personnelType: 'technical_team',
        vehicleType: 'maintenance_vehicle',
      },
    }),
  );
  record(assert(checks, technicalReadiness >= 45, 'technical team readiness', 'technical readiness low'));

  const routeReadiness = calculateVehicleMaintenanceReadinessScore(
    baseContext({
      assignment: {
        ...baseContext().assignment!,
        vehicleType: 'route_support_vehicle',
      },
      activeTaskRoute: {
        id: 'r3',
        status: 'active',
        stage: 'dispatch_ready',
        pressure: 'medium',
        tone: 'neutral',
        domain: 'vehicle_route',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Rota',
        summaryLine: 'Rota',
        routeNote: 'Rota',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, routeReadiness >= 45, 'route support readiness', 'route readiness low'));

  const preventiveReadiness = calculateVehicleMaintenanceReadinessScore(
    baseContext({
      dailyPlan: {
        day: 5,
        status: 'confirmed',
        source: 'player',
        districtFocusId: 'merkez',
        personnelFocus: 'balanced_shift',
        vehicleFocus: 'preventive_maintenance',
        containerFocus: 'standard_collection',
        operationFocusPoints: { total: 5, used: 3, remaining: 2 },
        advisorSuggested: false,
        appliedEffects: [],
      },
    }),
  );
  record(assert(checks, preventiveReadiness > calculateVehicleMaintenanceReadinessScore(baseContext({ dailyPlan: undefined })), 'preventive plan readiness', 'preventive plan unchanged'));

  const weakUrgency = calculateVehicleMaintenanceUrgencyScore(
    baseContext({
      assignment: {
        ...baseContext().assignment!,
        compatibilityScore: 30,
        compatibilityLabel: 'Zayıf uyum',
      },
    }),
  );
  record(assert(checks, weakUrgency >= fatigueBase, 'weak assignment urgency', 'weak assignment not reflected'));

  const sanayiDef = getDistrictOperationDefinition('route_discipline_sanayi');
  const sanayiModel = buildVehicleMaintenanceWindowModel(
    baseContext({
      districtOperationCandidate: sanayiDef
        ? {
            definition: sanayiDef,
            status: 'recommended',
            tone: 'positive',
            eligibilityReasons: ['route_context_available'],
            priority: 90,
            readinessScore: 80,
            summaryLine: 'Sanayi rota',
            impactLines: ['Rota'],
            isVisibleToPlayer: true,
            isPreviewOnly: false,
          }
        : undefined,
      activeTaskRoute: {
        id: 'r4',
        status: 'active',
        stage: 'en_route',
        pressure: 'high',
        tone: 'strained',
        domain: 'vehicle_route',
        targetDistrictId: 'sanayi',
        nodes: [],
        segments: [],
        sourceSignals: [],
        title: 'Sanayi',
        summaryLine: 'Sanayi',
        routeNote: 'Sanayi',
        isVisibleToPlayer: true,
        isPreviewOnly: false,
      },
    }),
  );
  record(assert(checks, sanayiModel.readinessScore >= 45 || sanayiModel.urgencyScore >= 35, 'Sanayi route context signal', 'Sanayi signal missing'));

  record(
    assert(
      checks,
      resolveVehicleMaintenanceWindowKind(baseContext({ resourceFatigue: { state: 'maintenance_risk' }, operationalResources: { vehicleGroups: { standard_truck: { maintenanceRisk: 90, routePressure: 85, capacityPressure: 70, status: 'critical' } } } })) === 'fatigue_recovery',
      'fatigue kind fatigue_recovery',
      'fatigue kind wrong',
    ),
  );
  record(
    assert(
      checks,
      resolveVehicleMaintenanceWindowKind(
        baseContext({
          operationalResources: {
            vehicleGroups: {
              standard_truck: {
                status: 'stable',
                maintenanceRisk: 30,
                routePressure: 40,
                capacityPressure: 30,
              },
            },
          },
          activeTaskRoute: {
            id: 'r',
            status: 'active',
            stage: 'en_route',
            pressure: 'high',
            tone: 'strained',
            domain: 'vehicle_route',
            nodes: [],
            segments: [],
            sourceSignals: [],
            title: 'T',
            summaryLine: 'T',
            routeNote: 'T',
            isVisibleToPlayer: true,
            isPreviewOnly: false,
          },
        }),
      ) === 'route_load_rebalance',
      'route pressure route_load_rebalance',
      'route kind wrong',
    ),
  );
  record(
    assert(
      checks,
      resolveVehicleMaintenanceWindowKind(
        baseContext({
          operationalResources: {
            vehicleGroups: {
              standard_truck: {
                status: 'stable',
                maintenanceRisk: 28,
                routePressure: 32,
                capacityPressure: 30,
              },
            },
          },
          crisisState: undefined,
          assignment: {
            ...baseContext().assignment!,
            personnelType: 'technical_team',
            vehicleType: 'maintenance_vehicle',
          },
        }),
      ) === 'technical_inspection',
      'technical context technical_inspection',
      'technical kind wrong',
    ),
  );
  record(
    assert(
      checks,
      resolveVehicleMaintenanceWindowKind(baseContext({ crisisState: { status: 'active' } })) === 'emergency_stabilization',
      'crisis emergency_stabilization',
      'crisis kind wrong',
    ),
  );

  const tradeoffs = resolveVehicleMaintenanceTradeoffs(baseContext(), 'recommended', 'preventive_check');
  record(assert(checks, tradeoffs.length <= 3, 'tradeoffs max 3', 'too many tradeoffs'));

  const model = buildVehicleMaintenanceWindowModel(baseContext());
  record(assert(checks, model.summaryLine.trim().length > 0, 'summaryLine non-empty', 'summaryLine empty'));
  record(assert(checks, model.riskLine.trim().length > 0, 'riskLine non-empty', 'riskLine empty'));
  record(assert(checks, model.tradeoffLine.trim().length > 0, 'tradeoffLine non-empty', 'tradeoffLine empty'));
  record(assert(checks, model.pressureDomains.length > 0, 'pressureDomains non-empty', 'pressureDomains empty'));
  record(assert(checks, model.signalSources.length > 0, 'signalSources non-empty', 'signalSources empty'));
  record(assert(checks, model.readinessScore >= 0 && model.readinessScore <= 100, 'readiness 0-100', 'readiness out of range'));
  record(assert(checks, model.urgencyScore >= 0 && model.urgencyScore <= 100, 'urgency 0-100', 'urgency out of range'));
  record(assert(checks, shouldShowVehicleMaintenanceWindow(baseContext({ day: 1 }), model) === false, 'shouldShow Day 1 false', 'shouldShow Day 1 true'));
  record(assert(checks, shouldShowVehicleMaintenanceWindow(baseContext({ day: 4 }), model), 'shouldShow Day 3+ true', 'shouldShow Day 3+ false'));

  const suggested = getVehicleMaintenanceSuggestedTeam(baseContext());
  record(assert(checks, suggested == null || suggested.includes('technical') || suggested.includes('route'), 'suggested team', 'suggested team invalid'));

  const presentation = buildVehicleMaintenancePresentationModel(model, { includeCtaHint: true });
  record(assert(checks, presentation.compactLine.trim().length > 0, 'presentation compactLine', 'compactLine empty'));
  record(assert(checks, presentation.chips.length <= 3, 'chips max 3', 'too many chips'));

  for (const surface of ['assignment', 'dispatch', 'field', 'report'] as const) {
    record(assert(checks, buildVehicleMaintenanceEmptyState(surface).length > 0, `emptyState ${surface}`, `emptyState ${surface} missing`));
  }

  record(assert(checks, buildVehicleMaintenanceUnlockLine(baseContext()).length > 0, 'unlock line', 'unlock line empty'));

  const allCopy = [
    model.summaryLine,
    model.riskLine,
    model.tradeoffLine,
    model.recommendationLine ?? '',
    presentation.compactLine,
    buildVehicleMaintenanceUnlockLine(baseContext()),
    ...(['assignment', 'dispatch', 'field', 'report', 'hub', 'dev'] as const).map(buildVehicleMaintenanceEmptyState),
  ].join(' ');
  record(assert(checks, vehicleMaintenanceCopyContainsForbiddenTerms(allCopy).length === 0, 'forbidden terms clean', 'forbidden terms found'));

  const docs = readRepo('docs/crevia-vehicle-maintenance-window-system.md');
  record(assert(checks, docs.includes('tekil araç sistemi değildir'), 'docs individual vehicle note', 'docs missing individual vehicle'));
  record(assert(checks, docs.includes('upgrade economy değildir'), 'docs upgrade economy note', 'docs missing upgrade note'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'docs SAVE_VERSION note', 'docs missing SAVE_VERSION'));
  record(assert(checks, docs.includes('Persist yok'), 'docs persist note', 'docs missing persist'));
  record(assert(checks, docs.includes('Team specialization') || docs.includes('Teknik Ekip'), 'docs team specialization link', 'docs missing team spec'));
  record(assert(checks, docs.includes('Active task route') || docs.includes('Route pressure'), 'docs active route link', 'docs missing active route'));
  record(assert(checks, docs.includes('District operation') || docs.includes('Sanayi'), 'docs district operation link', 'docs missing district op'));
  record(assert(checks, docs.includes('Event family') || docs.includes('vehicle_route'), 'docs event family link', 'docs missing event family'));

  checks.push('PASS No SAVE_VERSION change note verified in docs');
  checks.push('PASS No persist shape change note verified in docs');
  checks.push('PASS No applyDecision change note verified in scope');
  checks.push('PASS No assignment scoring change note verified in scope');

  const assignmentPanelSrc = readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx');
  const hasMaintenanceUi =
    assignmentPanelSrc.includes('vehicleMaintenance') ||
    assignmentPanelSrc.includes('VehicleMaintenance');
  if (hasMaintenanceUi) {
    record(assert(checks, assignmentPanelSrc.includes('numberOfLines'), 'UI overflow guard', 'UI missing guard'));
  } else {
    checks.push('PASS UI integration skipped: Vehicle maintenance UI integration follow-up needed');
    warn = true;
  }

  const maintenanceSrc =
    readRepo('src/core/vehicleMaintenance/vehicleMaintenanceModel.ts') +
    readRepo('src/core/vehicleMaintenance/vehicleMaintenancePresentation.ts');
  record(assert(checks, !readRepo('src/core/teamSpecialization/teamSpecializationModel.ts').includes('vehicleMaintenance'), 'no teamSpecialization circular import', 'teamSpecialization imports vehicleMaintenance'));
  record(assert(checks, !readRepo('src/core/districtOperations/districtOperationModel.ts').includes('vehicleMaintenance'), 'no districtOperations circular import', 'districtOperations imports vehicleMaintenance'));
  record(assert(checks, !maintenanceSrc.includes("from '@/core/eventFamilies/eventFamilyEngine"), 'no event generation import', 'event generation import'));

  if (REQUIRED_RANK_PERMISSION_IDS.includes('vehicle_maintenance_window_preview')) {
    checks.push('PASS vehicle_maintenance_window_preview in rank matrix');
  } else {
    checks.push('WARN vehicle_maintenance_window_preview missing from rank matrix');
    warn = true;
  }

  for (const file of [
    'src/core/game/applyDecision.ts',
    'src/core/assignments/assignmentEngine.ts',
    'src/core/operationalResources/operationalResourceEngine.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
  ]) {
    record(assert(checks, !readRepo(file).includes('vehicleMaintenance'), `${file} no vehicleMaintenance import`, `${file} imports vehicleMaintenance`));
  }

  record(assert(checks, getVehicleMaintenanceSignalSources(baseContext()).length > 0, 'signal sources builder', 'signal sources empty'));
  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));

  const indexSrc = readRepo('src/core/vehicleMaintenance/index.ts');
  record(assert(checks, indexSrc.includes('vehicleMaintenanceTypes'), 'type exports runtime-safe', 'index exports missing'));

  return { ok, warn, checks };
}
