import { MAP_DISTRICT_IDENTITY_IDS, DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { buildDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

import {
  DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND,
  DISTRICT_MEMORY_RUNTIME_MAX_TRACES,
  DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY,
  getDistrictMemoryRuntimeKindDefinition,
  intensityWeight,
  resolveDistrictMemoryRuntimeHealthStatus,
} from './districtMemoryRuntimeConstants';
import type {
  CreviaDistrictMemoryDistrictSnapshot,
  CreviaDistrictMemoryIntensity,
  CreviaDistrictMemoryKind,
  CreviaDistrictMemorySignalContext,
  CreviaDistrictMemorySnapshot,
  CreviaDistrictMemoryTrace,
  CreviaDistrictMemoryTrend,
} from './districtMemoryRuntimeTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (isRecord(value)) return Object.values(value).map(textBlob).join(' ');
  return '';
}

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function districtName(id: MapDistrictId): string {
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function countRecent(values: readonly string[] | undefined, target: string): number {
  return (values ?? []).filter((v) => v === target).length;
}

export function deriveDistrictMemoryKind(
  districtId: MapDistrictId,
  context: CreviaDistrictMemorySignalContext,
): CreviaDistrictMemoryKind {
  const day = context.day ?? 1;
  if (day <= DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY) return DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND;

  const blob = textBlob([
    context.carryOverMemory,
    context.dailyReport,
    context.reportTomorrowPreview,
    context.recentEvents,
    context.operationSignals,
    context.socialPulse,
    context.crisisState,
    context.resourceFatigue,
  ]);

  const recentDistrictCount = countRecent(context.recentExposure?.districtIds, districtId);
  const recentDomainCount = (context.recentExposure?.domainIds ?? []).length;

  if (blob.includes('unresolved') || blob.includes('pending') || blob.includes('yarın') || blob.includes('carry')) {
    return 'unresolved_carry_over';
  }
  if (recentDistrictCount >= 2 || blob.includes('repeated') || blob.includes('tekrar')) {
    return 'repeated_pressure';
  }
  if (blob.includes('reward') || blob.includes('gratitude') || blob.includes('positive') || blob.includes('iyileş')) {
    return 'recent_improvement';
  }
  if (blob.includes('recovery') || blob.includes('toparlan') || blob.includes('resolved')) {
    return 'recovery_window';
  }
  if (blob.includes('trust') || blob.includes('güven')) return 'trust_shift';
  if (blob.includes('strained') || blob.includes('fatigue') || blob.includes('maintenance') || blob.includes('container')) {
    return 'resource_strain';
  }
  if (blob.includes('social') || blob.includes('complaint') || blob.includes('mention')) return 'social_echo';
  if (blob.includes('crisis') || blob.includes('watch') || blob.includes('elevated')) return 'crisis_watch';
  if (blob.includes('operation') || blob.includes('follow') || blob.includes('takip')) return 'operation_followup';
  if (recentDomainCount === 0 && recentDistrictCount === 0) return 'quiet_stable';
  return DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND;
}

export function deriveDistrictMemoryIntensity(
  kind: CreviaDistrictMemoryKind,
  context: CreviaDistrictMemorySignalContext,
): CreviaDistrictMemoryIntensity {
  const blob = textBlob([context.crisisState, context.resourceFatigue, context.recentEvents]);
  if (kind === 'crisis_watch' || kind === 'repeated_pressure') {
    return blob.includes('critical') ? 'high' : 'medium';
  }
  if (kind === 'quiet_stable' || kind === 'recent_improvement') return 'low';
  if (kind === 'recovery_window') return 'medium';
  return 'medium';
}

export function deriveDistrictMemoryTrend(
  kind: CreviaDistrictMemoryKind,
  context: CreviaDistrictMemorySignalContext,
): CreviaDistrictMemoryTrend {
  const blob = textBlob([context.recentEvents, context.dailyReport, context.carryOverMemory]);
  if (kind === 'recent_improvement' || blob.includes('improving')) return 'improving';
  if (kind === 'recovery_window' || blob.includes('toparlan')) return 'recovering';
  if (kind === 'repeated_pressure' || kind === 'crisis_watch') return 'worsening';
  return 'steady';
}

function buildTraceCopy(
  districtId: MapDistrictId,
  kind: CreviaDistrictMemoryKind,
  surface: 'map' | 'report' | 'advisor' | 'tomorrow' | 'selection',
): string {
  const def = getDistrictMemoryRuntimeKindDefinition(kind);
  const name = districtName(districtId);
  switch (surface) {
    case 'map':
      return `${name}: ${def.shortLabel} izi aktif.`;
    case 'report':
      return `${name} — ${def.reportCopyIntent}`;
    case 'advisor':
      return `${name}: ${def.advisorCopyIntent}`;
    case 'tomorrow':
      return `${name}: ${def.tomorrowCopyIntent}`;
    default:
      return def.selectionIntent;
  }
}

export function buildDistrictMemoryTraces(
  districtId: MapDistrictId,
  context: CreviaDistrictMemorySignalContext,
  primaryKind?: CreviaDistrictMemoryKind,
): CreviaDistrictMemoryTrace[] {
  const kind = primaryKind ?? deriveDistrictMemoryKind(districtId, context);
  const intensity = deriveDistrictMemoryIntensity(kind, context);
  const day = context.day ?? 1;

  const kinds: CreviaDistrictMemoryKind[] = [kind];
  if (kind === 'repeated_pressure') kinds.push('resource_strain');
  if (kind === 'unresolved_carry_over') kinds.push('trust_shift');
  if (kind === 'recovery_window') kinds.push('recent_improvement');
  if (kind === 'quiet_stable') kinds.push('quiet_stable');

  const uniqueKinds = [...new Set(kinds)].slice(0, DISTRICT_MEMORY_RUNTIME_MAX_TRACES);

  return uniqueKinds.map((traceKind, index) => {
    const traceIntensity =
      index === 0 ? intensity : index === 1 ? ('medium' as const) : ('low' as const);
    return {
      id: `dm_${districtId}_${traceKind}_${day}_${index}`,
      districtId,
      kind: traceKind,
      intensity: traceIntensity,
      sourceSurface: index === 0 ? 'primary' : 'derived',
      sourceDomain: context.recentExposure?.domainIds?.[0],
      dayWindow: index === 0 ? 'today' : 'recent',
      shortLine: buildTraceCopy(districtId, traceKind, 'report').slice(0, 72),
      selectionHint: getDistrictMemoryRuntimeKindDefinition(traceKind).selectionIntent,
      mapHint: buildTraceCopy(districtId, traceKind, 'map'),
      reportHint: buildTraceCopy(districtId, traceKind, 'report'),
      advisorHint: buildTraceCopy(districtId, traceKind, 'advisor'),
      tomorrowHint: buildTraceCopy(districtId, traceKind, 'tomorrow'),
    };
  });
}

export function buildDistrictMemoryDistrictSnapshot(
  districtId: MapDistrictId | string,
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemoryDistrictSnapshot {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const trustSnapshot =
    context.trustSnapshot ??
    buildDistrictTrustRuntimeSnapshot({
      day: context.day,
      focusDistrictId: normalized,
      operationSignals: context.operationSignals,
      socialPulse: context.socialPulse,
      recentEvents: context.recentEvents,
      carryOverMemory: context.carryOverMemory,
      resourceFatigue: context.resourceFatigue,
      crisisState: context.crisisState,
      dailyReport: context.dailyReport,
    });

  const trustDistrict = trustSnapshot.districts.find((d) => d.districtId === normalized);
  const isTutorial = (context.day ?? 1) <= DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY;
  const primaryKind = isTutorial ? DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND : deriveDistrictMemoryKind(normalized, context);
  const intensity = deriveDistrictMemoryIntensity(primaryKind, context);
  const trend = deriveDistrictMemoryTrend(primaryKind, context);
  const traces = buildDistrictMemoryTraces(normalized, context, primaryKind);

  return {
    districtId: normalized,
    districtName: districtName(normalized),
    primaryKind,
    intensity,
    trend,
    primaryTrace: traces[0],
    secondaryTrace: traces[1],
    optionalRecoveryTrace: traces[2],
    traces,
    trustBand: trustDistrict?.band,
    isFallback: isTutorial || primaryKind === DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND,
    reasonLine: traces[0]?.reportHint ?? `${districtName(normalized)}: sakin operasyon izi.`,
  };
}

export function buildDistrictMemoryFallbackSnapshot(
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemorySnapshot {
  const day = context.day ?? 1;
  const districts = MAP_DISTRICT_IDENTITY_IDS.map((id) => ({
    districtId: id,
    districtName: districtName(id),
    primaryKind: DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND,
    intensity: 'low' as CreviaDistrictMemoryIntensity,
    trend: 'steady' as CreviaDistrictMemoryTrend,
    traces: [],
    isFallback: true,
    reasonLine: `${districtName(id)}: mahalle izi sınırlı.`,
  }));

  return {
    day,
    focusDistrictId: normalizeMapDistrictId(context.focusDistrictId ?? 'merkez') ?? 'merkez',
    districts,
    healthStatus: 'fallback',
    isTutorialSimplified: day <= DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY,
  };
}

export function buildDistrictMemoryRuntimeSnapshot(
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemorySnapshot {
  const day = context.day ?? 1;

  let trustSnapshot: CreviaDistrictTrustRuntimeSnapshot | undefined;
  try {
    trustSnapshot =
      context.trustSnapshot ??
      buildDistrictTrustRuntimeSnapshot({
        day,
        focusDistrictId: context.focusDistrictId,
        operationSignals: context.operationSignals,
        socialPulse: context.socialPulse,
        recentEvents: context.recentEvents,
        carryOverMemory: context.carryOverMemory,
        resourceFatigue: context.resourceFatigue,
        crisisState: context.crisisState,
        dailyReport: context.dailyReport,
      });
  } catch {
    return buildDistrictMemoryFallbackSnapshot(context);
  }

  const enrichedContext: CreviaDistrictMemorySignalContext = { ...context, day, trustSnapshot };
  const districts = MAP_DISTRICT_IDENTITY_IDS.map((id) =>
    buildDistrictMemoryDistrictSnapshot(id, enrichedContext),
  );

  return {
    day,
    focusDistrictId: normalizeMapDistrictId(context.focusDistrictId ?? districts[0]?.districtId ?? 'merkez') ?? 'merkez',
    districts,
    healthStatus: resolveDistrictMemoryRuntimeHealthStatus(districts),
    isTutorialSimplified: day <= DISTRICT_MEMORY_RUNTIME_TUTORIAL_MAX_DAY,
    trustSnapshotRef: trustSnapshot,
  };
}

export function getDistrictMemoryDistrictSnapshot(
  snapshot: CreviaDistrictMemorySnapshot,
  districtId: MapDistrictId | string,
): CreviaDistrictMemoryDistrictSnapshot | undefined {
  const normalized = normalizeMapDistrictId(districtId);
  return snapshot.districts.find((d) => d.districtId === normalized);
}

export function deterministicMemoryKindForDistrict(
  districtId: MapDistrictId,
  context: CreviaDistrictMemorySignalContext,
): CreviaDistrictMemoryKind {
  const first = deriveDistrictMemoryKind(districtId, context);
  const second = deriveDistrictMemoryKind(districtId, context);
  return first === second ? first : DISTRICT_MEMORY_RUNTIME_FALLBACK_KIND;
}

export { intensityWeight, stableHash };
