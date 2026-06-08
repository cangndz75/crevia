import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_MEMORY_RUNTIME_KINDS,
  DISTRICT_MEMORY_RUNTIME_KIND_DEFINITIONS,
  DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY,
  getDistrictMemoryRuntimeKindDefinition,
} from './districtMemoryRuntimeConstants';
import {
  buildDistrictMemoryFallbackSnapshot,
  buildDistrictMemoryRuntimeSnapshot,
  deriveDistrictMemoryKind,
  deterministicMemoryKindForDistrict,
} from './districtMemoryRuntimeModel';
import {
  applyDistrictMemoryToEventSelectionContext,
  buildDistrictMemoryFreshnessModifier,
  buildDistrictMemoryRankVisibility,
  buildDistrictMemorySelectionHints,
  buildDistrictMemoryTrustContext,
  buildDistrictMemoryVariantBias,
  buildDistrictMemoryVariantBiasFromKind,
  buildDistrictMemoryVariantContext,
  shouldApplyDistrictMemoryVariantBias,
} from './districtMemoryRuntimeSignals';
import {
  buildDistrictMemoryAdvisorLine,
  buildDistrictMemoryDebugRows,
  buildDistrictMemoryMapLine,
  buildDistrictMemoryPresentationModel,
  buildDistrictMemoryReportLine,
  buildDistrictMemoryTomorrowPreviewLine,
  districtMemoryRuntimeCopyContainsForbiddenTerms,
  districtMemoryRuntimeCopyContainsPanicTerms,
  validateDistrictMemoryPresentationCopy,
} from './districtMemoryRuntimePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictMemoryRuntimeOutcome = {
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

