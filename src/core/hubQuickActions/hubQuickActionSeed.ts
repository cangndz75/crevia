import { PERSONNEL_COMPETENCY_KEYS } from '@/core/personnel/personnelCompetency';
import type { PersonnelCompetencyKey } from '@/core/personnel/personnelTypes';

import {
  HUB_QUICK_ACTION_MAX_RECORDS,
  NEIGHBORHOOD_PATROL_FOCUS_VALUES,
  NEIGHBORHOOD_PATROL_SIGNAL_CATEGORY_VALUES,
  NEIGHBORHOOD_PATROL_SIGNAL_TONE_VALUES,
  NEIGHBORHOOD_PATROL_SOURCE_VALUES,
  ROUTE_PREPARATION_FOCUS_VALUES,
  ROUTE_PREPARATION_SOURCE_VALUES,
  SOCIAL_RESPONSE_SOURCE_VALUES,
  SOCIAL_RESPONSE_TYPE_VALUES,
  isHubQuickActionId,
} from './hubQuickActionConstants';
import type {
  FieldDutyAssignment,
  HubQuickActionId,
  HubQuickActionRecord,
  HubQuickActionState,
  NeighborhoodPatrolAssignment,
  NeighborhoodPatrolFocus,
  NeighborhoodPatrolSignal,
  NeighborhoodPatrolSignalCategory,
  NeighborhoodPatrolSignalTone,
  NeighborhoodPatrolSource,
  RoutePreparationAssignment,
  RoutePreparationFocus,
  RoutePreparationSource,
  SocialResponseAssignment,
  SocialResponseSource,
  SocialResponseType,
} from './hubQuickActionTypes';

export function createInitialHubQuickActionState(day: number): HubQuickActionState {
  return {
    day: Math.max(1, day),
    usedActionIds: [],
    records: [],
    sequence: 0,
    lastResult: undefined,
  };
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null;
}

function parseHubQuickActionRecord(
  raw: unknown,
  fallbackDay: number,
): HubQuickActionRecord | null {
  if (!isRecord(raw)) return null;
  if (!isHubQuickActionId(raw.actionId)) return null;
  if (typeof raw.id !== 'string') return null;
  const day = typeof raw.day === 'number' ? raw.day : fallbackDay;
  const title = typeof raw.title === 'string' ? raw.title : '';
  const targetLabel = typeof raw.targetLabel === 'string' ? raw.targetLabel : '';
  const resultLine = typeof raw.resultLine === 'string' ? raw.resultLine : '';
  const createdAtDay =
    typeof raw.createdAtDay === 'number' ? raw.createdAtDay : day;
  const createdAtSequence =
    typeof raw.createdAtSequence === 'number'
      ? raw.createdAtSequence
      : typeof raw.sequence === 'number'
        ? raw.sequence
        : 0;
  if (!title || !resultLine) return null;
  return {
    id: raw.id,
    actionId: raw.actionId,
    day,
    title,
    targetLabel,
    resultLine,
    createdAtDay,
    createdAtSequence,
  };
}

function normalizeUsedActionIds(raw: unknown): HubQuickActionId[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<HubQuickActionId>();
  const out: HubQuickActionId[] = [];
  for (const item of raw) {
    if (!isHubQuickActionId(item) || seen.has(item)) continue;
    seen.add(item);
    out.push(item);
  }
  return out;
}

function isPersonnelCompetencyKey(value: unknown): value is PersonnelCompetencyKey {
  return (
    typeof value === 'string' &&
    (PERSONNEL_COMPETENCY_KEYS as readonly string[]).includes(value)
  );
}

function normalizeFieldDuty(
  raw: unknown,
  day: number,
): FieldDutyAssignment | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number' || raw.day !== day) return undefined;
  if (typeof raw.teamId !== 'string' || !raw.teamId.trim()) return undefined;
  if (
    typeof raw.targetNeighborhoodId !== 'string' ||
    !raw.targetNeighborhoodId.trim()
  ) {
    return undefined;
  }
  if (!isPersonnelCompetencyKey(raw.targetCompetency)) return undefined;
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const effectLabel =
    typeof raw.effectLabel === 'string' ? raw.effectLabel.trim() : '';
  if (!label || !effectLabel) return undefined;
  return {
    day,
    teamId: raw.teamId,
    targetNeighborhoodId: raw.targetNeighborhoodId,
    targetCompetency: raw.targetCompetency,
    label,
    effectLabel,
  };
}

function isRoutePreparationFocus(value: unknown): value is RoutePreparationFocus {
  return (
    typeof value === 'string' &&
    (ROUTE_PREPARATION_FOCUS_VALUES as readonly string[]).includes(value)
  );
}

