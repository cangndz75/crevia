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

export function verifyCenterHubGameFirstDensityScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION policy', `version=${SAVE_VERSION}`);

  const day1 = buildPresentation(1);
  const day1GameFirst = day1.gameFirst;

  assert(checks, day1GameFirst.densityBand === 'day1', 'day1 density band', day1GameFirst.densityBand);
  assert(
    checks,
    day1GameFirst.todayFocus.visibility === 'visible',
    'day1 today focus visible',
  );
  assert(
    checks,
    day1GameFirst.todayFocus.sectionTitle === 'Bugünün Odağı',
    'today focus title',
  );
  assert(
    checks,
    !/devam et|detay$/i.test(day1GameFirst.todayFocus.cta.label),
    'day1 today focus CTA contextual',
    day1GameFirst.todayFocus.cta.label,
  );
  assert(
    checks,
    day1GameFirst.nextMoves.moves.length >= 1 && day1GameFirst.nextMoves.moves.length <= 3,
    'day1 next moves count',
    `${day1GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    day1GameFirst.cityPulse.items.length <= 2,
    'day1 city pulse max 2',
    `${day1GameFirst.cityPulse.items.length}`,
  );
  assert(
    checks,
    day1GameFirst.districtSpotlight.visibility === 'hidden',
    'day1 district spotlight hidden',
  );
  assert(
    checks,
    !hubSurfaceIsRenderable(day1.hubDensity, 'maintenanceSignal'),
    'day1 maintenance hidden in density',
  );
  assert(
    checks,
    (day1GameFirst.advisor.recommendation.length || 0) <= 88,
    'day1 ece short',
    `${day1GameFirst.advisor.recommendation.length}`,
  );
  assert(
    checks,
    !gameFirstHasDuplicateCopy(day1GameFirst),
    'day1 duplicate copy guard',
  );
  assert(
    checks,
    gameFirstWeakCtaCount(day1GameFirst) === 0,
    'day1 weak CTA count',
    `${gameFirstWeakCtaCount(day1GameFirst)}`,
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

  assert(checks, deriveHubDisclosureBand(8) === 'openEnded', 'day8 band', day8GameFirst.densityBand);
  assert(
    checks,
    day8GameFirst.nextMoves.moves.length >= 2 && day8GameFirst.nextMoves.moves.length <= 3,
    'day8 next moves 2-3',
    `${day8GameFirst.nextMoves.moves.length}`,
  );
  assert(
    checks,
    day8GameFirst.cityPulse.items.length <= 4,
    'day8 city pulse max 4',
    `${day8GameFirst.cityPulse.items.length}`,
  );
  assert(
    checks,
    day8GameFirst.districtSpotlight.visibility === 'visible',
    'day8 district spotlight visible',
  );
  const day8StrategicSignals = [
    day8GameFirst.districtSpotlight.dominantIssue,
    day8GameFirst.activeOperationFocus.riskLabel,
    day8.hubDensity.maintenanceSignal?.title,
    day8GameFirst.cityPulse.items.map((item) => item.message).join(' '),
  ].some((line) => /güven|bakım|mahalle|kaynak|risk|baskı|baski/i.test(line ?? ''));
  assert(checks, day8StrategicSignals, 'day8 strategic signals surface');

  assert(
    checks,
    day8GameFirst.activeOperationFocus.visibility === 'visible',
    'day8 active operation focus or fallback visible',
    day8GameFirst.activeOperationFocus.mode,
  );
  assert(
    checks,
    Boolean(day8GameFirst.activeOperationFocus.cta.label?.trim()),
    'day8 operation focus CTA non-empty',
  );

  const deterministicA = buildCenterHubGameFirstPresentation(day8);
  const deterministicB = buildCenterHubGameFirstPresentation(day8);
  assert(
    checks,
    JSON.stringify(deterministicA) === JSON.stringify(deterministicB),
    'presentation builder deterministic',
  );

  const pulseTypes = day8GameFirst.cityPulse.items.map((item) => item.type);
  assert(
    checks,
    new Set(pulseTypes).size === pulseTypes.length,
    'city pulse unique item types',
    pulseTypes.join(','),
  );

  const titleSet = new Set(
    [
      day8GameFirst.todayFocus.goalSentence,
      day8GameFirst.activeOperationFocus.operationName,
      ...day8GameFirst.nextMoves.moves.map((move) => move.title),
    ].map((line) => normalizeLine(line)),
  );
  assert(
    checks,
    titleSet.size >= 2,
    'primary module titles distinct enough',
    `${titleSet.size}`,
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
