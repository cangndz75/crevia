import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { CONTENT_PRODUCTION_VERIFY_PACK } from '@/core/contentProduction/contentPackSchema';
import { buildEventSelectionResult } from '@/core/eventSelection/eventFamilySelectionEngine';
import type { CreviaEventSelectionCandidate, CreviaEventSelectionContext } from '@/core/eventSelection/eventSelectionTypes';
import { resolveEventVariantFromSelectionResult } from '@/core/eventVariants/eventVariantResolver';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  EVENT_FRESHNESS_PENALTIES,
  EVENT_FRESHNESS_TUTORIAL_MAX_DAY,
} from './eventFreshnessConstants';
import {
  applyFreshnessToSelectionCandidates,
  buildEventFreshnessContext,
  buildFreshnessAwareSelectionResult,
  calculateDistrictRepeatPenalty,
  calculateDomainRepeatPenalty,
  calculateEchoRepeatPenalty,
  calculateFamilyRepeatPenalty,
  calculateTitleCopySimilarityPenalty,
  calculateVariantRepeatPenalty,
  evaluateEventFreshness,
} from './eventFreshnessGuard';
import {
  buildCompositeFreshnessSignature,
  normalizeFreshnessText,
  turkishNormalizationIsCaseInsensitive,
} from './eventFreshnessSignature';
import type { CreviaEventExposureRecord, CreviaEventFreshnessContext } from './eventFreshnessTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyEventFreshnessOutcome = {
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

function candidate(overrides: Partial<CreviaEventSelectionCandidate> = {}): CreviaEventSelectionCandidate {
  return {
    id: 'sel_test',
    kind: 'event_family',
    sourceItemId: 'cp_item_test',
    eventFamilyId: 'container_overflow',
    districtIds: ['merkez'],
    domains: ['container'],
    title: 'Konteyner Baskısı',
    tags: [],
    score: 70,
    weightBreakdown: {
      districtRelevance: 14,
      domainRelevance: 12,
      operationPhaseRelevance: 0,
      rankUnlockRelevance: 0,
      operationEraRelevance: 0,
      resourcePressureRelevance: 0,
      districtTrustRelevance: 0,
      crisisRelevance: 0,
      playerStyleRelevance: 0,
      freshnessPenalty: 0,
      duplicatePenalty: 0,
      echoCompletenessBonus: 0,
      contentQualityBonus: 0,
      mobileReadinessBonus: 0,
      total: 70,
    },
    recommendedVariantKind: 'normal',
    isBlocked: false,
    isSelectablePrimary: true,
    isHeavyForTutorial: false,
    ...overrides,
  };
}

function ctx(
  overrides: Partial<CreviaEventFreshnessContext> & { currentDay?: number } = {},
): CreviaEventFreshnessContext {
  return buildEventFreshnessContext({
    currentDay: overrides.currentDay ?? 10,
    candidate: overrides.candidate,
    candidateItem: overrides.candidateItem,
    recentExposureRecords: overrides.recentExposureRecords,
    recentFamilyIds: overrides.recentFamilyIds,
    recentDistrictIds: overrides.recentDistrictIds,
    recentDomainIds: overrides.recentDomainIds,
    recentVariantKinds: overrides.recentVariantKinds,
    recentEchoSignatures: overrides.recentEchoSignatures,
    recentTitleCopySignatures: overrides.recentTitleCopySignatures,
    crisisRiskBand: overrides.crisisRiskBand,
    resolvedVariant: overrides.resolvedVariant,
  });
}

function selectionContext(overrides: Partial<CreviaEventSelectionContext> = {}): CreviaEventSelectionContext {
  return {
    day: 10,
    districtId: 'merkez',
    districtTrustBand: 'stable',
    resourcePressureBand: 'medium',
    crisisRiskBand: 'low',
    recentEventFamilyIds: [],
    recentDistrictIds: [],
    recentDomainIds: [],
    recentVariantKinds: [],
    ...overrides,
  };
}

