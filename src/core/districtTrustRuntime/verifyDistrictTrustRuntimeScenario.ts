import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { SAVE_VERSION } from '@/store/gamePersist';

import {
  DISTRICT_TRUST_RUNTIME_BANDS,
  DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS,
  DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY,
} from './districtTrustRuntimeConstants';
import {
  buildDistrictTrustFallbackSnapshot,
  buildDistrictTrustRuntimeSnapshot,
  deriveDistrictTrustBand,
  deriveDistrictTrustScore,
  deriveDistrictTrustTrend,
} from './districtTrustRuntimeModel';
import {
  applyDistrictTrustToEventSelectionContext,
  buildDistrictTrustFreshnessModifier,
  buildDistrictTrustRankVisibility,
  buildDistrictTrustSelectionHints,
  buildDistrictTrustVariantBias,
  buildDistrictTrustVariantContext,
  shouldApplyDistrictTrustVariantBias,
} from './districtTrustRuntimeSignals';
import {
  buildDistrictTrustAdvisorLine,
  buildDistrictTrustCompactChip,
  buildDistrictTrustDebugRows,
  buildDistrictTrustMapLine,
  buildDistrictTrustPresentationModel,
  buildDistrictTrustReportLine,
  buildDistrictTrustTomorrowPreviewLine,
  districtTrustRuntimeCopyContainsForbiddenTerms,
  districtTrustRuntimeCopyContainsPanicTerms,
  validateDistrictTrustPresentationCopy,
} from './districtTrustRuntimePresentation';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictTrustRuntimeOutcome = {
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

export function verifyDistrictTrustRuntimeScenario(): VerifyDistrictTrustRuntimeOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, SAVE_VERSION === 25, 'SAVE_VERSION 23', `SAVE_VERSION ${SAVE_VERSION}`));

  for (const id of MAP_DISTRICT_IDENTITY_IDS) {
    record(assert(checks, !!buildDistrictTrustRuntimeSnapshot({ day: 10, focusDistrictId: id }).districts.find((d) => d.districtId === id), `snapshot ${id}`, `missing ${id}`));
  }

  let emptyCrash = false;
  try {
    buildDistrictTrustRuntimeSnapshot({});
    buildDistrictTrustFallbackSnapshot({});
    deriveDistrictTrustScore('merkez', {});
  } catch {
    emptyCrash = true;
  }
  record(assert(checks, !emptyCrash, 'empty state fallback', 'empty state crash'));

  for (const band of DISTRICT_TRUST_RUNTIME_BANDS) {
    record(assert(checks, !!DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS[band], `band def ${band}`, `missing def ${band}`));
    record(assert(checks, DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS[band].label.length > 0, `${band} label`, `${band} label empty`));
    record(assert(checks, DISTRICT_TRUST_RUNTIME_BAND_DEFINITIONS[band].forbiddenTerms.length > 0, `${band} forbiddenTerms`, `${band} forbidden missing`));
  }

  record(assert(checks, deriveDistrictTrustBand(20, 'strained') === 'fragile', 'band fragile', 'fragile wrong'));
  record(assert(checks, deriveDistrictTrustBand(30, 'strained') === 'strained', 'band strained', 'strained wrong'));
  record(assert(checks, deriveDistrictTrustBand(40, 'steady') === 'watch', 'band watch', 'watch wrong'));
  record(assert(checks, deriveDistrictTrustBand(60, 'steady') === 'stable', 'band stable', 'stable wrong'));
  record(assert(checks, deriveDistrictTrustBand(80, 'steady') === 'trusted', 'band trusted', 'trusted wrong'));
  record(assert(checks, deriveDistrictTrustBand(55, 'improving') === 'improving', 'band improving', 'improving wrong'));
  record(assert(checks, deriveDistrictTrustBand(50, 'recovering') === 'recovering', 'band recovering', 'recovering wrong'));

  const fragileContext = {
    day: 10,
    socialPulse: { neighborhoods: { merkez: { trust: 18, complaintHeat: 92 } } },
    crisisState: { riskLevel: 'critical', activeIncident: { affectedDistrictIds: ['merkez'] } },
    recentEvents: [{ tone: 'negative', summary: 'negative worsened failed' }],
    resourceFatigue: { status: 'critical' },
  };

  const fragileBias = buildDistrictTrustVariantBias('merkez', fragileContext);
  record(
    assert(
      checks,
      fragileBias.shouldStrengthenComeback &&
        fragileBias.preferredVariants.some((v) => v === 'comeback' || v === 'district_trust'),
      'fragile comeback/district_trust bias',
      'fragile bias wrong',
    ),
  );

  const trustedContext = {
    day: 10,
    socialPulse: { neighborhoods: { cumhuriyet: { trust: 88, gratitude: 75 } } },
    recentEvents: [{ tone: 'reward', summary: 'gratitude positive reward' }],
    reportSummary: { lines: ['iyileşme olumlu'] },
    carryOverMemory: { summary: 'resolved stable' },
  };

  const trustedBias = buildDistrictTrustVariantBias('cumhuriyet', trustedContext);
  record(
    assert(
      checks,
      trustedBias.shouldStrengthenReward &&
        trustedBias.preferredVariants.some((v) => v === 'reward' || v === 'improved'),
      'trusted reward/improved bias',
      'trusted bias wrong',
    ),
  );

  const recoveringContext = {
    day: 10,
    recentEvents: [{ tone: 'recovery', summary: 'toparlanma recovery resolved' }],
    carryOverMemory: { summary: 'toparlanma devam unresolved pending' },
    reportSummary: { summary: 'iyileş toparlan' },
  };

  const recoveringBias = buildDistrictTrustVariantBias('yesilvadi', recoveringContext);
  record(
    assert(
      checks,
      recoveringBias.preferredVariants.some((v) => v === 'comeback' || v === 'carry_over'),
      'recovering carry_over/comeback bias',
      'recovering bias wrong',
    ),
  );

  const crisisLine = buildDistrictTrustVariantContext('merkez', {
    crisisState: { riskLevel: 'elevated' },
  });
  record(
    assert(
      checks,
      crisisLine.crisisRiskBand === 'high' || crisisLine.crisisRiskBand === 'critical',
      'crisis context without panic copy path',
      'crisis context wrong',
    ),
  );
  record(
    assert(
      checks,
      !districtTrustRuntimeCopyContainsPanicTerms('Risk büyümeden kontrol penceresi açık.'),
      'crisis line no panic',
      'panic in crisis line',
    ),
  );

  const day1Snapshot = buildDistrictTrustRuntimeSnapshot({ day: DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY });
  record(
    assert(
      checks,
      day1Snapshot.isTutorialSimplified && day1Snapshot.districts.every((d) => d.band === 'stable' || d.band === 'watch'),
      'day 1 simplified trust',
      'day1 complexity exposed',
    ),
  );

  const selectionHint = applyDistrictTrustToEventSelectionContext({ day: 10, focusDistrictId: 'merkez' });
  record(assert(checks, !!selectionHint.districtTrustBand, 'selection context hint', 'selection hint missing'));

  const variantCtx = buildDistrictTrustVariantContext('sanayi', { day: 10 });
  record(assert(checks, !!variantCtx.districtTrustBand, 'variant context hint', 'variant context missing'));

  const lowTrustModifier = buildDistrictTrustFreshnessModifier('merkez', fragileContext);
  record(
    assert(
      checks,
      lowTrustModifier.familyRepeatMultiplier < 1 && lowTrustModifier.districtRepeatMultiplier < 1,
      'low trust freshness soften',
      'low trust modifier wrong',
    ),
  );

  const trustedModifier = buildDistrictTrustFreshnessModifier('cumhuriyet', trustedContext);
  record(assert(checks, trustedModifier.rewardSpamGuard === true, 'trusted reward spam guard', 'reward spam guard missing'));

  const recoveringModifier = buildDistrictTrustFreshnessModifier('yesilvadi', recoveringContext);
  record(assert(checks, recoveringModifier.softenRecoveryRepeat === true, 'recovering soften repeat', 'recovering soften missing'));

  const presentation = buildDistrictTrustPresentationModel('merkez', { day: 10 });
  record(assert(checks, validateDistrictTrustPresentationCopy(presentation), 'presentation copy valid', 'presentation invalid'));
  record(assert(checks, (presentation.mapLine?.length ?? 0) <= 89, 'map line length', 'map line too long'));
  record(assert(checks, (presentation.reportLine?.length ?? 0) <= 89, 'report line length', 'report too long'));
  record(assert(checks, (presentation.advisorLine?.length ?? 0) <= 73, 'advisor line length', 'advisor too long'));
  record(assert(checks, (presentation.tomorrowPreviewLine?.length ?? 0) <= 73, 'tomorrow line length', 'tomorrow too long'));

  record(assert(checks, !districtTrustRuntimeCopyContainsForbiddenTerms(buildDistrictTrustReportLine('merkez', { day: 5 })), 'forbidden copy guard', 'forbidden copy'));

  const lowRankVis = buildDistrictTrustRankVisibility({ day: 5, rankKey: 'field_observer' });
  const highRankVis = buildDistrictTrustRankVisibility({
    day: 10,
    rankKey: 'operations_director',
    unlockedPermissionIds: ['district_memory_trace_preview'],
  });
  record(assert(checks, lowRankVis.mode === 'compact' && !lowRankVis.showTrend, 'low rank compact', 'low rank visibility'));
  record(assert(checks, highRankVis.mode === 'detailed' && highRankVis.showTrend, 'high rank detailed', 'high rank visibility'));

  record(assert(checks, buildDistrictTrustSelectionHints({ day: 10 }).length === 5, '5 selection hints', 'hint count wrong'));
  record(assert(checks, shouldApplyDistrictTrustVariantBias(trustedBias, 'reward'), 'variant bias apply', 'variant bias apply fail'));
  record(assert(checks, buildDistrictTrustDebugRows({ day: 10 }).length >= 6, 'debug rows', 'debug rows short'));

  const ensureDaily = readRepo('src/core/game/ensureDailyEventsForDay.ts');
  const selectionEngine = readRepo('src/core/eventSelection/eventFamilySelectionEngine.ts');
  const variantResolver = readRepo('src/core/eventVariants/eventVariantResolver.ts');
  const freshnessGuard = readRepo('src/core/eventFreshness/eventFreshnessGuard.ts');
  record(assert(checks, !ensureDaily.includes('districtTrustRuntime'), 'ensureDaily untouched', 'ensureDaily touched'));
  record(assert(checks, !selectionEngine.includes('districtTrustRuntime'), 'eventSelection no runtime import', 'selection circular'));
  record(assert(checks, !variantResolver.includes('districtTrustRuntime'), 'eventVariants no runtime import', 'variant circular'));
  record(assert(checks, !freshnessGuard.includes('districtTrustRuntime'), 'eventFreshness no runtime import', 'freshness circular'));

  record(assert(checks, !readRepo('src/core/districtTrustRuntime/districtTrustRuntimeModel.ts').includes('Math.random'), 'no Math.random', 'Math.random found'));

  const docs = readRepo('docs/crevia-district-trust-runtime-lite.md').toLocaleLowerCase('tr-TR');
  record(assert(checks, docs.includes('persist'), 'docs persist', 'docs persist missing'));
  record(assert(checks, docs.includes('selection'), 'docs selection', 'docs selection missing'));
  record(assert(checks, docs.includes('freshness'), 'docs freshness', 'docs freshness missing'));

  record(assert(checks, deriveDistrictTrustScore('merkez', { day: 10 }) >= 0, 'derive score', 'derive score fail'));
  record(assert(checks, !!deriveDistrictTrustTrend('merkez', { recentEvents: [{ tone: 'recovery' }] }), 'derive trend', 'derive trend fail'));

  return { ok, warn: false, checks };
}
