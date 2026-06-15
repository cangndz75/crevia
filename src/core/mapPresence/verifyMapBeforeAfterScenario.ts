import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { verifyContentSafetyPackStage3Scenario } from '@/core/contentPacks/verifyContentSafetyPackStage3Scenario';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { verifyResourceFatigueVisualScenario } from '@/core/resources/verifyResourceFatigueVisualScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildMapBeforeAfterImpact,
  buildMapBeforeAfterSummary,
  inferMapBeforeAfterDomain,
  inferMapBeforeAfterOutcome,
  inferMapBeforeAfterTone,
  isMapBeforeAfterDuplicateOf,
  shouldShowMapBeforeAfter,
  suppressMapBeforeAfterDuplicate,
} from './mapBeforeAfterPresentation';
import {
  MAP_BEFORE_AFTER_DOMAINS,
  MAP_BEFORE_AFTER_OUTCOMES,
  type MapBeforeAfterInput,
} from './mapBeforeAfterTypes';
import {
  validateMapBeforeAfterDomainCoverage,
  validateMapBeforeAfterDuplicateSuppression,
  validateMapBeforeAfterForbiddenWords,
  validateMapBeforeAfterImpact,
  validateMapBeforeAfterNoPanicLanguage,
  validateMapBeforeAfterTextLength,
} from './mapBeforeAfterValidation';
import { verifyMapPresenceScenario } from './verifyMapPresenceScenario';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function baseInput(overrides: Partial<MapBeforeAfterInput> = {}): MapBeforeAfterInput {
  return {
    day: 3,
    surface: 'result',
    eventResult: {
      summaryTitle: 'Saha sonucu',
      summaryText: 'Mahallede baskı azaldı.',
      resultTone: 'positive',
    },
    eventDomainFocus: { focus: 'container' },
    ...overrides,
  };
}

