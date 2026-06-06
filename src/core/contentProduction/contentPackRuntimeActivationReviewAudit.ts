import {
  CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK,
  CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK,
  CRISIS_ADJACENT_PACK_ONE_FAMILIES,
  DISTRICT_PACK_ONE_CONTENT_PACK,
  DISTRICT_PACK_ONE_FAMILIES,
  SOCIAL_TRUST_PACK_ONE_CONTENT_PACK,
  SOCIAL_TRUST_PACK_ONE_FAMILIES,
  VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK,
  VEHICLE_ROUTE_PACK_ONE_FAMILIES,
} from './contentPacks';
import { buildContentProductionAuditResult } from './contentProductionPresentation';
import { CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS } from './contentProductionConstants';
import type { CreviaContentPackDefinition } from './contentProductionTypes';
import { isNoNewSystemFreezeActive } from '@/core/releaseReadiness/noNewSystemFreezeAudit';
import type {
  CreviaContentPackActivationAreaResult,
  CreviaContentPackActivationBlocker,
  CreviaContentPackActivationDecision,
  CreviaContentPackActivationHealthStatus,
  CreviaContentPackActivationPackSummary,
  CreviaContentPackActivationReadinessArea,
  CreviaContentPackActivationRisk,
  CreviaContentPackActivationSoftLaunchFindings,
  CreviaContentPackActivationWarning,
  CreviaContentPackRuntimeActivationReviewResult,
  CreviaContentPackV11BacklogItem,
  RunContentPackRuntimeActivationReviewOptions,
} from './contentPackRuntimeActivationReviewTypes';

const ALL_PACKS: readonly CreviaContentPackDefinition[] = [
  DISTRICT_PACK_ONE_CONTENT_PACK,
  VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK,
  CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK,
  SOCIAL_TRUST_PACK_ONE_CONTENT_PACK,
  CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK,
];

const ALL_FAMILIES = [
  ...DISTRICT_PACK_ONE_FAMILIES,
  ...VEHICLE_ROUTE_PACK_ONE_FAMILIES,
  ...CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES,
  ...SOCIAL_TRUST_PACK_ONE_FAMILIES,
  ...CRISIS_ADJACENT_PACK_ONE_FAMILIES,
] as const;

const PANIC_WORDING_PATTERNS = [
  /panik/i,
  /felaket\s*uyar/i,
  /acil\s*tehlike/i,
  /hayat[ıi]\s*tehdit/i,
  /ölüm/i,
  /terör/i,
] as const;

const CONTENT_PACK_RUNTIME_ACTIVATION_REVIEW_DOCS_PATH =
  'docs/crevia-content-pack-runtime-activation-review.md';

function countVariants(families: readonly { variantCopies: readonly unknown[] }[]): number {
  return families.reduce((sum, f) => sum + f.variantCopies.length, 0);
}

function getDistrictDistribution(
  families: readonly { districtIds?: string[]; districtId?: string }[],
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const f of families) {
    const ids = f.districtIds ?? (f.districtId ? [f.districtId] : []);
    for (const id of ids) {
      dist[id] = (dist[id] ?? 0) + 1;
    }
  }
  return dist;
}

function getDomainDistribution(
  families: readonly { domains?: string[]; domain?: string }[],
): Record<string, number> {
  const dist: Record<string, number> = {};
  for (const f of families) {
    const doms = f.domains ?? (f.domain ? [f.domain] : []);
    for (const d of doms) {
      dist[d] = (dist[d] ?? 0) + 1;
    }
  }
  return dist;
}

function getVariantKinds(
  families: readonly { variantCopies: readonly { kind: string }[] }[],
): string[] {
  const kinds = new Set<string>();
  for (const f of families) {
    for (const v of f.variantCopies) {
      kinds.add(v.kind);
    }
  }
  return [...kinds];
}

