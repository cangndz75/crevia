import {
  CONTENT_PACK_FULL_ACTIVATION_PHASES,
  CONTENT_PACK_FULL_ARCHIVE_NOT_STORED,
  CONTENT_PACK_FULL_ARCHIVE_SPAM_RULES,
  CONTENT_PACK_FULL_DAY_CAP_PLANS,
  CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES,
  CONTENT_PACK_FULL_DISTRICTS,
  CONTENT_PACK_FULL_DOMAIN_PLANS,
  CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS,
  CONTENT_PACK_FULL_FRESHNESS_RULES,
  CONTENT_PACK_FULL_GROUP_PLANS,
  CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE,
  CONTENT_PACK_FULL_SEMANTIC_CLUSTERS,
  CONTENT_PACK_FULL_STORY_CHAIN_TRIGGER_RULES,
  CONTENT_PACK_FULL_SURFACE_DENSITY_RULES,
  CONTENT_PACK_FULL_TARGET_SAVE_VERSION,
} from './contentRuntimeActivationFullPlanningConstants';
import type {
  ContentPackFullPlanningAuditCheck,
  ContentPackFullPlanningAuditResult,
  ContentPackFullReadinessScore,
  DistrictBalanceRisk,
  StoryChainPackRisk,
} from './contentRuntimeActivationFullPlanningTypes';

function check(
  condition: boolean,
  id: string,
  message: string,
  warn = false,
): ContentPackFullPlanningAuditCheck {
  return {
    id,
    status: condition ? 'PASS' : warn ? 'WARN' : 'FAIL',
    message,
  };
}

export function buildDistrictBalanceRisk(): DistrictBalanceRisk {
  const coverage: Record<string, number> = {};
  for (const group of CONTENT_PACK_FULL_GROUP_PLANS) {
    for (const d of group.districtCoverage) {
      coverage[d] = (coverage[d] ?? 0) + 1;
    }
  }
  const avg = Object.values(coverage).reduce((s, v) => s + v, 0) / CONTENT_PACK_FULL_DISTRICTS.length;
  const overloadedDistricts = CONTENT_PACK_FULL_DISTRICTS.filter((d) => (coverage[d] ?? 0) > avg + 2);
  const underusedDistricts = CONTENT_PACK_FULL_DISTRICTS.filter((d) => (coverage[d] ?? 0) < avg - 1);
  const recommendedWeightAdjustment: DistrictBalanceRisk['recommendedWeightAdjustment'] = {};
  for (const d of underusedDistricts) {
    recommendedWeightAdjustment[d] = 1.1;
  }
  for (const d of overloadedDistricts) {
    recommendedWeightAdjustment[d] = 0.85;
  }
  return {
    overloadedDistricts,
    underusedDistricts,
    repeatedDomainWarnings: [
      'sanayi+istasyon route_pressure cluster watch',
      'yesilvadi container_environment repetition watch',
    ],
    recommendedWeightAdjustment,
  };
}

export function evaluateStoryChainPackRisk(input: {
  day: number;
  hasActiveChain: boolean;
  sameDistrictKindActive: boolean;
  packOriginStartsToday: number;
  activeChainCount: number;
  activeChainCap: number;
  isRewardComebackPack: boolean;
  isCrisisAdjacent: boolean;
}): StoryChainPackRisk {
  if (input.isRewardComebackPack) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: input.hasActiveChain,
      shouldSuppressChainTrigger: true,
      reason: 'Reward/comeback pack closes or softens; does not start pressure chain.',
    };
  }
  if (input.isCrisisAdjacent) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: input.hasActiveChain,
      shouldSuppressChainTrigger: true,
      reason: 'Crisis-adjacent pack cannot create panic chain spam.',
    };
  }
  const minDay = input.day >= 8 ? 8 : 4;
  if (input.day < minDay) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: false,
      shouldSuppressChainTrigger: true,
      reason: `Pack story start blocked before Day ${minDay}.`,
    };
  }
  if (input.sameDistrictKindActive || input.packOriginStartsToday >= 1) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: input.hasActiveChain,
      shouldSuppressChainTrigger: true,
      reason: 'Duplicate district/kind or daily pack start cap.',
    };
  }
  if (input.activeChainCount >= input.activeChainCap) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: true,
      shouldSuppressChainTrigger: true,
      reason: 'Active chain cap reached; prefer advance existing.',
    };
  }
  if (input.hasActiveChain) {
    return {
      canStartChain: false,
      shouldAdvanceExisting: true,
      shouldSuppressChainTrigger: false,
      reason: 'Prefer advancing related existing chain.',
    };
  }
  return {
    canStartChain: true,
    shouldAdvanceExisting: false,
    shouldSuppressChainTrigger: false,
    reason: 'Safe to consider one pack-origin story start.',
  };
}

