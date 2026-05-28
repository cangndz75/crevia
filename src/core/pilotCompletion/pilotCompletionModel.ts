import { createDay1Seed } from '@/core/content/day1Seed';
import { PILOT_SCENARIO_DAYS } from '@/core/content/pilotDayPlan';
import { districtProfiles } from '@/core/content/districtProfiles';
import type { DailyPriorityKey, DailyPriorityState } from '@/core/dailyPriority/dailyPriorityTypes';
import { canCompletePilot } from '@/core/game/calculatePilotFinalResult';
import { metricsFromCity } from '@/core/game/pilotRun';
import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { NEIGHBORHOOD_DISPLAY_NAMES } from '@/core/leaderboard/leaderboardConstants';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { DailyReport } from '@/core/models/DailyReport';
import type { GameState } from '@/core/models/GameState';
import type { DaySnapshot } from '@/core/models/DaySnapshot';
import type { PilotRunMetrics } from '@/core/models/PilotRun';

import {
  gradeFromScore,
  PILOT_COMPLETION_GRADE_LABELS,
  PILOT_COMPLETION_GRADE_SUBTITLES,
  PILOT_MANAGEMENT_STYLE_LABELS,
  PILOT_MANAGEMENT_STYLE_TEXT,
} from './pilotCompletionPresentation';
import { buildPilotCompletionAuthorityFields } from '@/core/authority/authorityPilotCompletion';
import type {
  PilotCompletionSummary,
  PilotManagementStyle,
  PilotPreviewUnlockItem,
} from './pilotCompletionTypes';

export type BuildPilotCompletionSummaryParams = {
  gameState: GameState;
  decisionHistory?: DecisionRecord[];
  dailyPriorityByDay?: Record<number, DailyPriorityState>;
  dailyGoalsByDay?: Record<number, DailyGoalState>;
  lastDailyReport?: DailyReport | null;
  lastPilotScore?: LeaderboardEntry;
  snapshots?: DaySnapshot[];
};

const PRIORITY_TO_STYLE: Record<DailyPriorityKey, PilotManagementStyle> = {
  public_relief: 'public_first',
  operation_stability: 'operator',
  resource_protection: 'resource_guardian',
};

const METRIC_LABELS = {
  publicSatisfaction: 'Halk Memnuniyeti',
  operationRisk: 'Operasyon Dengesi',
  budget: 'Kaynak Yönetimi',
  staffMorale: 'Personel Morali',
} as const;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function normalizeLeaderboardScoreToPilot(score: number): number {
  if (score <= 100) return clampScore(score);
  return clampScore(score / 100);
}

function resolvePilotDay(
  gameState: GameState,
  lastDailyReport?: DailyReport | null,
): number {
  if (gameState.pilot.status === 'completed') {
    return PILOT_SCENARIO_DAYS;
  }
  if (lastDailyReport?.day != null) {
    return lastDailyReport.day;
  }
  return gameState.pilot.currentPilotDay;
}

function isPilotCompletionEligible(
  gameState: GameState,
  day: number,
): boolean {
  if (gameState.pilot.status === 'completed') {
    return true;
  }
  if (day >= PILOT_SCENARIO_DAYS) {
    return true;
  }
  if (canCompletePilot(gameState)) {
    return true;
  }
  return gameState.pilot.run?.isCompleted === true;
}

function resolveCompletionScore(params: BuildPilotCompletionSummaryParams): number {
  const { gameState, lastPilotScore, snapshots } = params;
  const finalScore = gameState.pilot.finalResult?.score;
  if (finalScore != null) {
    return clampScore(finalScore);
  }
  if (lastPilotScore?.score != null) {
    return normalizeLeaderboardScoreToPilot(lastPilotScore.score);
  }
  return clampScore(computePresentationScore(params, snapshots));
}

function computePresentationScore(
  params: BuildPilotCompletionSummaryParams,
  snapshots?: DaySnapshot[],
): number {
  const { gameState, decisionHistory = [], dailyPriorityByDay = {} } = params;
  const city = gameState.city;
  const publicSatisfaction = city.publicSatisfaction;
  const morale = city.morale;
  const riskComponent = 100 - (city.riskScore ?? 50);

  const startingBudget =
    snapshots?.[0]?.metrics?.budget ??
    districtProfiles[gameState.pilot.selectedDistrictId ?? 'central']
      ?.startingMetrics.budget ??
    city.budget;
  const budgetRatio =
    startingBudget > 0
      ? Math.min(1, city.budget / startingBudget)
      : 0.5;
  const budgetScore = budgetRatio * 100;

  const decisionsCount = decisionHistory.length;
  const completionScore = (Math.min(decisionsCount, 7) / 7) * 100;

  let priorityBonus = 0;
  let priorityCount = 0;
  for (const state of Object.values(dailyPriorityByDay)) {
    if (!state.selectedKey || !state.finalResult) continue;
    priorityCount += 1;
    if (state.finalResult.status === 'fulfilled') priorityBonus += 12;
    else if (state.finalResult.status === 'partial') priorityBonus += 6;
  }
  const priorityAvg = priorityCount > 0 ? priorityBonus / priorityCount : 0;

  const raw =
    publicSatisfaction * 0.28 +
    morale * 0.18 +
    riskComponent * 0.22 +
    budgetScore * 0.12 +
    completionScore * 0.1 +
    priorityAvg * 0.1;

  return clampScore(raw);
}

