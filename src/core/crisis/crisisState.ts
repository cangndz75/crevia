import type { GameState } from '@/core/models/GameState';
import { isFullMainOperationAccess } from '@/core/monetization/monetizationEngine';
import type { MonetizationState } from '@/core/monetization/monetizationTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { normalizePostPilotOperationState } from '@/core/postPilot/postPilotOperationSeed';

import {
  CRISIS_RISK_LABELS,
  CRISIS_SCORE_ELEVATED_MAX,
  CRISIS_SCORE_STABLE_MAX,
  CRISIS_SCORE_WATCH_MAX,
  MAX_RECENT_CRISIS_SIGNALS,
} from './crisisConstants';
import type {
  CrisisAccessMode,
  CrisisIncident,
  CrisisRiskLevel,
  CrisisSignal,
  CrisisState,
  CrisisTrend,
} from './crisisTypes';

export function clampCrisisScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getCrisisRiskLevel(score: number): CrisisRiskLevel {
  const s = clampCrisisScore(score);
  if (s <= CRISIS_SCORE_STABLE_MAX) return 'stable';
  if (s <= CRISIS_SCORE_WATCH_MAX) return 'watch';
  if (s <= CRISIS_SCORE_ELEVATED_MAX) return 'elevated';
  return 'critical';
}

export function getCrisisTrend(
  previousScore: number,
  nextScore: number,
): CrisisTrend {
  const delta = nextScore - previousScore;
  if (delta <= -3) return 'improving';
  if (delta >= 3) return 'worsening';
  return 'steady';
}

export function createInitialCrisisState(): CrisisState {
  return {
    accessMode: 'inactive',
    riskLevel: 'stable',
    cityCrisisScore: 0,
    trend: 'steady',
    recentSignals: [],
  };
}

function normalizeSignal(signal: unknown): CrisisSignal | null {
  if (!signal || typeof signal !== 'object') return null;
  const s = signal as Record<string, unknown>;
  if (typeof s.id !== 'string' || typeof s.title !== 'string') return null;
  const riskLevel =
    s.riskLevel === 'watch' ||
    s.riskLevel === 'elevated' ||
    s.riskLevel === 'critical'
      ? s.riskLevel
      : 'watch';
  return {
    id: s.id,
    domain: (s.domain as CrisisSignal['domain']) ?? 'city',
    riskLevel,
    score: clampCrisisScore(typeof s.score === 'number' ? s.score : 40),
    trend:
      s.trend === 'improving' || s.trend === 'worsening' ? s.trend : 'steady',
    title: s.title,
    summary: typeof s.summary === 'string' ? s.summary : '',
    sourceTags: Array.isArray(s.sourceTags)
      ? s.sourceTags.filter((t): t is string => typeof t === 'string')
      : [],
  };
}

function normalizeIncident(incident: unknown): CrisisIncident | undefined {
  if (!incident || typeof incident !== 'object') return undefined;
  const i = incident as Record<string, unknown>;
  if (typeof i.id !== 'string' || typeof i.title !== 'string') return undefined;
  const status = i.status;
  if (
    status !== 'forming' &&
    status !== 'active' &&
    status !== 'contained' &&
    status !== 'resolved'
  ) {
    return undefined;
  }
  return {
    id: i.id,
    day: typeof i.day === 'number' ? Math.round(i.day) : 0,
    status,
    title: i.title,
    summary: typeof i.summary === 'string' ? i.summary : '',
    affectedDistrictIds: Array.isArray(i.affectedDistrictIds)
      ? i.affectedDistrictIds.filter((d): d is string => typeof d === 'string')
      : [],
    primaryDomain: (i.primaryDomain as CrisisIncident['primaryDomain']) ?? 'city',
    severity:
      i.severity === 'high' || i.severity === 'critical' ? i.severity : 'medium',
    sourceSignalIds: Array.isArray(i.sourceSignalIds)
      ? i.sourceSignalIds.filter((id): id is string => typeof id === 'string')
      : [],
    resolvedDay:
      typeof i.resolvedDay === 'number' ? Math.round(i.resolvedDay) : undefined,
    reportLine: typeof i.reportLine === 'string' ? i.reportLine : undefined,
  };
}

