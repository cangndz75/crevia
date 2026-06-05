import {
  OPERATION_ERA_RUNTIME_PREVIEW_COMPACT_COPY_MAX,
  OPERATION_ERA_RUNTIME_PREVIEW_FORBIDDEN_COPY_TERMS,
  OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX,
  OPERATION_ERA_RUNTIME_PREVIEW_PANIC_TERMS,
  getOperationEraRuntimePreviewDefinition,
} from './operationEraRuntimePreviewConstants';
import {
  buildOperationEraPreviewContext,
  buildOperationEraRuntimePreviewModel,
  type BuildOperationEraRuntimePreviewInput,
} from './operationEraRuntimePreviewModel';
import type {
  CreviaOperationEraPreviewCardModel,
  CreviaOperationEraPreviewKind,
  CreviaOperationEraPreviewLine,
  CreviaOperationEraPreviewVisibility,
  CreviaOperationEraRuntimePreviewModel,
} from './operationEraRuntimePreviewTypes';

function clampCopy(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1).trimEnd()}…`;
}

export function operationEraRuntimePreviewCopyContainsForbiddenTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return OPERATION_ERA_RUNTIME_PREVIEW_FORBIDDEN_COPY_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

export function operationEraRuntimePreviewCopyContainsPanicTerms(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return OPERATION_ERA_RUNTIME_PREVIEW_PANIC_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}

function safeCopy(text: string, max: number, fallback: string): string {
  const clamped = clampCopy(text, max);
  if (
    operationEraRuntimePreviewCopyContainsForbiddenTerms(clamped) ||
    operationEraRuntimePreviewCopyContainsPanicTerms(clamped)
  ) {
    return clampCopy(fallback, max);
  }
  return clamped;
}

function copyMaxForVisibility(visibility: CreviaOperationEraPreviewVisibility): number {
  if (visibility === 'compact' || visibility === 'pilot_prep') {
    return OPERATION_ERA_RUNTIME_PREVIEW_COMPACT_COPY_MAX;
  }
  return OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX;
}

function normalizeSemanticKey(text: string): string {
  return text
    .toLocaleLowerCase('tr-TR')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 32);
}

function isSemanticDuplicate(a: string, b: string): boolean {
  const ka = normalizeSemanticKey(a);
  const kb = normalizeSemanticKey(b);
  if (!ka || !kb) return false;
  if (ka === kb) return true;
  if (ka.length >= 14 && kb.length >= 14) {
    return ka.includes(kb.slice(0, 16)) || kb.includes(ka.slice(0, 16));
  }
  return false;
}

function isDuplicateAgainst(text: string, existing: string[]): boolean {
  return existing.some((line) => isSemanticDuplicate(text, line));
}

export function shouldSuppressOperationEraPreviewForSurface(
  surface: CreviaOperationEraPreviewLine['surface'],
  hintText: string,
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): boolean {
  const all = [
    ...existingLines,
    ...(input.existingLines ?? []),
    input.nextUnlockLine ?? '',
    input.districtOperationLine ?? '',
    input.tomorrowPreviewLine ?? '',
    ...(input.permissionChipLabels ?? []),
  ].filter(Boolean);

  if (!hintText.trim()) return true;
  if (isDuplicateAgainst(hintText, all)) return true;

  if (surface === 'hub' && input.nextUnlockLine && isSemanticDuplicate(hintText, input.nextUnlockLine)) {
    return true;
  }
  if (surface === 'hub' && input.districtOperationLine && isSemanticDuplicate(hintText, input.districtOperationLine)) {
    return true;
  }
  if (surface === 'report' && input.tomorrowPreviewLine && isSemanticDuplicate(hintText, input.tomorrowPreviewLine)) {
    return true;
  }
  if (
    surface === 'profile' &&
    input.permissionChipLabels?.some((chip) => isSemanticDuplicate(hintText, chip))
  ) {
    return true;
  }

  return false;
}

function surfaceIcon(surface: CreviaOperationEraPreviewLine['surface']): string {
  if (surface === 'map') return 'compass-outline';
  if (surface === 'report') return 'document-text-outline';
  if (surface === 'profile') return 'ribbon-outline';
  if (surface === 'advisor') return 'chatbubble-ellipses-outline';
  return 'calendar-outline';
}

function surfacePriority(surface: CreviaOperationEraPreviewLine['surface']): number {
  if (surface === 'hub') return 56;
  if (surface === 'report') return 44;
  if (surface === 'profile') return 42;
  if (surface === 'map') return 38;
  return 34;
}

function buildSurfaceLine(
  surface: CreviaOperationEraPreviewLine['surface'],
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  const model = buildOperationEraRuntimePreviewModel(input);
  if (!model.visible) return null;

  const definition = getOperationEraRuntimePreviewDefinition(model.kind);
  const max = copyMaxForVisibility(model.visibility);
  const intentMap = {
    hub: definition.hubIntent,
    map: definition.mapIntent,
    report: definition.reportIntent,
    profile: definition.profileIntent,
    advisor: definition.hubIntent,
  } as const;

  const text = safeCopy(
    intentMap[surface],
    max,
    'Dönemsel operasyon odağı: açık uçlu kariyer ritmi sakin biçimde izleniyor.',
  );

  if (shouldSuppressOperationEraPreviewForSurface(surface, text, input, existingLines)) {
    return null;
  }

  return {
    id: `operation-era-preview-${surface}`,
    surface,
    text,
    label: 'Operasyon Dönemi',
    chipLabel: definition.shortLabel,
    kind: model.kind,
    tone: definition.tone,
    iconKey: surfaceIcon(surface),
    priority: surfacePriority(surface),
    source: 'operation_era_runtime_preview',
    isHintOnly: true,
    maxLines: model.visibility === 'detailed' ? 2 : 1,
  };
}

export function buildOperationEraHubLine(
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  return buildSurfaceLine('hub', input, existingLines);
}

export function buildOperationEraReportLine(
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  return buildSurfaceLine('report', input, existingLines);
}

export function buildOperationEraProfileLine(
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  return buildSurfaceLine('profile', input, existingLines);
}

export function buildOperationEraMapLine(
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  const line = buildSurfaceLine('map', input, existingLines);
  if (!line) return null;
  if (input.crisisOverlayVisible) {
    return { ...line, maxLines: 1, text: safeCopy(line.text, OPERATION_ERA_RUNTIME_PREVIEW_COMPACT_COPY_MAX, line.text) };
  }
  return line;
}

export function buildOperationEraAdvisorLine(
  input: BuildOperationEraRuntimePreviewInput = {},
  existingLines: string[] = [],
): CreviaOperationEraPreviewLine | null {
  return buildSurfaceLine('advisor', input, existingLines);
}

export function buildOperationEraCompactChip(
  input: BuildOperationEraRuntimePreviewInput = {},
): string {
  const model = buildOperationEraRuntimePreviewModel(input);
  if (!model.visible) return '';
  const definition = getOperationEraRuntimePreviewDefinition(model.kind);
  return safeCopy(
    definition.shortLabel,
    OPERATION_ERA_RUNTIME_PREVIEW_COMPACT_COPY_MAX,
    'Ana Operasyon',
  );
}

export function buildOperationEraPreviewCardModel(
  input: BuildOperationEraRuntimePreviewInput = {},
): CreviaOperationEraPreviewCardModel {
  const model = buildOperationEraRuntimePreviewModel(input);
  const definition = getOperationEraRuntimePreviewDefinition(model.kind);
  const hubLine = buildOperationEraHubLine(input);

  return {
    visible: model.visible && Boolean(hubLine?.text),
    title: 'Dönemsel Operasyon Odağı',
    subtitle: definition.label,
    chipLabel: buildOperationEraCompactChip(input) || undefined,
    line: hubLine?.text,
    tone: definition.tone,
    iconKey: 'calendar-outline',
    kind: model.kind,
    isHintOnly: true,
  };
}

export function buildOperationEraSelectionContextHint(
  input: BuildOperationEraRuntimePreviewInput = {},
): {
  eraKind: CreviaOperationEraPreviewKind;
  relatedDomains: readonly string[];
  recommendedVariantBias: readonly string[];
  isRuntimeLinked: false;
} {
  const model = buildOperationEraRuntimePreviewModel(input);
  const definition = getOperationEraRuntimePreviewDefinition(model.kind);
  return {
    eraKind: model.kind,
    relatedDomains: definition.relatedDomains,
    recommendedVariantBias: definition.recommendedVariantBias,
    isRuntimeLinked: false,
  };
}

export function buildOperationEraVariantBias(
  input: BuildOperationEraRuntimePreviewInput = {},
): readonly string[] {
  const model = buildOperationEraRuntimePreviewModel(input);
  return getOperationEraRuntimePreviewDefinition(model.kind).recommendedVariantBias;
}

export function buildOperationEraStoryChainBias(
  input: BuildOperationEraRuntimePreviewInput = {},
): readonly string[] {
  const model = buildOperationEraRuntimePreviewModel(input);
  return getOperationEraRuntimePreviewDefinition(model.kind).recommendedStoryChainKinds;
}

export function buildOperationEraAnalyticsHint(
  input: BuildOperationEraRuntimePreviewInput = {},
  surface: CreviaOperationEraPreviewLine['surface'] = 'hub',
): {
  eraKind: CreviaOperationEraPreviewKind;
  surface: string;
  visibilityMode: string;
  day: number;
  rankBand: 'early' | 'standard' | 'senior';
  isRuntimeLinked: false;
} {
  const model = buildOperationEraRuntimePreviewModel(input);
  const context = buildOperationEraPreviewContext(input);
  const rankKey = context.rankKey ?? '';
  const rankBand =
    rankKey.includes('director') || rankKey.includes('chief')
      ? 'senior'
      : rankKey.includes('manager') || rankKey.includes('coordinator')
        ? 'standard'
        : 'early';

  return {
    eraKind: model.kind,
    surface,
    visibilityMode: model.visibility,
    day: context.currentDay,
    rankBand,
    isRuntimeLinked: false,
  };
}

export type { BuildOperationEraRuntimePreviewInput } from './operationEraRuntimePreviewModel';

export function validateOperationEraRuntimePreviewCopy(text: string, max = OPERATION_ERA_RUNTIME_PREVIEW_MOBILE_COPY_MAX): boolean {
  return (
    text.length <= max + 1 &&
    !operationEraRuntimePreviewCopyContainsForbiddenTerms(text) &&
    !operationEraRuntimePreviewCopyContainsPanicTerms(text)
  );
}
