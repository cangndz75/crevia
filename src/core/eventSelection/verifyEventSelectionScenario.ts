import { existsSync, readFileSync } from 'node:fs';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';
import { join } from 'node:path';

import { CONTENT_PRODUCTION_VERIFY_PACK } from '@/core/contentProduction/contentPackSchema';
import { buildContentPackItemFromEventFamily } from '@/core/contentProduction/contentPackSchema';
import { EVENT_FAMILY_VERIFY_FIXTURES } from '@/core/eventFamilies/eventFamilyConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  buildEventSelectionCandidates,
  buildEventSelectionRecommendationForDay,
  buildEventSelectionResult,
  containsEventSelectionPanicWording,
  rankEventSelectionCandidates,
  resolveRecommendedVariantKind,
  scoreEventSelectionCandidate,
  selectEventFamilyCandidate,
} from './eventFamilySelectionEngine';
import {
  EVENT_SELECTION_DEBUG_MIN_CANDIDATES,
  EVENT_SELECTION_TUTORIAL_MAX_DAY,
  EVENT_SELECTION_WEIGHTS,
} from './eventSelectionConstants';
import {
  buildEventSelectionDebugReport,
  buildEventSelectionSummaryLine,
  buildEventSelectionWeightBreakdownRows,
  buildRecommendedVariantLabel,
} from './eventSelectionPresentation';
import {
  buildEventSelectionContextFromGameState,
  buildEventSelectionSignalSnapshot,
} from './eventSelectionSignals';
import type { CreviaEventSelectionContext } from './eventSelectionTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventSelectionOutcome = {
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

function baseContext(overrides: Partial<CreviaEventSelectionContext> = {}): CreviaEventSelectionContext {
  return {
    day: 10,
    operationCareerPhase: 'district_responsibility',
    districtId: 'merkez',
    authorityBand: 'medium',
    districtTrustBand: 'stable',
    resourcePressureBand: 'medium',
    crisisRiskBand: 'low',
    playerStyleId: 'balanced_operator',
    recentEventFamilyIds: [],
    recentDistrictIds: [],
    recentDomainIds: [],
    recentVariantKinds: [],
    ...overrides,
  };
}

