import {
  CONTAINER_NEIGHBORHOOD_IDS,
  CONTAINER_OVERFLOW_RISK_PRIORITY,
} from './containerConstants';
import {
  applyContainerDecisionEffects,
  classifyContainerDecisionAction,
} from './containerDecisionEffects';
import { processContainersAfterDecision } from './containerIntegration';
import {
  applyContainerDailyUpdate,
  calculateDailyFillGain,
  clampContainerValue,
} from './containerEngine';
import { normalizeContainerNeighborhoodId } from './containerNeighborhoodBridge';
import { createInitialContainerState } from './containerSeed';
import {
  selectContainerSummaryLines,
  selectWorstContainerNeighborhood,
} from './containerSelectors';
import type { ContainerUnit, NeighborhoodContainerStatusLabel } from './containerTypes';

const ELEVATED_STATUS_LABELS: NeighborhoodContainerStatusLabel[] = [
  'Doluluk Artıyor',
  'Taşma Riski',
  'Koku Baskısı',
  'Bakım Gerekli',
  'Kritik',
];

function unitsMatch(a: ContainerUnit[], b: ContainerUnit[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((unit, index) => {
    const other = b[index];
    if (!other || unit.id !== other.id) {
      return false;
    }
    return (
      unit.fillRate === other.fillRate &&
      unit.odorLevel === other.odorLevel &&
      unit.condition === other.condition &&
      unit.maintenanceNeed === other.maintenanceNeed &&
      unit.status === other.status &&
      unit.overflowRisk === other.overflowRisk
    );
  });
}

function isUnitInRange(unit: ContainerUnit): boolean {
  const fields = [
    unit.capacity,
    unit.fillRate,
    unit.condition,
    unit.odorLevel,
    unit.maintenanceNeed,
    unit.complaintPressure,
  ];
  return fields.every((value) => value >= 0 && value <= 100);
}

/** Geliştirme doğrulaması — konteyner seed ve selector regresyonu. */
export function verifyContainerScenario(): {
  ok: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let ok = true;

  const state = createInitialContainerState(1);

  if (state.units.length !== 20) {
    ok = false;
    checks.push(`FAIL unit count=${state.units.length}`);
  } else {
    checks.push('OK 20 seed units');
  }

  const missingAggregates = CONTAINER_NEIGHBORHOOD_IDS.filter(
    (neighborhoodId) => !state.aggregates[neighborhoodId],
  );
  if (missingAggregates.length > 0) {
    ok = false;
    checks.push(`FAIL missing aggregates: ${missingAggregates.join(', ')}`);
  } else {
    checks.push('OK 5 canonical aggregates');
  }

  const outOfRange = state.units.filter((unit) => !isUnitInRange(unit));
  if (outOfRange.length > 0) {
    ok = false;
    checks.push(`FAIL out-of-range units=${outOfRange.length}`);
  } else {
    checks.push('OK numeric ranges 0-100');
  }

  const nonCanonical = state.units.filter(
    (unit) => !CONTAINER_NEIGHBORHOOD_IDS.includes(unit.neighborhoodId),
  );
  if (nonCanonical.length > 0) {
    ok = false;
    checks.push(`FAIL non-canonical neighborhood ids=${nonCanonical.length}`);
  } else {
    checks.push('OK canonical neighborhood ids');
  }

  const sanayi = state.aggregates.sanayi;
  const yesilvadi = state.aggregates.yesilvadi;
  const merkez = state.aggregates.merkez;

  const sanayiRiskScore =
    sanayi.criticalContainerCount * 10 +
    sanayi.averageFillRate +
    sanayi.complaintPressure;
  const yesilvadiRiskScore =
    yesilvadi.criticalContainerCount * 10 +
    yesilvadi.averageFillRate +
    yesilvadi.complaintPressure;
  if (sanayiRiskScore <= yesilvadiRiskScore) {
    ok = false;
    checks.push(
      `FAIL sanayi risk score (${sanayiRiskScore}) <= yesilvadi (${yesilvadiRiskScore})`,
    );
  } else {
    checks.push('OK sanayi riskier than yesilvadi');
  }

  const sanayiRiskBand =
    sanayi.averageFillRate >= yesilvadi.averageFillRate + 8 ||
    sanayi.complaintPressure >= yesilvadi.complaintPressure + 10 ||
    CONTAINER_OVERFLOW_RISK_PRIORITY[sanayi.worstOverflowRisk] >
      CONTAINER_OVERFLOW_RISK_PRIORITY[yesilvadi.worstOverflowRisk];
  if (!sanayiRiskBand) {
    ok = false;
    checks.push('FAIL sanayi not riskier than yesilvadi band');
  } else {
    checks.push('OK sanayi riskier than yesilvadi (not required kritik)');
  }

  if (yesilvadi.statusLabel === 'Kritik') {
    ok = false;
    checks.push(`FAIL yesilvadi statusLabel=${yesilvadi.statusLabel}`);
  } else {
    checks.push(`OK yesilvadi statusLabel=${yesilvadi.statusLabel}`);
  }

  if (normalizeContainerNeighborhoodId('yesilpark') !== 'yesilvadi') {
    ok = false;
    checks.push('FAIL yesilpark bridge');
  } else {
    checks.push('OK yesilpark -> yesilvadi');
  }

  if (normalizeContainerNeighborhoodId('pazar') !== 'sanayi') {
    ok = false;
    checks.push('FAIL pazar bridge');
  } else {
    checks.push('OK pazar -> sanayi');
  }

  const worst = selectWorstContainerNeighborhood(state);
  if (!worst) {
    ok = false;
    checks.push('FAIL selectWorstContainerNeighborhood null');
  } else {
    checks.push(`OK worst neighborhood=${worst.neighborhoodId}`);
  }

  const summaryLines = selectContainerSummaryLines(state);
  if (summaryLines.length > 3) {
    ok = false;
    checks.push(`FAIL summary line count=${summaryLines.length}`);
  } else {
    checks.push(`OK summary lines (${summaryLines.length})`);
  }

  const clamped = clampContainerValue(150);
  if (clamped !== 100) {
    ok = false;
    checks.push(`FAIL clamp upper=${clamped}`);
  } else {
    checks.push('OK clamp upper bound');
  }

  // --- Aşama 2: günlük update ---

  const day1Initial = createInitialContainerState(1);
  const day1Result = applyContainerDailyUpdate(day1Initial, { day: 1 });

  if (day1Result.state.lastProcessedDay !== 1) {
    ok = false;
    checks.push(
      `FAIL daily lastProcessedDay=${day1Result.state.lastProcessedDay}`,
    );
  } else {
    checks.push('OK daily lastProcessedDay=1');
  }

  if (day1Result.changedUnitIds.length === 0) {
    ok = false;
    checks.push('FAIL daily changedUnitIds empty');
  } else {
    checks.push(`OK daily changed units (${day1Result.changedUnitIds.length})`);
  }

  const fillIncreased = day1Initial.units.some((before, index) => {
    const after = day1Result.state.units[index];
    return after != null && after.fillRate > before.fillRate;
  });
  if (!fillIncreased) {
    ok = false;
    checks.push('FAIL no fillRate increase after day-1 update');
  } else {
    checks.push('OK fillRate increased');
  }

  const day1OutOfRange = day1Result.state.units.filter((unit) => !isUnitInRange(unit));
  if (day1OutOfRange.length > 0) {
    ok = false;
    checks.push(`FAIL daily out-of-range units=${day1OutOfRange.length}`);
  } else {
    checks.push('OK daily numeric ranges');
  }

  const day1MissingAgg = CONTAINER_NEIGHBORHOOD_IDS.filter(
    (id) => !day1Result.state.aggregates[id],
  );
  if (day1MissingAgg.length > 0) {
    ok = false;
    checks.push('FAIL daily missing aggregates');
  } else {
    checks.push('OK daily 5 aggregates');
  }

  const day1Again = applyContainerDailyUpdate(day1Result.state, { day: 1 });
  if (day1Again.changedUnitIds.length !== 0) {
    ok = false;
    checks.push(
      `FAIL idempotency changed=${day1Again.changedUnitIds.length}`,
    );
  } else {
    checks.push('OK idempotency same day');
  }

  if (!unitsMatch(day1Result.state.units, day1Again.state.units)) {
    ok = false;
    checks.push('FAIL idempotency unit drift');
  } else {
    checks.push('OK idempotency unit values stable');
  }

  let multiState = createInitialContainerState(1);
  const multiStartSanayi = multiState.aggregates.sanayi.averageFillRate;
  const multiStartMerkez = multiState.aggregates.merkez.averageFillRate;

  for (let d = 1; d <= 5; d++) {
    multiState = applyContainerDailyUpdate(multiState, {
      day: d,
      isMarketDay: d % 7 === 5,
    }).state;
  }

  if (multiState.lastProcessedDay !== 5) {
    ok = false;
    checks.push(`FAIL multi-day lastProcessedDay=${multiState.lastProcessedDay}`);
  } else {
    checks.push('OK multi-day lastProcessedDay=5');
  }

  const multiSanayi = multiState.aggregates.sanayi;
  const multiMerkez = multiState.aggregates.merkez;
  const multiYesilvadi = multiState.aggregates.yesilvadi;

  if (
    multiSanayi.averageFillRate <= multiStartSanayi &&
    multiMerkez.averageFillRate <= multiStartMerkez
  ) {
    ok = false;
    checks.push('FAIL multi-day risk did not rise in sanayi/merkez');
  } else {
    checks.push('OK multi-day sanayi/merkez fill rose');
  }

  if (multiYesilvadi.statusLabel === 'Kritik') {
    ok = false;
    checks.push('FAIL yesilvadi kritik after 5 days');
  } else {
    checks.push(`OK yesilvadi after 5d=${multiYesilvadi.statusLabel}`);
  }

  const hasElevated = CONTAINER_NEIGHBORHOOD_IDS.some((id) =>
    ELEVATED_STATUS_LABELS.includes(multiState.aggregates[id].statusLabel),
  );
  if (!hasElevated) {
    ok = false;
    checks.push('FAIL multi-day no elevated status label');
  } else {
    checks.push('OK multi-day elevated status present');
  }

  const marketUnit = day1Initial.units.find((u) => u.id === 'sanayi-market-line');
  if (!marketUnit) {
    ok = false;
    checks.push('FAIL sanayi-market-line seed missing');
  } else {
    const normalGain = calculateDailyFillGain({
      unit: marketUnit,
      day: 1,
      isMarketDay: false,
    });
    const marketGain = calculateDailyFillGain({
      unit: marketUnit,
      day: 1,
      isMarketDay: true,
    });
    if (marketGain <= normalGain) {
      ok = false;
      checks.push(
        `FAIL market day gain normal=${normalGain} market=${marketGain}`,
      );
    } else {
      checks.push('OK market day fill gain higher');
    }
  }

  if (normalizeContainerNeighborhoodId('yeni-konut') !== 'cumhuriyet') {
    ok = false;
    checks.push('FAIL yeni-konut bridge');
  } else {
    checks.push('OK yeni-konut -> cumhuriyet');
  }

  // --- Aşama 3: karar etkileri ---

  const wasteEventBase = {
    id: 'e-waste-1',
    eventType: 'waste',
    title: 'Konteyner taşması',
    category: 'Temizlik',
  };

  const decisionBase = createInitialContainerState(1);
  const sanayiUnitBefore = decisionBase.units.find(
    (u) => u.id === 'sanayi-factory-industrial',
  )!;

  const dispatchResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'sanayi' },
    decision: {
      id: 'd-dispatch',
      title: 'Ekibi yönlendir',
      decisionStyle: 'fast',
      costs: { staffHours: 2 },
    },
    day: 1,
    personnelAssigned: true,
  });

  if (dispatchResult.affectedUnitIds.length === 0) {
    ok = false;
    checks.push('FAIL dispatch affectedUnitIds empty');
  } else {
    checks.push('OK dispatch affected units');
  }

  const sanayiUnitAfter = dispatchResult.state.units.find(
    (u) => u.id === 'sanayi-factory-industrial',
  )!;
  if (sanayiUnitAfter.fillRate >= sanayiUnitBefore.fillRate) {
    ok = false;
    checks.push('FAIL dispatch fillRate did not drop');
  } else {
    checks.push('OK dispatch fillRate dropped');
  }

  if (sanayiUnitAfter.lastCollectedDay !== 1) {
    ok = false;
    checks.push(`FAIL dispatch lastCollectedDay=${sanayiUnitAfter.lastCollectedDay}`);
  } else {
    checks.push('OK dispatch lastCollectedDay set');
  }

  if (!dispatchResult.state.aggregates.sanayi) {
    ok = false;
    checks.push('FAIL dispatch aggregates missing');
  } else {
    checks.push('OK dispatch aggregates recomputed');
  }

  const communicateResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'merkez' },
    decision: {
      id: 'd-comm',
      title: 'İletişim kur',
      decisionStyle: 'communication',
    },
    day: 1,
  });
  const merkezUnitBefore = decisionBase.units.find(
    (u) => u.id === 'merkez-main-waste',
  )!;
  const merkezUnitAfterComm = communicateResult.state.units.find(
    (u) => u.id === 'merkez-main-waste',
  )!;
  const commFillDrop = merkezUnitBefore.fillRate - merkezUnitAfterComm.fillRate;
  if (commFillDrop > 5) {
    ok = false;
    checks.push(`FAIL communicate fill drop too large=${commFillDrop}`);
  } else {
    checks.push('OK communicate limited fill drop');
  }
  if (merkezUnitAfterComm.lastCollectedDay !== merkezUnitBefore.lastCollectedDay) {
    ok = false;
    checks.push('FAIL communicate changed lastCollectedDay');
  } else {
    checks.push('OK communicate lastCollectedDay unchanged');
  }

  const maintenanceResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'sanayi' },
    decision: {
      id: 'd-maint',
      title: 'Bakım ekibi gönder',
      tags: ['maintenance'],
    },
    day: 1,
  });
  const maintUnit = maintenanceResult.state.units.find(
    (u) => u.id === 'sanayi-factory-industrial',
  )!;
  if (maintUnit.condition <= sanayiUnitBefore.condition) {
    ok = false;
    checks.push('FAIL maintenance condition did not rise');
  } else {
    checks.push('OK maintenance condition rose');
  }
  if (maintUnit.maintenanceNeed >= sanayiUnitBefore.maintenanceNeed) {
    ok = false;
    checks.push('FAIL maintenance need did not drop');
  } else {
    checks.push('OK maintenance need dropped');
  }

  const routeAction = classifyContainerDecisionAction({
    event: wasteEventBase,
    decision: { id: 'd-route', title: 'Toplama rotasını öne al' },
  });
  if (routeAction !== 'prioritize_route') {
    ok = false;
    checks.push(`FAIL route classify=${routeAction}`);
  } else {
    checks.push('OK prioritize_route classify');
  }

  const routeResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'sanayi' },
    decision: { id: 'd-route', title: 'Toplama rotasını öne al' },
    day: 1,
  });
  const dispatchFillDrop =
    sanayiUnitBefore.fillRate -
    dispatchResult.state.units.find((u) => u.id === sanayiUnitBefore.id)!.fillRate;
  const routeFillDrop =
    sanayiUnitBefore.fillRate -
    routeResult.state.units.find((u) => u.id === sanayiUnitBefore.id)!.fillRate;
  if (routeFillDrop <= dispatchFillDrop) {
    ok = false;
    checks.push(
      `FAIL route fill drop (${routeFillDrop}) <= dispatch (${dispatchFillDrop})`,
    );
  } else {
    checks.push('OK route stronger fill drop than dispatch');
  }

  const capacityAction = classifyContainerDecisionAction({
    event: wasteEventBase,
    decision: { id: 'd-cap', title: 'Ek konteyner yerleştir' },
  });
  if (capacityAction !== 'add_capacity') {
    ok = false;
    checks.push(`FAIL add_capacity classify=${capacityAction}`);
  } else {
    checks.push('OK add_capacity classify');
  }

  const capacityResult = processContainersAfterDecision({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'sanayi' },
    decision: { id: 'd-cap', title: 'Ek konteyner yerleştir' },
    day: 1,
  });
  if (capacityResult.state.units.length !== decisionBase.units.length) {
    ok = false;
    checks.push('FAIL add_capacity changed unit count');
  } else {
    checks.push('OK add_capacity unit count stable');
  }
  const capacityFillImproved = capacityResult.affectedUnitIds.some((id) => {
    const before = decisionBase.units.find((u) => u.id === id)!;
    const after = capacityResult.state.units.find((u) => u.id === id)!;
    return after.fillRate < before.fillRate;
  });
  if (!capacityFillImproved) {
    ok = false;
    checks.push('FAIL add_capacity fill did not drop');
  } else {
    checks.push('OK add_capacity fill pressure reduced');
  }

  const nonContainerResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: {
      id: 'e-security',
      title: 'Mahalle güveni düşüyor',
      eventType: 'citizen_complaint',
      category: 'Güvenlik',
    },
    decision: { id: 'd-comm2', title: 'İletişim kur', decisionStyle: 'communication' },
    day: 1,
  });
  if (nonContainerResult.summary?.action !== 'none') {
    ok = false;
    checks.push(`FAIL non-container action=${nonContainerResult.summary?.action}`);
  } else {
    checks.push('OK non-container action none');
  }
  if (nonContainerResult.affectedUnitIds.length !== 0) {
    ok = false;
    checks.push('FAIL non-container affected units');
  } else {
    checks.push('OK non-container no affected units');
  }
  if (!unitsMatch(nonContainerResult.state.units, decisionBase.units)) {
    ok = false;
    checks.push('FAIL non-container state changed');
  } else {
    checks.push('OK non-container state unchanged');
  }

  const yesilparkResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'yesilpark' },
    decision: { id: 'd-yp', title: 'Yönlendir', decisionStyle: 'fast' },
    day: 1,
  });
  if (!yesilparkResult.affectedUnitIds.some((id) => id.startsWith('yesilvadi'))) {
    ok = false;
    checks.push('FAIL yesilpark bridge units');
  } else {
    checks.push('OK yesilpark -> yesilvadi units affected');
  }

  const pazarResult = applyContainerDecisionEffects({
    containerState: decisionBase,
    event: { ...wasteEventBase, neighborhoodId: 'pazar' },
    decision: { id: 'd-pz', title: 'Yönlendir', decisionStyle: 'fast' },
    day: 1,
  });
  if (!pazarResult.affectedUnitIds.some((id) => id.startsWith('sanayi'))) {
    ok = false;
    checks.push('FAIL pazar bridge units');
  } else {
    checks.push('OK pazar -> sanayi units affected');
  }

  const boundsStates = [
    dispatchResult.state,
    communicateResult.state,
    maintenanceResult.state,
    routeResult.state,
    capacityResult.state,
  ];
  const boundsBad = boundsStates.some((st) =>
    st.units.some((unit) => !isUnitInRange(unit)),
  );
  if (boundsBad) {
    ok = false;
    checks.push('FAIL decision effect numeric bounds');
  } else {
    checks.push('OK decision effect numeric bounds');
  }

  return { ok, checks };
}

export function runVerifyContainerScenario(): void {
  const result = verifyContainerScenario();
  console.log(
    '[containers]',
    result.ok ? 'PASS' : 'FAIL',
    result.checks.join(' | '),
  );
}
