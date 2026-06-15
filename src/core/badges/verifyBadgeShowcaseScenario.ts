import { SAVE_VERSION } from '@/store/gamePersist';
import { isCurrentSaveVersion } from '@/core/quality/saveVersionPolicy';

import { applyBadgeEvaluation, evaluateDailyBadges } from './badgeEngine';
import { createInitialBadgeState } from './badgeSeed';
import type { BadgeState } from './badgeTypes';
import {
  buildBadgeShowcaseCompactSummary,
  buildBadgeShowcaseItemForId,
  buildBadgeShowcaseSummary,
} from './badgeShowcaseModel';

export type VerifyBadgeShowcaseOutcome = {
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

function hasMeaningfulText(value: string | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 8;
}

function collectPresentationStrings(
  summary: ReturnType<typeof buildBadgeShowcaseSummary>,
): string[] {
  const values: string[] = [
    summary.headline,
    summary.subline,
    summary.prestigeLabel,
    summary.countLabel,
    summary.progressPercentLabel,
    summary.emptyState.title,
    summary.emptyState.body,
    summary.emptyState.ctaLabel,
  ];

  for (const item of summary.allItems) {
    values.push(
      item.title,
      item.description,
      item.detailTitle,
      item.detailBody,
      item.statePillLabel,
      item.categoryLabel,
      item.prestigeBandLabel,
      item.systemTag,
      item.styleSignal ?? '',
      item.unlockHint ?? '',
      item.earnedReason ?? '',
      item.progressLabel ?? '',
      item.ctaLabel ?? '',
    );
  }

  for (const block of summary.categories) {
    values.push(block.title, block.subtitle);
  }

  return values.filter((value) => value.length > 0);
}

export function verifyBadgeShowcaseScenario(): VerifyBadgeShowcaseOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      isCurrentSaveVersion(SAVE_VERSION),
      'SAVE_VERSION değişmedi (25)',
      `SAVE_VERSION beklenmeyen: ${SAVE_VERSION}`,
    ) && ok;

  const emptySummary = buildBadgeShowcaseSummary(createInitialBadgeState(1), 1);
  ok =
    assert(
      checks,
      emptySummary.totalCount === 12,
      'Showcase summary üretilebiliyor',
      'Showcase summary üretilemedi',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.earnedCount + emptySummary.inProgressCount + emptySummary.lockedCount ===
        emptySummary.totalCount,
      'earned + in_progress + locked = totalCount tutarlı',
      'State sayıları toplamı hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.completionRatio >= 0 && emptySummary.completionRatio <= 1,
      'completionRatio 0-1 arasında',
      'completionRatio aralık dışı',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.emptyState.visible === true,
      'Empty state güvenli (henüz rozet yok)',
      'Empty state hatalı',
    ) && ok;

  const progressState: BadgeState = {
    ...createInitialBadgeState(3),
    earnedBadgeIds: ['first_step'],
    recentlyEarnedBadgeIds: ['first_step'],
    badgeProgress: {
      ...createInitialBadgeState(3).badgeProgress,
      public_listener: {
        badgeId: 'public_listener',
        current: 2,
        target: 3,
        completed: false,
        updatedDay: 3,
      },
      steady_operator: {
        badgeId: 'steady_operator',
        current: 1,
        target: 3,
        completed: false,
        updatedDay: 3,
      },
    },
    history: [
      {
        badgeId: 'first_step',
        earnedDay: 1,
        source: 'daily_report',
      },
    ],
  };

  const progressSummary = buildBadgeShowcaseSummary(progressState, 3);
  const earnedItem = progressSummary.allItems.find((item) => item.id === 'first_step');
  const inProgressItem = progressSummary.allItems.find((item) => item.id === 'public_listener');
  const lockedItem = progressSummary.allItems.find((item) => item.id === 'crisis_cooler');

  ok =
    assert(
      checks,
      earnedItem?.state === 'earned' && inProgressItem?.state === 'in_progress',
      'earned / in_progress ayrımı doğru',
      'State ayrımı hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      lockedItem?.state === 'locked' && hasMeaningfulText(lockedItem.unlockHint),
      'Kilitli rozetlerde unlockHint dolu',
      'Locked unlockHint eksik',
    ) && ok;

  ok =
    assert(
      checks,
      hasMeaningfulText(earnedItem?.earnedReason) || hasMeaningfulText(earnedItem?.detailBody),
      'Kazanılmış rozetlerde earnedReason veya detailBody anlamlı',
      'Earned reason/detail eksik',
    ) && ok;

  ok =
    assert(
      checks,
      progressSummary.featuredBadges.length > 0,
      'En az bir featured badge seçiliyor',
      'Featured badge seçilmedi',
    ) && ok;

  ok =
    assert(
      checks,
      progressSummary.nearUnlockBadges.every((item) => item.state === 'in_progress'),
      'nearUnlockBadges yalnızca in_progress içinden geliyor',
      'nearUnlockBadges state filtresi hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      progressSummary.categories.every(
        (block) =>
          block.earnedCount <= block.totalCount &&
          block.previewItems.length <= block.items.length,
      ),
      'Kategori bloklarında toplamlar tutarlı',
      'Kategori blok toplamları hatalı',
    ) && ok;

  const presentationValues = collectPresentationStrings(progressSummary);
  const hasUndefinedLeak = presentationValues.some(
    (value) => value.includes('undefined') || value.includes('null'),
  );
  ok =
    assert(
      checks,
      !hasUndefinedLeak,
      'Presentation metinlerinde undefined/null görünmüyor',
      'Presentation metin sızıntısı var',
    ) && ok;

  const compact = buildBadgeShowcaseCompactSummary(progressState, 3);
  ok =
    assert(
      checks,
      compact.visible === true && compact.countLabel.includes('Rozetler:'),
      'Hub compact summary anlamlı veri ile görünür',
      'Hub compact summary hatalı',
    ) && ok;

  const dailyEval = evaluateDailyBadges({
    day: 1,
    badgeState: createInitialBadgeState(1),
    dailyOperationCompleted: true,
  });
  const earnedViaEngine = applyBadgeEvaluation(createInitialBadgeState(1), dailyEval, 1);
  const engineSummary = buildBadgeShowcaseSummary(earnedViaEngine, 1);
  ok =
    assert(
      checks,
      engineSummary.earnedCount >= 1,
      'Badge engine sonrası showcase uyumlu çalışır',
      'Engine entegrasyonu showcase ile uyumsuz',
    ) && ok;

  const item = buildBadgeShowcaseItemForId('steady_operator', progressState, 3);
  ok =
    assert(
      checks,
      item.state === 'in_progress' && item.progressLabel === '1/3',
      'Tekil item builder progress label üretir',
      'Tekil item builder hatalı',
    ) && ok;

  const undefinedSummary = buildBadgeShowcaseSummary(undefined, 1);
  ok =
    assert(
      checks,
      undefinedSummary.totalCount === 12 && undefinedSummary.earnedCount === 0,
      'Undefined badgeState fallback güvenli',
      'Undefined fallback hatalı',
    ) && ok;

  return { ok, checks };
}
