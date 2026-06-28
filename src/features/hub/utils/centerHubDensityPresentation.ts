import type { MaintenanceHubSignal } from '@/core/maintenanceBacklog';
import { lineDuplicatesAvoidLines, normalizePresentationText } from '@/core/presentationDedupe';
import type { HubPeriodGoalCardPresentation } from '@/core/periodGoals';
import type { CenterHomePresentation } from './centerHomePresentation';
import type { MiniCityFeedItem, MiniCityFeedPresentation } from './centerMiniCityFeedPresentation';

export type HubDisclosureBand = 'day1' | 'early' | 'mid' | 'openEnded';

export type HubSurfaceKey =
  | 'activeOperation'
  | 'dailyPriority'
  | 'advisor'
  | 'recentImpact'
  | 'cityAgenda'
  | 'miniCityFeed'
  | 'maintenanceSignal'
  | 'readinessSignal'
  | 'playerStyleInsight'
  | 'strategicPulse'
  | 'quickActions'
  | 'lowerDashboard';

export type HubCollapseMode = 'hidden' | 'compact' | 'chip' | 'full';

export type HubSurfacePriority = {
  key: HubSurfaceKey;
  visible: boolean;
  priority: number;
  reason: string;
  collapseMode: HubCollapseMode;
  dedupeKey: string;
};

export type HubDensityPresentation = {
  band: HubDisclosureBand;
  day: number;
  maxPrimarySections: number;
  maxFeedItems: number;
  visibleSurfaces: HubSurfacePriority[];
  surfaceByKey: Record<HubSurfaceKey, HubSurfacePriority>;
  hiddenReasonLabels: string[];
  maintenanceSignal: MaintenanceHubSignal | null;
  suppressFeedMaintenanceItem: boolean;
  suppressAdvisorDirective: boolean;
};

const MAX_PRIMARY_BY_BAND: Record<HubDisclosureBand, number> = {
  day1: 2,
  early: 3,
  mid: 3,
  openEnded: 3,
};

const MAX_FEED_ITEMS_BY_BAND: Record<HubDisclosureBand, number> = {
  day1: 1,
  early: 2,
  mid: 3,
  openEnded: 3,
};

const SURFACE_ORDER: HubSurfaceKey[] = [
  'activeOperation',
  'dailyPriority',
  'advisor',
  'recentImpact',
  'cityAgenda',
  'miniCityFeed',
  'maintenanceSignal',
  'readinessSignal',
  'playerStyleInsight',
  'strategicPulse',
  'quickActions',
  'lowerDashboard',
];

function normalizeLine(value: string | null | undefined): string {
  return normalizePresentationText(value);
}

function linesAreDuplicate(a: string | null | undefined, b: string | null | undefined): boolean {
  return lineDuplicatesAvoidLines(a, [b]);
}

export function deriveHubDisclosureBand(day: number): HubDisclosureBand {
  if (day <= 1) return 'day1';
  if (day <= 3) return 'early';
  if (day <= 7) return 'mid';
  return 'openEnded';
}

function isActiveOperationInProgress(
  presentation: Omit<CenterHomePresentation, 'hubDensity'>,
): boolean {
  const target = presentation.activeTarget;
  return (
    target.visibility === 'visible' &&
    target.status === 'in_progress' &&
    (target.progress?.progressRatio ?? 0) < 1
  );
}

function cityAgendaIsStrained(agenda: HubPeriodGoalCardPresentation): boolean {
  return (
    agenda.progressTone === 'critical' ||
    agenda.progressTone === 'warning' ||
    /risk|baskı|baski|strained|kritik/i.test(agenda.progressLabel)
  );
}

function isFallbackFeedOnly(feed: MiniCityFeedPresentation): boolean {
  if (feed.items.length === 0) return true;
  return feed.items.every(
    (item) => item.priority <= 0 || item.dedupeKey.startsWith('fallback:'),
  );
}

