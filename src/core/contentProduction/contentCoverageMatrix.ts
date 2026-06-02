import {
  CONTENT_PRODUCTION_OPERATION_ERA_TARGETS,
  CONTENT_PRODUCTION_RECOMMENDED_DISTRICT_TARGETS,
  CONTENT_PRODUCTION_RECOMMENDED_DOMAIN_TARGETS,
  CONTENT_PRODUCTION_RECOMMENDED_VARIANT_TARGETS,
  CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES,
} from './contentProductionConstants';
import type {
  CreviaContentCoverageResult,
  CreviaContentCoverageTarget,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
  CreviaContentQualityStatus,
} from './contentProductionTypes';

export function getCoverageStatus(
  count: number,
  minimum: number,
  recommended: number,
): CreviaContentQualityStatus {
  if (count < minimum) return 'fail';
  if (count < recommended) return 'warn';
  return 'pass';
}

export function buildContentCoverageTargets(): CreviaContentCoverageTarget[] {
  const targets: CreviaContentCoverageTarget[] = [];

  for (const district of CONTENT_PRODUCTION_RECOMMENDED_DISTRICT_TARGETS) {
    targets.push({
      dimension: 'district',
      id: district.id,
      label: district.label,
      minimumCount: district.minimumCount,
      recommendedCount: district.recommendedCount,
      priority: district.priority,
    });
  }

  for (const domain of CONTENT_PRODUCTION_RECOMMENDED_DOMAIN_TARGETS) {
    targets.push({
      dimension: 'domain',
      id: domain.id,
      label: domain.label,
      minimumCount: domain.minimumCount,
      recommendedCount: domain.recommendedCount,
      priority: domain.priority,
    });
  }

  for (const variant of CONTENT_PRODUCTION_RECOMMENDED_VARIANT_TARGETS) {
    targets.push({
      dimension: 'variant_kind',
      id: variant,
      label: variant,
      minimumCount: 0,
      recommendedCount: 1,
      priority: 50,
    });
  }

  for (const surface of CONTENT_PRODUCTION_REQUIRED_ECHO_SURFACES) {
    targets.push({
      dimension: 'echo_surface',
      id: surface,
      label: surface,
      minimumCount: 1,
      recommendedCount: 2,
      priority: 70,
    });
  }

  for (const era of CONTENT_PRODUCTION_OPERATION_ERA_TARGETS) {
    targets.push({
      dimension: 'operation_era',
      id: era.id,
      label: era.label,
      minimumCount: era.minimumCount,
      recommendedCount: era.recommendedCount,
      priority: era.priority,
    });
  }

  return targets;
}

function collectItems(packs: readonly CreviaContentPackDefinition[]): CreviaContentPackItem[] {
  return packs.flatMap((pack) => pack.items);
}

export function calculateCoverageForDimension(
  items: readonly CreviaContentPackItem[],
  target: CreviaContentCoverageTarget,
): CreviaContentCoverageResult {
  const relatedItemIds: string[] = [];

  const count = items.reduce((total, item) => {
    let matched = false;

    switch (target.dimension) {
      case 'district':
        matched = item.districtIds.includes(target.id);
        break;
      case 'domain':
        matched = item.domains.includes(target.id);
        break;
      case 'variant_kind':
        matched = (item.variantKinds ?? []).includes(target.id);
        break;
      case 'echo_surface':
        matched =
          (item.echoSurfaces ?? []).includes(target.id as CreviaContentProductionSurface) ||
          item.copyBlocks.some((block) => block.surface === target.id);
        break;
      case 'operation_era':
        matched = item.operationEraIds.includes(target.id);
        break;
      case 'district_operation':
        matched = item.surface === 'district_operation' && item.tags.includes(target.id);
        break;
      default:
        matched = false;
    }

    if (matched) {
      relatedItemIds.push(item.id);
      return total + 1;
    }
    return total;
  }, 0);

  const status = getCoverageStatus(count, target.minimumCount, target.recommendedCount);

  return {
    dimension: target.dimension,
    id: target.id,
    label: target.label,
    count,
    minimumCount: target.minimumCount,
    recommendedCount: target.recommendedCount,
    status,
    missingCount: Math.max(0, target.minimumCount - count),
    relatedItemIds,
  };
}

export function buildContentCoverageMatrix(
  packs: readonly CreviaContentPackDefinition[],
  targets: readonly CreviaContentCoverageTarget[] = buildContentCoverageTargets(),
): CreviaContentCoverageResult[] {
  const items = collectItems(packs);
  return targets.map((target) => calculateCoverageForDimension(items, target));
}

export function summarizeContentCoverage(results: readonly CreviaContentCoverageResult[]): {
  pass: number;
  warn: number;
  fail: number;
} {
  return results.reduce(
    (acc, result) => {
      acc[result.status] += 1;
      return acc;
    },
    { pass: 0, warn: 0, fail: 0 },
  );
}

export function getMissingCoverageResults(
  results: readonly CreviaContentCoverageResult[],
): CreviaContentCoverageResult[] {
  return results.filter((result) => result.status === 'fail' || result.status === 'warn');
}

export function buildDistrictCoverageSummary(results: readonly CreviaContentCoverageResult[]): string[] {
  return results
    .filter((result) => result.dimension === 'district')
    .map(
      (result) =>
        `${result.label}: ${result.count}/${result.minimumCount} min · ${result.status.toUpperCase()}`,
    );
}

export function buildDomainCoverageSummary(results: readonly CreviaContentCoverageResult[]): string[] {
  return results
    .filter((result) => result.dimension === 'domain')
    .map(
      (result) =>
        `${result.label}: ${result.count}/${result.recommendedCount} rec · ${result.status.toUpperCase()}`,
    );
}

export function buildOperationEraCoverageSummary(
  results: readonly CreviaContentCoverageResult[],
): string[] {
  return results
    .filter((result) => result.dimension === 'operation_era')
    .map(
      (result) =>
        `${result.label}: ${result.count}/${result.minimumCount} min · ${result.status.toUpperCase()}`,
    );
}

export function buildRewardRecoveryCoverageSummary(
  items: readonly CreviaContentPackItem[],
): string[] {
  const rewardCount = items.filter(
    (item) =>
      (item.variantKinds ?? []).some((kind) => ['reward', 'comeback', 'recovery'].includes(kind)) ||
      item.domains.includes('resource_recovery'),
  ).length;

  return [`Reward/recovery destek item sayısı: ${rewardCount}`];
}
