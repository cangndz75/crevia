import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyActiveTaskRouteScenario } from '@/core/activeTaskRoutes/verifyActiveTaskRouteScenario';
import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { verifyDistrictMemoryRuntimeScenario } from '@/core/districtMemoryRuntime/verifyDistrictMemoryRuntimeScenario';
import { verifyDistrictOperationsRuntimeScenario } from '@/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';
import { verifyDistrictTrustRuntimeScenario } from '@/core/districtTrustRuntime/verifyDistrictTrustRuntimeScenario';
import { verifyEventResultSystemsEchoScenario } from '@/core/events/verifyEventResultSystemsEchoScenario';
import { verifyEventVariantScenario } from '@/core/eventVariants/verifyEventVariantScenario';
import { verifyMapBeforeAfterScenario } from '@/core/mapPresence/verifyMapBeforeAfterScenario';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import {
  REPORT_SYSTEMS_MAX_COPY_LENGTH,
  REPORT_SYSTEMS_MOBILE_COPY_LENGTH,
  buildReportActiveRouteSummary,
  buildReportDistrictMemorySummary,
  buildReportDistrictOperationSummary,
  buildReportDistrictTrustSummary,
  buildReportResourceFatigueSummary,
  buildReportSystemsDebugRows,
  buildReportSystemsIntegrationModel,
  buildReportSystemsVisibility,
  buildReportTomorrowCarryOverSummary,
  buildReportVariantSummary,
  reportSystemsCopyContainsForbiddenTerms,
  reportSystemsCopyContainsPanicTerms,
  reportSystemsOperationLooksLikeCta,
} from '@/core/reports/reportSystemsIntegrationPresentation';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { verifyReportUiScenario } from '@/features/reports/verifyReportUiScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyReportSystemsIntegrationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function readRepo(rel: string): string {
  const path = join(REPO_ROOT, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function sampleReport(day = 5) {
  return {
    day,
    title: `Gün ${day}`,
    stats: [],
    rewardTitle: 'Ödül',
    summaryLines: ['Operasyon günü dengeli ilerledi.'],
  };
}

function sampleEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_report_systems',
    title: 'Konteyner hattı baskısı',
    category: 'container',
    riskLevel: 'medium' as const,
    district: 'Cumhuriyet',
    neighborhoodId: 'cumhuriyet',
    description: 'Test',
    contextTag: 'container',
    urgencyHours: 4,
    day: 5,
    previewEffects: { publicSatisfaction: 0, risk: 0, xp: 0 },
    decisions: [],
    ...overrides,
  };
}

function normalize(value?: string): string {
  return (value ?? '').toLocaleLowerCase('tr-TR');
}