function scoreHubSurfacePriority(
  key: HubSurfaceKey,
  presentation: Omit<CenterHomePresentation, 'hubDensity'>,
  band: HubDisclosureBand,
  maintenanceSignal: MaintenanceHubSignal | null,
): HubSurfacePriority {
  const operationActive = isActiveOperationInProgress(presentation);
  const recentVisible =
    presentation.recentImpactSummary.visibility === 'visible' &&
    presentation.recentImpactSummary.chips.length > 0;
  const advisorVisible =
    presentation.advisorMiniDirective.visibility === 'visible' &&
    presentation.advisorMiniDirective.directive.trim().length > 0;
  const agenda = presentation.cityAgenda;
  const feed = presentation.miniCityFeed;
  const maintenanceCritical =
    maintenanceSignal?.tone === 'critical' || maintenanceSignal?.tone === 'warning';
  const maintenanceEmpty = !maintenanceSignal;
  const strainedAgenda = cityAgendaIsStrained(agenda);
  const calmFeed = isFallbackFeedOnly(feed);

  const base = (visible: boolean, priority: number, reason: string, collapseMode: HubCollapseMode, dedupeKey: string): HubSurfacePriority => ({
    key,
    visible,
    priority,
    reason,
    collapseMode: visible ? collapseMode : 'hidden',
    dedupeKey,
  });

  switch (key) {
    case 'activeOperation':
      return base(
        presentation.activeTarget.visibility !== 'hidden',
        100,
        'active operation anchor',
        'full',
        `active:${presentation.activeTarget.id}`,
      );

    case 'dailyPriority':
      return base(
        band === 'day1' || operationActive || presentation.nextActions.visibility === 'visible',
        operationActive ? 62 : band === 'day1' ? 88 : 74,
        operationActive ? 'operation started; daily priority secondary' : 'day focus',
        band === 'day1' ? 'full' : 'compact',
        'daily-priority',
      );

    case 'advisor':
      return base(
        advisorVisible || band !== 'day1',
        advisorVisible ? (strainedAgenda ? 84 : 78) : band === 'day1' ? 72 : 58,
        advisorVisible ? 'ece directive available' : 'advisor fallback',
        band === 'day1' ? 'compact' : advisorVisible ? 'full' : 'chip',
        `advisor:${normalizeLine(presentation.advisorMiniDirective.directive)}`,
      );

    case 'recentImpact':
      return base(
        recentVisible,
        recentVisible ? (band === 'day1' ? 70 : 76) : 0,
        recentVisible ? 'fresh impact trace' : 'no recent impact',
        recentVisible ? 'full' : 'hidden',
        `impact:${presentation.recentImpactSummary.id ?? 'none'}`,
      );

    case 'cityAgenda':
      if (band === 'day1') {
        return base(
          agenda.visibility === 'visible',
          strainedAgenda ? 48 : 24,
          'day1 agenda suppressed',
          strainedAgenda ? 'chip' : 'hidden',
          `agenda:${agenda.goalTitle}`,
        );
      }
      return base(
        agenda.visibility === 'visible',
        strainedAgenda ? 82 : band === 'early' ? 58 : 64,
        strainedAgenda ? 'period goal at risk' : 'city agenda steady',
        band === 'early' ? 'compact' : strainedAgenda ? 'full' : 'compact',
        `agenda:${agenda.goalTitle}`,
      );

    case 'miniCityFeed':
      if (band === 'day1') {
        return base(true, calmFeed ? 18 : 42, 'day1 calm feed', 'compact', 'mini-feed');
      }
      return base(
        feed.visibility === 'visible',
        calmFeed ? 34 : maintenanceCritical ? 68 : 56,
        calmFeed ? 'fallback feed low priority' : 'city flow signals',
        'compact',
        'mini-feed',
      );

    case 'maintenanceSignal':
      if (band === 'day1' || maintenanceEmpty) {
        return base(false, 0, maintenanceEmpty ? 'runtime empty' : 'day1 maintenance hidden', 'hidden', 'maintenance:none');
      }
      return base(
        true,
        maintenanceSignal.tone === 'critical' ? 86 : maintenanceSignal.tone === 'warning' ? 72 : 48,
        maintenanceCritical ? 'critical maintenance runtime' : 'maintenance attention',
        maintenanceCritical ? 'compact' : 'chip',
        maintenanceSignal.dedupeKey,
      );

    case 'readinessSignal':
      return base(
        band !== 'day1' && (strainedAgenda || maintenanceCritical),
        strainedAgenda ? 52 : 36,
        'readiness echo via agenda/maintenance',
        'chip',
        'readiness',
      );

    case 'playerStyleInsight':
      return base(
        band === 'mid' || band === 'openEnded',
        band === 'openEnded' ? 44 : 32,
        'player style deferred until mid game',
        band === 'openEnded' ? 'chip' : 'hidden',
        'player-style',
      );

    case 'strategicPulse':
      if (band === 'day1') {
        return base(false, 0, 'day1 strategic pulse hidden', 'hidden', 'strategic-pulse');
      }
      return base(
        true,
        band === 'openEnded' ? 66 : band === 'mid' ? 54 : 40,
        band === 'openEnded' ? 'open-ended strategic surfaces' : 'strategic pulse deferred',
        band === 'openEnded' ? 'full' : band === 'mid' ? 'compact' : 'chip',
        'strategic-pulse',
      );

    case 'quickActions':
      return base(
        presentation.quickCommands.visibility === 'visible' || presentation.nextActions.visibility === 'visible',
        band === 'day1' ? 64 : 50,
        'quick command rail',
        band === 'day1' ? 'compact' : 'compact',
        'quick-actions',
      );

    case 'lowerDashboard':
      return base(
        band === 'mid' || band === 'openEnded',
        band === 'openEnded' ? 46 : 38,
        'lower dashboard surfaces',
        band === 'openEnded' ? 'compact' : 'hidden',
        'lower-dashboard',
      );

    default:
      return base(false, 0, 'unknown surface', 'hidden', key);
  }
}

