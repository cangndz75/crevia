import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import {
  centerContinuationCardsRouteSafety,
} from '@/features/hub/utils/centerContinuationCardsPresentation';
import { centerAdvisorDedupeText } from '@/features/hub/utils/centerAdvisorPresentation';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import {
  buildMapMotionPresentation,
  countAnimatedMapMotionMarkers,
  countMapMotionByIntensity,
  MAP_MOTION_MAX_ANIMATED,
  MAP_MOTION_MAX_STRONG,
} from '@/features/map/utils/mapMotionPresentation';
import {
  buildMemoryFollowUpPresentationContext,
  type MemoryFollowUpPresentationContext,
} from '@/features/shared/utils/memoryFollowUpPresentationContext';

import type {
  GameplayLoopQaOutcome,
  GameplayLoopQaScenarioId,
  GameplayLoopQaScenarioSnapshot,
} from './gameplayLoopQaTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail?: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail ?? ok}`);
  return pass;
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
    pilot: { ...base.pilot, currentPilotDay: day, status: 'completed' as const },
    player: { ...base.player, streakDays: Math.max(1, day - 1) },
    events: [
      ...(base.events ?? []),
      {
        ...(base.events[0] ?? {}),
        id: `qa_event_${day}`,
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

function makeReport(day: number) {
  return buildDailyReport({
    day,
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
  });
}

function buildContext(day: number, extra: Record<string, unknown> = {}) {
  return buildMemoryFollowUpPresentationContext({
    day,
    gameState: makeStateForDay(day) as import('@/core/models/GameState').GameState,
    operationSignals: makeOperationSignals(day),
    socialPulseState: createInitialSocialPulseState(),
    hubImpactExplanationLine:
      day >= 3 ? 'Önceki karar bugünkü önceliği etkiliyor.' : undefined,
    hubDistrictReportLine: day >= 8 ? 'Mahalle güveni bugünkü kararla değişti.' : undefined,
    hubStoryChainLine: day >= 10 ? 'Hikaye zinciri yeni bir iz bıraktı.' : undefined,
    ...extra,
  });
}

function buildHub(day: number, extra: Record<string, unknown> = {}) {
  const gameState = makeStateForDay(day) as import('@/core/models/GameState').GameState;
  return buildCenterHomePresentation({
    gameState,
    operationSignals: makeOperationSignals(day),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubImpactExplanationLine:
      day >= 3 ? 'Önceki karar bugünkü önceliği etkiliyor.' : undefined,
    hubDistrictReportLine: day >= 8 ? 'Mahalle güveni bugünkü kararla değişti.' : undefined,
    hubStoryChainLine: day >= 10 ? 'Hikaye zinciri yeni bir iz bıraktı.' : undefined,
    ...extra,
  });
}

function buildReportVm(day: number, context: MemoryFollowUpPresentationContext) {
  return buildEndOfDayReportViewModel({
    report: makeReport(day),
    metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
    dailyXpReport: { day, totalXp: day > 1 ? 12 : 0, categories: [] },
    memoryFollowUpContext: context,
  });
}

function normalizeLine(line: string | undefined | null): string {
  return line?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function countExactDuplicates(lines: Array<string | undefined | null>): number {
  const normalized = lines.filter(Boolean).map((line) => normalizeLine(line));
  return normalized.length - new Set(normalized).size;
}

function collectReportLines(
  report: ReturnType<typeof buildEndOfDayReportViewModel>,
): string[] {
  return [
    report.oneMoreDayCard?.line,
    report.oneMoreDayCard?.tomorrowLine,
    report.eceStrategyLine?.text,
    report.cityMemoryNote?.line,
    report.followUpActionHint?.line,
    report.positiveComebackNote,
    report.districtNeglectRecoveryNote,
    report.day8StrategicContentNote,
    report.cityRhythmNote,
    ...(report.tomorrowNotes ?? []),
  ].filter(Boolean) as string[];
}

function collectHubLines(hub: ReturnType<typeof buildCenterHomePresentation>): string[] {
  const advisorLine = centerAdvisorDedupeText(hub.advisorSuggestion);
  return [
    advisorLine,
    hub.advisorSuggestion.caution,
    ...hub.continuationCards.cards.map((card) => card.body),
    hub.portfolioSurface.summaryLine,
    hub.portfolioSurface.primaryTradeoffLine,
    hub.portfolioSurface.eceLine,
  ].filter(Boolean) as string[];
}

function runScenario(
  id: GameplayLoopQaScenarioId,
  day: number,
  options: {
    reducedMotion?: boolean;
    extraContext?: Record<string, unknown>;
    extraHub?: Record<string, unknown>;
  } = {},
): GameplayLoopQaScenarioSnapshot {
  const context = buildContext(day, options.extraContext);
  const hub = buildHub(day, options.extraHub);
  const report = buildReportVm(day, context);
  const mapMotion = buildMapMotionPresentation({
    day,
    reducedMotion: options.reducedMotion,
    day8StrategicContent: context.day8StrategicContent,
    districtNeglectRecovery: context.districtNeglectRecovery,
    positiveComeback: context.positiveComeback,
    cityMemoryVisibility: context.cityMemoryVisibility,
  });

  const reportLines = collectReportLines(report);
  const hubLines = collectHubLines(hub);
  const duplicateLineCount = countExactDuplicates([...reportLines, ...hubLines]);

  const eceLines = [
    hub.advisorSuggestion.recommendation,
    hub.advisorSuggestion.reason,
    hub.advisorSuggestion.contextLine,
  ].filter(Boolean);

  const reportNoteCount = [
    report.oneMoreDayCard,
    report.eceStrategyLine,
    report.cityMemoryNote,
    report.followUpActionHint,
    report.positiveComebackNote,
    report.districtNeglectRecoveryNote,
    report.day8StrategicContentNote,
    report.cityRhythmNote,
  ].filter(Boolean).length;

  return {
    id,
    day,
    visibleSurfaceCount: hub.continuationCards.cards.length + reportNoteCount,
    duplicateLineCount,
    eceLineCount: eceLines.length,
    continuationCardCount: hub.continuationCards.cards.length,
    reportNoteCount,
    mapAnimatedCount: countAnimatedMapMotionMarkers(mapMotion.markers),
    mapStrongCount: countMapMotionByIntensity(mapMotion.markers, 'strong'),
    cityRhythmVisible:
      day >= 8 &&
      Boolean(context.cityRhythmDirector.primarySlot ?? context.cityRhythmDirector.slots.length),
    day8StrategicVisible:
      day >= 8 &&
      (context.day8StrategicContent.candidates.some((c) => !c.isFallback) ||
        Boolean(context.day8StrategicContent.primaryCandidate)),
    warnings: [],
  };
}

export function verifyGameplayLoopQaScenario(): GameplayLoopQaOutcome {
  const checks: string[] = [];
  let ok = true;
  let warn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION 27'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('gameplayLoopQa'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('gameplayLoopQa'), 'applyDecision unchanged'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('gameplayLoopQa'),
      'day pipeline unchanged',
    ),
  );

  const migratedV26 = normalizePersistedSave({
    ...createDay1Seed(),
    saveVersion: 26,
    updatedAt: '2026-06-15T00:00:00.000Z',
  });
  record(
    assert(
      checks,
      migratedV26?.saveVersion === SAVE_VERSION &&
        migratedV26.strategyHistory.decisionHistory.length === 0,
      'v26 save migration includes strategyHistory',
      'v26 strategyHistory migration failed',
    ),
  );

  const snapshots: GameplayLoopQaScenarioSnapshot[] = [
    runScenario('day1_pilot_start', 1),
    runScenario('day3_pilot_consequence', 3),
    runScenario('day7_pilot_transition', 7),
    runScenario('day8_first_strategic', 8),
    runScenario('day8_low_data', 8, { extraContext: { dailyCapacityPortfolioResult: undefined } }),
    runScenario('day10_mixed_city', 10),
    runScenario('day12_high_pressure', 12),
    runScenario('reduced_motion', 8, { reducedMotion: true }),
    runScenario('save_resume_smoke', 8),
  ];

  const day1 = snapshots.find((entry) => entry.id === 'day1_pilot_start')!;
  const day1Context = buildContext(1);
  record(assert(checks, day1.day === 1, 'Day 1 low-noise scenario'));
  record(assert(checks, !day1.cityRhythmVisible, 'CityRhythm visible only Day 8+ (Day 1 hidden)'));
  record(assert(checks, !day1.day8StrategicVisible, 'Day8StrategicContent visible only Day 8+ (Day 1 hidden)'));
  record(assert(checks, day1.mapAnimatedCount <= MAP_MOTION_MAX_ANIMATED, 'MapMotion guard Day 1'));
  record(
    assert(
      checks,
      !day1Context.positiveComeback.candidates.some(
        (candidate) => !candidate.isFallback && candidate.visibilityLevel !== 'hidden',
      ) || day1Context.positiveComeback.candidates.length <= 1,
      'Positive Day 1 hidden/safe',
    ),
  );
  record(
    assert(
      checks,
      day1Context.districtNeglectRecovery.signals.every(
        (signal) => signal.isFallback || signal.neglectBand === 'none',
      ) || day1Context.day < 8,
      'DistrictNeglect Day 1 hidden/safe',
    ),
  );
  record(
    assert(
      checks,
      !day1Context.followUpActions.primaryAction ||
        day1Context.followUpActions.primaryAction.isFallback,
      'FollowUp Day 1 hidden/safe',
    ),
  );

  const day3 = snapshots.find((entry) => entry.id === 'day3_pilot_consequence')!;
  const day3Hub = buildHub(3);
  const day3Report = buildReportVm(3, buildContext(3));
  record(assert(checks, countExactDuplicates(collectReportLines(day3Report)) === 0, 'Day 3 report duplicate guard'));
  record(assert(checks, countExactDuplicates(collectHubLines(day3Hub)) === 0, 'Day 3 hub duplicate guard'));

  const day7 = snapshots.find((entry) => entry.id === 'day7_pilot_transition')!;
  record(assert(checks, !day7.cityRhythmVisible, 'Day 7 transition not polluted by CityRhythm'));
  record(assert(checks, !day7.day8StrategicVisible, 'Day 7 transition not polluted by Day8 strategic'));

  const day8 = snapshots.find((entry) => entry.id === 'day8_first_strategic')!;
  record(assert(checks, day8.day8StrategicVisible || day8.reportNoteCount > 0, 'Day 8 strategic loop visible'));
  record(assert(checks, day8.continuationCardCount <= 3, 'Hub continuation not overcrowded Day 8'));
  record(assert(checks, day8.mapAnimatedCount <= MAP_MOTION_MAX_ANIMATED, 'Map animated marker max 5 Day 8'));
  record(assert(checks, day8.mapStrongCount <= MAP_MOTION_MAX_STRONG, 'Map strong marker max 1 Day 8'));

  const day8Low = snapshots.find((entry) => entry.id === 'day8_low_data')!;
  if (day8Low.visibleSurfaceCount === 0) {
    checks.push('WARN Day 8 low-data surface sparse');
    warn = true;
  } else {
    record(assert(checks, true, 'Day 8 low-data safe fallback'));
  }

  const day10 = snapshots.find((entry) => entry.id === 'day10_mixed_city')!;
  const day10Hub = buildHub(10);
  const day10Report = buildReportVm(10, buildContext(10));
  record(assert(checks, countExactDuplicates(collectReportLines(day10Report)) === 0, 'Report duplicate guard Day 10'));
  record(assert(checks, countExactDuplicates(collectHubLines(day10Hub)) === 0, 'Hub duplicate guard Day 10'));
  record(assert(checks, day10.mapAnimatedCount <= MAP_MOTION_MAX_ANIMATED, 'Map motion guard Day 10'));

  const day12 = snapshots.find((entry) => entry.id === 'day12_high_pressure')!;
  record(assert(checks, day12.eceLineCount <= 3, 'Ece max primary path Day 12'));
  if (day12.reportNoteCount > 6) {
    checks.push('WARN Report over-density Day 12');
    warn = true;
  }

  const reducedMotion = buildMapMotionPresentation({
    day: 8,
    reducedMotion: true,
    day8StrategicContent: buildContext(8).day8StrategicContent,
    districtNeglectRecovery: buildContext(8).districtNeglectRecovery,
  });
  record(
    assert(
      checks,
      reducedMotion.markers.every((marker) => !marker.pulse),
      'Reduced motion disables pulse',
    ),
  );
  record(assert(checks, snapshots.find((e) => e.id === 'reduced_motion')!.mapAnimatedCount === 0, 'Reduced motion animated count zero'));

  const day8Hub = buildHub(8);
  const day8Report = buildReportVm(8, buildContext(8));
  record(
    assert(
      checks,
      countExactDuplicates(collectReportLines(day8Report)) === 0,
      'Report duplicate guard Day 8',
    ),
  );
  record(
    assert(
      checks,
      countExactDuplicates(collectHubLines(day8Hub)) === 0,
      'Hub duplicate guard Day 8',
    ),
  );
  record(assert(checks, centerContinuationCardsRouteSafety(day8Hub.continuationCards), 'Hub continuation route safety'));

  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  record(assert(checks, reportView.includes('cityMemoryNote'), 'Report renders cityMemoryNote'));
  record(assert(checks, reportView.includes('cityRhythmNote'), 'Report renders cityRhythmNote'));
  record(assert(checks, reportView.includes('positiveComebackNote'), 'Report renders positiveComebackNote'));
  record(assert(checks, reportView.includes('followUpActionHint'), 'Report renders followUpActionHint'));

  const hubHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  record(assert(checks, hubHome.includes('CenterMotionEnter') && hubHome.includes('hubMotionEnabled'), 'Hub motion integration present'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-gameplay-loop-qa.md')), 'QA docs exist'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/analyze-gameplay-loop-qa.ts')), 'Analyzer script exists'));

  record(
    assert(
      checks,
      !readRepo('src/core/game/generateDailyEventSet.ts').includes('day8StrategicContent'),
      'No event selection rewrite',
    ),
  );

  if (checks.some((line) => line.startsWith('WARN'))) {
    warn = true;
  }

  return { ok, warn, checks, snapshots };
}

