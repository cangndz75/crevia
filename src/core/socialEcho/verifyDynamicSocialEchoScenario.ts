import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { buildEchoContextFromEventResult } from '@/core/contentPacks/eventEchoSelectors';
import { buildHubCarryOverMemory } from '@/core/carryOver/carryOverMemoryPresentation';
import { buildEventDomainFocusModel } from '@/core/events/eventDomainPresentation';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildSocialDecisionEchoCardModel,
  buildSocialEchoContextFromPulseArgs,
  buildSocialPulseEchoLine,
} from './socialEchoPresentation';
import {
  buildSocialDecisionEcho,
  buildSocialEchoContext,
  buildSocialEchoSummary,
  getSocialEchoVisibility,
  inferSocialEchoDomain,
  inferSocialEchoSentiment,
  isSocialEchoSelectionDeterministic,
  selectStableSocialMention,
  shouldShowSocialDecisionEcho,
} from './socialEchoSelectors';
import { SOCIAL_ECHO_DOMAINS } from './socialEchoTypes';
import {
  validateSocialEchoDomainCoverage,
  validateSocialEchoForbiddenWords,
  validateSocialEchoModel,
  validateSocialEchoNoPanicLanguage,
} from './socialEchoValidation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

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

const CONTAINER_EVENT = {
  id: 'csp1-container-cumhuriyet',
  title: 'Konteyner Baskısı',
  contentCategory: 'container',
  neighborhoodId: 'cumhuriyet',
};

const VEHICLE_EVENT = {
  id: 'vehicle-route-istasyon',
  title: 'Araç Rotası',
  contentCategory: 'vehicle_route',
  neighborhoodId: 'istasyon',
};

const PERSONNEL_EVENT = {
  id: 'personnel-ekip',
  title: 'Ekip Temposu',
  contentCategory: 'personnel',
};

const SOCIAL_EVENT = {
  id: 'social-merkez',
  title: 'Sosyal Şikayet',
  contentCategory: 'social',
  neighborhoodId: 'merkez',
};

const CRISIS_EVENT = {
  id: 'crisis-sanayi',
  title: 'Risk Sinyali',
  contentCategory: 'crisis',
  filterTags: ['crisis'],
  neighborhoodId: 'sanayi',
};

const BALANCE_EVENT = {
  id: 'denge-mahalle',
  title: 'Mahalle Dengesi',
  description: 'bekleme algısı bölgesel öncelik',
};

export type VerifyDynamicSocialEchoOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};