function applyAboveTheFoldGuard(
  surfaces: HubSurfacePriority[],
  maxPrimarySections: number,
): HubSurfacePriority[] {
  const isPrimary = (mode: HubCollapseMode) => mode === 'full' || mode === 'compact';
  let primaryCount = 0;

  return surfaces.map((surface) => {
    if (!surface.visible || surface.collapseMode === 'hidden') return surface;
    if (surface.key === 'activeOperation') return surface;

    if (!isPrimary(surface.collapseMode)) return surface;

    primaryCount += 1;
    if (primaryCount < maxPrimarySections) return surface;

    return {
      ...surface,
      collapseMode: 'chip' as const,
      reason: `${surface.reason}; density guard demoted`,
      priority: Math.max(0, surface.priority - 12),
    };
  });
}

export function dedupeHubSurfaceMessages(
  presentation: Omit<CenterHomePresentation, 'hubDensity'>,
  surfaces: HubSurfacePriority[],
  maintenanceSignal: MaintenanceHubSignal | null,
): {
  surfaces: HubSurfacePriority[];
  suppressFeedMaintenanceItem: boolean;
  suppressAdvisorDirective: boolean;
} {
  const byKey = Object.fromEntries(surfaces.map((surface) => [surface.key, surface])) as Record<
    HubSurfaceKey,
    HubSurfacePriority
  >;

  const maintenanceVisible =
    byKey.maintenanceSignal.visible && byKey.maintenanceSignal.collapseMode !== 'hidden';
  const suppressFeedMaintenanceItem = maintenanceVisible;

  const advisorLine = presentation.advisorMiniDirective.directive;
  const duplicateAdvisor = [
    presentation.activeTarget.title,
    presentation.activeTarget.description,
    presentation.recommendedPlan.body,
    presentation.cityAgenda.summary,
    maintenanceSignal?.subtitle,
    presentation.recentImpactSummary.compactSummary,
  ].some((line) => linesAreDuplicate(advisorLine, line));

  let suppressAdvisorDirective = duplicateAdvisor;
  let nextSurfaces = surfaces;

  if (duplicateAdvisor) {
    nextSurfaces = nextSurfaces.map((surface) =>
      surface.key === 'advisor'
        ? {
            ...surface,
            visible: false,
            collapseMode: 'hidden' as const,
            reason: 'advisor duplicates hero copy',
          }
        : surface,
    );
    suppressAdvisorDirective = true;
  }

  if (
    maintenanceVisible &&
    /strengthen_readiness|hazırlık|hazirlik/i.test(presentation.cityAgenda.goalTitle + presentation.cityAgenda.summary)
  ) {
    nextSurfaces = nextSurfaces.map((surface) => {
      if (surface.key === 'maintenanceSignal') {
        return {
          ...surface,
          collapseMode: 'chip' as const,
          reason: 'maintenance compacted; agenda already covers readiness',
        };
      }
      if (surface.key === 'cityAgenda' && surface.collapseMode === 'full') {
        return { ...surface, collapseMode: 'compact' as const };
      }
      return surface;
    });
  }

  if (presentation.recentImpactSummary.visibility === 'visible') {
    nextSurfaces = nextSurfaces.map((surface) =>
      surface.key === 'miniCityFeed' && isFallbackFeedOnly(presentation.miniCityFeed)
        ? {
            ...surface,
            collapseMode: 'chip' as const,
            priority: Math.min(surface.priority, 28),
            reason: 'feed calm while recent impact visible',
          }
        : surface,
    );
  }

  return { surfaces: nextSurfaces, suppressFeedMaintenanceItem, suppressAdvisorDirective };
}

