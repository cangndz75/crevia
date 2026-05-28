import { CONTAINER_OVERFLOW_RISK_PRIORITY } from './containerConstants';
import {
  clampContainerValue,
  normalizeContainerUnit,
  recomputeContainerAggregates,
} from './containerEngine';
import { normalizeContainerNeighborhoodId } from './containerNeighborhoodBridge';
import type {
  ContainerDecisionAction,
  ContainerDecisionEffectSummary,
  ContainerDecisionInput,
  ContainerDecisionResult,
  ContainerNeighborhoodId,
  ContainerState,
  ContainerUnit,
} from './containerTypes';

const TAG_ACTION_MAP: Record<string, ContainerDecisionAction> = {
  container_collect: 'prioritize_route',
  waste_collect: 'prioritize_route',
  route_collect: 'prioritize_route',
  container_maintenance: 'maintenance',
  repair: 'maintenance',
  maintenance: 'maintenance',
  container_capacity: 'add_capacity',
  add_container: 'add_capacity',
  communication: 'communicate',
  inform_public: 'communicate',
  permanent_solution: 'permanent_solution',
  monitor: 'monitor',
};

const PERSONNEL_DISPATCH_MULTIPLIER = 1.15;

function normalizeText(...parts: Array<string | undefined>): string {
  return parts
    .filter((part): part is string => typeof part === 'string' && part.length > 0)
    .join(' ')
    .toLowerCase();
}

function includesAny(haystack: string, keywords: string[]): boolean {
  return keywords.some((keyword) => haystack.includes(keyword));
}

export function isContainerRelevantEvent(
  event?: ContainerDecisionInput['event'],
): boolean {
  if (!event) {
    return false;
  }

  const haystack = normalizeText(
    event.title,
    event.category,
    event.eventType,
    ...(event.tags ?? []),
  );

  const typeSignals = [
    'waste',
    'trash',
    'container',
    'cleaning',
    'market',
    'park_cleanliness',
    'delayed_collection',
    'waste_overflow',
    'temizlik',
    'atık',
  ];

  if (includesAny(haystack, typeSignals)) {
    return true;
  }

  const titleSignals = [
    'çöp',
    'konteyner',
    'atık',
    'koku',
    'taşma',
    'pazar',
    'park',
    'temizlik',
    'toplama',
    'waste',
    'overflow',
    'trash',
  ];

  return includesAny(haystack, titleSignals);
}

function classifyFromTags(
  tags: string[] | undefined,
): ContainerDecisionAction | null {
  if (!tags?.length) {
    return null;
  }

  for (const tag of tags) {
    const normalized = tag.trim().toLowerCase().replace(/[\s-]+/g, '_');
    const mapped = TAG_ACTION_MAP[normalized];
    if (mapped) {
      return mapped;
    }
  }

  return null;
}

function classifyFromStyleFields(
  decision: ContainerDecisionInput['decision'],
): ContainerDecisionAction | null {
  const haystack = normalizeText(
    decision.type,
    decision.category,
    decision.decisionStyle,
  );

  if (includesAny(haystack, ['communication', 'communicate'])) {
    return 'communicate';
  }
  if (includesAny(haystack, ['permanent', 'permanent_solution'])) {
    return 'permanent_solution';
  }
  if (
    includesAny(haystack, [
      'planned',
      'fast',
      'field_response',
      'dispatch',
      'bold',
    ])
  ) {
    return 'dispatch_collection';
  }
  if (includesAny(haystack, ['maintenance', 'repair'])) {
    return 'maintenance';
  }
  if (includesAny(haystack, ['monitor', 'follow'])) {
    return 'monitor';
  }

  return null;
}

