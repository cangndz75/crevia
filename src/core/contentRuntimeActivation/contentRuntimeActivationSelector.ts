import {
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  CONTAINER_ENVIRONMENT_PACK_ONE_ID,
  type ContainerEnvironmentPackOneFamily,
} from '@/core/contentProduction/contentPacks/containerEnvironmentPackOne';
import {
  CRISIS_ADJACENT_PACK_ONE_FAMILIES,
  CRISIS_ADJACENT_PACK_ONE_ID,
  type CrisisAdjacentPackOneFamily,
} from '@/core/contentProduction/contentPacks/crisisAdjacentPackOne';
import {
  DISTRICT_PACK_ONE_FAMILIES,
  DISTRICT_PACK_ONE_ID,
  type DistrictPackOneFamily,
} from '@/core/contentProduction/contentPacks/districtPackOne';
import {
  SOCIAL_TRUST_PACK_ONE_FAMILIES,
  SOCIAL_TRUST_PACK_ONE_ID,
  type SocialTrustPackOneFamily,
} from '@/core/contentProduction/contentPacks/socialTrustPackOne';
import {
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_ID,
  type VehicleRoutePackOneFamily,
} from '@/core/contentProduction/contentPacks/vehicleRoutePackOne';

import {
  CONTENT_RUNTIME_ACTIVATION_FAMILY_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_MAX_DOMAINS_MENTION,
} from './contentRuntimeActivationConstants';
import {
  CONTENT_RUNTIME_ACTIVATION_FULL_STORY_TRIGGER_MAX_PER_DAY,
  districtBalanceBlocksCandidate,
  evaluateCandidateStoryChainEligibility,
  filterPoolByActivationMode,
  freshnessBlocksCandidate,
  inferSemanticCluster,
  type ContentRuntimeActivationGuardContext,
} from './contentRuntimeActivationFullGuards';
import type {
  ContentRuntimeActivationFamilyCandidate,
  ContentRuntimeActivationInput,
  ContentRuntimeActivationMode,
  ContentRuntimeActivationModel,
  ContentRuntimeActivationPackId,
} from './contentRuntimeActivationTypes';

export function stableContentRuntimeHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mapDistrictFamily(family: DistrictPackOneFamily): ContentRuntimeActivationFamilyCandidate {
  return {
    packId: DISTRICT_PACK_ONE_ID,
    familyId: family.id,
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    variantCopies: family.variantCopies.map((v) => ({ kind: v.kind, text: v.text })),
    recommendedVariantKinds: [...family.recommendedVariantKinds],
    echoes: {
      advisor: family.echoes.advisor,
      report: family.echoes.report,
      social: family.echoes.social,
      map: family.echoes.map,
      tomorrow_preview: family.echoes.tomorrow_preview,
      result: family.echoes.result,
    },
    scene: family.concreteScene,
    problem: family.visibleOperationalProblem,
    tradeoff: family.decisionTradeoff,
    shortTermEffect: family.shortTermEffect,
    carryOver: family.carryOverConsequence,
    intents: {
      trust: family.trustIntent,
      memory: family.memoryIntent,
      resource: family.resourceIntent,
      crisisAdjacency: family.crisisAdjacency,
    },
    score: 0,
    selectedDistrictId: family.districtIds[0],
    selectedVariantKind: 'normal',
    selectedVariantText: family.variantCopies[0]?.text ?? family.shortTermEffect,
  };
}

function mapVehicleFamily(family: VehicleRoutePackOneFamily): ContentRuntimeActivationFamilyCandidate {
  return {
    packId: VEHICLE_ROUTE_PACK_ONE_ID,
    familyId: family.id,
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    variantCopies: family.variantCopies.map((v) => ({ kind: v.kind, text: v.text })),
    recommendedVariantKinds: [...family.recommendedVariantKinds],
    echoes: {
      advisor: family.echoes.advisor,
      report: family.echoes.report,
      social: family.echoes.social,
      map: family.echoes.map,
      tomorrow_preview: family.echoes.tomorrow_preview,
      result: family.echoes.result,
    },
    scene: family.concreteScene,
    problem: family.visibleOperationalProblem,
    tradeoff: family.decisionTradeoff,
    shortTermEffect: family.shortTermEffect,
    carryOver: family.carryOverConsequence,
    intents: {
      trust: family.trustIntent,
      memory: family.memoryIntent,
      resource: family.resourceFatigueIntent,
      vehicleMaintenance: family.vehicleMaintenanceIntent,
      crisisAdjacency: family.crisisAdjacency,
    },
    score: 0,
    selectedDistrictId: family.districtIds[0],
    selectedVariantKind: 'normal',
    selectedVariantText: family.variantCopies[0]?.text ?? family.shortTermEffect,
  };
}

