import { existsSync, readFileSync } from 'node:fs';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { createDay1Seed } from '@/core/content/day1Seed';
import { buildDailyReport } from '@/core/game/buildDailyReport';
import { verifyGameplayLoopQaScenario } from '@/core/quality/gameplayLoopQaScenario';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { SAVE_VERSION } from '@/store/gamePersist';
import { buildCenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { centerAdvisorDedupeText } from '@/features/hub/utils/centerAdvisorPresentation';
import { centerContinuationCardsRouteSafety } from '@/features/hub/utils/centerContinuationCardsPresentation';
import {
  auditCenterUiPolish,
  centerUiPolishDensityValid,
  centerUiPolishDay1LimitsValid,
} from '@/features/hub/utils/centerUiPolishPolicy';
import {
  centerPresentationAccessibilityValid,
  centerPresentationNoCriticalDuplicates,
} from '@/features/hub/utils/centerStatePolicy';
import { buildEndOfDayReportViewModel } from '@/features/reports/utils/endOfDayReportPresentation';
import { buildMemoryFollowUpPresentationContext } from '@/features/shared/utils/memoryFollowUpPresentationContext';
import {
  buildMapMotionPresentation,
  countAnimatedMapMotionMarkers,
  MAP_MOTION_MAX_ANIMATED,
} from '@/features/map/utils/mapMotionPresentation';
import { gameUi } from '@/ui/theme/gameUiTokens';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

const OFF_THEME_HEX = /#[0-9A-Fa-f]{6}/g;
const ALLOWED_HEX = new Set<string>(
  Object.values(gameUi.colors).filter((value) => typeof value === 'string' && value.startsWith('#')),
);
const ALLOWED_HUB_REFERENCE_HEX = new Set<string>([
  '#050D0E',
  '#0B1919',
  '#101812',
  '#102323',
  '#132A29',
  '#163432',
  '#151A12',
  '#15211B',
  '#15221D',
  '#2F8D7E',
  '#86A9FF',
  '#8D742F',
  '#8FE1A6',
  '#93E8BD',
  '#D8B153',
  '#D9755D',
  '#E25E4E',
  '#F6F0DA',
  '#4ADE80',
  '#38BDF8',
  '#FFB800',
  '#FF6B6B',
]);

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function assert(checks: string[], pass: boolean, ok: string, fail?: string): boolean {
  checks.push(pass ? `PASS ${ok}` : `FAIL ${fail ?? ok}`);
  return pass;
}

function normalizeLine(line: string | undefined | null): string {
  return line?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function countExactDuplicates(lines: (string | undefined | null)[]): number {
  const normalized = lines.filter(Boolean).map((line) => normalizeLine(line));
  return normalized.length - new Set(normalized).size;
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
        id: `final_ui_event_${day}`,
        title: 'Rota daralması',
        district: 'Sanayi',
        neighborhoodId: 'sanayi',
        status: 'active',
      },
    ],
  };
}

function auditHubPresentation(day: number) {
  const gameState = makeStateForDay(day);
  return buildCenterHomePresentation({
    gameState,
    operationSignals: createInitialOperationSignalsState(day),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    hubDistrictReportLine: day >= 8 ? 'Mahalle güveni bugünkü kararla değişti.' : undefined,
  });
}

export type FinalUiVisualSnapshot = {
  scenario: string;
  day: number;
  cardCount: number;
  largeCardCount: number;
  compactInsightCount: number;
  duplicateTextCount: number;
  ctaCount: number;
  accessibilityMissingCount: number;
  motionMarkerCount: number;
  tokenViolations: number;
};