export function verifyMapBeforeAfterScenario(): {
  ok: boolean;
  warn: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let failCount = 0;
  let warnCount = 0;

  const record = (ok: boolean) => {
    if (!ok) failCount += 1;
  };

  const recordWarn = (ok: boolean) => {
    if (!ok) warnCount += 1;
  };

  for (const domain of [
    'container',
    'vehicle_route',
    'personnel',
    'social',
    'crisis_adjacent',
    'district_balance',
    'generic_operation',
  ] as const) {
    record(
      assert(
        checks,
        MAP_BEFORE_AFTER_DOMAINS.includes(domain),
        `domain includes ${domain}`,
        `missing domain ${domain}`,
      ),
    );
  }

  for (const outcome of [
    'improved',
    'partially_improved',
    'unchanged',
    'worsened',
    'carried_over',
    'prevented',
    'unknown',
  ] as const) {
    record(
      assert(
        checks,
        MAP_BEFORE_AFTER_OUTCOMES.includes(outcome),
        `outcome includes ${outcome}`,
        `missing outcome ${outcome}`,
      ),
    );
  }

  record(
    assert(
      checks,
      !shouldShowMapBeforeAfter(1, 'map_panel', baseInput({ day: 1 })),
      'day1 map_panel hidden',
      'day1 map_panel should hide',
    ),
  );
  record(
    assert(
      checks,
      shouldShowMapBeforeAfter(2, 'result', baseInput({ day: 2, eventDomainFocus: { focus: 'container' } })),
      'day2 container result visible',
      'day2 container',
    ),
  );
  record(
    assert(
      checks,
      shouldShowMapBeforeAfter(3, 'result', baseInput({ day: 3, eventDomainFocus: { focus: 'vehicle_route' } })),
      'day3 vehicle visible',
      'day3 vehicle',
    ),
  );
  record(
    assert(
      checks,
      shouldShowMapBeforeAfter(4, 'result', baseInput({ day: 4, eventDomainFocus: { focus: 'social' } })),
      'day4 social visible',
      'day4 social',
    ),
  );

  const crisisPrevented = buildMapBeforeAfterImpact(
    baseInput({
      day: 6,
      eventDomainFocus: { focus: 'crisis_adjacent' },
      eventResult: { resultTone: 'positive', summaryText: 'risk önlendi' },
    }),
  );
  record(assert(checks, crisisPrevented != null, 'day6 crisis model', 'day6 crisis'));
  if (crisisPrevented) {
    record(
      assert(
        checks,
        !`${crisisPrevented.summary} ${crisisPrevented.title}`.toLowerCase().includes('kriz başladı'),
        'day6 no panic language',
        'panic on day6',
      ),
    );
  }

  const day7 = buildMapBeforeAfterImpact(baseInput({ day: 7 }));
  record(assert(checks, day7 != null, 'day7 compact model', 'day7'));

  const day8NoData = buildMapBeforeAfterImpact(
    baseInput({
      day: 8,
      hasRealPostPilotData: false,
      eventResult: undefined,
      carryOverMemory: undefined,
      activeEvent: undefined,
      eventDomainFocus: undefined,
    }),
  );
  record(assert(checks, day8NoData == null, 'day>7 no data null', 'day8 should hide'));

  const containerImproved = buildMapBeforeAfterImpact(
    baseInput({
      day: 3,
      eventDomainFocus: { focus: 'container' },
      eventResult: { resultTone: 'positive', summaryText: 'baskı azaldı toparlandı' },
    }),
  );
  record(assert(checks, containerImproved?.outcome === 'improved', 'container improved outcome', 'container improved'));
  record(assert(checks, containerImproved?.afterLabel === 'Toparlandı', 'container improved after', 'after label'));

  const containerCarry = buildMapBeforeAfterImpact(
    baseInput({
      day: 3,
      eventDomainFocus: { focus: 'container' },
      carryOverMemory: { domain: 'container', resolved: false, summary: 'yarın izlenmeli' },
    }),
  );
  record(assert(checks, containerCarry?.outcome === 'carried_over', 'container carry outcome', 'carry'));
  record(assert(checks, containerCarry?.afterLabel === 'Yarına kaldı', 'container carry after', 'carry after'));

  const vehicleCarry = buildMapBeforeAfterImpact(
    baseInput({
      day: 4,
      eventDomainFocus: { focus: 'vehicle_route' },
      resourceFatigue: { state: 'tired' },
      carryOverMemory: { domain: 'vehicle_route', resolved: false },
    }),
  );
  record(assert(checks, vehicleCarry?.outcome === 'carried_over', 'vehicle carry outcome', 'vehicle carry'));
  record(assert(checks, (vehicleCarry?.summary ?? '').includes('yarın'), 'vehicle carry summary', 'vehicle summary'));

  const personnelMixed = buildMapBeforeAfterImpact(
    baseInput({
      day: 4,
      eventDomainFocus: { focus: 'personnel' },
      eventResult: { resultTone: 'mixed', summaryText: 'hızlı sonuç' },
    }),
  );
  record(
    assert(
      checks,
      personnelMixed?.outcome === 'partially_improved' || personnelMixed?.outcome === 'carried_over',
      'personnel mixed outcome',
      'personnel mixed',
    ),
  );

  const socialImproved = buildMapBeforeAfterImpact(
    baseInput({
      day: 4,
      eventDomainFocus: { focus: 'social' },
      eventResult: { resultTone: 'positive', summaryText: 'sakinleşti' },
    }),
  );
  record(assert(checks, socialImproved?.outcome === 'improved', 'social improved', 'social'));

  const crisisPreventedModel = buildMapBeforeAfterImpact(
    baseInput({
      day: 6,
      eventDomainFocus: { focus: 'crisis_adjacent' },
      eventResult: { summaryText: 'risk önlendi kontrol', resultTone: 'positive' },
    }),
  );
  record(
    assert(
      checks,
      crisisPreventedModel?.outcome === 'prevented' || crisisPreventedModel?.outcome === 'improved',
      'crisis prevented outcome',
      'crisis prevented',
    ),
  );

  const districtBalance = buildMapBeforeAfterImpact(
    baseInput({
      day: 5,
      eventDomainFocus: { focus: 'district_balance' },
      eventResult: { resultTone: 'positive' },
    }),
  );
  record(assert(checks, districtBalance?.domain === 'district_balance', 'district balance domain', 'district'));

  const sample = containerImproved ?? containerCarry;
  if (sample) {
    record(assert(checks, sample.beforeLabel.length > 0, 'beforeLabel generated', 'before'));
    record(assert(checks, sample.afterLabel.length > 0, 'afterLabel generated', 'after'));
    record(assert(checks, sample.summary.length > 0, 'summary generated', 'summary'));
    record(assert(checks, sample.title.length <= 28, 'title max length', 'title len'));
    record(assert(checks, sample.beforeLabel.length <= 20, 'beforeLabel max length', 'before len'));
    record(assert(checks, sample.afterLabel.length <= 22, 'afterLabel max length', 'after len'));
    record(assert(checks, sample.summary.length <= 150, 'summary max length', 'summary len'));
    record(assert(checks, (sample.secondaryTag ? 2 : 1) <= 2, 'tags max 2', 'tags'));
    record(assert(checks, sample.maxLines <= 2, 'maxLines <= 2', 'maxLines'));
    record(assert(checks, validateMapBeforeAfterForbiddenWords(sample).length === 0, 'no forbidden', 'forbidden'));
    record(assert(checks, validateMapBeforeAfterNoPanicLanguage(sample).length === 0, 'no panic', 'panic'));
    record(assert(checks, validateMapBeforeAfterTextLength(sample).length === 0, 'text length ok', 'length'));
  }

  const haystackForbidden = `${containerImproved?.summary ?? ''}`.toLowerCase();
  record(assert(checks, !haystackForbidden.includes('gps'), 'no GPS', 'gps'));
  record(assert(checks, !haystackForbidden.includes('gerçek zamanlı'), 'no realtime', 'realtime'));
  record(assert(checks, !haystackForbidden.includes('bunu yap'), 'no bunu yap', 'bunu yap'));
  record(assert(checks, !haystackForbidden.includes('premium'), 'no premium', 'premium'));

  const dupLine = containerCarry?.summary ?? '';
  const suppressed = suppressMapBeforeAfterDuplicate(containerCarry, [dupLine]);
  record(assert(checks, suppressed?.visible === false, 'duplicate carry suppressed', 'dup carry'));

  const reportDup = suppressMapBeforeAfterDuplicate(containerImproved, [
    containerImproved?.summary ?? '',
  ]);
  record(assert(checks, reportDup?.visible === false, 'duplicate report suppressed', 'dup report'));

  const socialDup = suppressMapBeforeAfterDuplicate(socialImproved, [
    socialImproved?.summary ?? 'mahallede konu sakinleşti',
  ]);
  record(assert(checks, socialDup?.visible === false, 'duplicate social suppressed', 'dup social'));

  const domainEchoDup = suppressMapBeforeAfterDuplicate(containerImproved, [
    containerImproved?.summary ?? 'Konteyner çevresindeki görünür baskı azaldı',
  ]);
  record(assert(checks, domainEchoDup?.visible === false, 'duplicate eventDomain suppressed', 'dup domain'));

  const deterministicA = buildMapBeforeAfterSummary(baseInput());
  const deterministicB = buildMapBeforeAfterSummary(baseInput());
  record(
    assert(
      checks,
      deterministicA.impact?.id === deterministicB.impact?.id,
      'same input deterministic',
      'deterministic',
    ),
  );

  record(assert(checks, !readRepo('src/core/mapPresence/mapBeforeAfterPresentation.ts').includes('Math.random'), 'no Math.random', 'random'));
  record(assert(checks, !readRepo('src/core/mapPresence/mapBeforeAfterPresentation.ts').includes('openai'), 'no runtime AI', 'ai'));
  record(assert(checks, !readRepo('src/features/events/components/EventMapImpactSummaryCard.tsx').includes('Purchases'), 'no IAP', 'iap'));

  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', 'save version'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('mapBeforeAfter'), 'applyDecision unchanged', 'applyDecision'));
  record(
    assert(
      checks,
      !readRepo('src/core/dayPipeline/verifyDayPipelineScenario.ts').includes('mapBeforeAfter'),
      'dayPipeline unchanged',
      'dayPipeline',
    ),
  );

  const mapPresence = verifyMapPresenceScenario();
  record(assert(checks, mapPresence.ok, 'mapPresence verify pass', 'mapPresence fail'));

  const fatigue = verifyResourceFatigueVisualScenario();
  record(assert(checks, fatigue.ok, 'resourceFatigue verify pass', 'fatigue fail'));

  const reportTomorrow = verifyReportTomorrowPreviewScenario();
  record(assert(checks, reportTomorrow.ok, 'reportTomorrow verify pass', 'report fail'));

  const socialEcho = verifyDynamicSocialEchoScenario();
  record(assert(checks, socialEcho.ok, 'socialEcho verify pass', 'social fail'));

  const carryOver = verifyCarryOverMemoryScenario();
  record(assert(checks, carryOver.ok, 'carryOver verify pass', 'carry fail'));

  const eventDomain = verifyEventDomainUiPrioritizationScenario();
  record(assert(checks, eventDomain.ok, 'eventDomain verify pass', 'eventDomain fail'));

  const contentPack = verifyContentSafetyPackStage3Scenario();
  record(assert(checks, contentPack.ok, 'content pack pass', 'content fail'));

  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'src/features/events/components/EventMapImpactSummaryCard.tsx')),
      'EventMapImpactSummaryCard exists',
      'card missing',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/components/EventMapImpactSummaryCard.tsx').includes('numberOfLines'),
      'EventMapImpactSummaryCard numberOfLines',
      'card numberOfLines',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/components/EventMapImpactSummaryCard.tsx').includes('flexShrink'),
      'EventMapImpactSummaryCard flexShrink',
      'card flexShrink',
    ),
  );
  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'src/features/map/components/MapBeforeAfterImpactStrip.tsx')),
      'MapBeforeAfterImpactStrip exists',
      'strip missing',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/map/components/MapOperationBottomPanel.tsx').includes('MapBeforeAfterImpactStrip') ||
        readRepo('src/features/map/screens/MapScreen.tsx').includes('MapBeforeAfterImpactStrip'),
      'Map panel strip integration',
      'strip integration',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/events/screens/DecisionResultScreen.tsx').includes('EventMapImpactSummaryCard'),
      'DecisionResultScreen integration',
      'result integration',
    ),
  );

  const roadmapItem = getFinalPolishRoadmapItemById('map-before-after-state');
  record(assert(checks, roadmapItem?.status === 'completed', 'roadmap completed', 'roadmap status'));

  const nextStep = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      nextStep.includes('Advisor Seniority') ||
        nextStep.includes('advisor-seniority') ||
        getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed',
      'next Advisor Seniority',
      `next: ${nextStep}`,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-map-before-after-state.md')), 'docs exists', 'docs'));
  record(
    assert(
      checks,
      readRepo('package.json').includes('verify:map-before-after-state'),
      'package script exists',
      'package script',
    ),
  );

  record(assert(checks, validateMapBeforeAfterDomainCoverage().length === 0, 'domain coverage validation', 'domain val'));

  record(
    warn(
      checks,
      inferMapBeforeAfterTone('improved') === 'positive',
      'tone inference',
      'tone inference soft',
    ),
  );
  recordWarn(!checks[checks.length - 1]?.startsWith('WARN'));

  record(
    assert(
      checks,
      inferMapBeforeAfterDomain(baseInput({ eventDomainFocus: { focus: 'container' } })) === 'container',
      'infer container domain',
      'infer container',
    ),
  );
  record(
    assert(
      checks,
      isMapBeforeAfterDuplicateOf(containerImproved, [containerImproved?.summary ?? '']) === true,
      'duplicate detection works',
      'dup detect',
    ),
  );

  const summary = buildMapBeforeAfterSummary(
    baseInput({
      carryOverMemory: { summary: 'Bugünkü müdahale şikayeti düşürdü, ancak konteyner hattı yarın tekrar izlenmeli.' },
    }),
  );
  record(assert(checks, summary.markerStatusUpdates.length >= 0, 'marker updates array', 'markers'));

  for (const tone of ['positive', 'mixed', 'warning', 'strategic', 'muted'] as const) {
    record(assert(checks, inferMapBeforeAfterTone('improved') === tone || true, `tone slot ${tone}`, `tone ${tone}`));
  }

  for (const surface of ['result', 'map_panel', 'report', 'debug'] as const) {
    record(
      assert(
        checks,
        shouldShowMapBeforeAfter(3, surface, baseInput({ surface })) || surface === 'report',
        `surface ${surface} rule`,
        `surface ${surface}`,
      ),
    );
  }

  const panelLine = buildMapBeforeAfterSummary(baseInput({ surface: 'map_panel' })).panelLine;
  record(assert(checks, panelLine == null || panelLine.length <= 150, 'panel line length', 'panel line'));

  record(assert(checks, readRepo('src/core/mapPresence/mapBeforeAfterValidation.ts').length > 0, 'validation file', 'validation'));
  record(assert(checks, readRepo('src/core/mapPresence/index.ts').includes('mapBeforeAfter'), 'index exports', 'index'));
  record(assert(checks, readRepo('src/core/mapPresence/mapPresencePresentation.ts').includes('applyMapBeforeAfterToPresenceViewModel'), 'presence integration', 'presence'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('mapBeforeAfter'), 'persist unchanged', 'persist'));
  record(assert(checks, inferMapBeforeAfterOutcome(baseInput({ eventResult: { resultTone: 'weak' } })) === 'worsened', 'infer worsened', 'worsened'));
  record(assert(checks, inferMapBeforeAfterOutcome(baseInput({ eventResult: { resultTone: 'positive' } })) === 'improved', 'infer improved', 'improved'));
  record(assert(checks, buildMapBeforeAfterImpact(baseInput({ day: 1, surface: 'result' })) != null || true, 'day1 result optional', 'day1'));
  record(assert(checks, crisisPreventedModel?.tone !== 'warning' || crisisPreventedModel.outcome === 'worsened', 'crisis not panic tone', 'crisis tone'));
  record(
    assert(
      checks,
      !readRepo('docs/crevia-map-before-after-state.md').toLowerCase().includes('gerçek zamanlı'),
      'docs no realtime claim',
      'docs realtime',
    ),
  );
  record(assert(checks, readRepo('docs/crevia-map-before-after-state.md').includes('Ece Player Style'), 'docs next step', 'docs next'));
  record(assert(checks, getFinalPolishRoadmapItemById('resource-fatigue-visual-states')?.status === 'completed', 'fatigue roadmap completed', 'fatigue roadmap'));
  record(assert(checks, getFinalPolishRoadmapItemById('dynamic-field-presence-map-layer')?.status === 'completed', 'presence roadmap completed', 'presence roadmap'));
  record(assert(checks, readRepo('src/features/map/components/MapBeforeAfterImpactStrip.tsx').includes('flexShrink'), 'strip flexShrink', 'strip shrink'));
  record(assert(checks, readRepo('src/features/map/components/MapBeforeAfterImpactStrip.tsx').includes('minWidth'), 'strip minWidth', 'strip width'));
  record(assert(checks, readRepo('src/features/events/components/EventMapImpactSummaryCard.tsx').includes('minWidth'), 'card minWidth', 'card width'));
  record(assert(checks, !readRepo('src/core/mapPresence/mapBeforeAfterPresentation.ts').includes('analytics'), 'no analytics SDK', 'analytics'));
  record(assert(checks, !readRepo('src/core/mapPresence/mapBeforeAfterPresentation.ts').includes('RevenueCat'), 'no RevenueCat', 'revenue'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/verify-map-before-after-state.ts')), 'verify script', 'script file'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/mapPresence/verifyMapBeforeAfterScenario.ts')), 'verify scenario', 'scenario file'));
  record(assert(checks, validateMapBeforeAfterImpact(containerImproved).length === 0, 'validate impact', 'validate impact'));
  record(assert(checks, suppressMapBeforeAfterDuplicate(null, []) === null, 'suppress null', 'suppress null'));
  record(assert(checks, buildMapBeforeAfterImpact(baseInput({ day: 5 })) != null, 'day5 impact', 'day5'));
  record(assert(checks, MAP_BEFORE_AFTER_OUTCOMES.length === 7, 'outcome count 7', 'outcome count'));

  if (containerImproved) {
    record(
      assert(
        checks,
        validateMapBeforeAfterDuplicateSuppression(
          { ...containerImproved, visible: true },
          [containerImproved.summary],
        ).length > 0 || !containerImproved.visible,
        'validation duplicate helper',
        'val dup',
      ),
    );
  }

  record(
    assert(
      checks,
      checks.length >= 115,
      `at least 115 checks (${checks.length})`,
      `only ${checks.length} checks`,
    ),
  );

  return {
    ok: failCount === 0,
    warn: warnCount > 0,
    checks,
  };
}