function isRoutePreparationSource(value: unknown): value is RoutePreparationSource {
  return (
    typeof value === 'string' &&
    (ROUTE_PREPARATION_SOURCE_VALUES as readonly string[]).includes(value)
  );
}

function isNeighborhoodPatrolFocus(value: unknown): value is NeighborhoodPatrolFocus {
  return (
    typeof value === 'string' &&
    (NEIGHBORHOOD_PATROL_FOCUS_VALUES as readonly string[]).includes(value)
  );
}

function isNeighborhoodPatrolSource(value: unknown): value is NeighborhoodPatrolSource {
  return (
    typeof value === 'string' &&
    (NEIGHBORHOOD_PATROL_SOURCE_VALUES as readonly string[]).includes(value)
  );
}

function isPatrolSignalTone(value: unknown): value is NeighborhoodPatrolSignalTone {
  return (
    typeof value === 'string' &&
    (NEIGHBORHOOD_PATROL_SIGNAL_TONE_VALUES as readonly string[]).includes(value)
  );
}

function isPatrolSignalCategory(
  value: unknown,
): value is NeighborhoodPatrolSignalCategory {
  return (
    typeof value === 'string' &&
    (NEIGHBORHOOD_PATROL_SIGNAL_CATEGORY_VALUES as readonly string[]).includes(value)
  );
}

function normalizePatrolSignal(
  raw: unknown,
  day: number,
): NeighborhoodPatrolSignal | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.id !== 'string' || !raw.id.trim()) return undefined;
  if (typeof raw.day !== 'number' || raw.day !== day) return undefined;
  if (typeof raw.neighborhoodId !== 'string' || !raw.neighborhoodId.trim()) {
    return undefined;
  }
  if (!isPatrolSignalTone(raw.tone)) return undefined;
  if (!isPatrolSignalCategory(raw.category)) return undefined;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const body = typeof raw.body === 'string' ? raw.body.trim() : '';
  if (!title || !body) return undefined;
  return {
    id: raw.id,
    day,
    neighborhoodId: raw.neighborhoodId,
    title,
    body,
    tone: raw.tone,
    category: raw.category,
  };
}

function isSocialResponseType(value: unknown): value is SocialResponseType {
  return (
    typeof value === 'string' &&
    (SOCIAL_RESPONSE_TYPE_VALUES as readonly string[]).includes(value)
  );
}

function isSocialResponseSource(value: unknown): value is SocialResponseSource {
  return (
    typeof value === 'string' &&
    (SOCIAL_RESPONSE_SOURCE_VALUES as readonly string[]).includes(value)
  );
}

function normalizeSocialResponse(
  raw: unknown,
  day: number,
): SocialResponseAssignment | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number' || raw.day !== day) return undefined;
  if (!isSocialResponseType(raw.responseType)) return undefined;
  if (!isSocialResponseSource(raw.source)) return undefined;
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const effectLabel =
    typeof raw.effectLabel === 'string' ? raw.effectLabel.trim() : '';
  if (!label || !effectLabel) return undefined;

  const targetTopicId =
    typeof raw.targetTopicId === 'string' && raw.targetTopicId.trim()
      ? raw.targetTopicId.trim()
      : undefined;
  const targetTopicTitle =
    typeof raw.targetTopicTitle === 'string' && raw.targetTopicTitle.trim()
      ? raw.targetTopicTitle.trim()
      : undefined;
  const targetNeighborhoodId =
    typeof raw.targetNeighborhoodId === 'string' && raw.targetNeighborhoodId.trim()
      ? raw.targetNeighborhoodId.trim()
      : undefined;
  const targetNeighborhoodLabel =
    typeof raw.targetNeighborhoodLabel === 'string' &&
    raw.targetNeighborhoodLabel.trim()
      ? raw.targetNeighborhoodLabel.trim()
      : undefined;

  return {
    day,
    targetTopicId,
    targetTopicTitle,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    responseType: raw.responseType,
    source: raw.source,
    label,
    effectLabel,
  };
}

function normalizeNeighborhoodPatrol(
  raw: unknown,
  day: number,
): NeighborhoodPatrolAssignment | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number' || raw.day !== day) return undefined;
  if (
    typeof raw.targetNeighborhoodId !== 'string' ||
    !raw.targetNeighborhoodId.trim()
  ) {
    return undefined;
  }
  if (!isNeighborhoodPatrolFocus(raw.patrolFocus)) return undefined;
  if (!isNeighborhoodPatrolSource(raw.source)) return undefined;
  const targetNeighborhoodLabel =
    typeof raw.targetNeighborhoodLabel === 'string'
      ? raw.targetNeighborhoodLabel.trim()
      : '';
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const effectLabel =
    typeof raw.effectLabel === 'string' ? raw.effectLabel.trim() : '';
  if (!targetNeighborhoodLabel || !label || !effectLabel) return undefined;

  const revealedSignal = normalizePatrolSignal(raw.revealedSignal, day);

  return {
    day,
    targetNeighborhoodId: raw.targetNeighborhoodId,
    targetNeighborhoodLabel,
    patrolFocus: raw.patrolFocus,
    source: raw.source,
    label,
    effectLabel,
    revealedSignal,
  };
}

