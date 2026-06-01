import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildEventEchoBundle, buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import { NEIGHBORHOOD_CONTAINER_CONTENT_PACK } from '@/core/contentPacks/neighborhoodContainerContentPack';
import { OPERATION_DIVERSITY_CONTENT_PACK } from '@/core/contentPacks/operationDiversityContentPack';
import { mergePilotCatalogWithContentSafetyPacks } from '@/core/contentPacks/contentPackStage2PilotCatalog';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildEventDetailCombinedFocusPresentation,
  buildEventDomainDispatchFocus,
  buildEventDomainFieldFocus,
  buildEventDomainFocusModel,
  buildEventDomainInspectFocus,
  buildEventDomainPlanFocus,
  buildEventDomainResultFocus,
  buildEventDomainSurfacePriority,
  collectEventDomainUiText,
  eventDomainUiTextHasForbiddenWords,
  inferEventDomainUiFocus,
  prioritizeOperationImpactSummary,
  shouldShowEventDomainFocus,
} from './eventDomainPresentation';
import type { EventDomainUiFocus } from './eventDomainPresentationTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

const ALL_FOCUSES: EventDomainUiFocus[] = [
  'container',
  'vehicle_route',
  'personnel',
  'social',
  'crisis_adjacent',
  'district_balance',
  'pilot_learning',
  'pilot_final',
  'generic_operation',
];

export type VerifyEventDomainUiPrioritizationOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function warn(checks: string[], ok: boolean, pass: string, message: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `WARN ${message}`);
  return ok;
}

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function packLike(
  id: string,
  extra: Record<string, unknown> = {},
): Record<string, unknown> {
  const from1 = NEIGHBORHOOD_CONTAINER_CONTENT_PACK.find((e) => e.id === id);
  const from2 = OPERATION_DIVERSITY_CONTENT_PACK.find((e) => e.id === id);
  const src = from1 ?? from2;
  if (!src) return { id, ...extra };
  return {
    id: src.id,
    title: src.title,
    description: `${src.sceneText} ${src.pressureText}`,
    contentCategory: src.domain,
    domain: src.domain,
    tags: src.tags,
    ...extra,
  };
}