export function verifyDistrictMemoryRuntimeScenario(): VerifyDistrictMemoryRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 24, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    record(
      assert(
        checks,
        !!buildDistrictMemoryRuntimeSnapshot({ day: 10, focusDistrictId: id }).districts.find((d) => d.districtId === id),
        `snapshot ${id}`,
        `missing ${id}`,
      ),
    );
  }

  let emptyCrash = false;
  try {
    buildDistrictMemoryRuntimeSnapshot({});
    buildDistrictMemoryFallbackSnapshot({});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state fallback', 'empty state crash'));

  for (const kind of DISTRICT_MEMORY_RUNTIME_KINDS) {
    const def = DISTRICT_MEMORY_RUNTIME_KIND_DEFINITIONS[kind];
    record(assert(checks, !!def, `kind def ${kind}`, `missing ${kind}`));
    record(assert(checks, def.label.length > 0, `${kind} label`, `${kind} label empty`));
    record(assert(checks, def.variantBias.length > 0, `${kind} variantBias`, `${kind} variantBias empty`));
  }

  const carryBias = buildDistrictMemoryVariantBiasFromKind('unresolved_carry_over', 'merkez');
  record(
    assert(
      checks,
      carryBias.preferredVariants.some((v) => v === 'carry_over' || v === 'district_trust'),
      'unresolved_carry_over bias',
      'carry bias wrong',
    ),
  );

  const pressureBias = buildDistrictMemoryVariantBiasFromKind('repeated_pressure', 'sanayi');
  record(
    assert(
      checks,
      pressureBias.preferredVariants.some((v) => v === 'comeback' || v === 'resource_fatigue'),
      'repeated_pressure bias',
      'pressure bias wrong',
    ),
  );

  const improvementBias = buildDistrictMemoryVariantBiasFromKind('recent_improvement', 'cumhuriyet');
  record(
    assert(
      checks,
      improvementBias.preferredVariants.some((v) => v === 'reward' || v === 'improved'),
      'recent_improvement bias',
      'improvement bias wrong',
    ),
  );

  const recoveryBias = buildDistrictMemoryVariantBiasFromKind('recovery_window', 'yesilvadi');
  record(
    assert(
      checks,
      recoveryBias.preferredVariants.includes('comeback'),
      'recovery_window comeback bias',
      'recovery bias wrong',
    ),
  );
  record(
    assert(
      checks,
      !recoveryBias.memoryReasonLine.toLocaleLowerCase('tr-TR').includes('bedelsiz'),
      'recovery no free rescue wording',
      'free rescue wording',
    ),
  );

  const crisisKind = deriveDistrictMemoryKind('merkez', {
    day: 10,
    crisisState: { riskLevel: 'elevated', trend: 'watch' },
  });
  record(
    assert(
      checks,
      crisisKind === 'crisis_watch' || crisisKind === 'unresolved_carry_over',
      'crisis_watch kind derivable',
      `crisis kind ${crisisKind}`,
    ),
  );
  record(
    assert(
      checks,
      !districtMemoryRuntimeCopyContainsPanicTerms(
        getDistrictMemoryRuntimeKindDefinition('crisis_watch').reportCopyIntent,
      ),
      'crisis_watch no panic copy',
      'panic in crisis copy',
    ),
  );

  const quietHint = buildDistrictMemoryVariantBiasFromKind('quiet_stable', 'istasyon');
  record(
    assert(
      checks,
      buildDistrictMemorySelectionHints({ day: 10 }).some((h) => h.deprioritizeProblemSpam) ||
        quietHint.kind === 'quiet_stable',
      'quiet_stable spam reduction hint',
      'quiet hint missing',
    ),
  );

  const day1Snapshot = buildDistrictMemoryRuntimeSnapshot({ day: DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY });
  record(
    assert(
      checks,
      day1Snapshot.isTutorialSimplified &&
        day1Snapshot.districts.every((d) => d.primaryKind === 'quiet_stable' || d.isFallback),
      'day 1 simplified memory',
      'day1 complexity exposed',
    ),
  );

  const trustBefore = buildDistrictTrustRuntimeSnapshot({ day: 10 });
  const memorySnapshot = buildDistrictMemoryRuntimeSnapshot({ day: 10, trustSnapshot: trustBefore });
  record(
    assert(
      checks,
      memorySnapshot.trustSnapshotRef?.districts[0]?.band === trustBefore.districts[0]?.band,
      'trust snapshot not overwritten',
      'trust overwritten',
    ),
  );

  const trustCtx = buildDistrictMemoryTrustContext('merkez', { day: 10 }, trustBefore);
  record(assert(checks, !!trustCtx.trustBand && !!trustCtx.memoryKind, 'memory trust context', 'trust context missing'));

  const variantCtx = buildDistrictMemoryVariantContext('merkez', {
    day: 10,
    carryOverMemory: { summary: 'unresolved pending yarın carry' },
  });
  record(assert(checks, !!variantCtx.recommendedVariantKind, 'variant context memory reason', 'variant ctx missing'));

  const pressureModifier = buildDistrictMemoryFreshnessModifier('sanayi', {
    day: 10,
    recentExposure: { districtIds: ['sanayi', 'sanayi', 'sanayi'] },
    recentEvents: [{ summary: 'repeated tekrar pressure' }],
  });
  record(
    assert(
      checks,
      pressureModifier.reduceProblemSpam && pressureModifier.familyRepeatMultiplier > 1,
      'repeated pressure freshness',
      'pressure modifier wrong',
    ),
  );

  const recoveryModifier = buildDistrictMemoryFreshnessModifier('yesilvadi', {
    day: 10,
    recentEvents: [{ summary: 'recovery toparlan resolved' }],
  });
  record(
    assert(
      checks,
      recoveryModifier.softenRecoveryRepeat === true || recoveryModifier.familyRepeatMultiplier < 1,
      'recovery window soften',
      'recovery soften missing',
    ),
  );

  const improvementModifier = buildDistrictMemoryFreshnessModifier('cumhuriyet', {
    day: 10,
    recentEvents: [{ tone: 'reward', summary: 'gratitude positive iyileş' }],
  });
  record(assert(checks, improvementModifier.rewardSpamGuard === true, 'recent improvement reward guard', 'reward guard missing'));

  const presentation = buildDistrictMemoryPresentationModel('merkez', { day: 10 });
  record(assert(checks, validateDistrictMemoryPresentationCopy(presentation), 'presentation valid', 'presentation invalid'));
  record(assert(checks, (presentation.mapLine?.length ?? 0) <= 89, 'map line length', 'map too long'));
  record(assert(checks, (presentation.reportLine?.length ?? 0) <= 89, 'report line length', 'report too long'));
  record(assert(checks, (presentation.advisorLine?.length ?? 0) <= 73, 'advisor line length', 'advisor too long'));
  record(assert(checks, (presentation.tomorrowPreviewLine?.length ?? 0) <= 73, 'tomorrow line length', 'tomorrow too long'));
  record(
    assert(
      checks,
      !districtMemoryRuntimeCopyContainsForbiddenTerms(buildDistrictMemoryReportLine('merkez', { day: 5 })),
      'forbidden copy guard',
      'forbidden copy',
    ),
  );

  const lowRank = buildDistrictMemoryRankVisibility({ day: 5, rankKey: 'field_observer' });
  const highRank = buildDistrictMemoryRankVisibility({
    day: 10,
    rankKey: 'operations_director',
    unlockedPermissionIds: ['district_memory_trace_preview'],
  });
  record(assert(checks, lowRank.mode === 'compact', 'low rank compact', 'low rank wrong'));
  record(assert(checks, highRank.mode === 'detailed' && highRank.showRecoveryAction, 'high rank detailed', 'high rank wrong'));

  record(assert(checks, applyDistrictMemoryToEventSelectionContext({ day: 10 }).districtId != null, 'selection context', 'selection ctx fail'));
  record(assert(checks, shouldApplyDistrictMemoryVariantBias(carryBias, 'carry_over'), 'variant bias apply', 'bias apply fail'));
  record(assert(checks, buildDistrictMemoryDebugRows({ day: 10 }).length >= 6, 'debug rows', 'debug short'));
  record(assert(checks, buildDistrictMemorySelectionHints({ day: 10 }).length === 5, '5 hints', 'hint count'));

  record(assert(checks, deterministicMemoryKindForDistrict('merkez', { day: 10 }) === deriveDistrictMemoryKind('merkez', { day: 10 }), 'deterministic kind', 'non-deterministic'));

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  record(assert(checks, !ensureDaily.includes('districtMemoryRuntime'), 'ensureDaily untouched', 'ensureDaily touched'));
  record(assert(checks, !readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts').includes('districtMemoryRuntime'), 'eventSelection no import', 'selection circular'));
  record(assert(checks, !readRepo('src/core/eventVariants/eventVariantResolver.ts').includes('districtMemoryRuntime'), 'eventVariants no import', 'variant circular'));
  record(assert(checks, !readRepo('src/core/eventFreshness/eventFreshnessGuard.ts').includes('districtMemoryRuntime'), 'eventFreshness no import', 'freshness circular'));
  record(assert(checks, !readRepo('src/core/districtTrustRuntime/districtTrustRuntimeModel.ts').includes('districtMemoryRuntime'), 'trustRuntime no import', 'trust circular'));

  record(assert(checks, !readRepo('src/core/districtMemoryRuntime/districtMemoryRuntimeModel.ts').includes('Math.random'), 'no Math.random', 'Math.random found'));

  const docs = readRepo('docs/crevia-district-memory-runtime-lite.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('persist'), 'docs persist', 'docs persist missing'));
  record(assert(checks, docs.includes('trust'), 'docs trust difference', 'docs trust missing'));
  record(assert(checks, docs.includes('freshness'), 'docs freshness', 'docs freshness missing'));

  return { ok, warn: false, checks };
}
