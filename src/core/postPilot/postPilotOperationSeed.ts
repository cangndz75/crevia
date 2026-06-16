import {
  DEFAULT_PREVIEW_SCOPES,
  POST_PILOT_PHASES,
  POST_PILOT_SCOPE_IDS,
  SCOPE_ACTIVATION_STATUSES,
} from './postPilotOperationConstants';
import { POST_PILOT_FIRST_OPERATION_DAY } from './postPilotEventConstants';
import type { PostPilotDailyEventSet } from './postPilotEventTypes';
import type {
  PostPilotNormalizeContext,
  PostPilotOperationState,
  PostPilotPhase,
  PostPilotScopeId,
  ScopeActivationStatus,
} from './postPilotOperationTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isPostPilotPhase(value: unknown): value is PostPilotPhase {
  return (
    typeof value === 'string' &&
    (POST_PILOT_PHASES as readonly string[]).includes(value)
  );
}

function isScopeActivationStatus(value: unknown): value is ScopeActivationStatus {
  return (
    typeof value === 'string' &&
    (SCOPE_ACTIVATION_STATUSES as readonly string[]).includes(value)
  );
}

function normalizePostPilotDailyEventSet(raw: unknown): PostPilotDailyEventSet | undefined {
  if (!isRecord(raw)) {
    return undefined;
  }
  const day = raw.day;
  const anchorEventId = raw.anchorEventId;
  const allEventIds = raw.allEventIds;
  const catalog = raw.catalog;
  if (typeof day !== 'number' || typeof anchorEventId !== 'string') {
    return undefined;
  }
  if (!Array.isArray(allEventIds) || !Array.isArray(catalog)) {
    return undefined;
  }
  const sideEventIds = Array.isArray(raw.sideEventIds)
    ? raw.sideEventIds.filter((id): id is string => typeof id === 'string')
    : [];
  const deferredEventIds = Array.isArray(raw.deferredEventIds)
    ? raw.deferredEventIds.filter((id): id is string => typeof id === 'string')
    : [];

  return {
    day: Math.max(POST_PILOT_FIRST_OPERATION_DAY, Math.round(day)),
    anchorEventId,
    sideEventIds,
    allEventIds: allEventIds.filter((id): id is string => typeof id === 'string'),
    catalog: catalog as PostPilotDailyEventSet['catalog'],
    deferredEventIds,
  };
}

function normalizeScopes(raw: unknown): Record<PostPilotScopeId, ScopeActivationStatus> {
  const base = { ...DEFAULT_PREVIEW_SCOPES };
  if (!isRecord(raw)) {
    return base;
  }

  for (const scopeId of POST_PILOT_SCOPE_IDS) {
    const value = raw[scopeId];
    if (isScopeActivationStatus(value)) {
      base[scopeId] = value;
    }
  }

  return base;
}

function resolvePhaseFallback(context: PostPilotNormalizeContext): PostPilotPhase {
  if (context.pilotStatus === 'active' || context.pilotStatus === 'not_started') {
    return 'pilot_only';
  }
  return 'pilot_complete_idle';
}

function clampPhaseForPilotStatus(
  phase: PostPilotPhase,
  context: PostPilotNormalizeContext,
): PostPilotPhase {
  if (context.pilotStatus === 'active' || context.pilotStatus === 'not_started') {
    if (phase === 'pilot_only') {
      return phase;
    }
    return 'pilot_only';
  }

  if (context.pilotStatus === 'completed') {
    if (phase === 'pilot_only') {
      return 'pilot_complete_idle';
    }
    return phase;
  }

  return resolvePhaseFallback(context);
}

export function createInitialPostPilotOperationState(
  context: PostPilotNormalizeContext,
): PostPilotOperationState {
  const day = Math.max(1, context.currentPilotDay ?? 1);

  if (context.pilotStatus === 'active' || context.pilotStatus === 'not_started') {
    return {
      phase: 'pilot_only',
      scopes: { ...DEFAULT_PREVIEW_SCOPES },
      lastUpdatedDay: day,
    };
  }

  return {
    phase: 'pilot_complete_idle',
    scopes: { ...DEFAULT_PREVIEW_SCOPES },
    lastUpdatedDay: day,
  };
}

export function normalizePostPilotOperationState(
  input: unknown,
  context: PostPilotNormalizeContext,
): PostPilotOperationState {
  const fallback = createInitialPostPilotOperationState(context);

  if (!isRecord(input)) {
    return fallback;
  }

  const rawPhase = input.phase;
  const phase = isPostPilotPhase(rawPhase)
    ? clampPhaseForPilotStatus(rawPhase, context)
    : resolvePhaseFallback(context);

  const previewSeenAt =
    typeof input.previewSeenAt === 'string' ? input.previewSeenAt : undefined;
  const lightOperationStartedAt =
    typeof input.lightOperationStartedAt === 'string'
      ? input.lightOperationStartedAt
      : undefined;

  const lastUpdatedDay =
    typeof input.lastUpdatedDay === 'number' && Number.isFinite(input.lastUpdatedDay)
      ? Math.max(1, Math.round(input.lastUpdatedDay))
      : fallback.lastUpdatedDay;

  const operationDay =
    typeof input.operationDay === 'number' && Number.isFinite(input.operationDay)
      ? Math.max(POST_PILOT_FIRST_OPERATION_DAY, Math.round(input.operationDay))
      : phase === 'main_operation_light'
        ? Math.max(POST_PILOT_FIRST_OPERATION_DAY, lastUpdatedDay ?? POST_PILOT_FIRST_OPERATION_DAY)
        : undefined;

  const postPilotDailyEventSet = normalizePostPilotDailyEventSet(
    input.postPilotDailyEventSet,
  );

  return {
    phase,
    scopes: normalizeScopes(input.scopes),
    previewSeenAt,
    lightOperationStartedAt,
    lastUpdatedDay,
    operationDay,
    postPilotDailyEventSet,
  };
}