function mapContainerFamily(
  family: ContainerEnvironmentPackOneFamily,
): ContentRuntimeActivationFamilyCandidate {
  return {
    packId: CONTAINER_ENVIRONMENT_PACK_ONE_ID,
    familyId: family.id,
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    variantCopies: family.variantCopies.map((v) => ({ kind: v.kind, text: v.text })),
    recommendedVariantKinds: [...family.recommendedVariantKinds],
    echoes: {
      advisor: family.echoes.advisor,
      report: family.echoes.report,
      social: family.echoes.social,
      map: family.echoes.map,
      tomorrow_preview: family.echoes.tomorrow_preview,
      result: family.echoes.result,
    },
    scene: family.concreteScene,
    problem: family.visibleOperationalProblem,
    tradeoff: family.decisionTradeoff,
    shortTermEffect: family.shortTermEffect,
    carryOver: family.carryOverConsequence,
    intents: {
      trust: family.trustIntent,
      memory: family.memoryIntent,
      resource: family.resourceFatigueIntent,
      containerNetwork: family.containerNetworkIntent,
      environmentCare: family.environmentCareIntent,
      crisisAdjacency: family.crisisAdjacency,
    },
    score: 0,
    selectedDistrictId: family.districtIds[0],
    selectedVariantKind: 'normal',
    selectedVariantText: family.variantCopies[0]?.text ?? family.shortTermEffect,
  };
}

function mapSocialTrustFamily(
  family: SocialTrustPackOneFamily,
): ContentRuntimeActivationFamilyCandidate {
  return {
    packId: SOCIAL_TRUST_PACK_ONE_ID,
    familyId: family.id,
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    variantCopies: family.variantCopies.map((v) => ({ kind: v.kind, text: v.text })),
    recommendedVariantKinds: [...family.recommendedVariantKinds],
    echoes: {
      advisor: family.echoes.advisor,
      report: family.echoes.report,
      social: family.echoes.social,
      map: family.echoes.map,
      tomorrow_preview: family.echoes.tomorrow_preview,
      result: family.echoes.result,
    },
    scene: family.concreteScene,
    problem: family.visibleOperationalProblem,
    tradeoff: family.decisionTradeoff,
    shortTermEffect: family.shortTermEffect,
    carryOver: family.carryOverConsequence,
    intents: {
      trust: family.trustIntent,
      memory: family.memoryIntent,
      resource: family.resourceIntent,
      crisisAdjacency: family.crisisAdjacency,
    },
    score: 0,
    selectedDistrictId: family.districtIds[0],
    selectedVariantKind: 'normal',
    selectedVariantText: family.variantCopies[0]?.text ?? family.shortTermEffect,
  };
}

function mapCrisisFamily(
  family: CrisisAdjacentPackOneFamily,
): ContentRuntimeActivationFamilyCandidate {
  return {
    packId: CRISIS_ADJACENT_PACK_ONE_ID,
    familyId: family.id,
    title: family.title,
    districtIds: [...family.districtIds],
    domains: [...family.domains],
    variantCopies: family.variantCopies.map((v) => ({ kind: v.kind, text: v.text })),
    recommendedVariantKinds: [...family.recommendedVariantKinds],
    echoes: {
      advisor: family.echoes.advisor,
      report: family.echoes.report,
      social: family.echoes.social,
      map: family.echoes.map,
      tomorrow_preview: family.echoes.tomorrow_preview,
      result: family.echoes.result,
    },
    scene: family.concreteScene,
    problem: family.visibleOperationalProblem,
    tradeoff: family.decisionTradeoff,
    shortTermEffect: family.shortTermEffect,
    carryOver: family.carryOverConsequence,
    intents: {
      trust: family.trustIntent,
      memory: family.memoryIntent,
      resource: family.resourceIntent ?? family.resourcePressureIntent,
      crisisAdjacency: family.crisisWatchIntent,
    },
    score: 0,
    selectedDistrictId: family.districtIds[0],
    selectedVariantKind: 'normal',
    selectedVariantText: family.variantCopies[0]?.text ?? family.shortTermEffect,
  };
}

function buildBaseFamilyPool(): ContentRuntimeActivationFamilyCandidate[] {
  return [
    ...DISTRICT_PACK_ONE_FAMILIES.map(mapDistrictFamily),
    ...VEHICLE_ROUTE_PACK_ONE_FAMILIES.map(mapVehicleFamily),
    ...CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.map(mapContainerFamily),
  ];
}

