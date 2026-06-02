import { MAP_DISTRICT_IDENTITY_IDS, DISTRICT_IDENTITIES } from '@/core/districts/districtIdentityConstants';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import { buildDistrictMemoryRuntimeSnapshot, getDistrictMemoryDistrictSnapshot } from '@/core/districtMemoryRuntime/districtMemoryRuntimeModel';
import type { CreviaDistrictMemoryKind } from '@/core/districtMemoryRuntime/districtMemoryRuntimeTypes';
import { buildDistrictTrustRuntimeSnapshot, getDistrictTrustDistrictSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeModel';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import { getOperationEraCatalogEntry } from '@/core/operationEra/operationEraCatalog';

import {
  DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG,
  DISTRICT_OPERATIONS_RUNTIME_SCORE_WEIGHTS,
  DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY,
  getDistrictOperationRuntimeKindDefinition,
  getDistrictOperationRuntimeKindsForDistrict,
  resolveDistrictOperationsRuntimeHealthStatus,
} from './districtOperationsRuntimeConstants';
import type {
  CreviaDistrictOperationRuntimeCandidate,
  CreviaDistrictOperationRuntimeContext,
  CreviaDistrictOperationRuntimeDistrictSnapshot,
  CreviaDistrictOperationRuntimeKind,
  CreviaDistrictOperationRuntimeKindDefinition,
  CreviaDistrictOperationRuntimeRecommendation,
  CreviaDistrictOperationRuntimeSnapshot,
  CreviaDistrictOperationRuntimeTiming,
} from './districtOperationsRuntimeTypes';

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function textBlob(value: unknown): string {
  if (typeof value === 'string') return value.toLocaleLowerCase('tr-TR');
  if (Array.isArray(value)) return value.map(textBlob).join(' ');
  if (isRecord(value)) return Object.values(value).map(textBlob).join(' ');
  return '';
}

function districtName(id: MapDistrictId): string {
  return DISTRICT_IDENTITIES[id]?.name ?? id;
}

function countRecent(values: readonly string[] | undefined, target: string): number {
  return (values ?? []).filter((v) => v === target).length;
}

function isHighResourceFatigue(context: CreviaDistrictOperationRuntimeContext): boolean {
  const blob = textBlob(context.resourceFatigue);
  return (
    blob.includes('high') ||
    blob.includes('critical') ||
    blob.includes('fatigue') ||
    blob.includes('strained') ||
    blob.includes('maintenance') ||
    blob.includes('yorgun')
  );
}

function isCrisisWatch(context: CreviaDistrictOperationRuntimeContext): boolean {
  const blob = textBlob(context.crisisState);
  return (
    blob.includes('watch') ||
    blob.includes('elevated') ||
    blob.includes('crisis') ||
    blob.includes('risk')
  );
}

const SOCIAL_REPAIR_KINDS: readonly CreviaDistrictOperationRuntimeKind[] = [
  'social_trust_repair',
  'night_pressure_softening',
  'rapid_response',
  'container_balance',
];

const DOMAIN_FOCUS_KINDS: readonly CreviaDistrictOperationRuntimeKind[] = [
  'bulky_waste_control',
  'vehicle_flow',
  'industrial_waste_pressure',
  'route_coordination',
  'route_efficiency',
];

const REWARD_VISIBILITY_KINDS: readonly CreviaDistrictOperationRuntimeKind[] = [
  'visible_service',
  'low_noise_service',
  'environmental_care',
  'crowd_timing',
];

const RESOURCE_RELIEF_KINDS: readonly CreviaDistrictOperationRuntimeKind[] = [
  'route_efficiency',
  'vehicle_flow',
  'public_flow',
  'route_coordination',
  'container_balance',
  'transfer_flow',
];

const CRISIS_ADJACENT_KINDS: readonly CreviaDistrictOperationRuntimeKind[] = [
  'rapid_response',
  'transfer_flow',
  'industrial_waste_pressure',
];

function resolveTiming(
  band: CreviaDistrictTrustBand | undefined,
  memoryKind: CreviaDistrictMemoryKind | undefined,
): CreviaDistrictOperationRuntimeTiming {
  if (band === 'fragile' || band === 'strained' || memoryKind === 'repeated_pressure') return 'today';
  if (memoryKind === 'recent_improvement' || band === 'improving') return 'next_window';
  return 'when_ready';
}

function resolveConfidence(score: number): 'low' | 'medium' | 'high' {
  if (score >= 42) return 'high';
  if (score >= 24) return 'medium';
  return 'low';
}

function buildShortReason(
  def: CreviaDistrictOperationRuntimeKindDefinition,
  trustBand?: CreviaDistrictTrustBand,
  memoryKind?: CreviaDistrictMemoryKind,
): string {
  if (trustBand === 'fragile' || trustBand === 'strained') {
    return `${def.shortLabel}: güven onarımı öncelikli.`;
  }
  if (memoryKind === 'repeated_pressure') {
    return `${def.shortLabel}: tekrarlayan baskıya odak.`;
  }
  if (memoryKind === 'recent_improvement') {
    return `${def.shortLabel}: görünür hizmet penceresi.`;
  }
  return `${def.shortLabel}: mahalle operasyon önerisi.`;
}

function buildCandidateFromDefinition(
  def: CreviaDistrictOperationRuntimeKindDefinition,
  score: number,
  context: CreviaDistrictOperationRuntimeContext,
  trustBand?: CreviaDistrictTrustBand,
  memoryKind?: CreviaDistrictMemoryKind,
  priority = 0,
): CreviaDistrictOperationRuntimeCandidate {
  const day = context.day ?? 1;
  const timing = resolveTiming(trustBand, memoryKind);
  const confidence = resolveConfidence(score);

  return {
    id: `dor_${def.districtId}_${def.kind}_${day}_${priority}`,
    districtId: def.districtId,
    kind: def.kind,
    label: def.label,
    shortLabel: def.shortLabel,
    score,
    priority,
    confidence,
    recommendedTiming: timing,
    relatedDomains: [...def.domainFocus],
    relatedTrustBand: trustBand,
    relatedMemoryKind: memoryKind,
    shortReason: buildShortReason(def, trustBand, memoryKind),
    mapLine: def.mapHintIntent,
    reportLine: def.reportHintIntent,
    advisorLine: def.advisorHintIntent,
    tomorrowLine: def.tomorrowHintIntent,
    eventSelectionHint: `${def.shortLabel} · ${def.domainFocus[0] ?? 'operasyon'}`,
    isSelectableNow: false,
    isRuntimeHintOnly: true,
  };
}

export function scoreDistrictOperationCandidate(
  def: CreviaDistrictOperationRuntimeKindDefinition,
  context: CreviaDistrictOperationRuntimeContext,
  trustBand?: CreviaDistrictTrustBand,
  memoryKind?: CreviaDistrictMemoryKind,
): number {
  const weights = DISTRICT_OPERATIONS_RUNTIME_SCORE_WEIGHTS;
  let score = 10;

  const fragile = trustBand === 'fragile' || trustBand === 'strained';
  const recovering = trustBand === 'recovering' || trustBand === 'improving';

  if (fragile && SOCIAL_REPAIR_KINDS.includes(def.kind)) {
    score += weights.trustMatch;
  }
  if (recovering && (SOCIAL_REPAIR_KINDS.includes(def.kind) || def.kind.includes('repair'))) {
    score += weights.trustMatch * 0.6;
  }

  if (memoryKind === 'repeated_pressure' && DOMAIN_FOCUS_KINDS.includes(def.kind)) {
    score += weights.memoryMatch;
  }
  if (memoryKind === 'recent_improvement' && REWARD_VISIBILITY_KINDS.includes(def.kind)) {
    score += weights.memoryMatch;
  }
  if (memoryKind === 'resource_strain' && RESOURCE_RELIEF_KINDS.includes(def.kind)) {
    score += weights.memoryMatch * 0.8;
  }
  if (memoryKind === 'crisis_watch' && CRISIS_ADJACENT_KINDS.includes(def.kind)) {
    score += weights.memoryMatch * 0.7;
  }

  if (isHighResourceFatigue(context) && RESOURCE_RELIEF_KINDS.includes(def.kind)) {
    score += weights.resourceMatch;
  }

  if (isCrisisWatch(context) && CRISIS_ADJACENT_KINDS.includes(def.kind)) {
    score += weights.domainMatch;
  }

  const eraId = context.operationEraId;
  if (eraId) {
    const era = getOperationEraCatalogEntry(eraId);
    if (era) {
      const eraDomains = [...era.focusDomains, ...era.relatedEventFamilyDomains];
      const overlap = def.domainFocus.some((d) =>
        eraDomains.some((e) => e.includes(d) || d.includes(e)),
      );
      if (overlap || era.relatedDistrictOperationKinds.includes(def.foundationKind ?? '')) {
        score += weights.eraBonus;
      }
    }
  }

  const selectionFamily = context.selectionRecommendation?.eventFamilyId;
  if (selectionFamily) {
    const familyBlob = selectionFamily.toLocaleLowerCase('tr-TR');
    if (def.domainFocus.some((d) => familyBlob.includes(d))) {
      score += weights.domainMatch;
    }
  }

  const repeatCount = countRecent(context.recentOperationKinds, def.kind);
  if (repeatCount >= 1) {
    score -= weights.freshnessPenalty * repeatCount;
  }

  const blob = textBlob(context.operationSignals);
  if (blob.includes(def.kind.replace(/_/g, ' ')) || blob.includes(def.foundationKind ?? '')) {
    score += 4;
  }

  return Math.max(0, Math.round(score));
}

export function buildDistrictOperationCandidatesForDistrict(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimeCandidate[] {
  const normalized = normalizeMapDistrictId(districtId) ?? 'merkez';
  const kinds = getDistrictOperationRuntimeKindsForDistrict(normalized);

  let trustBand: CreviaDistrictTrustBand | undefined;
  let memoryKind: CreviaDistrictMemoryKind | undefined;

  try {
    const trustSnapshot =
      context.trustSnapshot ??
      buildDistrictTrustRuntimeSnapshot({
        day: context.day,
        focusDistrictId: normalized,
        operationSignals: context.operationSignals,
        resourceFatigue: context.resourceFatigue,
        crisisState: context.crisisState,
      });
    trustBand = getDistrictTrustDistrictSnapshot(trustSnapshot, normalized)?.band;

    const memorySnapshot =
      context.memorySnapshot ??
      buildDistrictMemoryRuntimeSnapshot({
        day: context.day,
        focusDistrictId: normalized,
        trustSnapshot,
        operationSignals: context.operationSignals,
        resourceFatigue: context.resourceFatigue,
        crisisState: context.crisisState,
      });
    memoryKind = getDistrictMemoryDistrictSnapshot(memorySnapshot, normalized)?.primaryKind;
  } catch {
    // fallback scoring without trust/memory
  }

  const scored = kinds.map((def) => ({
    def,
    score: scoreDistrictOperationCandidate(def, context, trustBand, memoryKind),
  }));

  return rankDistrictOperationCandidates(
    scored.map(({ def, score }, index) =>
      buildCandidateFromDefinition(def, score, context, trustBand, memoryKind, index),
    ),
  );
}

export function rankDistrictOperationCandidates(
  candidates: CreviaDistrictOperationRuntimeCandidate[],
): CreviaDistrictOperationRuntimeCandidate[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score || a.kind.localeCompare(b.kind))
    .map((c, index) => ({ ...c, priority: index }));
}

export function buildDistrictOperationRecommendation(
  districtId: MapDistrictId | string,
  context: CreviaDistrictOperationRuntimeContext = {},
): {
  primary?: CreviaDistrictOperationRuntimeRecommendation;
  secondary?: CreviaDistrictOperationRuntimeRecommendation;
  candidates: CreviaDistrictOperationRuntimeCandidate[];
} {
  const candidates = buildDistrictOperationCandidatesForDistrict(districtId, context);
  return {
    primary: candidates[0],
    secondary: candidates[1],
    candidates,
  };
}

function buildDistrictOperationDistrictSnapshot(
  districtId: MapDistrictId,
  context: CreviaDistrictOperationRuntimeContext,
): CreviaDistrictOperationRuntimeDistrictSnapshot {
  const isTutorial = (context.day ?? 1) <= DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY;
  const { primary, secondary, candidates } = buildDistrictOperationRecommendation(districtId, context);

  if (isTutorial) {
    const fallbackKind = getDistrictOperationRuntimeKindsForDistrict(districtId)[0];
    const fallbackCandidate = fallbackKind
      ? buildCandidateFromDefinition(fallbackKind, 5, context, 'watch', 'quiet_stable', 0)
      : undefined;

    return {
      districtId,
      districtName: districtName(districtId),
      primary: fallbackCandidate
        ? {
            ...fallbackCandidate,
            mapLine: `${districtName(districtId)}: operasyon önerisi sade tutuldu.`,
            reportLine: `${districtName(districtId)} — operasyon izleme modu.`,
            advisorLine: 'İlk gün: mahalle operasyon önerisi sınırlı.',
            tomorrowLine: 'Yarın operasyon önerileri açılabilir.',
            shortReason: 'İlk gün sade operasyon önerisi.',
            confidence: 'low',
            score: 5,
          }
        : undefined,
      candidates: fallbackCandidate ? [fallbackCandidate] : [],
      isFallback: true,
    };
  }

  return {
    districtId,
    districtName: districtName(districtId),
    primary,
    secondary,
    candidates,
    isFallback: !primary || candidates.every((c) => c.score <= 8),
  };
}

export function buildDistrictOperationFallbackSnapshot(
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimeSnapshot {
  const day = context.day ?? 1;
  const districts = MAP_DISTRICT_IDENTITY_IDS.map((id) => {
    const kinds = getDistrictOperationRuntimeKindsForDistrict(id);
    const def = kinds[0];
    const candidate = def
      ? buildCandidateFromDefinition(def, 8, context, 'watch', 'quiet_stable', 0)
      : undefined;
    return {
      districtId: id,
      districtName: districtName(id),
      primary: candidate,
      candidates: candidate ? [candidate] : [],
      isFallback: true,
    };
  });

  return {
    day,
    focusDistrictId: normalizeMapDistrictId(context.focusDistrictId ?? 'merkez') ?? 'merkez',
    districts,
    healthStatus: 'fallback',
    isTutorialSimplified: day <= DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY,
  };
}

export function buildDistrictOperationsRuntimeSnapshot(
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimeSnapshot {
  const day = context.day ?? 1;

  try {
    const districts = MAP_DISTRICT_IDENTITY_IDS.map((id) =>
      buildDistrictOperationDistrictSnapshot(id, { ...context, day }),
    );

    return {
      day,
      focusDistrictId:
        normalizeMapDistrictId(context.focusDistrictId ?? districts[0]?.districtId ?? 'merkez') ??
        'merkez',
      districts,
      healthStatus: resolveDistrictOperationsRuntimeHealthStatus(districts),
      isTutorialSimplified: day <= DISTRICT_OPERATIONS_RUNTIME_TUTORIAL_MAX_DAY,
    };
  } catch {
    return buildDistrictOperationFallbackSnapshot(context);
  }
}

export function getDistrictOperationRuntimeDistrictSnapshot(
  snapshot: CreviaDistrictOperationRuntimeSnapshot,
  districtId: MapDistrictId | string,
): CreviaDistrictOperationRuntimeDistrictSnapshot | undefined {
  const normalized = normalizeMapDistrictId(districtId);
  return snapshot.districts.find((d) => d.districtId === normalized);
}

export function listDistrictOperationRuntimeKindsForDistrict(
  districtId: MapDistrictId,
): CreviaDistrictOperationRuntimeKind[] {
  return getDistrictOperationRuntimeKindsForDistrict(districtId).map((d) => d.kind);
}

export { DISTRICT_OPERATIONS_RUNTIME_KIND_CATALOG, getDistrictOperationRuntimeKindDefinition };
