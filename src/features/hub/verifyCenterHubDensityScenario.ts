import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { updateMaintenanceBacklogForDay, createEmptyMaintenanceBacklogRuntimeState } from '@/core/maintenanceBacklog/maintenanceBacklogRuntimeModel';
import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import {
  buildCenterHomePresentation,
  countHubPrimarySections,
  deriveHubDisclosureBand,
  hubSurfaceIsRenderable,
} from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

function normalizeLine(value: string | null | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function linesOverlap(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = normalizeLine(a);
  const right = normalizeLine(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

export function verifyCenterHubDensityScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];

  assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION policy', `version=${SAVE_VERSION}`);

  const day1State = createDay1Seed().gameState;
  const day1 = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
  });

  assert(checks, deriveHubDisclosureBand(1) === 'day1', 'day1 band', day1.hubDensity.band);
  assert(
    checks,
    countHubPrimarySections(day1.hubDensity) <= day1.hubDensity.maxPrimarySections,
    'day1 primary section cap',
    `count=${countHubPrimarySections(day1.hubDensity)} max=${day1.hubDensity.maxPrimarySections}`,
  );
  assert(
    checks,
    !hubSurfaceIsRenderable(day1.hubDensity, 'maintenanceSignal'),
    'day1 maintenance hidden',
  );
  assert(
    checks,
    !hubSurfaceIsRenderable(day1.hubDensity, 'playerStyleInsight'),
    'day1 player style hidden',
  );
  assert(
    checks,
    !hubSurfaceIsRenderable(day1.hubDensity, 'strategicPulse'),
    'day1 strategic pulse hidden',
  );
  assert(
    checks,
    day1.miniCityFeed.items.length <= day1.hubDensity.maxFeedItems,
    'day1 feed item cap',
    `items=${day1.miniCityFeed.items.length}`,
  );
  assert(
    checks,
    day1.hubDensity.surfaceByKey.activeOperation.priority >= 95,
    'active operation top priority',
    `${day1.hubDensity.surfaceByKey.activeOperation.priority}`,
  );

  const day3State = {
    ...day1State,
    city: { ...day1State.city, day: 3 },
    pilot: { ...day1State.pilot, currentPilotDay: 3 },
  };
  const day3 = buildCenterHomePresentation({
    gameState: day3State,
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    hubTomorrowRisk: {
      id: 'test-risk',
      kind: 'generic_city_preparation',
      title: 'Yükselen Talep',
      mainLine: 'Mahallede hizmet talebi artıyor.',
      tone: 'watch',
      priority: 'medium',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
  });

  assert(checks, deriveHubDisclosureBand(3) === 'early', 'early band day3', day3.hubDensity.band);
  assert(
    checks,
    hubSurfaceIsRenderable(day3.hubDensity, 'cityAgenda'),
    'day3 city agenda can render',
  );
  assert(
    checks,
    day3.miniCityFeed.items.length <= 2,
    'day3 feed max 2 items',
    `items=${day3.miniCityFeed.items.length}`,
  );

  let maintenanceRuntime = createEmptyMaintenanceBacklogRuntimeState();
  maintenanceRuntime = updateMaintenanceBacklogForDay(maintenanceRuntime, {
    day: 4,
    staffMorale: 48,
    budget: 62000,
    publicSatisfaction: 52,
    warningsCount: 2,
    operationSignals: {
      personnel: { status: 'strained' },
      vehicles: { status: 'watch' },
    },
  });
  maintenanceRuntime = updateMaintenanceBacklogForDay(maintenanceRuntime, {
    day: 5,
    staffMorale: 46,
    budget: 60000,
    publicSatisfaction: 50,
    warningsCount: 2,
    operationSignals: {
      personnel: { status: 'strained' },
      vehicles: { status: 'watch' },
    },
  });

  const day5State = {
    ...day1State,
    city: { ...day1State.city, day: 5 },
    pilot: { ...day1State.pilot, currentPilotDay: 5 },
  };
  const day5 = buildCenterHomePresentation({
    gameState: day5State,
    operationSignals: createInitialOperationSignalsState(5),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(5),
    maintenanceBacklogRuntime: maintenanceRuntime,
  });

  assert(checks, deriveHubDisclosureBand(5) === 'mid', 'mid band day5', day5.hubDensity.band);
  assert(
    checks,
    maintenanceRuntime.items.length > 0
      ? hubSurfaceIsRenderable(day5.hubDensity, 'maintenanceSignal') ||
          day5.hubDensity.suppressFeedMaintenanceItem
      : true,
    'day5 maintenance signal or feed dedupe when runtime active',
    `runtimeItems=${maintenanceRuntime.items.length}`,
  );

  const day8State = {
    ...day1State,
    city: { ...day1State.city, day: 8 },
    pilot: { ...day1State.pilot, currentPilotDay: 8 },
  };
  const day8 = buildCenterHomePresentation({
    gameState: day8State,
    operationSignals: createInitialOperationSignalsState(8),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(8),
    maintenanceBacklogRuntime: maintenanceRuntime,
  });

  assert(checks, deriveHubDisclosureBand(8) === 'openEnded', 'openEnded band day8', day8.hubDensity.band);
  assert(
    checks,
    hubSurfaceIsRenderable(day8.hubDensity, 'strategicPulse'),
    'day8 strategic pulse can open',
  );
  assert(
    checks,
    hubSurfaceIsRenderable(day8.hubDensity, 'lowerDashboard'),
    'day8 lower dashboard can open',
  );

  const maintenanceTitle = day5.hubDensity.maintenanceSignal?.title;
  const feedHasMaintenanceDup = day5.miniCityFeed.items.some((item) =>
    linesOverlap(item.title, maintenanceTitle),
  );
  assert(
    checks,
    !feedHasMaintenanceDup || day5.hubDensity.suppressFeedMaintenanceItem,
    'maintenance feed duplicate suppressed',
  );

  const failCount = checks.filter((check) => !check.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((check) => `${check.ok ? 'PASS' : 'FAIL'} ${check.name}${check.detail ? ` — ${check.detail}` : ''}`),
  };
}
