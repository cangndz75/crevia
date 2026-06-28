import type { HubDisclosureBand } from './centerHubDensityPresentation';

export type HubLayoutZone = 'firstViewport' | 'scrollDepth';

export type HubThemeTone = 'lightPremium';

export type HubLayoutSectionKey =
  | 'header'
  | 'resourcePills'
  | 'todayFocusHero'
  | 'activeOperationFocus'
  | 'compactPulseAdvisor'
  | 'progressImpact'
  | 'nextMoves'
  | 'miniCityFeed'
  | 'districtSpotlight'
  | 'progression'
  | 'cityAgenda'
  | 'maintenanceSignal'
  | 'strategicPulse'
  | 'liveDevelopments'
  | 'unlockPreview'
  | 'quickActions';

export const HUB_LIGHT_PREMIUM_THEME = {
  themeTone: 'lightPremium' as const,
  appBackground: '#F8F1E4',
  cardSurface: '#FFFCF5',
  cardSurfaceMint: '#EAF5EE',
  cardSurfaceWarm: '#FFF6E6',
  ctaTeal: '#07564F',
  accentGold: '#D8A72E',
  textPrimary: '#173D3A',
  heroGradientStart: '#0A4F48',
  heroGradientEnd: '#043A36',
} as const;

export const HUB_DENSITY_LIMITS = {
  firstViewportPrimaryCtaMax: 1,
  firstViewportPrimaryCardFeelMax: 1,
  quickActionsMax: 2,
  quickActionsOverflowLabel: 'Daha fazla',
  feedItemsMax: 2,
  feedItemsDay1Max: 1,
  cityPulseSignalsMax: 2,
  cityPulseSignalsDay1Max: 1,
  eceRecommendationMaxChars: 120,
  eceRecommendationDay1MaxChars: 88,
  eceRecommendationMaxLines: 2,
  eceReasonChipsMax: 1,
  impactChipsMax: 2,
  impactChipsDay1Max: 1,
  nextMovesMax: 2,
  nextMovesDay1Max: 2,
  compactPulseSignalsMax: 2,
} as const;

const FIRST_VIEWPORT_SECTIONS: readonly HubLayoutSectionKey[] = [
  'header',
  'resourcePills',
  'todayFocusHero',
  'compactPulseAdvisor',
];

const SCROLL_DEPTH_SECTIONS: readonly HubLayoutSectionKey[] = [
  'nextMoves',
  'quickActions',
  'progression',
  'districtSpotlight',
  'progressImpact',
  'miniCityFeed',
  'cityAgenda',
  'maintenanceSignal',
  'strategicPulse',
  'liveDevelopments',
  'unlockPreview',
];

export function hubSectionLayoutZone(section: HubLayoutSectionKey): HubLayoutZone {
  if (FIRST_VIEWPORT_SECTIONS.includes(section)) return 'firstViewport';
  return 'scrollDepth';
}

export function hubLayoutSectionsForZone(zone: HubLayoutZone): readonly HubLayoutSectionKey[] {
  return zone === 'firstViewport' ? FIRST_VIEWPORT_SECTIONS : SCROLL_DEPTH_SECTIONS;
}

export function resolveHubFeedItemCap(band: HubDisclosureBand): number {
  if (band === 'day1') return HUB_DENSITY_LIMITS.feedItemsDay1Max;
  return HUB_DENSITY_LIMITS.feedItemsMax;
}

export function resolveHubCityPulseSignalCap(band: HubDisclosureBand): number {
  if (band === 'day1') return HUB_DENSITY_LIMITS.cityPulseSignalsDay1Max;
  return HUB_DENSITY_LIMITS.cityPulseSignalsMax;
}

export function resolveHubImpactChipCap(band: HubDisclosureBand): number {
  if (band === 'day1') return HUB_DENSITY_LIMITS.impactChipsDay1Max;
  return HUB_DENSITY_LIMITS.impactChipsMax;
}

export function resolveHubNextMovesCap(band: HubDisclosureBand): number {
  if (band === 'day1') return HUB_DENSITY_LIMITS.nextMovesDay1Max;
  return HUB_DENSITY_LIMITS.nextMovesMax;
}

export function resolveHubQuickActionsCap(_band: HubDisclosureBand): number {
  return HUB_DENSITY_LIMITS.quickActionsMax;
}

export function resolveHubEceCharCap(band: HubDisclosureBand): number {
  if (band === 'day1') return HUB_DENSITY_LIMITS.eceRecommendationDay1MaxChars;
  return HUB_DENSITY_LIMITS.eceRecommendationMaxChars;
}

export function hubBandAllowsStrategicPulse(band: HubDisclosureBand): boolean {
  return band === 'openEnded';
}

export function hubBandAllowsDistrictSpotlight(band: HubDisclosureBand): boolean {
  return band !== 'day1';
}

export function hubBandAllowsLiveDevelopments(band: HubDisclosureBand): boolean {
  return band === 'mid' || band === 'openEnded';
}

export function hubSectionIsHidden(
  hiddenSections: readonly HubLayoutSectionKey[],
  section: HubLayoutSectionKey,
): boolean {
  return hiddenSections.includes(section);
}