export function selectHubVisibleSurfaces(
  scored: HubSurfacePriority[],
  maxPrimarySections: number,
): HubSurfacePriority[] {
  const sorted = [...scored].sort((left, right) => right.priority - left.priority || SURFACE_ORDER.indexOf(left.key) - SURFACE_ORDER.indexOf(right.key));
  return applyAboveTheFoldGuard(sorted, maxPrimarySections);
}

function buildSurfaceMap(surfaces: HubSurfacePriority[]): Record<HubSurfaceKey, HubSurfacePriority> {
  const map = {} as Record<HubSurfaceKey, HubSurfacePriority>;
  for (const key of SURFACE_ORDER) {
    map[key] = surfaces.find((surface) => surface.key === key) ?? {
      key,
      visible: false,
      priority: 0,
      reason: 'missing',
      collapseMode: 'hidden',
      dedupeKey: key,
    };
  }
  return map;
}

export type BuildHubDensityPresentationInput = {
  presentation: Omit<CenterHomePresentation, 'hubDensity'>;
  day: number;
  maintenanceHubSignal?: MaintenanceHubSignal | null;
};

export function buildHubDensityPresentation(
  input: BuildHubDensityPresentationInput,
): HubDensityPresentation {
  const day = Math.max(1, input.day);
  const band = deriveHubDisclosureBand(day);
  const maintenanceSignal = input.maintenanceHubSignal ?? null;

  const scored = SURFACE_ORDER.map((key) =>
    scoreHubSurfacePriority(key, input.presentation, band, maintenanceSignal),
  );
  const deduped = dedupeHubSurfaceMessages(input.presentation, scored, maintenanceSignal);
  const visibleSurfaces = selectHubVisibleSurfaces(
    deduped.surfaces,
    MAX_PRIMARY_BY_BAND[band],
  );
  const surfaceByKey = buildSurfaceMap(visibleSurfaces);

  const hiddenReasonLabels = visibleSurfaces
    .filter((surface) => !surface.visible || surface.collapseMode === 'hidden')
    .map((surface) => `${surface.key}: ${surface.reason}`);

  return {
    band,
    day,
    maxPrimarySections: MAX_PRIMARY_BY_BAND[band],
    maxFeedItems: MAX_FEED_ITEMS_BY_BAND[band],
    visibleSurfaces: visibleSurfaces.filter((surface) => surface.visible && surface.collapseMode !== 'hidden'),
    surfaceByKey,
    hiddenReasonLabels,
    maintenanceSignal,
    suppressFeedMaintenanceItem: deduped.suppressFeedMaintenanceItem,
    suppressAdvisorDirective: deduped.suppressAdvisorDirective,
  };
}

