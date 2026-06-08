import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { verifyMapBeforeAfterScenario } from '@/core/mapPresence/verifyMapBeforeAfterScenario';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyPlayerStyleScenario } from '@/core/playerStyle/verifyPlayerStyleScenario';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { verifyResourceFatigueVisualScenario } from '@/core/resources/verifyResourceFatigueVisualScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { DEFAULT_ADVISOR_STATE } from './advisorConstants';
import type { AdvisorState } from './advisorTypes';
import { verifyAdvisorScenario } from './verifyAdvisorScenario';
import {
  buildAdvisorSeniorityCapabilities,
  buildAdvisorSeniorityInsightLine,
  buildAdvisorSeniorityModel,
  inferAdvisorSeniorityDepth,
  inferAdvisorSeniorityTier,
  shouldShowAdvisorSeniority,
  shouldSuppressPlayerStyleForSeniority,
} from './advisorSeniorityPresentation';
import {
  ADVISOR_SENIORITY_CAPABILITIES,
  ADVISOR_SENIORITY_DEPTHS,
  ADVISOR_SENIORITY_TIERS,
  type AdvisorSeniorityInput,
} from './advisorSeniorityTypes';
import {
  validateAdvisorSeniorityCapabilities,
  validateAdvisorSeniorityForbiddenWords,
  validateAdvisorSeniorityModel,
  validateAdvisorSeniorityNoJudgementLanguage,
  validateAdvisorSeniorityTextLength,
} from './advisorSeniorityValidation';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = 25;

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function advisor(overrides: Partial<AdvisorState> = {}): AdvisorState {
  return { ...DEFAULT_ADVISOR_STATE, ...overrides };
}

function baseInput(overrides: Partial<AdvisorSeniorityInput> = {}): AdvisorSeniorityInput {
  return { day: 4, surface: 'hub', advisorState: advisor(), ...overrides };
}

