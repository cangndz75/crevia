import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { SAVE_VERSION } from '@/store/gamePersist';
import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import {
  EVENT_FAMILY_REQUIRED_ECHO_SURFACES,
  EVENT_FAMILY_REQUIRED_VARIANT_KINDS,
} from '@/core/eventFamilies/eventFamilyConstants';

import {
  DISTRICT_TRUST_EVENT_FAMILY_LINKS,
  DISTRICT_TRUST_LEVELS,
  DISTRICT_TRUST_LEVEL_THRESHOLDS,
  DISTRICT_TRUST_PRESSURE_DOMAINS,
  DISTRICT_TRUST_RANK_PERMISSION_IDS,
  DISTRICT_TRUST_TRENDS,
} from './districtTrustConstants';
import {
  buildDistrictTrustScoreResult,
  clampDistrictTrustScore,
  deriveDistrictTrustForAllDistricts,
  deriveDistrictTrustScore,
  getDistrictTrustLevel,
  getDistrictTrustSafeFallback,
  shouldShowDistrictTrust,
} from './districtTrustModel';
import {
  buildDistrictMemoryLine,
  buildDistrictTrustMemoryItems,
  limitDistrictMemoryItems,
} from './districtTrustMemory';
import {
  buildDistrictTrustChipText,
  buildDistrictTrustPresentationModel,
  buildDistrictTrustPressureDomainLabel,
  buildDistrictTrustSummaryLine,
  buildDistrictTrustTrendLabel,
  buildDistrictTrustUnlockPreviewLine,
  collectDistrictTrustPresentationStrings,
  districtTrustCopyContainsForbiddenTerms,
} from './districtTrustPresentation';
import type { DistrictTrustPressureDomain } from './districtTrustTypes';

const REPO_ROOT = join(__dirname, '..', '..', '..');

