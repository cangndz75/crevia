import type {
  PortfolioDeferBinding,
  PortfolioDeferRiskResult,
} from './portfolioDeferRiskTypes';

const TECHNICAL_ENUM_PATTERN = /[a-z]+_[a-z_]+/;

function normalizeLine(line: string): string {
  return line.trim().replace(/\s+/g, ' ');
}

function duplicateLine(line: string, existingLines: readonly string[]): boolean {
  const normalized = normalizeLine(line).toLowerCase();
  return existingLines.some((existing) => normalizeLine(existing).toLowerCase() === normalized);
}

export function buildPortfolioDeferReportLine(
  result: PortfolioDeferRiskResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const line = result?.reportSummaryLine;
  if (!line || duplicateLine(line, existingLines)) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return line;
}

export function buildPortfolioDeferTomorrowActionLine(
  result: PortfolioDeferRiskResult | null | undefined,
  existingLines: readonly string[] = [],
): string | undefined {
  const line = result?.tomorrowActionLine;
  if (!line || duplicateLine(line, existingLines)) return undefined;
  if (TECHNICAL_ENUM_PATTERN.test(line)) return undefined;
  return line;
}

export function buildPortfolioDeferBindingDebugRows(
  result: PortfolioDeferRiskResult,
): string[] {
  return result.bindings.map((binding: PortfolioDeferBinding) => {
    const action = binding.tomorrowLine ? ` -> ${binding.tomorrowLine}` : '';
    return `[${binding.kind}] p${binding.priority} ${binding.title}${action}`;
  });
}