type StyleWeights = Record<PilotManagementStyle, number>;

function emptyStyleWeights(): StyleWeights {
  return {
    public_first: 0,
    operator: 0,
    resource_guardian: 0,
    balanced_coordinator: 0,
    crisis_responder: 0,
  };
}

function inferDecisionStyleWeights(
  decisionHistory: DecisionRecord[],
): StyleWeights {
  const weights = emptyStyleWeights();

  for (const record of decisionHistory) {
    const haystack =
      `${record.decisionId} ${record.decisionLabel} ${record.eventTitle}`.toLowerCase();

    if (
      haystack.includes('iletisim') ||
      haystack.includes('sosyal') ||
      haystack.includes('halk') ||
      haystack.includes('şikayet') ||
      haystack.includes('communication')
    ) {
      weights.public_first += 2;
    }

    if (
      haystack.includes('rota') ||
      haystack.includes('araç') ||
      haystack.includes('konteyner') ||
      haystack.includes('operasyon') ||
      haystack.includes('saha') ||
      haystack.includes('container') ||
      haystack.includes('vehicle')
    ) {
      weights.operator += 2;
    }

    if (
      haystack.includes('kaynak') ||
      haystack.includes('bütçe') ||
      haystack.includes('monitor') ||
      haystack.includes('izle') ||
      haystack.includes('bekle') ||
      haystack.includes('koru') ||
      haystack.includes('save')
    ) {
      weights.resource_guardian += 2;
    }

    if (
      haystack.includes('hızlı') ||
      haystack.includes('acil') ||
      haystack.includes('fast') ||
      haystack.includes('müdahale') ||
      record.decisionId.includes('fast')
    ) {
      weights.crisis_responder += 2;
    }
  }

  return weights;
}

function inferPriorityStyleWeights(
  dailyPriorityByDay: Record<number, DailyPriorityState>,
): StyleWeights {
  const weights = emptyStyleWeights();

  for (const state of Object.values(dailyPriorityByDay)) {
    if (!state.selectedKey) continue;
    const mapped = PRIORITY_TO_STYLE[state.selectedKey];
    weights[mapped] += state.finalResult?.status === 'fulfilled' ? 3 : 2;
  }

  return weights;
}

function mergeStyleWeights(a: StyleWeights, b: StyleWeights): StyleWeights {
  return {
    public_first: a.public_first + b.public_first,
    operator: a.operator + b.operator,
    resource_guardian: a.resource_guardian + b.resource_guardian,
    balanced_coordinator: a.balanced_coordinator + b.balanced_coordinator,
    crisis_responder: a.crisis_responder + b.crisis_responder,
  };
}

function inferManagementStyle(
  dailyPriorityByDay: Record<number, DailyPriorityState>,
  decisionHistory: DecisionRecord[],
): PilotManagementStyle {
  const priorityWeights = inferPriorityStyleWeights(dailyPriorityByDay);
  const decisionWeights = inferDecisionStyleWeights(decisionHistory);
  const combined = mergeStyleWeights(priorityWeights, decisionWeights);

  const priorityKeys = Object.values(dailyPriorityByDay)
    .map((s) => s.selectedKey)
    .filter(Boolean) as DailyPriorityKey[];
  const uniquePriorities = new Set(priorityKeys);
  if (uniquePriorities.size >= 3) {
    combined.balanced_coordinator += 4;
  }

  const entries = Object.entries(combined) as Array<[PilotManagementStyle, number]>;
  entries.sort((a, b) => b[1] - a[1]);
  const [topStyle, topScore] = entries[0]!;
  const [, secondScore] = entries[1] ?? ['balanced_coordinator', 0];

  if (topScore === 0) {
    return 'balanced_coordinator';
  }
  if (topStyle !== 'balanced_coordinator' && topScore - secondScore <= 1) {
    return 'balanced_coordinator';
  }
  return topStyle;
}

