import { MAP_DISTRICT_IDENTITY_IDS } from '@/core/districts/districtIdentityConstants';
import { DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import {
  buildDistrictTrustScoreResult,
  deriveDistrictTrustScore as deriveFoundationDistrictTrustScore,
  getDistrictTrustTrend as getFoundationDistrictTrustTrend,
} from '@/core/districtTrust/districtTrustModel';

import {
  DISTRICT_TRUST_RUNTIME_FALLBACK_SCORE,
  DISTRICT_TRUST_RUNTIME_SCORE_RANGE,
  DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY,
  getDistrictTrustRuntimeBandDefinition,
  resolveDistrictTrustRuntimeHealthStatus,
} from './districtTrustRuntimeConstants';
import type {
  CreviaDistrictTrustBand,
  CreviaDistrictTrustDistrictSnapshot,
  CreviaDistrictTrustRuntimeSnapshot,
  CreviaDistrictTrustSignalContext,
  CreviaDistrictTrustTrend,
} from './districtTrustRuntimeTypes';

function clampScore(score: number): number {
  return Math.min(
    DISTRICT_TRUST_RUNTIME_SCORE_RANGE.max,
    Math.max(DISTRICT_TRUST_RUNTIME_SCORE_RANGE.min, Math.round(score)),
  );
}

function mapFoundationTrend(trend: string): CreviaDistrictTrustTrend {
  if (trend === 'falling') return 'falling';
  if (trend === 'strained') return 'strained';
  if (trend === 'improving') return 'improving';
  if (trend === 'recovering') return 'recovering';
  return 'steady';
}

export function deriveDistrictTrustScore(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): number {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const score = deriveFoundationDistrictTrustScore({
    districtId: normalized,
    day: context.day,
    operationSignals: context.operationSignals,
    socialPulse: context.socialPulse,
    recentEvents: context.recentEvents,
    carryOver: context.carryOverMemory,
    resourceFatigue: context.resourceFatigue,
    crisisState: context.crisisState,
    reportSummary: context.dailyReport,
    rankPermissionUnlocked: context.rankPermissionUnlocked,
  });
  return clampScore(score);
}

export function deriveDistrictTrustTrend(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustTrend {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const trend = getFoundationDistrictTrustTrend({
    districtId: normalized,
    operationSignals: context.operationSignals,
    socialPulse: context.socialPulse,
    recentEvents: context.recentEvents,
    carryOver: context.carryOverMemory,
    resourceFatigue: context.resourceFatigue,
    crisisState: context.crisisState,
    reportSummary: context.dailyReport,
  });
  return mapFoundationTrend(trend);
}

export function deriveDistrictTrustBand(
  score: number,
  trend: CreviaDistrictTrustTrend,
  options: { isTutorialDay?: boolean } = {},
): CreviaDistrictTrustBand {
  if (options.isTutorialDay) {
    return score >= 70 ? 'stable' : 'watch';
  }

  if (score <= 24) return 'fragile';
  if (trend === 'recovering' && score >= 30 && score <= 74) return 'recovering';
  if (trend === 'improving' && score >= 45 && score < 80) return 'improving';
  if (trend === 'strained' && score <= 34) return 'strained';
  if (score <= 34) return 'watch';
  if (score <= 49) return 'watch';
  if (score <= 69) return 'stable';
  return 'trusted';
}

function buildReasonLine(band: CreviaDistrictTrustBand, districtName: string, trend: CreviaDistrictTrustTrend): string {
  const def = getDistrictTrustRuntimeBandDefinition(band);
  if (trend === 'recovering') return `${districtName}: toparlanma penceresi açık.`;
  if (trend === 'improving') return `${districtName}: güven yönü olumlu.`;
  return `${districtName}: ${def.reportCopyIntent}`;
}

export function buildDistrictTrustDistrictSnapshot(
  districtId: MapDistrictId | string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustDistrictSnapshot {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const identity = DISTRICT_IDENTITIES[normalized];
  const foundation = buildDistrictTrustScoreResult({
    districtId: normalized,
    day: context.day,
    operationSignals: context.operationSignals,
    socialPulse: context.socialPulse,
    recentEvents: context.recentEvents,
    carryOver: context.carryOverMemory,
    resourceFatigue: context.resourceFatigue,
    crisisState: context.crisisState,
    reportSummary: context.dailyReport,
    rankPermissionUnlocked: context.rankPermissionUnlocked,
  });

  const isTutorialDay = (context.day ?? 1) <= DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY;
  const score = isTutorialDay
    ? Math.max(DISTRICT_TRUST_RUNTIME_FALLBACK_SCORE, foundation.score)
    : foundation.score;
  const trend = deriveDistrictTrustTrend(normalized, context);
  const band = deriveDistrictTrustBand(score, trend, { isTutorialDay });

  return {
    districtId: normalized,
    districtName: identity?.name ?? normalized,
    score,
    band,
    trend,
    pressureDomains: foundation.pressureDomains,
    signalSources: foundation.signalSources,
    reasonLine: buildReasonLine(band, identity?.name ?? normalized, trend),
    isFallback: foundation.signalSources.length <= 1 && foundation.signalSources.includes('fallback'),
  };
}

export function buildDistrictTrustFallbackSnapshot(
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustRuntimeSnapshot {
  const day = context.day ?? 1;
  const districts = MAP_DISTRICT_IDENTITY_IDS.map((districtId) => ({
    districtId,
    districtName: DISTRICT_IDENTITIES[districtId].name,
    score: DISTRICT_TRUST_RUNTIME_FALLBACK_SCORE,
    band: 'watch' as CreviaDistrictTrustBand,
    trend: 'steady' as CreviaDistrictTrustTrend,
    pressureDomains: ['generic'],
    signalSources: ['fallback'],
    reasonLine: `${DISTRICT_IDENTITIES[districtId].name}: güven sinyali sınırlı; dengeli izleme.`,
    isFallback: true,
  }));

  return {
    day,
    focusDistrictId: normalizeMapDistrictId(context.focusDistrictId ?? 'merkez') ?? 'merkez',
    districts,
    healthStatus: 'fallback',
    isTutorialSimplified: day <= DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY,
    generatedAtDay: day,
  };
}

export function buildDistrictTrustRuntimeSnapshot(
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustRuntimeSnapshot {
  const day = context.day ?? 1;

  let districts: CreviaDistrictTrustDistrictSnapshot[];
  try {
    districts = MAP_DISTRICT_IDENTITY_IDS.map((districtId) =>
      buildDistrictTrustDistrictSnapshot(districtId, context),
    );
  } catch {
    return buildDistrictTrustFallbackSnapshot(context);
  }

  const focusDistrictId =
    normalizeMapDistrictId(context.focusDistrictId ?? districts[0]?.districtId ?? 'merkez') ?? 'merkez';

  return {
    day,
    focusDistrictId,
    districts,
    healthStatus: resolveDistrictTrustRuntimeHealthStatus(districts),
    isTutorialSimplified: day <= DISTRICT_TRUST_RUNTIME_TUTORIAL_MAX_DAY,
    generatedAtDay: day,
  };
}

export function getDistrictTrustDistrictSnapshot(
  snapshot: CreviaDistrictTrustRuntimeSnapshot,
  districtId: MapDistrictId | string,
): CreviaDistrictTrustDistrictSnapshot | undefined {
  const normalized = normalizeMapDistrictId(districtId);
  return snapshot.districts.find((d) => d.districtId === normalized);
}