function classifyFromKeywords(
  decision: ContainerDecisionInput['decision'],
): ContainerDecisionAction | null {
  const haystack = normalizeText(
    decision.title,
    decision.body,
    decision.description,
  );

  if (
    includesAny(haystack, [
      'toplama rotasını öne al',
      'toplama rotasini one al',
      'route priority',
      'prioritize route',
    ]) ||
    (includesAny(haystack, ['toplama', 'rota', 'öne al', 'one al', 'route']) &&
      !includesAny(haystack, ['yönlendir', 'ekip', 'sevk', 'dispatch']))
  ) {
    return 'prioritize_route';
  }

  if (
    includesAny(haystack, [
      'yönlendir',
      'ekip gönder',
      'ekibi yönlendir',
      'sevk',
      'dispatch',
      'sahaya',
    ])
  ) {
    return 'dispatch_collection';
  }

  if (
    includesAny(haystack, [
      'toplama',
      'rota',
      'çöp topla',
      'cop topla',
      'collect',
      'route',
    ])
  ) {
    return 'prioritize_route';
  }

  if (
    includesAny(haystack, ['bakım', 'onar', 'tamir', 'repair', 'maintenance'])
  ) {
    return 'maintenance';
  }

  if (
    includesAny(haystack, [
      'ek konteyner',
      'kapasite',
      'yeni konteyner',
      'add container',
      'capacity',
    ])
  ) {
    return 'add_capacity';
  }

  if (
    includesAny(haystack, [
      'iletişim',
      'iletisim',
      'bilgilendir',
      'muhtar',
      'duyuru',
      'communication',
    ])
  ) {
    return 'communicate';
  }

  if (includesAny(haystack, ['kalıcı', 'kalici', 'düzenleme', 'permanent'])) {
    return 'permanent_solution';
  }

  if (includesAny(haystack, ['takip', 'izle', 'monitor', 'follow'])) {
    return 'monitor';
  }

  return null;
}

export function classifyContainerDecisionAction(input: {
  event?: ContainerDecisionInput['event'];
  decision: ContainerDecisionInput['decision'];
}): ContainerDecisionAction {
  const { event, decision } = input;

  if (!isContainerRelevantEvent(event)) {
    return 'none';
  }

  const fromTags = classifyFromTags(decision.tags);
  if (fromTags) {
    return fromTags;
  }

  const fromStyle = classifyFromStyleFields(decision);
  if (fromStyle) {
    return fromStyle;
  }

  const fromKeywords = classifyFromKeywords(decision);
  if (fromKeywords) {
    return fromKeywords;
  }

  if (decision.decisionStyle === 'communication') {
    return 'communicate';
  }
  if (decision.decisionStyle === 'permanent') {
    return 'permanent_solution';
  }
  if (decision.decisionStyle === 'fast' || decision.decisionStyle === 'bold') {
    return 'dispatch_collection';
  }
  if (decision.decisionStyle === 'planned') {
    return 'prioritize_route';
  }

  return 'none';
}

export function resolveContainerDecisionNeighborhood(input: {
  event?: { neighborhoodId?: string };
  decision?: { neighborhoodId?: string };
  fallbackNeighborhoodId?: string | null;
}): ContainerNeighborhoodId | null {
  const fromDecision = normalizeContainerNeighborhoodId(
    input.decision?.neighborhoodId,
  );
  if (fromDecision) {
    return fromDecision;
  }

  const fromEvent = normalizeContainerNeighborhoodId(
    input.event?.neighborhoodId,
  );
  if (fromEvent) {
    return fromEvent;
  }

  return normalizeContainerNeighborhoodId(input.fallbackNeighborhoodId);
}

function unitCollectionPressureScore(unit: ContainerUnit): number {
  return (
    unit.fillRate * 0.45 +
    unit.complaintPressure * 0.25 +
    CONTAINER_OVERFLOW_RISK_PRIORITY[unit.overflowRisk] * 12 +
    unit.odorLevel * 0.1
  );
}

function unitMaintenancePressureScore(unit: ContainerUnit): number {
  return unit.maintenanceNeed * 0.55 + (100 - unit.condition) * 0.45;
}

function pickTopUnits(
  units: ContainerUnit[],
  scoreFn: (unit: ContainerUnit) => number,
  limit: number,
): ContainerUnit[] {
  return [...units]
    .sort((a, b) => scoreFn(b) - scoreFn(a))
    .slice(0, limit);
}

