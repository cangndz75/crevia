import { BADGE_DEFINITIONS } from '@/core/badges/badgeConstants';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import type { BadgeState } from '@/core/badges/badgeTypes';

import {
  buildProfileBadgeShowcaseItemForId,
  buildProfileBadgeShowcaseSummary,
} from './profileBadgeModel';

export type VerifyProfileBadgeOutcome = {
  ok: boolean;
  checks: string[];
};

function assert(
  checks: string[],
  ok: boolean,
  pass: string,
  fail: string,
): boolean {
  checks.push(ok ? `✓ ${pass}` : `✗ ${fail}`);
  return ok;
}

export function verifyProfileBadgeScenario(): VerifyProfileBadgeOutcome {
  const checks: string[] = [];
  let ok = true;

  const emptySummary = buildProfileBadgeShowcaseSummary(createInitialBadgeState(1));
  ok =
    assert(
      checks,
      emptySummary.earnedCount === 0 && emptySummary.totalCount === 12,
      'Empty badgeState ile earnedCount 0, totalCount 12 döner',
      'Empty badgeState sayıları hatalı',
    ) && ok;

  const duplicateState: BadgeState = {
    ...createInitialBadgeState(1),
    earnedBadgeIds: ['first_step', 'first_step'],
    recentlyEarnedBadgeIds: ['first_step'],
    badgeProgress: {
      ...createInitialBadgeState(1).badgeProgress,
      public_listener: {
        badgeId: 'public_listener',
        current: 2,
        target: 3,
        completed: false,
        updatedDay: 2,
      },
    },
  };
  const duplicateSummary = buildProfileBadgeShowcaseSummary(duplicateState, 2);
  ok =
    assert(
      checks,
      duplicateSummary.earnedCount === 1,
      'earnedBadgeIds duplicate ise unique count döner',
      'Duplicate earned count hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      duplicateSummary.latestBadge?.title === 'İlk Saha İmzası',
      'recentlyEarnedBadgeIds varsa latestBadge doğru seçilir',
      'latestBadge seçimi hatalı',
    ) && ok;

  const earnedItem = duplicateSummary.showcaseItems.find(
    (item) => item.id === 'first_step',
  );
  ok =
    assert(
      checks,
      earnedItem?.earned === true,
      'earned badge UI modelinde earned true döner',
      'earned badge earned flag hatalı',
    ) && ok;

  const progressItem = duplicateSummary.showcaseItems.find(
    (item) => item.id === 'public_listener',
  );
  ok =
    assert(
      checks,
      progressItem != null &&
        progressItem.earned === false &&
        progressItem.progressLabel === '2/3',
      'progress current > 0 olan kazanılmamış rozet showcaseItems içine alınabilir',
      'Progress rozet showcase hatalı',
    ) && ok;

  const lockedItem = duplicateSummary.showcaseItems.find(
    (item) => item.id === 'crisis_cooler',
  );
  ok =
    assert(
      checks,
      lockedItem != null &&
        lockedItem.earned === false &&
        lockedItem.progressLabel == null,
      'locked rozetler earned false ve progressLabel güvenli döner',
      'Locked rozet modeli hatalı',
    ) && ok;

  const unknownItem = buildProfileBadgeShowcaseItemForId(
    'unknown_badge_xyz',
    createInitialBadgeState(1),
  );
  ok =
    assert(
      checks,
      unknownItem.title === 'Bilinmeyen Rozet' && unknownItem.earned === false,
      'unknown badge id varsa crash olmaz',
      'Unknown badge id crash/fallback hatalı',
    ) && ok;

  const missingProgressState = {
    earnedBadgeIds: [],
    recentlyEarnedBadgeIds: [],
    history: [],
    lastEvaluatedDay: 0,
  };
  const missingProgressSummary = buildProfileBadgeShowcaseSummary(
    missingProgressState,
    3,
  );
  ok =
    assert(
      checks,
      missingProgressSummary.showcaseItems.length > 0 &&
        missingProgressSummary.showcaseItems.every((item) => item.title.length > 0),
      'badgeProgress eksikse fallback güvenli çalışır',
      'badgeProgress fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      duplicateSummary.completionPercent === Math.round((1 / 12) * 100),
      'completionPercent doğru hesaplanır',
      'completionPercent hatalı',
    ) && ok;

  const manyEarnedState: BadgeState = {
    ...createInitialBadgeState(7),
    earnedBadgeIds: BADGE_DEFINITIONS.map((badge) => badge.id),
    recentlyEarnedBadgeIds: ['pilot_finisher'],
  };
  const manySummary = buildProfileBadgeShowcaseSummary(manyEarnedState, 7);
  ok =
    assert(
      checks,
      manySummary.showcaseItems.length <= 6,
      'max 6 showcase item döner',
      'Showcase item limiti aşıldı',
    ) && ok;

  const undefinedSummary = buildProfileBadgeShowcaseSummary(undefined, 1);
  ok =
    assert(
      checks,
      undefinedSummary.totalCount === 12 && undefinedSummary.earnedCount === 0,
      'ProfileScreen badgeState undefined iken crash olmaz',
      'Undefined badgeState fallback hatalı',
    ) && ok;

  return { ok, checks };
}
