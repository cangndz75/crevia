import type { CreviaEventSelectionResult } from '@/core/eventSelection/eventSelectionTypes';

import {
  EVENT_VARIANT_DEFINITIONS,
  EVENT_VARIANT_KINDS,
  EVENT_VARIANT_RISKY_KINDS,
  EVENT_VARIANT_TUTORIAL_BLOCKED_KINDS,
  EVENT_VARIANT_TUTORIAL_MAX_DAY,
  getEventVariantDefinition,
} from './eventVariantConstants';
import {
  eventVariantCopyContainsForbiddenTerms,
  eventVariantCopyContainsPanicTerms,
} from './eventVariantCopy';
import type {
  CreviaEventVariantContext,
  CreviaEventVariantKind,
  CreviaEventVariantSafetyStatus,
  CreviaEventVariantSurface,
  CreviaResolvedEventVariant,
  CreviaVariantAwareEchoContext,
} from './eventVariantTypes';

function stableHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function isValidKind(value?: string): value is CreviaEventVariantKind {
  return !!value && EVENT_VARIANT_KINDS.includes(value as CreviaEventVariantKind);
}

function normalizeText(value: string): string {
  return value.toLocaleLowerCase('tr-TR').replace(/\s+/g, ' ').trim();
}

export function buildSafeEventVariantFallback(): CreviaResolvedEventVariant {
  const definition = getEventVariantDefinition('normal');
  return {
    kind: 'normal',
    definition,
    reason: 'safe_default',
    safetyStatus: 'pass',
    isContextOnly: false,
    isPrimaryEventVariant: true,
    resolutionLine: 'Güvenli normal variant fallback.',
  };
}

function resolveKindFromContext(context: CreviaEventVariantContext = {}): CreviaEventVariantKind {
  if (context.recommendedVariantKind && isValidKind(context.recommendedVariantKind)) {
    return context.recommendedVariantKind;
  }

  const trust = context.districtTrustBand ?? 'unknown';
  const crisis = context.crisisRiskBand ?? 'low';
  const resource = context.resourcePressureBand ?? 'medium';
  const recent = context.recentVariantKinds ?? [];

  if (context.operationEraId) return 'operation_era';
  if (context.hasUnresolvedCarryOver || recent.includes('carry_over')) return 'carry_over';
  if (resource === 'high' || resource === 'critical') return 'resource_fatigue';
  if (crisis === 'high' || crisis === 'critical') return 'crisis_adjacent';
  if (trust === 'fragile' || trust === 'watch') {
    return context.eventDomain === 'resource_recovery' ? 'comeback' : 'district_trust';
  }
  if (trust === 'trusted' || trust === 'stable') {
    if (resource === 'low') return 'reward';
    return 'improved';
  }
  return 'normal';
}

function applySafetyGuards(
  kind: CreviaEventVariantKind,
  context: CreviaEventVariantContext,
): { kind: CreviaEventVariantKind; safetyStatus: CreviaEventVariantSafetyStatus; reason: CreviaResolvedEventVariant['reason'] } {
  const day = context.day ?? 1;
  let resolvedKind = kind;
  let safetyStatus: CreviaEventVariantSafetyStatus = 'pass';
  let reason: CreviaResolvedEventVariant['reason'] =
    context.recommendedVariantKind ? 'selection_recommendation' : 'context_fallback';

  if (day <= EVENT_VARIANT_TUTORIAL_MAX_DAY && EVENT_VARIANT_TUTORIAL_BLOCKED_KINDS.includes(resolvedKind)) {
    resolvedKind = 'normal';
    safetyStatus = 'downgraded';
    reason = 'tutorial_guard';
  }

  if (day <= EVENT_VARIANT_TUTORIAL_MAX_DAY && EVENT_VARIANT_RISKY_KINDS.includes(kind)) {
    resolvedKind = 'normal';
    safetyStatus = 'downgraded';
    reason = 'tutorial_guard';
  }

  if (resolvedKind === 'reward') {
    const trust = context.districtTrustBand ?? 'unknown';
    const resource = context.resourcePressureBand ?? 'medium';
    if (!(trust === 'trusted' || trust === 'stable') || !(resource === 'low' || resource === 'medium')) {
      resolvedKind = trust === 'fragile' || trust === 'watch' ? 'district_trust' : 'improved';
      safetyStatus = 'downgraded';
      reason = 'safety_downgrade';
    }
  }

  const definition = getEventVariantDefinition(resolvedKind);
  if (definition.shouldAvoidPanicLanguage && definition.isRisky && day <= 3) {
    resolvedKind = 'normal';
    safetyStatus = 'downgraded';
    reason = 'safety_downgrade';
  }

  return { kind: resolvedKind, safetyStatus, reason };
}

export function resolveEventVariantForContext(
  context: CreviaEventVariantContext = {},
): CreviaResolvedEventVariant {
  const rawKind = resolveKindFromContext(context);
  const guarded = applySafetyGuards(rawKind, context);
  const definition = getEventVariantDefinition(guarded.kind);

  return {
    kind: guarded.kind,
    definition,
    reason: guarded.reason,
    safetyStatus: guarded.safetyStatus,
    isContextOnly: definition.isContextOnly,
    isPrimaryEventVariant: !definition.isContextOnly,
    resolutionLine: `${definition.label} (${guarded.reason}).`,
  };
}

