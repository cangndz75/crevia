import {
  CONTENT_PACK_FULL_DAY_CAP_PLANS,
  CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES,
  CONTENT_PACK_FULL_DISTRICTS,
  CONTENT_PACK_FULL_FRESHNESS_RULES,
  CONTENT_PACK_FULL_GROUP_PLANS,
  CONTENT_PACK_FULL_SURFACE_DENSITY_RULES,
} from './contentRuntimeActivationFullPlanningConstants';
import { evaluateStoryChainPackRisk } from './contentRuntimeActivationFullPlanningAudit';
import {
  CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIGHT,
  CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIMITED,
  CONTENT_RUNTIME_ACTIVATION_FULL_COPY_CLUSTER_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_CRISIS_WINDOW_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_DISTRICT_WINDOW_MAX,
  CONTENT_RUNTIME_ACTIVATION_FULL_FAMILY_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_FUTURE_MAX_PACK_ORIGIN,
  CONTENT_RUNTIME_ACTIVATION_FULL_HUB_PACK_LINE_MAX,
  CONTENT_RUNTIME_ACTIVATION_FULL_REPORT_PACK_CONTINUITY_MAX,
  CONTENT_RUNTIME_ACTIVATION_FULL_SOCIAL_ENRICHMENT_MAX,
  CONTENT_RUNTIME_ACTIVATION_FULL_STORY_TRIGGER_MAX_PER_DAY,
  CONTENT_RUNTIME_ACTIVATION_IMPLEMENTATION_FORBIDDEN_TERMS,
  CONTENT_RUNTIME_ACTIVATION_LIMITED_FULL_PACK_IDS,
  CONTENT_RUNTIME_ACTIVATION_LIMITED_RISK_PACK_IDS,
  resolveArchiveWriteCap,
  resolveMaxPackOriginForMode,
} from './contentRuntimeActivationFullImplementationConstants';
import type {
  ContentRuntimeActivationFamilyCandidate,
  ContentRuntimeActivationInput,
  ContentRuntimeActivationMode,
  ContentRuntimeActivationPackId,
  ContentRuntimeActivationPhase,
} from './contentRuntimeActivationTypes';

export type ContentRuntimeActivationGuardContext = {
  mode: ContentRuntimeActivationMode;
  phase: ContentRuntimeActivationPhase;
  activeStoryChainDistrictIds?: string[];
  previousSemanticClusters?: string[];
  packOriginStoryStartsToday?: number;
  hasActiveMainOperation?: boolean;
};

export function resolveContentRuntimeActivationModeForAccess(
  phase: ContentRuntimeActivationPhase,
  accessMode?: ContentRuntimeActivationInput['accessMode'],
): ContentRuntimeActivationMode {
  switch (phase) {
    case 'pilot':
      return 'off';
    case 'post_pilot_light':
      return 'lite';
    case 'main_operation_full':
      return accessMode === 'full' ? 'limited_full' : 'lite';
    default:
      return 'off';
  }
}

export function inferSemanticCluster(
  candidate: Pick<
    ContentRuntimeActivationFamilyCandidate,
    'domains' | 'selectedVariantKind' | 'packId'
  >,
): string {
  const { domains, selectedVariantKind, packId } = candidate;
  if (
    selectedVariantKind === 'reward' ||
    selectedVariantKind === 'comeback' ||
    selectedVariantKind === 'recovery'
  ) {
    return 'toparlanma';
  }
  if (packId === 'vehicle_route_pack_one' || domains.some((d) => d.includes('route') || d.includes('vehicle'))) {
    return 'rota';
  }
  if (
    packId === 'container_environment_pack_one' ||
    domains.some((d) => d.includes('container') || d.includes('environment'))
  ) {
    return 'konteyner';
  }
  if (domains.some((d) => d.includes('crisis'))) return 'risk';
  if (domains.some((d) => d.includes('personnel'))) return 'personel morali';
  if (selectedVariantKind === 'resource_fatigue') return 'araç yorgunluğu';
  if (
    domains.some((d) => d.includes('social') || d.includes('sentiment') || d.includes('trust'))
  ) {
    return selectedVariantKind === 'reward' ? 'sosyal teşekkür' : 'güven';
  }
  if (domains.some((d) => d.includes('operation_era') || d.includes('operation_followup'))) {
    return 'ana operasyon';
  }
  if (packId === 'district_pack_one') return 'güven';
  return 'güven';
}

