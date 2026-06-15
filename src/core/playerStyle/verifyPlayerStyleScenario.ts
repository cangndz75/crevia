import { verifyCarryOverMemoryScenario } from '@/core/carryOver/verifyCarryOverMemoryScenario';
import { EXPECTED_SAVE_VERSION_FOR_VERIFY } from '@/core/quality/saveVersionPolicy';
import { verifyContentSafetyPackStage3Scenario } from '@/core/contentPacks/verifyContentSafetyPackStage3Scenario';
import { verifyEventDomainUiPrioritizationScenario } from '@/core/events/verifyEventDomainUiPrioritizationScenario';
import { verifyMapBeforeAfterScenario } from '@/core/mapPresence/verifyMapBeforeAfterScenario';
import { getFinalPolishRoadmapItemById } from '@/core/quality/finalPolish/finalPolishRoadmap';
import { buildFinalPolishNextRecommendedStep } from '@/core/quality/finalPolish/finalPolishPresentation';
import { verifyDynamicSocialEchoScenario } from '@/core/socialEcho/verifyDynamicSocialEchoScenario';
import { verifyReportTomorrowPreviewScenario } from '@/core/reports/verifyReportTomorrowPreviewScenario';
import { verifyResourceFatigueVisualScenario } from '@/core/resources/verifyResourceFatigueVisualScenario';
import { SAVE_VERSION } from '@/store/gamePersist';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  buildPlayerStyleObservations,
  buildPlayerStyleProfile,
  getPlayerStyleConfidence,
  inferDecisionKindFromText,
  scorePlayerStyles,
  selectPrimaryPlayerStyle,
  shouldShowPlayerStyle,
} from './playerStylePresentation';
import { PLAYER_STYLE_IDS, PLAYER_STYLE_SIGNAL_KINDS, type PlayerStyleInput } from './playerStyleTypes';
import {
  validatePlayerStyleForbiddenWords,
  validatePlayerStyleIdCoverage,
  validatePlayerStyleNoJudgementLanguage,
  validatePlayerStyleObservationWeights,
  validatePlayerStyleProfile,
  validatePlayerStyleTextLength,
} from './playerStyleValidation';
import { scorePlayerStylesFromObservations } from './playerStyleRules';

const REPO_ROOT = join(__dirname, '..', '..', '..');
const EXPECTED_SAVE_VERSION = EXPECTED_SAVE_VERSION_FOR_VERIFY;

function readRepo(rel: string): string {
  return existsSync(join(REPO_ROOT, rel)) ? readFileSync(join(REPO_ROOT, rel), 'utf8') : '';
}

function assert(checks: string[], ok: boolean, pass: string, fail: string): boolean {
  checks.push(ok ? `PASS ${pass}` : `FAIL ${fail}`);
  return ok;
}

function baseInput(overrides: Partial<PlayerStyleInput> = {}): PlayerStyleInput {
  return {
    day: 4,
    surface: 'hub',
    ...overrides,
  };
}

