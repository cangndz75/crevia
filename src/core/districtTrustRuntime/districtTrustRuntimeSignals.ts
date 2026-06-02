import type { CreviaEventSelectionContext } from '@/core/eventSelection/eventSelectionTypes';
import type { CreviaEventFreshnessContext } from '@/core/eventFreshness/eventFreshnessTypes';
import type { CreviaEventVariantContext, CreviaEventVariantKind } from '@/core/eventVariants/eventVariantTypes';

import {
  DISTRICT_TRUST_RUNTIME_PANIC_TERMS,
  getDistrictTrustRuntimeBandDefinition,
} from './districtTrustRuntimeConstants';
import {
  buildDistrictTrustRuntimeSnapshot,
  getDistrictTrustDistrictSnapshot,
} from './districtTrustRuntimeModel';
import type {
  CreviaDistrictTrustBand,
  CreviaDistrictTrustFreshnessModifier,
  CreviaDistrictTrustRankVisibility,
  CreviaDistrictTrustSelectionHint,
  CreviaDistrictTrustSignalContext,
  CreviaDistrictTrustVariantBias,
} from './districtTrustRuntimeTypes';

function mapBandToSelectionTrust(
  band: CreviaDistrictTrustBand,
): CreviaEventSelectionContext['districtTrustBand'] {
  if (band === 'fragile' || band === 'strained') return 'fragile';
  if (band === 'watch' || band === 'recovering') return 'watch';
  if (band === 'trusted' || band === 'improving') return 'trusted';
  return 'stable';
}

function crisisBandFromContext(context: CreviaDistrictTrustSignalContext): CreviaEventSelectionContext['crisisRiskBand'] {
  const blob = JSON.stringify(context.crisisState ?? '').toLocaleLowerCase('tr-TR');
  if (blob.includes('critical')) return 'critical';
  if (blob.includes('elevated') || blob.includes('watch')) return 'high';
  return 'low';
}

function preferredDomainsForBand(band: CreviaDistrictTrustBand): string[] {
  if (band === 'fragile' || band === 'strained') return ['social', 'district_balance', 'resource_recovery'];
  if (band === 'trusted' || band === 'improving') return ['generic_operation', 'district_balance', 'social'];
  if (band === 'recovering') return ['resource_recovery', 'social', 'district_balance'];
  return ['district_balance', 'social', 'generic_operation'];
}