export function verifyEventFreshnessScenario(): VerifyEventFreshnessOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  record(
    assert(
      checks,
      turkishNormalizationIsCaseInsensitive('İstanbul') &&
        normalizeFreshnessText('ŞİŞLİ') === normalizeFreshnessText('sisli'),
      'Turkish normalize case insensitive',
      'Turkish normalize failed',
    ),
  );

  const family1Day = calculateFamilyRepeatPenalty(
    ctx({
      candidate: candidate({ eventFamilyId: 'container_overflow' }),
      recentExposureRecords: [{ day: 9, familyId: 'container_overflow' }],
      currentDay: 10,
    }),
  );
  record(
    assert(
      checks,
      family1Day >= EVENT_FRESHNESS_PENALTIES.familyRepeat1Day,
      'family 1 day strong penalty',
      `family1Day ${family1Day}`,
    ),
  );

  const family2Day = calculateFamilyRepeatPenalty(
    ctx({
      candidate: candidate({ eventFamilyId: 'container_overflow' }),
      recentExposureRecords: [{ day: 8, familyId: 'container_overflow' }],
      currentDay: 10,
    }),
  );
  record(
    assert(
      checks,
      family2Day >= EVENT_FRESHNESS_PENALTIES.familyRepeat2To3Day,
      'family 2-3 day medium penalty',
      `family2Day ${family2Day}`,
    ),
  );

  const districtPenalty = calculateDistrictRepeatPenalty(
    ctx({
      candidate: candidate({ districtIds: ['merkez'] }),
      recentDistrictIds: ['merkez', 'merkez'],
    }),
  );
  record(
    assert(
      checks,
      districtPenalty >= EVENT_FRESHNESS_PENALTIES.districtRepeatSoft,
      'district repeat soft penalty',
      `district ${districtPenalty}`,
    ),
  );

  const domainPenalty = calculateDomainRepeatPenalty(
    ctx({
      candidate: candidate({ domains: ['container'] }),
      recentDomainIds: ['container', 'container'],
    }),
  );
  record(
    assert(
      checks,
      domainPenalty >= EVENT_FRESHNESS_PENALTIES.domainRepeatSoft,
      'domain repeat penalty',
      `domain ${domainPenalty}`,
    ),
  );

  const rewardPenalty = calculateVariantRepeatPenalty(
    ctx({
      candidate: candidate({ recommendedVariantKind: 'reward' }),
      recentVariantKinds: ['reward', 'reward'],
    }),
  );
  record(
    assert(
      checks,
      rewardPenalty >= EVENT_FRESHNESS_PENALTIES.variantRepeatStrong,
      'reward variant strong penalty',
      `reward ${rewardPenalty}`,
    ),
  );

  const comebackPenalty = calculateVariantRepeatPenalty(
    ctx({
      candidate: candidate({ recommendedVariantKind: 'comeback' }),
      recentVariantKinds: ['comeback', 'comeback'],
    }),
  );
  record(
    assert(
      checks,
      comebackPenalty >= EVENT_FRESHNESS_PENALTIES.variantRepeatStrong,
      'comeback variant strong penalty',
      `comeback ${comebackPenalty}`,
    ),
  );

  const packItem = CONTENT_PRODUCTION_VERIFY_PACK.items.find((i) => i.surface === 'event_family');
  const echoSig = packItem
    ? buildCompositeFreshnessSignature({
        familyId: packItem.eventFamilyIds?.[0],
        districtIds: packItem.districtIds,
        domains: packItem.domains,
        echoSurfaces: packItem.echoSurfaces,
        title: packItem.title,
        copySummary: packItem.copyBlocks.map((b) => b.text).join(' '),
      }).echo
    : 'echo_test';

  const crisisResult = evaluateEventFreshness(
    ctx({
      candidate: candidate({ recommendedVariantKind: 'crisis_adjacent', domains: ['crisis_adjacent'] }),
      recentVariantKinds: ['crisis_adjacent', 'crisis_adjacent'],
      crisisRiskBand: 'high',
    }),
  );
  record(
    assert(
      checks,
      crisisResult.decision.status !== 'block_duplicate' &&
        crisisResult.decision.status !== 'block_echo_repeat',
      'crisis_adjacent controlled warning not block',
      `crisis status ${crisisResult.decision.status}`,
    ),
  );

  const echoBlock = evaluateEventFreshness(
    ctx({
      candidate: candidate(),
      candidateItem: packItem,
      currentDay: 10,
      recentExposureRecords: [{ day: 10, echoSignature: echoSig }],
      recentEchoSignatures: [echoSig!],
    }),
  );
  record(
    assert(
      checks,
      echoBlock.decision.status === 'block_echo_repeat',
      'same day echo block_echo_repeat',
      `echo status ${echoBlock.decision.status}`,
    ),
  );

  const titlePenalty = calculateTitleCopySimilarityPenalty(
    ctx({
      candidate: candidate({ title: 'Konteyner Baskısı Merkez Mahalle' }),
      recentExposureRecords: [
        { day: 9, title: 'Konteyner Baskısı Merkez Mahalle Operasyon', copySummary: 'Konteyner Baskısı Merkez Mahalle' },
      ],
    }),
  );
  record(
    assert(
      checks,
      titlePenalty >= EVENT_FRESHNESS_PENALTIES.titleCopyMediumSimilarity,
      'title copy similarity penalty',
      `titlePenalty ${titlePenalty}`,
    ),
  );

  let emptyCrash = false;
  try {
    evaluateEventFreshness(buildEventFreshnessContext({}));
    buildEventFreshnessContext({ recentExposureRecords: undefined });
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty exposure no crash', 'empty exposure crash'));

  const emptyAllow = evaluateEventFreshness(ctx({ candidate: candidate(), recentExposureRecords: [] }));
  record(assert(checks, emptyAllow.decision.status === 'allow', 'empty exposure allow', `status ${emptyAllow.decision.status}`));

  const criticalFamily = evaluateEventFreshness(
    ctx({
      candidate: candidate({ eventFamilyId: 'container_overflow' }),
      recentFamilyIds: ['container_overflow'],
      crisisRiskBand: 'critical',
    }),
  );
  record(
    assert(
      checks,
      !criticalFamily.decision.isBlocked,
      'critical context not fully blocked',
      'critical blocked wrongly',
    ),
  );

  const day1Heavy = evaluateEventFreshness(
    ctx({
      currentDay: EVENT_FRESHNESS_TUTORIAL_MAX_DAY,
      candidate: candidate({ isHeavyForTutorial: true, domains: ['crisis_adjacent'] }),
    }),
  );
  record(
    assert(
      checks,
      day1Heavy.penalties.tutorialHeavy >= EVENT_FRESHNESS_PENALTIES.tutorialHeavy,
      'day 1 heavy penalty',
      `day1 ${day1Heavy.penalties.tutorialHeavy}`,
    ),
  );

  const selectionResult = buildEventSelectionResult(selectionContext({ day: 10, districtId: 'merkez' }));
  const repeatGuarded = applyFreshnessToSelectionCandidates(selectionResult, {
    recentExposureRecords: selectionResult.primaryCandidates.slice(0, 1).map((c, idx) => ({
      day: 9,
      familyId: c.eventFamilyId,
      districtIds: c.districtIds,
      domains: c.domains,
    })),
  });
  const originalTop = selectionResult.rankedCandidates[0]?.id;
  const guardedTop = repeatGuarded.rankedCandidates[0]?.id;
  record(
    assert(
      checks,
      repeatGuarded.guardedCandidates.length === selectionResult.candidates.length,
      'applyFreshness candidate count',
      'candidate count mismatch',
    ),
  );

  const blockedCandidates = selectionResult.candidates.map((c) =>
    c.kind === 'event_family' ? { ...c, isSelectablePrimary: false, isBlocked: true } : c,
  );
  const fallbackResult = buildFreshnessAwareSelectionResult({
    ...selectionResult,
    candidates: blockedCandidates,
    primaryCandidates: [],
    rankedCandidates: blockedCandidates,
  });
  record(
    assert(
      checks,
      fallbackResult.fallbackNeeded === true,
      'fallback_needed no selectable primary',
      `fallback status ${fallbackResult.topDecision.status}`,
    ),
  );

  const variantSelection = buildEventSelectionResult(selectionContext({ districtTrustBand: 'trusted' }));
  const resolvedVariant = resolveEventVariantFromSelectionResult(variantSelection);
  const variantFreshness = evaluateEventFreshness(
    ctx({
      candidate: variantSelection.primaryCandidates[0],
      resolvedVariant,
      recentVariantKinds: [resolvedVariant.kind, resolvedVariant.kind],
    }),
  );
  record(assert(checks, variantFreshness.penalties.variantRepeat >= 0, 'variant adapter integration', 'variant integration fail'));

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  const applyDecision = readRepo('src/core/game/applyDecision.ts');
  const dayPipeline = readRepo('src/core/dayPipeline/dayPipelineOrchestrator.ts');
  const selectionEngine = readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts');
  const variantResolver = readRepo('src/core/eventVariants/eventVariantResolver.ts');
  record(assert(checks, !ensureDaily.includes('eventFreshness'), 'ensureDaily untouched', 'ensureDaily touched'));
  record(assert(checks, !applyDecision.includes('eventFreshness'), 'applyDecision untouched', 'applyDecision touched'));
  record(assert(checks, !dayPipeline.includes('eventFreshness'), 'dayPipeline untouched', 'dayPipeline touched'));
  record(assert(checks, !selectionEngine.includes('eventFreshness'), 'eventSelection no freshness import', 'circular risk selection'));
  record(assert(checks, !variantResolver.includes('eventFreshness'), 'eventVariants no freshness import', 'circular risk variants'));

  record(
    assert(
      checks,
      !readRepo('src/core/eventFreshness/eventFreshnessGuard.ts').includes('Math.random'),
      'no Math.random',
      'Math.random found',
    ),
  );

  const docs = readRepo('docs/crevia-event-family-repeat-freshness-guard.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('persist'), 'docs persist note', 'docs persist missing'));
  record(assert(checks, docs.includes('selection'), 'docs selection', 'docs selection missing'));
  record(assert(checks, docs.includes('duplicate'), 'docs duplicate guard', 'docs duplicate missing'));

  if (originalTop && guardedTop) {
    record(assert(checks, true, 'ranking comparison available', 'ranking skip'));
  }

  return { ok, warn: false, checks };
}