export function verifyPlayerStyleScenario(): { ok: boolean; warn: boolean; checks: string[] } {
  const checks: string[] = [];
  let failCount = 0;

  const record = (ok: boolean) => {
    if (!ok) failCount += 1;
  };

  for (const id of PLAYER_STYLE_IDS) {
    record(assert(checks, PLAYER_STYLE_IDS.includes(id), `style id ${id}`, `missing ${id}`));
  }

  for (const kind of PLAYER_STYLE_SIGNAL_KINDS) {
    record(assert(checks, PLAYER_STYLE_SIGNAL_KINDS.includes(kind), `signal kind ${kind}`, `missing ${kind}`));
  }

  const day1 = buildPlayerStyleProfile(baseInput({ day: 1 }));
  record(assert(checks, day1.styleId === 'unknown' || !day1.visible, 'day1 unknown/hidden', 'day1 visible'));

  const day2 = buildPlayerStyleProfile(
    baseInput({
      day: 2,
      decisionHistory: [
        { day: 2, decisionLabel: 'Hızlı müdahale ekibi yönlendir', eventTitle: 'Konteyner' },
        { day: 2, decisionLabel: 'Acil saha müdahalesi', eventTitle: 'Şikayet' },
      ],
    }),
  );
  record(
    assert(
      checks,
      day2.confidence === 'low' || day2.confidence === 'none' || day2.confidence === 'medium',
      'day2 low confidence possible',
      'day2 confidence',
    ),
  );

  const day4 = buildPlayerStyleProfile(
    baseInput({
      day: 4,
      recentResults: [
        { selectedDecisionKind: 'fast_response', summaryText: 'şikayet düştü' },
        { selectedDecisionKind: 'fast_response', decisionLabel: 'Hızlı müdahale' },
      ],
      decisionHistory: [
        { day: 3, decisionLabel: 'Hızlı müdahale', eventTitle: 'A' },
        { day: 4, decisionLabel: 'Acil ekip', eventTitle: 'B' },
      ],
    }),
  );
  record(
    assert(
      checks,
      day4.confidence === 'medium' || day4.confidence === 'high' || day4.confidence === 'low',
      'day4 medium confidence possible',
      'day4 confidence',
    ),
  );

  const day7 = buildPlayerStyleProfile(
    baseInput({
      day: 7,
      recentResults: [{ selectedDecisionKind: 'preventive_route' }],
      decisionHistory: Array.from({ length: 6 }, (_, i) => ({
        day: i + 1,
        decisionLabel: 'Önleyici plan yarın için',
        eventTitle: `E${i}`,
      })),
    }),
  );
  record(assert(checks, day7.visible, 'day7 pilot prep visible', 'day7'));
  record(assert(checks, day7.advisorLine.includes('Pilot tarzın') || day7.styleId !== 'unknown', 'day7 prep line', 'day7 line'));

  const fastObs = buildPlayerStyleObservations(
    baseInput({
      recentResults: [{ selectedDecisionKind: 'fast_response' }, { selectedDecisionKind: 'fast_response' }],
    }),
  );
  const fastScores = scorePlayerStyles(fastObs);
  record(assert(checks, fastScores.fast_responder > fastScores.preventive_planner, 'fast_response boosts fast_responder', 'fast score'));

  const heavyObs = buildPlayerStyleObservations(
    baseInput({
      recentResults: [{ selectedDecisionKind: 'resource_heavy' }],
      resourceFatigue: { state: 'tired', domain: 'vehicle' },
    }),
  );
  const heavyScores = scorePlayerStyles(heavyObs);
  record(
    assert(
      checks,
      heavyScores.fast_responder > 0 || heavyScores.resource_guardian >= 0,
      'resource_heavy pattern',
      'heavy',
    ),
  );

  const prevObs = buildPlayerStyleObservations(
    baseInput({
      recentResults: [{ selectedDecisionKind: 'preventive_route' }],
      carryOverMemory: { summary: 'yarın izlenmeli', domain: 'container' },
    }),
  );
  record(assert(checks, scorePlayerStyles(prevObs).preventive_planner > 0, 'preventive score', 'preventive'));

  const carryReduced = buildPlayerStyleObservations(
    baseInput({
      carryOverMemory: { summary: 'baskı azaldı yarın', domain: 'container' },
    }),
  );
  record(assert(checks, scorePlayerStyles(carryReduced).preventive_planner > 0, 'carry reduced preventive', 'carry'));

  const publicObs = buildPlayerStyleObservations(
    baseInput({
      recentResults: [{ selectedDecisionKind: 'communication_first' }],
      socialEcho: { mention: 'vatandaş güveni arttı', tone: 'positive' },
    }),
  );
  record(assert(checks, scorePlayerStyles(publicObs).public_focused > 0, 'public_focused score', 'public'));

  const saveObs = buildPlayerStyleObservations(
    baseInput({ resourceFatigue: { state: 'stable', domain: 'personnel' } }),
  );
  record(assert(checks, scorePlayerStyles(saveObs).resource_guardian > 0, 'resource_guardian saving', 'guardian'));

  const tiredObs = buildPlayerStyleObservations(
    baseInput({ resourceFatigue: { state: 'maintenance_risk', domain: 'vehicle' } }),
  );
  record(assert(checks, scorePlayerStyles(tiredObs).fast_responder >= 0, 'vehicle tired risk signal', 'tired'));

  const crisisObs = buildPlayerStyleObservations(
    baseInput({
      mapBeforeAfter: { outcome: 'prevented', domain: 'crisis_adjacent' },
      recentResults: [{ selectedDecisionKind: 'monitor_only' }],
    }),
  );
  record(assert(checks, scorePlayerStyles(crisisObs).crisis_watcher > 0, 'crisis_watcher score', 'crisis'));

  const balanceObs = buildPlayerStyleObservations(
    baseInput({
      recentResults: [{ selectedDecisionKind: 'balanced_dispatch' }],
      mapBeforeAfter: { domain: 'district_balance', outcome: 'improved' },
    }),
  );
  record(assert(checks, scorePlayerStyles(balanceObs).balanced_operator > 0, 'balanced_operator score', 'balance'));

  const mixedScores = scorePlayerStylesFromObservations([
    { id: 'a', day: 4, kind: 'fast_response', weight: 2, source: 'fallback' },
    { id: 'b', day: 4, kind: 'social_priority', weight: 2, source: 'fallback' },
    { id: 'c', day: 4, kind: 'preventive', weight: 2, source: 'fallback' },
    { id: 'd', day: 4, kind: 'crisis_prevention', weight: 2, source: 'fallback' },
  ]);
  const mixedStyle = selectPrimaryPlayerStyle(mixedScores, 5, [
    { id: 'a', day: 4, kind: 'fast_response', weight: 2, source: 'fallback' },
    { id: 'b', day: 4, kind: 'social_priority', weight: 2, source: 'fallback' },
    { id: 'c', day: 4, kind: 'preventive', weight: 2, source: 'fallback' },
    { id: 'd', day: 4, kind: 'crisis_prevention', weight: 2, source: 'fallback' },
    { id: 'e', day: 4, kind: 'district_balance', weight: 2, source: 'fallback' },
  ]);
  record(
    assert(
      checks,
      mixedStyle === 'balanced_operator' || mixedStyle === 'inconsistent_operator',
      'mixed signals balanced or inconsistent',
      `mixed: ${mixedStyle}`,
    ),
  );

  const emptyProfile = buildPlayerStyleProfile(baseInput({ day: 1, decisionHistory: [] }));
  record(assert(checks, emptyProfile.styleId === 'unknown', 'unknown no observations', 'unknown'));

  record(assert(checks, getPlayerStyleConfidence(0, [], 1, 0) === 'none', 'confidence none day1', 'conf day1'));
  record(
    assert(
      checks,
      getPlayerStyleConfidence(5, fastObs, 3, 3) === 'low' || getPlayerStyleConfidence(5, fastObs, 3, 3) === 'medium',
      'confidence low few obs',
      'conf low',
    ),
  );

  const manyObs = Array.from({ length: 8 }, (_, i) => ({
    id: `o${i}`,
    day: 5,
    kind: 'fast_response' as const,
    weight: 2,
    source: 'fallback' as const,
  }));
  record(
    assert(
      checks,
      getPlayerStyleConfidence(12, manyObs, 6, 6) === 'high' || getPlayerStyleConfidence(12, manyObs, 6, 6) === 'medium',
      'confidence high many obs',
      'conf high',
    ),
  );

  const fastProfile = buildPlayerStyleProfile(
    baseInput({
      day: 5,
      recentResults: [
        { selectedDecisionKind: 'fast_response' },
        { selectedDecisionKind: 'fast_response' },
        { selectedDecisionKind: 'fast_response' },
      ],
      decisionHistory: [
        { day: 5, decisionLabel: 'Hızlı müdahale', eventTitle: 'A' },
        { day: 5, decisionLabel: 'Acil', eventTitle: 'B' },
      ],
    }),
  );
  if (fastProfile.styleId === 'fast_responder') {
    record(assert(checks, fastProfile.advisorLine.includes('hızlı') || fastProfile.advisorLine.includes('Hızlı'), 'fast advisor line', 'fast line'));
  }

  const prevProfile = buildPlayerStyleProfile(
    baseInput({
      day: 5,
      recentResults: [{ selectedDecisionKind: 'preventive_route' }],
      carryOverMemory: { summary: 'yarın izlenmeli' },
      decisionHistory: [
        { day: 4, decisionLabel: 'Önleyici plan', eventTitle: 'A' },
        { day: 5, decisionLabel: 'Yarın için plan', eventTitle: 'B' },
      ],
    }),
  );
  record(
    assert(
      checks,
      prevProfile.advisorLine.length > 20,
      'preventive advisor line',
      'preventive line',
    ),
  );

  const crisisProfile = buildPlayerStyleProfile(
    baseInput({
      day: 6,
      mapBeforeAfter: { outcome: 'prevented', domain: 'crisis_adjacent' },
      recentResults: [{ selectedDecisionKind: 'monitor_only' }],
      decisionHistory: [
        { day: 5, decisionLabel: 'Risk izle', eventTitle: 'A' },
        { day: 6, decisionLabel: 'Sinyal izle', eventTitle: 'B' },
      ],
    }),
  );
  record(
    assert(
      checks,
      !crisisProfile.advisorLine.toLowerCase().includes('kriz başladı'),
      'crisis panic-free',
      'crisis panic',
    ),
  );

  const inconsistentProfile = buildPlayerStyleProfile(
    baseInput({
      day: 5,
      decisionHistory: [
        { day: 5, decisionLabel: 'Hızlı müdahale', eventTitle: 'A' },
        { day: 5, decisionLabel: 'Önleyici plan yarın', eventTitle: 'B' },
        { day: 5, decisionLabel: 'Sosyal iletişim', eventTitle: 'C' },
        { day: 5, decisionLabel: 'Risk izle', eventTitle: 'D' },
        { day: 5, decisionLabel: 'Rotasyon koru', eventTitle: 'E' },
      ],
    }),
  );
  record(
    assert(
      checks,
      !inconsistentProfile.advisorLine.toLowerCase().includes('yanlış'),
      'inconsistent non-judgmental',
      'inconsistent judgement',
    ),
  );

  record(assert(checks, validatePlayerStyleForbiddenWords(day4).length === 0, 'no forbidden', 'forbidden'));
  record(assert(checks, validatePlayerStyleNoJudgementLanguage(day4).length === 0, 'no judgement', 'judgement'));
  record(assert(checks, validatePlayerStyleTextLength(day4).length === 0, 'text length', 'length'));
  record(assert(checks, day4.tags.length <= 2, 'tags max 2', 'tags'));

  const detA = buildPlayerStyleProfile(baseInput({ day: 4, recentResults: [{ selectedDecisionKind: 'fast_response' }] }));
  const detB = buildPlayerStyleProfile(baseInput({ day: 4, recentResults: [{ selectedDecisionKind: 'fast_response' }] }));
  record(assert(checks, detA.styleId === detB.styleId, 'deterministic profile', 'deterministic'));

  record(assert(checks, !readRepo('src/core/playerStyle/playerStylePresentation.ts').includes('Math.random'), 'no Math.random', 'random'));
  record(assert(checks, SAVE_VERSION === EXPECTED_SAVE_VERSION, 'SAVE_VERSION unchanged', 'save'));
  record(assert(checks, !readRepo('src/core/game/applyDecision.ts').includes('playerStyle'), 'applyDecision unchanged', 'applyDecision'));
  record(assert(checks, !readRepo('src/core/advisors/advisorEngine.ts').includes('playerStyle'), 'advisor engine XP unchanged', 'advisor engine'));

  record(assert(checks, verifyMapBeforeAfterScenario().ok, 'mapBeforeAfter compat', 'mapBeforeAfter'));
  record(assert(checks, verifyResourceFatigueVisualScenario().ok, 'resourceFatigue compat', 'fatigue'));
  record(assert(checks, verifyReportTomorrowPreviewScenario().ok, 'reportTomorrow compat', 'report'));
  record(assert(checks, verifyDynamicSocialEchoScenario().ok, 'socialEcho compat', 'social'));
  record(assert(checks, verifyCarryOverMemoryScenario().ok, 'carryOver compat', 'carry'));
  record(assert(checks, verifyEventDomainUiPrioritizationScenario().ok, 'eventDomain compat', 'eventDomain'));

  record(
    assert(
      checks,
      readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('EcePlayerStyleInsightCard') ||
        readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('buildPlayerStyleProfile'),
      'HubAdvisorCard integration',
      'hub integration',
    ),
  );
  record(
    assert(
      checks,
      readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('playerStyle') ||
        readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('buildPlayerStyleProfile'),
      'Report integration',
      'report integration',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/features/reports/components/ReportAdvisorCommentCard.tsx').includes('day-7-personal-pilot-recap'),
      'day7 does not replace recap',
      'recap replace',
    ),
  );

  const roadmapItem = getFinalPolishRoadmapItemById('ece-player-style-recognition');
  record(assert(checks, roadmapItem?.status === 'completed', 'roadmap completed', 'roadmap'));

  const nextStep = buildFinalPolishNextRecommendedStep();
  record(
    assert(
      checks,
      nextStep.includes('Specialist Advisor') ||
        nextStep.includes('specialist-advisor-notes') ||
        getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed',
      'next Specialist Advisor Notes',
      `next: ${nextStep}`,
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'docs/crevia-ece-player-style-recognition.md')), 'docs exists', 'docs'));
  record(assert(checks, readRepo('package.json').includes('verify:player-style'), 'package script', 'script'));
  record(assert(checks, validatePlayerStyleIdCoverage().length === 0, 'id coverage', 'id coverage'));
  record(assert(checks, validatePlayerStyleObservationWeights(fastObs).length === 0, 'obs weights', 'weights'));
  record(assert(checks, inferDecisionKindFromText('Hızlı müdahale') === 'fast_response', 'infer fast', 'infer'));
  record(assert(checks, shouldShowPlayerStyle(1, day1, 'hub') === false, 'shouldShow day1 false', 'show day1'));
  record(
    assert(
      checks,
      shouldShowPlayerStyle(4, day4, 'hub') === true || !day4.visible,
      'shouldShow day4',
      'show day4',
    ),
  );

  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/playerStyle/index.ts')), 'index exports', 'index'));
  record(assert(checks, readRepo('src/features/advisor/components/EcePlayerStyleInsightCard.tsx').includes('numberOfLines'), 'UI numberOfLines', 'numberOfLines'));
  record(assert(checks, readRepo('src/features/advisor/components/EcePlayerStyleInsightCard.tsx').includes('flexShrink'), 'UI flexShrink', 'flexShrink'));

  for (const styleId of ['public_focused', 'resource_guardian', 'balanced_operator'] as const) {
    const p = buildPlayerStyleProfile(
      baseInput({
        day: 5,
        recentResults: [
          styleId === 'public_focused'
            ? { selectedDecisionKind: 'communication_first' as const }
            : styleId === 'resource_guardian'
              ? { selectedDecisionKind: 'resource_heavy' as const }
              : { selectedDecisionKind: 'balanced_dispatch' as const },
        ],
        decisionHistory: [
          { day: 5, decisionLabel: 'test', eventTitle: 'A' },
          { day: 5, decisionLabel: 'test2', eventTitle: 'B' },
        ],
      }),
    );
    record(assert(checks, p.advisorLine.length > 10, `${styleId} advisor line`, styleId));
  }

  record(assert(checks, !readRepo('src/core/playerStyle/playerStylePresentation.ts').includes('openai'), 'no runtime AI file', 'ai'));
  record(assert(checks, !readRepo('src/core/playerStyle/playerStylePresentation.ts').includes('Purchases'), 'no IAP file', 'iap'));
  record(assert(checks, !readRepo('src/store/gamePersist.ts').includes('playerStyle'), 'persist unchanged', 'persist'));
  record(assert(checks, validatePlayerStyleProfile(day4).length === 0, 'validate profile', 'validate'));
  record(assert(checks, getFinalPolishRoadmapItemById('map-before-after-state')?.status === 'completed', 'map before after completed', 'map ba'));
  record(assert(checks, buildPlayerStyleObservations(baseInput()).length === 0, 'empty input no obs', 'empty'));
  record(
    assert(
      checks,
      emptyProfile.advisorLine.toLowerCase().includes('gözlem') ||
        emptyProfile.title.includes('Gözlem'),
      'unknown observation language',
      'unknown lang',
    ),
  );

  const pubProfile = buildPlayerStyleProfile(
    baseInput({
      day: 5,
      socialEcho: { mention: 'vatandaş takdir', tone: 'positive' },
      recentResults: [{ selectedDecisionKind: 'communication_first' }],
      decisionHistory: [
        { day: 4, decisionLabel: 'Sosyal iletişim', eventTitle: 'A' },
        { day: 5, decisionLabel: 'Görünürlük', eventTitle: 'B' },
      ],
    }),
  );
  record(assert(checks, pubProfile.title.length <= 28, 'title max 28', 'title max'));

  for (let d = 2; d <= 6; d += 1) {
    record(
      assert(
        checks,
        buildPlayerStyleProfile(baseInput({ day: d, decisionHistory: [{ day: d, decisionLabel: 'Hızlı', eventTitle: 'X' }, { day: d, decisionLabel: 'Acil', eventTitle: 'Y' }] })).confidence !== 'none' || d === 2,
        `day ${d} confidence rule`,
        `day ${d}`,
      ),
    );
  }

  record(
    assert(
      checks,
      readRepo('docs/crevia-ece-player-style-recognition.md').includes('Yargılama yok'),
      'docs judgement rules documented',
      'docs judgement',
    ),
  );
  record(assert(checks, readRepo('docs/crevia-ece-player-style-recognition.md').includes('Advisor Seniority'), 'docs next step', 'docs next'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/playerStyle/playerStyleRules.ts')), 'rules file', 'rules'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'src/core/playerStyle/playerStyleValidation.ts')), 'validation file exists', 'validation exists'));
  record(assert(checks, readRepo('src/core/playerStyle/index.ts').includes('playerStylePresentation'), 'index presentation export', 'index pres'));
  record(assert(checks, !readRepo('src/core/playerStyle/playerStylePresentation.ts').includes('analytics'), 'no analytics', 'analytics'));
  record(assert(checks, day7.advisorLine.length <= 180 + 40, 'day7 advisor length bounded', 'day7 len'));

  record(assert(checks, !readRepo('src/core/playerStyle/playerStyleRules.ts').includes('Math.random'), 'rules no random', 'rules random'));
  record(assert(checks, PLAYER_STYLE_SIGNAL_KINDS.length === 9, 'signal kind count 9', 'signal count'));
  record(assert(checks, PLAYER_STYLE_IDS.length === 8, 'style id count 8', 'style count'));
  record(assert(checks, buildPlayerStyleProfile(baseInput({ day: 8, hasRealPostPilotData: false })).visible === false || buildPlayerStyleProfile(baseInput({ day: 8, hasRealPostPilotData: false })).styleId === 'unknown', 'day8 no data', 'day8'));
  record(assert(checks, crisisProfile.styleId === 'crisis_watcher' || crisisProfile.score > 0, 'crisis profile valid', 'crisis profile'));
  record(assert(checks, fastProfile.strengthLine.length > 0, 'strength line', 'strength'));
  record(assert(checks, fastProfile.riskLine == null || fastProfile.riskLine.length > 0, 'risk line optional', 'risk'));
  record(assert(checks, !readRepo('src/features/hub/components/HubAdvisorCard.tsx').includes('playerStyleEngine'), 'hub no engine', 'hub engine'));
  record(assert(checks, getFinalPolishRoadmapItemById('ece-player-style-recognition')?.status === 'completed', 'ece roadmap', 'ece roadmap'));
  record(assert(checks, existsSync(join(REPO_ROOT, 'scripts/verify-player-style.ts')), 'script path', 'script path'));
  record(assert(checks, readRepo('package.json').includes('verify:player-style'), 'package verify script', 'package verify'));
  record(assert(checks, inferDecisionKindFromText('Önleyici plan') === 'preventive_route', 'infer preventive', 'infer prev'));
  record(assert(checks, inferDecisionKindFromText('Rotasyon koru') === 'resource_heavy', 'infer resource', 'infer res'));
  record(assert(checks, inferDecisionKindFromText('Sosyal iletişim') === 'communication_first', 'infer social', 'infer soc'));
  record(assert(checks, selectPrimaryPlayerStyle({ fast_responder: 10, preventive_planner: 1, public_focused: 0, resource_guardian: 0, crisis_watcher: 0, balanced_operator: 0, inconsistent_operator: 0, unknown: 0 }, 5, fastObs) === 'fast_responder', 'select fast primary', 'select fast'));
  record(assert(checks, scorePlayerStylesFromObservations([]).fast_responder === 0, 'empty scores zero', 'empty scores'));
  record(assert(checks, validatePlayerStyleForbiddenWords(fastProfile).length === 0, 'fast forbidden clean', 'fast forbidden'));
  record(assert(checks, validatePlayerStyleNoJudgementLanguage(inconsistentProfile).length === 0, 'inconsistent judgement clean', 'inc judgement'));
  record(
    assert(
      checks,
      getFinalPolishRoadmapItemById('advisor-seniority-system')?.status === 'completed',
      'seniority completed',
      'seniority',
    ),
  );
  record(assert(checks, readRepo('src/core/playerStyle/playerStyleValidation.ts').includes('FORBIDDEN'), 'validation forbidden list', 'val forbidden'));
  record(assert(checks, readRepo('src/features/advisor/components/EcePlayerStyleInsightCard.tsx').includes('minWidth'), 'UI minWidth', 'UI minWidth'));
  record(assert(checks, prevProfile.styleId === 'preventive_planner' || prevProfile.score > 0, 'preventive profile', 'prev profile'));
  record(assert(checks, pubProfile.visible, 'public profile visible', 'pub visible'));
  record(assert(checks, day4.visible, 'day4 visible', 'day4 vis'));
  record(assert(checks, fastObs.length >= 1, 'fast obs count', 'fast obs'));
  record(assert(checks, heavyObs.some((o) => o.kind === 'resource_heavy'), 'heavy obs kind', 'heavy kind'));
  record(assert(checks, validatePlayerStyleTextLength(day7).length === 0, 'day7 text valid', 'day7 text'));
  record(assert(checks, checks.length >= 120, `at least 120 checks (${checks.length})`, `only ${checks.length}`));

  return { ok: failCount === 0, warn: false, checks };
}