export function buildDistrictTrustRankVisibility(
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustRankVisibility {
  const rankKey = context.rankKey ?? '';
  const permissions = context.unlockedPermissionIds ?? [];
  const hasTrustPreview =
    permissions.includes('district_trust_preview') || context.rankPermissionUnlocked === true;

  if ((context.day ?? 1) <= 1) {
    return { mode: 'compact', showTrend: false, showRecoveryHint: false, showNextAction: false };
  }

  if (rankKey.includes('director') || rankKey.includes('chief') || permissions.includes('district_memory_trace_preview')) {
    return { mode: 'detailed', showTrend: true, showRecoveryHint: true, showNextAction: true };
  }

  if (hasTrustPreview || rankKey.includes('supervisor') || rankKey.includes('coordinator')) {
    return { mode: 'standard', showTrend: true, showRecoveryHint: false, showNextAction: false };
  }

  return { mode: 'compact', showTrend: false, showRecoveryHint: false, showNextAction: false };
}

export function buildDistrictTrustHintForDistrict(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustSelectionHint {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  const band = district?.band ?? 'watch';
  const def = getDistrictTrustRuntimeBandDefinition(band);

  return {
    districtId: district?.districtId ?? 'merkez',
    band,
    preferredDomains: preferredDomainsForBand(band),
    preferredVariantKinds: def.recommendedVariantBias as CreviaDistrictTrustSelectionHint['preferredVariantKinds'],
    eventWeightIntent: def.eventWeightIntent,
    isRuntimeHintOnly: true,
  };
}

export function buildDistrictTrustSelectionHints(
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustSelectionHint[] {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  return snapshot.districts.map((d) => buildDistrictTrustHintForDistrict(d.districtId, context));
}

export function applyDistrictTrustToEventSelectionContext(
  context: CreviaDistrictTrustSignalContext = {},
  base: Partial<CreviaEventSelectionContext> = {},
): Partial<CreviaEventSelectionContext> {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const focusId = base.districtId ?? snapshot.focusDistrictId ?? 'merkez';
  const district = getDistrictTrustDistrictSnapshot(snapshot, focusId);
  const band = district?.band ?? 'watch';

  return {
    ...base,
    day: base.day ?? context.day ?? snapshot.day,
    districtId: focusId,
    districtTrustBand: mapBandToSelectionTrust(band),
    crisisRiskBand: base.crisisRiskBand ?? crisisBandFromContext(context),
    operationCareerPhase: base.operationCareerPhase,
  };
}

export function buildDistrictTrustVariantBias(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustVariantBias {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  const band = district?.band ?? 'watch';
  const def = getDistrictTrustRuntimeBandDefinition(band);

  return {
    districtId: district?.districtId ?? 'merkez',
    band,
    preferredVariants: def.recommendedVariantBias as CreviaEventVariantKind[],
    reasonLine: `${district?.districtName ?? districtId}: ${def.advisorCopyIntent}`,
    shouldStrengthenReward: band === 'trusted' || band === 'improving' || band === 'stable',
    shouldStrengthenComeback: band === 'fragile' || band === 'strained' || band === 'recovering',
  };
}

export function buildDistrictTrustVariantContext(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
  base: Partial<CreviaEventVariantContext> = {},
): Partial<CreviaEventVariantContext> {
  const bias = buildDistrictTrustVariantBias(districtId, context);
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  const band = district?.band ?? 'watch';

  let recommendedVariantKind = base.recommendedVariantKind;
  if (!recommendedVariantKind) {
    if (bias.shouldStrengthenComeback) recommendedVariantKind = 'comeback';
    else if (bias.shouldStrengthenReward) recommendedVariantKind = 'reward';
    else if (band === 'recovering') recommendedVariantKind = 'carry_over';
  }

  return {
    ...base,
    day: base.day ?? context.day,
    districtId,
    districtTrustBand: mapBandToSelectionTrust(band),
    recommendedVariantKind,
    crisisRiskBand: base.crisisRiskBand ?? crisisBandFromContext(context),
  };
}

export function shouldApplyDistrictTrustVariantBias(
  bias: CreviaDistrictTrustVariantBias,
  variantKind: CreviaEventVariantKind,
): boolean {
  if (bias.preferredVariants.includes(variantKind)) return true;
  if (bias.shouldStrengthenReward && (variantKind === 'reward' || variantKind === 'improved')) return true;
  if (bias.shouldStrengthenComeback && (variantKind === 'comeback' || variantKind === 'district_trust')) return true;
  return false;
}

export function buildDistrictTrustFreshnessModifier(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
): CreviaDistrictTrustFreshnessModifier {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const district = getDistrictTrustDistrictSnapshot(snapshot, districtId);
  const band = district?.band ?? 'watch';

  if (band === 'fragile' || band === 'strained') {
    return {
      districtId: district?.districtId ?? 'merkez',
      band,
      familyRepeatMultiplier: 0.65,
      districtRepeatMultiplier: 0.7,
      variantRepeatMultiplier: 0.85,
      rewardSpamGuard: false,
      softenRecoveryRepeat: true,
      reasonLine: 'Düşük güven mahallesine tekrar baskı yumuşatıldı.',
    };
  }

  if (band === 'recovering' || band === 'improving') {
    return {
      districtId: district?.districtId ?? 'merkez',
      band,
      familyRepeatMultiplier: 0.9,
      districtRepeatMultiplier: 0.95,
      variantRepeatMultiplier: 0.75,
      rewardSpamGuard: false,
      softenRecoveryRepeat: true,
      reasonLine: 'Toparlanma mahallesinde recovery tekrar guard yumuşatıldı.',
    };
  }

  if (band === 'trusted') {
    return {
      districtId: district?.districtId ?? 'merkez',
      band,
      familyRepeatMultiplier: 1,
      districtRepeatMultiplier: 1,
      variantRepeatMultiplier: 1.35,
      rewardSpamGuard: true,
      softenRecoveryRepeat: false,
      reasonLine: 'Güçlü güven mahallesinde reward spam guard aktif.',
    };
  }

  return {
    districtId: district?.districtId ?? 'merkez',
    band,
    familyRepeatMultiplier: 1,
    districtRepeatMultiplier: 1,
    variantRepeatMultiplier: 1,
    rewardSpamGuard: false,
    softenRecoveryRepeat: false,
    reasonLine: 'Standart freshness modifier.',
  };
}

export function applyDistrictTrustFreshnessContext(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
  base: Partial<CreviaEventFreshnessContext> = {},
): Partial<CreviaEventFreshnessContext> {
  const modifier = buildDistrictTrustFreshnessModifier(districtId, context);
  return {
    ...base,
    currentDay: base.currentDay ?? context.day ?? 1,
    crisisRiskBand: base.crisisRiskBand ?? crisisBandFromContext(context),
  };
}

export function buildDistrictTrustFreshnessContextLine(
  districtId: string,
  context: CreviaDistrictTrustSignalContext = {},
): string {
  const modifier = buildDistrictTrustFreshnessModifier(districtId, context);
  return modifier.reasonLine;
}

export function buildDistrictTrustCrisisAdjacentContextLine(
  context: CreviaDistrictTrustSignalContext = {},
): string | undefined {
  const crisis = crisisBandFromContext(context);
  if (crisis !== 'high' && crisis !== 'critical') return undefined;
  const line = 'Risk büyümeden kontrol penceresi açık.';
  if (DISTRICT_TRUST_RUNTIME_PANIC_TERMS.some((t) => line.includes(t))) return undefined;
  return line;
}

export function buildDistrictTrustRuntimeRecommendation(
  context: CreviaDistrictTrustSignalContext = {},
): import('./districtTrustRuntimeTypes').CreviaDistrictTrustRuntimeRecommendation {
  const snapshot = buildDistrictTrustRuntimeSnapshot(context);
  const hints = buildDistrictTrustSelectionHints(context);
  return {
    summaryLine: `Gün ${snapshot.day}: ${snapshot.districts.length} mahalle trust snapshot (${snapshot.healthStatus}).`,
    snapshot,
    selectionHints: hints,
    isRuntimeHintOnly: true,
  };
}
