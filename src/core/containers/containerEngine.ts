import { toDisplayContainerNeighborhoodName } from './containerNeighborhoodBridge';
import {
  CONTAINER_COLLECTION_DELAY_ODOR_BONUS,
  CONTAINER_COMPLAINT_CRITICAL_OVERFLOW_BONUS,
  CONTAINER_CONDITION_THRESHOLDS,
  CONTAINER_DAILY_CONDITION_DECAY_BY_TYPE,
  CONTAINER_DAILY_UPDATE_LIMITS,
  CONTAINER_DISABLED_DAILY_FILL_GAIN,
  CONTAINER_FILL_SLOWDOWN_TIERS,
  CONTAINER_HIGH_FILL_CONDITION_EXTRA_LOSS,
  CONTAINER_HIGH_FILL_CONDITION_THRESHOLD,
  CONTAINER_HIGH_FILL_ODOR_FACTOR,
  CONTAINER_HIGH_FILL_ODOR_THRESHOLD,
  CONTAINER_HIGH_MAINTENANCE_CONDITION_EXTRA_LOSS,
  CONTAINER_HIGH_MAINTENANCE_CONDITION_THRESHOLD,
  CONTAINER_MAINTENANCE_GAIN_BY_TYPE,
  CONTAINER_MARKET_DAY_FILL_MULTIPLIER,
  CONTAINER_NEIGHBORHOOD_DAILY_PRESSURE,
  CONTAINER_NEIGHBORHOOD_IDS,
  CONTAINER_FILL_THRESHOLDS,
  CONTAINER_MAINTENANCE_THRESHOLDS,
  CONTAINER_ODOR_THRESHOLDS,
  CONTAINER_OVERFLOW_RISK_PRIORITY,
  CONTAINER_TYPE_BASE_DAILY_FILL,
  CONTAINER_TYPE_ODOR_MULTIPLIER,
  CONTAINER_UNIT_FILL_OVERFLOW,
} from './containerConstants';
import type {
  ContainerDailyUpdateContext,
  ContainerDailyUpdateResult,
  ContainerNeighborhoodId,
  ContainerOverflowRisk,
  ContainerState,
  ContainerUnit,
  ContainerUnitStatus,
  NeighborhoodContainerStatus,
  NeighborhoodContainerStatusLabel,
} from './containerTypes';

export function clampContainerValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(value)));
}

type UnitMetricsInput = {
  fillRate: number;
  odorLevel: number;
  maintenanceNeed: number;
  condition: number;
  status?: ContainerUnitStatus;
};

export function calculateOverflowRisk(input: {
  fillRate: number;
  odorLevel: number;
  maintenanceNeed: number;
  status?: ContainerUnitStatus;
}): ContainerOverflowRisk {
  if (input.status === 'disabled') {
    return 'low';
  }

  const fillRate = clampContainerValue(input.fillRate);
  const odorLevel = clampContainerValue(input.odorLevel);
  const maintenanceNeed = clampContainerValue(input.maintenanceNeed);

  if (
    fillRate >= CONTAINER_FILL_THRESHOLDS.critical ||
    odorLevel >= CONTAINER_ODOR_THRESHOLDS.critical
  ) {
    return 'critical';
  }

  if (
    fillRate >= CONTAINER_FILL_THRESHOLDS.high ||
    odorLevel >= CONTAINER_ODOR_THRESHOLDS.high ||
    maintenanceNeed >= CONTAINER_MAINTENANCE_THRESHOLDS.critical
  ) {
    return 'high';
  }

  if (
    fillRate >= CONTAINER_FILL_THRESHOLDS.medium ||
    odorLevel >= CONTAINER_ODOR_THRESHOLDS.medium ||
    maintenanceNeed >= CONTAINER_MAINTENANCE_THRESHOLDS.high
  ) {
    return 'medium';
  }

  return 'low';
}