export function resolveEventVariantFromSelectionResult(
  selectionResult: CreviaEventSelectionResult,
  context: Partial<CreviaEventVariantContext> = {},
): CreviaResolvedEventVariant {
  const merged: CreviaEventVariantContext = {
    day: selectionResult.context.day,
    operationCareerPhase: selectionResult.context.operationCareerPhase,
    districtId: selectionResult.context.districtId,
    districtTrustBand: selectionResult.context.districtTrustBand,
    crisisRiskBand: selectionResult.context.crisisRiskBand,
    resourcePressureBand: selectionResult.context.resourcePressureBand,
    operationEraId: selectionResult.context.operationEraId,
    recentVariantKinds: selectionResult.context.recentVariantKinds,
    recommendedVariantKind: selectionResult.decision.recommendedVariantKind,
    ...context,
  };
  return resolveEventVariantForContext(merged);
}

export function buildEventVariantContextFromEvent(
  event: unknown,
  extras: Partial<CreviaEventVariantContext> = {},
): CreviaEventVariantContext {
  const record = event && typeof event === 'object' ? (event as Record<string, unknown>) : {};
  const readString = (keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'string' && value.length > 0) return value;
    }
    return undefined;
  };
  const readNumber = (keys: string[]) => {
    for (const key of keys) {
      const value = record[key];
      if (typeof value === 'number' && Number.isFinite(value)) return value;
    }
    return undefined;
  };

  return {
    day: readNumber(['day']) ?? extras.day ?? 1,
    eventId: readString(['id', 'eventId']) ?? extras.eventId,
    eventTitle: readString(['title', 'eventTitle']) ?? extras.eventTitle,
    eventDomain:
      readString(['eventType', 'contentCategory', 'category', 'domain']) ?? extras.eventDomain,
    districtId: readString(['neighborhoodId', 'districtId']) ?? extras.districtId,
    ...extras,
  };
}

export function shouldApplyVariantToSurface(
  resolved: CreviaResolvedEventVariant,
  surface: CreviaEventVariantSurface,
): boolean {
  if (resolved.safetyStatus === 'blocked') return false;
  if (resolved.isContextOnly && (surface === 'event_card' || surface === 'dispatch' || surface === 'field')) {
    return false;
  }
  return resolved.definition.allowedSurfaces.includes(surface);
}

export function validateResolvedEventVariant(resolved: CreviaResolvedEventVariant): boolean {
  if (!EVENT_VARIANT_DEFINITIONS[resolved.kind]) return false;
  if (resolved.definition.shouldAvoidPanicLanguage) {
    const blob = [resolved.definition.label, resolved.definition.defaultEchoIntent, resolved.resolutionLine].join(' ');
    if (eventVariantCopyContainsPanicTerms(blob)) return false;
  }
  if (eventVariantCopyContainsForbiddenTerms(resolved.resolutionLine)) return false;
  if (resolved.kind === 'operation_era' && resolved.isPrimaryEventVariant) return false;
  return true;
}

export function buildVariantAwareEchoContext(
  resolved: CreviaResolvedEventVariant,
  surface: CreviaEventVariantSurface,
  existingEchoLine?: string,
  variantLine?: string,
  day = 1,
): CreviaVariantAwareEchoContext {
  return {
    day,
    variantKind: resolved.kind,
    surface,
    existingEchoLine,
    variantLine,
    suppressDuplicate: shouldSuppressVariantEchoDuplicate(variantLine, existingEchoLine, {
      recentVariantLines: [],
      day,
    }),
  };
}

export function mergeVariantLineWithExistingEcho(
  variantLine: string | undefined,
  existingEchoLine: string | undefined,
): string | undefined {
  const variant = variantLine?.trim();
  const existing = existingEchoLine?.trim();
  if (!variant) return existing;
  if (!existing) return variant;
  if (shouldSuppressVariantEchoDuplicate(variant, existing)) return existing;
  if (normalizeText(variant) === normalizeText(existing)) return existing;
  const combined = `${existing} ${variant}`;
  return combined.length > 140 ? existing : combined;
}

export function shouldSuppressVariantEchoDuplicate(
  variantLine: string | undefined,
  existingEchoLine: string | undefined,
  context: Pick<CreviaEventVariantContext, 'recentVariantLines' | 'day'> = {},
): boolean {
  const variant = variantLine?.trim();
  if (!variant) return true;

  const existing = existingEchoLine?.trim();
  if (existing && normalizeText(existing) === normalizeText(variant)) return true;
  if (existing && normalizeText(existing).includes(normalizeText(variant))) return true;
  if (existing && normalizeText(variant).includes(normalizeText(existing))) return true;

  const recent = context.recentVariantLines ?? [];
  if (recent.some((line) => normalizeText(line) === normalizeText(variant))) return true;

  const daySeed = `${context.day ?? 0}|${normalizeText(variant)}`;
  const hash = stableHash(daySeed);
  if (hash % 17 === 0 && recent.length >= 2) return true;

  return false;
}

export function resolveDeterministicVariantForContext(
  context: CreviaEventVariantContext,
): CreviaResolvedEventVariant {
  const first = resolveEventVariantForContext(context);
  const second = resolveEventVariantForContext(context);
  if (first.kind !== second.kind || first.reason !== second.reason) {
    return buildSafeEventVariantFallback();
  }
  return first;
}