export function selectTargetContainerUnitsForDecision(input: {
  state: ContainerState;
  neighborhoodId: ContainerNeighborhoodId;
  action: ContainerDecisionAction;
  event?: { title?: string; eventType?: string; category?: string };
  targetContainerIds?: string[];
}): ContainerUnit[] {
  const { state, neighborhoodId, action, targetContainerIds } = input;

  if (action === 'none') {
    return [];
  }

  const neighborhoodUnits = state.units.filter(
    (unit) =>
      unit.neighborhoodId === neighborhoodId && unit.status !== 'disabled',
  );

  if (targetContainerIds?.length) {
    const selected = neighborhoodUnits.filter((unit) =>
      targetContainerIds.includes(unit.id),
    );
    if (selected.length > 0) {
      return selected;
    }
  }

  switch (action) {
    case 'prioritize_route':
    case 'dispatch_collection':
      return pickTopUnits(
        neighborhoodUnits,
        unitCollectionPressureScore,
        action === 'dispatch_collection' ? 2 : 3,
      );
    case 'maintenance':
      return pickTopUnits(neighborhoodUnits, unitMaintenancePressureScore, 2);
    case 'communicate':
      return pickTopUnits(neighborhoodUnits, (unit) => unit.complaintPressure, 2);
    case 'add_capacity':
      return pickTopUnits(neighborhoodUnits, unitCollectionPressureScore, 3);
    case 'permanent_solution':
      return neighborhoodUnits;
    case 'monitor':
      return pickTopUnits(neighborhoodUnits, unitCollectionPressureScore, 1);
    default:
      return [];
  }
}

type EffectDeltas = {
  fillRate: number;
  odorLevel: number;
  condition: number;
  maintenanceNeed: number;
  lastCollectedDay?: 'unchanged' | 'set';
};

type ActionEffectSpec = {
  deltas: EffectDeltas;
  summaryLine: string;
  severity: ContainerDecisionEffectSummary['severity'];
  metricHints?: ContainerDecisionResult['metricHints'];
};

function getActionEffectSpec(
  action: ContainerDecisionAction,
  personnelAssigned: boolean,
): ActionEffectSpec | null {
  switch (action) {
    case 'monitor':
      return {
        deltas: {
          fillRate: -3,
          odorLevel: -2,
          condition: 0,
          maintenanceNeed: 0,
          lastCollectedDay: 'unchanged',
        },
        summaryLine:
          'Durum izlemeye alındı; fiziksel etki sınırlı kaldı.',
        severity: 'low',
      };
    case 'dispatch_collection': {
      const multiplier = personnelAssigned ? PERSONNEL_DISPATCH_MULTIPLIER : 1;
      return {
        deltas: {
          fillRate: -25 * multiplier,
          odorLevel: -14 * multiplier,
          condition: -1,
          maintenanceNeed: -4,
          lastCollectedDay: 'set',
        },
        summaryLine:
          'Saha ekibi yönlendirildi; doluluk ve koku baskısı azaldı.',
        severity: 'medium',
        metricHints: { cleanlinessDelta: 2 },
      };
    }
    case 'prioritize_route':
      return {
        deltas: {
          fillRate: -40,
          odorLevel: -23,
          condition: 0,
          maintenanceNeed: -3,
          lastCollectedDay: 'set',
        },
        summaryLine: 'Toplama rotası öne alındı; taşma riski belirgin azaldı.',
        severity: 'high',
        metricHints: { cleanlinessDelta: 2 },
      };
    case 'communicate':
      return {
        deltas: {
          fillRate: 0,
          odorLevel: -5,
          condition: 0,
          maintenanceNeed: 0,
          lastCollectedDay: 'unchanged',
        },
        summaryLine:
          'Bilgilendirme sosyal baskıyı azalttı; fiziksel sorun takip gerektiriyor.',
        severity: 'low',
        metricHints: { trustDelta: 1 },
      };
    case 'maintenance':
      return {
        deltas: {
          fillRate: -5,
          odorLevel: -4,
          condition: 22,
          maintenanceNeed: -35,
          lastCollectedDay: 'unchanged',
        },
        summaryLine: 'Bakım müdahalesi konteyner kondisyonunu toparladı.',
        severity: 'medium',
        metricHints: { cleanlinessDelta: 1 },
      };
    case 'permanent_solution':
      return {
        deltas: {
          fillRate: -24,
          odorLevel: -22,
          condition: 15,
          maintenanceNeed: -28,
          lastCollectedDay: 'set',
        },
        summaryLine: 'Kalıcı düzenleme tekrar riskini azalttı.',
        severity: 'high',
        metricHints: { cleanlinessDelta: 2, trustDelta: 1 },
      };
    case 'add_capacity':
      return {
        deltas: {
          fillRate: -22,
          odorLevel: -10,
          condition: 0,
          maintenanceNeed: 0,
          lastCollectedDay: 'unchanged',
        },
        summaryLine: 'Ek kapasite baskısı azaltıldı; taşma ihtimali düştü.',
        severity: 'medium',
      };
    default:
      return null;
  }
}