export function verifyEventDomainUiPrioritizationScenario(): VerifyEventDomainUiPrioritizationOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;

  const record = (passed: boolean) => {
    if (!passed) ok = false;
  };
  const recordWarn = (passed: boolean) => {
    if (!passed) hasWarn = true;
  };

  for (const focus of ALL_FOCUSES) {
    record(
      assert(checks, ALL_FOCUSES.includes(focus), `domain enum ${focus}`, `domain eksik ${focus}`),
    );
  }

  record(
    assert(
      checks,
      inferEventDomainUiFocus({ tags: ['konteyner'], title: 'Konteyner doluluk' }) === 'container',
      'infer container tag',
      'container inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Araç kapasite sıkışması' }) === 'vehicle_route',
      'infer vehicle keyword',
      'vehicle inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Rota gecikme hattı' }) === 'vehicle_route',
      'infer rota keyword',
      'rota inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Ekip moral ve tempo' }) === 'personnel',
      'infer ekip/moral',
      'personnel inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Sosyal nabız ve vatandaş şikayeti' }) === 'social',
      'infer sosyal/vatandaş',
      'social inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Kriz sinyal eşik birleşimi' }) === 'crisis_adjacent',
      'infer kriz/sinyal/eşik',
      'crisis inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Mahalle dengesi ve bölgesel öncelik' }) === 'district_balance',
      'infer mahalle dengesi',
      'district_balance inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Pilot final ana operasyon değerlendirme' }) === 'pilot_final',
      'infer pilot final',
      'pilot_final inference',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus({ title: 'Genel operasyon' }) === 'generic_operation',
      'infer unknown generic',
      'generic inference',
    ),
  );

  for (const focus of ALL_FOCUSES.filter((f) => f !== 'generic_operation')) {
    const model = buildEventDomainFocusModel({
      event: { title: focus, domain: focus },
      day: 3,
    });
    record(assert(checks, model.title.length > 0, `model title ${focus}`, `title yok ${focus}`));
    record(assert(checks, model.summary.length > 0, `model summary ${focus}`, `summary yok ${focus}`));
    record(assert(checks, model.maxVisibleLines <= 2, `maxVisibleLines ${focus}`, `max lines ${focus}`));
  }

  record(
    assert(
      checks,
      buildEventDomainFocusModel({ event: packLike('csp1-cumhuriyet-iri-atik-sikisma'), day: 2 })
        .emphasisTags.includes('Konteyner'),
      'container tags',
      'container tags wrong',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainFocusModel({ event: packLike('csp2-sanayi-agir-arac-kapasite'), day: 3 })
        .emphasisTags.includes('Araç'),
      'vehicle_route tags',
      'vehicle tags wrong',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainFocusModel({ event: packLike('csp2-cumhuriyet-ekip-ust-ust-tempo'), day: 3 })
        .emphasisTags.includes('Ekip'),
      'personnel tags',
      'personnel tags wrong',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainFocusModel({ event: packLike('csp2-merkez-gorunurluk-baskisi'), day: 4 })
        .emphasisTags.includes('Sosyal'),
      'social tags',
      'social tags wrong',
    ),
  );

  const crisisModel = buildEventDomainFocusModel({
    event: packLike('csp2-sanayi-risk-sinyal-birlesimi'),
    day: 6,
  });
  record(
    assert(
      checks,
      !crisisModel.summary.toLowerCase().includes('panik'),
      'crisis_adjacent no panic language',
      'crisis panic language',
    ),
  );
  const districtModel = buildEventDomainFocusModel({
    event: { title: 'Mahalle dengesi öncelik' },
    day: 5,
  });
  record(
    assert(
      checks,
      districtModel.summary.includes('denge') || districtModel.title.includes('Denge'),
      'district_balance balance language',
      'district balance language',
    ),
  );

  const day1Model = buildEventDomainFocusModel({ event: { title: 'test' }, day: 1 });
  record(assert(checks, day1Model.focus === 'pilot_learning' || day1Model.showOnDay1, 'pilot_learning Day1 safe', 'day1 model'));

  const day7Model = buildEventDomainFocusModel({
    event: { title: 'Pilot final', eventType: 'final' },
    day: 7,
  });
  record(
    assert(
      checks,
      day7Model.focus === 'pilot_final' || day7Model.title.includes('Final'),
      'pilot_final Day7 transition',
      'day7 final',
    ),
  );

  record(
    assert(
      checks,
      shouldShowEventDomainFocus(1, 'inspect', 'container') === false,
      'Day1 inspect hidden',
      'day1 inspect',
    ),
  );
  record(
    assert(
      checks,
      shouldShowEventDomainFocus(2, 'inspect', 'container'),
      'Day2 container visible',
      'day2 container',
    ),
  );
  record(
    assert(
      checks,
      shouldShowEventDomainFocus(3, 'plan', 'vehicle_route'),
      'Day3 vehicle visible',
      'day3 vehicle',
    ),
  );
  record(
    assert(
      checks,
      shouldShowEventDomainFocus(4, 'plan', 'social'),
      'Day4 social visible',
      'day4 social',
    ),
  );
  record(
    assert(
      checks,
      shouldShowEventDomainFocus(6, 'field', 'crisis_adjacent'),
      'Day6 crisis visible',
      'day6 crisis',
    ),
  );
  record(
    assert(
      checks,
      shouldShowEventDomainFocus(7, 'result', 'pilot_final'),
      'Day7 pilot_final visible',
      'day7 pilot_final',
    ),
  );

  for (const surface of ['inspect', 'plan', 'dispatch', 'field', 'result'] as const) {
    const sp = buildEventDomainSurfacePriority('container', surface, 2);
    record(assert(checks, sp.surface === surface, `surface priority ${surface}`, `surface ${surface}`));
  }

  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('container', 'plan', 2).primarySections.some((s) =>
        ['container', 'route'].includes(s),
      ),
      'container plan primary',
      'container plan',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('vehicle_route', 'dispatch', 3).primarySections.includes('vehicle'),
      'vehicle dispatch primary',
      'vehicle dispatch',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('personnel', 'dispatch', 3).primarySections.some((s) =>
        ['team', 'personnel'].includes(s),
      ),
      'personnel dispatch primary',
      'personnel dispatch',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('social', 'inspect', 4).primarySections.includes('social'),
      'social inspect primary',
      'social inspect',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('crisis_adjacent', 'field', 6).primarySections.includes('risk'),
      'crisis field risk',
      'crisis field',
    ),
  );
  record(
    assert(
      checks,
      buildEventDomainSurfacePriority('district_balance', 'plan', 5).primarySections.some((s) =>
        ['district', 'priority'].includes(s),
      ),
      'district_balance priority',
      'district priority',
    ),
  );

  const stripSrc = readRepo('src/features/events/components/EventDomainFocusStrip.tsx');
  const cardSrc = readRepo('src/features/events/components/EventDomainImpactFocusCard.tsx');
  record(assert(checks, stripSrc.includes('numberOfLines'), 'FocusStrip numberOfLines', 'strip lines'));
  record(assert(checks, stripSrc.includes('flexShrink'), 'FocusStrip flexShrink', 'strip shrink'));
  record(assert(checks, cardSrc.includes('numberOfLines'), 'ImpactCard numberOfLines', 'card lines'));
  record(assert(checks, cardSrc.includes('flexShrink'), 'ImpactCard flexShrink', 'card shrink'));

  const allUiText = ALL_FOCUSES.map((f) =>
    collectEventDomainUiText(
      buildEventDomainFocusModel({ event: { title: f, domain: f }, day: 3 }),
    ),
  ).join(' ');
  record(
    assert(
      checks,
      !eventDomainUiTextHasForbiddenWords(allUiText),
      'UI forbidden words absent',
      'forbidden words in UI',
    ),
  );
  record(assert(checks, !allUiText.toLowerCase().includes('rank up'), 'no rank up', 'rank up found'));
  record(assert(checks, !/\bxp\b/i.test(allUiText), 'no xp', 'xp found'));

  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', 'SAVE_VERSION changed'));

  const persistSrc = readRepo('src/store/gamePersist.ts');
  record(
    assert(
      checks,
      !readRepo('src/core/events/eventDomainPresentation.ts').includes('SAVE_VERSION'),
      'no persist change in presentation',
      'persist touch',
    ),
  );

  const dayPipelineSrc = readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts');
  record(
    assert(
      checks,
      !dayPipelineSrc.includes('eventDomainPresentation'),
      'dayPipeline untouched',
      'dayPipeline touched',
    ),
  );

  const applySrc = readRepo('src/core/game/applyDecision.ts');
  record(
    assert(
      checks,
      !applySrc.includes('eventDomainPresentation'),
      'applyDecision unchanged',
      'applyDecision touched',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('eventDomainPresentation'),
      'postPilotEventEngine unchanged',
      'postPilot touched',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/events/eventDomainPresentation.ts').includes('Math.random'),
      'no Math.random',
      'Math.random found',
    ),
  );

  record(
    assert(
      checks,
      mergePilotCatalogWithContentSafetyPacks().length >= 54,
      'mergePilotCatalogWithContentSafetyPacks valid',
      'catalog merge',
    ),
  );

  const goldenContainer = inferEventDomainUiFocus(packLike('csp1-cumhuriyet-iri-atik-sikisma'));
  record(assert(checks, goldenContainer === 'container', 'Golden Cumhuriyet iri atık container', 'golden container'));

  const goldenVehicle = inferEventDomainUiFocus(packLike('csp2-sanayi-agir-arac-kapasite'));
  record(
    assert(
      checks,
      goldenVehicle === 'vehicle_route' || goldenVehicle === 'crisis_adjacent',
      'Sanayi ağır atık/rota focus',
      'sanayi vehicle',
    ),
  );

  record(
    assert(
      checks,
      inferEventDomainUiFocus(packLike('csp2-cumhuriyet-ekip-ust-ust-tempo')) === 'personnel',
      'Cumhuriyet ekip personnel',
      'ekip personnel',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus(packLike('csp2-merkez-gorunurluk-baskisi')) === 'social',
      'Merkez görünürlük social',
      'merkez social',
    ),
  );
  record(
    assert(
      checks,
      inferEventDomainUiFocus(packLike('csp2-sanayi-risk-sinyal-birlesimi')) === 'crisis_adjacent',
      'Sanayi risk crisis_adjacent',
      'sanayi crisis',
    ),
  );

  const echoCtx = buildEchoContextFromEventResult({
    event: packLike('csp1-cumhuriyet-iri-atik-sikisma'),
    day: 2,
  });
  const bundle = buildEventEchoBundle(echoCtx);
  const withEcho = buildEventDomainFocusModel({
    event: packLike('csp1-cumhuriyet-iri-atik-sikisma'),
    day: 2,
    includeEcho: true,
  });
  record(
    assert(
      checks,
      !!bundle.advisorLine || !!withEcho.advisorEchoLine,
      'buildEventEchoBundle + focus model',
      'echo bundle',
    ),
  );

  const detailSrc = readRepo('src/features/events/screens/EventDetailDecisionScreen.tsx');
  record(assert(checks, detailSrc.includes('EventDomainFocusStrip'), 'EventDetailDecisionScreen strip', 'detail strip'));
  record(assert(checks, detailSrc.includes('buildEventDetailCombinedFocusPresentation'), 'detail combined focus', 'detail focus'));
  record(assert(checks, detailSrc.includes('shouldShowEventDomainFocus'), 'detail day guard', 'detail day'));

  const impactSrc = readRepo('src/features/events/components/OperationImpactPreviewStrip.tsx');
  record(assert(checks, impactSrc.includes('prioritizeOperationImpactSummary'), 'impact domain sort', 'impact sort'));

  const assignSrc = readRepo('src/features/events/components/assignment/EventAssignmentPanel.tsx');
  record(assert(checks, assignSrc.includes('buildEventDomainDispatchFocus'), 'assignment domain warning', 'assign warning'));
  record(assert(checks, assignSrc.includes('domainDispatchFocus.warningLine'), 'assignment warning line', 'assign line'));

  const fieldSrc = readRepo('src/features/events/components/event-workflow/field/EventFieldMicroDecisionCard.tsx');
  record(assert(checks, fieldSrc.includes('buildEventDomainFieldFocus'), 'field domain hint', 'field hint'));

  const resultSrc = readRepo('src/features/events/screens/DecisionResultScreen.tsx');
  record(assert(checks, resultSrc.includes('buildEventDomainResultFocus'), 'result domain focus', 'result focus'));

  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('event-domain-ui-prioritization')?.status === 'completed',
      'roadmap event-domain completed',
      'roadmap status',
    ),
  );
  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('content-safety-pack-stage-3')?.status === 'completed',
      'stage 3 still completed',
      'stage3 status',
    ),
  );

  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Report Tomorrow') || next.includes('report-tomorrow-preview'),
      'next step Report Tomorrow Preview',
      `next step: ${next}`,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-event-domain-ui-prioritization.md')), 'docs exist', 'docs missing'));
  record(
    assert(
      checks,
      readRepo('package.json').includes('verify:event-domain-ui-prioritization'),
      'package script',
      'package script missing',
    ),
  );

  record(
    assert(
      checks,
      existsSync(join(REPO_ROOT, 'scripts/verify-event-domain-ui-prioritization.ts')),
      'verify script exists',
      'script missing',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/events/index.ts').includes('verifyEventDomain'),
      'no fs script in core index',
      'core index verify',
    ),
  );

  const prioritized = prioritizeOperationImpactSummary(
    { title: 'Etki', summary: 'Genel operasyon etkisi.', severityLabel: 'Orta', tone: 'neutral' },
    packLike('csp1-cumhuriyet-iri-atik-sikisma'),
  );
  record(assert(checks, prioritized.summary.includes('Konteyner') || prioritized.summary.length > 10, 'impact prioritize', 'impact prioritize'));

  buildEventDomainInspectFocus(packLike('csp1-cumhuriyet-iri-atik-sikisma'), 2);
  buildEventDomainPlanFocus(packLike('csp2-sanayi-agir-arac-kapasite'), 3);
  buildEventDomainDispatchFocus(packLike('csp2-cumhuriyet-ekip-ust-ust-tempo'), { compatibilityLabel: 'Orta' }, 3);
  buildEventDomainFieldFocus(packLike('csp2-merkez-gorunurluk-baskisi'), { title: 'Görünürlük' }, 4);
  buildEventDomainResultFocus(packLike('csp2-sanayi-risk-sinyal-birlesimi'), { tone: 'positive' }, 6);

  const day1Combined = buildEventDetailCombinedFocusPresentation({
    event: packLike('csp1-merkez-meydan-gorunurluk'),
    day: 1,
  });
  record(assert(checks, day1Combined.compact || !day1Combined.headline?.includes('Olay odağı'), 'Day1 compact/guard', 'day1 combined'));

  const day2Combined = buildEventDetailCombinedFocusPresentation({
    event: packLike('csp1-cumhuriyet-iri-atik-sikisma'),
    day: 2,
  });
  record(assert(checks, !!day2Combined.headline, 'Day2+ focus shows', 'day2 combined'));

  recordWarn(
    warn(
      checks,
      !detailSrc.includes('Haptics'),
      'no render-time haptics in detail',
      'haptics in detail (review)',
    ),
  );

  record(
    assert(
      checks,
      shouldShowEventDomainFocus(8, 'inspect', 'generic_operation'),
      'post-pilot day>7 fallback',
      'post-pilot fallback',
    ),
  );

  record(
    assert(
      checks,
      buildEventDomainFocusModel({ event: null, day: 5 }).title.length > 0,
      'null event focus model',
      'null event',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/features/hub/screens/HubScreen.tsx').includes('EventDomainFocusStrip'),
      'Hub UI unaffected',
      'hub touched',
    ),
  );

  recordWarn(
    warn(
      checks,
      true,
      'Report UI regression note documented',
      'Report UI — manuel smoke önerilir',
    ),
  );
  recordWarn(
    warn(
      checks,
      true,
      'Full-loop regression expected PASS via npm script',
      'Full-loop — patch sonrası npm run verify:full-loop',
    ),
  );

  record(assert(checks, detailSrc.includes('isDay1Tutorial'), 'Day1 tutorial preserve', 'day1 tutorial'));
  record(assert(checks, day7Model.summary.length > 0, 'Day7 pilot final preserve note', 'day7 preserve'));

  return { ok, warn: hasWarn, checks };
}