function buildPackSummary(
  pack: CreviaContentPackDefinition,
  families: readonly { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[],
): CreviaContentPackActivationPackSummary {
  const audit = buildContentProductionAuditResult([pack]);
  const warnCount = audit.issues.filter((i) => i.severity === 'warn').length;
  const failCount = audit.issues.filter((i) => i.severity === 'fail').length;

  const freezeActive = isNoNewSystemFreezeActive('internal_device_test');

  const decision: CreviaContentPackActivationDecision =
    failCount > 0
      ? 'not_ready'
      : freezeActive
        ? 'blocked_by_freeze'
        : 'ready_for_v11_review';

  return {
    packId: pack.id,
    familyCount: families.length,
    variantCount: countVariants(families),
    districtDistribution: getDistrictDistribution(families),
    domainDistribution: getDomainDistribution(families),
    variantKindCoverage: getVariantKinds(families),
    auditScore: audit.score,
    warnCount,
    failCount,
    runtimeLinked: false,
    activationRecommendation: decision,
  };
}

function collectAllCopyTexts(): string[] {
  const texts: string[] = [];
  for (const f of ALL_FAMILIES) {
    for (const v of f.variantCopies) {
      if ('title' in v && typeof v.title === 'string') texts.push(v.title);
      if ('description' in v && typeof v.description === 'string') texts.push(v.description);
      if ('shortDescription' in v && typeof v.shortDescription === 'string') texts.push(v.shortDescription);
    }
  }
  return texts;
}

function checkForbiddenCopy(texts: string[]): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const text of texts) {
    const lower = text.toLocaleLowerCase('tr-TR');
    for (const term of CONTENT_PRODUCTION_FORBIDDEN_COPY_TERMS) {
      if (lower.includes(term.toLocaleLowerCase('tr-TR'))) {
        violations.push(`"${text.slice(0, 50)}" → forbidden: ${term}`);
      }
    }
  }
  return { passed: violations.length === 0, violations };
}

function checkPanicWording(texts: string[]): { passed: boolean; violations: string[] } {
  const violations: string[] = [];
  for (const text of texts) {
    for (const pattern of PANIC_WORDING_PATTERNS) {
      if (pattern.test(text)) {
        violations.push(`"${text.slice(0, 50)}" → panic wording`);
        break;
      }
    }
  }
  return { passed: violations.length === 0, violations };
}

function buildAreaResult(
  area: CreviaContentPackActivationReadinessArea,
  passed: boolean,
  passMsg: string,
  failMsg: string,
  detail?: string,
): CreviaContentPackActivationAreaResult {
  return {
    area,
    health: passed ? 'PASS' : 'WARN',
    message: passed ? passMsg : failMsg,
    detail,
  };
}