export function verifyEventSelectionScenario(): VerifyEventSelectionOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, isCurrentSaveVersion(SAVE_VERSION), 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  const ensureDailyEventsSource = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  record(
    assert(
      checks,
      !ensureDailyEventsSource.includes('eventSelection'),
      'ensureDailyEventsForDay untouched',
      'ensureDailyEventsForDay imports eventSelection',
    ),
  );

  let snapshotCrash = false;
  try {
    buildEventSelectionSignalSnapshot({});
    buildEventSelectionContextFromGameState(null);
    buildEventSelectionContextFromGameState(undefined);
  } catch {
    snapshotCrash = true;
  }
  record(assert(checks, !snapshotCrash, 'empty context fallback', 'empty context crash'));

  const ctxA = baseContext({ districtId: 'merkez' });
  const resultA1 = buildEventSelectionResult(ctxA);
  const resultA2 = buildEventSelectionResult(ctxA);
  record(
    assert(
      checks,
      resultA1.rankedCandidates.map((c) => c.id).join('|') ===
        resultA2.rankedCandidates.map((c) => c.id).join('|'),
      'deterministic ranking',
      'ranking not deterministic',
    ),
  );

  const withDistrict = buildEventSelectionResult(baseContext({ districtId: 'merkez' }));
  const withoutDistrict = buildEventSelectionResult(baseContext({ districtId: 'yesilvadi' }));
  const merkezTop = withDistrict.primaryCandidates[0];
  const yesilvadiTop = withoutDistrict.primaryCandidates.find((c) =>
    c.districtIds.includes('merkez'),
  );
  record(
    assert(
      checks,
      (merkezTop?.weightBreakdown.districtRelevance ?? 0) >= EVENT_SELECTION_WEIGHTS.districtRelevance,
      'district relevance merkez',
      'district relevance low for merkez',
    ),
  );
  if (yesilvadiTop) {
    record(
      assert(
        checks,
        yesilvadiTop.weightBreakdown.districtRelevance < EVENT_SELECTION_WEIGHTS.districtRelevance,
        'district relevance mismatch penalty',
        'district relevance not penalized',
      ),
    );
  }

  const domainCtx = baseContext({ recentDomainIds: ['container'], districtId: 'merkez' });
  const domainResult = buildEventSelectionResult(domainCtx);
  const containerCandidate = domainResult.candidates.find((c) => c.domains.includes('container'));
  record(
    assert(
      checks,
      (containerCandidate?.weightBreakdown.domainRelevance ?? 0) >= EVENT_SELECTION_WEIGHTS.domainRelevance,
      'domain relevance container',
      'domain relevance container missing',
    ),
  );

  const eraCtx = baseContext({ operationEraId: 'route_maintenance_era' });
  const eraResult = buildEventSelectionResult(eraCtx);
  record(
    assert(
      checks,
      eraResult.decision.selectedCandidateId == null ||
        eraResult.candidates.find((c) => c.id === eraResult.decision.selectedCandidateId)?.kind ===
          'event_family',
      'operation era not primary selected',
      'operation era selected as primary',
    ),
  );
  record(
    assert(
      checks,
      eraResult.operationEraHints.length > 0,
      'operation era hints present',
      'operation era hints missing',
    ),
  );

  const familyFixture = EVENT_FAMILY_VERIFY_FIXTURES[0]!;
  const familyId = familyFixture.id;
  const repeatCtx = baseContext({ recentEventFamilyIds: [familyId], districtId: 'merkez' });
  const repeatCandidates = buildEventSelectionCandidates(repeatCtx);
  const repeated = repeatCandidates.find((c) => c.eventFamilyId === familyId);
  record(
    assert(
      checks,
      (repeated?.weightBreakdown.freshnessPenalty ?? 0) >= EVENT_SELECTION_WEIGHTS.freshnessFamilyPenalty,
      'duplicate family penalty',
      'duplicate family penalty missing',
    ),
  );

  const districtRepeatCtx = baseContext({
    districtId: 'merkez',
    recentDistrictIds: ['merkez', 'merkez', 'merkez'],
  });
  const districtRepeatCandidates = buildEventSelectionCandidates(districtRepeatCtx);
  const districtRepeated = districtRepeatCandidates.find((c) => c.districtIds.includes('merkez'));
  record(
    assert(
      checks,
      (districtRepeated?.weightBreakdown.freshnessPenalty ?? 0) >= EVENT_SELECTION_WEIGHTS.freshnessDistrictPenalty,
      'recent district penalty',
      'recent district penalty missing',
    ),
  );

  const domainRepeatCtx = baseContext({
    districtId: 'merkez',
    recentDomainIds: ['social', 'social', 'social'],
  });
  const domainRepeatCandidates = buildEventSelectionCandidates(domainRepeatCtx);
  const domainRepeated = domainRepeatCandidates.find((c) => c.domains.includes('social'));
  record(
    assert(
      checks,
      (domainRepeated?.weightBreakdown.freshnessPenalty ?? 0) >= EVENT_SELECTION_WEIGHTS.freshnessDomainPenalty,
      'recent domain penalty',
      'recent domain penalty missing',
    ),
  );

  const echoPassItem = CONTENT_PRODUCTION_VERIFY_PACK.items.find(
    (item) => item.surface === 'event_family' && item.echoSurfaces && item.echoSurfaces.length >= 4,
  );
  if (echoPassItem) {
    const echoCtx = baseContext({ districtId: echoPassItem.districtIds[0] });
    const echoCandidates = buildEventSelectionCandidates(echoCtx);
    const echoCandidate = echoCandidates.find((c) => c.sourceItemId === echoPassItem.id);
    record(
      assert(
        checks,
        (echoCandidate?.weightBreakdown.echoCompletenessBonus ?? 0) > 0,
        'echo completeness bonus',
        'echo completeness bonus missing',
      ),
    );
  } else {
    record(assert(checks, false, 'echo completeness bonus', 'no echo pass item in verify pack'));
  }

  const forbiddenFamily = buildContentPackItemFromEventFamily({
    ...familyFixture,
    id: 'verify_forbidden_family',
    title: 'Yasaklı Kopya Test',
  });
  forbiddenFamily.copyBlocks = [
    {
      id: 'forbidden_block',
      surface: 'advisor_echo',
      text: 'Bu metin panik yaratmamalı ama premium al ifadesi var.',
      isPlayerFacing: true,
      language: 'tr',
    },
  ];
  const forbiddenBase = {
    id: 'sel_test_forbidden',
    kind: 'event_family' as const,
    sourceItemId: forbiddenFamily.id,
    eventFamilyId: 'verify_forbidden_family',
    districtIds: ['merkez'],
    domains: ['generic_operation'],
    title: forbiddenFamily.title,
    tags: [],
    isBlocked: true,
    blockReason: 'forbidden',
    isSelectablePrimary: false,
    isHeavyForTutorial: false,
  };
  const forbiddenScore = scoreEventSelectionCandidate(
    forbiddenBase,
    baseContext(),
    forbiddenFamily,
    [forbiddenFamily],
  );
  record(assert(checks, forbiddenScore.score === 0, 'forbidden copy blocked score 0', 'forbidden not blocked'));

  const lowTrustVariant = resolveRecommendedVariantKind(
    baseContext({ districtTrustBand: 'fragile' }),
    { domains: ['social'], tags: [] },
  );
  record(
    assert(
      checks,
      lowTrustVariant === 'district_trust' || lowTrustVariant === 'comeback',
      'low trust variant recommendation',
      `low trust variant unexpected ${lowTrustVariant}`,
    ),
  );

  const highTrustVariant = resolveRecommendedVariantKind(
    baseContext({ districtTrustBand: 'trusted', resourcePressureBand: 'low' }),
    { domains: ['generic_operation'], tags: [] },
  );
  record(
    assert(
      checks,
      highTrustVariant === 'reward' || highTrustVariant === 'improved',
      'high trust variant recommendation',
      `high trust variant unexpected ${highTrustVariant}`,
    ),
  );

  const fatigueVariant = resolveRecommendedVariantKind(
    baseContext({ resourcePressureBand: 'high' }),
    { domains: ['personnel'], tags: [] },
  );
  record(assert(checks, fatigueVariant === 'resource_fatigue', 'resource fatigue variant', 'fatigue variant wrong'));

  const crisisVariant = resolveRecommendedVariantKind(
    baseContext({ crisisRiskBand: 'high', operationEraId: undefined }),
    { domains: ['crisis_adjacent'], tags: [] },
  );
  record(assert(checks, crisisVariant === 'crisis_adjacent', 'crisis adjacent variant', 'crisis variant wrong'));

  const crisisLabel = buildRecommendedVariantLabel('crisis_adjacent');
  record(
    assert(
      checks,
      !containsEventSelectionPanicWording(crisisLabel),
      'crisis label no panic wording',
      'crisis label has panic wording',
    ),
  );

  const day1Ctx = baseContext({ day: EVENT_SELECTION_TUTORIAL_MAX_DAY, operationCareerPhase: 'pilot_training' });
  const day1Ranked = rankEventSelectionCandidates(buildEventSelectionCandidates(day1Ctx), day1Ctx);
  const day1Selected = selectEventFamilyCandidate(day1Ranked, day1Ctx);
  record(
    assert(
      checks,
      day1Selected == null || !day1Selected.isHeavyForTutorial,
      'day 1 no heavy candidate',
      'day 1 selected heavy candidate',
    ),
  );

  const breakdownRows = buildEventSelectionWeightBreakdownRows(resultA1.rankedCandidates[0]!.weightBreakdown);
  record(assert(checks, breakdownRows.length >= 10, 'weight breakdown readable', 'weight breakdown too short'));

  const debugReport = buildEventSelectionDebugReport(resultA1);
  record(
    assert(
      checks,
      debugReport.rows.length >= EVENT_SELECTION_DEBUG_MIN_CANDIDATES,
      'debug report 5+ candidates',
      'debug report too few candidates',
    ),
  );

  record(
    assert(
      checks,
      CONTENT_PRODUCTION_VERIFY_PACK.isRuntimeLinked === false,
      'verify pack not runtime linked',
      'verify pack runtime linked wrongly',
    ),
  );

  const recommendation = buildEventSelectionRecommendationForDay({ day: 5 }, { districtId: 'merkez' });
  record(assert(checks, recommendation.isRuntimeHintOnly === true, 'runtime hint only flag', 'hint flag missing'));
  record(assert(checks, recommendation.summaryLine.length > 0, 'recommendation summary', 'empty summary'));
  record(assert(checks, buildEventSelectionSummaryLine(resultA1).length > 0, 'summary line', 'empty summary line'));

  const docs = readRepo('docs/crevia-event-family-selection-engine.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('content production'), 'docs content production', 'docs missing content production'));
  record(assert(checks, docs.includes('variant'), 'docs variant recommendation', 'docs missing variant'));
  record(assert(checks, docs.includes('save_version') || docs.includes('23'), 'docs SAVE_VERSION', 'docs missing SAVE_VERSION'));

  record(
    assert(
      checks,
      !readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts').includes('Math.random'),
      'no Math.random in engine',
      'Math.random found',
    ),
  );

  return { ok, warn: false, checks };
}