export function buildContentRuntimeActivationFamilyPool(
  input: ContentRuntimeActivationInput,
  mode: ContentRuntimeActivationMode = 'lite',
): ContentRuntimeActivationFamilyCandidate[] {
  const base = buildBaseFamilyPool();
  if (mode !== 'limited_full') {
    return base;
  }

  const expanded = [
    ...base,
    ...SOCIAL_TRUST_PACK_ONE_FAMILIES.map(mapSocialTrustFamily),
    ...CRISIS_ADJACENT_PACK_ONE_FAMILIES.map(mapCrisisFamily),
  ];

  const ctx: ContentRuntimeActivationGuardContext = {
    mode,
    phase: 'main_operation_full',
    activeStoryChainDistrictIds: input.activeStoryChainDistrictIds,
    previousSemanticClusters: input.previousSemanticClusters,
    packOriginStoryStartsToday: input.packOriginStoryStartsToday,
    hasActiveMainOperation: input.hasActiveMainOperation ?? true,
  };

  return filterPoolByActivationMode(expanded, ctx, input);
}

function signalPressure(status?: string): boolean {
  return status === 'watch' || status === 'strained' || status === 'critical';
}

function trustBandAllowsVariant(
  districtId: string,
  variantKind: string,
  input: ContentRuntimeActivationInput,
): boolean {
  if (variantKind !== 'district_trust') return true;
  const trust = input.districtTrustRuntime?.[districtId]?.state;
  return trust === 'fragile' || trust === 'strained' || trust === 'recovering';
}

function resourceFatigueAllowsVariant(
  variantKind: string,
  input: ContentRuntimeActivationInput,
): boolean {
  if (variantKind !== 'resource_fatigue') return true;
  if (!input.resourceFatigue) return false;
  return Object.values(input.resourceFatigue).some(
    (entry) => entry?.state === 'tired' || entry?.state === 'strained',
  );
}

function rewardVariantAllowed(variantKind: string, input: ContentRuntimeActivationInput): boolean {
  if (variantKind !== 'reward' && variantKind !== 'comeback') return true;
  const memory = input.districtMemoryRuntime;
  if (!memory) return false;
  return Object.values(memory).some(
    (entry) => entry?.kind === 'recovery' || entry?.kind === 'positive',
  );
}

function operationEraAllowed(variantKind: string, input: ContentRuntimeActivationInput): boolean {
  if (variantKind !== 'operation_era') return true;
  return input.day >= 8;
}

function crisisAdjacentAllowed(
  candidate: ContentRuntimeActivationFamilyCandidate,
  model: ContentRuntimeActivationModel,
): boolean {
  const isCrisis = candidate.domains.some((d) => d.includes('crisis'));
  if (!isCrisis) return true;
  return model.freshnessGuard.crisisAdjacentCount < 1;
}

function familyRecentlyUsed(familyId: string, input: ContentRuntimeActivationInput): boolean {
  return (input.previousFamilyIds ?? []).includes(familyId);
}

function districtDomainRecentlyUsed(
  districtId: string,
  domain: string,
  input: ContentRuntimeActivationInput,
): boolean {
  const key = `${districtId}:${domain}`;
  return (input.previousDistrictDomainKeys ?? []).includes(key);
}

function scoreCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
  input: ContentRuntimeActivationInput,
  model: ContentRuntimeActivationModel,
): number {
  let score = 10;
  const signals = input.operationSignals;

  if (candidate.packId === 'vehicle_route_pack_one') {
    if (signalPressure(signals?.vehicles?.status)) score += 8;
    if (candidate.districtIds.includes('sanayi')) score += 2;
    if (candidate.districtIds.includes('istasyon')) score += 1;
  }

  if (candidate.packId === 'container_environment_pack_one') {
    if (signalPressure(signals?.containers?.status)) score += 8;
    if (candidate.districtIds.includes('cumhuriyet')) score += 2;
    if (candidate.districtIds.includes('yesilvadi')) score += 1;
  }

  if (candidate.packId === 'district_pack_one') {
    if (signalPressure(signals?.districts?.status)) score += 5;
    for (const districtId of candidate.districtIds) {
      score += model.districtWeights[districtId] ?? 0;
      const trust = input.districtTrustRuntime?.[districtId]?.state;
      if (trust === 'fragile' || trust === 'strained') score += 2;
    }
  }

  if (candidate.packId === 'social_trust_pack_one') {
    if (signalPressure(signals?.districts?.status)) score += 4;
    if (candidate.selectedVariantKind === 'reward' || candidate.selectedVariantKind === 'comeback') {
      score += 3;
    }
  }

  if (candidate.packId === 'crisis_adjacent_pack_one') {
    score -= 15;
    if (signalPressure(signals?.overall?.status)) score += 4;
  }

  for (const domain of candidate.domains) {
    score += model.domainWeights[domain] ?? 0;
  }

  if (familyRecentlyUsed(candidate.familyId, input)) score -= 20;
  if (
    districtDomainRecentlyUsed(
      candidate.selectedDistrictId,
      candidate.domains[0] ?? 'generic',
      input,
    )
  ) {
    score -= 12;
  }

  if (!crisisAdjacentAllowed(candidate, model)) score -= 50;

  const tieBreak = stableContentRuntimeHash(
    `${input.day}|${candidate.packId}|${candidate.familyId}|${input.stableSeed ?? 'cra'}`,
  );
  return score * 1000 + (tieBreak % 1000);
}

