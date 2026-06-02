import type { CreviaEventSelectionContext } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventFreshnessContext } from '@/core/eventFreshness/eventFreshnessTypes';
import type { CreviaEventVariantContext, CreviaEventVariantKind } from '@/core/eventVariants/eventVariantTypes';
import type { CreviaDistrictTrustRuntimeSnapshot } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';

import {
  DISTRICT_MEMORY_RUNTIME_PANIC_TERMS,
  getDistrictMemoryRuntimeKindDefinition,
} from './districtMemoryRuntimeConstants';
import {
  buildDistrictMemoryDistrictSnapshot,
  buildDistrictMemoryRuntimeSnapshot,
  getDistrictMemoryDistrictSnapshot,
} from './districtMemoryRuntimeModel';
import type {
  CreviaDistrictMemoryFreshnessModifier,
  CreviaDistrictMemoryKind,
  CreviaDistrictMemoryRankVisibility,
  CreviaDistrictMemorySelectionHint,
  CreviaDistrictMemorySignalContext,
  CreviaDistrictMemoryTrustContext,
  CreviaDistrictMemoryVariantBias,
} from './districtMemoryRuntimeTypes';

function preferredDomainsForKind(kind: CreviaDistrictMemoryKind): string[] {
  switch (kind) {
    case 'unresolved_carry_over':
    case 'trust_shift':
      return ['social', 'district_balance', 'resource_recovery'];
    case 'repeated_pressure':
    case 'resource_strain':
      return ['resource_recovery', 'personnel', 'vehicle_route'];
    case 'recent_improvement':
    case 'quiet_stable':
      return ['generic_operation', 'social', 'district_balance'];
    case 'recovery_window':
      return ['resource_recovery', 'social'];
    case 'crisis_watch':
      return ['crisis_adjacent'];
    case 'social_echo':
      return ['social', 'district_balance'];
    case 'operation_followup':
      return ['generic_operation', 'container'];
    default:
      return ['generic_operation'];
  }
}

