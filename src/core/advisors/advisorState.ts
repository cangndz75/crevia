import {
  ACKNOWLEDGE_DOMAIN_LEARNING_DELTA,
  ACKNOWLEDGE_EXPERIENCE_DELTA,
  ACKNOWLEDGE_RELIABILITY_DELTA,
  ADVISOR_COPY,
  ADVISOR_DAILY_USES_BY_LEVEL,
  ADVISOR_ID,
  ADVISOR_LEVEL_THRESHOLDS,
  ADVISOR_MAX_PENDING_PREDICTIONS,
  DEFAULT_ADVISOR_STATE,
  DEFAULT_RELIABILITY_SCORE,
  RELIABILITY_BAND_THRESHOLDS,
  RELIABILITY_LABELS,
} from './advisorConstants';
import type {
  AdvisorDomain,
  AdvisorDomainLearning,
  AdvisorLevel,
  AdvisorMissedSignal,
  AdvisorPrediction,
  AdvisorReliabilityBand,
  AdvisorState,
} from './advisorTypes';

function clampLevel(level: number): AdvisorLevel {
  if (level >= 3) return 3;
  if (level >= 2) return 2;
  return 1;
}

function clampScore0to100(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function getAdvisorLevelFromExperience(experience: number): AdvisorLevel {
  if (experience >= ADVISOR_LEVEL_THRESHOLDS[3]) return 3;
  if (experience >= ADVISOR_LEVEL_THRESHOLDS[2]) return 2;
  return 1;
}

export function createInitialAdvisorDomainLearning(): AdvisorDomainLearning {
  return {
    personnel: 0,
    vehicles: 0,
    containers: 0,
    districts: 0,
    social: 0,
    crisis: 0,
  };
}

export function getAdvisorReliabilityBand(
  score: number,
): AdvisorReliabilityBand {
  const s = clampScore0to100(score);
  if (s <= RELIABILITY_BAND_THRESHOLDS.earlyMax) return 'early_observation';
  if (s <= RELIABILITY_BAND_THRESHOLDS.developingMax) return 'developing';
  if (s <= RELIABILITY_BAND_THRESHOLDS.reliableMax) return 'reliable';
  return 'expert';
}

export function getAdvisorReliabilityLabel(score: number): string {
  return RELIABILITY_LABELS[getAdvisorReliabilityBand(score)];
}

export function normalizeAdvisorDomainLearning(
  input: unknown,
): AdvisorDomainLearning {
  const base = createInitialAdvisorDomainLearning();
  if (input == null || typeof input !== 'object') return base;
  const raw = input as Record<string, unknown>;
  return {
    personnel: clampScore0to100(
      typeof raw.personnel === 'number' ? raw.personnel : base.personnel,
    ),
    vehicles: clampScore0to100(
      typeof raw.vehicles === 'number' ? raw.vehicles : base.vehicles,
    ),
    containers: clampScore0to100(
      typeof raw.containers === 'number' ? raw.containers : base.containers,
    ),
    districts: clampScore0to100(
      typeof raw.districts === 'number' ? raw.districts : base.districts,
    ),
    social: clampScore0to100(
      typeof raw.social === 'number' ? raw.social : base.social,
    ),
    crisis: clampScore0to100(
      typeof raw.crisis === 'number' ? raw.crisis : base.crisis,
    ),
  };
}

function isAdvisorDomain(val: unknown): val is AdvisorDomain {
  return (
    val === 'personnel' ||
    val === 'vehicles' ||
    val === 'containers' ||
    val === 'districts' ||
    val === 'social' ||
    val === 'crisis'
  );
}

export function normalizeAdvisorMissedSignal(
  input: unknown,
): AdvisorMissedSignal | undefined {
  if (input == null || typeof input !== 'object') return undefined;
  const raw = input as Record<string, unknown>;
  if (typeof raw.id !== 'string' || typeof raw.message !== 'string') {
    return undefined;
  }
  if (!isAdvisorDomain(raw.domain)) return undefined;
  return {
    id: raw.id,
    day: typeof raw.day === 'number' ? Math.floor(raw.day) : 0,
    acknowledgedDay: readOptionalNumber(raw.acknowledgedDay),
    domain: raw.domain,
    previousStatus:
      typeof raw.previousStatus === 'string' ? raw.previousStatus : '',
    currentStatus:
      typeof raw.currentStatus === 'string' ? raw.currentStatus : '',
    message: raw.message,
    acknowledged: raw.acknowledged === true,
  };
}

export function normalizeAdvisorPredictions(input: unknown): AdvisorPrediction[] {
  if (!Array.isArray(input)) return [];
  const result: AdvisorPrediction[] = [];
  for (const item of input) {
    if (item == null || typeof item !== 'object') continue;
    const raw = item as Record<string, unknown>;
    if (typeof raw.id !== 'string' || !isAdvisorDomain(raw.domain)) continue;
    if (typeof raw.predictedStatus !== 'string') continue;
    const confidence =
      raw.confidence === 'low' ||
      raw.confidence === 'medium' ||
      raw.confidence === 'high'
        ? raw.confidence
        : 'low';
    result.push({
      id: raw.id,
      day: typeof raw.day === 'number' ? Math.floor(raw.day) : 0,
      domain: raw.domain,
      predictedStatus: raw.predictedStatus,
      confidence,
      sourceSignalScore:
        typeof raw.sourceSignalScore === 'number'
          ? clampScore0to100(raw.sourceSignalScore)
          : 0,
      relatedDistrictId:
        typeof raw.relatedDistrictId === 'string'
          ? raw.relatedDistrictId
          : undefined,
      resolved: raw.resolved === true,
    });
    if (result.length >= ADVISOR_MAX_PENDING_PREDICTIONS) break;
  }
  return result;
}

function readOptionalNumber(val: unknown): number | undefined {
  return typeof val === 'number' && Number.isFinite(val) ? val : undefined;
}

export function syncAdvisorReliabilityBand(state: AdvisorState): AdvisorState {
  const reliabilityScore = clampScore0to100(state.reliabilityScore);
  return {
    ...state,
    reliabilityScore,
    reliabilityBand: getAdvisorReliabilityBand(reliabilityScore),
  };
}

export function updateAdvisorReliability(
  state: AdvisorState,
  delta: number,
): AdvisorState {
  return syncAdvisorReliabilityBand({
    ...state,
    reliabilityScore: state.reliabilityScore + delta,
  });
}

export function grantAdvisorDomainLearning(
  state: AdvisorState,
  domain: AdvisorDomain,
  amount: number,
): AdvisorState {
  const learning = { ...state.domainLearning };
  learning[domain] = clampScore0to100(learning[domain] + Math.max(0, amount));
  return { ...state, domainLearning: learning };
}

export function acknowledgeAdvisorMissedSignal(
  state: AdvisorState,
  day: number,
): AdvisorState {
  if (!state.lastMissedSignal || state.lastMissedSignal.acknowledged) {
    return state;
  }
  return {
    ...state,
    lastMissedSignal: {
      ...state.lastMissedSignal,
      acknowledged: true,
      acknowledgedDay: day,
    },
    acknowledgedMissCount: state.acknowledgedMissCount + 1,
  };
}

export function addAdvisorPrediction(
  state: AdvisorState,
  prediction: AdvisorPrediction,
): AdvisorState {
  if (!prediction.id || !prediction.domain) return state;
  const exists = state.pendingPredictions.some((p) => p.id === prediction.id);
  if (exists) return state;
  const active = state.pendingPredictions.filter((p) => !p.resolved);
  const next = [...active, prediction].slice(-ADVISOR_MAX_PENDING_PREDICTIONS);
  return { ...state, pendingPredictions: next };
}

export function createInitialAdvisorState(day: number): AdvisorState {
  const level = getAdvisorLevelFromExperience(0);
  return syncAdvisorReliabilityBand({
    ...DEFAULT_ADVISOR_STATE,
    level,
    lastRefreshedDay: day,
    dailyUsesRemaining: ADVISOR_DAILY_USES_BY_LEVEL[level],
  });
}

export function normalizeAdvisorState(input: unknown, day: number): AdvisorState {
  if (input == null || typeof input !== 'object') {
    return createInitialAdvisorState(day);
  }
  const raw = input as Record<string, unknown>;
  const experience =
    typeof raw.experience === 'number' && raw.experience >= 0
      ? Math.floor(raw.experience)
      : 0;
  const level = getAdvisorLevelFromExperience(experience);
  const lastRefreshedDay =
    typeof raw.lastRefreshedDay === 'number' && raw.lastRefreshedDay > 0
      ? Math.floor(raw.lastRefreshedDay)
      : day;
  let dailyUsesRemaining =
    typeof raw.dailyUsesRemaining === 'number' && raw.dailyUsesRemaining >= 0
      ? Math.floor(raw.dailyUsesRemaining)
      : ADVISOR_DAILY_USES_BY_LEVEL[level];

  const reliabilityScore =
    typeof raw.reliabilityScore === 'number'
      ? clampScore0to100(raw.reliabilityScore)
      : DEFAULT_RELIABILITY_SCORE;

  let state: AdvisorState = syncAdvisorReliabilityBand({
    advisorId: ADVISOR_ID,
    level,
    experience,
    dailyUsesRemaining,
    lastRefreshedDay,
    totalSuccessfulHints:
      typeof raw.totalSuccessfulHints === 'number' && raw.totalSuccessfulHints >= 0
        ? Math.floor(raw.totalSuccessfulHints)
        : 0,
    lastExperienceGrantDay: readOptionalNumber(raw.lastExperienceGrantDay),
    reliabilityScore,
    reliabilityBand:
      raw.reliabilityBand === 'early_observation' ||
      raw.reliabilityBand === 'developing' ||
      raw.reliabilityBand === 'reliable' ||
      raw.reliabilityBand === 'expert'
        ? raw.reliabilityBand
        : getAdvisorReliabilityBand(reliabilityScore),
    domainLearning: normalizeAdvisorDomainLearning(raw.domainLearning),
    lastMissedSignal: normalizeAdvisorMissedSignal(raw.lastMissedSignal),
    pendingPredictions: normalizeAdvisorPredictions(raw.pendingPredictions),
    acknowledgedMissCount:
      typeof raw.acknowledgedMissCount === 'number' &&
      raw.acknowledgedMissCount >= 0
        ? Math.floor(raw.acknowledgedMissCount)
        : 0,
    lastPredictionEvaluatedDay: readOptionalNumber(
      raw.lastPredictionEvaluatedDay,
    ),
  });

  state = refreshAdvisorDailyUses(state, day);
  return state;
}

export function refreshAdvisorDailyUses(
  state: AdvisorState,
  day: number,
): AdvisorState {
  if (state.lastRefreshedDay === day) {
    const cap = ADVISOR_DAILY_USES_BY_LEVEL[state.level];
    return {
      ...state,
      dailyUsesRemaining: Math.min(state.dailyUsesRemaining, cap),
    };
  }
  const level = getAdvisorLevelFromExperience(state.experience);
  return {
    ...state,
    level,
    lastRefreshedDay: day,
    dailyUsesRemaining: ADVISOR_DAILY_USES_BY_LEVEL[level],
  };
}

export function getAdvisorProgressToNextLevel(state: AdvisorState): {
  ratio: number;
  label: string;
} {
  const level = getAdvisorLevelFromExperience(state.experience);
  if (level >= 3) {
    return { ratio: 1, label: ADVISOR_COPY.maxLevelProgress };
  }
  const nextLevel = clampLevel(level + 1);
  const currentThreshold = ADVISOR_LEVEL_THRESHOLDS[level];
  const nextThreshold = ADVISOR_LEVEL_THRESHOLDS[nextLevel];
  const span = nextThreshold - currentThreshold;
  const gained = state.experience - currentThreshold;
  const ratio = span > 0 ? Math.min(1, Math.max(0, gained / span)) : 0;
  const remaining = Math.max(0, nextThreshold - state.experience);
  const nextRole =
    nextLevel === 2 ? 'Operasyon asistanlığına' : 'Saha danışmanlığına';
  return {
    ratio,
    label: `${nextRole} ${remaining} deneyim kaldı`,
  };
}

export function spendAdvisorUse(state: AdvisorState): AdvisorState {
  return {
    ...state,
    dailyUsesRemaining: Math.max(0, state.dailyUsesRemaining - 1),
    totalSuccessfulHints: state.totalSuccessfulHints + 1,
  };
}

export function grantAdvisorExperience(
  state: AdvisorState,
  amount: number,
  _reason: string,
): AdvisorState {
  const experience = Math.max(0, state.experience + Math.max(0, amount));
  const level = getAdvisorLevelFromExperience(experience);
  return syncAdvisorReliabilityBand({
    ...state,
    experience,
    level,
  });
}

export function grantAdvisorEndOfDayExperience(
  state: AdvisorState,
  day: number,
  amount: number,
): AdvisorState {
  if (state.lastExperienceGrantDay === day) {
    return state;
  }
  const withXp = grantAdvisorExperience(state, amount, 'end_of_day');
  return {
    ...withXp,
    lastExperienceGrantDay: day,
  };
}

export function applyAcknowledgeMissedSignalRewards(
  state: AdvisorState,
  day: number,
): AdvisorState {
  const missed = state.lastMissedSignal;
  if (!missed || missed.acknowledged) {
    return state;
  }
  let next = acknowledgeAdvisorMissedSignal(state, day);
  next = grantAdvisorDomainLearning(
    next,
    missed.domain,
    ACKNOWLEDGE_DOMAIN_LEARNING_DELTA,
  );
  next = updateAdvisorReliability(next, ACKNOWLEDGE_RELIABILITY_DELTA);
  next = grantAdvisorExperience(next, ACKNOWLEDGE_EXPERIENCE_DELTA, 'miss_ack');
  return next;
}
