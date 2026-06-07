import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

export type ReportSecondaryCompactMode = 'day1' | 'standard' | 'post_pilot_compact';

export function resolveReportSecondaryCompactMode(day: number): ReportSecondaryCompactMode {
  if (day <= 1) return 'day1';
  if (day >= POST_PILOT_FIRST_OPERATION_DAY) return 'post_pilot_compact';
  return 'standard';
}

export function reportSecondaryLineMaxLines(mode: ReportSecondaryCompactMode): number {
  switch (mode) {
    case 'day1':
      return 2;
    case 'post_pilot_compact':
      return 1;
    default:
      return 2;
  }
}

export function shouldCollapseReportSecondarySections(mode: ReportSecondaryCompactMode): boolean {
  return mode === 'post_pilot_compact';
}

/** V1.1 full accordion — not in RC polish pack. */
export const REPORT_FULL_COLLAPSE_BACKLOG =
  'V1.1: full report section accordion for season details and multi-echo blocks.';
