export type PilotThemeDay = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PilotThemeDomain =
  | 'first_response'
  | 'container_pressure'
  | 'resource_fatigue'
  | 'social_pulse'
  | 'district_balance'
  | 'crisis_signal'
  | 'pilot_final';

export type PilotThemeTone =
  | 'learning'
  | 'operational'
  | 'caution'
  | 'social'
  | 'strategic'
  | 'transition';

export type PilotThemeVisibility = 'hidden' | 'compact' | 'standard' | 'final';

export type PilotThemeDefinition = {
  day: PilotThemeDay;
  id: string;
  title: string;
  shortTitle: string;
  domain: PilotThemeDomain;
  tone: PilotThemeTone;
  hubHeadline: string;
  hubSummary: string;
  eventGuidance: string;
  planGuidance: string;
  dispatchGuidance: string;
  fieldGuidance: string;
  reportHeadline: string;
  reportSummary: string;
  advisorHint: string;
  unlockedSignals: string[];
  hiddenSignals: string[];
  emphasisTags: string[];
  maxVisibleThemeLines: number;
};

export type PilotThemeViewModel = {
  day: PilotThemeDay;
  title: string;
  shortTitle: string;
  headline: string;
  summary: string;
  emphasisTags: string[];
  visibility: PilotThemeVisibility;
  advisorLine: string;
  reportLine: string;
  eventFocusLine: string | null;
};

export type PilotThemeVerifyOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
};