function normalizeRoutePreparation(
  raw: unknown,
  day: number,
): RoutePreparationAssignment | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number' || raw.day !== day) return undefined;
  if (!isRoutePreparationFocus(raw.routeFocus)) return undefined;
  if (!isRoutePreparationSource(raw.source)) return undefined;
  const targetNeighborhoodLabel =
    typeof raw.targetNeighborhoodLabel === 'string'
      ? raw.targetNeighborhoodLabel.trim()
      : '';
  const label = typeof raw.label === 'string' ? raw.label.trim() : '';
  const effectLabel =
    typeof raw.effectLabel === 'string' ? raw.effectLabel.trim() : '';
  if (!targetNeighborhoodLabel || !label || !effectLabel) return undefined;

  const targetNeighborhoodId =
    typeof raw.targetNeighborhoodId === 'string' && raw.targetNeighborhoodId.trim()
      ? raw.targetNeighborhoodId.trim()
      : undefined;
  const targetVehicleId =
    typeof raw.targetVehicleId === 'string' && raw.targetVehicleId.trim()
      ? raw.targetVehicleId.trim()
      : undefined;
  const targetVehicleLabel =
    typeof raw.targetVehicleLabel === 'string' && raw.targetVehicleLabel.trim()
      ? raw.targetVehicleLabel.trim()
      : undefined;
  const targetVehicleCategory =
    typeof raw.targetVehicleCategory === 'string' && raw.targetVehicleCategory.trim()
      ? raw.targetVehicleCategory.trim()
      : undefined;

  return {
    day,
    targetNeighborhoodId,
    targetNeighborhoodLabel,
    targetVehicleId,
    targetVehicleLabel,
    targetVehicleCategory,
    routeFocus: raw.routeFocus,
    source: raw.source,
    label,
    effectLabel,
  };
}

function normalizeRecords(raw: unknown, fallbackDay: number): HubQuickActionRecord[] {
  if (!Array.isArray(raw)) return [];
  const parsed: HubQuickActionRecord[] = [];
  for (const item of raw) {
    const record = parseHubQuickActionRecord(item, fallbackDay);
    if (record) parsed.push(record);
  }
  return parsed.slice(-HUB_QUICK_ACTION_MAX_RECORDS);
}

export function normalizePersistedHubQuickActionState(
  input: unknown,
  currentDay: number,
): HubQuickActionState {
  const day = Math.max(1, currentDay);

  if (!isRecord(input)) {
    return createInitialHubQuickActionState(day);
  }

  const storedDay = typeof input.day === 'number' ? input.day : day;
  if (storedDay !== day) {
    return createInitialHubQuickActionState(day);
  }

  const usedActionIds = normalizeUsedActionIds(input.usedActionIds);
  const records = normalizeRecords(input.records, day);
  const sequence =
    typeof input.sequence === 'number' && Number.isFinite(input.sequence)
      ? Math.max(0, Math.floor(input.sequence))
      : records.length > 0
        ? Math.max(...records.map((r) => r.createdAtSequence))
        : 0;

  const syncedUsed = new Set(usedActionIds);
  for (const record of records) {
    if (record.day === day) {
      syncedUsed.add(record.actionId);
    }
  }

  const fieldDuty = normalizeFieldDuty(input.fieldDuty, day);
  if (fieldDuty) {
    syncedUsed.add('field_duty');
  }

  const routePreparation = normalizeRoutePreparation(input.routePreparation, day);
  if (routePreparation) {
    syncedUsed.add('route_preparation');
  }

  const neighborhoodPatrol = normalizeNeighborhoodPatrol(input.neighborhoodPatrol, day);
  if (neighborhoodPatrol) {
    syncedUsed.add('neighborhood_patrol');
  }

  const socialResponse = normalizeSocialResponse(input.socialResponse, day);
  if (socialResponse) {
    syncedUsed.add('social_response');
  }

  return {
    day,
    usedActionIds: [...syncedUsed],
    records,
    sequence,
    lastResult: undefined,
    fieldDuty,
    routePreparation,
    neighborhoodPatrol,
    socialResponse,
  };
}