export function buildDistrictMemoryRankVisibility(
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemoryRankVisibility {
  const rankKey = context.rankKey ?? '';
  const permissions = context.unlockedPermissionIds ?? [];

  if ((context.day ?? 1) <= 1) {
    return { mode: 'compact', showKind: false, showReason: false, showRecoveryAction: false };
  }

  if (rankKey.includes('director') || rankKey.includes('chief') || permissions.includes('district_memory_trace_preview')) {
    return { mode: 'detailed', showKind: true, showReason: true, showRecoveryAction: true };
  }

  if (permissions.includes('district_trust_preview') || rankKey.includes('supervisor')) {
    return { mode: 'standard', showKind: true, showReason: true, showRecoveryAction: false };
  }

  return { mode: 'compact', showKind: false, showReason: false, showRecoveryAction: false };
}

export function buildDistrictMemoryHintForDistrict(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemorySelectionHint {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const district = getDistrictMemoryDistrictSnapshot(snapshot, districtId);
  const kind = district?.primaryKind ?? 'quiet_stable';
  const def = getDistrictMemoryRuntimeKindDefinition(kind);

  return {
    districtId: district?.districtId ?? 'merkez',
    kind,
    preferredDomains: preferredDomainsForKind(kind),
    preferredVariantKinds: def.variantBias as CreviaDistrictMemorySelectionHint['preferredVariantKinds'],
    selectionIntent: def.selectionIntent,
    deprioritizeProblemSpam: kind === 'quiet_stable' || kind === 'recent_improvement',
    isRuntimeHintOnly: true,
  };
}

export function buildDistrictMemorySelectionHints(
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemorySelectionHint[] {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  return snapshot.districts.map((d) => buildDistrictMemoryHintForDistrict(d.districtId, context));
}

export function applyDistrictMemoryToEventSelectionContext(
  context: CreviaDistrictMemorySignalContext = {},
  base: Partial<CreviaEventSelectionContext> = {},
): Partial<CreviaEventSelectionContext> {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const focusId = base.districtId ?? snapshot.focusDistrictId ?? 'merkez';
  const district = getDistrictMemoryDistrictSnapshot(snapshot, focusId);
  const hint = buildDistrictMemoryHintForDistrict(focusId, context);

  const recentDomainIds = [
    ...(base.recentDomainIds ?? []),
    ...hint.preferredDomains.slice(0, 1),
  ];

  let recentVariantKinds = base.recentVariantKinds ?? [];
  if (district?.primaryKind === 'unresolved_carry_over') {
    recentVariantKinds = [...recentVariantKinds, 'carry_over'];
  }

  return {
    ...base,
    day: base.day ?? context.day ?? snapshot.day,
    districtId: focusId,
    recentDomainIds,
    recentVariantKinds,
  };
}

export function buildDistrictMemoryVariantBias(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemoryVariantBias {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const district = getDistrictMemoryDistrictSnapshot(snapshot, districtId);
  const kind = district?.primaryKind ?? 'quiet_stable';
  const def = getDistrictMemoryRuntimeKindDefinition(kind);
  const trace = district?.primaryTrace;

  return {
    districtId: district?.districtId ?? 'merkez',
    kind,
    preferredVariants: def.variantBias as CreviaEventVariantKind[],
    memoryReasonLine: trace?.advisorHint ?? def.advisorCopyIntent,
    shouldStrengthenReward: kind === 'recent_improvement' || kind === 'quiet_stable',
    shouldStrengthenComeback:
      kind === 'recovery_window' ||
      kind === 'repeated_pressure' ||
      kind === 'unresolved_carry_over',
  };
}

export function buildDistrictMemoryVariantContext(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
  base: Partial<CreviaEventVariantContext> = {},
): Partial<CreviaEventVariantContext> {
  const bias = buildDistrictMemoryVariantBias(districtId, context);
  let recommendedVariantKind = base.recommendedVariantKind;
  if (!recommendedVariantKind && bias.preferredVariants[0]) {
    recommendedVariantKind = bias.preferredVariants[0];
  }

  return {
    ...base,
    day: base.day ?? context.day,
    districtId,
    recommendedVariantKind,
    hasUnresolvedCarryOver: bias.kind === 'unresolved_carry_over' || base.hasUnresolvedCarryOver,
  };
}

export function shouldApplyDistrictMemoryVariantBias(
  bias: CreviaDistrictMemoryVariantBias,
  variantKind: CreviaEventVariantKind,
): boolean {
  if (bias.preferredVariants.includes(variantKind)) return true;
  if (bias.shouldStrengthenReward && (variantKind === 'reward' || variantKind === 'improved')) return true;
  if (bias.shouldStrengthenComeback && (variantKind === 'comeback' || variantKind === 'carry_over' || variantKind === 'district_trust')) {
    return true;
  }
  return false;
}

export function buildDistrictMemoryFreshnessModifier(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
): CreviaDistrictMemoryFreshnessModifier {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  const district = getDistrictMemoryDistrictSnapshot(snapshot, districtId);
  const kind = district?.primaryKind ?? 'quiet_stable';

  if (kind === 'repeated_pressure') {
    return {
      districtId: district?.districtId ?? 'merkez',
      kind,
      familyRepeatMultiplier: 1.4,
      variantRepeatMultiplier: 1.2,
      rewardSpamGuard: false,
      softenRecoveryRepeat: false,
      reduceProblemSpam: true,
      reasonLine: 'Tekrarlayan baskı: aynı problem family tekrarı artırıldı.',
    };
  }

  if (kind === 'recovery_window') {
    return {
      districtId: district?.districtId ?? 'merkez',
      kind,
      familyRepeatMultiplier: 0.85,
      variantRepeatMultiplier: 0.7,
      rewardSpamGuard: false,
      softenRecoveryRepeat: true,
      reduceProblemSpam: false,
      reasonLine: 'Toparlanma penceresi: recovery/comeback penalty yumuşatıldı.',
    };
  }

  if (kind === 'recent_improvement') {
    return {
      districtId: district?.districtId ?? 'merkez',
      kind,
      familyRepeatMultiplier: 1,
      variantRepeatMultiplier: 1.3,
      rewardSpamGuard: true,
      softenRecoveryRepeat: false,
      reduceProblemSpam: false,
      reasonLine: 'Son iyileşme: reward spam guard aktif.',
    };
  }

  if (kind === 'quiet_stable') {
    return {
      districtId: district?.districtId ?? 'merkez',
      kind,
      familyRepeatMultiplier: 1.2,
      variantRepeatMultiplier: 1,
      rewardSpamGuard: false,
      softenRecoveryRepeat: false,
      reduceProblemSpam: true,
      reasonLine: 'Sakin mahalle: problem spam guard aktif.',
    };
  }

  return {
    districtId: district?.districtId ?? 'merkez',
    kind,
    familyRepeatMultiplier: 1,
    variantRepeatMultiplier: 1,
    rewardSpamGuard: false,
    softenRecoveryRepeat: kind === 'unresolved_carry_over',
    reduceProblemSpam: false,
    reasonLine: 'Standart memory freshness modifier.',
  };
}

export function buildDistrictMemoryFreshnessContextLine(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
): string {
  return buildDistrictMemoryFreshnessModifier(districtId, context).reasonLine;
}

export function applyDistrictMemoryFreshnessContext(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
  base: Partial<CreviaEventFreshnessContext> = {},
): Partial<CreviaEventFreshnessContext> {
  return {
    ...base,
    currentDay: base.currentDay ?? context.day ?? 1,
  };
}

export function buildDistrictMemoryTrustContext(
  districtId: string,
  context: CreviaDistrictMemorySignalContext = {},
  trustSnapshot?: CreviaDistrictTrustRuntimeSnapshot,
): CreviaDistrictMemoryTrustContext {
  const memorySnapshot = buildDistrictMemoryRuntimeSnapshot({ ...context, trustSnapshot });
  const district = getDistrictMemoryDistrictSnapshot(memorySnapshot, districtId);
  const kind = district?.primaryKind ?? 'quiet_stable';
  const trustBand = district?.trustBand;
  const fragile = trustBand === 'fragile' || trustBand === 'strained';

  return {
    districtId: district?.districtId ?? 'merkez',
    trustBand,
    memoryKind: kind,
    combinedReasonLine: `${district?.districtName ?? districtId}: güven ${trustBand ?? 'unknown'}, hafıza ${kind}.`,
    softCopyForFragile: fragile && kind === 'unresolved_carry_over',
    boostRewardVisibility: trustBand === 'improving' && kind === 'recent_improvement',
  };
}

export function buildDistrictMemoryRuntimeRecommendation(
  context: CreviaDistrictMemorySignalContext = {},
): import('./districtMemoryRuntimeTypes').CreviaDistrictMemoryRuntimeRecommendation {
  const snapshot = buildDistrictMemoryRuntimeSnapshot(context);
  return {
    summaryLine: `Gün ${snapshot.day}: ${snapshot.districts.length} mahalle memory snapshot (${snapshot.healthStatus}).`,
    snapshot,
    selectionHints: buildDistrictMemorySelectionHints(context),
    isRuntimeHintOnly: true,
  };
}

export function buildDistrictMemoryVariantBiasFromKind(
  kind: CreviaDistrictMemoryKind,
  districtId: string = 'merkez',
): CreviaDistrictMemoryVariantBias {
  const def = getDistrictMemoryRuntimeKindDefinition(kind);
  return {
    districtId: districtId as CreviaDistrictMemoryVariantBias['districtId'],
    kind,
    preferredVariants: def.variantBias as CreviaEventVariantKind[],
    memoryReasonLine: def.advisorCopyIntent,
    shouldStrengthenReward: kind === 'recent_improvement' || kind === 'quiet_stable',
    shouldStrengthenComeback: kind === 'recovery_window' || kind === 'repeated_pressure',
  };
}

export { DISTRICT_MEMORY_RUNTIME_PANIC_TERMS };
