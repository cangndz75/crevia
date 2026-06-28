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

import {
  buildCenterHomePresentation,
  deriveHubDisclosureBand,
  hubSurfaceIsRenderable,
} from './utils/centerHomePresentation';
import {
  buildCenterHubGameFirstPresentation,
  gameFirstHasDuplicateCopy,
  gameFirstWeakCtaCount,
  HUB_DENSITY_LIMITS,
  HUB_PRIMARY_CTA_LABELS,
} from './utils/centerHubGameFirstPresentation';
import {
  compactPulseHasDuplicateCopy,
  compactPulseImpactChipCount,
  compactPulseWithinCaps,
} from './utils/centerHubPulsePresentation';
import {
  hubBandAllowsDistrictSpotlight,
  hubBandAllowsLiveDevelopments,
  hubBandAllowsStrategicPulse,
  hubSectionLayoutZone,
  resolveHubFeedItemCap,
} from './utils/centerHubDensityPolicy';
import { buildHubPrimaryCtaPresentation } from './utils/centerHubNextBestActionPresentation';

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

export function verifyCenterHubGameFirstScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION policy', `version=${SAVE_VERSION}`);

  const day1 = buildPresentation(1);
  const day1GameFirst = day1.gameFirst;

  assert(checks, day1GameFirst.densityBand === 'day1', 'day1 density band', day1GameFirst.densityBand);
  assert(checks, day1GameFirst.todayFocus.visibility === 'visible', 'day1 today focus visible');
  assert(checks, day1GameFirst.todayFocus.sectionTitle === 'Bugünün Odağı', 'today focus title');
  assert(
    checks,
    !/devam et|detay$/i.test(day1GameFirst.todayFocus.cta.label),
    'day1 today focus CTA contextual',
    day1GameFirst.todayFocus.cta.label,
  );
  assert(
    checks,
    day1GameFirst.primaryCta.intent === 'inspect_operation' ||
      day1GameFirst.primaryCta.intent === 'continue_operation',
    'day1 primary CTA intent',
    day1GameFirst.primaryCta.intent,
  );
  assert(
    checks,
    Boolean(day1GameFirst.primaryCta.label.trim()),
    'day1 primary CTA label',
    day1GameFirst.primaryCta.label,
  );
  assert(
    checks,
    day1GameFirst.primaryCta.label === day1GameFirst.todayFocus.cta.label,
    'day1 hero and primary CTA aligned',
  );
  assert(
    checks,
    day1GameFirst.nextMoves.moves.length >= 1 &&
      day1GameFirst.nextMoves.moves.length <= HUB_DENSITY_LIMITS.nextMovesDay1Max,
    'day1 next moves count',
    `${day1GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    day1GameFirst.cityPulse.items.length <= resolveHubFeedItemCap('day1'),
    'day1 city pulse feed cap',
    `${day1GameFirst.cityPulse.items.length}`,
  );
  assert(checks, day1GameFirst.districtSpotlight.visibility === 'hidden', 'day1 district spotlight hidden');
  assert(checks, !hubSurfaceIsRenderable(day1.hubDensity, 'maintenanceSignal'), 'day1 maintenance hidden');
  assert(
    checks,
    (day1GameFirst.advisor.recommendation.length || 0) <= HUB_DENSITY_LIMITS.eceRecommendationDay1MaxChars,
    'day1 ece short',
    `${day1GameFirst.advisor.recommendation.length}`,
  );
  assert(checks, !gameFirstHasDuplicateCopy(day1GameFirst), 'day1 duplicate copy guard');
  assert(checks, gameFirstWeakCtaCount(day1GameFirst) === 0, 'day1 weak CTA count', `${gameFirstWeakCtaCount(day1GameFirst)}`);
  assert(
    checks,
    day1GameFirst.quickActions.actions.length <= HUB_DENSITY_LIMITS.quickActionsMax,
    'day1 quick actions max 2',
    `${day1GameFirst.quickActions.actions.length}`,
  );
  assert(
    checks,
    compactPulseWithinCaps(day1GameFirst.firstViewportPulse, 'day1'),
    'day1 compact pulse caps',
  );
  assert(
    checks,
    !compactPulseHasDuplicateCopy(day1GameFirst.firstViewportPulse),
    'day1 compact pulse duplicate guard',
  );
  assert(
    checks,
    compactPulseImpactChipCount(day1GameFirst.firstViewportPulse) <= HUB_DENSITY_LIMITS.impactChipsDay1Max,
    'day1 impact chips capped',
    `${compactPulseImpactChipCount(day1GameFirst.firstViewportPulse)}`,
  );
  assert(
    checks,
    !day1GameFirst.firstViewportPulse.advisor.reasonChip ||
      day1GameFirst.firstViewportPulse.advisor.reasonChip.length <= 32,
    'day1 ece reason chip bounded',
  );
  assert(checks, !hubBandAllowsStrategicPulse('day1'), 'day1 strategic pulse band gate');
  assert(checks, !hubBandAllowsDistrictSpotlight('day1'), 'day1 district spotlight band gate');
  assert(checks, !hubBandAllowsLiveDevelopments('day1'), 'day1 live developments band gate');

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

  assert(checks, deriveHubDisclosureBand(8) === 'openEnded', 'day8 band', day8GameFirst.densityBand);
  assert(
    checks,
    day8GameFirst.nextMoves.moves.length >= 2 &&
      day8GameFirst.nextMoves.moves.length <= HUB_DENSITY_LIMITS.nextMovesMax,
    'day8 next moves bounded',
    `${day8GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    day8GameFirst.cityPulse.items.length <= resolveHubFeedItemCap('openEnded'),
    'day8 city pulse feed cap',
    `${day8GameFirst.cityPulse.items.length}`,
  );
  assert(checks, day8GameFirst.districtSpotlight.visibility === 'visible', 'day8 district spotlight visible');
  const day8StrategicSignals = [
    day8GameFirst.districtSpotlight.dominantIssue,
    day8GameFirst.activeOperationFocus.riskLabel,
    day8.hubDensity.maintenanceSignal?.title,
    day8GameFirst.cityPulse.items.map((item) => item.message).join(' '),
  ].some((line) => /güven|bakım|mahalle|kaynak|risk|baskı|baski/i.test(line ?? ''));
  assert(checks, day8StrategicSignals, 'day8 strategic signals surface');
  assert(checks, day8GameFirst.activeOperationFocus.visibility === 'visible', 'day8 active operation focus visible', day8GameFirst.activeOperationFocus.mode);
  assert(checks, Boolean(day8GameFirst.activeOperationFocus.cta.label?.trim()), 'day8 operation focus CTA non-empty');
  assert(
    checks,
    day8GameFirst.primaryCta.label === day8GameFirst.todayFocus.cta.label,
    'day8 hero and primary CTA aligned',
  );
  assert(
    checks,
    day8GameFirst.quickActions.actions.length <= HUB_DENSITY_LIMITS.quickActionsMax,
    'day8 quick actions max 2',
    `${day8GameFirst.quickActions.actions.length}`,
  );
  assert(checks, compactPulseWithinCaps(day8GameFirst.firstViewportPulse, 'openEnded'), 'day8 compact pulse caps');
  assert(checks, hubBandAllowsStrategicPulse('openEnded'), 'day8 strategic pulse band allowed');
  assert(checks, hubBandAllowsLiveDevelopments('openEnded'), 'day8 live developments band allowed');

  const deterministicA = buildCenterHubGameFirstPresentation(day8);
  const deterministicB = buildCenterHubGameFirstPresentation(day8);
  assert(checks, JSON.stringify(deterministicA) === JSON.stringify(deterministicB), 'presentation builder deterministic');

  const primaryCtaDeterministicA = buildHubPrimaryCtaPresentation(day8);
  const primaryCtaDeterministicB = buildHubPrimaryCtaPresentation(day8);
  assert(
    checks,
    JSON.stringify(primaryCtaDeterministicA) === JSON.stringify(primaryCtaDeterministicB),
    'primary CTA builder deterministic',
  );

  const pulseTypes = day8GameFirst.cityPulse.items.map((item) => item.type);
  assert(checks, new Set(pulseTypes).size === pulseTypes.length, 'city pulse unique item types', pulseTypes.join(','));

  const titleSet = new Set(
    [
      day8GameFirst.todayFocus.goalSentence,
      day8GameFirst.activeOperationFocus.operationName,
      ...day8GameFirst.nextMoves.moves.map((move) => move.title),
    ].map((line) => normalizeLine(line)),
  );
  assert(checks, titleSet.size >= 2, 'primary module titles distinct enough', `${titleSet.size}`);

  assert(
    checks,
    Object.values(HUB_PRIMARY_CTA_LABELS).every((label) => label.trim().length > 0),
    'primary CTA label map complete',
  );
  assert(
    checks,
    !Object.values(HUB_PRIMARY_CTA_LABELS).some((label) => /^(devam et|detay)$/i.test(label)),
    'primary CTA labels not weak',
  );

  assert(checks, hubSectionLayoutZone('todayFocusHero') === 'firstViewport', 'hero in first viewport zone');
  assert(checks, hubSectionLayoutZone('compactPulseAdvisor') === 'firstViewport', 'compact pulse in first viewport');
  assert(checks, hubSectionLayoutZone('nextMoves') === 'scrollDepth', 'next moves in scroll depth');
  assert(checks, hubSectionLayoutZone('miniCityFeed') === 'scrollDepth', 'mini feed in scroll depth');
  assert(checks, hubSectionLayoutZone('quickActions') === 'scrollDepth', 'quick actions in scroll depth');

  const hubSource = readHubReferenceHomeSource();
  assert(checks, hubSource.includes('HubCompactPulseAdvisorStrip'), 'UI compact pulse strip wired');
  assert(checks, hubSource.includes('scrollDepthZone'), 'UI scroll depth zone wired');
  assert(checks, hubSource.includes('MainHero') && hubSource.includes('ActiveOperationFocusCard'), 'UI hero and active op wired');
  assert(checks, hubSource.includes('quickActionChipRow') && hubSource.includes('NextActionsRail'), 'UI compact quick actions and next moves wired');
  assert(checks, hubSource.includes('gameFirst.firstViewportPulse'), 'UI reads first viewport pulse bundle');
  assert(checks, hubSource.includes('densityLayout'), 'UI reads density layout');

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}

/** @deprecated use verifyCenterHubGameFirstScenario */
export function verifyCenterHubGameFirstDensityScenario(): ReturnType<typeof verifyCenterHubGameFirstScenario> {
  return verifyCenterHubGameFirstScenario();
}