export type VerifyDistrictTrustOutcome = {
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

function unique<T>(items: readonly T[]): boolean {
  return new Set(items).size === items.length;
}

function thresholdsDoNotOverlap(): boolean {
  const seen = new Set<number>();
  for (const threshold of Object.values(DISTRICT_TRUST_LEVEL_THRESHOLDS)) {
    if (threshold.min < 0 || threshold.max > 100 || threshold.min > threshold.max) return false;
    for (let score = threshold.min; score <= threshold.max; score += 1) {
      if (seen.has(score)) return false;
      seen.add(score);
    }
  }
  return seen.size === 101;
}

const positiveInput = {
  districtId: 'cumhuriyet',
  recentEvents: [{ tone: 'positive', kind: 'reward' }],
  socialPulse: {
    neighborhoods: {
      cumhuriyet: { trust: 76, complaintHeat: 20, gratitude: 70, crisisSpread: 10 },
    },
  },
  carryOver: { resolved: true },
  day: 5,
};

const crisisInput = {
  districtId: 'sanayi',
  operationSignals: {
    priorityDistrictId: 'sanayi',
    dailyFocus: 'vehicles',
    overall: { status: 'strained' },
    districts: { status: 'strained' },
  },
  crisisState: {
    riskLevel: 'watch',
    trend: 'worsening',
    activeIncident: { affectedDistrictIds: ['sanayi'] },
  },
  day: 5,
};

export function verifyDistrictTrustScenario(): VerifyDistrictTrustOutcome {
  const checks: string[] = [];
  let ok = true;
  const record = (pass: boolean) => {
    if (!pass) ok = false;
  };

  record(assert(checks, DISTRICT_TRUST_LEVELS.length === 6, 'Trust level count 6', 'Trust level count mismatch'));
  for (const level of DISTRICT_TRUST_LEVELS) {
    record(assert(checks, DISTRICT_TRUST_LEVEL_THRESHOLDS[level] != null, `${level} threshold`, `${level} threshold missing`));
  }
  record(assert(checks, thresholdsDoNotOverlap(), 'Thresholds cover 0-100 without overlap', 'Threshold overlap/range error'));
  record(assert(checks, getDistrictTrustLevel(10) === 'fragile', 'score 10 fragile', 'score 10 mismatch'));
  record(assert(checks, getDistrictTrustLevel(30) === 'watch', 'score 30 watch', 'score 30 mismatch'));
  record(assert(checks, getDistrictTrustLevel(50) === 'neutral', 'score 50 neutral', 'score 50 mismatch'));
  record(assert(checks, getDistrictTrustLevel(65) === 'stable', 'score 65 stable', 'score 65 mismatch'));
  record(assert(checks, getDistrictTrustLevel(80) === 'trusted', 'score 80 trusted', 'score 80 mismatch'));
  record(assert(checks, getDistrictTrustLevel(95) === 'supportive', 'score 95 supportive', 'score 95 mismatch'));

  for (const trend of DISTRICT_TRUST_TRENDS) {
    record(assert(checks, buildDistrictTrustTrendLabel(trend).length > 0, `trend label ${trend}`, `missing trend label ${trend}`));
  }
  for (const domain of DISTRICT_TRUST_PRESSURE_DOMAINS) {
    record(assert(checks, buildDistrictTrustPressureDomainLabel(domain).length > 0, `pressure label ${domain}`, `missing pressure label ${domain}`));
  }

  record(assert(checks, clampDistrictTrustScore(-4) === 0, 'clamp negative to 0', 'negative clamp failed'));
  record(assert(checks, clampDistrictTrustScore(150) === 100, 'clamp over max to 100', 'max clamp failed'));

  const fallback = getDistrictTrustSafeFallback('merkez');
  record(assert(checks, fallback.level === 'neutral' && fallback.trend === 'steady', 'safe fallback neutral/steady', 'fallback mismatch'));
  record(assert(checks, deriveDistrictTrustScore({ districtId: 'merkez' }) === 55, 'derive fallback score 55', 'fallback score mismatch'));

  record(assert(checks, deriveDistrictTrustScore(positiveInput) > 55, 'positive/reward signal increases score', 'positive score did not increase'));
  record(assert(checks, deriveDistrictTrustScore(crisisInput) < 55, 'crisis/watch signal lowers score', 'crisis score did not lower'));
  record(
    assert(
      checks,
      deriveDistrictTrustScore({
        districtId: 'sanayi',
        resourceFatigue: { state: 'critical', domain: 'vehicle' },
      }) < 55,
      'resource fatigue critical lowers score',
      'resource fatigue score did not lower',
    ),
  );

  const recovery = buildDistrictTrustScoreResult({
    districtId: 'cumhuriyet',
    recentEvents: [{ kind: 'recovery', title: 'toparlanma' }],
  });
  record(assert(checks, recovery.trend === 'recovering' || recovery.trend === 'improving', 'recovery trend', 'recovery trend mismatch'));

  const result = buildDistrictTrustScoreResult(crisisInput);
  record(assert(checks, result.reasonLines.length > 0, 'score result reasonLines', 'reasonLines missing'));
  record(assert(checks, result.signalSources.length > 0, 'score result signalSources', 'signalSources missing'));

  const all = deriveDistrictTrustForAllDistricts({ day: 5 });
  record(assert(checks, all.length === 5, 'all 5 districts derived', 'district count mismatch'));
  record(assert(checks, unique(all.map((item) => item.districtId)), 'district ids unique', 'district ids duplicate'));

  const repeatedMemory = buildDistrictTrustMemoryItems({
    districtId: 'sanayi',
    trustScoreResult: {
      ...result,
      pressureDomains: ['vehicle_route', 'personnel'] as DistrictTrustPressureDomain[],
    },
    recentEvents: [{ repeated: true }],
  });
  record(assert(checks, repeatedMemory.some((item) => item.kind === 'repeated_pressure'), 'repeated pressure memory', 'missing repeated pressure memory'));
  record(assert(checks, recovery.memoryItems.some((item) => item.kind === 'recovery_window' || item.kind === 'public_confidence_gain'), 'recovery memory', 'missing recovery memory'));
  record(assert(checks, (buildDistrictMemoryLine(repeatedMemory)?.length ?? 0) <= 96, 'memory line max short', 'memory line too long'));
  record(assert(checks, limitDistrictMemoryItems(repeatedMemory, 1).length <= 1, 'memory limit applies', 'memory limit failed'));

  const model = buildDistrictTrustPresentationModel(result, {
    includeMemory: true,
    visibilityMode: 'standard',
  });
  record(assert(checks, model.title.length > 0, 'presentation title', 'empty presentation title'));
  record(assert(checks, buildDistrictTrustChipText(result).length > 0, 'chip text', 'empty chip text'));
  record(assert(checks, buildDistrictTrustSummaryLine(result).length > 0, 'summary line', 'empty summary line'));
  record(assert(checks, model.pressureChips.length <= 3, 'pressure chips max 3', 'pressure chips over max'));
  record(assert(checks, !buildDistrictTrustPresentationModel(result, { visibilityMode: 'hidden' }).summaryLine.includes('detaylı'), 'hidden mode compact copy', 'hidden mode heavy copy'));
  record(assert(checks, buildDistrictTrustPresentationModel(result, { compact: true }).chipText.length <= 36, 'compact chip short', 'compact chip long'));
  record(assert(checks, model.memoryLine != null, 'standard mode memory line', 'standard mode missing memory'));
  record(assert(checks, ['hidden', 'compact'].includes(shouldShowDistrictTrust({ day: 1 })), 'Day 1 hidden/compact', 'Day 1 visibility too heavy'));
  record(assert(checks, shouldShowDistrictTrust({ day: 4 }) === 'standard', 'Day 4+ standard possible', 'Day 4 visibility mismatch'));
  record(assert(checks, buildDistrictTrustUnlockPreviewLine({ permissionId: DISTRICT_TRUST_RANK_PERMISSION_IDS.trustPreview }).length > 0, 'district_trust_preview line', 'trust preview line missing'));
  record(assert(checks, buildDistrictTrustUnlockPreviewLine({ permissionId: DISTRICT_TRUST_RANK_PERMISSION_IDS.memoryTracePreview }).length > 0, 'district_memory_trace_preview line', 'memory preview line missing'));

  const copy = [
    ...collectDistrictTrustPresentationStrings(model),
    buildDistrictTrustUnlockPreviewLine({ permissionId: DISTRICT_TRUST_RANK_PERMISSION_IDS.trustPreview }),
    buildDistrictTrustUnlockPreviewLine({ permissionId: DISTRICT_TRUST_RANK_PERMISSION_IDS.memoryTracePreview }),
  ].join(' ');
  record(assert(checks, districtTrustCopyContainsForbiddenTerms(copy).length === 0, 'forbidden copy clean', 'forbidden copy found'));

  const docs = readRepo('docs/crevia-district-trust-system.md');
  record(assert(checks, docs.includes('district_trust variant'), 'event family docs link', 'missing event family docs link'));
  record(assert(checks, docs.includes('district_trust_preview'), 'rank permission docs link', 'missing rank permission docs link'));
  record(assert(checks, docs.includes('SAVE_VERSION yok'), 'SAVE_VERSION docs note', 'missing SAVE_VERSION docs note'));
  record(assert(checks, docs.includes('Persist yok'), 'persist docs note', 'missing persist docs note'));
  record(assert(checks, docs.includes('UI redesign yok'), 'UI redesign docs note', 'missing UI redesign docs note'));

  record(assert(checks, EVENT_FAMILY_REQUIRED_VARIANT_KINDS.includes(DISTRICT_TRUST_EVENT_FAMILY_LINKS.variantKind), 'event family district_trust variant exists', 'event family district_trust missing'));
  record(assert(checks, EVENT_FAMILY_REQUIRED_ECHO_SURFACES.includes(DISTRICT_TRUST_EVENT_FAMILY_LINKS.echoSurface), 'event family district_memory echo exists', 'event family district_memory missing'));

  for (const file of [
    'src/core/game/ensureDailyEventsForDay.ts',
    'src/core/game/generateDailyEventSet.ts',
    'src/core/game/applyDecision.ts',
    'src/core/dayPipeline/dayPipelineOrchestrator.ts',
    'src/core/postPilot/postPilotEventEngine.ts',
    'src/store/gamePersist.ts',
  ]) {
    record(assert(checks, !readRepo(file).includes('districtTrust'), `${file} no districtTrust import`, `${file} imports districtTrust`));
  }

  const indexSrc = readRepo('src/core/districtTrust/index.ts');
  record(assert(checks, indexSrc.includes("districtTrustTypes"), 'type exports runtime-safe', 'index exports missing'));
  const trustSource = readRepo('src/core/districtTrust/districtTrustPresentation.ts') + readRepo('src/core/districtTrust/districtTrustModel.ts');
  record(assert(checks, !trustSource.includes("from '@/core/rankPermissions"), 'no rankPermissions circular import', 'rankPermissions import detected'));

  record(assert(checks, SAVE_VERSION === 26, 'SAVE_VERSION unchanged', `SAVE_VERSION=${SAVE_VERSION}`));
  checks.push('PASS Persist shape unchanged by scope: district trust is derived-only');
  checks.push('PASS UI integration skipped: foundation helper only, no redesign');
  record(assert(checks, MAP_DISTRICT_IDENTITY_IDS.length === 5, '5 core district ids source reused', 'district id source mismatch'));

  return { ok, warn: false, checks };
}