function aggregateGoals(dailyGoalsByDay: Record<number, DailyGoalState>): {
  completedGoals: number;
  failedGoals: number;
} {
  let completedGoals = 0;
  let failedGoals = 0;
  for (const state of Object.values(dailyGoalsByDay)) {
    for (const goal of state.goals ?? []) {
      if (goal.status === 'completed') completedGoals += 1;
      if (goal.status === 'failed') failedGoals += 1;
    }
  }
  return { completedGoals, failedGoals };
}

function aggregatePriorities(dailyPriorityByDay: Record<number, DailyPriorityState>): {
  fulfilledPriorities: number;
  partialPriorities: number;
  failedPriorities: number;
} {
  let fulfilledPriorities = 0;
  let partialPriorities = 0;
  let failedPriorities = 0;
  for (const state of Object.values(dailyPriorityByDay)) {
    const status = state.finalResult?.status;
    if (status === 'fulfilled') fulfilledPriorities += 1;
    else if (status === 'partial') partialPriorities += 1;
    else if (status === 'failed') failedPriorities += 1;
  }
  return { fulfilledPriorities, partialPriorities, failedPriorities };
}

function countCarryOverSignals(
  dailyPriorityByDay: Record<number, DailyPriorityState>,
): number {
  let count = 0;
  for (const state of Object.values(dailyPriorityByDay)) {
    count += (state.impactLog ?? []).filter(
      (entry) => entry.source === 'carry_over',
    ).length;
  }
  return count;
}

function resolveMetrics(
  gameState: GameState,
): PilotRunMetrics {
  const runMetrics = gameState.pilot.run?.finalMetrics;
  if (runMetrics) return runMetrics;
  return metricsFromCity(gameState.city);
}

function resolveMetricStrength(
  metrics: PilotRunMetrics,
): { strongest?: string; weakest?: string } {
  const scored: Array<{ key: keyof typeof METRIC_LABELS; value: number }> = [
    { key: 'publicSatisfaction', value: metrics.publicSatisfaction },
    {
      key: 'operationRisk',
      value: 100 - metrics.operationRisk,
    },
    {
      key: 'budget',
      value: Math.min(100, (metrics.budget / 100_000) * 100),
    },
    { key: 'staffMorale', value: metrics.staffMorale },
  ];

  scored.sort((a, b) => b.value - a.value);
  const strongest = METRIC_LABELS[scored[0]!.key];
  const weakest = METRIC_LABELS[scored[scored.length - 1]!.key];
  return { strongest, weakest };
}

function resolveBestNeighborhood(
  decisionHistory: DecisionRecord[],
  gameState: GameState,
): string | undefined {
  const counts = new Map<string, number>();
  for (const record of decisionHistory) {
    const id = record.neighborhoodId ?? record.neighborhoodName;
    if (!id) continue;
    const key = id.toLowerCase();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  if (counts.size === 0) {
    const districtId = gameState.pilot.selectedDistrictId;
    if (districtId) {
      return districtProfiles[districtId]?.shortName;
    }
    return undefined;
  }

  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0];
  return NEIGHBORHOOD_DISPLAY_NAMES[top] ?? top;
}

function buildNeighborhoodTransitionText(gameState: GameState): string {
  const districtName =
    gameState.pilot.run?.selectedDistrictName ??
    districtProfiles[gameState.pilot.selectedDistrictId ?? 'central']?.shortName ??
    'pilot bölge';

  return `7 günlük pilotta ${districtName} ve çevre mahalle dengesini yönettin. Ana operasyonda daha geniş mahalle ağı seni bekliyor.`;
}

function buildUnlockPreviewItems(
  gameState: GameState,
  isCompleted: boolean,
): PilotPreviewUnlockItem[] {
  const unlock = gameState.pilot.run?.unlockState;
  const pilotReady = isCompleted;

  return [
    {
      id: 'city-map',
      title: 'Şehir Haritası',
      text: 'Tek bölgeden tüm şehir ağına geçiş.',
      iconName: 'map-outline',
      status: unlock?.cityMapPreviewUnlocked ? 'soon' : pilotReady ? 'soon' : 'locked',
      tag: unlock?.cityMapPreviewUnlocked ? 'Yakında' : 'Kilitli',
    },
    {
      id: 'neighborhoods',
      title: 'Çoklu Mahalle Yönetimi',
      text: 'Farklı karakterde mahalleleri aynı anda yönet.',
      iconName: 'grid-outline',
      status: 'soon',
      tag: 'Yakında',
    },
    {
      id: 'butterfly',
      title: 'Kelebek Etkisi',
      text: 'Pilot kararlarının uzun vadeli yankılarını takip et.',
      iconName: 'git-branch-outline',
      status: pilotReady ? 'completed' : 'locked',
      tag: pilotReady ? 'Pilotla hazırlandı' : 'Kilitli',
    },
    {
      id: 'vehicles',
      title: 'Araç ve Rota',
      text: 'Filo, rota ve bakım kararlarını optimize et.',
      iconName: 'car-outline',
      status: pilotReady ? 'soon' : 'locked',
      tag: pilotReady ? 'Önizleme' : 'Kilitli',
    },
    {
      id: 'staff',
      title: 'Personel Yönetimi',
      text: 'Moral, yorgunluk ve vardiya dengesini yönet.',
      iconName: 'people-outline',
      status: pilotReady ? 'soon' : 'locked',
      tag: pilotReady ? 'Önizleme' : 'Kilitli',
    },
    {
      id: 'social',
      title: 'Sosyal Medya Baskısı',
      text: 'Krizleri yönet, halk algısını koru.',
      iconName: 'megaphone-outline',
      status: pilotReady ? 'soon' : 'locked',
      tag: pilotReady ? 'Önizleme' : 'Kilitli',
    },
  ];
}

