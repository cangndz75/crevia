import {
  EVENT_FAMILY_DUPLICATE_GUARD_MAX_SHARED_TAGS,
  EVENT_FAMILY_FORBIDDEN_COPY_TERMS,
  EVENT_FAMILY_MOBILE_TEXT_LIMITS,
  EVENT_FAMILY_REQUIRED_ECHO_SURFACES,
} from './eventFamilyConstants';
import {
  buildEventFamilyDuplicateSignature,
  compareEventFamilySimilarity,
  hasCarryOverVariant,
  hasRewardOrRecoveryVariant,
} from './eventFamilyVariantModel';
import type {
  EventFamilyDefinition,
  EventFamilyQualityResult,
  EventFamilyVariantDefinition,
} from './eventFamilyTypes';

function statusForScore(score: number): EventFamilyQualityResult['status'] {
  if (score >= 85) return 'PASS';
  if (score >= 70) return 'WARN';
  return 'FAIL';
}

function collectCopy(family: EventFamilyDefinition, variants: readonly EventFamilyVariantDefinition[]): string {
  return [
    family.title,
    family.shortLabel,
    family.description,
    ...family.qualityTags,
    ...family.duplicateGuardTags,
    ...variants.flatMap((variant) => [
      variant.titlePattern,
      variant.situationLine,
      variant.decisionPressureLine,
      variant.carryOverHint ?? '',
      ...variant.echoHints.map((hint) => hint.hint),
      ...variant.freshnessTags,
    ]),
  ]
    .join(' ')
    .toLocaleLowerCase('tr-TR');
}

export function validateEventFamilyForbiddenCopy(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[],
): string[] {
  const copy = collectCopy(family, variants);
  return EVENT_FAMILY_FORBIDDEN_COPY_TERMS.filter((term) =>
    copy.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function validateEventFamilyEchoCompleteness(family: EventFamilyDefinition): string[] {
  const surfaces = new Set(family.echoSurfaces);
  return EVENT_FAMILY_REQUIRED_ECHO_SURFACES.filter((surface) => !surfaces.has(surface));
}

export function validateEventFamilyVariantCoverage(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[],
): string[] {
  const variantKinds = new Set(variants.filter((variant) => variant.familyId === family.id).map((variant) => variant.kind));
  return family.variantKinds.filter((kind) => !variantKinds.has(kind));
}

export function validateEventFamilyDuplicateRisk(families: readonly EventFamilyDefinition[]): string[] {
  const risks: string[] = [];
  for (let i = 0; i < families.length; i += 1) {
    for (let j = i + 1; j < families.length; j += 1) {
      const a = families[i]!;
      const b = families[j]!;
      const similarity = compareEventFamilySimilarity(a, b);
      if (similarity >= 0.75) {
        risks.push(`${a.id}/${b.id}:${similarity}`);
      }
    }
  }
  return risks;
}

export function scoreEventFamilyQuality(
  family: EventFamilyDefinition,
  variants: readonly EventFamilyVariantDefinition[],
): EventFamilyQualityResult {
  const failures: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  if (family.domain !== 'generic_operation' && (family.primaryDistrictIds.length > 0 || family.domain === 'operation_era' || family.domain === 'authority_milestone')) {
    score += 20;
  } else {
    warnings.push('domain or district context is broad');
  }

  const variantMissing = validateEventFamilyVariantCoverage(family, variants);
  if (family.variantKinds.length >= 4 && variantMissing.length === 0) score += 20;
  else if (family.variantKinds.length >= 3) score += 14;
  else failures.push('variant coverage too narrow');

  const missingSurfaces = validateEventFamilyEchoCompleteness(family);
  score += Math.max(0, 20 - missingSurfaces.length * 5);
  if (missingSurfaces.length > 0) warnings.push(`missing surfaces: ${missingSurfaces.join(', ')}`);

  if (hasCarryOverVariant(family) || hasRewardOrRecoveryVariant(family)) score += 15;
  else warnings.push('no carry-over or reward/recovery support');

  if (family.duplicateGuardTags.length >= 3 && buildEventFamilyDuplicateSignature(family, variants).length > 0) {
    score += 10;
  } else {
    warnings.push('duplicate guard metadata weak');
  }

  const longMobileLines = variants.filter(
    (variant) =>
      variant.titlePattern.length > EVENT_FAMILY_MOBILE_TEXT_LIMITS.titlePattern ||
      variant.situationLine.length > EVENT_FAMILY_MOBILE_TEXT_LIMITS.situationLine ||
      variant.decisionPressureLine.length > EVENT_FAMILY_MOBILE_TEXT_LIMITS.decisionPressureLine ||
      variant.echoHints.some((hint) => hint.hint.length > (hint.maxLength ?? EVENT_FAMILY_MOBILE_TEXT_LIMITS.echoHint)),
  );
  if (longMobileLines.length === 0) score += 10;
  else warnings.push(`mobile readability long lines: ${longMobileLines.length}`);

  const forbiddenTerms = validateEventFamilyForbiddenCopy(family, variants);
  if (forbiddenTerms.length === 0) score += 5;
  else failures.push(`forbidden copy: ${forbiddenTerms.join(', ')}`);

  const cappedScore = Math.max(0, Math.min(100, score));
  return {
    familyId: family.id,
    status: failures.length > 0 ? 'FAIL' : statusForScore(cappedScore),
    score: cappedScore,
    warnings,
    failures,
  };
}

export function summarizeEventFamilyQuality(
  families: readonly EventFamilyDefinition[],
  variants: readonly EventFamilyVariantDefinition[],
): EventFamilyQualityResult[] {
  const duplicateRisks = validateEventFamilyDuplicateRisk(families);
  return families.map((family) => {
    const result = scoreEventFamilyQuality(
      family,
      variants.filter((variant) => variant.familyId === family.id),
    );
    const familyDuplicateRisks = duplicateRisks.filter((risk) => risk.includes(family.id));
    if (familyDuplicateRisks.length > 0) {
      result.warnings.push(
        `duplicate risk tags over ${EVENT_FAMILY_DUPLICATE_GUARD_MAX_SHARED_TAGS}: ${familyDuplicateRisks.join(', ')}`,
      );
      if (result.status === 'PASS') result.status = 'WARN';
    }
    return result;
  });
}