export function analyzeFinalUiVisualUnification(): {
  ok: boolean;
  snapshots: FinalUiVisualSnapshot[];
  lines: string[];
} {
  const lines: string[] = [];
  const snapshots: FinalUiVisualSnapshot[] = [];
  let ok = true;

  for (const [scenario, day] of [
    ['day1_hub', 1],
    ['day8_hub', 8],
    ['day10_hub_mixed', 10],
  ] as const) {
    const hub = auditHubPresentation(day);
    const context = buildMemoryFollowUpPresentationContext({ day, gameState: makeStateForDay(day) });
    const report = buildEndOfDayReportViewModel({
      report: buildDailyReport({
        day,
        metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
        decisionHistory: [],
        activeEvents: [],
        resolvedEventIds: [],
        snapshots: [],
      }),
      metrics: { publicSatisfaction: 70, staffMorale: 70, budget: 100000 },
      dailyXpReport: { day, totalXp: day > 1 ? 12 : 0, categories: [] },
      memoryFollowUpContext: context,
    });
    const mapMotion = buildMapMotionPresentation({
      day,
      day8StrategicContent: context.day8StrategicContent,
      districtNeglectRecovery: context.districtNeglectRecovery,
    });

    const hubLines = [
      hub.advisorSuggestion.recommendation,
      hub.advisorSuggestion.reason,
      ...hub.continuationCards.cards.map((card) => card.body),
      hub.portfolioSurface.summaryLine,
      hub.portfolioSurface.eceLine,
    ];
    const reportLines = [
      report.oneMoreDayCard?.line,
      report.cityMemoryNote?.line,
      report.followUpActionHint?.line,
      report.positiveComebackNote,
      report.cityRhythmNote,
    ];

    const snapshot: FinalUiVisualSnapshot = {
      scenario,
      day,
      cardCount:
        hub.continuationCards.cards.length +
        (hub.portfolioSurface.isVisible ? 1 : 0) +
        (hub.advisorSuggestion.visibility !== 'hidden' ? 1 : 0),
      largeCardCount: (hub.activeTarget.visibility !== 'hidden' ? 1 : 0) + (day >= 8 && hub.portfolioSurface.isVisible ? 1 : 0),
      compactInsightCount: hub.continuationCards.cards.length,
      duplicateTextCount: countExactDuplicates([...hubLines, ...reportLines]),
      ctaCount: [hub.activeTarget.cta, hub.portfolioSurface.ctaLabel].filter(Boolean).length,
      accessibilityMissingCount: [
        hub.activeTarget.accessibilityLabel,
        hub.advisorSuggestion.accessibilityLabel,
        hub.portfolioSurface.accessibilityLabel,
      ].filter((label) => !label?.trim()).length,
      motionMarkerCount: countAnimatedMapMotionMarkers(mapMotion.markers),
      tokenViolations: 0,
    };

    snapshots.push(snapshot);
    lines.push(
      `${scenario}: cards=${snapshot.cardCount} dupes=${snapshot.duplicateTextCount} motion=${snapshot.motionMarkerCount}`,
    );

    if (snapshot.duplicateTextCount > 0) {
      lines.push(`FAIL ${scenario} duplicate exact text`);
      ok = false;
    }
    if (snapshot.accessibilityMissingCount > 0) {
      lines.push(`FAIL ${scenario} missing accessibility label`);
      ok = false;
    }
    if (snapshot.motionMarkerCount > MAP_MOTION_MAX_ANIMATED) {
      lines.push(`FAIL ${scenario} motion marker overflow`);
      ok = false;
    }
    if (day === 1 && snapshot.cardCount > 6) {
      lines.push(`WARN ${scenario} Day 1 card density`);
    }
  }

  return { ok, snapshots, lines };
}

