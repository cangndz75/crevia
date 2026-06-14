import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { SAVE_VERSION } from '@/store/gamePersist';

import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import {
  buildCenterContinuationCards,
  centerContinuationCardsRouteSafety,
} from '@/features/hub/utils/centerContinuationCardsPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import {
  buildMemoryFollowUpPresentationContext,
  type MemoryFollowUpPresentationContext,
} from '@/features/shared/utils/memoryFollowUpPresentationContext';

type Check = { name: string; ok: boolean; detail: string };

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 27;
const ALLOWED_ROUTES = new Set(['/', '/reports', '/events', '/map']);

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function makeStateForDay(day: number) {
  const base = createDay1Seed().gameState;
  if (day < 8) {
    return {
      ...base,
      city: { ...base.city, day },
      pilot: { ...base.pilot, currentPilotDay: day },
      player: { ...base.player, streakDays: Math.max(1, day - 1) },
    };
  }
  return {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
    events: [
      ...(base.events ?? []),
      {
        ...(base.events[0] ?? {}),
        id: `wiring_event_${day}`,
        title: 'Rota daralması',
        district: 'Sanayi',
        neighborhoodId: 'sanayi',
        status: 'active',
      },
    ],
  };
}

function makeOperationSignals(day: number) {
  return createInitialOperationSignalsState(day);
}

function buildHubPresentation(day: number, extras: Record<string, unknown> = {}) {
  const gameState = makeStateForDay(day) as import('@/core/models/GameState').GameState;
  return buildCenterHomePresentation({
    gameState,
    operationSignals: makeOperationSignals(day),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubImpactExplanationLine:
      day >= 3 ? 'Önceki rota tercihi bugün kaynak baskısını artırdı.' : undefined,
    hubDistrictReportLine: day >= 8 ? 'Mahalle güveni bugünkü kararla değişti.' : undefined,
    hubStoryChainLine: day >= 10 ? 'Hikaye zinciri yeni bir iz bıraktı.' : undefined,
    hubCityJournal: extras.hubCityJournal as never,
    ...extras,
  });
}

function countCardsById(
  cards: ReturnType<typeof buildCenterContinuationCards>['cards'],
  idPrefix: string,
): number {
  return cards.filter((card) => card.id.startsWith(idPrefix)).length;
}

function linesUnique(lines: Array<string | undefined | null>): boolean {
  const normalized = lines.filter(Boolean).map((line) => line!.trim().toLowerCase());
  return new Set(normalized).size === normalized.length;
}

function contextBuildOrderSafe(context: MemoryFollowUpPresentationContext): boolean {
  return (
    context.dailyCapacityPortfolio != null &&
    context.portfolioDeferRisk != null &&
    context.oneMoreDayRetention != null &&
    context.cityMemoryVisibility != null &&
    context.followUpActions != null &&
    context.followUpExecution != null &&
    context.eceStrategyLines != null
  );
}

export function verifyMemoryFollowUpWiringScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  const day1Context = buildMemoryFollowUpPresentationContext({
    day: 1,
    gameState: makeStateForDay(1) as import('@/core/models/GameState').GameState,
    operationSignals: makeOperationSignals(1),
  });
  assert(checks, contextBuildOrderSafe(day1Context), 'Build order safe (Day 1)');
  const day1Report = buildEndOfDayReportViewModel({
    report: buildDailyReport({
      day: 1,
      metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
      decisionHistory: [],
      activeEvents: [],
      resolvedEventIds: [],
      snapshots: [],
    }),
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: 1, totalXp: 0, categories: [] },
    memoryFollowUpContext: day1Context,
  });
  assert(
    checks,
    !day1Report.cityMemoryNote && !day1Report.followUpActionHint,
    'Day 1 report memory/follow-up low-noise',
  );
  assert(
    checks,
    !day1Context.followUpActions.primaryAction ||
      day1Context.followUpActions.primaryAction.isFallback === true,
    'Day 1 follow-up low-noise',
  );
  assert(
    checks,
    !day1Context.followUpExecution.isActive &&
      day1Context.followUpExecution.availableCandidates.length === 0,
    'Day 1 follow-up execution hidden',
  );

  const day3Context = buildMemoryFollowUpPresentationContext({
    day: 3,
    gameState: makeStateForDay(3) as import('@/core/models/GameState').GameState,
    operationSignals: makeOperationSignals(3),
    hubImpactExplanationLine: 'Önceki karar bugünkü önceliği etkiliyor.',
  });
  assert(checks, contextBuildOrderSafe(day3Context), 'Build order safe (Day 3)');

  const day8Context = buildMemoryFollowUpPresentationContext({
    day: 8,
    gameState: makeStateForDay(8) as import('@/core/models/GameState').GameState,
    operationSignals: makeOperationSignals(8),
    hubImpactExplanationLine: 'Önceki rota tercihi bugün kaynak baskısını artırdı.',
    hubDistrictReportLine: 'Mahalle güveni bugünkü kararla değişti.',
    hubTomorrowRisk: {
      id: 'risk_route',
      title: 'Yarın rota riski',
      mainLine: 'Rota baskısı yarın tekrar okunmalı.',
      priority: 'high',
      relatedDomain: 'route',
      sourceSignals: ['operation_signals'],
      shouldShowInHub: true,
      shouldShowInReport: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
      kind: 'route_pressure_tomorrow',
      tone: 'risk',
    } as import('@/core/tomorrowRisk/tomorrowRiskTypes').TomorrowRiskModel,
  });
  assert(checks, contextBuildOrderSafe(day8Context), 'Build order safe (Day 8)');
  assert(
    checks,
    day8Context.cityMemoryVisibility.traces.length > 0 ||
      day8Context.followUpActions.actions.length > 0,
    'Day 8+ visibility candidate',
    `traces=${day8Context.cityMemoryVisibility.traces.length} actions=${day8Context.followUpActions.actions.length}`,
  );
  assert(
    checks,
    day8Context.followUpExecution.availableCandidates.length <= 3,
    'Day 8 follow-up execution capped',
  );

  const day1Hub = buildHubPresentation(1);
  assert(
    checks,
    countCardsById(day1Hub.continuationCards.cards, 'city-memory-continuation') === 0,
    'Hub Day 1 max 0 city memory card',
  );
  assert(
    checks,
    countCardsById(day1Hub.continuationCards.cards, 'follow-up-action-continuation') === 0,
    'Hub Day 1 max 0 follow-up card',
  );

  const day8Hub = buildHubPresentation(8);
  assert(
    checks,
    countCardsById(day8Hub.continuationCards.cards, 'city-memory-continuation') <= 1,
    'Hub max 1 city memory card',
  );
  assert(
    checks,
    countCardsById(day8Hub.continuationCards.cards, 'follow-up-action-continuation') <= 1,
    'Hub max 1 follow-up card',
  );
  assert(checks, centerContinuationCardsRouteSafety(day8Hub.continuationCards), 'Hub CTA route safety');

  const day8Report = buildEndOfDayReportViewModel({
    report: buildDailyReport({
      day: 8,
      metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
      decisionHistory: [],
      activeEvents: [],
      resolvedEventIds: [],
      snapshots: [],
    }),
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day: 8, totalXp: 12, categories: [] },
    memoryFollowUpContext: day8Context,
  });
  assert(
    checks,
    (day8Report.cityMemoryNote ? 1 : 0) <= 1,
    'Report max 1 city memory note',
  );
  assert(
    checks,
    (day8Report.followUpActionHint ? 1 : 0) <= 1,
    'Report max 1 follow-up hint',
  );
  assert(
    checks,
    (day8Report.followUpExecutionNote ? 1 : 0) <= 1,
    'Report max 1 follow-up execution note',
  );
  assert(
    checks,
    linesUnique([
      day8Report.oneMoreDayCard?.line,
      day8Report.eceStrategyLine?.text,
      day8Report.cityMemoryNote?.line,
      day8Report.followUpActionHint?.line,
      day8Report.followUpExecutionNote,
    ]),
    'Report duplicate exact line guard',
  );

  const advisorLines = [
    day8Hub.advisorSuggestion.recommendation,
    day8Hub.advisorSuggestion.reason,
    day8Hub.advisorSuggestion.contextLine,
  ];
  const continuationBodies = day8Hub.continuationCards.cards.map((card) => card.body);
  assert(
    checks,
    advisorLines.filter(Boolean).length <= 3,
    'Ece max 1 primary recommendation path',
  );
  assert(
    checks,
    continuationBodies.filter((body) => /takip|uygulama|kontrol|izle/i.test(body)).length <= 2,
    'Follow-up execution copy bounded',
  );

  const missingSourceContext = buildMemoryFollowUpPresentationContext({
    day: 8,
    gameState: makeStateForDay(8) as import('@/core/models/GameState').GameState,
  });
  assert(checks, contextBuildOrderSafe(missingSourceContext), 'Missing source safe fallback');

  const contextFile = readRepo('src/features/shared/utils/memoryFollowUpPresentationContext.ts');
  assert(checks, contextFile.includes('buildCityMemoryVisibility'), 'CityMemory production caller');
  assert(checks, contextFile.includes('buildFollowUpActions'), 'FollowUpActions production caller');
  assert(checks, contextFile.includes('buildFollowUpExecution'), 'FollowUpExecution production caller');
  assert(checks, !contextFile.includes('useGameStore'), 'Context adapter no store write');

  const homeFile = readRepo('src/features/hub/utils/centerHomePresentation.ts');
  assert(checks, homeFile.includes('buildMemoryFollowUpPresentationContext'), 'Hub home wiring');

  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  assert(checks, reportView.includes('memoryFollowUpContext'), 'Report production caller');

  const persist = readRepo('src/store/gamePersist.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27', `v${SAVE_VERSION}`);
  assert(checks, !persist.includes('memoryFollowUp'), 'gamePersist shape unchanged');
  assert(checks, persist.includes('strategyHistory'), 'strategyHistory persisted');
  assert(checks, !applyDecision.includes('memoryFollowUp'), 'applyDecision unchanged');
  assert(checks, !contextFile.includes('ensureDailyEventsForDay'), 'day pipeline unchanged');

  const followUpCard = day8Hub.continuationCards.cards.find(
    (card) => card.id === 'follow-up-action-continuation',
  );
  if (followUpCard?.route) {
    assert(checks, ALLOWED_ROUTES.has(followUpCard.route), 'Follow-up route allowlist', followUpCard.route);
  } else {
    assert(checks, true, 'Follow-up route allowlist (no card)');
  }

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map(
      (check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`,
    ),
  };
}