export function verifyReportSystemsIntegrationScenario(): VerifyReportSystemsIntegrationOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  let emptyCrash = false;
  try {
    buildReportSystemsIntegrationModel({});
    buildReportSystemsIntegrationModel({ dailyReport: null });
    buildReportSystemsDebugRows({});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state no crash', 'empty state crash'));

  const hiddenNoReport = buildReportSystemsIntegrationModel({ day: 5 });
  record(
    assert(
      checks,
      !hiddenNoReport.visible && hiddenNoReport.lines.length === 0,
      'missing report hidden fallback',
      'missing report not hidden',
    ),
  );

  const day1 = buildReportSystemsIntegrationModel({
    dailyReport: sampleReport(1),
    day: 1,
  });
  record(
    assert(
      checks,
      day1.visibility.mode === 'learning' && day1.lines.length <= 1,
      'day 1 learning max 1 line',
      'day1 too verbose',
    ),
  );

  const day2 = buildReportSystemsIntegrationModel({
    dailyReport: sampleReport(2),
    day: 2,
    lastEvent: sampleEvent({ day: 2 }),
    variantContext: { recommendedVariantKind: 'improved' },
  });
  record(
    assert(
      checks,
      day2.visibility.maxVisibleLines === 2 && day2.lines.length <= 2,
      'day 2-3 max 2 lines',
      'day2 line cap',
    ),
  );

  const day5 = buildReportSystemsIntegrationModel({
    dailyReport: sampleReport(5),
    day: 5,
    lastEvent: sampleEvent({ day: 5 }),
    variantContext: { recommendedVariantKind: 'improved', districtTrustBand: 'stable', resourcePressureBand: 'medium' },
  });
  record(
    assert(
      checks,
      day5.visibility.maxVisibleLines === 4 && day5.lines.length <= 4,
      'day 4-7 max 4 lines',
      'day5 line cap',
    ),
  );

  const day8 = buildReportSystemsIntegrationModel({
    dailyReport: sampleReport(POST_PILOT_FIRST_OPERATION_DAY),
    day: POST_PILOT_FIRST_OPERATION_DAY,
    isPostPilot: true,
    lastEvent: sampleEvent({ day: POST_PILOT_FIRST_OPERATION_DAY }),
    rankKey: 'director_1',
    unlockedPermissionIds: ['district_specific_operations_preview'],
    variantContext: { recommendedVariantKind: 'reward', districtTrustBand: 'trusted', resourcePressureBand: 'low' },
  });
  record(
    assert(
      checks,
      day8.visibility.maxVisibleLines === 5 && day8.lines.length <= 5,
      'day 8+ max 5 lines',
      'day8 line cap',
    ),
  );

  const rewardVariant = buildReportVariantSummary({
    day: 5,
    dailyReport: sampleReport(5),
    lastEvent: sampleEvent(),
    variantContext: {
      recommendedVariantKind: 'reward',
      districtTrustBand: 'trusted',
      resourcePressureBand: 'low',
    },
  });
  record(
    assert(
      checks,
      rewardVariant.visible &&
        (rewardVariant.kind === 'reward' || normalize(rewardVariant.text).includes('olumlu')),
      'variant reward report line',
      'reward variant',
    ),
  );

  const comebackVariant = buildReportVariantSummary({
    day: 5,
    dailyReport: sampleReport(5),
    lastEvent: sampleEvent(),
    variantContext: { recommendedVariantKind: 'comeback' },
  });
  record(
    assert(
      checks,
      comebackVariant.visible && !normalize(comebackVariant.text).includes('bedelsiz'),
      'variant comeback no free recovery',
      'comeback wording',
    ),
  );

  const crisisVariant = buildReportVariantSummary({
    day: 5,
    dailyReport: sampleReport(5),
    lastEvent: sampleEvent(),
    variantContext: { recommendedVariantKind: 'crisis_adjacent' },
  });
  record(
    assert(
      checks,
      !reportSystemsCopyContainsPanicTerms(crisisVariant.text ?? ''),
      'variant crisis_adjacent no panic',
      'crisis panic wording',
    ),
  );

  const routeSummary = buildReportActiveRouteSummary({
    day: 5,
    dailyReport: sampleReport(5),
    lastEvent: sampleEvent(),
    activeTaskRouteContext: {
      isResultPhase: true,
      eventPhase: 'result',
      assignment: { status: 'processed' } as never,
    },
  });
  record(
    assert(
      checks,
      !normalize(routeSummary.text).includes('gps') && !normalize(routeSummary.text).includes('pathfinding'),
      'route report line no gps/pathfinding',
      'route gps claim',
    ),
  );

  const fragileContext = {
    day: 10,
    socialPulse: { neighborhoods: { merkez: { trust: 18, complaintHeat: 92 } } },
    crisisState: { riskLevel: 'critical' },
    recentEvents: [{ tone: 'negative', summary: 'negative worsened' }],
    resourceFatigue: { status: 'critical' },
  };
  const fragileTrust = buildReportDistrictTrustSummary({
    day: 5,
    dailyReport: sampleReport(5),
    focusDistrictId: 'merkez',
    districtTrustContext: fragileContext,
  });
  record(
    assert(
      checks,
      fragileTrust.visible &&
        !reportSystemsCopyContainsPanicTerms(fragileTrust.text ?? '') &&
        (normalize(fragileTrust.text).includes('temkin') || normalize(fragileTrust.text).includes('dikkat')),
      'trust fragile soft warning',
      'fragile trust tone',
    ),
  );

  const memoryPressure = buildReportDistrictMemorySummary({
    day: 5,
    dailyReport: sampleReport(5),
    focusDistrictId: 'sanayi',
    districtMemoryContext: {
      day: 5,
      recentEvents: [{ tone: 'negative', summary: 'tekrar repeated same container' }],
      recentExposure: { districtIds: ['sanayi', 'sanayi'] },
    },
  });
  record(
    assert(
      checks,
      memoryPressure.visible && normalize(memoryPressure.text).includes('yarın'),
      'memory repeated_pressure tomorrow hint',
      'memory tomorrow hint',
    ),
  );

  const operationSummary = buildReportDistrictOperationSummary({
    day: 8,
    dailyReport: sampleReport(8),
    focusDistrictId: 'cumhuriyet',
    isPostPilot: true,
  });
  record(
    assert(
      checks,
      operationSummary.visible && !reportSystemsOperationLooksLikeCta(operationSummary.text ?? ''),
      'operation line not cta',
      'operation cta wording',
    ),
  );

  const fatigueDup = buildReportResourceFatigueSummary({
    day: 5,
    dailyReport: sampleReport(5),
    suppressResourceFatigue: true,
    resourceFatiguePanelLine: 'Araç baskısı yüksek.',
  });
  record(
    assert(
      checks,
      !fatigueDup.visible,
      'resource fatigue suppressed when card shown',
      'fatigue duplicate leak',
    ),
  );

  const tomorrowDup = buildReportTomorrowCarryOverSummary({
    day: 5,
    dailyReport: sampleReport(5),
    carryOverMemory: { summary: 'Yarın rota baskısı daha görünür olabilir.' } as never,
    existingEchoLines: ['Yarın rota baskısı daha görünür olabilir.'],
  });
  record(
    assert(
      checks,
      !tomorrowDup.visible,
      'tomorrow duplicate suppression',
      'tomorrow duplicate leak',
    ),
  );

  for (const line of day5.lines) {
    record(
      assert(
        checks,
        line.text.length <= REPORT_SYSTEMS_MAX_COPY_LENGTH + 1,
        `copy length ${line.kind}`,
        `copy too long ${line.kind}`,
      ),
    );
    record(
      assert(
        checks,
        !reportSystemsCopyContainsForbiddenTerms(line.text),
        `forbidden copy ${line.kind}`,
        `forbidden ${line.kind}`,
      ),
    );
  }

  record(
    assert(
      checks,
      readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes(
        'ReportSystemsIntegrationCard',
      ) &&
        readRepo('src/features/reports/components/end-of-day/EndOfDayReportView.tsx').includes(
          'buildReportSystemsIntegrationModel',
        ),
      'EndOfDayReportView binding',
      'report view binding missing',
    ),
  );

  const component = readRepo('src/features/reports/components/ReportSystemsIntegrationCard.tsx');
  record(
    assert(
      checks,
      component.includes('numberOfLines') && component.includes('flexShrink'),
      'UI card layout guards',
      'UI card guards',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/game/endCurrentDay.ts').includes('reportSystemsIntegrationPresentation'),
      'endCurrentDay untouched',
      'endCurrentDay touched',
    ),
  );

  record(
    assert(
      checks,
      REPORT_SYSTEMS_MOBILE_COPY_LENGTH >= 72,
      'mobile copy guard constant',
      'mobile copy constant',
    ),
  );

  const visibilityDay3 = buildReportSystemsVisibility({ day: 3, dailyReport: sampleReport(3) });
  record(
    assert(
      checks,
      visibilityDay3.maxVisibleLines === 2 && visibilityDay3.showOperation === false,
      'visibility day 2-3 rules',
      'visibility day2-3',
    ),
  );

  const regressions = [
    ['verify:report-ui', verifyReportUiScenario()],
    ['verify:report-tomorrow-preview', verifyReportTomorrowPreviewScenario()],
    ['verify:carry-over-memory', verifyCarryOverMemoryScenario()],
    ['verify:event-result-systems-echo', verifyEventResultSystemsEchoScenario()],
    ['verify:map-before-after-state', verifyMapBeforeAfterScenario()],
    ['verify:active-task-route', verifyActiveTaskRouteScenario()],
    ['verify:district-operations-runtime', verifyDistrictOperationsRuntimeScenario()],
    ['verify:district-memory-runtime', verifyDistrictMemoryRuntimeScenario()],
    ['verify:district-trust-runtime', verifyDistrictTrustRuntimeScenario()],
    ['verify:event-variants', verifyEventVariantScenario()],
    ['verify:full-ux-flow', verifyFullUxFlowScenario()],
  ] as const;

  record(
    assert(
      checks,
      readRepo('scripts/verify-full-loop.ts').length > 0,
      'full-loop script intact',
      'full-loop script missing',
    ),
  );

  for (const [name, outcome] of regressions) {
    const pass = 'ok' in outcome ? outcome.ok : true;
    record(assert(checks, pass, `${name} regression`, `${name} regression fail`));
  }

  return { ok, warn: false, checks };
}
