import {
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  CONTAINER_ENVIRONMENT_PACK_ONE_ID,
  type ContainerEnvironmentPackOneFamily,
} from '@/core/contentProduction/contentPacks/containerEnvironmentPackOne';
import {
  DISTRICT_PACK_ONE_FAMILIES,
  DISTRICT_PACK_ONE_ID,
  type DistrictPackOneFamily,
} from '@/core/contentProduction/contentPacks/districtPackOne';
import {
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_ID,
  type VehicleRoutePackOneFamily,
} from '@/core/contentProduction/contentPacks/vehicleRoutePackOne';

import {
  CONTENT_RUNTIME_ACTIVATION_FAMILY_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_MAX_DOMAINS_MENTION,
} from './contentRuntimeActivationConstants';
import type {
  ContentRuntimeActivationFamilyCandidate,
  ContentRuntimeActivationInput,
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

export function buildContentRuntimeActivationFamilyPool(
  _input: ContentRuntimeActivationInput,
): ContentRuntimeActivationFamilyCandidate[] {
  return [
    ...DISTRICT_PACK_ONE_FAMILIES.map(mapDistrictFamily),
    ...VEHICLE_ROUTE_PACK_ONE_FAMILIES.map(mapVehicleFamily),
    ...CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES.map(mapContainerFamily),
  ];
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

export function selectContentRuntimeActivationCandidates(
  ranked: ContentRuntimeActivationFamilyCandidate[],
  input: ContentRuntimeActivationInput,
  model: ContentRuntimeActivationModel,
  maxCandidates: number,
): ContentRuntimeActivationFamilyCandidate[] {
  const selected: ContentRuntimeActivationFamilyCandidate[] = [];
  const usedFamilies = new Set<string>();
  const usedDistrictDomains = new Set<string>();
  let crisisCount = 0;
  let resourceFatigueCount = 0;
  const usedDomains = new Set<string>();

  for (const candidate of ranked) {
    if (selected.length >= maxCandidates) break;
    if (candidate.score < 0) continue;
    if (usedFamilies.has(candidate.familyId)) continue;

    const domainKey = candidate.domains[0] ?? 'generic';
    const districtDomainKey = `${candidate.selectedDistrictId}:${domainKey}`;
    if (usedDistrictDomains.has(districtDomainKey)) continue;

    const isCrisis = candidate.domains.some((d) => d.includes('crisis'));
    if (isCrisis && crisisCount >= 1) continue;
    if (
      candidate.selectedVariantKind === 'resource_fatigue' &&
      resourceFatigueCount >= 1
    ) {
      continue;
    }
    if (usedDomains.size >= CONTENT_RUNTIME_ACTIVATION_MAX_DOMAINS_MENTION) {
      const introducesNewDomain = candidate.domains.some((d) => !usedDomains.has(d));
      if (introducesNewDomain && selected.length >= 1) continue;
    }

    if ((input.previousTitles ?? []).includes(candidate.title)) continue;

    selected.push(candidate);
    usedFamilies.add(candidate.familyId);
    usedDistrictDomains.add(districtDomainKey);
    for (const domain of candidate.domains.slice(0, 2)) usedDomains.add(domain);
    if (isCrisis) crisisCount += 1;
    if (candidate.selectedVariantKind === 'resource_fatigue') {
      resourceFatigueCount += 1;
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

  return selected;
}

export function packIdForCandidate(
  packId: ContentRuntimeActivationPackId,
): ContentRuntimeActivationPackId {
  return packId;
}