export function isPackGroupAllowedForMode(
  packId: ContentRuntimeActivationPackId,
  ctx: ContentRuntimeActivationGuardContext,
  input: ContentRuntimeActivationInput,
): boolean {
  if (ctx.mode === 'lite') {
    return (
      packId === 'district_pack_one' ||
      packId === 'vehicle_route_pack_one' ||
      packId === 'container_environment_pack_one'
    );
  }
  if (ctx.mode !== 'limited_full') return false;

  if (CONTENT_RUNTIME_ACTIVATION_LIMITED_FULL_PACK_IDS.includes(packId)) {
    return true;
  }

  if (packId === 'crisis_adjacent_pack_one') {
    if (input.day < 8) return false;
    const recentCrisis = (input.previousFamilyIds ?? []).filter((id) =>
      id.includes('crisis'),
    ).length;
    return recentCrisis < 1;
  }

  return false;
}

export function isPersonnelMoraleCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
): boolean {
  return candidate.domains.some((d) => d.includes('personnel'));
}

export function isOperationFollowupCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
): boolean {
  return (
    candidate.domains.some((d) => d.includes('operation_era') || d.includes('operation_followup')) ||
    candidate.selectedVariantKind === 'operation_era'
  );
}

export function isRewardComebackCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
): boolean {
  return (
    candidate.selectedVariantKind === 'reward' ||
    candidate.selectedVariantKind === 'comeback' ||
    candidate.domains.some((d) => d.includes('reward_recovery'))
  );
}

function countDistrictInWindow(
  districtId: string,
  input: ContentRuntimeActivationInput,
): number {
  const keys = input.previousDistrictDomainKeys ?? [];
  return keys.filter((key) => key.startsWith(`${districtId}:`)).length;
}

export function districtBalanceBlocksCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
  selected: ContentRuntimeActivationFamilyCandidate[],
  ctx: ContentRuntimeActivationGuardContext,
  input: ContentRuntimeActivationInput,
): string | undefined {
  const districtId = candidate.selectedDistrictId;
  const domain = candidate.domains[0] ?? 'generic';
  const sameDayKey = `${districtId}:${domain}`;

  for (const pick of selected) {
    const pickDomain = pick.domains[0] ?? 'generic';
    if (
      pick.selectedDistrictId === districtId &&
      pickDomain === domain
    ) {
      return 'same_district_domain_same_day';
    }
  }

  const windowCount =
    countDistrictInWindow(districtId, input) +
    selected.filter((s) => s.selectedDistrictId === districtId).length;
  if (windowCount >= CONTENT_RUNTIME_ACTIVATION_FULL_DISTRICT_WINDOW_MAX) {
    return 'district_2_day_window_cap';
  }

  const activeStoryDistricts = ctx.activeStoryChainDistrictIds ?? [];
  if (
    activeStoryDistricts.includes(districtId) &&
    !isRewardComebackCandidate(candidate) &&
    candidate.selectedVariantKind !== 'recovery'
  ) {
    return 'active_story_prefers_closure';
  }

  const industrialSelected = selected.filter((s) =>
    s.selectedDistrictId === 'sanayi' || s.selectedDistrictId === 'istasyon',
  ).length;
  if (
    industrialSelected >= 2 &&
    (districtId === 'sanayi' || districtId === 'istasyon') &&
    selected.length >= 1
  ) {
    return 'sanayi_istasyon_overload';
  }

  if (
    districtId === 'yesilvadi' &&
    candidate.packId === 'container_environment_pack_one' &&
    countDistrictInWindow('yesilvadi', input) >= 1
  ) {
    return 'yesilvadi_environment_repeat';
  }

  if (isPersonnelMoraleCandidate(candidate) && ctx.mode === 'limited_full') {
    const personnelCount =
      selected.filter(isPersonnelMoraleCandidate).length +
      (input.previousFamilyIds ?? []).filter((id) => id.includes('personnel')).length;
    if (personnelCount >= 1) return 'personnel_morale_limited';
  }

  if (isOperationFollowupCandidate(candidate)) {
    if (input.day < 8) return 'operation_followup_day8_only';
    if (!ctx.hasActiveMainOperation) return 'operation_followup_requires_main_operation';
    if (selected.some(isOperationFollowupCandidate)) return 'operation_followup_max_one';
  }

  return undefined;
}

