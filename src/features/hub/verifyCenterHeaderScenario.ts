import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  CENTER_HEADER_MAX_RESOURCE_CHIPS,
  buildCenterHeaderSummary,
  centerHeaderChipCountWithinLimit,
  centerHeaderHasValidResourceValues,
  centerHeaderResourceChipIdsAreUnique,
} from './utils/centerHeaderPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterHeaderScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  const day1Header = buildCenterHeaderSummary({
    gameState: day1State,
    day: 1,
    socialPulseState: createInitialSocialPulseState(),
    operationSignals: createInitialOperationSignalsState(1),
    dailyRewardVisible: true,
    dailyRewardClaimedToday: false,
    economySource: 12000,
    playerLevel: 3,
    selectedDistrictName: 'Pilot Bölge',
  });

  assert(checks, Boolean(day1Header.title.trim()), 'Day 1 header has title');
  assert(checks, Boolean(day1Header.subtitle.trim()), 'Day 1 header has subtitle');
  assert(
    checks,
    centerHeaderChipCountWithinLimit(day1Header),
    'Day 1 chip count within max',
    `count=${day1Header.resourceChips.length}`,
  );
  assert(
    checks,
    day1Header.resourceChips.length <= CENTER_HEADER_MAX_RESOURCE_CHIPS,
    'Day 1 max 3 chips',
  );
  assert(
    checks,
    centerHeaderResourceChipIdsAreUnique(day1Header),
    'Day 1 chip ids unique',
  );
  assert(
    checks,
    centerHeaderHasValidResourceValues(day1Header),
    'Day 1 chip values valid',
  );
  assert(checks, Boolean(day1Header.notification?.id), 'Day 1 has single notification');
  assert(
    checks,
    day1Header.displayCityName.length > 0,
    'Day 1 display city name safe',
  );

  const longCityState = {
    ...day1State,
    city: {
      ...day1State.city,
      name: 'Çok Uzun Bir Şehir Adı İçin Test Merkezi',
    },
  };
  const longCityHeader = buildCenterHeaderSummary({
    gameState: longCityState,
    day: 2,
    socialPulseState: createInitialSocialPulseState(),
    operationSignals: createInitialOperationSignalsState(2),
    economySource: 50000,
    playerLevel: 4,
  });
  assert(
    checks,
    longCityHeader.displayCityName.endsWith('…'),
    'long city name truncated for display',
  );

  const day3Presentation = buildCenterHomePresentation({
    gameState: {
      ...day1State,
      city: { ...day1State.city, day: 3 },
      pilot: { ...day1State.pilot, currentPilotDay: 3 },
    },
    operationSignals: createInitialOperationSignalsState(3),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(3),
    economySource: 84000,
    budgetDeltaLabel: '+2K Kaynak',
    playerLevel: 5,
    selectedDistrictName: 'Kadıköy',
    hubTomorrowRisk: {
      id: 'risk',
      kind: 'generic_city_preparation',
      title: 'Risk',
      mainLine: 'Test',
      tone: 'watch',
      priority: 'high',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
  });

  const header = day3Presentation.headerSummary;
  assert(
    checks,
    header.resourceChips.length <= CENTER_HEADER_MAX_RESOURCE_CHIPS,
    'presentation header max chips',
  );
  assert(
    checks,
    centerHeaderResourceChipIdsAreUnique(header),
    'presentation header chip ids unique',
  );
  assert(
    checks,
    header.notification.tone === 'urgent',
    'high risk notification prioritized',
  );

  const reputationInSummary =
    day3Presentation.citySummary.metrics.find((metric) => metric.id === 'reputation')
      ?.valueText ?? '';
  const headerShowsFullReputation = header.resourceChips.some(
    (chip) => chip.valueText === reputationInSummary,
  );
  assert(
    checks,
    !headerShowsFullReputation,
    'header does not repeat city summary reputation value',
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