function filterFeedItems(
  feed: MiniCityFeedPresentation,
  density: HubDensityPresentation,
): MiniCityFeedItem[] {
  let items = [...feed.items];

  if (density.suppressFeedMaintenanceItem) {
    items = items.filter(
      (item) =>
        item.sourceLabel !== 'Hazırlık Sinyali' &&
        !item.dedupeKey.startsWith('maintenance:') &&
        !/hazırlık|hazirlik/i.test(item.title),
    );
  }

  const excludeLines = [
    density.maintenanceSignal?.title,
    density.maintenanceSignal?.subtitle,
    feed.title,
  ].filter((line): line is string => Boolean(line?.trim()));

  items = items.filter(
    (item) =>
      !excludeLines.some(
        (line) =>
          linesAreDuplicate(item.title, line) ||
          linesAreDuplicate(item.subtitle, line),
      ),
  );

  return items.slice(0, density.maxFeedItems);
}

export function applyHubDensityToPresentation(
  presentation: CenterHomePresentation,
  density: HubDensityPresentation,
): CenterHomePresentation {
  const feedItems = filterFeedItems(presentation.miniCityFeed, density);
  const miniCityFeed: MiniCityFeedPresentation = {
    ...presentation.miniCityFeed,
    items:
      feedItems.length > 0
        ? feedItems
        : hubSurfaceIsRenderable(density, 'miniCityFeed') && presentation.miniCityFeed.emptyFallback
          ? [presentation.miniCityFeed.emptyFallback]
          : feedItems,
    statusPill:
      feedItems.length > 0 && feedItems[0].priority > 0
        ? `${feedItems.length} sinyal`
        : presentation.miniCityFeed.statusPill,
  };

  const advisorMiniDirective =
    density.suppressAdvisorDirective
      ? {
          ...presentation.advisorMiniDirective,
          visibility: 'hidden' as const,
          directive: '',
        }
      : presentation.advisorMiniDirective;

  const cityAgenda: HubPeriodGoalCardPresentation = {
    ...presentation.cityAgenda,
    eceHint: density.suppressAdvisorDirective ? undefined : presentation.cityAgenda.eceHint,
  };

  return {
    ...presentation,
    miniCityFeed,
    cityAgenda,
    advisorMiniDirective,
    hubDensity: density,
    hubGameplay: {
      ...presentation.hubGameplay,
      miniCityFeed,
      cityAgenda,
      advisorMiniDirective,
      maintenanceHubSignal: density.maintenanceSignal,
    },
  };
}

export function countHubPrimarySections(density: HubDensityPresentation): number {
  return density.visibleSurfaces.filter(
    (surface) => surface.collapseMode === 'full' || surface.collapseMode === 'compact',
  ).length;
}

export function hubSurfaceIsRenderable(
  density: HubDensityPresentation | undefined,
  key: HubSurfaceKey,
): boolean {
  const surface = density?.surfaceByKey[key];
  return Boolean(surface?.visible && surface.collapseMode !== 'hidden');
}

export function hubSurfaceCollapseMode(
  density: HubDensityPresentation | undefined,
  key: HubSurfaceKey,
): HubCollapseMode {
  return density?.surfaceByKey[key]?.collapseMode ?? 'full';
}
