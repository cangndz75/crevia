import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG,
  DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY,
  getDistrictOperationRuntimeKindsForDistrict,
} from './districtOperationsRuntimeConstants';
import {
  buildDistrictOperationFallbackSnapshot,
  buildDistrictOperationsRuntimeSnapshot,
  scoreDistrictOperationCandidate,
} from './districtOperationsRuntimeModel';
import {
  applyDistrictOperationToEventSelectionContext,
  buildDistrictOperationContentProductionHint,
  buildDistrictOperationFreshnessModifier,
  buildDistrictOperationRankVisibility,
  buildDistrictOperationVariantBias,
  buildDistrictOperationVariantContext,
  shouldApplyDistrictOperationVariantBias,
} from './districtOperationsRuntimeSignals';
import {
  buildDistrictOperationAdvisorLine,
  buildDistrictOperationDebugRows,
  buildDistrictOperationHubLine,
  buildDistrictOperationMapLine,
  buildDistrictOperationPresentationModel,
  buildDistrictOperationReportLine,
  buildDistrictOperationTomorrowPreviewLine,
  districtOperationsRuntimeCopyContainsForbiddenTerms,
  districtOperationsRuntimeCopyContainsPanicTerms,
  validateDistrictOperationPresentationCopy,
} from './districtOperationsRuntimePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictOperationsRuntimeOutcome = {
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