export function freshnessBlocksCandidate(
  candidate: ContentRuntimeActivationFamilyCandidate,
  input: ContentRuntimeActivationInput,
  ctx: ContentRuntimeActivationGuardContext,
): string | undefined {
  const previousFamilies = input.previousFamilyIds ?? [];
  if (previousFamilies.includes(candidate.familyId)) {
    return 'event_family_cooldown';
  }

  const cluster = inferSemanticCluster(candidate);
  const previousClusters = ctx.previousSemanticClusters ?? [];
  if (previousClusters.includes(cluster)) {
    return 'copy_cluster_cooldown';
  }

  const domainKey = `${candidate.selectedDistrictId}:${candidate.domains[0] ?? 'generic'}`;
  if ((input.previousDistrictDomainKeys ?? []).includes(domainKey)) {
    return 'district_domain_recent';
  }

  if ((input.previousTitles ?? []).includes(candidate.title)) {
    return 'duplicate_title';
  }

  return undefined;
}

export function evaluateCandidateStoryChainEligibility(
  candidate: ContentRuntimeActivationFamilyCandidate,
  input: ContentRuntimeActivationInput,
  ctx: ContentRuntimeActivationGuardContext,
): { canTrigger: boolean; reason: string } {
  const risk = evaluateStoryChainPackRisk({
    day: input.day,
    hasActiveChain: (ctx.activeStoryChainDistrictIds?.length ?? 0) > 0,
    sameDistrictKindActive: (ctx.activeStoryChainDistrictIds ?? []).includes(
      candidate.selectedDistrictId,
    ),
    packOriginStartsToday: ctx.packOriginStoryStartsToday ?? 0,
    activeChainCount: ctx.activeStoryChainDistrictIds?.length ?? 0,
    activeChainCap: 2,
    isRewardComebackPack: isRewardComebackCandidate(candidate),
    isCrisisAdjacent:
      candidate.packId === 'crisis_adjacent_pack_one' ||
      candidate.domains.some((d) => d.includes('crisis')),
  });

  if (risk.shouldSuppressChainTrigger) {
    return { canTrigger: false, reason: risk.reason };
  }
  if (!risk.canStartChain && !risk.shouldAdvanceExisting) {
    return { canTrigger: false, reason: risk.reason };
  }
  return { canTrigger: true, reason: risk.reason };
}

export function buildCapSummary(
  mode: ContentRuntimeActivationMode,
  day: number,
  selectedCount: number,
): string {
  const max = resolveMaxPackOriginForMode(mode, day);
  const capPlan = CONTENT_PACK_FULL_DAY_CAP_PLANS.find((plan) => {
    if (day <= 1 && plan.dayRange === '1') return true;
    if (day >= 2 && day <= 7 && plan.dayRange === '2-7') return true;
    if (day >= 8 && day <= 9 && mode === 'lite' && plan.dayRange === '8-9') return true;
    if (day >= 10 && mode === 'lite' && plan.dayRange === '10+') return true;
    if (day >= 8 && mode === 'limited_full' && plan.accessMode === 'main_operation_full') {
      return true;
    }
    return false;
  });
  const archiveCap = resolveArchiveWriteCap(mode);
  return `pack-origin ${selectedCount}/${max}; archive ${archiveCap}; future_max_not_${CONTENT_RUNTIME_ACTIVATION_FULL_FUTURE_MAX_PACK_ORIGIN}; plan=${capPlan?.dayRange ?? 'default'}`;
}

