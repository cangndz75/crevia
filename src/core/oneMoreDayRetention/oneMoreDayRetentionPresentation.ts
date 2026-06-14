import {
  ONE_MORE_DAY_ACCESSIBILITY_MAX,
  ONE_MORE_DAY_LINE_MAX,
} from './oneMoreDayRetentionConstants';
import type {
  OneMoreDayRetentionResult,
  ReportOneMoreDayCardModel,
} from './oneMoreDayRetentionTypes';

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

export function buildReportOneMoreDayCardModel(
  result: OneMoreDayRetentionResult | null | undefined,
  existingLines: readonly string[] = [],
): ReportOneMoreDayCardModel | null {
  const hook = result?.primaryHook;
  if (!result?.isVisible || !hook) return null;
  if (duplicates(hook.line, existingLines)) return null;
  if (TECHNICAL_ENUM_PATTERN.test(`${hook.title} ${hook.line} ${hook.tomorrowLine ?? ''}`)) {
    return null;
  }
  const line = clampLine(hook.line, ONE_MORE_DAY_LINE_MAX);
  const tomorrowLine = hook.tomorrowLine
    ? clampLine(hook.tomorrowLine, ONE_MORE_DAY_LINE_MAX)
    : undefined;
  return {
    id: `report_${hook.id}`,
    title: result.title,
    line,
    tomorrowLine,
    ctaLabel: hook.ctaLabel,
    ctaRoute: hook.ctaRoute,
    tone: hook.tone,
    accessibilityLabel: clampLine(
      `${result.title}. ${line}. ${tomorrowLine ?? ''}. ${hook.ctaLabel}.`,
      ONE_MORE_DAY_ACCESSIBILITY_MAX,
    ),
  };
}

export function buildOneMoreDayContinuationLine(
  result: OneMoreDayRetentionResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const hook = result?.primaryHook;
  if (!hook || hook.isFallback) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(hook.line)) return undefined;

  const hubCandidates = [
    result?.summaryLine?.trim(),
    hook.tomorrowLine?.trim(),
    hook.title?.trim() ? `Yarın: ${hook.title.trim()}` : undefined,
  ].filter((line): line is string => Boolean(line));

  const reportLines = [hook.line, hook.tomorrowLine]
    .filter((line): line is string => Boolean(line?.trim()))
    .map((line) => normalizeLine(line));

  const hubLine = hubCandidates.find(
    (candidate) =>
      !duplicates(candidate, existingLines) && !reportLines.includes(normalizeLine(candidate)),
  );

  if (!hubLine) return undefined;
  return clampLine(hubLine, ONE_MORE_DAY_LINE_MAX);
}

export function collectOneMoreDayRetentionLines(
  result: OneMoreDayRetentionResult,
): string[] {
  return [
    result.title,
    result.summaryLine,
    result.primaryHook?.line,
    result.primaryHook?.tomorrowLine,
    result.secondaryHook?.line,
    result.secondaryHook?.tomorrowLine,
    result.footerLine,
  ].filter((line): line is string => Boolean(line?.trim()));
}