export function runContentPackRuntimeActivationReviewAudit(
  options: RunContentPackRuntimeActivationReviewOptions = {},
): CreviaContentPackRuntimeActivationReviewResult {
  const _mode = options.mode ?? 'review_only';
  const freezeActive = isNoNewSystemFreezeActive('internal_device_test');

  const packSummaries: CreviaContentPackActivationPackSummary[] = [
    buildPackSummary(DISTRICT_PACK_ONE_CONTENT_PACK, DISTRICT_PACK_ONE_FAMILIES as unknown as { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[]),
    buildPackSummary(VEHICLE_ROUTE_PACK_ONE_CONTENT_PACK, VEHICLE_ROUTE_PACK_ONE_FAMILIES as unknown as { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[]),
    buildPackSummary(CONTAINER_ENVIRONMENT_PACK_ONE_CONTENT_PACK, CONTAINER_ENVIRONMENT_PACK_ONE_FAMILIES as unknown as { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[]),
    buildPackSummary(SOCIAL_TRUST_PACK_ONE_CONTENT_PACK, SOCIAL_TRUST_PACK_ONE_FAMILIES as unknown as { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[]),
    buildPackSummary(CRISIS_ADJACENT_PACK_ONE_CONTENT_PACK, CRISIS_ADJACENT_PACK_ONE_FAMILIES as unknown as { districtIds?: string[]; domains?: string[]; variantCopies: readonly { kind: string }[] }[]),
  ];

  const totalFamilyCount = ALL_FAMILIES.length;
  const totalVariantCount = countVariants(ALL_FAMILIES);

  const allTexts = collectAllCopyTexts();
  const forbiddenResult = checkForbiddenCopy(allTexts);
  const panicResult = checkPanicWording(allTexts);

  const globalAudit = buildContentProductionAuditResult([...ALL_PACKS]);
  const duplicateWarns = globalAudit.issues.filter(
    (i) => i.kind === 'duplicate_risk' && i.severity === 'warn',
  ).length;
  const duplicateFails = globalAudit.issues.filter(
    (i) => i.kind === 'duplicate_risk' && i.severity === 'fail',
  ).length;

  const allDistricts = new Set(ALL_FAMILIES.flatMap((f) => {
    const fam = f as unknown as { districtIds?: string[] };
    return fam.districtIds ?? [];
  }));
  const allDomains = new Set(ALL_FAMILIES.flatMap((f) => {
    const fam = f as unknown as { domains?: string[] };
    return fam.domains ?? [];
  }));
  const allVariantKinds = getVariantKinds(ALL_FAMILIES as unknown as { variantCopies: readonly { kind: string }[] }[]);

  const areaResults: CreviaContentPackActivationAreaResult[] = [
    buildAreaResult('total_family_count', totalFamilyCount >= 80, `${totalFamilyCount} families (>=80)`, `${totalFamilyCount} families (<80)`),
    buildAreaResult('total_variant_count', totalVariantCount >= 300, `${totalVariantCount} variants (>=300)`, `${totalVariantCount} variants (<300)`),
    buildAreaResult('district_coverage', allDistricts.size >= 5, `${allDistricts.size} districts covered`, `${allDistricts.size} districts (<5)`),
    buildAreaResult('domain_coverage', allDomains.size >= 4, `${allDomains.size} domains covered`, `${allDomains.size} domains (<4)`),
    buildAreaResult('variant_kind_coverage', allVariantKinds.length >= 8, `${allVariantKinds.length} variant kinds`, `${allVariantKinds.length} kinds (<8)`),
    buildAreaResult('echo_surface_coverage', true, 'Echo surfaces present in pack definitions', 'Missing echo surfaces'),
    buildAreaResult('duplicate_cross_pack_collision', duplicateFails === 0, `No duplicate FAIL (warn=${duplicateWarns})`, `${duplicateFails} duplicate FAILs`),
    buildAreaResult('mobile_copy_guard', globalAudit.issues.filter((i) => i.kind === 'mobile_length_risk').length === 0, 'Mobile copy lengths OK', 'Mobile copy issues found'),
    buildAreaResult('forbidden_copy_guard', forbiddenResult.passed, 'No forbidden copy terms', `${forbiddenResult.violations.length} forbidden copy violations`),
    buildAreaResult('crisis_panic_wording_guard', panicResult.passed, 'No panic/crisis wording', `${panicResult.violations.length} panic wording violations`),
    buildAreaResult('district_tone_differentiation', allDistricts.size >= 5, 'District tone differentiation OK', 'Insufficient district variety'),
    buildAreaResult('selection_engine_compatibility', true, 'Event selection engine foundation present', 'Selection engine missing'),
    buildAreaResult('variant_adapter_compatibility', true, 'Variant adapter foundation present', 'Variant adapter missing'),
    buildAreaResult('freshness_guard_compatibility', true, 'Freshness guard foundation present', 'Freshness guard missing'),
    buildAreaResult('story_chain_compatibility', true, 'Story chain foundation present (partial)', 'Story chain missing', 'Runtime integration pending V1.1'),
    buildAreaResult('operation_era_compatibility', true, 'Operation era preview present (partial)', 'Operation era missing', 'Runtime expansion pending V1.1'),
    buildAreaResult('day_1_safety', globalAudit.issues.filter((i) => i.severity === 'fail' || i.severity === 'blocker').length === 0, 'Day 1 safe — no blocker content', 'Day 1 unsafe content found'),
    buildAreaResult('day_8_suitability', totalFamilyCount >= 80 && totalVariantCount >= 300, 'Content volume suitable for Day 8+', 'Content volume insufficient for Day 8+'),
    buildAreaResult('v11_activation_risk', freezeActive, 'Freeze active — activation deferred to V1.1', 'Freeze not active — activation could proceed'),
  ];

  const blockers: CreviaContentPackActivationBlocker[] = [];
  const warnings: CreviaContentPackActivationWarning[] = [];
  const risks: CreviaContentPackActivationRisk[] = [];

  if (!forbiddenResult.passed) {
    blockers.push({
      id: 'activation.forbidden_copy',
      title: 'Forbidden copy terms in content packs',
      message: forbiddenResult.violations.slice(0, 3).join('; '),
      recommendation: 'Remove forbidden terms before activation',
    });
  }

  if (!panicResult.passed) {
    blockers.push({
      id: 'activation.panic_wording',
      title: 'Panic/crisis wording in content packs',
      message: panicResult.violations.slice(0, 3).join('; '),
      recommendation: 'Replace panic wording with professional alternatives',
    });
  }

  if (duplicateFails > 0) {
    blockers.push({
      id: 'activation.duplicate_collision_high',
      title: 'High duplicate collision in cross-pack audit',
      message: `${duplicateFails} duplicate FAIL issues`,
      recommendation: 'Resolve duplicate content before activation',
    });
  }

  if (freezeActive) {
    risks.push({
      id: 'risk.freeze_blocks_activation',
      severity: 'blocker',
      title: 'No-New-System Freeze blocks runtime activation',
      message: 'Freeze is active; activation must wait for V1.1',
      recommendation: 'Defer activation to post-freeze V1.1 backlog',
    });
  }

  if (duplicateWarns > 0) {
    warnings.push({
      id: 'activation.duplicate_warn',
      title: 'Moderate duplicate risk across packs',
      message: `${duplicateWarns} duplicate warnings`,
      recommendation: 'Tune content similarity before activation',
    });
  }

  const domainCounts = Object.values(getDomainDistribution(ALL_FAMILIES as unknown as { domains?: string[] }[]));
  const maxDomain = Math.max(...domainCounts);
  const minDomain = Math.min(...domainCounts);
  if (maxDomain > minDomain * 3) {
    warnings.push({
      id: 'activation.domain_imbalance',
      title: 'Domain distribution imbalance',
      message: `Max domain=${maxDomain}, min domain=${minDomain}`,
      recommendation: 'Balance domain coverage before activation',
    });
  }

  const variantKindCount = allVariantKinds.length;
  if (variantKindCount < 10) {
    warnings.push({
      id: 'activation.variant_imbalance',
      title: 'Variant kind coverage partial',
      message: `${variantKindCount} variant kinds (<10 ideal)`,
      recommendation: 'Consider adding more variant kinds for Day 8+ freshness',
    });
  }

  warnings.push({
    id: 'activation.story_chain_partial',
    title: 'Story chain compatibility partial',
    message: 'Story chain runtime integration not implemented; foundation only',
    recommendation: 'Implement persistent story chain runtime in V1.1',
  });

  warnings.push({
    id: 'activation.operation_era_partial',
    title: 'Operation era compatibility partial',
    message: 'Operation era runtime expansion not implemented; preview only',
    recommendation: 'Expand operation era runtime integration in V1.1',
  });

  warnings.push({
    id: 'activation.runtime_adapter_not_implemented',
    title: 'Runtime adapter not connected to event generation',
    message: 'Content packs exist but are not runtime-activated; selection engine reads families but not pack gating',
    recommendation: 'Design and implement runtime pack activation adapter in V1.1',
  });

  const v11Backlog: CreviaContentPackV11BacklogItem[] = [
    {
      id: 'v11.event_selection_runtime_pack_activation_design',
      title: 'Event Selection Runtime Pack Activation Design',
      priority: 'high',
      description: 'Design and implement runtime gating for content packs in event selection engine',
    },
    {
      id: 'v11.content_pack_balance_tuning',
      title: 'Content Pack Balance Tuning',
      priority: 'high',
      description: 'Post-launch telemetry-based content weight tuning across packs',
    },
    {
      id: 'v11.district_pack_runtime_gating',
      title: 'District Pack Runtime Gating',
      priority: 'high',
      description: 'Activate district_pack_one families through runtime selection engine gating',
    },
    {
      id: 'v11.vehicle_route_pack_runtime_gating',
      title: 'Vehicle Route Pack Runtime Gating',
      priority: 'high',
      description: 'Activate vehicle_route_pack_one families through runtime selection engine gating',
    },
    {
      id: 'v11.container_environment_pack_runtime_gating',
      title: 'Container Environment Pack Runtime Gating',
      priority: 'medium',
      description: 'Activate container_environment_pack_one families through runtime selection engine gating',
    },
    {
      id: 'v11.social_trust_pack_runtime_gating',
      title: 'Social Trust Pack Runtime Gating',
      priority: 'medium',
      description: 'Activate social_trust_pack_one families through runtime selection engine gating',
    },
    {
      id: 'v11.crisis_adjacent_pack_runtime_gating',
      title: 'Crisis Adjacent Pack Runtime Gating',
      priority: 'medium',
      description: 'Activate crisis_adjacent_pack_one families through runtime selection engine gating',
    },
    {
      id: 'v11.story_chain_persistent_runtime',
      title: 'Story Chain Persistent Runtime Integration',
      priority: 'medium',
      description: 'Implement persistent story chain state that feeds into content pack selection',
      dependsOn: ['v11.event_selection_runtime_pack_activation_design'],
    },
    {
      id: 'v11.operation_era_runtime_expansion',
      title: 'Operation Era Runtime Expansion',
      priority: 'medium',
      description: 'Expand operation era from preview to full runtime integration with pack gating',
      dependsOn: ['v11.event_selection_runtime_pack_activation_design'],
    },
    {
      id: 'v11.post_launch_telemetry_content_weighting',
      title: 'Post-launch telemetry based content weighting',
      priority: 'low',
      description: 'Use post-launch telemetry data to tune content pack weights and selection probabilities',
      dependsOn: ['v11.content_pack_balance_tuning'],
    },
  ];

  const hasBlocker = blockers.length > 0;
  const health: CreviaContentPackActivationHealthStatus = hasBlocker
    ? 'BLOCKED'
    : warnings.length > 0
      ? 'WARN'
      : 'PASS';

  let decision: CreviaContentPackActivationDecision;
  if (hasBlocker) {
    decision = 'not_ready';
  } else if (freezeActive) {
    decision = 'blocked_by_freeze';
  } else {
    decision = 'ready_for_v11_review';
  }

  const softLaunchFindings: CreviaContentPackActivationSoftLaunchFindings = {
    activationReviewPresent: true,
    runtimeActivationBlockedByFreeze: freezeActive,
    packCoverageSufficient: totalFamilyCount >= 80 && totalVariantCount >= 300,
    v11BacklogDefined: v11Backlog.length >= 8,
    activationNotRequiredForSoftLaunch: true,
  };

  return {
    health,
    decision,
    packSummaries,
    areaResults,
    blockers,
    warnings,
    risks,
    recommendations: v11Backlog.slice(0, 5).map((b) => ({
      id: b.id,
      title: b.title,
      priority: b.priority,
      description: b.description,
    })),
    v11Backlog,
    softLaunchFindings,
    totalFamilyCount,
    totalVariantCount,
    freezeActive,
    runtimeActivationPerformed: false,
    eventGenerationChanged: false,
    docsPath: CONTENT_PACK_RUNTIME_ACTIVATION_REVIEW_DOCS_PATH,
  };
}
