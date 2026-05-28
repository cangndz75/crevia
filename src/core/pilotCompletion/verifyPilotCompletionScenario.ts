import { createDay1Seed } from '@/core/content/day1Seed';
import { createNotSelectedPriorityState } from '@/core/dailyPriority/dailyPriorityEngine';
import type {
  DailyPriorityFinalStatus,
  DailyPriorityKey,
  DailyPriorityState,
} from '@/core/dailyPriority/dailyPriorityTypes';
import { appendPilotLeaderboardIfNew } from '@/core/leaderboard/leaderboardSelectors';
import { selectCurrentPilotLeaderboardEntry } from '@/core/leaderboard/leaderboardSelectors';
import type { LeaderboardEntry } from '@/core/leaderboard/leaderboardTypes';
import { createDefaultPilotState } from '@/core/game/createDefaultPilotState';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import type { DailyGoalState } from '@/core/dailyGoals/dailyGoalTypes';
import type { DecisionRecord } from '@/core/models/DecisionRecord';
import type { GameState } from '@/core/models/GameState';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  buildPilotCompletionSummary,
  shouldShowPilotCompletionOnReport,
} from './pilotCompletionModel';
import {
  containsPaymentBannedCopy,
  PILOT_COMPLETION_GRADE_SUBTITLES,
  PILOT_MANAGEMENT_STYLE_LABELS,
} from './pilotCompletionPresentation';
import {
  MAIN_OPERATION_PREVIEW_ROUTE,
  PILOT_COMPLETION_PAYMENT_BANNED_WORDS,
} from './pilotCompletionTypes';

type Severity = 'PASS' | 'WARN' | 'FAIL';

type Check = { name: string; severity: Severity; detail: string };

export type PilotCompletionVerifyResult = {
  ok: boolean;
  checks: string[];
  failCount: number;
  warnCount: number;
};

function record(checks: Check[], severity: Severity, name: string, detail: string): void {
  checks.push({ name, severity, detail });
}

function assert(checks: Check[], name: string, condition: boolean, detail = ''): void {
  record(checks, condition ? 'PASS' : 'FAIL', name, condition ? 'ok' : detail || 'failed');
}

function priorityState(
  day: number,
  key: DailyPriorityKey,
  status: DailyPriorityFinalStatus,
): DailyPriorityState {
  const base = createNotSelectedPriorityState(day);
  return {
    ...base,
    selectedKey: key,
    status,
    score: status === 'fulfilled' ? 85 : status === 'partial' ? 55 : 30,
    progressPercent: 80,
    selectedAt: Date.now(),
    finalResult: {
      status,
      title: status,
      text: `${key} ${status}`,
      xpBonus: status === 'fulfilled' ? 15 : 8,
    },
  };
}

function baseGameState(day: number, status: GameState['pilot']['status'] = 'active'): GameState {
  const bundle = createDay1Seed();
  return {
    ...bundle.gameState,
    city: { ...bundle.gameState.city, day },
    pilot: {
      ...createDefaultPilotState(),
      ...bundle.gameState.pilot,
      status,
      currentPilotDay: day,
      selectedDistrictId: 'central',
    },
  };
}

function buildDecision(
  day: number,
  label: string,
  neighborhoodId = 'merkez',
): DecisionRecord {
  return {
    id: `d-${day}-${label}`,
    day,
    eventId: `e-${day}`,
    eventTitle: 'Test Olay',
    decisionId: `dec-${label}`,
    decisionLabel: label,
    neighborhoodId,
    neighborhoodName: neighborhoodId,
    appliedEffects: {},
    createdAt: new Date().toISOString(),
  };
}

function styleScenario(
  priorityKey: DailyPriorityKey,
  decisions: DecisionRecord[],
): PilotCompletionSummary {
  const gameState = baseGameState(7);
  const dailyPriorityByDay: Record<number, DailyPriorityState> = {};
  for (let day = 2; day <= 7; day += 1) {
    dailyPriorityByDay[day] = priorityState(day, priorityKey, 'fulfilled');
  }
  return buildPilotCompletionSummary({
    gameState,
    decisionHistory: decisions,
    dailyPriorityByDay,
    dailyGoalsByDay: {},
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  });
}

