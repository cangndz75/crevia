import {
  CITY_JOURNAL_LITE_HUB_MAX_ENTRIES,
  CITY_JOURNAL_LITE_MAP_MAX_ENTRIES,
  CITY_JOURNAL_LITE_REPORT_LABEL,
  CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES,
  CITY_JOURNAL_LITE_TITLE,
} from './cityJournalConstants';
import { isCityJournalDuplicate, shouldShowCityJournalLite } from './cityJournalModel';
import type {
  CityJournalHubPresentation,
  CityJournalLiteModel,
  CityJournalMapPresentation,
  CityJournalReportPresentation,
} from './cityJournalTypes';

function journalFragment(line: string): string {
  const match = line.match(/^Gün\s+\d+:\s*(.+)$/i);
  return match?.[1]?.trim() ?? line;
}

export function buildCityJournalHubPresentation(
  model: CityJournalLiteModel | null | undefined,
  existingLines: string[] = [],
): CityJournalHubPresentation {
  if (!shouldShowCityJournalLite(model) || !model!.shouldShowInHub) {
    return { title: CITY_JOURNAL_LITE_TITLE, primaryLine: null, secondaryLine: null, visible: false };
  }

  const guard = [...existingLines];
  const hubEntries = model!.entries.slice(0, CITY_JOURNAL_LITE_HUB_MAX_ENTRIES);
  let primaryLine: string | null = null;
  let secondaryLine: string | null = null;

  for (const entry of hubEntries) {
    if (!primaryLine && !isCityJournalDuplicate(entry.line, guard)) {
      primaryLine = entry.line;
      guard.push(entry.line);
      continue;
    }
    if (!secondaryLine && !isCityJournalDuplicate(entry.line, guard)) {
      secondaryLine = entry.line;
      guard.push(entry.line);
      break;
    }
  }

  return {
    title: CITY_JOURNAL_LITE_TITLE,
    primaryLine,
    secondaryLine,
    visible: Boolean(primaryLine),
  };
}

export function buildCityJournalReportLine(
  model: CityJournalLiteModel | null | undefined,
  existingLines: string[] = [],
): string | null {
  if (!shouldShowCityJournalLite(model) || !model!.shouldShowInReport) return null;

  const entry =
    model!.entries.find((item) => !isCityJournalDuplicate(item.line, existingLines)) ??
    model!.entries[0];
  if (!entry) return null;

  const fragment = journalFragment(entry.line);
  const line = `${CITY_JOURNAL_LITE_REPORT_LABEL}: ${fragment}`;
  if (isCityJournalDuplicate(line, existingLines)) return null;
  return line;
}

export function buildCityJournalReportPresentation(
  model: CityJournalLiteModel | null | undefined,
  existingLines: string[] = [],
): CityJournalReportPresentation {
  const line = buildCityJournalReportLine(model, existingLines);
  return {
    label: CITY_JOURNAL_LITE_REPORT_LABEL,
    line,
    visible: Boolean(line),
  };
}

export function buildCityJournalMapHint(
  model: CityJournalLiteModel | null | undefined,
  districtId: string | null | undefined,
  existingLines: string[] = [],
): CityJournalMapPresentation {
  if (!shouldShowCityJournalLite(model) || !model!.shouldShowInMap || !districtId) {
    return { line: null, visible: false };
  }

  const match =
    model!.entries.find(
      (entry) =>
        entry.districtId === districtId &&
        !isCityJournalDuplicate(entry.line, existingLines),
    ) ?? model!.entries.slice(0, CITY_JOURNAL_LITE_MAP_MAX_ENTRIES)[0];

  if (!match || isCityJournalDuplicate(match.line, existingLines)) {
    return { line: null, visible: false };
  }

  const fragment = journalFragment(match.line);
  const line = `Son şehir izi: ${fragment}`;
  if (isCityJournalDuplicate(line, existingLines)) {
    return { line: null, visible: false };
  }

  return { line, visible: true };
}

export function buildCityJournalReportEntries(
  model: CityJournalLiteModel | null | undefined,
  existingLines: string[] = [],
): string[] {
  if (!shouldShowCityJournalLite(model) || !model!.shouldShowInReport) return [];

  const guard = [...existingLines];
  const lines: string[] = [];

  for (const entry of model!.entries.slice(0, CITY_JOURNAL_LITE_REPORT_MAX_ENTRIES)) {
    const line = buildCityJournalReportLine(
      { ...model!, entries: [entry] },
      guard,
    );
    if (line) {
      lines.push(line);
      guard.push(line, entry.line);
    }
  }

  return lines;
}
