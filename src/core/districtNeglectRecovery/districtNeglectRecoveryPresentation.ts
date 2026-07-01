import {
  DISTRICT_NEGLECT_RECOVERY_ACCESSIBILITY_MAX,
  DISTRICT_NEGLECT_RECOVERY_KIND_BADGES,
  DISTRICT_NEGLECT_RECOVERY_LINE_MAX,
  DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS,
  DISTRICT_NEGLECT_RECOVERY_NEGLECT_LABELS,
  DISTRICT_NEGLECT_RECOVERY_RECOVERY_LABELS,
  DISTRICT_NEGLECT_RECOVERY_SHORT_MAX,
} from './districtNeglectRecoveryConstants';
import type {
  DistrictNeglectRecoveryCardModel,
  DistrictNeglectRecoveryResult,
  DistrictNeglectRecoverySignal,
} from './districtNeglectRecoveryTypes';

const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

function clampLine(value: string, max: number): string {
  const trimmed = value.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 3).trimEnd()}...`;
}

function normalizeLine(value: string | undefined): string {
  return value?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function duplicates(line: string, existingLines: readonly string[]): boolean {
  const normalized = normalizeLine(line);
  return existingLines.some((existing) => normalizeLine(existing) === normalized);
}

function isSafeText(text: string): boolean {
  return !TECHNICAL_ENUM_PATTERN.test(text);
}

function toCardModel(signal: DistrictNeglectRecoverySignal): DistrictNeglectRecoveryCardModel | null {
  const displayLine = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (!isSafeText(`${signal.title} ${displayLine}`)) return null;
  const line = clampLine(displayLine, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
  const shortLine = signal.shortLine
    ? clampLine(signal.shortLine, DISTRICT_NEGLECT_RECOVERY_SHORT_MAX)
    : undefined;
  return {
    id: `card_${signal.id}`,
    title: signal.title,
    line,
    shortLine,
    badgeLabel: signal.behaviorChip ?? DISTRICT_NEGLECT_RECOVERY_KIND_BADGES[signal.kind],
    districtName: signal.districtName,
    neglectLabel: DISTRICT_NEGLECT_RECOVERY_NEGLECT_LABELS[signal.neglectBand],
    recoveryLabel: DISTRICT_NEGLECT_RECOVERY_RECOVERY_LABELS[signal.recoveryBand],
    tone: signal.tone,
    isActionable: signal.isActionable,
    accessibilityLabel: clampLine(
      `${signal.title}. ${signal.districtName}. ${line}.`,
      DISTRICT_NEGLECT_RECOVERY_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildDistrictNeglectRecoveryCardModels(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): DistrictNeglectRecoveryCardModel[] {
  if (!result) return [];
  const cards: DistrictNeglectRecoveryCardModel[] = [];
  for (const signal of result.signals.slice(0, DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS)) {
    if (signal.isFallback && result.day > 1) continue;
    if (duplicates(signal.line, existingLines)) continue;
    const card = toCardModel(signal);
    if (!card) continue;
    cards.push(card);
    if (cards.length >= DISTRICT_NEGLECT_RECOVERY_MAX_PRESENTATION_SIGNALS) break;
  }
  return cards;
}

export function buildPrimaryDistrictNeglectRecoveryCard(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): DistrictNeglectRecoveryCardModel | null {
  const signal = result?.primarySignal;
  if (!signal || (signal.isFallback && (result?.day ?? 1) > 1)) return null;
  if (duplicates(signal.line, existingLines)) return null;
  return toCardModel(signal);
}

export function buildReportDistrictNeglectRecoveryNote(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const signal = result?.reportSignal;
  if (!signal || signal.isFallback || result?.day === 1) return null;
  const line = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (duplicates(line, existingLines)) return null;
  if (!isSafeText(line)) return null;
  return clampLine(line, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
}

export function buildHubDistrictNeglectRecoveryHint(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const signal = result?.hubSignal;
  if (!signal || signal.isFallback || (result?.day ?? 1) <= 1) return null;
  const line = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (duplicates(line, existingLines)) return null;
  if (!isSafeText(line)) return null;
  return clampLine(line, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
}

export function buildMapDistrictNeglectRecoveryHint(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const signal = result?.mapSignal;
  if (!signal || signal.isFallback || (result?.day ?? 1) <= 1) return null;
  const line = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (duplicates(line, existingLines)) return null;
  if (!isSafeText(line)) return null;
  return clampLine(line, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
}

export function buildEceDistrictNeglectRecoveryLine(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const signal = result?.eceSignal;
  if (!signal || signal.isFallback || signal.confidence === 'low' || (result?.day ?? 1) <= 1) {
    return null;
  }
  const line = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (duplicates(line, existingLines)) return null;
  if (!isSafeText(line)) return null;
  const district = signal.districtName ? `${signal.districtName}: ` : '';
  return clampLine(`${district}${line}`, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
}

export function buildPortfolioDistrictNeglectRecoverySignal(
  result: DistrictNeglectRecoveryResult | null | undefined,
  existingLines: readonly string[] = [],
): string | null {
  const signal = result?.portfolioSignal;
  if (!signal || signal.isFallback || (result?.day ?? 1) <= 1) return null;
  const line = signal.behaviorLine && isSafeText(signal.behaviorLine)
    ? signal.behaviorLine
    : signal.line;
  if (duplicates(line, existingLines)) return null;
  if (!isSafeText(line)) return null;
  return clampLine(line, DISTRICT_NEGLECT_RECOVERY_LINE_MAX);
}

export function buildFollowUpDistrictNeglectRecoverySeed(
  result: DistrictNeglectRecoveryResult | null | undefined,
): { districtId?: string; districtName?: string; kind?: string; sourceIds: string[] } | null {
  const signal = result?.signals.find(
    (entry) =>
      !entry.isFallback &&
      (entry.kind === 'neglect_warning' ||
        entry.kind === 'recovery_window' ||
        entry.kind === 'recovery_progress'),
  );
  if (!signal) return null;
  return {
    districtId: signal.districtId,
    districtName: signal.districtName,
    kind: signal.recoveryBand !== 'none' ? 'support_recovery' : 'recheck_district',
    sourceIds: signal.sourceIds,
  };
}

export function buildPositiveComebackDistrictRecoverySeed(
  result: DistrictNeglectRecoveryResult | null | undefined,
): { districtId?: string; districtName?: string; kind?: string; sourceIds: string[] } | null {
  const signal = result?.signals.find(
    (entry) =>
      !entry.isFallback &&
      (entry.kind === 'recovery_window' ||
        entry.kind === 'recovery_progress' ||
        entry.kind === 'positive_momentum'),
  );
  if (!signal) return null;
  return {
    districtId: signal.districtId,
    districtName: signal.districtName,
    kind: 'district_recovery',
    sourceIds: signal.sourceIds,
  };
}

export function collectDistrictNeglectRecoveryPresentationLines(
  result: DistrictNeglectRecoveryResult,
): string[] {
  return result.signals.map((signal) => signal.line);
}
