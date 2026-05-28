import {
  AUTHORITY_DEFAULT_FORMAL_RANK_ID,
  AUTHORITY_INITIAL_UNLOCKED_PERMISSIONS,
  AUTHORITY_PERMISSIONS,
  AUTHORITY_RANK_BY_ID,
} from './authorityConstants';
import type {
  AuthorityDailyGainSnapshot,
  AuthorityDomainKey,
  AuthorityDomainScores,
  AuthorityEvaluationSnapshot,
  AuthorityEvaluationStatus,
  AuthorityPermissionId,
  AuthorityRankId,
  AuthorityState,
} from './authorityTypes';

const AUTHORITY_RANK_IDS = Object.keys(AUTHORITY_RANK_BY_ID) as AuthorityRankId[];
const AUTHORITY_PERMISSION_IDS = AUTHORITY_PERMISSIONS.map((p) => p.id);
const AUTHORITY_EVALUATION_STATUSES: AuthorityEvaluationStatus[] = [
  'stable',
  'watching',
  'promotion_candidate',
  'promoted',
];
const AUTHORITY_DOMAIN_KEYS: AuthorityDomainKey[] = [
  'operations',
  'publicTrust',
  'resources',
  'personnel',
  'crisis',
];

function isRecord(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

function clampTrust(value: number): number {
  return Math.max(0, Math.round(value));
}

function clampDomainScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function createDefaultDomainScores(): AuthorityDomainScores {
  return {
    operations: 50,
    publicTrust: 50,
    resources: 50,
    personnel: 50,
    crisis: 50,
  };
}

function isAuthorityRankId(val: unknown): val is AuthorityRankId {
  return typeof val === 'string' && AUTHORITY_RANK_IDS.includes(val as AuthorityRankId);
}

function isAuthorityPermissionId(val: unknown): val is AuthorityPermissionId {
  return (
    typeof val === 'string' &&
    AUTHORITY_PERMISSION_IDS.includes(val as AuthorityPermissionId)
  );
}

function isAuthorityEvaluationStatus(val: unknown): val is AuthorityEvaluationStatus {
  return (
    typeof val === 'string' &&
    AUTHORITY_EVALUATION_STATUSES.includes(val as AuthorityEvaluationStatus)
  );
}

function normalizeDomainScores(raw: unknown): AuthorityDomainScores {
  const defaults = createDefaultDomainScores();
  if (!isRecord(raw)) {
    return defaults;
  }
  const result = { ...defaults };
  for (const key of AUTHORITY_DOMAIN_KEYS) {
    const value = raw[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      result[key] = clampDomainScore(value);
    }
  }
  return result;
}

function normalizeUnlockedPermissionIds(raw: unknown): AuthorityPermissionId[] {
  const seen = new Set<AuthorityPermissionId>();
  const result: AuthorityPermissionId[] = [];

  const add = (id: AuthorityPermissionId) => {
    if (!seen.has(id)) {
      seen.add(id);
      result.push(id);
    }
  };

  add('basic_operations');

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (isAuthorityPermissionId(item)) {
        add(item);
      }
    }
  }

  return result;
}

function normalizeLastDailyGain(raw: unknown): AuthorityDailyGainSnapshot | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number') return undefined;
  if (typeof raw.trustBefore !== 'number') return undefined;
  if (typeof raw.trustAfter !== 'number') return undefined;
  if (typeof raw.netGain !== 'number') return undefined;
  return {
    day: raw.day,
    trustBefore: clampTrust(raw.trustBefore),
    trustAfter: clampTrust(raw.trustAfter),
    netGain: raw.netGain,
    lines: Array.isArray(raw.lines)
      ? raw.lines.filter(isRecord).map((line) => ({
          source: typeof line.source === 'string' ? line.source : 'main_event_resolved',
          delta: typeof line.delta === 'number' ? line.delta : 0,
          label: typeof line.label === 'string' ? line.label : '',
        })) as AuthorityDailyGainSnapshot['lines']
      : [],
    domainScoreDeltas: (() => {
      if (!isRecord(raw.domainScoreDeltas)) return {};
      const deltas: Partial<AuthorityDomainScores> = {};
      for (const key of AUTHORITY_DOMAIN_KEYS) {
        const value = raw.domainScoreDeltas[key];
        if (typeof value === 'number' && Number.isFinite(value)) {
          deltas[key] = clampDomainScore(value);
        }
      }
      return deltas;
    })(),
    newlyUnlockedPermissionIds: normalizeUnlockedPermissionIds(
      raw.newlyUnlockedPermissionIds,
    ),
  };
}

