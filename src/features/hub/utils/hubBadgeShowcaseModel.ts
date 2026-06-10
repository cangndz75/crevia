import {
  buildBadgeShowcaseCompactSummary,
  buildBadgeShowcaseSummary,
} from '@/core/badges/badgeShowcaseModel';
import type { BadgeShowcaseCompactSummary } from '@/core/badges/badgeShowcaseTypes';

export type HubBadgeShowcaseSummary = BadgeShowcaseCompactSummary & {
  progressLabel: string;
};

export function buildHubBadgeShowcaseSummary(
  badgeStateInput: unknown,
  pilotDay: number = 1,
): HubBadgeShowcaseSummary {
  const compact = buildBadgeShowcaseCompactSummary(badgeStateInput, pilotDay);
  const full = buildBadgeShowcaseSummary(badgeStateInput, pilotDay);

  return {
    ...compact,
    progressLabel: full.countLabel,
  };
}
