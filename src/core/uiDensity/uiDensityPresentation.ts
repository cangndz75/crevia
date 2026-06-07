import {
  UI_DENSITY_DAY_MODE_LIMITS,
  resolveUiDensityDayMode,
} from './uiDensityConstants';
import type { UiDensityDayMode, UiDensityPresentationHints } from './uiDensityTypes';

export function buildUiDensityPresentationHints(args: {
  day: number;
  isPostPilot?: boolean;
  priority?: number;
  baseMaxLines?: number;
}): UiDensityPresentationHints {
  const mode = resolveUiDensityDayMode(args.day, args.isPostPilot);
  const limits = UI_DENSITY_DAY_MODE_LIMITS[mode];
  const compactMode = mode === 'day1' || mode === 'compact' || mode === 'post_pilot_compact';

  return {
    priority: args.priority ?? 50,
    compactMode,
    shouldCollapse: compactMode,
    maxVisibleLines: compactMode ? 1 : Math.min(args.baseMaxLines ?? 2, 3),
    densityTone: mode === 'day1' ? 'light' : mode === 'post_pilot_compact' ? 'dense' : 'normal',
  };
}

export function shouldSuppressSecondaryStrip(mode: UiDensityDayMode): boolean {
  return mode === 'day1';
}

export function formatUiDensityScreenLine(
  screenId: string,
  status: string,
  summary: string,
): string {
  return `${status} [${screenId}] ${summary}`;
}