function normalizeLastEvaluation(raw: unknown): AuthorityEvaluationSnapshot | undefined {
  if (!isRecord(raw)) return undefined;
  if (typeof raw.day !== 'number') return undefined;
  if (typeof raw.pilotScore !== 'number') return undefined;
  if (typeof raw.trustAtEvaluation !== 'number') return undefined;
  if (!isAuthorityRankId(raw.previousFormalRankId)) return undefined;
  if (typeof raw.promoted !== 'boolean') return undefined;
  if (!isAuthorityEvaluationStatus(raw.evaluationStatus)) return undefined;
  return {
    day: raw.day,
    pilotScore: raw.pilotScore,
    trustAtEvaluation: clampTrust(raw.trustAtEvaluation),
    previousFormalRankId: raw.previousFormalRankId,
    nextFormalRankId: isAuthorityRankId(raw.nextFormalRankId)
      ? raw.nextFormalRankId
      : undefined,
    evaluationStatus: raw.evaluationStatus,
    pendingPromotionRankId: isAuthorityRankId(raw.pendingPromotionRankId)
      ? raw.pendingPromotionRankId
      : undefined,
    promoted: raw.promoted,
    summaryLines: Array.isArray(raw.summaryLines)
      ? raw.summaryLines.filter((line): line is string => typeof line === 'string')
      : [],
    pilotRunId: typeof raw.pilotRunId === 'string' ? raw.pilotRunId : undefined,
  };
}

export function createInitialAuthorityState(day: number): AuthorityState {
  const safeDay = Math.max(1, day);
  return {
    authorityTrust: 0,
    formalRankId: AUTHORITY_DEFAULT_FORMAL_RANK_ID,
    evaluationStatus: 'stable',
    pendingPromotionRankId: undefined,
    unlockedPermissionIds: [...AUTHORITY_INITIAL_UNLOCKED_PERMISSIONS],
    domainScores: createDefaultDomainScores(),
    history: [],
    lastDailyGain: undefined,
    lastEvaluation: undefined,
    lastUpdatedDay: safeDay,
  };
}

export function normalizeAuthorityState(
  input: unknown,
  day: number,
): AuthorityState {
  if (!isRecord(input)) {
    return createInitialAuthorityState(day);
  }

  const safeDay = Math.max(1, day);
  const authorityTrust = clampTrust(
    typeof input.authorityTrust === 'number' ? input.authorityTrust : 0,
  );
  const formalRankId = isAuthorityRankId(input.formalRankId)
    ? input.formalRankId
    : AUTHORITY_DEFAULT_FORMAL_RANK_ID;
  const evaluationStatus = isAuthorityEvaluationStatus(input.evaluationStatus)
    ? input.evaluationStatus
    : 'stable';
  const pendingPromotionRankId = isAuthorityRankId(input.pendingPromotionRankId)
    ? input.pendingPromotionRankId
    : undefined;

  return {
    authorityTrust,
    formalRankId,
    evaluationStatus,
    pendingPromotionRankId,
    unlockedPermissionIds: normalizeUnlockedPermissionIds(
      input.unlockedPermissionIds,
    ),
    domainScores: normalizeDomainScores(input.domainScores),
    history: Array.isArray(input.history)
      ? input.history.filter(isRecord).map((entry) => ({
          day: typeof entry.day === 'number' ? entry.day : safeDay,
          type:
            entry.type === 'daily_gain' ||
            entry.type === 'evaluation' ||
            entry.type === 'permission_unlock'
              ? entry.type
              : 'daily_gain',
          trustDelta:
            typeof entry.trustDelta === 'number' ? entry.trustDelta : undefined,
          trustAfter:
            typeof entry.trustAfter === 'number'
              ? clampTrust(entry.trustAfter)
              : authorityTrust,
          formalRankId: isAuthorityRankId(entry.formalRankId)
            ? entry.formalRankId
            : formalRankId,
          note: typeof entry.note === 'string' ? entry.note : undefined,
        }))
      : [],
    lastDailyGain: normalizeLastDailyGain(input.lastDailyGain),
    lastEvaluation: normalizeLastEvaluation(input.lastEvaluation),
    lastUpdatedDay:
      typeof input.lastUpdatedDay === 'number'
        ? Math.max(1, input.lastUpdatedDay)
        : safeDay,
  };
}

export function normalizePersistedAuthorityState(
  input: unknown,
  day: number,
): AuthorityState {
  return normalizeAuthorityState(input, day);
}

export { clampDomainScore, clampTrust, createDefaultDomainScores };