export function calculateContainerUnitStatus(
  unitLike: UnitMetricsInput & { overflowRisk: ContainerOverflowRisk },
): ContainerUnitStatus {
  const condition = clampContainerValue(unitLike.condition);
  const fillRate = clampContainerValue(unitLike.fillRate);
  const maintenanceNeed = clampContainerValue(unitLike.maintenanceNeed);
  const overflowRisk = unitLike.overflowRisk;

  if (condition <= CONTAINER_CONDITION_THRESHOLDS.disabled) {
    return 'disabled';
  }

  if (
    fillRate >= CONTAINER_UNIT_FILL_OVERFLOW ||
    overflowRisk === 'critical'
  ) {
    return 'overflowing';
  }

  if (
    maintenanceNeed >= CONTAINER_MAINTENANCE_THRESHOLDS.critical ||
    condition <= CONTAINER_CONDITION_THRESHOLDS.needsMaintenance
  ) {
    return 'needs_maintenance';
  }

  if (fillRate >= CONTAINER_FILL_THRESHOLDS.high) {
    return 'needs_collection';
  }

  return 'normal';
}

export function calculateComplaintPressure(
  unitLike: UnitMetricsInput & { overflowRisk: ContainerOverflowRisk },
): number {
  const fillRate = clampContainerValue(unitLike.fillRate);
  const odorLevel = clampContainerValue(unitLike.odorLevel);
  const maintenanceNeed = clampContainerValue(unitLike.maintenanceNeed);
  const condition = clampContainerValue(unitLike.condition);

  let pressure =
    fillRate * 0.35 +
    odorLevel * 0.35 +
    maintenanceNeed * 0.15 +
    (100 - condition) * 0.15;

  if (unitLike.overflowRisk === 'critical') {
    pressure += CONTAINER_COMPLAINT_CRITICAL_OVERFLOW_BONUS;
  }

  return clampContainerValue(pressure);
}

