import type { CreviaEventFreshnessContext } from '@/core/eventFreshness/eventFreshnessTypes';
import type { CreviaEventSelectionContext } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventVariantContext, CreviaEventVariantKind } from '@/core/eventVariants/eventVariantTypes';
import { getOperationEraCatalogEntry } from '@/core/operationEra/operationEraCatalog';

import {
  DISTRICT_OPERATIONS_RUNTIME_PANIC_TERMS,
  getDistrictOperationRuntimeKindDefinition,
} from './districtOperationsRuntimeConstants';
import {
  buildDistrictOperationsRuntimeSnapshot,
  getDistrictOperationRuntimeDistrictSnapshot,
  scoreDistrictOperationCandidate,
} from './districtOperationsRuntimeModel';
import type {
  CreviaDistrictOperationRuntimeContext,
  CreviaDistrictOperationRuntimeFreshnessModifier,
  CreviaDistrictOperationRuntimeKindDefinition,
  CreviaDistrictOperationRuntimeRankVisibility,
} from './districtOperationsRuntimeTypes';

export type CreviaDistrictOperationVariantBias = {
  districtId: string;
  operationKind: string;
  preferredVariants: CreviaEventVariantKind[];
  operationReasonLine: string;
  recommendedVariantBias: readonly string[];
};

export type CreviaDistrictOperationContentProductionHint = {
  districtId: string;
  operationKind: string;
  preferredDomains: string[];
  coverageNote: string;
  isRuntimeLinked: false;
};

export function buildDistrictOperationRankVisibility(
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimeRankVisibility {
  const rankKey = context.rankKey ?? '';
  const permissions = context.unlockedPermissionIds ?? [];

  if ((context.day ?? 1) <= 1) {
    return { mode: 'hidden', showKind: false, showReason: false, showTrustMemoryLink: false };
  }

  if (
    rankKey.includes('director') ||
    rankKey.includes('chief') ||
    permissions.includes('district_specific_operations_preview')
  ) {
    return { mode: 'detailed', showKind: true, showReason: true, showTrustMemoryLink: true };
  }

  if (permissions.includes('district_trust_preview') || rankKey.includes('supervisor')) {
    return { mode: 'standard', showKind: true, showReason: true, showTrustMemoryLink: false };
  }

  return { mode: 'compact', showKind: false, showReason: false, showTrustMemoryLink: false };
}

function primaryKindForDistrict(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext,
): CreviaDistrictOperationRuntimeKindDefinition | undefined {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId);
  const kind = district?.primary?.kind;
  return kind ? getDistrictOperationRuntimeKindDefinition(kind) : undefined;
}

export function applyDistrictOperationToEventSelectionContext(
  context: CreviaDistrictOperationRuntimeContext = {},
  base: Partial<CreviaEventSelectionContext> = {},
): Partial<CreviaEventSelectionContext> {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const focusId = base.districtId ?? snapshot.focusDistrictId ?? 'merkez';
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, focusId);
  const primary = district?.primary;
  const def = primary?.kind ? getDistrictOperationRuntimeKindDefinition(primary.kind) : undefined;

  const recentDomainIds = [
    ...(base.recentDomainIds ?? []),
    ...(def?.domainFocus.slice(0, 1) ?? []),
  ];

  let recentVariantKinds = base.recentVariantKinds ?? [];
  if (def?.recommendedVariantBias[0]) {
    recentVariantKinds = [...recentVariantKinds, def.recommendedVariantBias[0]];
  }

  return {
    ...base,
    day: base.day ?? context.day ?? snapshot.day,
    districtId: focusId,
    recentDomainIds,
    recentVariantKinds,
    operationEraId: base.operationEraId ?? context.operationEraId,
  };
}

export function buildDistrictOperationVariantContext(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext = {},
  base: Partial<CreviaEventVariantContext> = {},
): Partial<CreviaEventVariantContext> {
  const bias = buildDistrictOperationVariantBias(districtId, context);
  let recommendedVariantKind = base.recommendedVariantKind;
  if (!recommendedVariantKind && bias.preferredVariants[0]) {
    recommendedVariantKind = bias.preferredVariants[0];
  }

  return {
    ...base,
    day: base.day ?? context.day,
    districtId,
    recommendedVariantKind,
  };
}

