import {
  EVENT_FAMILY_ALLOWED_AVAILABILITY_PHASES,
  EVENT_FAMILY_ALLOWED_DOMAINS,
  EVENT_FAMILY_ALLOWED_OUTCOME_TONES,
  EVENT_FAMILY_REQUIRED_ECHO_SURFACES,
  EVENT_FAMILY_REQUIRED_VARIANT_KINDS,
} from './eventFamilyConstants';
import { scoreEventFamilyQuality } from './eventFamilyQualityGuards';
import type {
  EventFamilyBundle,
  EventFamilyDefinition,
  EventFamilyEchoSurface,
  EventFamilyValidationResult,
  EventFamilyVariantDefinition,
} from './eventFamilyTypes';

function validateNonEmpty(value: string | undefined, field: string, failures: string[]): void {
  if (!value || value.trim().length === 0) {
    failures.push(`${field} is required`);
  }
}

function includesValue<T extends string>(values: readonly T[], value: string): value is T {
  return values.includes(value as T);
}

export function defineEventFamily(definition: EventFamilyDefinition): EventFamilyValidationResult {
  const warnings: string[] = [];
  const failures: string[] = [];

  validateNonEmpty(definition.id, 'family.id', failures);
  validateNonEmpty(definition.title, 'family.title', failures);
  validateNonEmpty(definition.shortLabel, 'family.shortLabel', failures);
  validateNonEmpty(definition.description, 'family.description', failures);

  if (!includesValue(EVENT_FAMILY_ALLOWED_DOMAINS, definition.domain)) {
    failures.push(`Invalid domain: ${definition.domain}`);
  }
  if (definition.availabilityPhases.length === 0) {
    failures.push('availabilityPhases must not be empty');
  }
  for (const phase of definition.availabilityPhases) {
    if (!includesValue(EVENT_FAMILY_ALLOWED_AVAILABILITY_PHASES, phase)) {
      failures.push(`Invalid availability phase: ${phase}`);
    }
  }
  if (definition.variantKinds.length < 3) {
    warnings.push('family has fewer than 3 variant kinds');
  }
  if (definition.echoSurfaces.length < 3) {
    warnings.push('family has fewer than 3 echo surfaces');
  }
  if (definition.qualityTags.length === 0) {
    failures.push('qualityTags must not be empty');
  }
  if (definition.duplicateGuardTags.length === 0) {
    failures.push('duplicateGuardTags must not be empty');
  }

  return { ok: failures.length === 0, warnings, failures };
}

export function defineEventFamilyVariant(
  variant: EventFamilyVariantDefinition,
): EventFamilyValidationResult {
  const warnings: string[] = [];
  const failures: string[] = [];

  validateNonEmpty(variant.id, 'variant.id', failures);
  validateNonEmpty(variant.familyId, 'variant.familyId', failures);
  validateNonEmpty(variant.titlePattern, 'variant.titlePattern', failures);
  validateNonEmpty(variant.situationLine, 'variant.situationLine', failures);
  validateNonEmpty(variant.decisionPressureLine, 'variant.decisionPressureLine', failures);

  if (!includesValue(EVENT_FAMILY_REQUIRED_VARIANT_KINDS, variant.kind)) {
    failures.push(`Invalid variant kind: ${variant.kind}`);
  }
  if (!includesValue(EVENT_FAMILY_ALLOWED_OUTCOME_TONES, variant.expectedOutcomeTone)) {
    failures.push(`Invalid outcome tone: ${variant.expectedOutcomeTone}`);
  }
  if (variant.echoHints.length === 0) {
    warnings.push('variant has no echo hints');
  }
  if (variant.freshnessTags.length === 0) {
    failures.push('freshnessTags must not be empty');
  }

  return { ok: failures.length === 0, warnings, failures };
}

export function buildEventFamilyBundle(input: {
  family: EventFamilyDefinition;
  variants: EventFamilyVariantDefinition[];
}): EventFamilyBundle {
  const variants = input.variants.filter((variant) => variant.familyId === input.family.id);
  return {
    family: input.family,
    variants,
    coverage: {
      variantKinds: [...new Set(variants.map((variant) => variant.kind))],
      echoSurfaces: [...new Set(input.family.echoSurfaces)],
      outcomeTones: [...new Set(input.family.outcomeTones)],
    },
    qualityHint: scoreEventFamilyQuality(input.family, variants),
  };
}

export function assertEventFamilyHasRequiredSurfaces(family: EventFamilyDefinition): {
  count: number;
  missing: EventFamilyEchoSurface[];
  ok: boolean;
} {
  const surfaceSet = new Set(family.echoSurfaces);
  const missing = EVENT_FAMILY_REQUIRED_ECHO_SURFACES.filter((surface) => !surfaceSet.has(surface));
  return {
    count: EVENT_FAMILY_REQUIRED_ECHO_SURFACES.length - missing.length,
    missing,
    ok: missing.length <= 2,
  };
}

export function getEventFamilyAvailabilitySummary(family: EventFamilyDefinition): string {
  if (family.requiredRankKey) {
    return `${family.requiredRankKey} yetkisiyle ${family.triggerSignals.slice(0, 2).join(' ve ')} sinyallerinde görünür.`;
  }
  if (family.minAuthority != null) {
    return `${family.minAuthority}+ authority seviyesinde ${family.domain} içeriğine bağlanır.`;
  }
  return `${family.availabilityPhases[0] ?? 'light_main_operation'} aşamasında ${family.domain} sinyallerinde kullanılır.`;
}