export function buildContentPackFullReadinessScore(): ContentPackFullReadinessScore {
  const phase1Ready = CONTENT_PACK_FULL_GROUP_PLANS.filter(
    (g) => g.readinessStatus === 'ready_for_limited_full',
  ).length;
  const blocked = CONTENT_PACK_FULL_GROUP_PLANS.filter((g) => g.readinessStatus === 'blocked').length;
  const risky = CONTENT_PACK_FULL_GROUP_PLANS.filter((g) => g.readinessStatus === 'risky').length;

  const catalogCoverageScore = Math.round((phase1Ready / CONTENT_PACK_FULL_GROUP_PLANS.length) * 100);
  const duplicateRiskScore = CONTENT_PACK_FULL_FRESHNESS_RULES.length >= 5 ? 85 : 50;
  const storyChainRiskScore = CONTENT_PACK_FULL_STORY_CHAIN_TRIGGER_RULES.length >= 7 ? 80 : 45;
  const archiveSpamRiskScore = CONTENT_PACK_FULL_ARCHIVE_SPAM_RULES.length >= 8 ? 82 : 40;
  const reportDensityRiskScore = CONTENT_PACK_FULL_SURFACE_DENSITY_RULES.length >= 8 ? 88 : 50;
  const dayOneSafetyScore = CONTENT_PACK_FULL_DAY_CAP_PLANS[0]?.packOriginEventsMax === 0 ? 100 : 0;
  const postPilotBalanceScore = CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES.length >= 6 ? 78 : 40;
  const manualQaNeedScore = 35;

  const avg =
    (catalogCoverageScore +
      duplicateRiskScore +
      storyChainRiskScore +
      archiveSpamRiskScore +
      reportDensityRiskScore +
      dayOneSafetyScore +
      postPilotBalanceScore) /
    7;

  let overallReadiness: ContentPackFullReadinessScore['overallReadiness'] = 'blocked';
  if (blocked > 0 && avg < 70) {
    overallReadiness = 'risky';
  } else if (avg >= 75 && risky <= 2) {
    overallReadiness = 'ready_for_limited_full';
  }
  if (
    avg >= 85 &&
    blocked === 0 &&
    risky === 0 &&
    storyChainRiskScore >= 80 &&
    archiveSpamRiskScore >= 80
  ) {
    overallReadiness = 'ready_for_full_implementation';
  }

  return {
    catalogCoverageScore,
    duplicateRiskScore,
    storyChainRiskScore,
    archiveSpamRiskScore,
    reportDensityRiskScore,
    dayOneSafetyScore,
    postPilotBalanceScore,
    manualQaNeedScore,
    overallReadiness,
    summaryLine:
      overallReadiness === 'ready_for_limited_full'
        ? 'Limited full activation plan ready; runtime remains Lite-only until implementation pass.'
        : overallReadiness === 'ready_for_full_implementation'
          ? 'All guards defined; implementation pass may proceed with caps.'
          : 'Planning complete; some groups blocked or risky — Full runtime stays closed.',
  };
}