type PilotCompletionSummary = ReturnType<typeof buildPilotCompletionSummary>;

export function verifyPilotCompletionScenario(): PilotCompletionVerifyResult {
  const checks: Check[] = [];

  const day6 = buildPilotCompletionSummary({
    gameState: baseGameState(6),
    lastDailyReport: { day: 6, title: 'Gün 6', stats: [], rewardTitle: '—' },
  });
  assert(checks, 'Day 1-6 isCompleted false', !day6.isCompleted);

  const day7 = buildPilotCompletionSummary({
    gameState: baseGameState(7, 'completed'),
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
    dailyPriorityByDay: {
      7: priorityState(7, 'operation_stability', 'fulfilled'),
    },
  });
  assert(checks, 'Day 7 isCompleted true', day7.isCompleted);

  const missing = buildPilotCompletionSummary({
    gameState: baseGameState(7, 'completed'),
  });
  assert(
    checks,
    'Missing report data no crash',
    missing.isCompleted && missing.score >= 0 && missing.unlockedPreviewItems.length >= 6,
  );

  assert(checks, 'Grade excellent >=85', buildPilotCompletionSummary({
    gameState: {
      ...baseGameState(7, 'completed'),
      pilot: {
        ...baseGameState(7, 'completed').pilot,
        finalResult: {
          status: 'successful',
          score: 90,
          summary: 'x',
          completedAtDay: 7,
        },
      },
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  }).grade === 'excellent');

  assert(checks, 'Grade strong 70-84', buildPilotCompletionSummary({
    gameState: {
      ...baseGameState(7, 'completed'),
      pilot: {
        ...baseGameState(7, 'completed').pilot,
        finalResult: {
          status: 'controlled',
          score: 75,
          summary: 'x',
          completedAtDay: 7,
        },
      },
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  }).grade === 'strong');

  assert(checks, 'Grade steady 50-69', buildPilotCompletionSummary({
    gameState: {
      ...baseGameState(7, 'completed'),
      pilot: {
        ...baseGameState(7, 'completed').pilot,
        finalResult: {
          status: 'risky',
          score: 55,
          summary: 'x',
          completedAtDay: 7,
        },
      },
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  }).grade === 'steady');

  assert(checks, 'Grade fragile <50', buildPilotCompletionSummary({
    gameState: {
      ...baseGameState(7, 'completed'),
      pilot: {
        ...baseGameState(7, 'completed').pilot,
        finalResult: {
          status: 'failed',
          score: 40,
          summary: 'x',
          completedAtDay: 7,
        },
      },
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  }).grade === 'fragile');

  for (const grade of Object.keys(PILOT_COMPLETION_GRADE_SUBTITLES) as Array<
    keyof typeof PILOT_COMPLETION_GRADE_SUBTITLES
  >) {
    assert(
      checks,
      `Grade text ${grade} not empty`,
      PILOT_COMPLETION_GRADE_SUBTITLES[grade].trim().length > 0,
    );
  }

  const publicFirst = styleScenario('public_relief', [
    buildDecision(2, 'Halk ile iletişim kur'),
    buildDecision(3, 'Sosyal medya yanıtı ver'),
  ]);
  assert(checks, 'public_first style', publicFirst.managementStyle === 'public_first');

  const operator = styleScenario('operation_stability', [
    buildDecision(2, 'Saha operasyonu rota düzenle'),
    buildDecision(3, 'Konteyner müdahalesi'),
  ]);
  assert(checks, 'operator style', operator.managementStyle === 'operator');

  const resource = styleScenario('resource_protection', [
    buildDecision(2, 'Kaynak koru ve izle'),
    buildDecision(3, 'Monitor only bekle'),
  ]);
  assert(checks, 'resource_guardian style', resource.managementStyle === 'resource_guardian');

  const balanced = buildPilotCompletionSummary({
    gameState: baseGameState(7, 'completed'),
    dailyPriorityByDay: {
      2: priorityState(2, 'public_relief', 'fulfilled'),
      3: priorityState(3, 'operation_stability', 'fulfilled'),
      4: priorityState(4, 'resource_protection', 'fulfilled'),
      5: priorityState(5, 'public_relief', 'partial'),
      6: priorityState(6, 'operation_stability', 'partial'),
      7: priorityState(7, 'resource_protection', 'fulfilled'),
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  });
  assert(
    checks,
    'balanced_coordinator style',
    balanced.managementStyle === 'balanced_coordinator',
  );

  const crisis = buildPilotCompletionSummary({
    gameState: baseGameState(7, 'completed'),
    decisionHistory: [
      buildDecision(2, 'Hızlı acil müdahale'),
      buildDecision(3, 'Fast response ekip yönlendir'),
      buildDecision(4, 'Acil saha müdahalesi'),
    ],
    dailyPriorityByDay: {
      7: priorityState(7, 'operation_stability', 'partial'),
    },
    lastDailyReport: { day: 7, title: 'Gün 7', stats: [], rewardTitle: '—' },
  });
  assert(checks, 'crisis_responder style', crisis.managementStyle === 'crisis_responder');

  assert(
    checks,
    'Unlock preview items >= 6',
    day7.unlockedPreviewItems.length >= 6,
  );
  const itemsValid = day7.unlockedPreviewItems.every(
    (item) =>
      item.title.trim().length > 0 &&
      item.text.trim().length > 0 &&
      ['completed', 'locked', 'soon'].includes(item.status),
  );
  assert(checks, 'Unlock items have title/text/status', itemsValid);

  const allCopy = [
    day7.title,
    day7.subtitle,
    day7.nextChapterText,
    ...day7.unlockedPreviewItems.flatMap((i) => [i.title, i.text, i.tag ?? '']),
    ...Object.values(PILOT_MANAGEMENT_STYLE_LABELS),
    ...Object.values(PILOT_COMPLETION_GRADE_SUBTITLES),
  ].join(' ');
  assert(
    checks,
    'No payment/IAP banned words',
    !containsPaymentBannedCopy(allCopy) &&
      !PILOT_COMPLETION_PAYMENT_BANNED_WORDS.some((w) =>
        allCopy.toLowerCase().includes(w),
      ),
  );

  assert(
    checks,
    'Report card only Day 7',
    !shouldShowPilotCompletionOnReport(6, baseGameState(6)) &&
      shouldShowPilotCompletionOnReport(7, baseGameState(7)),
  );

  const previewMissing = buildPilotCompletionSummary({
    gameState: baseGameState(3),
  });
  assert(
    checks,
    'Preview missing summary safe',
    !previewMissing.isCompleted && previewMissing.unlockedPreviewItems.length >= 6,
  );

  const entry: LeaderboardEntry = selectCurrentPilotLeaderboardEntry({
    gameState: baseGameState(7, 'completed'),
    personnelState: createInitialPersonnelState(),
    decisionHistory: [],
    category: 'overall',
    period: 'pilot',
  });
  const slice = { bestPilotScores: [], lastPilotScore: undefined };
  const first = appendPilotLeaderboardIfNew(slice, entry);
  const second = appendPilotLeaderboardIfNew(first, entry);
  assert(
    checks,
    'No duplicate leaderboard append',
    first.bestPilotScores.length === 1 &&
      second.bestPilotScores.length === 1 &&
      first.bestPilotScores[0]?.id === second.bestPilotScores[0]?.id,
  );

  assert(
    checks,
    'CTA route /events/main-operation-preview',
    MAIN_OPERATION_PREVIEW_ROUTE === '/events/main-operation-preview',
  );

  const routePath = resolve(
    process.cwd(),
    'src',
    'app',
    'events',
    'main-operation-preview.tsx',
  );
  assert(
    checks,
    'Main operation preview route file exists',
    existsSync(routePath),
  );

  const formatted = checks.map((c) => {
    const icon = c.severity === 'PASS' ? '✓' : c.severity === 'WARN' ? '⚠' : '✗';
    return `${icon} ${c.name}${c.detail && c.detail !== 'ok' ? `: ${c.detail}` : ''}`;
  });

  const failCount = checks.filter((c) => c.severity === 'FAIL').length;
  const warnCount = checks.filter((c) => c.severity === 'WARN').length;

  return {
    ok: failCount === 0,
    checks: formatted,
    failCount,
    warnCount,
  };
}
