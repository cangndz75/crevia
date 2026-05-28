import {
  applyVehicleDecisionEffects,
  getVehicleDecisionDeltasForAction,
  inferVehicleDecisionAction,
} from './vehicleDecisionEffects';
import { selectVehicleImpactPreviewForDecision } from './vehiclePresentation';
import {
  buildDailyVehicleSummaryLines,
  buildVehicleFleetStatus,
} from './vehicleUiHelpers';
import {
  processVehiclesEndOfDay,
  recomputeVehicleAfterDay,
} from './vehicleEngine';
import {
  processVehiclesAfterDecisionForStore,
  processVehiclesEndOfDayForStore,
} from './vehicleIntegration';
import {
  createInitialVehicleState,
  isVehicleUnitCritical,
  recomputeVehicleAggregates,
} from './vehicleSeed';
import {
  applyVehicleFleetAction,
  canApplyVehicleFleetAction,
  selectRecommendedVehicleFleetActions,
} from './vehicleManualActions';
import {
  scoreVehicleForAssignment,
  selectAvailableVehicles,
  selectBestVehicleForCategory,
  selectVehicleAggregates,
  selectVehicleById,
  selectVehicleState,
  selectVehicleUnits,
  selectVehiclesByCategory,
} from './vehicleSelectors';
import type {
  VehicleDecisionChoiceInput,
  VehicleDecisionEventInput,
  VehicleState,
  VehicleUnit,
} from './vehicleTypes';

const MOCK_WASTE_EVENT: VehicleDecisionEventInput = {
  id: 'ev-waste-test',
  title: 'Konteyner taşması ve koku şikayeti',
  category: 'waste',
  neighborhoodId: 'sanayi',
};

function mockDecision(
  partial: Partial<VehicleDecisionChoiceInput> & { id: string; title: string },
): VehicleDecisionChoiceInput {
  return {
    description: partial.title,
    ...partial,
  };
}

function isUnitMetricsInRange(unit: VehicleUnit): boolean {
  const fields = [
    unit.condition,
    unit.fuelOrCharge,
    unit.workload,
    unit.routeEfficiency,
    unit.maintenanceNeed,
    unit.breakdownRisk,
  ];
  return fields.every((value) => value >= 0 && value <= 100);
}