export function verifyFinalUiVisualUnificationScenario(): {
  ok: boolean;
  warn: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let ok = true;
  let warn = false;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, `SAVE_VERSION ${SAVE_VERSION}`));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('finalUiVisual'), 'persist shape unchanged'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('finalUiVisual'), 'applyDecision unchanged'));
  record(assert(checks, !readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts').includes('finalUiVisual'), 'day pipeline unchanged'));

  const gameplayQa = verifyGameplayLoopQaScenario();
  record(assert(checks, gameplayQa.ok, 'gameplay-loop-qa PASS'));

  const hubHome = readRepo('src/features/hub/components/HubReferenceHome.tsx');
  const hubLowerDashboard = readRepo('src/features/hub/components/CenterLowerDashboard.tsx');
  record(assert(checks, hubHome.includes('HeaderBar') && hubHome.includes('TopInfoChips'), 'Hub uses reference header/status chips'));
  record(assert(checks, hubHome.includes('MainHero') && hubHome.includes('RecentImpactCard'), 'Hub uses reference hero and impact card'));
  record(assert(checks, hubHome.includes('NextActionsRail'), 'Hub uses reference next actions rail'));
  record(assert(checks, hubHome.includes('CityPulseCard') && hubHome.includes('DistrictFocusCard'), 'Hub uses reference pulse and district cards'));
  record(assert(checks, hubHome.includes('LiveDevelopments'), 'Hub uses live developments list'));
  record(assert(checks, hubHome.includes('ProgressImpactRow') && hubHome.includes('QuickCommandsGrid'), 'Hub uses progress and command grid'));
  record(assert(checks, hubHome.includes('CenterMotionEnter') && hubHome.includes('hubMotionEnabled'), 'Hub reference motion integration'));
  record(assert(checks, hubLowerDashboard.includes('SignalStatusCard'), 'Hub lower signal status card'));
  record(assert(checks, hubLowerDashboard.includes('TaskFlowCard'), 'Hub lower task flow card'));
  record(assert(checks, hubLowerDashboard.includes('DailyBonusCard'), 'Hub lower daily bonus card'));
  record(assert(checks, hubLowerDashboard.includes('ContinueOperationCard'), 'Hub lower continuation operation cards'));
  record(assert(checks, hubLowerDashboard.includes('presentation.strategicPulse'), 'Hub lower dashboard state wired'));
  record(assert(checks, hubHome.includes('gameUi'), 'Hub uses gameUi tokens'));

  const bottomNav = readRepo('src/components/navigation/CreviaBottomTabBar.tsx');
  record(assert(checks, bottomNav.includes('routeName: "index"'), 'nav Merkez route'));
  record(assert(checks, bottomNav.includes('routeName: "events"'), 'nav Operasyon route'));
  record(assert(checks, bottomNav.includes('routeName: "risks"'), 'nav Harita route'));
  record(assert(checks, bottomNav.includes('routeName: "progression"'), 'nav Gelişim route'));
  record(assert(checks, bottomNav.includes('label: "Gelişim"'), 'nav Gelişim label'));
  record(assert(checks, bottomNav.includes('routeName: "reports"'), 'nav Raporlar route'));

  const reportView = readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx');
  record(assert(checks, reportView.includes('CompactInsightRow'), 'Report compact insight rows'));
  record(assert(checks, reportView.includes('cityRhythmNote'), 'Report city rhythm note'));
  record(assert(checks, reportView.includes('positiveComebackNote'), 'Report positive comeback note'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'src/ui/theme/gameUiTokens.ts')), 'gameUiTokens exists'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/components/game/CompactInsightRow.tsx')), 'CompactInsightRow exists'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-final-ui-visual-unification.md')), 'final UI doc exists'));

  const day1 = auditHubPresentation(1);
  record(assert(checks, centerUiPolishDay1LimitsValid(day1), 'Day 1 hub limits'));
  record(assert(checks, centerPresentationNoCriticalDuplicates(day1), 'Day 1 no critical duplicates'));
  record(assert(checks, centerPresentationAccessibilityValid(day1), 'Day 1 accessibility'));

  const day8 = auditHubPresentation(8);
  record(assert(checks, centerUiPolishDensityValid(day8), 'Day 8 hub density'));
  record(assert(checks, centerContinuationCardsRouteSafety(day8.continuationCards), 'Day 8 continuation route safety'));
  record(
    assert(
      checks,
      countExactDuplicates([
        day8.advisorSuggestion.reason,
        centerAdvisorDedupeText(day8.advisorSuggestion),
        ...day8.continuationCards.cards.map((card) => card.body),
      ]) === 0,
      'Day 8 hub duplicate guard',
    ),
  );

  const day8Audit = auditCenterUiPolish(day8, 8);
  if (!day8Audit.ok) {
    checks.push(`WARN Day 8 polish audit: ${day8Audit.issues.join(', ')}`);
    warn = true;
  } else {
    checks.push('PASS Day 8 polish audit');
  }

  const analyzer = analyzeFinalUiVisualUnification();
  record(assert(checks, analyzer.ok, 'analyzer scenarios PASS'));
  for (const line of analyzer.lines) {
    if (line.startsWith('WARN')) warn = true;
  }

  const hubPaletteMatches = (hubHome.match(OFF_THEME_HEX) ?? []).filter(
    (hex) =>
      !ALLOWED_HEX.has(hex.toUpperCase()) &&
      !ALLOWED_HEX.has(hex) &&
      !ALLOWED_HUB_REFERENCE_HEX.has(hex.toUpperCase()) &&
      !ALLOWED_HUB_REFERENCE_HEX.has(hex),
  );
  if (hubPaletteMatches.length > 0) {
    checks.push(`WARN HubReferenceHome off-theme hex: ${hubPaletteMatches.slice(0, 3).join(', ')}`);
    warn = true;
  } else {
    checks.push('PASS Hub palette uses game tokens');
  }

  return { ok, warn, checks };
}
