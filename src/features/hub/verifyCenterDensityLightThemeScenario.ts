import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import {
  createEmptyMaintenanceBacklogRuntimeState,
  updateMaintenanceBacklogForDay,
} from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import { buildCenterHomePresentation } from './utils/centerHomePresentation';
import {
  HUB_DENSITY_LIMITS,
  HUB_LIGHT_PREMIUM_THEME,
  hubSectionIsHidden,
  resolveHubCityPulseSignalCap,
  resolveHubNextMovesCap,
  resolveHubQuickActionsCap,
} from './utils/centerHubDensityPolicy';
import {
  buildCenterHubGameFirstPresentation,
  gameFirstHasDuplicateCopy,
} from './utils/centerHubGameFirstPresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function buildPresentation(day: number, maintenanceBacklogRuntime?: ReturnType<typeof createEmptyMaintenanceBacklogRuntimeState>) {
  const base = createDay1Seed().gameState;
  const gameState = {
    ...base,
    city: { ...base.city, day },
    pilot: { ...base.pilot, currentPilotDay: day },
  };
  return buildCenterHomePresentation({
    gameState,
    operationSignals: createInitialOperationSignalsState(day),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(day),
    maintenanceBacklogRuntime,
  });
}

function readHubReferenceHomeSource(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    const path = require('node:path');
    return fs.readFileSync(
      path.join(process.cwd(), 'src/features/hub/components/HubReferenceHome.tsx'),
      'utf8',
    );
  } catch {
    return '';
  }
}

function readHubScreenSource(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs');
    const path = require('node:path');
    return fs.readFileSync(
      path.join(process.cwd(), 'src/features/hub/screens/HubScreen.tsx'),
      'utf8',
    );
  } catch {
    return '';
  }
}

function countCityPulseModulesInSource(source: string): number {
  const markers = ['HubCompactPulseAdvisorStrip', 'MiniCityFeedSection', 'CityPulseCard'];
  return markers.filter((marker) => source.includes(`<${marker}`)).length;
}

export function verifyCenterDensityLightThemeScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION policy', `version=${SAVE_VERSION}`);

  const day1 = buildPresentation(1);
  const day1GameFirst = day1.gameFirst;

  assert(checks, day1GameFirst.themeTone === 'lightPremium', 'themeTone lightPremium', day1GameFirst.themeTone);
  assert(
    checks,
    day1GameFirst.densityLayout.firstViewportPrimaryCtaCount === HUB_DENSITY_LIMITS.firstViewportPrimaryCtaMax,
    'single primary CTA policy',
    `${day1GameFirst.densityLayout.firstViewportPrimaryCtaCount}`,
  );
  assert(
    checks,
    day1GameFirst.densityLayout.duplicateCityPulseSuppressed,
    'day1 duplicate city pulse suppressed',
  );
  assert(
    checks,
    hubSectionIsHidden(day1GameFirst.densityLayout.hiddenSections, 'miniCityFeed'),
    'day1 scroll mini feed hidden when compact pulse visible',
  );
  assert(
    checks,
    hubSectionIsHidden(day1GameFirst.densityLayout.hiddenSections, 'strategicPulse'),
    'day1 strategic pulse hidden',
  );
  assert(
    checks,
    day1GameFirst.cityPulse.items.length <= resolveHubCityPulseSignalCap('day1'),
    'day1 city pulse signal cap',
    `${day1GameFirst.cityPulse.items.length}`,
  );
  assert(
    checks,
    day1GameFirst.firstViewportPulse.pulse.signals.length <= resolveHubCityPulseSignalCap('day1'),
    'day1 compact pulse signals cap',
    `${day1GameFirst.firstViewportPulse.pulse.signals.length}`,
  );
  assert(
    checks,
    day1GameFirst.quickActions.actions.length <= resolveHubQuickActionsCap('day1'),
    'day1 quick actions max 2',
    `${day1GameFirst.quickActions.actions.length}`,
  );
  assert(
    checks,
    day1GameFirst.nextMoves.moves.length <= resolveHubNextMovesCap('day1'),
    'day1 next moves cap',
    `${day1GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    (day1GameFirst.advisor.recommendation.length || 0) <= HUB_DENSITY_LIMITS.eceRecommendationDay1MaxChars,
    'day1 ece compact chars',
    `${day1GameFirst.advisor.recommendation.length}`,
  );
  assert(checks, !gameFirstHasDuplicateCopy(day1GameFirst), 'day1 duplicate copy guard');
  assert(
    checks,
    day1GameFirst.progression.visibility === 'hidden' || day1GameFirst.progression.sectionTitle === 'Yaklaşan Açılım',
    'day1 progression compact title',
  );

  const day8Maintenance = (() => {
    let runtime = createEmptyMaintenanceBacklogRuntimeState();
    for (const day of [4, 5, 6, 7, 8]) {
      runtime = updateMaintenanceBacklogForDay(runtime, {
        day,
        staffMorale: 48,
        budget: 62000,
        publicSatisfaction: 52,
        warningsCount: 2,
        operationSignals: {
          personnel: { status: 'strained' },
          vehicles: { status: 'watch' },
        },
      });
    }
    return runtime;
  })();

  const day8 = buildPresentation(8, day8Maintenance);
  const day8GameFirst = day8.gameFirst;

  assert(checks, day8GameFirst.themeTone === 'lightPremium', 'day8 themeTone lightPremium');
  assert(
    checks,
    day8GameFirst.cityPulse.items.length <= resolveHubCityPulseSignalCap('openEnded'),
    'day8 city pulse max 2 signals',
    `${day8GameFirst.cityPulse.items.length}`,
  );
  assert(
    checks,
    day8GameFirst.firstViewportPulse.pulse.signals.length <= HUB_DENSITY_LIMITS.cityPulseSignalsMax,
    'day8 compact pulse max 2 signals',
    `${day8GameFirst.firstViewportPulse.pulse.signals.length}`,
  );
  assert(
    checks,
    day8GameFirst.nextMoves.moves.length <= HUB_DENSITY_LIMITS.nextMovesMax,
    'day8 next moves max 2',
    `${day8GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    day8GameFirst.quickActions.actions.length <= HUB_DENSITY_LIMITS.quickActionsMax,
    'day8 quick actions max 2',
    `${day8GameFirst.quickActions.actions.length}`,
  );
  assert(
    checks,
    day8GameFirst.densityLayout.duplicateCityPulseSuppressed,
    'day8 duplicate city pulse suppressed',
  );

  const mergedOrHiddenActiveOp =
    day8GameFirst.densityLayout.mergedPrimaryFocus ||
    day8GameFirst.activeOperationFocus.visibility === 'hidden' ||
    hubSectionIsHidden(day8GameFirst.densityLayout.hiddenSections, 'activeOperationFocus');
  const duplicateHeroCards =
    day8GameFirst.todayFocus.visibility === 'visible' &&
    day8GameFirst.activeOperationFocus.visibility === 'visible' &&
    day8GameFirst.densityLayout.mergedPrimaryFocus === false &&
    normalizeLine(day8GameFirst.todayFocus.goalSentence) ===
      normalizeLine(day8GameFirst.activeOperationFocus.operationName);
  assert(
    checks,
    mergedOrHiddenActiveOp || !duplicateHeroCards,
    'day8 today focus and active op not duplicate large cards',
  );

  const deterministicA = buildCenterHubGameFirstPresentation(day8);
  const deterministicB = buildCenterHubGameFirstPresentation(day8);
  assert(checks, JSON.stringify(deterministicA) === JSON.stringify(deterministicB), 'presentation deterministic');

  const hubSource = readHubReferenceHomeSource();
  const hubScreenSource = readHubScreenSource();

  assert(
    checks,
    hubSource.includes('backgroundCream') || hubSource.includes(HUB_LIGHT_PREMIUM_THEME.appBackground),
    'UI warm game background token',
  );
  assert(checks, hubSource.includes("StatusBar style=\"dark\""), 'UI dark status bar on light surface');
  assert(checks, hubSource.includes('densityLayout.duplicateCityPulseSuppressed'), 'UI city pulse dedupe wired');
  assert(checks, hubSource.includes('densityLayout.mergedPrimaryFocus'), 'UI merged hero wired');
  assert(checks, hubSource.includes('quickActionChipRow'), 'UI compact quick actions wired');
  assert(checks, !hubSource.includes('Canlı Bonus'), 'Canlı Bonus chip removed from player hub');
  assert(checks, countCityPulseModulesInSource(hubSource) >= 1, 'city pulse module present');
  assert(
    checks,
    hubScreenSource.includes('__DEV__') && hubScreenSource.includes('HubDevTools'),
    'dev tools gated behind __DEV__',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