function pickDistrict(
  candidate: ContentRuntimeActivationFamilyCandidate,
  input: ContentRuntimeActivationInput,
): string {
  const preferred =
    input.focusDistrictId ??
    input.operationSignals?.priorityDistrictId ??
    candidate.districtIds[0];
  if (candidate.districtIds.includes(preferred)) return preferred;
  const hash = stableContentRuntimeHash(
    `${input.day}|${candidate.familyId}|district`,
  );
  return candidate.districtIds[hash % candidate.districtIds.length] ?? candidate.districtIds[0];
}

function pickVariant(
  candidate: ContentRuntimeActivationFamilyCandidate,
  input: ContentRuntimeActivationInput,
  districtId: string,
): { kind: string; text: string } {
  const eligible = candidate.variantCopies.filter(
    (variant) =>
      trustBandAllowsVariant(districtId, variant.kind, input) &&
      resourceFatigueAllowsVariant(variant.kind, input) &&
      rewardVariantAllowed(variant.kind, input) &&
      operationEraAllowed(variant.kind, input),
  );
  const pool =
    eligible.length > 0
      ? eligible
      : candidate.variantCopies.filter((variant) => variant.kind === 'normal');
  const hash = stableContentRuntimeHash(
    `${input.day}|${candidate.familyId}|${districtId}|${input.stableSeed ?? 'variant'}`,
  );
  return pool[hash % pool.length] ?? pool[0];
}

