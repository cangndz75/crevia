import type { UiDensityDayMode } from './uiDensityTypes';

export const UI_DENSITY_DOCS_PATH = 'docs/crevia-ui-density-accessibility-polish.md';

export const UI_DENSITY_EXPECTED_SAVE_VERSION = 25;

export const UI_DENSITY_MAX_HUB_PRIMARY_CARDS = 4;
export const UI_DENSITY_MAX_HUB_SECONDARY_STRIPS = 3;
export const UI_DENSITY_MAX_REPORT_PRIMARY_SECTIONS = 4;
export const UI_DENSITY_MAX_MAP_BOTTOM_PANEL_LINES = 6;
export const UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1 = 3;
export const UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD = 5;
export const UI_DENSITY_MAX_OPERATIONAL_RESOURCE_CARDS_COMPACT = 2;
export const UI_DENSITY_MAX_JOURNAL_ENTRIES_HUB = 1;
export const UI_DENSITY_MAX_MAP_REACTIONS = 4;

export const UI_DENSITY_MIN_TOUCH_TARGET = 44;

export const UI_DENSITY_MONITORED_COMPONENTS = [
  'HubMainOperationFeelCard',
  'HubTomorrowRiskStrip',
  'HubCityJournalStrip',
  'HubOperationalResourcesCard',
  'EventResultImpactExplanationCard',
  'ReportTomorrowRiskCard',
  'MapDistrictReportCard',
  'MapOperationBottomPanel',
  'MapNeighborhoodStrip',
  'OperationalResourcesDetailSheet',
  'SocialPulseScreen',
  'PostPilotEventContextChip',
] as const;

export const UI_DENSITY_NON_GOALS = [
  'Yeni gameplay sistemi',
  'Yeni route',
  'Büyük UI redesign / tema overhaul',
  'SAVE_VERSION bump',
  'persist / applyDecision / dayPipeline değişikliği',
  'Full accessibility framework rewrite',
  'Tablet full layout pass',
] as const;

export const UI_DENSITY_DAY_MODE_LIMITS: Record<
  UiDensityDayMode,
  { maxHubPrimaryCards: number; maxHubSecondaryStrips: number; maxSocialMentions: number }
> = {
  day1: { maxHubPrimaryCards: 3, maxHubSecondaryStrips: 0, maxSocialMentions: UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1 },
  compact: { maxHubPrimaryCards: 3, maxHubSecondaryStrips: 2, maxSocialMentions: UI_DENSITY_MAX_SOCIAL_MENTIONS_DAY1 },
  standard: { maxHubPrimaryCards: 4, maxHubSecondaryStrips: 3, maxSocialMentions: UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD },
  post_pilot_opening: { maxHubPrimaryCards: 4, maxHubSecondaryStrips: 3, maxSocialMentions: UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD },
  post_pilot_compact: { maxHubPrimaryCards: 4, maxHubSecondaryStrips: 3, maxSocialMentions: UI_DENSITY_MAX_SOCIAL_MENTIONS_STANDARD },
};

export function resolveUiDensityDayMode(day: number, isPostPilot = false): UiDensityDayMode {
  if (day <= 1) return 'day1';
  if (day <= 3) return 'compact';
  if (day === 8 && isPostPilot) return 'post_pilot_opening';
  if (day >= 9 && isPostPilot) return 'post_pilot_compact';
  return 'standard';
}
