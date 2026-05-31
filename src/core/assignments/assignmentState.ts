import type { EventCard } from '@/core/models/EventCard';
import type { DailyOperationsPlanState } from '@/core/dailyPlanning/dailyPlanningTypes';
import type { OperationSignalsState } from '@/core/operations/operationSignalTypes';

import { MAX_ASSIGNMENTS_STORED } from './assignmentConstants';
import type {
  AssignmentEffect,
  AssignmentEffectDomain,
  AssignmentSource,
  AssignmentStatus,
  AssignmentsState,
  CompatibilityLabel,
  EventAssignmentState,
  PersonnelAssignmentType,
  ResponseApproachType,
  VehicleAssignmentType,
} from './assignmentTypes';

const PERSONNEL_KEYS: PersonnelAssignmentType[] = [
  'balanced_team',
  'field_response_team',
  'technical_team',
  'public_relations_team',
  'inspection_team',
];
const VEHICLE_KEYS: VehicleAssignmentType[] = [
  'standard_truck',
  'high_capacity_vehicle',
  'compact_service_vehicle',
  'maintenance_vehicle',
  'route_support_vehicle',
];
const APPROACH_KEYS: ResponseApproachType[] = [
  'balanced_response',
  'rapid_response',
  'lasting_fix',
  'low_resource',
  'public_first',
];

function isPersonnelType(v: unknown): v is PersonnelAssignmentType {
  return typeof v === 'string' && PERSONNEL_KEYS.includes(v as PersonnelAssignmentType);
}
function isVehicleType(v: unknown): v is VehicleAssignmentType {
  return typeof v === 'string' && VEHICLE_KEYS.includes(v as VehicleAssignmentType);
}
function isApproachType(v: unknown): v is ResponseApproachType {
  return typeof v === 'string' && APPROACH_KEYS.includes(v as ResponseApproachType);
}
function isStatus(v: unknown): v is AssignmentStatus {
  return (
    v === 'draft' ||
    v === 'confirmed' ||
    v === 'dispatched' ||
    v === 'processed'
  );
}
function isSource(v: unknown): v is AssignmentSource {
  return v === 'player' || v === 'advisor_suggested' || v === 'auto_default';
}
function isCompatibilityLabel(v: unknown): v is CompatibilityLabel {
  return v === 'Zayıf uyum' || v === 'Dengeli uyum' || v === 'Güçlü uyum';
}

function clampScore(score: number): number {
  if (!Number.isFinite(score)) return 50;
  return Math.min(100, Math.max(0, Math.round(score)));
}

