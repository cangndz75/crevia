import type {
  CreviaContentEchoCompletenessResult,
  CreviaContentPackDefinition,
  CreviaContentPackItem,
  CreviaContentProductionSurface,
  CreviaContentQualityStatus,
} from './contentProductionTypes';

function uniqueSurfaces(surfaces: CreviaContentProductionSurface[]): CreviaContentProductionSurface[] {
  return [...new Set(surfaces)];
}

export function getRequiredEchoSurfacesForItem(item: CreviaContentPackItem): CreviaContentProductionSurface[] {
  if (item.surface === 'event_family' || item.surface === 'event_variant') {
    const required: CreviaContentProductionSurface[] = [
      'advisor_echo',
      'report_echo',
      'social_echo',
      'map_hint',
      'tomorrow_preview',
    ];
    if (
      item.domains.includes('district_trust') ||
      item.domains.includes('district_balance') ||
      item.tags.includes('district_trust')
    ) {
      required.push('operation_result');
    }
    return uniqueSurfaces(required);
  }

  if (item.surface === 'district_operation') {
    return ['report_echo', 'map_hint', 'advisor_echo'];
  }

  if (item.surface === 'operation_era') {
    return ['hub', 'report_echo', 'advisor_echo'];
  }

  return ['report_echo'];
}

export function getPresentEchoSurfacesForItem(item: CreviaContentPackItem): CreviaContentProductionSurface[] {
  const fromEchoSurfaces = item.echoSurfaces ?? [];
  const fromCopyBlocks = item.copyBlocks.map((block) => block.surface);
  return uniqueSurfaces([...fromEchoSurfaces, ...fromCopyBlocks]);
}

function echoStatus(missingCount: number): CreviaContentQualityStatus {
  if (missingCount === 0) return 'pass';
  if (missingCount === 1) return 'warn';
  return 'fail';
}

export function buildMissingEchoRecommendation(result: CreviaContentEchoCompletenessResult): string {
  if (result.missingSurfaces.length === 0) {
    return 'Echo completeness tamam.';
  }
  const missing = result.missingSurfaces.join(', ');
  return `${result.itemId} için eksik echo yüzeyleri: ${missing}. Kısa mahalle/saha yorumu ekle.`;
}

export function evaluateEchoCompleteness(item: CreviaContentPackItem): CreviaContentEchoCompletenessResult {
  const requiredSurfaces = getRequiredEchoSurfacesForItem(item);
  const presentSurfaces = getPresentEchoSurfacesForItem(item);
  const missingSurfaces = requiredSurfaces.filter((surface) => !presentSurfaces.includes(surface));

  return {
    itemId: item.id,
    requiredSurfaces,
    presentSurfaces,
    missingSurfaces,
    status: echoStatus(missingSurfaces.length),
    reasonLine: buildMissingEchoRecommendation({
      itemId: item.id,
      requiredSurfaces,
      presentSurfaces,
      missingSurfaces,
      status: echoStatus(missingSurfaces.length),
      reasonLine: '',
    }),
  };
}

export function evaluateEchoCompletenessForPack(
  pack: CreviaContentPackDefinition,
): CreviaContentEchoCompletenessResult[] {
  return pack.items.map((item) => evaluateEchoCompleteness(item));
}

export function summarizeEchoCompleteness(results: readonly CreviaContentEchoCompletenessResult[]): {
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