export function buildDistrictOperationVariantBias(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationVariantBias {
  const def = primaryKindForDistrict(districtId, context);
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId);

  return {
    districtId: district?.districtId ?? 'merkez',
    operationKind: def?.kind ?? 'visible_service',
    preferredVariants: (def?.recommendedVariantBias ?? ['normal']) as CreviaEventVariantKind[],
    operationReasonLine: district?.primary?.advisorLine ?? def?.advisorHintIntent ?? '',
    recommendedVariantBias: def?.recommendedVariantBias ?? ['normal'],
  };
}

export function shouldApplyDistrictOperationVariantBias(
  bias: CreviaDistrictOperationVariantBias,
  variantKind: CreviaEventVariantKind,
): boolean {
  return bias.preferredVariants.includes(variantKind);
}

export function buildDistrictOperationFreshnessModifier(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationRuntimeFreshnessModifier {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  const district = getDistrictOperationRuntimeDistrictSnapshot(snapshot, districtId);
  const primaryKind = district?.primary?.kind ?? 'visible_service';
  const districtKinds = new Set(district?.candidates.map((c) => c.kind) ?? [primaryKind]);
  const recent = context.recentOperationKinds ?? [];

  let repeatKind = primaryKind;
  let repeatCount = 0;
  for (const kind of districtKinds) {
    const count = recent.filter((k) => k === kind).length;
    if (count > repeatCount) {
      repeatCount = count;
      repeatKind = kind;
    }
  }

  const repeatPenalty = repeatCount >= 1 ? 12 * repeatCount : 0;

  return {
    districtId: district?.districtId ?? 'merkez',
    operationKind: repeatKind,
    repeatPenalty,
    reasonLine:
      repeatPenalty > 0
        ? 'Aynı mahalle operasyonu tekrarı: freshness penalty uygulandı.'
        : 'Mahalle operasyon freshness nötr.',
  };
}

export function buildDistrictOperationContentProductionHint(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext = {},
): CreviaDistrictOperationContentProductionHint {
  const def = primaryKindForDistrict(districtId, context);
  const eraId = context.operationEraId;
  const era = eraId ? getOperationEraCatalogEntry(eraId) : undefined;

  return {
    districtId,
    operationKind: def?.kind ?? 'visible_service',
    preferredDomains: def?.domainFocus ?? ['generic_operation'],
    coverageNote: era
      ? `Operasyon önerisi ${era.shortLabel} dönemiyle hizalanabilir.`
      : 'Mahalle operasyon içerik kapsamı izleniyor.',
    isRuntimeLinked: false,
  };
}

export function applyDistrictOperationFreshnessContext(
  districtId: string,
  context: CreviaDistrictOperationRuntimeContext = {},
  base: Partial<CreviaEventFreshnessContext> = {},
): Partial<CreviaEventFreshnessContext> {
  const modifier = buildDistrictOperationFreshnessModifier(districtId, context);
  return {
    ...base,
    currentDay: base.currentDay ?? context.day ?? 1,
    recentDomainIds: [
      ...(base.recentDomainIds ?? []),
      ...(primaryKindForDistrict(districtId, context)?.domainFocus.slice(0, 1) ?? []),
    ],
    recentDistrictIds: modifier.repeatPenalty > 0 ? [districtId] : base.recentDistrictIds,
  };
}

export function scoreDistrictOperationKindForVerify(
  def: CreviaDistrictOperationRuntimeKindDefinition,
  context: CreviaDistrictOperationRuntimeContext,
  trustBand?: import('@/core/districtTrustRuntime/districtTrustRuntimeTypes').CreviaDistrictTrustBand,
  memoryKind?: import('@/core/districtMemoryRuntime/districtMemoryRuntimeTypes').CreviaDistrictMemoryKind,
): number {
  return scoreDistrictOperationCandidate(def, context, trustBand, memoryKind);
}

export function buildDistrictOperationsRuntimeRecommendationBundle(
  context: CreviaDistrictOperationRuntimeContext = {},
) {
  const snapshot = buildDistrictOperationsRuntimeSnapshot(context);
  return {
    summaryLine: `Gün ${snapshot.day}: ${snapshot.districts.length} mahalle operasyon önerisi (${snapshot.healthStatus}).`,
    snapshot,
    isRuntimeHintOnly: true as const,
  };
}

export { DISTRICT_OPERATIONS_RUNTIME_PANIC_TERMS };