export function analyzeGameplayLoopQaScenario(): {
  ok: boolean;
  warnCount: number;
  failCount: number;
  snapshots: GameplayLoopQaScenarioSnapshot[];
  lines: string[];
} {
  const outcome = verifyGameplayLoopQaScenario();
  const lines: string[] = [];
  let warnCount = 0;
  let failCount = 0;

  for (const snapshot of outcome.snapshots) {
    lines.push(`\n=== ${snapshot.id} (Day ${snapshot.day}) ===`);
    lines.push(`visible surfaces: ${snapshot.visibleSurfaceCount}`);
    lines.push(`duplicate lines: ${snapshot.duplicateLineCount}`);
    lines.push(`ece lines: ${snapshot.eceLineCount}`);
    lines.push(`continuation cards: ${snapshot.continuationCardCount}`);
    lines.push(`report notes: ${snapshot.reportNoteCount}`);
    lines.push(`map animated: ${snapshot.mapAnimatedCount}, strong: ${snapshot.mapStrongCount}`);
    lines.push(`cityRhythm visible: ${snapshot.cityRhythmVisible}`);
    lines.push(`day8 strategic visible: ${snapshot.day8StrategicVisible}`);

    if (snapshot.day === 1 && snapshot.day8StrategicVisible) {
      lines.push('FAIL Day 1 strategic spam');
      failCount += 1;
    }
    if (countExactDuplicates(collectReportLines(buildReportVm(snapshot.day, buildContext(snapshot.day)))) > 0) {
      lines.push('FAIL report exact duplicate line');
      failCount += 1;
    }
    if (countExactDuplicates(collectHubLines(buildHub(snapshot.day))) > 0) {
      lines.push('FAIL hub exact duplicate line');
      failCount += 1;
    }
    if (snapshot.eceLineCount > 3) {
      lines.push('FAIL Ece >1 line path');
      failCount += 1;
    }
    if (snapshot.mapAnimatedCount > MAP_MOTION_MAX_ANIMATED) {
      lines.push('FAIL map animated >5');
      failCount += 1;
    }
    if (snapshot.mapStrongCount > MAP_MOTION_MAX_STRONG) {
      lines.push('FAIL map strong >1');
      failCount += 1;
    }
    if (snapshot.id === 'reduced_motion' && snapshot.mapAnimatedCount > 0) {
      lines.push('FAIL reduced motion pulse active');
      failCount += 1;
    }
    if (
      snapshot.id === 'day8_first_strategic' &&
      !snapshot.day8StrategicVisible &&
      snapshot.reportNoteCount === 0
    ) {
      lines.push('WARN Day 8+ no strategic content with real source');
      warnCount += 1;
    }
    if (snapshot.continuationCardCount > 3) {
      lines.push('WARN Hub continuation over-density');
      warnCount += 1;
    }
    if (snapshot.reportNoteCount > 6) {
      lines.push('WARN Report over-density');
      warnCount += 1;
    }
  }

  lines.push(
    `\nVerify summary: ${outcome.checks.filter((l) => l.startsWith('PASS')).length} PASS, ${outcome.checks.filter((l) => l.startsWith('FAIL')).length} FAIL`,
  );
  if (!outcome.ok) failCount += 1;

  return {
    ok: failCount === 0,
    warnCount,
    failCount,
    snapshots: outcome.snapshots,
    lines,
  };
}