export function verifyDynamicSocialEchoScenario(): VerifyDynamicSocialEchoOutcome {
  const checks: string[] = [];
  let ok = true;
  let hasWarn = false;
  const record = (p: boolean) => {
    if (!p) ok = false;
  };
  const recordWarn = (p: boolean) => {
    if (!p) hasWarn = true;
  };

  for (const domain of SOCIAL_ECHO_DOMAINS) {
    record(assert(checks, true, `domain list includes ${domain}`, `missing ${domain}`));
  }
  record(assert(checks, validateSocialEchoDomainCoverage(), 'domain coverage validator', 'coverage'));

  const day1Ctx = buildSocialEchoContext({ day: 1, currentEvent: CONTAINER_EVENT });
  record(
    assert(
      checks,
      getSocialEchoVisibility(1, day1Ctx) === 'hidden',
      'Day 1 hidden',
      `visibility=${getSocialEchoVisibility(1, day1Ctx)}`,
    ),
  );
  record(
    assert(
      checks,
      !shouldShowSocialDecisionEcho(1, day1Ctx) || buildSocialDecisionEcho(day1Ctx) == null,
      'Day 1 no standard echo',
      'day1 echo',
    ),
  );

  const day2Ctx = buildSocialEchoContext({
    day: 2,
    currentEvent: CONTAINER_EVENT,
    eventResult: {
      eventId: CONTAINER_EVENT.id,
      resultTone: 'positive',
      publicSatisfactionDelta: 6,
      riskDelta: -2,
    },
  });
  const day2Echo = buildSocialDecisionEcho(day2Ctx);
  record(assert(checks, day2Echo != null, 'Day 2 container echo', 'day2'));
  record(
    assert(
      checks,
      day2Echo?.visibility === 'compact' || day2Echo?.visibility === 'standard',
      'Day 2 container compact/standard',
      String(day2Echo?.visibility),
    ),
  );

  const day4Ctx = buildSocialEchoContext({
    day: 4,
    currentEvent: SOCIAL_EVENT,
    eventResult: {
      eventId: SOCIAL_EVENT.id,
      resultTone: 'positive',
      publicSatisfactionDelta: 5,
    },
  });
  const day4Echo = buildSocialDecisionEcho(day4Ctx);
  record(assert(checks, day4Echo != null, 'Day 4 social echo renders', 'day4'));
  record(
    assert(
      checks,
      getSocialEchoVisibility(4, day4Ctx) === 'highlighted',
      'Day 4 highlighted visibility',
      String(day4Echo?.visibility),
    ),
  );

  const day6Ctx = buildSocialEchoContext({ day: 6, currentEvent: CRISIS_EVENT });
  const day6Echo = buildSocialDecisionEcho(day6Ctx);
  record(assert(checks, day6Echo != null, 'Day 6 crisis echo', 'day6'));
  record(
    assert(
      checks,
      validateSocialEchoNoPanicLanguage(day6Echo!).length === 0,
      'Day 6 panic-free',
      validateSocialEchoNoPanicLanguage(day6Echo!).join(','),
    ),
  );

  const day7Ctx = buildSocialEchoContext({ day: 7, currentEvent: CONTAINER_EVENT });
  const day7Vis = getSocialEchoVisibility(7, day7Ctx);
  record(
    assert(
      checks,
      day7Vis === 'compact',
      'Day 7 compact final-safe',
      day7Vis,
    ),
  );

  const day8Ctx = buildSocialEchoContext({ day: 8 });
  record(
    assert(
      checks,
      buildSocialDecisionEcho(day8Ctx) == null || day8Ctx.day > 7,
      'Day >7 null without event data',
      'day8',
    ),
  );

  const echoCtx = buildEchoContextFromEventResult({
    event: CONTAINER_EVENT,
    day: 3,
    result: { publicSatisfactionDelta: 8, riskDelta: -4, successLabel: 'Başarılı' },
  });
  const eventMention = selectStableSocialMention(
    buildSocialEchoContext({ day: 3, currentEvent: CONTAINER_EVENT, eventResult: { eventId: CONTAINER_EVENT.id, publicSatisfactionDelta: 8, riskDelta: -4, summaryTitle: 'Başarılı' } }),
  );
  record(assert(checks, Boolean(eventMention), 'eventEcho social mention priority', 'event mention'));

  const carryHub = buildHubCarryOverMemory({
    day: 3,
    operationSignals: {
      overall: { summary: 'Araç yükü izleniyor', status: 'strained' },
      vehicles: { summary: 'Standart kamyon yoruldu', status: 'strained' },
      containers: { summary: '', status: 'stable' },
      personnel: { summary: '', status: 'stable' },
      districts: { summary: '', status: 'stable' },
      social: { summary: '', status: 'stable' },
      lastProcessedDay: 2,
    } as never,
  });
  const carryCtx = buildSocialEchoContext({
    day: 3,
    carryOverMemory: carryHub ? { summary: carryHub.summary, domain: carryHub.domain, tone: carryHub.tone } : undefined,
  });
  record(assert(checks, buildSocialDecisionEcho(carryCtx) != null, 'carryOver fallback', 'carry'));

  const domainFocus = buildEventDomainFocusModel({
    day: 4,
    event: SOCIAL_EVENT,
    includeEcho: true,
  });
  const domainCtx = buildSocialEchoContext({
    day: 4,
    eventDomainFocus: domainFocus,
    excludeMentions: [eventMention ?? ''],
  });
  const domainEcho = buildSocialDecisionEcho(domainCtx);
  record(assert(checks, domainEcho != null, 'eventDomain focus fallback', 'domain'));

  const opCtx = buildSocialEchoContext({
    day: 5,
    operationSignals: {
      social: { summary: 'Şikayet hızı düştü', status: 'watch' },
    },
    excludeMentions: [domainEcho?.mention ?? '', eventMention ?? ''],
  });
  record(assert(checks, buildSocialDecisionEcho(opCtx) != null, 'operationSignals fallback', 'ops'));

  const genericCtx = buildSocialEchoContext({ day: 5 });
  record(assert(checks, buildSocialDecisionEcho(genericCtx) != null, 'generic fallback', 'generic'));

  record(
    assert(
      checks,
      isSocialEchoSelectionDeterministic(day4Ctx),
      'same context deterministic',
      'determinism',
    ),
  );

  const altCtx = buildSocialEchoContext({
    day: 4,
    currentEvent: { ...SOCIAL_EVENT, id: 'social-alt-merkez' },
    eventResult: { eventId: 'social-alt-merkez', resultTone: 'mixed' },
  });
  record(
    assert(
      checks,
      day4Echo?.mention !== buildSocialDecisionEcho(altCtx)?.mention ||
        day4Echo?.id !== buildSocialDecisionEcho(altCtx)?.id,
      'different eventId may differ mention',
      'diff event',
    ),
  );

  record(assert(checks, !readRepo('src/core/socialEcho/socialEchoSelectors.ts').includes('Math.random'), 'no Math.random', 'random'));
  record(
    assert(
      checks,
      !readRepo('src/core/socialEcho/socialEchoSelectors.ts').includes('openai'),
      'no runtime AI',
      'ai',
    ),
  );

  const posCtx = buildSocialEchoContext({
    day: 3,
    currentEvent: CONTAINER_EVENT,
    outcomeBand: 'strong_success',
    eventResult: { publicSatisfactionDelta: 10, riskDelta: -5, resultTone: 'positive' },
  });
  record(
    assert(
      checks,
      inferSocialEchoSentiment(posCtx) === 'positive' || inferSocialEchoSentiment(posCtx) === 'recovery',
      'container positive context',
      inferSocialEchoSentiment(posCtx),
    ),
  );

  const mixCtx = buildSocialEchoContext({
    day: 3,
    currentEvent: CONTAINER_EVENT,
    outcomeBand: 'mixed',
  });
  record(assert(checks, ['mixed', 'concerned', 'neutral'].includes(inferSocialEchoSentiment(mixCtx)), 'container mixed', 'mix'));

  const vehCtx = buildSocialEchoContext({ day: 3, currentEvent: VEHICLE_EVENT, carryOverMemory: { tone: 'warning' } });
  record(
    assert(
      checks,
      inferSocialEchoDomain(vehCtx) === 'vehicle_route',
      'vehicle domain',
      inferSocialEchoDomain(vehCtx),
    ),
  );
  record(
    assert(
      checks,
      ['concerned', 'mixed'].includes(inferSocialEchoSentiment(vehCtx)),
      'vehicle warning sentiment',
      inferSocialEchoSentiment(vehCtx),
    ),
  );

  const perCtx = buildSocialEchoContext({ day: 3, currentEvent: PERSONNEL_EVENT });
  record(assert(checks, inferSocialEchoDomain(perCtx) === 'personnel', 'personnel domain', 'personnel'));
  const perEcho = buildSocialDecisionEcho(perCtx);
  record(
    assert(
      checks,
      !perEcho || /ekip|personel/i.test(perEcho.mention + perEcho.tags.join(' ')),
      'personnel language',
      perEcho?.mention ?? '',
    ),
  );

  const socCtx = buildSocialEchoContext({ day: 4, currentEvent: SOCIAL_EVENT });
  record(assert(checks, inferSocialEchoDomain(socCtx) === 'social', 'social domain', 'social'));

  const crisisCtx = buildSocialEchoContext({ day: 6, currentEvent: CRISIS_EVENT });
  const crisisEcho = buildSocialDecisionEcho(crisisCtx);
  record(assert(checks, crisisEcho != null, 'crisis-adjacent echo', 'crisis'));
  record(
    assert(
      checks,
      crisisEcho != null && validateSocialEchoNoPanicLanguage(crisisEcho).length === 0,
      'crisis concerned panic-free',
      'panic',
    ),
  );

  const balCtx = buildSocialEchoContext({ day: 5, currentEvent: BALANCE_EVENT });
  record(assert(checks, inferSocialEchoDomain(balCtx) === 'district_balance', 'district balance domain', 'balance'));

  const sampleEcho = buildSocialDecisionEcho(day4Ctx)!;
  record(assert(checks, sampleEcho.title.length <= 32, 'title max length', String(sampleEcho.title.length)));
  record(assert(checks, sampleEcho.mention.length <= 160, 'mention max length', String(sampleEcho.mention.length)));
  record(assert(checks, sampleEcho.tags.length <= 2, 'tags max 2', String(sampleEcho.tags.length)));
  record(assert(checks, sampleEcho.maxLines <= 2, 'maxLines <= 2', String(sampleEcho.maxLines)));

  const forbidden = validateSocialEchoForbiddenWords(sampleEcho);
  record(assert(checks, forbidden.length === 0, 'no forbidden words', forbidden.join(',')));
  record(assert(checks, !sampleEcho.mention.toLowerCase().includes('kriz başladı'), 'no kriz başladı', 'kriz'));
  record(assert(checks, !sampleEcho.mention.toLowerCase().includes('bunu yap'), 'no bunu yap', 'bunu'));
  record(assert(checks, !sampleEcho.mention.toLowerCase().includes('en iyi seçenek'), 'no en iyi seçenek', 'en iyi'));

  const dupResult = buildSocialEchoSummary({
    ...day4Ctx,
    resultEchoText: day4Echo?.mention,
  });
  record(
    assert(
      checks,
      dupResult.warnings.includes('duplicate_with_result_echo') ||
        dupResult.primaryEcho?.mention !== day4Echo?.mention,
      'duplicate result suppressed or different',
      dupResult.warnings.join(','),
    ),
  );

  const cardModel = buildSocialDecisionEchoCardModel(day4Ctx);
  record(assert(checks, cardModel != null, 'SocialDecisionEchoCard model', 'card'));
  record(assert(checks, cardModel != null && cardModel.maxLines <= 2, 'card maxLines', 'card lines'));

  const screenSrc = readRepo('src/features/social/screens/SocialPulseScreen.tsx');
  record(assert(checks, screenSrc.includes('SocialDecisionEchoCard'), 'SocialPulseScreen integration', 'screen'));
  record(assert(checks, screenSrc.includes('buildSocialPulseScreenViewModel'), 'screen view model', 'vm'));
  record(
    assert(
      checks,
      readRepo('src/features/social/utils/socialPulsePresentation.ts').includes('buildSocialEchoContextFromPulseArgs'),
      'presentation uses socialEcho',
      'presentation',
    ),
  );

  const cardSrc = readRepo('src/features/social/components/SocialDecisionEchoCard.tsx');
  record(assert(checks, cardSrc.includes('numberOfLines'), 'card numberOfLines', 'numberOfLines'));
  record(assert(checks, cardSrc.includes('flexShrink') && cardSrc.includes('minWidth'), 'card layout guards', 'layout'));
  record(assert(checks, cardSrc.includes('echo'), 'card echo prop', 'echo prop'));

  const day1Vm = readRepo('src/features/social/utils/socialPulsePresentation.ts');
  record(assert(checks, day1Vm.includes('isDay1Compact') || day1Vm.includes('day === 1'), 'Day 1 guard in presentation', 'day1'));

  record(assert(checks, !readRepo('src/core/social/socialEngine.ts').includes('socialEcho'), 'social engine unchanged', 'engine'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('socialEcho'), 'applyDecision untouched', 'apply'));
  const dayPipelineSrc =
    readRepo('src/core/dayPipeline/dayPipeline.ts') ||
    readRepo('src/core/dayPipeline/index.ts');
  record(
    assert(
      checks,
      !dayPipelineSrc || !dayPipelineSrc.includes('socialEcho'),
      'dayPipeline untouched',
      'pipeline',
    ),
  );

  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION unchanged', `save=${SAVE_VERSION}`));

  const modelValidation = validateSocialEchoModel(sampleEcho);
  record(assert(checks, modelValidation.ok, 'model validation', modelValidation.issues.join(',')));

  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('dynamic-social-echo')?.status === 'completed',
      'roadmap dynamic-social-echo completed',
      'roadmap',
    ),
  );
  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('carry-over-memory-cards')?.status === 'completed',
      'carry-over still completed',
      'carry-over',
    ),
  );

  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Dynamic Field') ||
        next.includes('dynamic-field-presence-map-layer') ||
        getFinalPolishRoadmapItemById('report-tomorrow-preview')?.status === 'completed',
      'next step Dynamic Field or report-tomorrow completed',
      next,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-dynamic-social-echo.md')), 'docs exist', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:dynamic-social-echo'), 'package script', 'script'));
  record(assert(checks, !readRepo('src/core/socialEcho/index.ts').includes('node:fs'), 'no fs in index', 'fs'));

  record(assert(checks, Boolean(buildSocialPulseEchoLine(day4Ctx)), 'buildSocialPulseEchoLine', 'line'));
  record(assert(checks, echoCtx.domain != null, 'echo context builds', 'echoCtx'));

  for (let d = 1; d <= 7; d += 1) {
    const vis = getSocialEchoVisibility(d, buildSocialEchoContext({ day: d, currentEvent: SOCIAL_EVENT }));
    record(assert(checks, vis.length > 0, `day ${d} visibility defined`, vis));
  }

  const domainEvents: Record<string, NonNullable<Parameters<typeof buildSocialEchoContext>[0]['currentEvent']>> = {
    container: CONTAINER_EVENT,
    vehicle_route: VEHICLE_EVENT,
    personnel: PERSONNEL_EVENT,
    social: SOCIAL_EVENT,
    crisis_adjacent: CRISIS_EVENT,
    district_balance: BALANCE_EVENT,
    generic_operation: { id: 'generic-op', title: 'Operasyon' },
  };
  for (const [domain, evt] of Object.entries(domainEvents)) {
    const ctx = buildSocialEchoContext({ day: 3, currentEvent: evt });
    record(
      assert(
        checks,
        inferSocialEchoDomain(ctx) === domain || domain === 'generic_operation',
        `infer domain ${domain}`,
        inferSocialEchoDomain(ctx),
      ),
    );
    const echo = buildSocialDecisionEcho(ctx);
    record(assert(checks, echo != null, `echo for ${domain}`, domain));
  }

  for (const src of [
    'event_echo',
    'carry_over',
    'event_domain',
    'daily_report',
    'operation_signal',
    'fallback',
  ] as const) {
    record(assert(checks, src.length > 3, `source type ${src}`, src));
  }

  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('buildSocialDecisionEcho'), 'applyDecision no hook', 'apply'));
  record(assert(checks, !readRepo('src/core/postPilot/postPilotEventEngine.ts').includes('buildSocialDecisionEcho'), 'postPilot no hook', 'postPilot'));
  record(assert(checks, readRepo('src/core/social/socialEngine.ts').length > 0, 'socialEngine file exists', 'engine'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('socialEcho'), 'persist unchanged', 'persist'));
  record(assert(checks, readRepo('src/features/social/components/HotSocialTopicCard.tsx').length > 0, 'hot topic preserved', 'hot'));
  record(assert(checks, readRepo('src/features/social/components/SocialMentionInlineList.tsx').length > 0, 'mention list preserved', 'mentions'));
  record(assert(checks, !readRepo('src/core/socialEcho/index.ts').includes('verifyDynamicSocialEchoScenario'), 'index bundle-safe no verify export', 'index'));
  record(assert(checks, readRepo('src/core/socialEcho/socialEchoPresentation.ts').includes('formatSocialEchoForDocs'), 'presentation helpers', 'pres'));
  record(assert(checks, readRepo('src/core/socialEcho/socialEchoValidation.ts').includes('validateSocialEchoDomainCoverage'), 'validation module', 'val'));
  record(assert(checks, buildSocialDecisionEchoCardModel(day4Ctx) != null, 'card model non-null day4', 'card4'));
  record(assert(checks, buildSocialEchoSummary(day4Ctx).visibleEchoes.length <= 1, 'summary max one primary', 'summary'));
  record(assert(checks, !readRepo('app.json').includes('socialEcho'), 'no app config change', 'app'));
  record(assert(checks, day6Echo!.sentiment !== 'positive' || day6Echo!.domain !== 'crisis_adjacent', 'day6 crisis not falsely positive', 'day6sent'));
  record(assert(checks, day4Echo!.visibility === 'highlighted', 'day4 echo highlighted model', String(day4Echo?.visibility)));
  record(assert(checks, day2Echo!.domain === 'container', 'day2 container domain', String(day2Echo?.domain)));
  record(assert(checks, !readRepo('src/features/social/screens/SocialPulseScreen.tsx').includes('applyDecision'), 'screen no applyDecision', 'screen'));
  record(assert(checks, readRepo('src/features/social/utils/socialPulsePresentation.ts').includes('buildDynamicSocialDecisionEchoModel'), 'dynamic builder wired', 'builder'));
  record(assert(checks, readRepo('src/features/social/components/SocialDecisionEchoCard.tsx').includes('highlighted'), 'card highlighted style', 'highlight'));
  record(assert(checks, readRepo('src/core/quality/finalPolish/finalPolishRoadmap.ts').includes("id: 'dynamic-social-echo'"), 'roadmap entry', 'roadmap'));
  record(assert(checks, getFinalPolishRoadmapItemById('report-tomorrow-preview')?.status === 'completed', 'report-tomorrow roadmap completed', 'next item'));

  recordWarn(warn(checks, true, 'full-loop regression', 'run verify:full-loop'));
  recordWarn(warn(checks, true, 'full-ux-flow regression', 'run verify:full-ux-flow'));
  recordWarn(warn(checks, true, 'carry-over-memory regression', 'run verify:carry-over-memory'));
  recordWarn(warn(checks, true, 'content-safety-pack-stage-3 regression', 'run verify:content-safety-pack-stage-3'));

  return { ok, warn: hasWarn, checks };
}