function buildIncompleteSummary(
  day: number,
  gameState?: GameState,
): PilotCompletionSummary {
  const grade = 'steady' as const;
  const fallbackState = gameState ?? createDay1Seed().gameState;

  return {
    isCompleted: false,
    day,
    grade,
    gradeLabel: PILOT_COMPLETION_GRADE_LABELS[grade],
    title: 'Pilot devam ediyor',
    subtitle: '7 günlük pilot tamamlandığında ana operasyon önizlemesi açılacak.',
    score: 0,
    managementStyle: 'balanced_coordinator',
    managementStyleLabel: PILOT_MANAGEMENT_STYLE_LABELS.balanced_coordinator,
    managementStyleText: PILOT_MANAGEMENT_STYLE_TEXT.balanced_coordinator,
    completedGoals: 0,
    failedGoals: 0,
    fulfilledPriorities: 0,
    partialPriorities: 0,
    failedPriorities: 0,
    butterflyCount: 0,
    carryOverCount: 0,
    unlockedPreviewItems: buildUnlockPreviewItems(fallbackState, false),
    nextChapterText:
      'Pilot bölgesini tamamla; ardından şehir ölçeğinde ana operasyon hazırlığı başlayacak.',
  };
}

export function buildPilotCompletionSummary(
  params: BuildPilotCompletionSummaryParams,
): PilotCompletionSummary {
  const {
    gameState,
    decisionHistory = [],
    dailyPriorityByDay = {},
    dailyGoalsByDay = {},
    lastDailyReport,
    snapshots,
  } = params;

  const day = resolvePilotDay(gameState, lastDailyReport);
  if (!isPilotCompletionEligible(gameState, day)) {
    return buildIncompleteSummary(day, gameState);
  }

  const score = resolveCompletionScore(params);
  const grade = gradeFromScore(score);
  const managementStyle = inferManagementStyle(
    dailyPriorityByDay,
    decisionHistory,
  );
  const goals = aggregateGoals(dailyGoalsByDay);
  const priorities = aggregatePriorities(dailyPriorityByDay);
  const metrics = resolveMetrics(gameState);
  const { strongest, weakest } = resolveMetricStrength(metrics);
  const butterflyCount =
    gameState.pilot.butterflyHookState?.hooks?.length ?? 0;
  const carryOverCount = countCarryOverSignals(dailyPriorityByDay);

  const unlockedPreviewItems = buildUnlockPreviewItems(gameState, true);
  const authorityFields = buildPilotCompletionAuthorityFields({
    authorityState: gameState.pilot.authorityState,
    day,
  });

  return {
    isCompleted: true,
    day,
    grade,
    gradeLabel: PILOT_COMPLETION_GRADE_LABELS[grade],
    title: 'Pilot görev tamamlandı',
    subtitle: PILOT_COMPLETION_GRADE_SUBTITLES[grade],
    score,
    managementStyle,
    managementStyleLabel: PILOT_MANAGEMENT_STYLE_LABELS[managementStyle],
    managementStyleText: PILOT_MANAGEMENT_STYLE_TEXT[managementStyle],
    bestNeighborhoodName: resolveBestNeighborhood(decisionHistory, gameState),
    strongestMetricLabel: strongest,
    weakestMetricLabel: weakest,
    ...goals,
    ...priorities,
    butterflyCount,
    carryOverCount,
    unlockedPreviewItems,
    nextChapterText: buildNeighborhoodTransitionText(gameState),
    ...authorityFields,
  };
}

export function shouldShowPilotCompletionOnReport(
  reportDay: number,
  gameState: GameState,
): boolean {
  if (reportDay < PILOT_SCENARIO_DAYS) {
    return false;
  }
  if (gameState.pilot.status === 'completed') {
    return true;
  }
  return reportDay >= PILOT_SCENARIO_DAYS;
}
