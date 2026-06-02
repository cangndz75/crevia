import { EVENT_FAMILY_DUPLICATE_GUARD_MAX_SHARED_TAGS } from './eventFamilyConstants';
import type {
  EventFamilyDefinition,
  EventFamilyVariantDefinition,
  EventFamilyVariantKind,
} from './eventFamilyTypes';

export function getVariantKindsForFamily(family: EventFamilyDefinition): EventFamilyVariantKind[] {
  return [...new Set(family.variantKinds)];
}

export function hasRewardOrRecoveryVariant(family: EventFamilyDefinition): boolean {
  return family.variantKinds.some((kind) => kind === 'reward' || kind === 'comeback' || kind === 'recovery');
}

export function hasPlayerAdaptiveVariant(family: EventFamilyDefinition): boolean {
  return family.variantKinds.includes('player_adaptive');
}

export function hasCarryOverVariant(family: EventFamilyDefinition): boolean {
  return family.variantKinds.includes('carry_over');
}

export function hasCrisisAdjacentVariant(family: EventFamilyDefinition): boolean {
  return family.variantKinds.includes('crisis_adjacent');
}

export function buildVariantCoverageSummary(families: readonly EventFamilyDefinition[]): Record<EventFamilyVariantKind, number> {
  const summary = {} as Record<EventFamilyVariantKind, number>;
  for (const family of families) {
    for (const kind of getVariantKindsForFamily(family)) {
      summary[kind] = (summary[kind] ?? 0) + 1;
    }
  }
  return summary;
}

function tokenizeTitle(title: string): string[] {
  return title
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4)
    .slice(0, 6);
}

export function buildEventFamilyDuplicateSignature(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[],
): string {
  const variantKinds = variants
    .filter((variant) => variant.familyId === family.id)
    .map((variant) => variant.kind)
    .sort();
  const parts = [
    family.domain,
    family.primaryDistrictIds.join('|') || 'citywide',
    family.qualityTags.slice().sort().join('|'),
    family.duplicateGuardTags.slice().sort().join('|'),
    variantKinds.join('|'),
    tokenizeTitle(family.title).join('|'),
  ];
  return parts.filter(Boolean).join('::');
}

function intersectionCount(a: readonly string[], b: readonly string[]): number {
  const bSet = new Set(b);
  return [...new Set(a)].filter((item) => bSet.has(item)).length;
}

export function compareEventFamilySimilarity(
  a: EventFamilyDefinition,
  b: EventFamilyDefinition,
): number {
  if (a.id === b.id) return 1;

  let score = 0;
  if (a.domain === b.domain) score += 0.3;
  if (intersectionCount(a.primaryDistrictIds, b.primaryDistrictIds) > 0) score += 0.25;

  const sharedDuplicateTags = intersectionCount(a.duplicateGuardTags, b.duplicateGuardTags);
  score += Math.min(0.25, sharedDuplicateTags * 0.09);

  const sharedQualityTags = intersectionCount(a.qualityTags, b.qualityTags);
  score += Math.min(0.1, sharedQualityTags * 0.04);

  const sharedKinds = intersectionCount(a.variantKinds, b.variantKinds);
  score += Math.min(0.1, sharedKinds * 0.025);

  if (sharedDuplicateTags > EVENT_FAMILY_DUPLICATE_GUARD_MAX_SHARED_TAGS) {
    score += 0.1;
  }

  return Math.min(1, Number(score.toFixed(2)));
}
