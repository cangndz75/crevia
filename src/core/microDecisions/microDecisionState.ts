import {
  MICRO_DECISION_EXPIRE_AFTER_DAYS,
  MICRO_DECISION_MAX_HISTORY,
} from './microDecisionConstants';
import type {
  MicroDecision,
  MicroDecisionDailySummary,
  MicroDecisionDomain,
  MicroDecisionOption,
  MicroDecisionState,
  MicroDecisionStatus,
  MicroDecisionType,
} from './microDecisionTypes';

const VALID_TYPES = new Set<MicroDecisionType>([
  'advisor_warning',
  'field_update',
  'crisis_threshold',
  'district_representative',
  'operation_opportunity',
]);

const VALID_STATUSES = new Set<MicroDecisionStatus>([
  'available',
  'resolved',
  'expired',
  'skipped',
]);

const VALID_DOMAINS = new Set<MicroDecisionDomain>([
  'personnel',
  'vehicles',
  'containers',
  'districts',
  'social',
  'crisis',
  'assignments',
  'planning',
  'season',
]);

export function createInitialMicroDecisionState(): MicroDecisionState {
  return {
    decisionsById: {},
    activeDecisionIds: [],
  };
}

function normalizeOption(raw: unknown): MicroDecisionOption | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.id !== 'string' || typeof o.label !== 'string') return undefined;
  const effects = Array.isArray(o.effects)
    ? o.effects
        .map((e) => {
          if (e == null || typeof e !== 'object') return undefined;
          const eff = e as Record<string, unknown>;
          if (typeof eff.domain !== 'string' || !VALID_DOMAINS.has(eff.domain as MicroDecisionDomain)) {
            return undefined;
          }
          return {
            domain: eff.domain as MicroDecisionDomain,
            targetId: typeof eff.targetId === 'string' ? eff.targetId : undefined,
            delta: typeof eff.delta === 'number' ? eff.delta : 0,
            reason: typeof eff.reason === 'string' ? eff.reason : '',
            sourceTags: Array.isArray(eff.sourceTags)
              ? eff.sourceTags.filter((t): t is string => typeof t === 'string')
              : [],
          };
        })
        .filter((x): x is NonNullable<typeof x> => x != null)
    : [];
  if (effects.length === 0) return undefined;
  const tone =
    o.tone === 'positive' ||
    o.tone === 'warning' ||
    o.tone === 'critical' ||
    o.tone === 'neutral'
      ? o.tone
      : 'neutral';
  return {
    id: o.id,
    label: o.label,
    description: typeof o.description === 'string' ? o.description : '',
    upside: typeof o.upside === 'string' ? o.upside : '',
    tradeoff: typeof o.tradeoff === 'string' ? o.tradeoff : '',
    tone,
    effects,
    sourceTags: Array.isArray(o.sourceTags)
      ? o.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

export function normalizeMicroDecision(raw: unknown): MicroDecision | undefined {
  if (raw == null || typeof raw !== 'object') return undefined;
  const d = raw as Record<string, unknown>;
  if (typeof d.id !== 'string' || typeof d.day !== 'number') return undefined;
  if (typeof d.type !== 'string' || !VALID_TYPES.has(d.type as MicroDecisionType)) {
    return undefined;
  }
  if (typeof d.status !== 'string' || !VALID_STATUSES.has(d.status as MicroDecisionStatus)) {
    return undefined;
  }
  if (typeof d.domain !== 'string' || !VALID_DOMAINS.has(d.domain as MicroDecisionDomain)) {
    return undefined;
  }
  const options = Array.isArray(d.options)
    ? d.options.map(normalizeOption).filter((x): x is MicroDecisionOption => x != null)
    : [];
  if (options.length < 2) return undefined;
  const optionIds = new Set(options.map((o) => o.id));
  const selectedOptionId =
    typeof d.selectedOptionId === 'string' && optionIds.has(d.selectedOptionId)
      ? d.selectedOptionId
      : undefined;
  return {
    id: d.id,
    day: Math.floor(d.day),
    type: d.type as MicroDecisionType,
    status: d.status as MicroDecisionStatus,
    domain: d.domain as MicroDecisionDomain,
    title: typeof d.title === 'string' ? d.title : '',
    summary: typeof d.summary === 'string' ? d.summary : '',
    reasonLine: typeof d.reasonLine === 'string' ? d.reasonLine : '',
    advisorLine: typeof d.advisorLine === 'string' ? d.advisorLine : undefined,
    districtId: typeof d.districtId === 'string' ? d.districtId : undefined,
    relatedEventId: typeof d.relatedEventId === 'string' ? d.relatedEventId : undefined,
    relatedIncidentId:
      typeof d.relatedIncidentId === 'string' ? d.relatedIncidentId : undefined,
    options,
    selectedOptionId,
    createdAtDay:
      typeof d.createdAtDay === 'number' ? Math.floor(d.createdAtDay) : Math.floor(d.day),
    resolvedAtDay:
      typeof d.resolvedAtDay === 'number' ? Math.floor(d.resolvedAtDay) : undefined,
    expiresAtDay:
      typeof d.expiresAtDay === 'number' ? Math.floor(d.expiresAtDay) : undefined,
    effectsApplied: d.effectsApplied === true,
    sourceTags: Array.isArray(d.sourceTags)
      ? d.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

export function normalizeMicroDecisionState(input: unknown): MicroDecisionState {
  if (input == null || typeof input !== 'object') {
    return createInitialMicroDecisionState();
  }
  const raw = input as Record<string, unknown>;
  const decisionsById: Record<string, MicroDecision> = {};
  if (raw.decisionsById != null && typeof raw.decisionsById === 'object') {
    for (const [key, val] of Object.entries(raw.decisionsById as Record<string, unknown>)) {
      const normalized = normalizeMicroDecision(val);
      if (normalized) {
        decisionsById[normalized.id] = normalized;
      }
    }
  }
  const activeDecisionIds = Array.isArray(raw.activeDecisionIds)
    ? raw.activeDecisionIds.filter(
        (id): id is string =>
          typeof id === 'string' &&
          decisionsById[id]?.status === 'available',
      )
    : Object.values(decisionsById)
        .filter((d) => d.status === 'available')
        .map((d) => d.id);

  let dailySummary: MicroDecisionDailySummary | undefined;
  if (raw.dailySummary != null && typeof raw.dailySummary === 'object') {
    const s = raw.dailySummary as Record<string, unknown>;
    if (typeof s.day === 'number') {
      dailySummary = {
        day: Math.floor(s.day),
        generatedCount: typeof s.generatedCount === 'number' ? s.generatedCount : 0,
        resolvedCount: typeof s.resolvedCount === 'number' ? s.resolvedCount : 0,
        skippedCount: typeof s.skippedCount === 'number' ? s.skippedCount : 0,
        dominantDomain:
          typeof s.dominantDomain === 'string' &&
          VALID_DOMAINS.has(s.dominantDomain as MicroDecisionDomain)
            ? (s.dominantDomain as MicroDecisionDomain)
            : undefined,
        reportLines: Array.isArray(s.reportLines)
          ? s.reportLines.filter((l): l is string => typeof l === 'string').slice(0, 3)
          : [],
      };
    }
  }

  return {
    decisionsById,
    activeDecisionIds,
    dailySummary,
    lastGeneratedDay:
      typeof raw.lastGeneratedDay === 'number' ? Math.floor(raw.lastGeneratedDay) : undefined,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number' ? Math.floor(raw.lastProcessedDay) : undefined,
    lastPrunedDay:
      typeof raw.lastPrunedDay === 'number' ? Math.floor(raw.lastPrunedDay) : undefined,
  };
}

export function getActiveMicroDecisions(state: MicroDecisionState): MicroDecision[] {
  return state.activeDecisionIds
    .map((id) => state.decisionsById[id])
    .filter((d): d is MicroDecision => d != null && d.status === 'available');
}

export function addMicroDecision(
  state: MicroDecisionState,
  decision: MicroDecision,
): MicroDecisionState {
  const decisionsById = { ...state.decisionsById, [decision.id]: decision };
  const activeDecisionIds =
    decision.status === 'available'
      ? [...state.activeDecisionIds.filter((id) => id !== decision.id), decision.id]
      : state.activeDecisionIds.filter((id) => id !== decision.id);
  return { ...state, decisionsById, activeDecisionIds };
}

export function resolveMicroDecision(
  state: MicroDecisionState,
  decisionId: string,
  optionId: string,
  day: number,
): MicroDecisionState {
  const existing = state.decisionsById[decisionId];
  if (!existing || existing.status !== 'available') return state;
  const option = existing.options.find((o) => o.id === optionId);
  if (!option) return state;
  const updated: MicroDecision = {
    ...existing,
    status: 'resolved',
    selectedOptionId: optionId,
    resolvedAtDay: day,
  };
  return addMicroDecision(state, updated);
}

export function skipMicroDecision(
  state: MicroDecisionState,
  decisionId: string,
  day: number,
): MicroDecisionState {
  const existing = state.decisionsById[decisionId];
  if (!existing || existing.status !== 'available') return state;
  const updated: MicroDecision = {
    ...existing,
    status: 'skipped',
    resolvedAtDay: day,
  };
  return addMicroDecision(state, updated);
}

export function expireOldMicroDecisions(
  state: MicroDecisionState,
  day: number,
): MicroDecisionState {
  let next = state;
  for (const decision of Object.values(state.decisionsById)) {
    if (decision.status !== 'available') continue;
    const expires =
      decision.expiresAtDay ?? decision.createdAtDay + MICRO_DECISION_EXPIRE_AFTER_DAYS;
    if (day > expires) {
      const updated: MicroDecision = { ...decision, status: 'expired' };
      next = addMicroDecision(next, updated);
    }
  }
  return next;
}

export function pruneMicroDecisionHistory(
  state: MicroDecisionState,
  currentDay: number,
): MicroDecisionState {
  const entries = Object.values(state.decisionsById).sort(
    (a, b) => (b.resolvedAtDay ?? b.createdAtDay) - (a.resolvedAtDay ?? a.createdAtDay),
  );
  if (entries.length <= MICRO_DECISION_MAX_HISTORY) {
    return { ...state, lastPrunedDay: currentDay };
  }
  const keepIds = new Set(
    entries.slice(0, MICRO_DECISION_MAX_HISTORY).map((d) => d.id),
  );
  const activeIds = new Set(state.activeDecisionIds);
  const decisionsById: Record<string, MicroDecision> = {};
  for (const d of entries) {
    if (keepIds.has(d.id) || activeIds.has(d.id)) {
      decisionsById[d.id] = d;
    }
  }
  return {
    ...state,
    decisionsById,
    activeDecisionIds: state.activeDecisionIds.filter((id) => decisionsById[id]),
    lastPrunedDay: currentDay,
  };
}

export function buildMicroDecisionDailySummary(
  state: MicroDecisionState,
  day: number,
): MicroDecisionDailySummary {
  const dayDecisions = Object.values(state.decisionsById).filter((d) => d.day === day);
  const resolved = dayDecisions.filter((d) => d.status === 'resolved');
  const skipped = dayDecisions.filter((d) => d.status === 'skipped');
  const domainCounts: Partial<Record<MicroDecisionDomain, number>> = {};
  for (const d of resolved) {
    domainCounts[d.domain] = (domainCounts[d.domain] ?? 0) + 1;
  }
  let dominantDomain: MicroDecisionDomain | undefined;
  let maxCount = 0;
  for (const [domain, count] of Object.entries(domainCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantDomain = domain as MicroDecisionDomain;
    }
  }
  return {
    day,
    generatedCount: dayDecisions.length,
    resolvedCount: resolved.length,
    skippedCount: skipped.length,
    dominantDomain,
    reportLines: [],
  };
}

export function hasReachedDailyMicroDecisionLimit(
  state: MicroDecisionState,
  day: number,
  maxDailyDecisions: number,
): boolean {
  const generatedToday = Object.values(state.decisionsById).filter(
    (d) => d.createdAtDay === day,
  ).length;
  return generatedToday >= maxDailyDecisions;
}

export function markMicroDecisionEffectsApplied(
  state: MicroDecisionState,
  decisionId: string,
): MicroDecisionState {
  const existing = state.decisionsById[decisionId];
  if (!existing) return state;
  return addMicroDecision(state, { ...existing, effectsApplied: true });
}