export function runContentPackFullPlanningAudit(): ContentPackFullPlanningAuditResult {
  const checks: ContentPackFullPlanningAuditCheck[] = [
    check(CONTENT_PACK_FULL_GROUP_PLANS.length === 8, 'plan.pack_groups', '8 pack groups defined.'),
    check(CONTENT_PACK_FULL_DOMAIN_PLANS.length === 10, 'plan.domain_groups', '10 domain groups defined.'),
    check(CONTENT_PACK_FULL_ACTIVATION_PHASES.length === 4, 'plan.activation_phases', '4 activation phases defined.'),
    check(CONTENT_PACK_FULL_DAY_CAP_PLANS.length >= 5, 'plan.day_caps', 'Day/access caps defined.'),
    check(CONTENT_PACK_FULL_DISTRICT_BALANCE_RULES.length >= 6, 'guard.district_balance', 'District balance guard exists.'),
    check(CONTENT_PACK_FULL_FRESHNESS_RULES.length >= 5, 'guard.freshness', 'Domain freshness guard exists.'),
    check(CONTENT_PACK_FULL_ARCHIVE_SPAM_RULES.length >= 8, 'guard.archive_spam', 'Archive spam guard exists.'),
    check(CONTENT_PACK_FULL_STORY_CHAIN_TRIGGER_RULES.length >= 7, 'guard.story_chain', 'Story chain trigger guard exists.'),
    check(CONTENT_PACK_FULL_SURFACE_DENSITY_RULES.length >= 8, 'guard.surface_density', 'Report/Hub/Map density guard exists.'),
    check(CONTENT_PACK_FULL_SEMANTIC_CLUSTERS.length === 10, 'guard.semantic_clusters', '10 semantic clusters defined.'),
    check(Boolean(CONTENT_PACK_FULL_IMPLEMENTATION_SCOPE.stage), 'plan.implementation_scope', 'Next implementation scope defined.'),
    check(CONTENT_PACK_FULL_TARGET_SAVE_VERSION === 24, 'safety.save_version', 'Planning doc SAVE_VERSION 24 unchanged in plan.'),
    check(
      CONTENT_PACK_FULL_ARCHIVE_NOT_STORED.includes('raw_pack_metadata'),
      'safety.no_raw_pack_metadata',
      'Raw pack metadata excluded from archive plan.',
    ),
    check(
      CONTENT_PACK_FULL_DAY_CAP_PLANS[0]?.packOriginEventsMax === 0,
      'risk.day1_blocked',
      'Day 1 pack activation blocked.',
    ),
    check(
      CONTENT_PACK_FULL_DAY_CAP_PLANS[1]?.packOriginEventsMax === 0,
      'risk.pilot_2_7_blocked',
      'Day 2-7 full activation blocked.',
    ),
    check(
      CONTENT_PACK_FULL_DAY_CAP_PLANS.some((c) => c.dayRange === '8+' && c.packOriginEventsMax >= 1),
      'risk.day8_cap',
      'Day 8+ cap defined.',
    ),
    check(
      CONTENT_PACK_FULL_DOMAIN_PLANS.some((d) => d.domainId === 'crisis_adjacent' && d.maxPerWindowCount === 1),
      'risk.crisis_rate_limited',
      'crisis_adjacent rate limited.',
    ),
    check(
      CONTENT_PACK_FULL_DOMAIN_PLANS.some((d) => d.domainId === 'resource_pressure' && d.maxPerWindowDays === 2),
      'risk.resource_pressure_limited',
      'resource_pressure rate limited.',
    ),
    check(
      CONTENT_PACK_FULL_STORY_CHAIN_TRIGGER_RULES.includes('max_1_pack_origin_story_start_per_day'),
      'risk.story_spam_blocked',
      'Story chain spam blocked.',
    ),
    check(
      CONTENT_PACK_FULL_ARCHIVE_SPAM_RULES.includes('pack_origin_archive_max_2_per_day'),
      'risk.archive_spam_blocked',
      'Archive spam blocked.',
    ),
    check(
      CONTENT_PACK_FULL_SURFACE_DENSITY_RULES.includes('report_day8_max_2_continuity'),
      'risk.report_density_blocked',
      'Report density blocked.',
    ),
    check(
      CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS.includes('pack') &&
        CONTENT_PACK_FULL_FORBIDDEN_PLAYER_TERMS.includes('metadata'),
      'risk.forbidden_terms',
      'Forbidden pack/metadata/runtime terms guarded.',
    ),
    check(
      CONTENT_PACK_FULL_ACTIVATION_PHASES.filter((p) => p.id !== 'phase_0_lite').every((p) => !p.runtimeOpen),
      'safety.runtime_full_closed',
      'Full activation phases runtime closed (Lite only active).',
    ),
  ];

  const readinessScore = buildContentPackFullReadinessScore();
  const districtBalanceRisk = buildDistrictBalanceRisk();
  const storyChainPackRiskSample = evaluateStoryChainPackRisk({
    day: 8,
    hasActiveChain: true,
    sameDistrictKindActive: false,
    packOriginStartsToday: 0,
    activeChainCount: 1,
    activeChainCap: 2,
    isRewardComebackPack: false,
    isCrisisAdjacent: false,
  });

  return {
    checks,
    readinessScore,
    districtBalanceRisk,
    storyChainPackRiskSample,
    runtimeActivationOpen: true,
    implementationBlocked: readinessScore.overallReadiness !== 'ready_for_full_implementation',
  };
}