export function normalizeCrisisState(input: unknown): CrisisState {
  if (!input || typeof input !== 'object') {
    return createInitialCrisisState();
  }
  const raw = input as Record<string, unknown>;
  const score = clampCrisisScore(
    typeof raw.cityCrisisScore === 'number' ? raw.cityCrisisScore : 0,
  );
  const accessMode =
    raw.accessMode === 'limited_preview' ||
    raw.accessMode === 'active' ||
    raw.accessMode === 'inactive'
      ? raw.accessMode
      : 'inactive';
  const signals = Array.isArray(raw.recentSignals)
    ? raw.recentSignals
        .map((s) => normalizeSignal(s))
        .filter((s): s is CrisisSignal => s != null)
        .slice(0, MAX_RECENT_CRISIS_SIGNALS)
    : [];

  let activeIncident = normalizeIncident(raw.activeIncident);
  if (
    activeIncident &&
    (activeIncident.status === 'resolved' || activeIncident.status === 'none')
  ) {
    activeIncident = undefined;
  }

  return {
    accessMode,
    riskLevel: getCrisisRiskLevel(score),
    cityCrisisScore: score,
    trend:
      raw.trend === 'improving' || raw.trend === 'worsening'
        ? raw.trend
        : 'steady',
    activeIncident,
    recentSignals: signals,
    lastProcessedDay:
      typeof raw.lastProcessedDay === 'number'
        ? Math.round(raw.lastProcessedDay)
        : undefined,
    lastRefreshedDay:
      typeof raw.lastRefreshedDay === 'number'
        ? Math.round(raw.lastRefreshedDay)
        : undefined,
    lastIncidentDay:
      typeof raw.lastIncidentDay === 'number'
        ? Math.round(raw.lastIncidentDay)
        : undefined,
    previousCityCrisisScore:
      typeof raw.previousCityCrisisScore === 'number'
        ? clampCrisisScore(raw.previousCityCrisisScore)
        : undefined,
  };
}

export function deriveCrisisAccessModeFromGame(
  gameState: GameState,
  monetization: MonetizationState,
): CrisisAccessMode {
  if (gameState.pilot.status !== 'completed') {
    return 'inactive';
  }
  if (gameState.city.day < POST_PILOT_FIRST_OPERATION_DAY) {
    return 'inactive';
  }
  if (isFullMainOperationAccess(gameState, monetization)) {
    return 'active';
  }
  const postPilot = normalizePostPilotOperationState(
    gameState.pilot.postPilotOperation,
    {
      pilotStatus: gameState.pilot.status,
      currentPilotDay: gameState.pilot.currentPilotDay,
    },
  );
  if (
    postPilot.phase === 'main_operation_light' ||
    postPilot.phase === 'main_operation_full'
  ) {
    return 'limited_preview';
  }
  return 'inactive';
}

export function refreshCrisisAccessMode(
  state: CrisisState,
  gameState: GameState,
  monetization: MonetizationState,
): CrisisState {
  const accessMode = deriveCrisisAccessModeFromGame(gameState, monetization);
  let next = { ...state, accessMode };
  if (accessMode !== 'active') {
    next = { ...next, activeIncident: undefined };
  }
  return next;
}

export function buildCrisisSignal(
  params: Omit<CrisisSignal, 'riskLevel' | 'trend'> & {
    riskLevel?: CrisisRiskLevel;
    trend?: CrisisTrend;
  },
): CrisisSignal {
  const score = clampCrisisScore(params.score);
  return {
    ...params,
    score,
    riskLevel: params.riskLevel ?? getCrisisRiskLevel(score),
    trend: params.trend ?? 'steady',
  };
}

export function addCrisisSignal(
  state: CrisisState,
  signal: CrisisSignal,
): CrisisState {
  const filtered = state.recentSignals.filter((s) => s.id !== signal.id);
  const recentSignals = [signal, ...filtered].slice(0, MAX_RECENT_CRISIS_SIGNALS);
  return { ...state, recentSignals };
}

export function clearResolvedCrisisIncident(
  state: CrisisState,
  currentDay: number,
): CrisisState {
  if (!state.activeIncident) return state;
  if (
    state.activeIncident.status === 'resolved' ||
    state.activeIncident.status === 'contained'
  ) {
    return {
      ...state,
      activeIncident: undefined,
      lastRefreshedDay: currentDay,
    };
  }
  return state;
}

export function markCrisisIncidentContained(
  state: CrisisState,
  day: number,
  reportLine?: string,
): CrisisState {
  if (!state.activeIncident) return state;
  return {
    ...state,
    activeIncident: {
      ...state.activeIncident,
      status: 'contained',
      reportLine:
        reportLine ?? 'Kriz eşiği kontrol altına alındı; saha koordinasyonu güçlendi.',
    },
    lastRefreshedDay: day,
  };
}

export function markCrisisIncidentResolved(
  state: CrisisState,
  day: number,
  reportLine?: string,
): CrisisState {
  if (!state.activeIncident) return state;
  return {
    ...state,
    activeIncident: {
      ...state.activeIncident,
      status: 'resolved',
      resolvedDay: day,
      reportLine:
        reportLine ?? 'Şehir baskısı izleme seviyesine döndü.',
    },
    lastRefreshedDay: day,
  };
}

export function getCrisisRiskLabel(level: CrisisRiskLevel): string {
  return CRISIS_RISK_LABELS[level];
}
