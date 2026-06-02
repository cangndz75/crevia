import { EVENT_VARIANT_DEFINITIONS, EVENT_VARIANT_KINDS } from './eventVariantConstants';
import { buildEventVariantCopySet, buildEventVariantSurfaceCopy } from './eventVariantCopy';
import {
  mergeVariantLineWithExistingEcho,
  shouldApplyVariantToSurface,
} from './eventVariantResolver';
import type {
  CreviaEventVariantBadgeModel,
  CreviaEventVariantKind,
  CreviaEventVariantSurface,
  CreviaResolvedEventVariant,
} from './eventVariantTypes';

export function buildEventVariantBadgeModel(resolved: CreviaResolvedEventVariant): CreviaEventVariantBadgeModel {
  return {
    kind: resolved.kind,
    label: resolved.definition.label,
    shortLabel: resolved.definition.shortLabel,
    tone: resolved.definition.tone,
    isVisible: resolved.kind !== 'normal' && resolved.safetyStatus !== 'blocked',
  };
}

export function buildEventVariantSurfaceLine(
  resolved: CreviaResolvedEventVariant,
  surface: CreviaEventVariantSurface,
): string | undefined {
  if (!shouldApplyVariantToSurface(resolved, surface)) return undefined;
  return buildEventVariantSurfaceCopy(resolved.kind, surface, resolved.definition.maxCopyLength);
}

export function buildEventVariantReportLine(resolved: CreviaResolvedEventVariant): string | undefined {
  return buildEventVariantSurfaceLine(resolved, 'report');
}

export function buildEventVariantMapHint(resolved: CreviaResolvedEventVariant): string | undefined {
  return buildEventVariantSurfaceLine(resolved, 'map');
}

export function buildEventVariantAdvisorLine(resolved: CreviaResolvedEventVariant): string | undefined {
  return buildEventVariantSurfaceLine(resolved, 'advisor');
}

export function buildEventVariantTomorrowPreview(resolved: CreviaResolvedEventVariant): string | undefined {
  return buildEventVariantSurfaceLine(resolved, 'tomorrow_preview');
}

export function buildEventVariantDebugRows(resolved: CreviaResolvedEventVariant): string[] {
  const copySet = buildEventVariantCopySet(resolved.kind);
  const rows = [
    `kind: ${resolved.kind}`,
    `reason: ${resolved.reason}`,
    `safety: ${resolved.safetyStatus}`,
    `contextOnly: ${resolved.isContextOnly}`,
    `primary: ${resolved.isPrimaryEventVariant}`,
    `tone: ${resolved.definition.tone}`,
  ];
  for (const [surface, line] of Object.entries(copySet.lines)) {
    if (line) rows.push(`${surface}: ${line}`);
  }
  return rows;
}

export function buildEventVariantEchoBundle(
  resolved: CreviaResolvedEventVariant,
  existing?: Partial<Record<CreviaEventVariantSurface, string>>,
): Partial<Record<CreviaEventVariantSurface, string>> {
  const out: Partial<Record<CreviaEventVariantSurface, string>> = {};
  const surfaces: CreviaEventVariantSurface[] = ['report', 'social', 'advisor', 'map', 'tomorrow_preview'];
  for (const surface of surfaces) {
    const variantLine = buildEventVariantSurfaceLine(resolved, surface);
    if (!variantLine) continue;
    out[surface] = mergeVariantLineWithExistingEcho(variantLine, existing?.[surface]) ?? variantLine;
  }
  return out;
}

export function listEventVariantKindLabels(): Record<CreviaEventVariantKind, string> {
  return EVENT_VARIANT_KINDS.reduce(
    (acc, kind) => {
      acc[kind] = EVENT_VARIANT_DEFINITIONS[kind].label;
      return acc;
    },
    {} as Record<CreviaEventVariantKind, string>,
  );
}
