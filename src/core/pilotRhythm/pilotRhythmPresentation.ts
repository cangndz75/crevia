import {
  getPilotThemeDefinitionByDay,
  PILOT_THEME_DEFINITIONS,
} from './pilotRhythmConstants';
import type {
  PilotThemeDay,
  PilotThemeDefinition,
  PilotThemeDomain,
  PilotThemeViewModel,
  PilotThemeVisibility,
} from './pilotRhythmTypes';

export function isPilotThemeDay(day: number): day is PilotThemeDay {
  return Number.isInteger(day) && day >= 1 && day <= 7;
}

export function getPilotThemeForDay(day: number): PilotThemeDefinition | null {
  if (!isPilotThemeDay(day)) {
    return null;
  }
  return getPilotThemeDefinitionByDay(day) ?? null;
}

function resolveVisibility(day: PilotThemeDay): PilotThemeVisibility {
  if (day === 1) return 'compact';
  if (day === 7) return 'final';
  return 'standard';
}

export function buildPilotThemeViewModel(
  day: number,
  options?: { compact?: boolean; isReport?: boolean; isHub?: boolean },
): PilotThemeViewModel | null {
  const theme = getPilotThemeForDay(day);
  if (!theme) {
    return null;
  }

  const visibility = resolveVisibility(theme.day);
  const forceCompact = options?.compact === true || visibility === 'compact';
  const isReport = options?.isReport === true;

  const headline = isReport ? theme.reportHeadline : theme.hubHeadline;
  const summary = isReport ? theme.reportSummary : theme.hubSummary;

  const maxTags = forceCompact ? 0 : theme.day === 7 ? 2 : 2;
  const emphasisTags = theme.emphasisTags.slice(0, maxTags);

  return {
    day: theme.day,
    title: theme.title,
    shortTitle: theme.shortTitle,
    headline,
    summary,
    emphasisTags,
    visibility,
    advisorLine: theme.advisorHint,
    reportLine: `Bugünün Teması: ${theme.shortTitle} — ${theme.reportSummary}`,
    eventFocusLine: buildPilotThemeEventFocusLine(day),
  };
}

export function buildPilotThemeEventFocusLine(day: number): string | null {
  if (!shouldShowPilotThemeOnEvent(day)) {
    return null;
  }
  const theme = getPilotThemeForDay(day);
  if (!theme) {
    return null;
  }
  return `Bugünün odağı: ${theme.shortTitle}`;
}

export function buildPilotThemeAdvisorLine(day: number): string | null {
  const theme = getPilotThemeForDay(day);
  return theme?.advisorHint ?? null;
}

export function buildPilotThemeReportLine(day: number): string | null {
  const vm = buildPilotThemeViewModel(day, { isReport: true });
  return vm?.reportLine ?? null;
}

export function buildPilotThemeEmphasisTags(day: number): string[] {
  const theme = getPilotThemeForDay(day);
  return theme?.emphasisTags ?? [];
}

export function shouldShowPilotThemeOnHub(day: number): boolean {
  return isPilotThemeDay(day);
}

export function shouldShowPilotThemeOnReport(day: number): boolean {
  return isPilotThemeDay(day);
}

export function shouldShowPilotThemeOnEvent(day: number): boolean {
  return isPilotThemeDay(day) && day > 1;
}

export function getPilotThemePrimaryDomain(day: number): PilotThemeDomain | null {
  return getPilotThemeForDay(day)?.domain ?? null;
}

export function buildPilotThemeHubCardModel(day: number): PilotThemeViewModel | null {
  return buildPilotThemeViewModel(day, { isHub: true, compact: day === 1 });
}

export { PILOT_THEME_DEFINITIONS };