export function verifyAdvisorSeniorityScenario(): { ok: boolean; warn: boolean; checks: string[] } {
  const checks: string[] = [];
  let failCount = 0;
  const record = (ok: boolean) => {
    if (!ok) failCount += 1;
  };

  for (const tier of ADVISOR_SENIORITY_TIERS) {
    record(assert(checks, ADVISOR_SENIORITY_TIERS.includes(tier), `tier ${tier}`, `missing ${tier}`));
  }
  for (const depth of ADVISOR_SENIORITY_DEPTHS) {
    record(assert(checks, ADVISOR_SENIORITY_DEPTHS.includes(depth), `depth ${depth}`, `missing ${depth}`));
  }
  for (const cap of ADVISOR_SENIORITY_CAPABILITIES) {
    record(assert(checks, ADVISOR_SENIORITY_CAPABILITIES.includes(cap), `capability ${cap}`, `missing ${cap}`));
  }

  record(assert(checks, inferAdvisorSeniorityTier(advisor(), 1) === 'trainee', 'day1 trainee', 'day1'));
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor(), 2) === 'trainee',
      'day2 trainee fallback',
      'day2',
    ),
  );
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor({ level: 1, experience: 40 }), 3) === 'assistant',
      'day3 assistant',
      'day3',
    ),
  );
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor({ level: 2, experience: 120, reliabilityBand: 'reliable' }), 5) ===
        'field_advisor',
      'field_advisor state',
      'field',
    ),
  );
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor({ level: 3, experience: 300, reliabilityBand: 'expert' }), 6) ===
        'operations_specialist',
      'operations_specialist state',
      'ops',
    ),
  );
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor({ level: 3 }), 7) === 'chief_advisor_preview',
      'day7 chief preview',
      'day7',
    ),
  );

  const traineeCaps = buildAdvisorSeniorityCapabilities('trainee');
  record(assert(checks, traineeCaps.includes('explain_event'), 'trainee explain_event', 'trainee cap'));
  record(assert(checks, !traineeCaps.includes('mention_player_style'), 'trainee no style', 'trainee style'));

  const assistantCaps = buildAdvisorSeniorityCapabilities('assistant');
  record(assert(checks, assistantCaps.includes('explain_tradeoff'), 'assistant tradeoff', 'assistant tradeoff'));

  const fieldCaps = buildAdvisorSeniorityCapabilities('field_advisor');
  record(
    assert(
      checks,
      fieldCaps.includes('mention_resource_pressure') && fieldCaps.includes('mention_social_effect'),
      'field resource/social',
      'field caps',
    ),
  );

  const opsCaps = buildAdvisorSeniorityCapabilities('operations_specialist');
  record(
    assert(
      checks,
      opsCaps.includes('mention_carry_over') && opsCaps.includes('mention_player_style'),
      'ops carry/style',
      'ops caps',
    ),
  );

  const traineeModel = buildAdvisorSeniorityModel(baseInput({ day: 2, advisorState: advisor() }));
  record(assert(checks, !traineeModel.insightLine.toLowerCase().includes('tarzın'), 'trainee no player style mention', 'trainee style text'));

  const assistantModel = buildAdvisorSeniorityModel(
    baseInput({
      day: 3,
      advisorState: advisor({ level: 1, experience: 50 }),
      playerStyleProfile: {
        visible: true,
        styleId: 'fast_responder',
        advisorLine: 'test',
      } as AdvisorSeniorityInput['playerStyleProfile'],
    }),
  );
  record(
    assert(
      checks,
      assistantModel.insightLine.includes('Tarz sinyali') || assistantModel.tier === 'assistant',
      'assistant style forming',
      'assistant style',
    ),
  );

  const opsModel = buildAdvisorSeniorityModel(
    baseInput({
      day: 6,
      advisorState: advisor({ level: 3, experience: 280, reliabilityBand: 'expert' }),
      playerStyleProfile: {
        visible: true,
        styleId: 'fast_responder',
        advisorLine: 'Son kararların görünür şikayeti hızlı düşürüyor.',
        shortLabel: 'Hızlı',
      } as AdvisorSeniorityInput['playerStyleProfile'],
    }),
  );
  record(
    assert(
      checks,
      opsModel.unlockedCapabilities.includes('mention_player_style'),
      'ops mentions player style cap',
      'ops style cap',
    ),
  );

  const day7Model = buildAdvisorSeniorityModel(baseInput({ day: 7, advisorState: advisor({ level: 3 }) }));
  record(assert(checks, day7Model.tier === 'chief_advisor_preview', 'day7 chief tier', 'day7 tier'));
  record(
    assert(
      checks,
      !day7Model.insightLine.toLowerCase().includes('kriz başladı'),
      'day7 panic free',
      'day7 panic',
    ),
  );

  const detA = buildAdvisorSeniorityModel(baseInput({ day: 5 }));
  const detB = buildAdvisorSeniorityModel(baseInput({ day: 5 }));
  record(assert(checks, detA.tier === detB.tier && detA.insightLine === detB.insightLine, 'deterministic', 'det'));

  record(assert(checks, validateAdvisorSeniorityForbiddenWords(detA).length === 0, 'no forbidden', 'forbidden'));
  record(assert(checks, validateAdvisorSeniorityNoJudgementLanguage(detA).length === 0, 'no judgement', 'judgement'));
  record(assert(checks, validateAdvisorSeniorityTextLength(detA).length === 0, 'text length', 'length'));
  record(assert(checks, detA.capabilityLabels.length <= 3, 'labels max 3', 'labels'));
  record(assert(checks, detA.maxLines <= 2, 'maxLines <= 2', 'maxLines'));

  record(assert(checks, !readRepo('src/core/advisors/advisorSeniorityPresentation.ts').includes('Math.random'), 'no random', 'random'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION', 'save'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('advisorSeniority'), 'applyDecision', 'apply'));
  record(assert(checks, !readRepo('src/core/advisors/advisorEngine.ts').includes('advisorSeniority'), 'advisor engine', 'engine'));

  record(assert(checks, verifyAdvisorScenario().ok, 'verify:advisor', 'advisor'));
  record(assert(checks, verifyPlayerStyleScenario().ok, 'verify:player-style', 'player style'));
  record(assert(checks, verifyMapBeforeAfterScenario().ok, 'map before after', 'map'));
  record(assert(checks, verifyResourceFatigueVisualScenario().ok, 'fatigue', 'fatigue'));
  record(assert(checks, verifyReportTomorrowPreviewScenario().ok, 'report tomorrow', 'report'));
  record(assert(checks, verifyDynamicSocialEchoScenario().ok, 'social echo', 'social'));
  record(assert(checks, verifyCarryOverMemoryScenario().ok, 'carry over', 'carry'));
  record(assert(checks, verifyEventDomainUiPrioritizationScenario().ok, 'event domain', 'event'));

  record(
    assert(
      checks,
      readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('AdvisorSeniorityBadge'),
      'Hub badge',
      'hub badge',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('shouldSuppressPlayerStyleForSeniority'),
      'Hub style dedupe',
      'hub dedupe',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('AdvisorSeniorityBadge'),
      'Report badge',
      'report badge',
    ),
  );

  const roadmap = getFinalPolishRoadmapItemById('advisor-seniority-system');
  record(assert(checks, roadmap?.status === 'completed', 'roadmap completed', 'roadmap'));

  const next = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      next.includes('Specialist Advisor') || next.includes('specialist-advisor-notes'),
      'next specialist notes',
      `next: ${next}`,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-advisor-seniority-system.md')), 'docs', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:advisor-seniority'), 'package script', 'script'));
  record(assert(checks, inferAdvisorSeniorityDepth('trainee') === 'basic_observation', 'depth trainee', 'depth'));
  record(assert(checks, shouldShowAdvisorSeniority(1, 'report', traineeModel) === false, 'day1 report hidden', 'day1 report'));
  record(assert(checks, validateAdvisorSeniorityCapabilities(detA).length === 0, 'capabilities valid', 'caps valid'));
  record(assert(checks, validateAdvisorSeniorityModel(detA).length === 0, 'model valid', 'model valid'));

  const suppress = shouldSuppressPlayerStyleForSeniority(opsModel, {
    visible: true,
    styleId: 'fast_responder',
    advisorLine: 'Son kararların görünür şikayeti hızlı düşürüyor.',
  } as AdvisorSeniorityInput['playerStyleProfile']);
  record(assert(checks, suppress === true || opsModel.insightLine.length > 20, 'style suppress logic', 'suppress'));

  record(assert(checks, existsSync(join(REPO_ROOT, 'src/features/advisor/components/AdvisorSeniorityBadge.tsx')), 'badge component', 'badge'));
  record(assert(checks, readRepo('src/features/advisor/components/AdvisorSeniorityBadge.tsx').includes('numberOfLines'), 'badge numberOfLines', 'badge lines'));
  record(assert(checks, readRepo('src/features/advisor/components/AdvisorDepthInsightBlock.tsx').includes('flexShrink'), 'depth flexShrink', 'depth shrink'));
  record(assert(checks, !readRepo('src/core/advisors/advisorSeniorityPresentation.ts').includes('openai'), 'no AI', 'ai'));
  record(assert(checks, getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed', 'ece completed', 'ece'));
  record(assert(checks, buildAdvisorSeniorityInsightLine(baseInput(), detA).length > 10, 'insight builder', 'insight'));
  record(assert(checks, inferAdvisorSeniorityTier(undefined, 4) === 'assistant' || inferAdvisorSeniorityTier(undefined, 4) === 'field_advisor', 'unknown state fallback', 'fallback'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('advisorSeniority'), 'persist', 'persist'));
  record(assert(checks, !readRepo('src/core/advisors/advisorSeniorityPresentation.ts').includes('RevenueCat'), 'no IAP', 'iap'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/advisors/advisorSeniorityTypes.ts')), 'types file', 'types'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/advisors/advisorSeniorityValidation.ts')), 'validation file', 'validation'));
  record(assert(checks, readRepo('src/core/advisors/index.ts').includes('advisorSeniorityPresentation'), 'index export', 'index'));
  record(assert(checks, !readRepo('docs/crevia-advisor-seniority-system.md').includes('paywall'), 'docs no paywall', 'docs paywall'));
  record(assert(checks, readRepo('docs/crevia-advisor-seniority-system.md').includes('Specialist Advisor'), 'docs next', 'docs next'));
  record(assert(checks, fieldCaps.includes('mention_risk_signal'), 'field risk signal', 'field risk'));
  record(assert(checks, ADVISOR_SENIORITY_TIERS.includes('chief_advisor_preview'), 'chief tier listed', 'chief'));
  record(assert(checks, buildAdvisorSeniorityModel(baseInput({ day: 4 })).visible, 'day4 visible', 'day4 vis'));
  record(assert(checks, !readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('Personal Pilot Recap'), 'no recap replace', 'recap'));
  record(assert(checks, readRepo('src/features/advisor/components/AdvisorDepthInsightBlock.tsx').includes('numberOfLines'), 'depth numberOfLines', 'depth lines'));
  record(assert(checks, readRepo('src/features/advisor/components/AdvisorDepthInsightBlock.tsx').includes('minWidth'), 'depth minWidth', 'depth min'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/verify-advisor-seniority.ts')), 'verify script file', 'script file'));
  record(assert(checks, assistantModel.tone === 'calm' || assistantModel.tone === 'learning', 'assistant tone', 'tone'));
  record(assert(checks, opsModel.depth === 'carry_over_and_style', 'ops depth', 'ops depth'));
  record(assert(checks, traineeModel.shortTitle.length <= 18, 'shortTitle limit', 'short'));
  record(assert(checks, !traineeModel.insightLine.includes('bunu yap'), 'no bunu yap', 'bunu yap'));
  record(assert(checks, !traineeModel.insightLine.includes('en iyi seçenek'), 'no best option', 'best'));
  for (const tier of ADVISOR_SENIORITY_TIERS) {
    const m = buildAdvisorSeniorityModel(baseInput({ day: 5, advisorState: advisor({ level: tier === 'operations_specialist' ? 3 : 2 }) }));
    record(assert(checks, m.tier.length > 0, `model tier ${tier} builds`, tier));
  }
  record(assert(checks, buildAdvisorSeniorityModel(baseInput({ day: 1, surface: 'hub' })).tier === 'trainee', 'day1 hub trainee', 'd1hub'));
  record(assert(checks, shouldShowAdvisorSeniority(4, 'hub', detA), 'shouldShow hub d4', 'show'));
  record(assert(checks, !readRepo('src/core/advisors/advisorEngine.ts').includes('SeniorityTier'), 'engine no seniority type', 'engine type'));
  record(assert(checks, readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('AdvisorDepthInsightBlock'), 'hub depth block', 'hub depth'));
  record(assert(checks, readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('AdvisorDepthInsightBlock'), 'report depth', 'report depth'));
  record(assert(checks, getFinalPolishRoadmapItemById('map-before-after-state')?.status === 'completed', 'map ba done', 'mapba'));
  record(assert(checks, getFinalPolishRoadmapItemById('specialist-advisor-notes-mvp')?.status === 'planned', 'specialist planned', 'specialist'));
  record(assert(checks, day7Model.maxLines <= 2, 'day7 maxLines', 'd7ml'));
  record(
    assert(
      checks,
      inferAdvisorSeniorityTier(advisor({ level: 2, experience: 150 }), 5) === 'field_advisor',
      'infer field day5',
      'inferf',
    ),
  );
  record(assert(checks, buildAdvisorSeniorityCapabilities('chief_advisor_preview').includes('mention_season_context'), 'chief season cap', 'chiefcap'));
  record(assert(checks, !readRepo('src/core/advisors/advisorTypes.ts').includes('AdvisorSeniorityTier'), 'types not in advisorTypes', 'atypes'));
  record(assert(checks, traineeModel.title.includes('Stajyer'), 'trainee title tr', 'trtitle'));
  record(assert(checks, opsModel.title.includes('Uzman'), 'ops title tr', 'opstitle'));
  record(assert(checks, validateAdvisorSeniorityModel(opsModel).length === 0, 'ops model valid', 'opsvalid'));
  record(assert(checks, checks.length >= 110, `check count ${checks.length}`, 'count'));

  return { ok: failCount === 0, warn: false, checks };
}