export function normalizeContainerUnit(unit: ContainerUnit): ContainerUnit {
  const fillRate = clampContainerValue(unit.fillRate);
  const condition = clampContainerValue(unit.condition);
  const odorLevel = clampContainerValue(unit.odorLevel);
  const maintenanceNeed = clampContainerValue(unit.maintenanceNeed);
  const capacity = clampContainerValue(unit.capacity);

  const overflowRisk = calculateOverflowRisk({
    fillRate,
    odorLevel,
    maintenanceNeed,
    status: unit.status,
  });

  const status = calculateContainerUnitStatus({
    fillRate,
    odorLevel,
    maintenanceNeed,
    condition,
    overflowRisk,
  });

  const resolvedOverflowRisk = calculateOverflowRisk({
    fillRate,
    odorLevel,
    maintenanceNeed,
    status,
  });

  const complaintPressure = calculateComplaintPressure({
    fillRate,
    odorLevel,
    maintenanceNeed,
    condition,
    overflowRisk: resolvedOverflowRisk,
  });

  return {
    ...unit,
    capacity,
    fillRate,
    condition,
    odorLevel,
    maintenanceNeed,
    overflowRisk: resolvedOverflowRisk,
    status,
    complaintPressure,
  };
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function maxOverflowRisk(risks: ContainerOverflowRisk[]): ContainerOverflowRisk {
  if (risks.length === 0) {
    return 'low';
  }
  return risks.reduce((worst, risk) =>
    CONTAINER_OVERFLOW_RISK_PRIORITY[risk] >
    CONTAINER_OVERFLOW_RISK_PRIORITY[worst]
      ? risk
      : worst,
  );
}

function resolveRecommendedAction(input: {
  criticalContainerCount: number;
  averageFillRate: number;
  maintenancePressure: number;
  odorPressure: number;
  averageCondition: number;
}): NeighborhoodContainerStatus['recommendedAction'] {
  if (input.criticalContainerCount > 0 || input.averageFillRate >= 75) {
    return 'collect_now';
  }
  if (input.maintenancePressure >= 65) {
    return 'repair';
  }
  if (input.odorPressure >= 65) {
    return 'communicate';
  }
  if (input.averageCondition <= 55) {
    return 'inspect';
  }
  return 'monitor';
}

function resolveStatusLabel(input: {
  severeOverflowUnitCount: number;
  elevatedContainerCount: number;
  worstOverflowRisk: ContainerOverflowRisk;
  odorPressure: number;
  maintenancePressure: number;
  averageFillRate: number;
  averageCondition: number;
  complaintPressure: number;
}): NeighborhoodContainerStatusLabel {
  const isKritik =
    (input.severeOverflowUnitCount >= 2 && input.averageFillRate >= 75) ||
    (input.worstOverflowRisk === 'critical' &&
      input.complaintPressure >= 75) ||
    (input.averageFillRate >= 82 && input.odorPressure >= 75) ||
    (input.maintenancePressure >= 80 && input.averageCondition <= 45);

  if (isKritik) {
    return 'Kritik';
  }

  const isTasmaRiski =
    input.worstOverflowRisk === 'critical' ||
    input.worstOverflowRisk === 'high' ||
    input.elevatedContainerCount >= 1 ||
    input.averageFillRate >= 70;

  if (isTasmaRiski) {
    return 'Taşma Riski';
  }

  if (input.odorPressure >= 65) {
    return 'Koku Baskısı';
  }
  if (input.maintenancePressure >= 65) {
    return 'Bakım Gerekli';
  }
  if (input.averageFillRate >= 55) {
    return 'Doluluk Artıyor';
  }
  return 'Dengeli';
}

function createEmptyNeighborhoodStatus(
  neighborhoodId: ContainerNeighborhoodId,
): NeighborhoodContainerStatus {
  return {
    neighborhoodId,
    averageFillRate: 0,
    worstOverflowRisk: 'low',
    averageCondition: 100,
    odorPressure: 0,
    maintenancePressure: 0,
    collectionDelayDays: 0,
    complaintPressure: 0,
    activeContainerCount: 0,
    criticalContainerCount: 0,
    recommendedAction: 'monitor',
    statusLabel: 'Dengeli',
  };
}

export function buildNeighborhoodContainerStatus(
  neighborhoodId: ContainerNeighborhoodId,
  units: ContainerUnit[],
  currentDay: number,
): NeighborhoodContainerStatus {
  const neighborhoodUnits = units.filter(
    (unit) => unit.neighborhoodId === neighborhoodId,
  );

  if (neighborhoodUnits.length === 0) {
    return createEmptyNeighborhoodStatus(neighborhoodId);
  }

  const activeUnits = neighborhoodUnits.filter(
    (unit) => unit.status !== 'disabled',
  );

  const activeContainerCount = activeUnits.length;
  const sourceUnits = activeUnits.length > 0 ? activeUnits : neighborhoodUnits;

  const averageFillRate = clampContainerValue(
    average(sourceUnits.map((unit) => unit.fillRate)),
  );
  const averageCondition = clampContainerValue(
    average(sourceUnits.map((unit) => unit.condition)),
  );
  const odorPressure = clampContainerValue(
    average(sourceUnits.map((unit) => unit.odorLevel)),
  );
  const maintenancePressure = clampContainerValue(
    average(sourceUnits.map((unit) => unit.maintenanceNeed)),
  );
  const complaintPressure = clampContainerValue(
    average(sourceUnits.map((unit) => unit.complaintPressure)),
  );

  const worstOverflowRisk = maxOverflowRisk(
    sourceUnits.map((unit) => unit.overflowRisk),
  );

  const collectionDelayDays = Math.max(
    0,
    ...neighborhoodUnits.map((unit) =>
      Math.max(0, currentDay - unit.lastCollectedDay),
    ),
  );

  const elevatedContainerCount = sourceUnits.filter(
    (unit) =>
      unit.overflowRisk === 'high' || unit.overflowRisk === 'critical',
  ).length;
  const severeOverflowUnitCount = sourceUnits.filter(
    (unit) => unit.overflowRisk === 'critical',
  ).length;

  const recommendedAction = resolveRecommendedAction({
    criticalContainerCount: elevatedContainerCount,
    averageFillRate,
    maintenancePressure,
    odorPressure,
    averageCondition,
  });

  const statusLabel = resolveStatusLabel({
    severeOverflowUnitCount,
    elevatedContainerCount,
    worstOverflowRisk,
    odorPressure,
    maintenancePressure,
    averageFillRate,
    averageCondition,
    complaintPressure,
  });

  return {
    neighborhoodId,
    averageFillRate,
    worstOverflowRisk,
    averageCondition,
    odorPressure,
    maintenancePressure,
    collectionDelayDays,
    complaintPressure,
    activeContainerCount,
    criticalContainerCount: elevatedContainerCount,
    recommendedAction,
    statusLabel,
  };
}

export function recomputeContainerAggregates(
  units: ContainerUnit[],
  currentDay: number,
): Record<ContainerNeighborhoodId, NeighborhoodContainerStatus> {
  const aggregates = {} as Record<
    ContainerNeighborhoodId,
    NeighborhoodContainerStatus
  >;

  for (const neighborhoodId of CONTAINER_NEIGHBORHOOD_IDS) {
    aggregates[neighborhoodId] = buildNeighborhoodContainerStatus(
      neighborhoodId,
      units,
      currentDay,
    );
  }

  return aggregates;
}

function clampDailyGain(value: number, max: number): number {
  return Math.min(max, Math.max(0, value));
}

export function calculateDailyFillGain(input: {
  unit: ContainerUnit;
  day: number;
  isMarketDay?: boolean;
}): number {
  const { unit, isMarketDay } = input;

  if (unit.status === 'disabled') {
    return CONTAINER_DISABLED_DAILY_FILL_GAIN;
  }

  const base = CONTAINER_TYPE_BASE_DAILY_FILL[unit.type];
  const pressure = CONTAINER_NEIGHBORHOOD_DAILY_PRESSURE[unit.neighborhoodId];
  let gain = base * pressure;

  if (unit.type === 'market_waste' && isMarketDay) {
    gain *= CONTAINER_MARKET_DAY_FILL_MULTIPLIER;
  }

  for (const tier of CONTAINER_FILL_SLOWDOWN_TIERS) {
    if (unit.fillRate >= tier.minFillRate) {
      gain *= tier.multiplier;
      break;
    }
  }

  return clampDailyGain(
    gain,
    CONTAINER_DAILY_UPDATE_LIMITS.maxFillGainPerDay,
  );
}

export function calculateDailyOdorGain(input: {
  unit: ContainerUnit;
  nextFillRate: number;
  collectionDelayDays: number;
  isMarketDay?: boolean;
}): number {
  const { unit, nextFillRate, collectionDelayDays, isMarketDay } = input;

  if (unit.status === 'disabled') {
    return 0;
  }

  const typeMultiplier = CONTAINER_TYPE_ODOR_MULTIPLIER[unit.type];
  const neighborhoodPressure =
    CONTAINER_NEIGHBORHOOD_DAILY_PRESSURE[unit.neighborhoodId];
  const cappedDelayDays = Math.min(collectionDelayDays, 3);
  let gain =
    ((nextFillRate / 100) * 6 * typeMultiplier +
      cappedDelayDays * CONTAINER_COLLECTION_DELAY_ODOR_BONUS) *
    neighborhoodPressure;

  if (nextFillRate >= CONTAINER_HIGH_FILL_ODOR_THRESHOLD) {
    gain *= CONTAINER_HIGH_FILL_ODOR_FACTOR;
  }

  if (unit.type === 'market_waste' && isMarketDay) {
    gain *= 1.08;
  }

  return clampDailyGain(gain, CONTAINER_DAILY_UPDATE_LIMITS.maxOdorGainPerDay);
}

export function calculateDailyConditionLoss(input: {
  unit: ContainerUnit;
  nextFillRate: number;
}): number {
  const { unit, nextFillRate } = input;

  if (unit.status === 'disabled') {
    return 0;
  }

  let loss = CONTAINER_DAILY_CONDITION_DECAY_BY_TYPE[unit.type];

  if (nextFillRate >= CONTAINER_HIGH_FILL_CONDITION_THRESHOLD) {
    loss += CONTAINER_HIGH_FILL_CONDITION_EXTRA_LOSS;
  }

  if (unit.maintenanceNeed >= CONTAINER_HIGH_MAINTENANCE_CONDITION_THRESHOLD) {
    loss += CONTAINER_HIGH_MAINTENANCE_CONDITION_EXTRA_LOSS;
  }

  return clampDailyGain(
    loss,
    CONTAINER_DAILY_UPDATE_LIMITS.maxConditionLossPerDay,
  );
}

export function calculateDailyMaintenanceGain(input: {
  unit: ContainerUnit;
  nextFillRate: number;
  nextCondition: number;
}): number {
  const { unit, nextFillRate, nextCondition } = input;

  if (unit.status === 'disabled') {
    return 0;
  }

  let gain = CONTAINER_MAINTENANCE_GAIN_BY_TYPE[unit.type];

  if (nextCondition <= CONTAINER_CONDITION_THRESHOLDS.maintenanceWatch) {
    gain +=
      (CONTAINER_CONDITION_THRESHOLDS.maintenanceWatch - nextCondition) * 0.025;
  }

  if (nextFillRate >= CONTAINER_FILL_THRESHOLDS.medium) {
    gain += (nextFillRate - CONTAINER_FILL_THRESHOLDS.medium) * 0.03;
  }

  const overflowRisk = calculateOverflowRisk({
    fillRate: nextFillRate,
    odorLevel: unit.odorLevel,
    maintenanceNeed: unit.maintenanceNeed,
    status: unit.status,
  });

  if (overflowRisk === 'high' || overflowRisk === 'critical') {
    gain += 1.5;
  }

  return clampDailyGain(
    gain,
    CONTAINER_DAILY_UPDATE_LIMITS.maxMaintenanceGainPerDay,
  );
}

export function advanceContainerUnitOneDay(input: {
  unit: ContainerUnit;
  day: number;
  isMarketDay?: boolean;
}): ContainerUnit {
  const { unit, day, isMarketDay } = input;
  const collectionDelayDays = Math.max(0, day - unit.lastCollectedDay);

  const fillGain = calculateDailyFillGain({ unit, day, isMarketDay });
  const nextFillRate = clampContainerValue(unit.fillRate + fillGain);

  const odorGain = calculateDailyOdorGain({
    unit,
    nextFillRate,
    collectionDelayDays,
    isMarketDay,
  });
  const nextOdorLevel = clampContainerValue(unit.odorLevel + odorGain);

  const conditionLoss = calculateDailyConditionLoss({ unit, nextFillRate });
  const nextCondition = clampContainerValue(unit.condition - conditionLoss);

  const maintenanceGain = calculateDailyMaintenanceGain({
    unit,
    nextFillRate,
    nextCondition,
  });
  const nextMaintenanceNeed = clampContainerValue(
    unit.maintenanceNeed + maintenanceGain,
  );

  return normalizeContainerUnit({
    ...unit,
    fillRate: nextFillRate,
    odorLevel: nextOdorLevel,
    condition: nextCondition,
    maintenanceNeed: nextMaintenanceNeed,
  });
}

function unitMetricsChanged(before: ContainerUnit, after: ContainerUnit): boolean {
  return (
    before.fillRate !== after.fillRate ||
    before.odorLevel !== after.odorLevel ||
    before.condition !== after.condition ||
    before.maintenanceNeed !== after.maintenanceNeed ||
    before.status !== after.status ||
    before.overflowRisk !== after.overflowRisk ||
    before.complaintPressure !== after.complaintPressure
  );
}

function buildContainerDailySummaryLines(
  aggregates: Record<ContainerNeighborhoodId, NeighborhoodContainerStatus>,
): string[] {
  const ranked = CONTAINER_NEIGHBORHOOD_IDS.map((id) => aggregates[id])
    .filter((status) => status.activeContainerCount > 0)
    .sort((a, b) => {
      if (b.criticalContainerCount !== a.criticalContainerCount) {
        return b.criticalContainerCount - a.criticalContainerCount;
      }
      const riskDelta =
        CONTAINER_OVERFLOW_RISK_PRIORITY[b.worstOverflowRisk] -
        CONTAINER_OVERFLOW_RISK_PRIORITY[a.worstOverflowRisk];
      if (riskDelta !== 0) {
        return riskDelta;
      }
      return b.complaintPressure - a.complaintPressure;
    });

  const lines: string[] = [];

  for (const status of ranked) {
    if (lines.length >= 3) {
      break;
    }

    const name = toDisplayContainerNeighborhoodName(status.neighborhoodId);

    if (status.criticalContainerCount > 0) {
      lines.push(
        `${name}'de ${status.criticalContainerCount} noktada taşma riski yükseldi.`,
      );
      continue;
    }

    if (status.statusLabel === 'Koku Baskısı') {
      lines.push(`${name}'de koku baskısı takip edilmeli.`);
      continue;
    }

    if (status.statusLabel === 'Bakım Gerekli') {
      lines.push(`${name}'de bakım ihtiyacı artıyor.`);
      continue;
    }

    if (status.statusLabel === 'Dengeli') {
      lines.push(`${name} konteyner durumu dengeli.`);
      continue;
    }

    lines.push(
      `${name}'de ${status.statusLabel.toLowerCase()} — ortalama doluluk %${Math.round(status.averageFillRate)}.`,
    );
  }

  return lines.slice(0, 3);
}

function findNewlyCriticalNeighborhoods(
  before: Record<ContainerNeighborhoodId, NeighborhoodContainerStatus>,
  after: Record<ContainerNeighborhoodId, NeighborhoodContainerStatus>,
): ContainerNeighborhoodId[] {
  return CONTAINER_NEIGHBORHOOD_IDS.filter((id) => {
    const prev = before[id];
    const next = after[id];
    return (
      prev.worstOverflowRisk !== 'critical' && next.worstOverflowRisk === 'critical'
    );
  });
}

export function applyContainerDailyUpdate(
  state: ContainerState,
  context: ContainerDailyUpdateContext,
): ContainerDailyUpdateResult {
  const day = Math.max(1, context.day);

  if (state.lastProcessedDay >= day) {
    return {
      state,
      changedUnitIds: [],
      newlyCriticalNeighborhoodIds: [],
      summaryLines: [],
    };
  }

  const units = state.units.length
    ? state.units.map((unit) =>
        advanceContainerUnitOneDay({
          unit,
          day,
          isMarketDay: context.isMarketDay,
        }),
      )
    : [];

  const aggregates = recomputeContainerAggregates(units, day);
  const changedUnitIds = state.units
    .map((before, index) => {
      const after = units[index];
      if (!after) {
        return null;
      }
      return unitMetricsChanged(before, after) ? before.id : null;
    })
    .filter((id): id is string => id != null);

  const nextState: ContainerState = {
    units,
    aggregates,
    lastProcessedDay: day,
    dayModifiers: {
      isMarketDay: context.isMarketDay,
      weatherId: context.weatherId,
    },
  };

  return {
    state: nextState,
    changedUnitIds,
    newlyCriticalNeighborhoodIds: findNewlyCriticalNeighborhoods(
      state.aggregates,
      aggregates,
    ),
    summaryLines: buildContainerDailySummaryLines(aggregates),
  };
}