function unitsDeepEqual(a: VehicleUnit[], b: VehicleUnit[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function withLastProcessedDay(
  state: VehicleState,
  lastProcessedDay: number,
): VehicleState {
  return { ...state, lastProcessedDay };
}

function withUnitAtIndex(
  state: VehicleState,
  index: number,
  patch: Partial<VehicleUnit>,
): VehicleState {
  return {
    ...state,
    units: state.units.map((unit, i) =>
      i === index ? { ...unit, ...patch } : unit,
    ),
  };
}

/** Aşama 1–2 smoke doğrulaması — seed, selector ve günlük motor regresyonu. */
export function verifyVehicleScenario(): {
  ok: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let ok = true;

  const pass = (message: string) => checks.push(`PASS ${message}`);
  const fail = (message: string) => {
    ok = false;
    checks.push(`FAIL ${message}`);
  };

  const state = createInitialVehicleState(1);

  if (state.units.length !== 6) {
    fail(`createInitialVehicleState unit count=${state.units.length}`);
  } else {
    pass('createInitialVehicleState produces 6 units');
  }

  const ids = state.units.map((unit) => unit.id);
  if (new Set(ids).size !== ids.length) {
    fail('vehicle ids are not unique');
  } else {
    pass('vehicle ids are unique');
  }

  const outOfRange = state.units.filter((unit) => !isUnitMetricsInRange(unit));
  if (outOfRange.length > 0) {
    fail(`numeric fields out of range count=${outOfRange.length}`);
  } else {
    pass('numeric fields within 0-100');
  }

  if (state.aggregates.total !== state.units.length) {
    fail(
      `aggregates.total mismatch total=${state.aggregates.total} units=${state.units.length}`,
    );
  } else {
    pass('aggregates.total matches units.length');
  }

  const availableUnits = selectAvailableVehicles(state);
  if (state.aggregates.available !== availableUnits.length) {
    fail(
      `available aggregate mismatch aggregate=${state.aggregates.available} actual=${availableUnits.length}`,
    );
  } else {
    pass('available aggregate matches available units');
  }

  const bestGarbage = selectBestVehicleForCategory(state, 'garbage_truck');
  if (!bestGarbage) {
    fail('selectBestVehicleForCategory garbage_truck returned null');
  } else if (bestGarbage.category !== 'garbage_truck') {
    fail('selectBestVehicleForCategory garbage_truck wrong category');
  } else {
    pass('selectBestVehicleForCategory garbage_truck returns a vehicle');
  }

  const manualCritical = state.units.filter(isVehicleUnitCritical).length;
  const recomputed = recomputeVehicleAggregates(state.units);
  if (recomputed.criticalCount !== manualCritical) {
    fail(
      `criticalCount mismatch aggregate=${recomputed.criticalCount} manual=${manualCritical}`,
    );
  } else {
    pass('criticalCount is deterministic');
  }

  const root = { vehicleState: state };
  const beforeUnits = selectVehicleUnits(state);
  const beforeAggregates = selectVehicleAggregates(state);

  selectVehicleState(root);
  selectVehicleUnits(state);
  selectVehicleAggregates(state);
  selectVehiclesByCategory(state, 'garbage_truck');
  selectVehicleById(state, state.units[0]?.id ?? '');
  scoreVehicleForAssignment(state.units[0]!);

  const afterUnits = selectVehicleUnits(state);
  const afterAggregates = selectVehicleAggregates(state);

  if (
    !unitsDeepEqual(beforeUnits, afterUnits) ||
    JSON.stringify(beforeAggregates) !== JSON.stringify(afterAggregates)
  ) {
    fail('selectors mutated vehicle state');
  } else {
    pass('selectors do not mutate state');
  }

  const day1Ready = withLastProcessedDay(state, 0);
  const day1Once = processVehiclesEndOfDay(day1Ready, 1);
  const day1Twice = processVehiclesEndOfDay(day1Once, 1);

  if (JSON.stringify(day1Once) !== JSON.stringify(day1Twice)) {
    fail('processVehiclesEndOfDay mutates state on second run same day');
  } else {
    pass('processVehiclesEndOfDay idempotent for same day');
  }

  const baselineUnit = day1Ready.units[0]!;
  const assignedReady = withUnitAtIndex(day1Ready, 0, {
    operationalStatus: 'assigned',
  });
  const availableReady = withUnitAtIndex(day1Ready, 0, {
    operationalStatus: 'available',
  });
  const afterAssigned = processVehiclesEndOfDay(assignedReady, 1).units[0]!;
  const afterAvailable = processVehiclesEndOfDay(availableReady, 1).units[0]!;
  const assignedWorkloadGain = afterAssigned.workload - baselineUnit.workload;
  const availableWorkloadGain = afterAvailable.workload - baselineUnit.workload;

  if (assignedWorkloadGain <= availableWorkloadGain) {
    fail(
      `assigned workload gain not greater than available assigned=${assignedWorkloadGain} available=${availableWorkloadGain}`,
    );
  } else {
    pass('assigned vehicle gains more workload than available');
  }

  const maintenanceReady = withLastProcessedDay(
    withUnitAtIndex(state, 2, {
      operationalStatus: 'maintenance',
      condition: 50,
      maintenanceNeed: 70,
      breakdownRisk: 40,
    }),
    0,
  );
  const maintenanceBefore = maintenanceReady.units[2]!;
  const maintenanceAfter = processVehiclesEndOfDay(maintenanceReady, 1).units[2]!;

  if (
    maintenanceAfter.condition <= maintenanceBefore.condition ||
    maintenanceAfter.breakdownRisk >= maintenanceBefore.breakdownRisk
  ) {
    fail('maintenance status did not improve condition or reduce breakdownRisk');
  } else {
    pass('maintenance status improves condition and lowers breakdownRisk');
  }

  const brokenReady = withLastProcessedDay(
    withUnitAtIndex(state, 3, {
      operationalStatus: 'broken',
      condition: 15,
      breakdownRisk: 95,
    }),
    0,
  );
  const brokenAfter = processVehiclesEndOfDay(brokenReady, 1).units[3]!;

  if (brokenAfter.operationalStatus !== 'broken') {
    fail(`broken vehicle auto-repaired to ${brokenAfter.operationalStatus}`);
  } else {
    pass('broken vehicle stays broken after end of day');
  }

  const eodOutOfRange = day1Once.units.filter((unit) => !isUnitMetricsInRange(unit));
  if (eodOutOfRange.length > 0) {
    fail(`end-of-day metrics out of range count=${eodOutOfRange.length}`);
  } else {
    pass('end-of-day metrics stay within 0-100');
  }

  if (
    day1Once.lastProcessedDay !== 1 ||
    day1Once.aggregates.total !== day1Once.units.length
  ) {
    fail('end-of-day aggregates or lastProcessedDay not updated');
  } else {
    pass('end-of-day recomputes aggregates and lastProcessedDay');
  }

  const assignedReturnReady = withLastProcessedDay(
    withUnitAtIndex(state, 0, { operationalStatus: 'assigned' }),
    0,
  );
  const restingReturnReady = withLastProcessedDay(
    withUnitAtIndex(state, 1, { operationalStatus: 'resting' }),
    0,
  );
  const assignedReturn = processVehiclesEndOfDay(assignedReturnReady, 1).units[0]!;
  const restingReturn = processVehiclesEndOfDay(restingReturnReady, 1).units[1]!;

  if (assignedReturn.operationalStatus !== 'available') {
    fail(`assigned vehicle did not return available: ${assignedReturn.operationalStatus}`);
  } else {
    pass('assigned vehicle returns to available after end of day');
  }

  if (restingReturn.operationalStatus !== 'available') {
    fail(`resting vehicle did not return available: ${restingReturn.operationalStatus}`);
  } else {
    pass('resting vehicle returns to available after end of day');
  }

  const storeFallback = processVehiclesEndOfDayForStore(undefined, 1);
  if (storeFallback.units.length === 0 || storeFallback.lastProcessedDay < 1) {
    fail('processVehiclesEndOfDayForStore invalid fallback for undefined input');
  } else {
    pass('processVehiclesEndOfDayForStore safe fallback for undefined input');
  }

  const mutatedInput = createInitialVehicleState(1);
  const frozenWorkload = mutatedInput.units[0]!.workload;
  recomputeVehicleAfterDay(mutatedInput.units[0]!, {
    dayModifiers: mutatedInput.dayModifiers,
  });
  if (mutatedInput.units[0]!.workload !== frozenWorkload) {
    fail('recomputeVehicleAfterDay mutated input unit');
  } else {
    pass('recomputeVehicleAfterDay does not mutate input');
  }

  const collectionAction = inferVehicleDecisionAction(
    MOCK_WASTE_EVENT,
    mockDecision({
      id: 'd-collect',
      title: 'Çöp toplama ekibini sahaya gönder',
    }),
  );
  if (collectionAction !== 'dispatch_collection') {
    fail(`waste collection classify=${collectionAction}`);
  } else {
    pass('inferVehicleDecisionAction dispatch_collection for waste decision');
  }

  const routeAction = inferVehicleDecisionAction(
    { id: 'ev-route', title: 'Şehir içi lojistik planı' },
    mockDecision({
      id: 'd-route',
      title: 'Rotayı optimize et ve güzergahı önceliklendir',
    }),
  );
  if (routeAction !== 'prioritize_route') {
    fail(`route classify=${routeAction}`);
  } else {
    pass('inferVehicleDecisionAction prioritize_route for route decision');
  }

  const maintenanceAction = inferVehicleDecisionAction(
    MOCK_WASTE_EVENT,
    mockDecision({
      id: 'd-maint',
      title: 'Araç bakım ve tamir servisi planla',
    }),
  );
  if (maintenanceAction !== 'maintenance') {
    fail(`maintenance classify=${maintenanceAction}`);
  } else {
    pass('inferVehicleDecisionAction maintenance for repair decision');
  }

  const commAction = inferVehicleDecisionAction(
    { id: 'ev-social', title: 'Sosyal medya geri bildirimi' },
    mockDecision({
      id: 'd-comm',
      title: 'Halka duyuru ve iletişim açıklaması yap',
    }),
  );
  if (commAction !== 'none') {
    fail(`communication classify=${commAction}`);
  } else {
    pass('inferVehicleDecisionAction none for communication decision');
  }

  const decisionReadyState = withLastProcessedDay(createInitialVehicleState(1), 0);
  const collectionDecisionState = processVehiclesAfterDecisionForStore({
    vehicleState: decisionReadyState,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-collect-apply',
      title: 'Çöp toplama aracını sahaya yönlendir',
    }),
    day: 1,
  });
  const assignedGarbage = collectionDecisionState.units.find(
    (unit) =>
      unit.category === 'garbage_truck' &&
      unit.operationalStatus === 'assigned',
  );
  if (!assignedGarbage) {
    fail('dispatch_collection did not assign an available garbage_truck');
  } else {
    pass('processVehiclesAfterDecisionForStore assigns garbage_truck');
  }

  const changedUnits = collectionDecisionState.units.filter((unit, index) => {
    const before = decisionReadyState.units[index];
    return JSON.stringify(unit) !== JSON.stringify(before);
  });
  if (changedUnits.length !== 1) {
    fail(`decision effect changed ${changedUnits.length} units instead of 1`);
  } else {
    pass('decision effect updates only the selected vehicle');
  }

  const noGarbageAvailable = {
    ...decisionReadyState,
    units: decisionReadyState.units.map((unit) =>
      unit.category === 'garbage_truck'
        ? { ...unit, operationalStatus: 'assigned' as const }
        : unit,
    ),
    aggregates: recomputeVehicleAggregates(
      decisionReadyState.units.map((unit) =>
        unit.category === 'garbage_truck'
          ? { ...unit, operationalStatus: 'assigned' as const }
          : unit,
      ),
    ),
  };
  const noFallbackState = processVehiclesAfterDecisionForStore({
    vehicleState: noGarbageAvailable,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-collect-fallback',
      title: 'Çöp toplama rotasını öne al',
    }),
    day: 1,
  });
  const inspectionAssigned = noFallbackState.units.some(
    (unit) =>
      unit.category === 'inspection_vehicle' &&
      unit.operationalStatus === 'assigned',
  );
  if (inspectionAssigned) {
    fail('dispatch_collection incorrectly assigned non-preferred category');
  } else {
    pass('no fallback to wrong category when preferred unavailable');
  }

  const noneStateBefore = withLastProcessedDay(createInitialVehicleState(1), 0);
  const noneStateAfter = processVehiclesAfterDecisionForStore({
    vehicleState: noneStateBefore,
    event: { id: 'ev-comm', title: 'Muhtar görüşmesi' },
    decision: mockDecision({
      id: 'd-none',
      title: 'Sosyal medya duyurusu ve bilgilendirme',
    }),
    day: 1,
  });
  if (JSON.stringify(noneStateBefore) !== JSON.stringify(noneStateAfter)) {
    fail('none action changed vehicle state');
  } else {
    pass('none action leaves vehicle state unchanged');
  }

  const decisionMetricsOk = collectionDecisionState.units.every(isUnitMetricsInRange);
  if (!decisionMetricsOk) {
    fail('decision effect metrics out of 0-100 range');
  } else {
    pass('decision effect metrics stay within 0-100');
  }

  if (collectionDecisionState.aggregates.assigned < 1) {
    fail('decision aggregates not recomputed');
  } else {
    pass('decision recomputes aggregates');
  }

  if (collectionDecisionState.lastProcessedDay !== decisionReadyState.lastProcessedDay) {
    fail('decision effect changed lastProcessedDay');
  } else {
    pass('decision effect preserves lastProcessedDay');
  }

  const neighborhoodState = processVehiclesAfterDecisionForStore({
    vehicleState: withLastProcessedDay(createInitialVehicleState(1), 0),
    event: { ...MOCK_WASTE_EVENT, neighborhoodId: 'sanayi' },
    decision: mockDecision({
      id: 'd-neighborhood',
      title: 'Atık toplama aracını sahaya sevk et',
    }),
    day: 1,
  });
  const movedUnit = neighborhoodState.units.find(
    (unit) => unit.operationalStatus === 'assigned',
  );
  if (!movedUnit || movedUnit.currentNeighborhoodId !== 'sanayi') {
    fail('decision did not set currentNeighborhoodId from event');
  } else {
    pass('decision updates currentNeighborhoodId from event neighborhood');
  }

  const hoodBaseline = withLastProcessedDay(createInitialVehicleState(1), 0);
  const hoodTarget = hoodBaseline.units.find(
    (unit) => unit.category === 'garbage_truck',
  )!;
  const hoodBefore = hoodTarget.currentNeighborhoodId;
  const noNeighborhoodEvent = processVehiclesAfterDecisionForStore({
    vehicleState: hoodBaseline,
    event: { id: 'ev-waste-no-hood', title: 'Saha atık müdahalesi' },
    decision: mockDecision({
      id: 'd-no-hood',
      title: 'Çöp toplama ekibini gönder',
    }),
    day: 1,
  });
  const hoodAfter = noNeighborhoodEvent.units.find(
    (unit) => unit.id === hoodTarget.id,
  )!;
  if (hoodAfter.currentNeighborhoodId !== hoodBefore) {
    fail('missing neighborhood id changed currentNeighborhoodId');
  } else {
    pass('missing neighborhood id preserves currentNeighborhoodId');
  }

  const decisionEffectPure = applyVehicleDecisionEffects({
    vehicleState: decisionReadyState,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-pure',
      title: 'Konteyner toplama için çöp aracı gönder',
    }),
    day: 1,
  });
  if (decisionEffectPure.affectedVehicleId == null) {
    fail('applyVehicleDecisionEffects did not affect a vehicle');
  } else {
    pass('applyVehicleDecisionEffects returns affected vehicle id');
  }

  if (buildDailyVehicleSummaryLines(undefined).length !== 0) {
    fail('buildDailyVehicleSummaryLines should return [] for undefined');
  } else {
    pass('buildDailyVehicleSummaryLines returns [] for undefined state');
  }

  const brokenReportState = {
    ...withLastProcessedDay(createInitialVehicleState(1), 1),
    units: createInitialVehicleState(1).units.map((unit, index) =>
      index === 0
        ? { ...unit, operationalStatus: 'broken' as const, breakdownRisk: 95 }
        : unit,
    ),
  };
  brokenReportState.aggregates = recomputeVehicleAggregates(brokenReportState.units);
  const brokenLines = buildDailyVehicleSummaryLines(brokenReportState);
  if (!brokenLines[0]?.includes('arızalı')) {
    fail(`broken fleet line missing arızalı: ${brokenLines[0] ?? 'empty'}`);
  } else {
    pass('buildDailyVehicleSummaryLines reports broken vehicles first');
  }

  const criticalReportState = {
    ...withLastProcessedDay(createInitialVehicleState(1), 1),
    units: createInitialVehicleState(1).units.map((unit) => ({
      ...unit,
      condition: 30,
      maintenanceNeed: 80,
      breakdownRisk: 72,
    })),
  };
  criticalReportState.aggregates = recomputeVehicleAggregates(
    criticalReportState.units,
  );
  const criticalLines = buildDailyVehicleSummaryLines(criticalReportState);
  if (!criticalLines.some((line) => line.includes('kritik bakım'))) {
    fail('critical fleet summary missing kritik bakım line');
  } else {
    pass('buildDailyVehicleSummaryLines reports critical maintenance threshold');
  }

  const heavyWorkloadState = {
    ...withLastProcessedDay(createInitialVehicleState(1), 1),
    units: createInitialVehicleState(1).units.map((unit) => ({
      ...unit,
      workload: 82,
      operationalStatus: 'available' as const,
    })),
  };
  heavyWorkloadState.aggregates = recomputeVehicleAggregates(
    heavyWorkloadState.units,
  );
  const workloadLines = buildDailyVehicleSummaryLines(heavyWorkloadState);
  if (!workloadLines.some((line) => line.includes('yükü yüksek'))) {
    fail('high workload fleet summary missing workload line');
  } else {
    pass('buildDailyVehicleSummaryLines reports high average workload');
  }

  const calmFleet = buildVehicleFleetStatus(
    withLastProcessedDay(createInitialVehicleState(1), 1),
  );
  if (
    calmFleet.statusLabel !== 'Dengeli' &&
    calmFleet.statusLabel !== 'Rota Güçlü'
  ) {
    fail(`calm seed fleet status=${calmFleet.statusLabel}`);
  } else {
    pass('buildVehicleFleetStatus produces balanced seed status');
  }

  const fleetBroken = buildVehicleFleetStatus(brokenReportState);
  if (fleetBroken.statusLabel !== 'Arıza Var' || fleetBroken.statusTone !== 'danger') {
    fail(`broken fleet status=${fleetBroken.statusLabel} tone=${fleetBroken.statusTone}`);
  } else {
    pass('buildVehicleFleetStatus reports broken fleet as danger');
  }

  const fleetCritical = buildVehicleFleetStatus(criticalReportState);
  if (
    fleetCritical.statusLabel !== 'Bakım Riski' ||
    (fleetCritical.statusTone !== 'danger' && fleetCritical.statusTone !== 'warning')
  ) {
    fail(`critical fleet status=${fleetCritical.statusLabel} tone=${fleetCritical.statusTone}`);
  } else {
    pass('buildVehicleFleetStatus reports critical maintenance risk');
  }

  const lowCapacityState = {
    ...withLastProcessedDay(createInitialVehicleState(1), 1),
    units: createInitialVehicleState(1).units.map((unit, index) => ({
      ...unit,
      operationalStatus: index < 4 ? ('assigned' as const) : ('available' as const),
    })),
  };
  lowCapacityState.aggregates = recomputeVehicleAggregates(lowCapacityState.units);
  const fleetLowCapacity = buildVehicleFleetStatus(lowCapacityState);
  if (fleetLowCapacity.statusLabel !== 'Kapasite Düşük') {
    fail(`low capacity fleet status=${fleetLowCapacity.statusLabel}`);
  } else {
    pass('buildVehicleFleetStatus reports low available capacity');
  }

  const fleetHeavy = buildVehicleFleetStatus(heavyWorkloadState);
  if (fleetHeavy.statusLabel !== 'Yoğun Filo') {
    fail(`heavy workload fleet status=${fleetHeavy.statusLabel}`);
  } else {
    pass('buildVehicleFleetStatus reports high workload fleet');
  }

  const fleetMutateBase = withLastProcessedDay(createInitialVehicleState(1), 1);
  const fleetMutateSnapshot = JSON.stringify(fleetMutateBase);
  buildVehicleFleetStatus(fleetMutateBase);
  if (JSON.stringify(fleetMutateBase) !== fleetMutateSnapshot) {
    fail('buildVehicleFleetStatus mutated vehicleState');
  } else {
    pass('buildVehicleFleetStatus does not mutate state');
  }

  if (
    calmFleet.availableCount !== calmFleet.totalCount ||
    calmFleet.totalCount !== 6
  ) {
    fail(
      `fleet counts mismatch available=${calmFleet.availableCount} total=${calmFleet.totalCount}`,
    );
  } else {
    pass('buildVehicleFleetStatus returns correct available/total counts');
  }

  const calmLines = buildDailyVehicleSummaryLines(
    withLastProcessedDay(createInitialVehicleState(1), 1),
  );
  if (
    !calmLines.some(
      (line) =>
        line.includes('dengeli') ||
        line.includes('Rota verimi güçlü'),
    )
  ) {
    fail(`calm fleet summary missing balanced line: ${calmLines.join(' | ')}`);
  } else {
    pass('buildDailyVehicleSummaryLines reports balanced fleet line');
  }

  const noisyState = {
    ...criticalReportState,
    units: criticalReportState.units.map((unit, index) =>
      index === 0
        ? { ...unit, operationalStatus: 'broken' as const }
        : { ...unit, operationalStatus: 'assigned' as const, workload: 90 },
    ),
  };
  noisyState.aggregates = recomputeVehicleAggregates(noisyState.units);
  if (buildDailyVehicleSummaryLines(noisyState).length > 3) {
    fail('buildDailyVehicleSummaryLines exceeds 3 lines');
  } else {
    pass('buildDailyVehicleSummaryLines caps at 3 lines');
  }

  const reportMutateBase = withLastProcessedDay(createInitialVehicleState(1), 1);
  const reportMutateSnapshot = JSON.stringify(reportMutateBase);
  buildDailyVehicleSummaryLines(reportMutateBase);
  if (JSON.stringify(reportMutateBase) !== reportMutateSnapshot) {
    fail('buildDailyVehicleSummaryLines mutated vehicleState');
  } else {
    pass('buildDailyVehicleSummaryLines does not mutate state');
  }

  const nonePreview = selectVehicleImpactPreviewForDecision({
    vehicleState: decisionReadyState,
    event: { id: 'ev-comm', title: 'Muhtar görüşmesi' },
    decision: mockDecision({
      id: 'd-preview-none',
      title: 'Sosyal medya duyurusu ve bilgilendirme',
    }),
    day: 1,
  });
  if (nonePreview.shouldShow || nonePreview.action !== 'none') {
    fail('preview none shouldShow=false');
  } else {
    pass('preview communication/none has shouldShow false');
  }

  const collectionPreview = selectVehicleImpactPreviewForDecision({
    vehicleState: decisionReadyState,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-preview-collect',
      title: 'Çöp toplama aracını sahaya yönlendir',
    }),
    day: 1,
  });
  if (
    !collectionPreview.available ||
    collectionPreview.action !== 'dispatch_collection' ||
    !collectionPreview.vehicleId?.includes('garbage')
  ) {
    fail('preview dispatch_collection missing garbage_truck');
  } else {
    pass('preview dispatch_collection selects garbage_truck');
  }

  const noTruckState = {
    ...decisionReadyState,
    units: decisionReadyState.units.map((unit) =>
      unit.category === 'garbage_truck' || unit.category === 'utility_pickup'
        ? { ...unit, operationalStatus: 'assigned' as const }
        : unit,
    ),
  };
  const unavailablePreview = selectVehicleImpactPreviewForDecision({
    vehicleState: noTruckState,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-preview-unavail',
      title: 'Atık toplama için çöp aracı gönder',
    }),
    day: 1,
  });
  if (unavailablePreview.available || !unavailablePreview.shouldShow) {
    fail('preview unavailable should be available=false shouldShow=true');
  } else {
    pass('preview unavailable sets available false and shouldShow true');
  }

  const riskyState = {
    ...decisionReadyState,
    units: decisionReadyState.units.map((unit) =>
      unit.category === 'garbage_truck'
        ? {
            ...unit,
            operationalStatus: 'available' as const,
            breakdownRisk: 58,
            maintenanceNeed: 68,
            condition: 42,
          }
        : unit,
    ),
  };
  const highRiskPreview = selectVehicleImpactPreviewForDecision({
    vehicleState: riskyState,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-preview-risk',
      title: 'Çöp toplama ekibini acil sahaya gönder',
    }),
    day: 1,
  });
  if (highRiskPreview.riskLevel !== 'high') {
    fail(`preview high risk expected high got ${highRiskPreview.riskLevel}`);
  } else {
    pass('preview high risk threshold returns riskLevel high');
  }

  const previewMutateBase = withLastProcessedDay(createInitialVehicleState(1), 0);
  const previewMutateSnapshot = JSON.stringify(previewMutateBase);
  selectVehicleImpactPreviewForDecision({
    vehicleState: previewMutateBase,
    event: MOCK_WASTE_EVENT,
    decision: mockDecision({
      id: 'd-preview-mutate',
      title: 'Konteyner toplama için çöp aracı gönder',
    }),
    day: 1,
  });
  if (JSON.stringify(previewMutateBase) !== previewMutateSnapshot) {
    fail('preview mutated vehicleState');
  } else {
    pass('preview does not mutate vehicleState');
  }

  const classifyDecision = mockDecision({
    id: 'd-preview-classify',
    title: 'Rotayı optimize et ve güzergahı önceliklendir',
  });
  const classifyEvent = { id: 'ev-route', title: 'Şehir içi lojistik planı' };
  const previewAction = selectVehicleImpactPreviewForDecision({
    vehicleState: decisionReadyState,
    event: classifyEvent,
    decision: classifyDecision,
    day: 1,
  }).action;
  const inferredAction = inferVehicleDecisionAction(
    classifyEvent,
    classifyDecision,
  );
  if (previewAction !== inferredAction) {
    fail(`preview/apply classify mismatch preview=${previewAction} infer=${inferredAction}`);
  } else {
    pass('preview uses same action classification as apply');
  }

  const deltaDecision = mockDecision({
    id: 'd-preview-delta',
    title: 'Çöp toplama rotasını sahaya gönder',
  });
  const previewDeltas = selectVehicleImpactPreviewForDecision({
    vehicleState: decisionReadyState,
    event: MOCK_WASTE_EVENT,
    decision: deltaDecision,
    day: 1,
  });
  const applyDeltas = getVehicleDecisionDeltasForAction(
    'dispatch_collection',
    deltaDecision,
  );
  if (
    previewDeltas.workloadDelta !== applyDeltas.workload ||
    previewDeltas.fuelDelta !== applyDeltas.fuelOrCharge ||
    previewDeltas.breakdownRiskDelta !== applyDeltas.breakdownRisk
  ) {
    fail('preview deltas mismatch apply delta helper');
  } else {
    pass('preview deltas match getVehicleDecisionDeltasForAction');
  }

  const manualDay = 3;
  const manualBase = withLastProcessedDay(createInitialVehicleState(1), manualDay);
  const maintenanceTarget = manualBase.units[1]!;
  const stressedForMaintenance = {
    ...manualBase,
    units: manualBase.units.map((unit) =>
      unit.id === maintenanceTarget.id
        ? {
            ...unit,
            operationalStatus: 'available' as const,
            maintenanceNeed: 62,
            condition: 52,
            breakdownRisk: 38,
          }
        : unit,
    ),
    aggregates: recomputeVehicleAggregates(
      manualBase.units.map((unit) =>
        unit.id === maintenanceTarget.id
          ? {
              ...unit,
              operationalStatus: 'available' as const,
              maintenanceNeed: 62,
              condition: 52,
              breakdownRisk: 38,
            }
          : unit,
      ),
    ),
  };

  const maintenanceResult = applyVehicleFleetAction(stressedForMaintenance, {
    type: 'send_to_maintenance',
    vehicleId: maintenanceTarget.id,
    day: manualDay,
  });
  const maintainedUnit = maintenanceResult.state.units.find(
    (u) => u.id === maintenanceTarget.id,
  );
  if (
    !maintenanceResult.applied ||
    maintainedUnit?.operationalStatus !== 'maintenance'
  ) {
    fail('send_to_maintenance did not move risky vehicle to maintenance');
  } else {
    pass('send_to_maintenance available risky vehicle -> maintenance');
  }

  const brokenUnit = manualBase.units[0]!;
  const brokenMaintenance = applyVehicleFleetAction(
    {
      ...manualBase,
      units: manualBase.units.map((unit) =>
        unit.id === brokenUnit.id
          ? { ...unit, operationalStatus: 'broken' as const }
          : unit,
      ),
    },
    {
      type: 'send_to_maintenance',
      vehicleId: brokenUnit.id,
      day: manualDay,
    },
  );
  if (brokenMaintenance.applied) {
    fail('send_to_maintenance should not apply to broken vehicle');
  } else {
    pass('send_to_maintenance blocked for broken vehicle');
  }

  const restTarget = manualBase.units[2]!;
  const restReady = {
    ...manualBase,
    units: manualBase.units.map((unit) =>
      unit.id === restTarget.id
        ? {
            ...unit,
            operationalStatus: 'available' as const,
            workload: 72,
            breakdownRisk: 30,
          }
        : unit,
    ),
    aggregates: recomputeVehicleAggregates(
      manualBase.units.map((unit) =>
        unit.id === restTarget.id
          ? {
              ...unit,
              operationalStatus: 'available' as const,
              workload: 72,
              breakdownRisk: 30,
            }
          : unit,
      ),
    ),
  };
  const restResult = applyVehicleFleetAction(restReady, {
    type: 'rest_vehicle',
    vehicleId: restTarget.id,
    day: manualDay,
  });
  const restedUnit = restResult.state.units.find((u) => u.id === restTarget.id);
  if (!restResult.applied || restedUnit?.operationalStatus !== 'resting') {
    fail('rest_vehicle did not move high-workload vehicle to resting');
  } else {
    pass('rest_vehicle high workload vehicle -> resting');
  }

  const calmTarget = manualBase.units[4]!;
  const calmGate = canApplyVehicleFleetAction(
    manualBase,
    'rest_vehicle',
    calmTarget.id,
    manualDay,
  );
  if (calmGate.allowed) {
    fail('rest_vehicle should be blocked on low workload vehicle');
  } else {
    pass('rest_vehicle blocked on low workload vehicle');
  }

  const routeTarget = manualBase.units[4]!;
  const routeReady = {
    ...manualBase,
    units: manualBase.units.map((unit) =>
      unit.id === routeTarget.id
        ? {
            ...unit,
            operationalStatus: 'available' as const,
            routeEfficiency: 48,
            fuelOrCharge: 70,
          }
        : unit,
    ),
    aggregates: recomputeVehicleAggregates(
      manualBase.units.map((unit) =>
        unit.id === routeTarget.id
          ? {
              ...unit,
              operationalStatus: 'available' as const,
              routeEfficiency: 48,
              fuelOrCharge: 70,
            }
          : unit,
      ),
    ),
  };
  const routeResult = applyVehicleFleetAction(routeReady, {
    type: 'route_support',
    vehicleId: routeTarget.id,
    day: manualDay,
  });
  const routedUnit = routeResult.state.units.find((u) => u.id === routeTarget.id);
  if (
    !routeResult.applied ||
    routedUnit?.operationalStatus !== 'assigned' ||
    routedUnit?.assignedEventId !== `manual-route-support-${manualDay}`
  ) {
    fail('route_support did not assign available vehicle');
  } else {
    pass('route_support available vehicle with fuel -> assigned');
  }

  const lowFuelTarget = manualBase.units[5]!;
  const lowFuelGate = canApplyVehicleFleetAction(
    {
      ...manualBase,
      units: manualBase.units.map((unit) =>
        unit.id === lowFuelTarget.id
          ? { ...unit, operationalStatus: 'available' as const, fuelOrCharge: 18 }
          : unit,
      ),
    },
    'route_support',
    lowFuelTarget.id,
    manualDay,
  );
  if (lowFuelGate.allowed) {
    fail('route_support should be blocked when fuel is low');
  } else {
    pass('route_support blocked on low fuel vehicle');
  }

  if (!isUnitMetricsInRange(maintainedUnit!)) {
    fail('manual action metrics out of range after maintenance');
  } else {
    pass('manual action metrics stay within 0-100');
  }

  if (
    maintenanceResult.state.aggregates.inMaintenance <
    stressedForMaintenance.aggregates.inMaintenance
  ) {
    fail('manual action did not recompute aggregates');
  } else {
    pass('manual action recomputes aggregates');
  }

  const recs = selectRecommendedVehicleFleetActions(stressedForMaintenance, manualDay);
  if (recs.length > 2) {
    fail(`selectRecommendedVehicleFleetActions returned ${recs.length} items`);
  } else {
    pass('selectRecommendedVehicleFleetActions returns at most 2');
  }

  const mutateSnapshot = JSON.stringify(stressedForMaintenance);
  applyVehicleFleetAction(stressedForMaintenance, {
    type: 'send_to_maintenance',
    vehicleId: maintenanceTarget.id,
    day: manualDay,
  });
  if (JSON.stringify(stressedForMaintenance) !== mutateSnapshot) {
    fail('manual action helper mutated input state');
  } else {
    pass('manual action helper does not mutate input state');
  }

  return { ok, checks };
}

export function runVerifyVehicleScenario(): void {
  const result = verifyVehicleScenario();
  for (const line of result.checks) {
    // eslint-disable-next-line no-console
    console.log(`[vehicles] ${line}`);
  }
  // eslint-disable-next-line no-console
  console.log(`[vehicles] ${result.ok ? 'PASS' : 'FAIL'}`);
}

const isDirectRun =
  typeof process !== 'undefined' &&
  process.argv[1] != null &&
  /verifyVehicleScenario(?:\.ts)?$/i.test(process.argv[1]);

if (isDirectRun) {
  runVerifyVehicleScenario();
  const result = verifyVehicleScenario();
  process.exit(result.ok ? 0 : 1);
}
