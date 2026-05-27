import { getDistrictProfile } from '@/core/content/districtProfiles';
import { clampMetric } from '@/core/game/clamp';
import { createId } from '@/core/game/createId';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { PilotDistrictId } from '@/core/models/DistrictProfile';
import type { EventCard } from '@/core/models/EventCard';
import type { GameState } from '@/core/models/GameState';
import type {
  PilotDailySnapshot,
  PilotEventHistoryEntry,
  PilotRun,
  PilotRunMetrics,
  PilotUnlockState,
} from '@/core/models/PilotRun';
import {
  DEFAULT_PILOT_UNLOCK_STATE,
} from '@/core/models/PilotRun';

const MAX_PILOT_DAY = 7;

let cachedLocalPlayerId: string | null = null;

export function getOrCreateLocalPlayerId(): string {
  if (cachedLocalPlayerId) {
    return cachedLocalPlayerId;
  }
  cachedLocalPlayerId = createId('player');
  return cachedLocalPlayerId;
}

export function metricsFromCity(city: GameState['city']): PilotRunMetrics {
  return {
    publicSatisfaction: clampMetric(city.publicSatisfaction),
    budget: city.budget,
    staffMorale: clampMetric(city.morale),
    operationRisk: clampMetric(city.riskScore ?? 0),
  };
}

export function formatPilotRunMetricsDisplay(
  metrics: PilotRunMetrics,
): Record<'trust' | 'budget' | 'morale' | 'risk', string> {
  return {
    trust: `%${Math.round(metrics.publicSatisfaction)}`,
    budget: `₺${Math.round(metrics.budget).toLocaleString('tr-TR')}`,
    morale: `%${Math.round(metrics.staffMorale)}`,
    risk: `${Math.round(metrics.operationRisk)}/100`,
  };
}

export function createPilotRun(districtId: PilotDistrictId): PilotRun {
  const profile = getDistrictProfile(districtId);
  const now = new Date().toISOString();

  return {
    id: createId('pilot_run'),
    localPlayerId: getOrCreateLocalPlayerId(),
    selectedDistrictId: districtId,
    selectedDistrictName: profile?.name ?? districtId,
    currentDay: 1,
    isCompleted: false,
    startedAt: now,
    completedAt: null,
    finalMetrics: null,
    dailySnapshots: [],
    eventHistory: [],
    unlockState: { ...DEFAULT_PILOT_UNLOCK_STATE },
  };
}

export function unlockStateForCompletedRun(): PilotUnlockState {
  return {
    cityMapPreviewUnlocked: true,
    mainOperationPreviewUnlocked: true,
    fullMainOperationUnlocked: false,
  };
}

type AppendEventHistoryParams = {
  run: PilotRun;
  day: number;
  event: EventCard;
  decisionId: string;
  decisionLabel: string;
  effects: DecisionRecord['appliedEffects'];
};

export function appendPilotEventHistory(
  params: AppendEventHistoryParams,
): PilotRun {
  const { run, day, event, decisionId, decisionLabel, effects } = params;

  const entry: PilotEventHistoryEntry = {
    day,
    eventId: event.id,
    eventTitle: event.title,
    eventType: event.eventType ?? event.category,
    selectedChoiceId: decisionId,
    selectedChoiceText: decisionLabel,
    effects,
    createdAt: new Date().toISOString(),
  };

  return {
    ...run,
    eventHistory: [...run.eventHistory, entry],
  };
}

function snapshotMetricsToRunMetrics(
  metrics: DaySnapshot['metrics'],
  riskScore?: number,
): PilotRunMetrics {
  return {
    publicSatisfaction: clampMetric(metrics.publicSatisfaction),
    budget: metrics.budget,
    staffMorale: clampMetric(metrics.staffMorale),
    operationRisk: clampMetric(riskScore ?? 0),
  };
}

function findDayStartMetrics(
  day: number,
  snapshots: DaySnapshot[],
  fallback: PilotRunMetrics,
): PilotRunMetrics {
  const daySnapshots = snapshots.filter((s) => s.day === day);
  const initial = daySnapshots.find((s) => s.reason === 'initial');
  if (initial) {
    return snapshotMetricsToRunMetrics(initial.metrics);
  }
  const before = daySnapshots.find((s) => s.reason === 'before_decision');
  if (before) {
    return snapshotMetricsToRunMetrics(before.metrics);
  }
  const first = daySnapshots[0];
  if (first) {
    return snapshotMetricsToRunMetrics(first.metrics);
  }
  return fallback;
}

function isCriticalEvent(event: EventCard | undefined): boolean {
  if (!event) return false;
  return event.riskLevel === 'high' || event.riskLevel === 'critical';
}

