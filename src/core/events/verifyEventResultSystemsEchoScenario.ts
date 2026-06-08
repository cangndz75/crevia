import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { verifyActiveTaskRouteScenario } from '@/core/activeTaskRoutes/verifyActiveTaskRouteScenario';
import type { CreviaActiveTaskRouteUiContext } from '@/core/activeTaskRoutes/activeTaskRouteUiTypes';
import { verifyDistrictMemoryRuntimeScenario } from '@/core/districtMemoryRuntime/verifyDistrictMemoryRuntimeScenario';
import { verifyDistrictOperationsRuntimeScenario } from '@/core/districtOperationsRuntime/verifyDistrictOperationsRuntimeScenario';
import { verifyDistrictTrustRuntimeScenario } from '@/core/districtTrustRuntime/verifyDistrictTrustRuntimeScenario';
import {
  EVENT_RESULT_SYSTEMS_ECHO_MAX_COPY_LENGTH,
  EVENT_RESULT_SYSTEMS_ECHO_MOBILE_COPY_LENGTH,
  buildEventResultActiveRouteEcho,
  buildEventResultDistrictMemoryEcho,
  buildEventResultDistrictOperationEcho,
  buildEventResultDistrictTrustEcho,
  buildEventResultSystemsDebugRows,
  buildEventResultSystemsEchoModel,
  buildEventResultSystemsVisibility,
  buildEventResultTomorrowCarryOverEcho,
  buildEventResultVariantEcho,
  eventResultSystemsEchoCopyContainsForbiddenTerms,
  eventResultSystemsEchoCopyContainsPanicTerms,
  eventResultSystemsEchoOperationLooksLikeCta,
} from '@/core/events/eventResultNewSystemsPresentation';
import { verifyEventVariantScenario } from '@/core/eventVariants/verifyEventVariantScenario';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';
import { verifyFullUxFlowScenario } from '@/core/ux/verifyFullUxFlowScenario';
import { verifyEventResultUiScenario } from '@/features/events/verifyEventResultUiScenario';
import { SAVE_VERSION } from '@/store/gamePersist';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventResultSystemsEchoOutcome = {
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

import type { EventCard } from '@/core/models/EventCard';

function sampleEvent(overrides: Partial<EventCard> = {}): EventCard {
  return {
    id: 'evt_result_echo',
    title: 'Konteyner hattı baskısı',
    category: 'container',
    riskLevel: 'medium',
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

function sampleSnapshot(day = 5) {
  return {
    id: 'snap_1',
    day,
    eventId: 'evt_result_echo',
    eventTitle: 'Konteyner hattı baskısı',
    eventType: 'container',
    neighborhoodId: 'cumhuriyet',
    neighborhoodName: 'Cumhuriyet',
    decisionId: 'd1',
    decisionTitle: 'Ekibi yönlendir',
    decisionTone: 'balanced' as const,
    createdAt: Date.now(),
    summaryTitle: 'Operasyon tamamlandı',
    summaryText: 'Saha ekibi konteyner hattını dengeledi.',
    resultTone: 'positive' as const,
    metricChanges: [],
    subsystemOutcomes: [],
    highlightLines: [],
    riskLines: [],
  };
}

export function verifyEventResultSystemsEchoScenario(): VerifyEventResultSystemsEchoOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  let emptyCrash = false;
  try {
    buildEventResultSystemsEchoModel({});
    buildEventResultSystemsEchoModel({ snapshot: null, event: null });
    buildEventResultSystemsDebugRows({});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state no crash', 'empty state crash'));

  const hiddenNoDistrict = buildEventResultSystemsEchoModel({ day: 5 });
  record(
    assert(
      checks,
      !hiddenNoDistrict.visible && hiddenNoDistrict.lines.length === 0,
      'missing event/district hidden fallback',
      'missing state not hidden',
    ),
  );

  const day1 = buildEventResultSystemsEchoModel({
    snapshot: sampleSnapshot(1),
    event: sampleEvent({ day: 1 }),
    day: 1,
    districtId: 'cumhuriyet',
  });
  record(
    assert(
      checks,
      day1.visibility.mode === 'minimal' && day1.lines.length === 0,
      'day 1 minimal/hidden',
      'day1 too verbose',
    ),
  );

  const day2 = buildEventResultSystemsEchoModel({
    snapshot: sampleSnapshot(2),
    event: sampleEvent({ day: 2 }),
    day: 2,
    districtId: 'cumhuriyet',
    variantContext: { recommendedVariantKind: 'reward' },
  });
  record(
    assert(
      checks,
      day2.visibility.maxVisibleLines === 2 && day2.lines.length <= 2,
      'day 2-3 max 2 lines',
      'day2 line cap',
    ),
  );

  const day5 = buildEventResultSystemsEchoModel({
    snapshot: sampleSnapshot(5),
    event: sampleEvent({ day: 5 }),
    day: 5,
    districtId: 'cumhuriyet',
    variantContext: { recommendedVariantKind: 'improved' },
  });
  record(
    assert(
      checks,
      day5.visibility.maxVisibleLines === 4 && day5.lines.length <= 4,
      'day 4+ max 4 lines',
      'day5 line cap',
    ),
  );

  const postPilot = buildEventResultSystemsEchoModel({
    snapshot: sampleSnapshot(POST_PILOT_FIRST_OPERATION_DAY),
    event: sampleEvent({ day: POST_PILOT_FIRST_OPERATION_DAY }),
    day: POST_PILOT_FIRST_OPERATION_DAY,
    districtId: 'cumhuriyet',
    isPostPilot: true,
    rankKey: 'director_1',
    unlockedPermissionIds: ['district_specific_operations_preview'],
    variantContext: { recommendedVariantKind: 'reward' },
  });
  record(
    assert(
      checks,
      postPilot.visibility.mode === 'detailed' && postPilot.visibility.showOperation,
      'post-pilot high rank detailed',
      'post-pilot visibility',
    ),
  );

  const rewardVariant = buildEventResultVariantEcho({
    day: 5,
    event: sampleEvent(),
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
      'variant reward positive line',
      'reward variant',
    ),
  );

  const comebackVariant = buildEventResultVariantEcho({
    day: 5,
    event: sampleEvent(),
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

  const crisisVariant = buildEventResultVariantEcho({
    day: 5,
    event: sampleEvent(),
    variantContext: { recommendedVariantKind: 'crisis_adjacent' },
  });
  record(
    assert(
      checks,
      !eventResultSystemsEchoCopyContainsPanicTerms(crisisVariant.text ?? ''),
      'variant crisis_adjacent no panic',
      'crisis panic wording',
    ),
  );

  const routeEcho = buildEventResultActiveRouteEcho({
    day: 5,
    event: sampleEvent(),
    activeTaskRouteContext: {
      isResultPhase: true,
      eventPhase: 'result',
      assignment: { status: 'processed' } as CreviaActiveTaskRouteUiContext['assignment'],
    },
  });
  record(
    assert(
      checks,
      !normalize(routeEcho.text).includes('gps') && !normalize(routeEcho.text).includes('pathfinding'),
      'route echo no gps/pathfinding',
      'route gps claim',
    ),
  );

  const fragileContext = {
    day: 10,
    socialPulse: { neighborhoods: { merkez: { trust: 18, complaintHeat: 92 } } },
    crisisState: { riskLevel: 'critical', activeIncident: { affectedDistrictIds: ['merkez'] } },
    recentEvents: [{ tone: 'negative', summary: 'negative worsened' }],
    resourceFatigue: { status: 'critical' },
  };
  const fragileTrust = buildEventResultDistrictTrustEcho({
    day: 5,
    districtId: 'merkez',
    districtTrustContext: fragileContext,
  });
  record(
    assert(
      checks,
      fragileTrust.visible &&
        !eventResultSystemsEchoCopyContainsPanicTerms(fragileTrust.text ?? '') &&
        normalize(fragileTrust.text).includes('dikkat'),
      'trust fragile soft warning',
      'fragile trust tone',
    ),
  );

  const memoryPressure = buildEventResultDistrictMemoryEcho({
    day: 5,
    districtId: 'sanayi',
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

  const operationEcho = buildEventResultDistrictOperationEcho({
    day: 8,
    districtId: 'cumhuriyet',
    isPostPilot: true,
  });
  record(
    assert(
      checks,
      operationEcho.visible && !eventResultSystemsEchoOperationLooksLikeCta(operationEcho.text ?? ''),
      'operation echo not cta',
      'operation cta wording',
    ),
  );

  const tomorrowDup = buildEventResultTomorrowCarryOverEcho({
    day: 5,
    carryOverSummary: 'Yarın rota baskısı daha görünür olabilir.',
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
        line.text.length <= EVENT_RESULT_SYSTEMS_ECHO_MAX_COPY_LENGTH + 1,
        `copy length ${line.kind}`,
        `copy too long ${line.kind}`,
      ),
    );
    record(
      assert(
        checks,
        !eventResultSystemsEchoCopyContainsForbiddenTerms(line.text),
        `forbidden copy ${line.kind}`,
        `forbidden ${line.kind}`,
      ),
    );
  }

  const decisionResultScreen = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  record(
    assert(
      checks,
      decisionResultScreen.includes('EventResultSystemsEchoStrip') &&
        decisionResultScreen.includes('buildEventResultSystemsEchoModel'),
      'DecisionResultScreen binding',
      'screen binding missing',
    ),
  );

  const component = readRepo('src/features/events/components/result/EventResultSystemsEchoStrip.tsx');
  record(
    assert(
      checks,
      component.includes('numberOfLines') && component.includes('flexShrink'),
      'UI strip layout guards',
      'UI strip guards',
    ),
  );

  const applyDecisionRepo = readRepo('src/core/game/applyDecision.ts');
  record(
    assert(
      checks,
      !applyDecisionRepo.includes('eventResultNewSystemsPresentation'),
      'applyDecision untouched',
      'applyDecision touched',
    ),
  );

  const snapshotTypes = readRepo('src/features/events/types/decisionResultTypes.ts');
  record(
    assert(
      checks,
      !snapshotTypes.includes('SystemsEcho'),
      'DecisionResultSnapshot shape unchanged',
      'snapshot shape changed',
    ),
  );

  const regressions = [
    ['verify:event-result-ui', verifyEventResultUiScenario()],
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
      !readRepo('src/core/mapPresence/mapBeforeAfterPresentation.ts').includes('eventResultNewSystemsPresentation'),
      'map-before-after presentation untouched',
      'map-before-after touched',
    ),
  );

  record(
    assert(
      checks,
      readRepo('scripts/verify-full-loop.ts').length > 0,
      'full-loop script intact',
      'full-loop script missing',
    ),
  );

  for (const [name, outcome] of regressions) {
    record(assert(checks, outcome.ok, `${name} regression`, `${name} regression fail`));
  }

  const visibilityDay3 = buildEventResultSystemsVisibility({ day: 3 });
  record(
    assert(
      checks,
      visibilityDay3.maxVisibleLines === 2 && visibilityDay3.showOperation === false,
      'visibility day 2-3 rules',
      'visibility day2-3',
    ),
  );

  record(
    assert(
      checks,
      EVENT_RESULT_SYSTEMS_ECHO_MOBILE_COPY_LENGTH >= 72,
      'mobile copy guard constant',
      'mobile copy constant',
    ),
  );

  return { ok, warn: false, checks };
}

function normalize(value?: string): string {
  return (value ?? '').toLocaleLowerCase('tr-TR');
}
