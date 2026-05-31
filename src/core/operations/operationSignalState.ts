import {
  DEFAULT_OPERATION_SIGNAL_SCORES,
  KNOWN_DISTRICT_IDS,
  SIGNAL_STATUS_LABELS,
} from './operationSignalConstants';
import type {
  OperationDomainSignal,
  OperationSignalDomain,
  OperationSignalStatus,
  OperationSignalTrend,
  OperationSignalsState,
} from './operationSignalTypes';

export function clampSignalScore(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_OPERATION_SIGNAL_SCORES.overall;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getSignalStatus(score: number): OperationSignalStatus {
  const s = clampSignalScore(score);
  if (s <= 34) return 'stable';
  if (s <= 59) return 'watch';
  if (s <= 79) return 'strained';
  return 'critical';
}

export function getSignalTrend(
  previousScore: number,
  nextScore: number,
): OperationSignalTrend {
  const delta = nextScore - previousScore;
  if (delta <= -5) return 'improving';
  if (delta >= 5) return 'worsening';
  return 'steady';
}

export function buildOperationSignal(
  domain: OperationSignalDomain,
  score: number,
  previousScore: number,
  day: number,
  title: string,
  summary: string,
  sourceTags: string[],
): OperationDomainSignal {
  const clamped = clampSignalScore(score);
  return {
    domain,
    status: getSignalStatus(clamped),
    score: clamped,
    trend: getSignalTrend(previousScore, clamped),
    title,
    summary,
    sourceTags,
    lastUpdatedDay: day,
  };
}

function defaultDomainSignal(
  domain: OperationSignalDomain,
  day: number,
  score: number,
): OperationDomainSignal {
  const labels = SIGNAL_STATUS_LABELS;
  const status = getSignalStatus(score);
  return buildOperationSignal(
    domain,
    score,
    score,
    day,
    labels[status],
    'Günlük sinyal izleniyor.',
    ['default'],
  );
}

export function createInitialOperationSignalsState(day: number): OperationSignalsState {
  const priorityDistrictId = KNOWN_DISTRICT_IDS[0] ?? 'merkez';
  const d = day > 0 ? day : 1;
  return {
    personnel: defaultDomainSignal('personnel', d, DEFAULT_OPERATION_SIGNAL_SCORES.personnel),
    vehicles: defaultDomainSignal('vehicles', d, DEFAULT_OPERATION_SIGNAL_SCORES.vehicles),
    containers: defaultDomainSignal('containers', d, DEFAULT_OPERATION_SIGNAL_SCORES.containers),
    districts: defaultDomainSignal('districts', d, DEFAULT_OPERATION_SIGNAL_SCORES.districts),
    overall: defaultDomainSignal('overall', d, DEFAULT_OPERATION_SIGNAL_SCORES.overall),
    priorityDistrictId,
    dailyFocus: 'balanced',
    lastProcessedDay: 0,
    lastRefreshedDay: d,
  };
}

function normalizeDomainSignal(
  raw: unknown,
  domain: OperationSignalDomain,
  day: number,
  fallbackScore: number,
  previous?: OperationDomainSignal,
): OperationDomainSignal {
  if (raw == null || typeof raw !== 'object') {
    return defaultDomainSignal(domain, day, fallbackScore);
  }
  const r = raw as Record<string, unknown>;
  const score = clampSignalScore(
    typeof r.score === 'number' ? r.score : fallbackScore,
  );
  const prevScore = previous?.score ?? score;
  const status =
    r.status === 'stable' ||
    r.status === 'watch' ||
    r.status === 'strained' ||
    r.status === 'critical'
      ? r.status
      : getSignalStatus(score);
  const trend =
    r.trend === 'improving' ||
    r.trend === 'steady' ||
    r.trend === 'worsening'
      ? r.trend
      : getSignalTrend(prevScore, score);
  return {
    domain,
    status,
    score,
    trend,
    title: typeof r.title === 'string' ? r.title : SIGNAL_STATUS_LABELS[status],
    summary:
      typeof r.summary === 'string' ? r.summary : 'Günlük sinyal izleniyor.',
    sourceTags: Array.isArray(r.sourceTags)
      ? r.sourceTags.filter((t): t is string => typeof t === 'string')
      : ['normalized'],
    lastUpdatedDay:
      typeof r.lastUpdatedDay === 'number' ? Math.floor(r.lastUpdatedDay) : day,
  };
}

export function normalizeOperationSignalsState(
  input: unknown,
  day: number,
): OperationSignalsState {
  if (input == null || typeof input !== 'object') {
    return createInitialOperationSignalsState(day);
  }
  const raw = input as Record<string, unknown>;
  const initial = createInitialOperationSignalsState(day);
  const personnel = normalizeDomainSignal(
    raw.personnel,
    'personnel',
    day,
    initial.personnel.score,
    initial.personnel,
  );
  const vehicles = normalizeDomainSignal(
    raw.vehicles,
    'vehicles',
    day,
    initial.vehicles.score,
    initial.vehicles,
  );
  const containers = normalizeDomainSignal(
    raw.containers,
    'containers',
    day,
    initial.containers.score,
    initial.containers,
  );
  const districts = normalizeDomainSignal(
    raw.districts,
    'districts',
    day,
    initial.districts.score,
    initial.districts,
  );
  const overall = normalizeDomainSignal(
    raw.overall,
    'overall',
    day,
    initial.overall.score,
    initial.overall,
  );
  const priorityDistrictId =
    typeof raw.priorityDistrictId === 'string' &&
    KNOWN_DISTRICT_IDS.includes(
      raw.priorityDistrictId as (typeof KNOWN_DISTRICT_IDS)[number],
    )
      ? raw.priorityDistrictId
      : initial.priorityDistrictId;
  const dailyFocus =
    raw.dailyFocus === 'personnel' ||
    raw.dailyFocus === 'vehicles' ||
    raw.dailyFocus === 'containers' ||
    raw.dailyFocus === 'districts' ||
    raw.dailyFocus === 'balanced'
      ? raw.dailyFocus
      : 'balanced';

  return {
    personnel,
    vehicles,
    containers,
    districts,
    overall,
    priorityDistrictId,
    dailyFocus,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number'
        ? Math.floor(raw.lastProcessedDay)
        : 0,
    lastRefreshedDay:
      typeof raw.lastRefreshedDay === 'number'
        ? Math.floor(raw.lastRefreshedDay)
        : day,
  };
}

export function refreshOperationSignalsForDay(
  state: OperationSignalsState,
  day: number,
): OperationSignalsState {
  if (state.lastRefreshedDay === day) {
    return state;
  }
  return {
    ...state,
    lastRefreshedDay: day,
  };
}