function normalizeEffects(input: unknown): AssignmentEffect[] {
  if (!Array.isArray(input)) return [];
  const out: AssignmentEffect[] = [];
  for (const item of input) {
    if (item == null || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    const domain = raw.domain;
    if (
      domain !== 'personnel' &&
      domain !== 'vehicles' &&
      domain !== 'containers' &&
      domain !== 'districts' &&
      domain !== 'overall'
    ) {
      continue;
    }
    if (typeof raw.reason !== 'string') continue;
    const tags = Array.isArray(raw.sourceTags)
      ? raw.sourceTags.filter((t): t is string => typeof t === 'string')
      : [];
    out.push({
      domain,
      delta: typeof raw.delta === 'number' ? Math.round(raw.delta) : 0,
      reason: raw.reason,
      sourceTags: tags,
    });
  }
  return out;
}

export function createInitialAssignmentsState(): AssignmentsState {
  return { assignmentsByEventId: {} };
}

export function normalizeEventAssignment(
  input: unknown,
  fallbackEventId?: string,
): EventAssignmentState | undefined {
  if (input == null || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  if (typeof raw.eventId !== 'string' && !fallbackEventId) return undefined;
  const eventId =
    typeof raw.eventId === 'string' ? raw.eventId : fallbackEventId ?? '';
  if (!eventId) return undefined;
  if (!isPersonnelType(raw.personnelType) || !isVehicleType(raw.vehicleType)) {
    return undefined;
  }
  if (!isApproachType(raw.approachType)) return undefined;
  const score = clampScore(
    typeof raw.compatibilityScore === 'number' ? raw.compatibilityScore : 50,
  );
  return {
    eventId,
    day: typeof raw.day === 'number' ? Math.floor(raw.day) : 1,
    status: isStatus(raw.status) ? raw.status : 'draft',
    source: isSource(raw.source) ? raw.source : 'advisor_suggested',
    personnelType: raw.personnelType,
    vehicleType: raw.vehicleType,
    approachType: raw.approachType,
    compatibilityScore: score,
    compatibilityLabel: isCompatibilityLabel(raw.compatibilityLabel)
      ? raw.compatibilityLabel
      : 'Dengeli uyum',
    confirmedAtDay:
      typeof raw.confirmedAtDay === 'number' ? Math.floor(raw.confirmedAtDay) : undefined,
    dispatchedAtDay:
      typeof raw.dispatchedAtDay === 'number' ? Math.floor(raw.dispatchedAtDay) : undefined,
    processedAtDay:
      typeof raw.processedAtDay === 'number' ? Math.floor(raw.processedAtDay) : undefined,
    effects: normalizeEffects(raw.effects),
    advisorNote: typeof raw.advisorNote === 'string' ? raw.advisorNote : undefined,
  };
}

export function normalizeAssignmentsState(input: unknown): AssignmentsState {
  if (input == null || typeof input !== 'object') {
    return createInitialAssignmentsState();
  }
  const raw = input as Record<string, unknown>;
  const byId: Record<string, EventAssignmentState> = {};
  if (isRecord(raw.assignmentsByEventId)) {
    for (const [id, val] of Object.entries(raw.assignmentsByEventId)) {
      const normalized = normalizeEventAssignment(val, id);
      if (normalized) byId[id] = normalized;
    }
  }
  let state: AssignmentsState = {
    assignmentsByEventId: byId,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number'
        ? Math.floor(raw.lastProcessedDay)
        : undefined,
  };
  if (raw.dailyAssignmentSummary != null && typeof raw.dailyAssignmentSummary === 'object') {
    const s = raw.dailyAssignmentSummary as Record<string, unknown>;
    state.dailyAssignmentSummary = {
      day: typeof s.day === 'number' ? Math.floor(s.day) : 1,
      confirmedCount:
        typeof s.confirmedCount === 'number' ? Math.floor(s.confirmedCount) : 0,
      strongFitCount:
        typeof s.strongFitCount === 'number' ? Math.floor(s.strongFitCount) : 0,
      weakFitCount: typeof s.weakFitCount === 'number' ? Math.floor(s.weakFitCount) : 0,
      dominantDomain:
        s.dominantDomain === 'personnel' ||
        s.dominantDomain === 'vehicles' ||
        s.dominantDomain === 'containers' ||
        s.dominantDomain === 'districts' ||
        s.dominantDomain === 'overall'
          ? s.dominantDomain
          : undefined,
    };
  }
  return pruneOldAssignments(state, state.dailyAssignmentSummary?.day ?? 9999);
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v);
}

export function getEventAssignment(
  state: AssignmentsState,
  eventId: string,
): EventAssignmentState | undefined {
  return state.assignmentsByEventId[eventId];
}

export function upsertEventAssignment(
  state: AssignmentsState,
  assignment: EventAssignmentState,
): AssignmentsState {
  return pruneOldAssignments(
    {
      ...state,
      assignmentsByEventId: {
        ...state.assignmentsByEventId,
        [assignment.eventId]: assignment,
      },
    },
    assignment.day,
  );
}

export function confirmEventAssignment(
  state: AssignmentsState,
  eventId: string,
  patch: Partial<
    Pick<
      EventAssignmentState,
      'personnelType' | 'vehicleType' | 'approachType'
    >
  >,
  day: number,
): AssignmentsState {
  const existing = state.assignmentsByEventId[eventId];
  if (!existing) return state;
  if (existing.processedAtDay === day) return state;
  const next: EventAssignmentState = {
    ...existing,
    ...patch,
    status: 'confirmed',
    source: 'player',
    confirmedAtDay: day,
  };
  return upsertEventAssignment(state, next);
}

export function markEventAssignmentDispatched(
  state: AssignmentsState,
  eventId: string,
  day: number,
): AssignmentsState {
  const existing = state.assignmentsByEventId[eventId];
  if (!existing) return state;
  return upsertEventAssignment(state, {
    ...existing,
    status: 'dispatched',
    dispatchedAtDay: day,
  });
}

export function markEventAssignmentProcessed(
  state: AssignmentsState,
  eventId: string,
  day: number,
  effects: AssignmentEffect[],
): AssignmentsState {
  const existing = state.assignmentsByEventId[eventId];
  if (!existing || existing.processedAtDay === day) return state;
  return upsertEventAssignment(state, {
    ...existing,
    status: 'processed',
    processedAtDay: day,
    effects,
  });
}

export function pruneOldAssignments(
  state: AssignmentsState,
  currentDay: number,
): AssignmentsState {
  const entries = Object.entries(state.assignmentsByEventId);
  if (entries.length <= MAX_ASSIGNMENTS_STORED) return state;
  const sorted = entries.sort((a, b) => b[1].day - a[1].day);
  const kept = sorted.filter(([, a]) => a.day >= currentDay - 14).slice(0, MAX_ASSIGNMENTS_STORED);
  const byId: Record<string, EventAssignmentState> = {};
  for (const [id, a] of kept) byId[id] = a;
  return { ...state, assignmentsByEventId: byId };
}

export function buildDailyAssignmentSummary(
  state: AssignmentsState,
  day: number,
): AssignmentsState {
  let confirmedCount = 0;
  let strongFitCount = 0;
  let weakFitCount = 0;
  const domainCounts: Partial<Record<AssignmentEffectDomain, number>> = {};

  for (const a of Object.values(state.assignmentsByEventId)) {
    if (a.day !== day) continue;
    if (a.status === 'confirmed' || a.status === 'dispatched' || a.status === 'processed') {
      confirmedCount += 1;
    }
    if (a.compatibilityLabel === 'Güçlü uyum') strongFitCount += 1;
    if (a.compatibilityLabel === 'Zayıf uyum') weakFitCount += 1;
    for (const e of a.effects) {
      domainCounts[e.domain] = (domainCounts[e.domain] ?? 0) + 1;
    }
  }

  let dominantDomain: AssignmentEffectDomain | undefined;
  let max = 0;
  for (const [d, c] of Object.entries(domainCounts)) {
    if (c > max) {
      max = c;
      dominantDomain = d as AssignmentEffectDomain;
    }
  }

  return {
    ...state,
    dailyAssignmentSummary: {
      day,
      confirmedCount,
      strongFitCount,
      weakFitCount,
      dominantDomain,
    },
  };
}

export function createDefaultEventAssignment(
  event: EventCard,
  day: number,
  _plan?: DailyOperationsPlanState,
  _signals?: OperationSignalsState,
): EventAssignmentState {
  return {
    eventId: event.id,
    day,
    status: 'draft',
    source: 'advisor_suggested',
    personnelType: 'balanced_team',
    vehicleType: 'standard_truck',
    approachType: 'balanced_response',
    compatibilityScore: 50,
    compatibilityLabel: 'Dengeli uyum',
    effects: [],
  };
}