export function rankContentRuntimeActivationCandidates(
  pool: ContentRuntimeActivationFamilyCandidate[],
  input: ContentRuntimeActivationInput,
  model: ContentRuntimeActivationModel,
): ContentRuntimeActivationFamilyCandidate[] {
  return pool
    .map((candidate) => {
      const selectedDistrictId = pickDistrict(candidate, input);
      const variant = pickVariant(candidate, input, selectedDistrictId);
      return {
        ...candidate,
        selectedDistrictId,
        selectedVariantKind: variant.kind,
        selectedVariantText: variant.text,
        score: scoreCandidate(
          { ...candidate, selectedDistrictId },
          input,
          model,
        ),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export type ContentRuntimeActivationSelectionOutput = {
  selected: ContentRuntimeActivationFamilyCandidate[];
  suppressed: ContentRuntimeActivationFamilyCandidate[];
};

export function selectContentRuntimeActivationCandidates(
  ranked: ContentRuntimeActivationFamilyCandidate[],
  input: ContentRuntimeActivationInput,
  model: ContentRuntimeActivationModel,
  maxCandidates: number,
  guardContext?: ContentRuntimeActivationGuardContext,
): ContentRuntimeActivationSelectionOutput {
  const selected: ContentRuntimeActivationFamilyCandidate[] = [];
  const suppressed: ContentRuntimeActivationFamilyCandidate[] = [];
  const usedFamilies = new Set<string>();
  const usedDistrictDomains = new Set<string>();
  let crisisCount = 0;
  let resourceFatigueCount = 0;
  let storyTriggerCount = input.packOriginStoryStartsToday ?? 0;
  const usedDomains = new Set<string>();
  const usedSemanticClusters = new Set(input.previousSemanticClusters ?? []);
  const ctx: ContentRuntimeActivationGuardContext = guardContext ?? {
    mode: model.activationMode,
    phase: model.phase,
    activeStoryChainDistrictIds: input.activeStoryChainDistrictIds,
    previousSemanticClusters: input.previousSemanticClusters,
    packOriginStoryStartsToday: input.packOriginStoryStartsToday,
    hasActiveMainOperation: input.hasActiveMainOperation,
  };

  for (const candidate of ranked) {
    if (selected.length >= maxCandidates) {
      suppressed.push({ ...candidate, blockedReason: 'max_candidates_reached' });
      continue;
    }
    if (candidate.score < 0) {
      suppressed.push({ ...candidate, blockedReason: 'negative_score' });
      continue;
    }
    if (usedFamilies.has(candidate.familyId)) {
      suppressed.push({ ...candidate, blockedReason: 'duplicate_family' });
      continue;
    }

    const freshnessBlock = freshnessBlocksCandidate(candidate, input, ctx);
    if (freshnessBlock) {
      suppressed.push({ ...candidate, blockedReason: freshnessBlock });
      continue;
    }

    const balanceBlock = districtBalanceBlocksCandidate(candidate, selected, ctx, input);
    if (balanceBlock) {
      suppressed.push({ ...candidate, blockedReason: balanceBlock });
      continue;
    }

    const domainKey = candidate.domains[0] ?? 'generic';
    const districtDomainKey = `${candidate.selectedDistrictId}:${domainKey}`;
    if (usedDistrictDomains.has(districtDomainKey)) {
      suppressed.push({ ...candidate, blockedReason: 'same_day_district_domain' });
      continue;
    }

    const cluster = inferSemanticCluster(candidate);
    if (usedSemanticClusters.has(cluster) && selected.length >= 1) {
      suppressed.push({ ...candidate, blockedReason: 'semantic_cluster_same_day' });
      continue;
    }

    const storyEligibility = evaluateCandidateStoryChainEligibility(candidate, input, ctx);
    if (
      !storyEligibility.canTrigger &&
      storyTriggerCount >= CONTENT_RUNTIME_ACTIVATION_FULL_STORY_TRIGGER_MAX_PER_DAY &&
      candidate.packId !== 'district_pack_one'
    ) {
      suppressed.push({ ...candidate, blockedReason: 'story_trigger_cap' });
      continue;
    }

    const isCrisis =
      candidate.packId === 'crisis_adjacent_pack_one' ||
      candidate.domains.some((d) => d.includes('crisis'));
    if (isCrisis && crisisCount >= 1) {
      suppressed.push({ ...candidate, blockedReason: 'crisis_adjacent_rate_limited' });
      continue;
    }
    if (
      candidate.selectedVariantKind === 'resource_fatigue' &&
      resourceFatigueCount >= 1
    ) {
      suppressed.push({ ...candidate, blockedReason: 'resource_fatigue_cap' });
      continue;
    }
    if (usedDomains.size >= CONTENT_RUNTIME_ACTIVATION_MAX_DOMAINS_MENTION) {
      const introducesNewDomain = candidate.domains.some((d) => !usedDomains.has(d));
      if (introducesNewDomain && selected.length >= 1) {
        suppressed.push({ ...candidate, blockedReason: 'domain_mention_cap' });
        continue;
      }
    }

    selected.push(candidate);
    usedFamilies.add(candidate.familyId);
    usedDistrictDomains.add(districtDomainKey);
    usedSemanticClusters.add(cluster);
    for (const domain of candidate.domains.slice(0, 2)) usedDomains.add(domain);
    if (isCrisis) crisisCount += 1;
    if (candidate.selectedVariantKind === 'resource_fatigue') {
      resourceFatigueCount += 1;
    }
    if (storyEligibility.canTrigger) {
      storyTriggerCount += 1;
    }
  }

  model.freshnessGuard.crisisAdjacentCount = crisisCount;
  model.freshnessGuard.resourceFatigueCount = resourceFatigueCount;
  model.duplicateGuard.blockedFamilies = ranked
    .filter((c) => familyRecentlyUsed(c.familyId, input))
    .map((c) => c.familyId);
  model.duplicateGuard.blockedDistrictDomains = ranked
    .filter((c) =>
      districtDomainRecentlyUsed(c.selectedDistrictId, c.domains[0] ?? 'generic', input),
    )
    .map((c) => `${c.selectedDistrictId}:${c.domains[0] ?? 'generic'}`);

  if (input.day <= CONTENT_RUNTIME_ACTIVATION_FAMILY_COOLDOWN_DAYS + 7) {
    model.daySafetyGuard.reasons.push('day8_opening_soft_cap');
  }

  return { selected, suppressed };
}

export function packIdForCandidate(
  packId: ContentRuntimeActivationPackId,
): ContentRuntimeActivationPackId {
  return packId;
}