export function buildDistrictBalanceSummary(
  selected: ContentRuntimeActivationFamilyCandidate[],
): string {
  const districts = [...new Set(selected.map((c) => c.selectedDistrictId))];
  return `rules=${CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES.length}; districts=${districts.join(',') || 'none'}`;
}

export function buildArchiveWriteEligibility(
  mode: ContentRuntimeActivationMode,
  selectedCount: number,
): { allowed: number; used: number; eligible: boolean } {
  const allowed = resolveArchiveWriteCap(mode);
  return {
    allowed,
    used: Math.min(selectedCount, allowed),
    eligible: mode !== 'off' && selectedCount > 0 && allowed > 0,
  };
}

export function buildSurfaceDensitySummary(mode: ContentRuntimeActivationMode): string {
  if (mode === 'off') return 'surfaces_idle';
  return [
    `report_max_${CONTENT_RUNTIME_ACTIVATION_FULL_REPORT_PACK_CONTINUITY_MAX}`,
    `hub_max_${CONTENT_RUNTIME_ACTIVATION_FULL_HUB_PACK_LINE_MAX}`,
    `social_max_${CONTENT_RUNTIME_ACTIVATION_FULL_SOCIAL_ENRICHMENT_MAX}`,
    `rules=${CONTENT_PACK_FULL_SURFACE_DENSITY_RULES.length}`,
  ].join(';');
}

export function buildFreshnessGuardSummary(): string {
  return CONTENT_PACK_FULL_FRESHNESS_RULES.join('|');
}

export function filterPoolByActivationMode(
  pool: ContentRuntimeActivationFamilyCandidate[],
  ctx: ContentRuntimeActivationGuardContext,
  input: ContentRuntimeActivationInput,
): ContentRuntimeActivationFamilyCandidate[] {
  return pool.filter((candidate) => {
    if (!isPackGroupAllowedForMode(candidate.packId, ctx, input)) return false;
    if (
      candidate.packId === 'crisis_adjacent_pack_one' &&
      CONTENT_RUNTIME_ACTIVATION_LIMITED_RISK_PACK_IDS.includes(candidate.packId)
    ) {
      const crisisHistory = (input.previousFamilyIds ?? []).length;
      if (crisisHistory > 0 && input.day < 10) return false;
    }
    if (candidate.packId === 'social_trust_pack_one') {
      if (candidate.domains.every((d) => d.includes('crisis'))) return false;
    }
    return true;
  });
}

export function containsForbiddenPlayerTerm(text: string): boolean {
  const normalized = ` ${text.toLocaleLowerCase('tr-TR')} `;
  return CONTENT_RUNTIME_ACTIVATION_IMPLEMENTATION_FORBIDDEN_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function listUnderusedDistricts(): string[] {
  const coverage: Record<string, number> = {};
  for (const group of CONTENT_PACK_FULL_GROUP_PLANS) {
    for (const d of group.districtCoverage) {
      coverage[d] = (coverage[d] ?? 0) + 1;
    }
  }
  const avg =
    Object.values(coverage).reduce((s, v) => s + v, 0) / CONTENT_PACK_FULL_DISTRICTS.length;
  return CONTENT_PACK_FULL_DISTRICTS.filter((d) => (coverage[d] ?? 0) < avg - 1);
}

export {
  CONTENT_RUNTIME_ACTIVATION_FULL_FAMILY_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_COPY_CLUSTER_COOLDOWN_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_CRISIS_WINDOW_DAYS,
  CONTENT_RUNTIME_ACTIVATION_FULL_STORY_TRIGGER_MAX_PER_DAY,
  resolveMaxPackOriginForMode,
} from './contentRuntimeActivationFullImplementationConstants';
