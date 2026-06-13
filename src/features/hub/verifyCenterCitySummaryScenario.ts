import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialHubQuickActionState } from '@/core/hubQuickActions/hubQuickActionSeed';
import { createInitialOperationSignalsState } from '@/core/operations/operationSignalState';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';

import {
  CENTER_HEADER_MAX_RESOURCE_CHIPS,
  centerHeaderChipCountWithinLimit,
} from './utils/centerHeaderPresentation';
import {
  CENTER_CITY_SUMMARY_MAX_METRICS,
  buildCenterCitySummary,
  centerCityInsightNotDuplicateAdvisor,
  centerCitySummaryMetricCountValid,
  centerCitySummaryMetricIdsAreUnique,
  centerCitySummaryProgressClamped,
  centerCitySummaryValuesValid,
} from './utils/centerCitySummaryPresentation';
import { buildCenterHomePresentation } from './utils/centerHomePresentation';

type Check = { name: string; ok: boolean; detail: string };

function assert(checks: Check[], ok: boolean, name: string, detail = ''): void {
  checks.push({ name, ok, detail: ok ? detail || 'ok' : detail || 'fail' });
}

export function verifyCenterCitySummaryScenario(): {
  ok: boolean;
  failCount: number;
  checks: string[];
} {
  const checks: Check[] = [];
  const day1State = createDay1Seed().gameState;

  const day1Summary = buildCenterCitySummary({
    gameState: day1State,
    day: 1,
    socialPulseState: createInitialSocialPulseState(),
    operationSignals: createInitialOperationSignalsState(1),
  });

  assert(checks, Boolean(day1Summary.title.trim()), 'Day 1 summary has title');
  assert(
    checks,
    day1Summary.metrics.length === CENTER_CITY_SUMMARY_MAX_METRICS,
    'Day 1 has 3 metrics',
    `count=${day1Summary.metrics.length}`,
  );
  assert(checks, centerCitySummaryMetricIdsAreUnique(day1Summary), 'Day 1 metric ids unique');
  assert(checks, centerCitySummaryValuesValid(day1Summary), 'Day 1 metric values valid');
  assert(
    checks,
    day1Summary.metrics[0]?.valueText === 'Başlangıç',
    'Day 1 reputation fallback',
  );
  assert(
    checks,
    day1Summary.metrics[1]?.valueText === 'Dengeli',
    'Day 1 happiness fallback',
  );
  assert(
    checks,
    day1Summary.metrics[2]?.valueText === 'Hazır',
    'Day 1 operation fallback',
  );
  assert(checks, centerCitySummaryProgressClamped(day1Summary), 'Day 1 progress clamped');

  const noSocialSummary = buildCenterCitySummary({
    gameState: { ...day1State, city: { ...day1State.city, day: 2 } },
    day: 2,
    operationSignals: createInitialOperationSignalsState(2),
  });
  assert(
    checks,
    noSocialSummary.metrics[1]?.valueText !== '%NaN',
    'no social pulse avoids NaN happiness',
  );
  assert(
    checks,
    noSocialSummary.metrics[1]?.isEstimated === true,
    'no social pulse marks estimated happiness',
  );

  const highRiskSignals = createInitialOperationSignalsState(3);
  const strainedSummary = buildCenterCitySummary({
    gameState: {
      ...day1State,
      city: { ...day1State.city, day: 3 },
      events: [],
    },
    day: 3,
    socialPulseState: createInitialSocialPulseState(),
    operationSignals: {
      ...highRiskSignals,
      overall: {
        ...highRiskSignals.overall,
        status: 'critical',
        summary: 'Kritik operasyon baskısı',
      },
    },
    hubTomorrowRisk: {
      id: 'risk',
      kind: 'generic_city_preparation',
      title: 'Risk',
      mainLine: 'Yüksek baskı',
      tone: 'watch',
      priority: 'high',
      sourceSignals: ['fallback'],
      shouldShowInReport: true,
      shouldShowInHub: true,
      shouldShowAsCompact: false,
      maxVisibleLines: 2,
    },
  });
  assert(
    checks,
    strainedSummary.metrics[2]?.tone === 'urgent' || strainedSummary.metrics[2]?.tone === 'warning',
    'high risk third metric warning/urgent',
    `tone=${strainedSummary.metrics[2]?.tone}`,
  );

  const calmSummary = buildCenterCitySummary({
    gameState: {
      ...day1State,
      city: { ...day1State.city, day: 4 },
      events: [],
    },
    day: 4,
    socialPulseState: createInitialSocialPulseState(),
    operationSignals: createInitialOperationSignalsState(4),
  });
  assert(
    checks,
    calmSummary.metrics[2]?.valueText === 'Sakin' || calmSummary.metrics[2]?.valueText === 'Hazır',
    'no active operation calm fallback',
    `value=${calmSummary.metrics[2]?.valueText}`,
  );

  const presentation = buildCenterHomePresentation({
    gameState: day1State,
    operationSignals: createInitialOperationSignalsState(1),
    socialPulseState: createInitialSocialPulseState(),
    hubQuickActionState: createInitialHubQuickActionState(1),
    hubEceContextLine: 'Ece: bugün ulaşımı güçlendir.',
  });

  assert(
    checks,
    centerCitySummaryMetricCountValid(presentation.citySummary),
    'presentation city summary metric count valid',
  );
  assert(
    checks,
    centerCityInsightNotDuplicateAdvisor(
      presentation.citySummary,
      presentation.advisorSuggestion.recommendation,
    ),
    'insight not duplicate of Ece',
  );
  assert(
    checks,
    centerHeaderChipCountWithinLimit(presentation.headerSummary),
    'header chip count still within max',
    `max=${CENTER_HEADER_MAX_RESOURCE_CHIPS}`,
  );

  const failCount = checks.filter((c) => !c.ok).length;
  return {
    ok: failCount === 0,
    failCount,
    checks: checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name}${c.detail ? ` — ${c.detail}` : ''}`),
  };
}