type RecordDailySnapshotParams = {
  run: PilotRun;
  day: number;
  endMetrics: PilotRunMetrics;
  snapshots: DaySnapshot[];
  decisionHistory: DecisionRecord[];
  eventLookup: (eventId: string) => EventCard | undefined;
};

export function recordPilotDailySnapshot(
  params: RecordDailySnapshotParams,
): PilotRun {
  const { run, day, endMetrics, snapshots, decisionHistory, eventLookup } =
    params;

  const startMetrics = findDayStartMetrics(day, snapshots, endMetrics);
  const dayDecisions = decisionHistory.filter((d) => d.day === day);
  const completedEvents = [
    ...new Set(dayDecisions.map((d) => d.eventId)),
  ];
  const criticalDecisionCount = dayDecisions.filter((d) =>
    isCriticalEvent(eventLookup(d.eventId)),
  ).length;

  const snapshot: PilotDailySnapshot = {
    day,
    startMetrics,
    endMetrics,
    completedEvents,
    criticalDecisionCount,
  };

  const withoutDay = run.dailySnapshots.filter((s) => s.day !== day);

  return {
    ...run,
    dailySnapshots: [...withoutDay, snapshot].sort((a, b) => a.day - b.day),
  };
}

export function finalizePilotRun(
  run: PilotRun,
  finalMetrics: PilotRunMetrics,
  completedDay: number,
): PilotRun {
  const now = new Date().toISOString();

  return {
    ...run,
    currentDay: completedDay,
    isCompleted: true,
    completedAt: now,
    finalMetrics,
    unlockState: unlockStateForCompletedRun(),
  };
}

export function syncPilotRunDay(run: PilotRun, currentDay: number): PilotRun {
  if (run.isCompleted) {
    return run;
  }
  return {
    ...run,
    currentDay: Math.min(Math.max(1, currentDay), MAX_PILOT_DAY),
  };
}

type RebuildPilotRunParams = {
  gameState: GameState;
  snapshots: DaySnapshot[];
  decisionHistory: DecisionRecord[];
  eventLookup: (eventId: string) => EventCard | undefined;
};

/** Eski kayıtlar için pilotRun'ı mevcut persist verisinden türetir. */
export function rebuildPilotRunFromPersistedState(
  params: RebuildPilotRunParams,
): PilotRun | null {
  const { gameState, snapshots, decisionHistory, eventLookup } = params;
  const { pilot, city } = gameState;
  const districtId = pilot.selectedDistrictId;

  if (!districtId || pilot.status === 'not_started') {
    return null;
  }

  let run = createPilotRun(districtId);
  run = {
    ...run,
    currentDay: pilot.currentPilotDay,
    startedAt: snapshots[0]?.createdAt ?? run.startedAt,
  };

  for (const record of decisionHistory) {
    const event = eventLookup(record.eventId);
    if (!event) continue;
    run = appendPilotEventHistory({
      run,
      day: record.day,
      event,
      decisionId: record.decisionId,
      decisionLabel: record.decisionLabel,
      effects: record.appliedEffects,
    });
  }

  const closedDays = new Set<number>();
  for (const snap of snapshots) {
    if (snap.reason === 'end_day') {
      closedDays.add(snap.day);
    }
  }
  for (const day of [...closedDays].sort((a, b) => a - b)) {
    const endSnap = snapshots.filter((s) => s.day === day).at(-1);
    const endMetrics = endSnap
      ? snapshotMetricsToRunMetrics(endSnap.metrics, city.riskScore)
      : metricsFromCity(city);
    run = recordPilotDailySnapshot({
      run,
      day,
      endMetrics,
      snapshots,
      decisionHistory,
      eventLookup,
    });
  }

  if (pilot.status === 'completed') {
    run = finalizePilotRun(run, metricsFromCity(city), pilot.currentPilotDay);
  }

  return run;
}

export function ensurePilotRunOnPilot(
  gameState: GameState,
  snapshots: DaySnapshot[],
  decisionHistory: DecisionRecord[],
  eventLookup: (eventId: string) => EventCard | undefined,
): GameState {
  const { pilot } = gameState;
  if (pilot.status === 'not_started') {
    return gameState;
  }
  if (pilot.run) {
    return gameState;
  }

  const rebuilt = rebuildPilotRunFromPersistedState({
    gameState,
    snapshots,
    decisionHistory,
    eventLookup,
  });

  if (!rebuilt) {
    return gameState;
  }

  return {
    ...gameState,
    pilot: {
      ...pilot,
      run: rebuilt,
    },
  };
}