function applyDeltasToUnit(
  unit: ContainerUnit,
  deltas: EffectDeltas,
  day: number,
): ContainerUnit {
  const next: ContainerUnit = {
    ...unit,
    fillRate: clampContainerValue(unit.fillRate + deltas.fillRate),
    odorLevel: clampContainerValue(unit.odorLevel + deltas.odorLevel),
    condition: clampContainerValue(unit.condition + deltas.condition),
    maintenanceNeed: clampContainerValue(
      unit.maintenanceNeed + deltas.maintenanceNeed,
    ),
    lastCollectedDay:
      deltas.lastCollectedDay === 'set'
        ? day
        : unit.lastCollectedDay,
  };

  return normalizeContainerUnit(next);
}

function emptyDecisionResult(state: ContainerState): ContainerDecisionResult {
  return {
    state,
    affectedUnitIds: [],
    summary: {
      action: 'none',
      neighborhoodId: null,
      affectedUnitIds: [],
      summaryLine: null,
      severity: 'none',
    },
  };
}

export function applyContainerDecisionEffects(
  input: ContainerDecisionInput,
): ContainerDecisionResult {
  const { containerState } = input;
  const day = Math.max(1, input.day);
  const action = classifyContainerDecisionAction({
    event: input.event,
    decision: input.decision,
  });

  const neighborhoodId =
    input.targetNeighborhoodId ??
    resolveContainerDecisionNeighborhood({
      event: input.event,
      decision: input.decision,
    });

  if (action === 'none' || !neighborhoodId) {
    return emptyDecisionResult(containerState);
  }

  const effectSpec = getActionEffectSpec(
    action,
    input.personnelAssigned === true,
  );
  if (!effectSpec) {
    return emptyDecisionResult(containerState);
  }

  const targetUnits = selectTargetContainerUnitsForDecision({
    state: containerState,
    neighborhoodId,
    action,
    event: input.event,
    targetContainerIds: input.targetContainerIds,
  });

  if (targetUnits.length === 0) {
    return emptyDecisionResult(containerState);
  }

  const targetIds = new Set(targetUnits.map((unit) => unit.id));

  const units = containerState.units.map((unit) => {
    if (!targetIds.has(unit.id)) {
      return unit;
    }
    return applyDeltasToUnit(unit, effectSpec.deltas, day);
  });

  const nextState: ContainerState = {
    ...containerState,
    units,
    aggregates: recomputeContainerAggregates(
      units,
      containerState.lastProcessedDay,
    ),
    dayModifiers: containerState.dayModifiers,
  };

  const affectedUnitIds = targetUnits.map((unit) => unit.id);

  return {
    state: nextState,
    affectedUnitIds,
    metricHints: effectSpec.metricHints,
    summary: {
      action,
      neighborhoodId,
      affectedUnitIds,
      summaryLine: effectSpec.summaryLine,
      severity: effectSpec.severity,
    },
  };
}