export function verifyDistrictOperationsRuntimeScenario(): VerifyDistrictOperationsRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 23, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    const snapshot = buildDistrictOperationsRuntimeSnapshot({ day: 10, focusDistrictId: id });
    const district = snapshot.districts.find((d) => d.districtId === id);
    record(assert(checks, !!district?.primary, `recommendation ${id}`, `missing ${id}`));
    record(
      assert(
        checks,
        district?.primary?.isSelectableNow === false && district?.primary?.isRuntimeHintOnly === true,
        `${id} hint flags`,
        `${id} hint flags wrong`,
      ),
    );
  }

  let emptyCrash = false;
  try {
    buildDistrictOperationsRuntimeSnapshot({});
    buildDistrictOperationFallbackSnapshot({});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state fallback', 'empty state crash'));

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    const kinds = getDistrictOperationRuntimeKindsForDistrict(id);
    record(assert(checks, kinds.length >= 2, `${id} >=2 kinds`, `${id} kind count ${kinds.length}`));
  }

  record(assert(checks, DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG.length === 15, '15 runtime kinds', 'kind catalog size'));

  const socialDef = getDistrictOperationRuntimeKindsForDistrict('cumhuriyet').find(
    (d) => d.kind === 'social_trust_repair',
  )!;
  const routeDef = getDistrictOperationRuntimeKindsForDistrict('sanayi').find(
    (d) => d.kind === 'route_efficiency',
  )!;
  const visibleDef = getDistrictOperationRuntimeKindsForDistrict('merkez').find(
    (d) => d.kind === 'visible_service',
  )!;
  const quietDef = getDistrictOperationRuntimeKindsForDistrict('yesilvadi').find(
    (d) => d.kind === 'low_noise_service',
  )!;

  const fragileScore = scoreDistrictOperationCandidate(socialDef, { day: 10 }, 'fragile', 'trust_shift');
  const fragileOther = scoreDistrictOperationCandidate(routeDef, { day: 10 }, 'fragile', 'trust_shift');
  record(
    assert(
      checks,
      fragileScore > fragileOther,
      'trust fragile social repair priority',
      `fragile ${fragileScore} vs ${fragileOther}`,
    ),
  );

  const pressureScore = scoreDistrictOperationCandidate(
    getDistrictOperationRuntimeKindsForDistrict('sanayi').find((d) => d.kind === 'industrial_waste_pressure')!,
    { day: 10 },
    'watch',
    'repeated_pressure',
  );
  const pressureOther = scoreDistrictOperationCandidate(visibleDef, { day: 10 }, 'watch', 'repeated_pressure');
  record(
    assert(
      checks,
      pressureScore > pressureOther,
      'memory repeated_pressure domain focus',
      `pressure ${pressureScore} vs ${pressureOther}`,
    ),
  );

  const improvementScore = scoreDistrictOperationCandidate(quietDef, { day: 10 }, 'trusted', 'recent_improvement');
  const improvementOther = scoreDistrictOperationCandidate(routeDef, { day: 10 }, 'trusted', 'recent_improvement');
  record(
    assert(
      checks,
      improvementScore > improvementOther,
      'memory recent_improvement reward visibility',
      `improvement ${improvementScore} vs ${improvementOther}`,
    ),
  );

  const fatigueScore = scoreDistrictOperationCandidate(routeDef, {
    day: 10,
    resourceFatigue: { level: 'high', trend: 'fatigue' },
  });
  const fatigueOther = scoreDistrictOperationCandidate(socialDef, {
    day: 10,
    resourceFatigue: { level: 'high', trend: 'fatigue' },
  });
  record(
    assert(
      checks,
      fatigueScore > fatigueOther,
      'resource fatigue relief priority',
      `fatigue ${fatigueScore} vs ${fatigueOther}`,
    ),
  );

  const crisisSnapshot = buildDistrictOperationsRuntimeSnapshot({
    day: 10,
    focusDistrictId: 'merkez',
    crisisState: { riskLevel: 'watch', trend: 'elevated' },
  });
  const crisisLine = crisisSnapshot.districts.find((d) => d.districtId === 'merkez')?.primary?.advisorLine ?? '';
  record(
    assert(
      checks,
      !districtOperationsRuntimeCopyContainsPanicTerms(crisisLine),
      'crisis watch no panic copy',
      'panic in crisis copy',
    ),
  );

  const eraScore = scoreDistrictOperationCandidate(routeDef, {
    day: 10,
    operationEraId: 'route_maintenance_era',
  });
  const eraOther = scoreDistrictOperationCandidate(socialDef, {
    day: 10,
    operationEraId: 'route_maintenance_era',
  });
  record(assert(checks, eraScore > eraOther, 'operation era domain bonus', `era ${eraScore} vs ${eraOther}`));

  const repeatScore = scoreDistrictOperationCandidate(routeDef, {
    day: 10,
    recentOperationKinds: ['route_efficiency', 'route_efficiency'],
  });
  const freshScore = scoreDistrictOperationCandidate(routeDef, { day: 10 });
  record(
    assert(
      checks,
      repeatScore < freshScore,
      'same operation repeat freshness penalty',
      `repeat ${repeatScore} vs fresh ${freshScore}`,
    ),
  );

  const day1Snapshot = buildDistrictOperationsRuntimeSnapshot({ day: DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY });
  record(
    assert(
      checks,
      day1Snapshot.isTutorialSimplified && day1Snapshot.districts.every((d) => d.isFallback || d.primary?.confidence === 'low'),
      'day 1 tutorial simplified',
      'day1 complexity exposed',
    ),
  );

  const day1Visibility = buildDistrictOperationRankVisibility({ day: 1 });
  record(assert(checks, day1Visibility.mode === 'hidden', 'day 1 rank hidden', 'day1 visibility wrong'));

  const selectionCtx = applyDistrictOperationToEventSelectionContext({ day: 10, focusDistrictId: 'merkez' });
  record(assert(checks, selectionCtx.districtId != null, 'selection context hint', 'selection ctx fail'));

  const variantBias = buildDistrictOperationVariantBias('merkez', { day: 10 });
  record(assert(checks, variantBias.preferredVariants.length > 0, 'variant bias', 'variant bias empty'));
  record(
    assert(
      checks,
      shouldApplyDistrictOperationVariantBias(variantBias, variantBias.preferredVariants[0]!),
      'variant bias apply',
      'bias apply fail',
    ),
  );

  const variantCtx = buildDistrictOperationVariantContext('sanayi', { day: 10, operationEraId: 'route_maintenance_era' });
  record(assert(checks, !!variantCtx.recommendedVariantKind, 'variant context', 'variant ctx missing'));

  const freshnessModifier = buildDistrictOperationFreshnessModifier('sanayi', {
    day: 10,
    recentOperationKinds: ['route_efficiency'],
  });
  record(
    assert(
      checks,
      freshnessModifier.repeatPenalty > 0,
      'freshness modifier repeat penalty',
      'freshness penalty missing',
    ),
  );

  const contentHint = buildDistrictOperationContentProductionHint('istasyon', {
    day: 10,
    operationEraId: 'core_city_operations',
  });
  record(assert(checks, contentHint.isRuntimeLinked === false, 'content production hint', 'content hint linked'));

  const presentation = buildDistrictOperationPresentationModel('merkez', { day: 10 });
  record(assert(checks, validateDistrictOperationPresentationCopy(presentation), 'presentation valid', 'presentation invalid'));
  record(assert(checks, (presentation.mapLine?.length ?? 0) <= 89, 'map line length', 'map too long'));
  record(assert(checks, (presentation.reportLine?.length ?? 0) <= 89, 'report line length', 'report too long'));
  record(assert(checks, (presentation.advisorLine?.length ?? 0) <= 73, 'advisor line length', 'advisor too long'));
  record(assert(checks, (presentation.tomorrowPreviewLine?.length ?? 0) <= 73, 'tomorrow line length', 'tomorrow too long'));
  record(assert(checks, (presentation.hubLine?.length ?? 0) <= 81, 'hub line length', 'hub too long'));

  const surfaceLines = [
    buildDistrictOperationMapLine('merkez', { day: 10 }),
    buildDistrictOperationReportLine('merkez', { day: 10 }),
    buildDistrictOperationAdvisorLine('merkez', { day: 10 }),
    buildDistrictOperationTomorrowPreviewLine('merkez', { day: 10 }),
  ];
  const uniqueSurfaces = new Set(surfaceLines.map((l) => l.toLocaleLowerCase('tr-TR')));
  record(assert(checks, uniqueSurfaces.size === surfaceLines.length, 'surface copy unique', 'duplicate surface copy'));

  record(
    assert(
      checks,
      !districtOperationsRuntimeCopyContainsForbiddenTerms(buildDistrictOperationReportLine('merkez', { day: 5 })),
      'forbidden copy guard',
      'forbidden copy',
    ),
  );

  const lowRank = buildDistrictOperationRankVisibility({ day: 5, rankKey: 'field_observer' });
  const highRank = buildDistrictOperationRankVisibility({
    day: 10,
    rankKey: 'operations_director',
    unlockedPermissionIds: ['district_specific_operations_preview'],
  });
  record(assert(checks, lowRank.mode === 'compact', 'low rank compact', 'low rank wrong'));
  record(assert(checks, highRank.mode === 'detailed' && highRank.showTrustMemoryLink, 'high rank detailed', 'high rank wrong'));

  record(assert(checks, buildDistrictOperationDebugRows({ day: 10 }).length >= 6, 'debug rows', 'debug short'));
  record(assert(checks, buildDistrictOperationHubLine('merkez', { day: 10 }).length > 0, 'hub line', 'hub empty'));

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  record(assert(checks, !ensureDaily.includes('districtOperationsRuntime'), 'ensureDaily untouched', 'ensureDaily touched'));
  record(
    assert(
      checks,
      !readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts').includes('districtOperationsRuntime'),
      'eventSelection no import',
      'selection circular',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/eventVariants/eventVariantResolver.ts').includes('districtOperationsRuntime'),
      'eventVariants no import',
      'variant circular',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/eventFreshness/eventFreshnessGuard.ts').includes('districtOperationsRuntime'),
      'eventFreshness no import',
      'freshness circular',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/districtTrustRuntime/districtTrustRuntimeModel.ts').includes('districtOperationsRuntime'),
      'trustRuntime no import',
      'trust circular',
    ),
  );
  record(
    assert(
      checks,
      !readRepo('src/core/districtMemoryRuntime/districtMemoryRuntimeModel.ts').includes('districtOperationsRuntime'),
      'memoryRuntime no import',
      'memory circular',
    ),
  );

  record(
    assert(
      checks,
      !readRepo('src/core/districtOperationsRuntime/districtOperationsRuntimeModel.ts').includes('Math.random'),
      'no Math.random',
      'Math.random found',
    ),
  );

  const docs = readRepo('docs/crevia-district-specific-operations-runtime-lite.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('persist'), 'docs persist', 'docs persist missing'));
  record(assert(checks, docs.includes('trust'), 'docs trust', 'docs trust missing'));
  record(assert(checks, docs.includes('freshness'), 'docs freshness', 'docs freshness missing'));
  record(assert(checks, docs.includes('selectable'), 'docs selectable defer', 'docs selectable missing'));

  return { ok, warn: false, checks };
}
