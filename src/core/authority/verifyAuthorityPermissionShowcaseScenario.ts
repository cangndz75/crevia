import { SAVE_VERSION } from '@/store/gamePersist';

import { createInitialAuthorityState } from './authoritySeed';
import type { AuthorityPermissionId } from './authorityTypes';
import {
  buildAuthorityPermissionPreviewCompactSummary,
  buildAuthorityPermissionPreviewItemForId,
  buildAuthorityPermissionPreviewSummary,
} from './authorityPermissionPreviewModel';

export type VerifyAuthorityPermissionShowcaseOutcome = {
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
  summary: ReturnType<typeof buildAuthorityPermissionPreviewSummary>,
): string[] {
  const values: string[] = [
    summary.currentRankTitle,
    summary.currentRankSubtitle,
    summary.headline,
    summary.subline,
    summary.prestigeLabel,
    summary.progressLabel,
    summary.progressPercentLabel,
    summary.activeCountLabel,
    summary.promotionHint ?? '',
    summary.emptyState.title,
    summary.emptyState.body,
    summary.nextRankTitle ?? '',
  ];

  for (const item of summary.allItems) {
    values.push(
      item.title,
      item.description,
      item.playerBenefit,
      item.detailTitle,
      item.detailBody,
      item.reasonLabel,
      item.statePillLabel,
      item.categoryLabel,
      item.systemTag,
      item.unlockRankTitle ?? '',
      item.ctaLabel ?? '',
    );
  }

  for (const block of summary.categoryBlocks) {
    values.push(block.title, block.subtitle);
  }

  return values.filter((value) => value.length > 0);
}

export function verifyAuthorityPermissionShowcaseScenario(): VerifyAuthorityPermissionShowcaseOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      SAVE_VERSION === 26,
      'SAVE_VERSION değişmedi (25)',
      `SAVE_VERSION beklenmeyen: ${SAVE_VERSION}`,
    ) && ok;

  const emptySummary = buildAuthorityPermissionPreviewSummary({
    authorityState: createInitialAuthorityState(1),
    day: 1,
  });
  ok =
    assert(
      checks,
      emptySummary.allItems.length > 0,
      'Authority permission preview summary üretilebiliyor',
      'Summary üretilemedi',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.progressRatio >= 0 && emptySummary.progressRatio <= 1,
      'progressRatio 0-1 arasında',
      'progressRatio aralık dışı',
    ) && ok;

  ok =
    assert(
      checks,
      hasMeaningfulText(emptySummary.currentRankTitle),
      'currentRankTitle boş değil',
      'currentRankTitle eksik',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.currentUnlocks.every((item) => item.state === 'active'),
      'currentUnlocks sadece active state içeriyor',
      'currentUnlocks state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.nextUnlocks.every((item) => item.state === 'next'),
      'nextUnlocks sadece next state içeriyor',
      'nextUnlocks state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      emptySummary.futureUnlocks.every((item) => item.state === 'locked'),
      'futureUnlocks sadece locked state içeriyor',
      'futureUnlocks state hatalı',
    ) && ok;

  const maxRankState = {
    ...createInitialAuthorityState(30),
    authorityTrust: 8000,
    formalRankId: 'department_director' as const,
    unlockedPermissionIds: [
      'basic_operations',
      'daily_preparation_authority',
      'field_priority_note',
      'promotion_review_eligible',
      'operations_responsible_scope',
      'district_expansion_preview',
      'unit_chief_scope',
    ] as AuthorityPermissionId[],
  };
  const maxSummary = buildAuthorityPermissionPreviewSummary({
    authorityState: maxRankState,
    day: 30,
  });
  ok =
    assert(
      checks,
      maxSummary.nextRankTitle == null || maxSummary.nextRankTitle.length > 0,
      'nextRank yoksa model güvenli fallback üretiyor',
      'Max rank fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      maxSummary.allItems.every(
        (item) =>
          hasMeaningfulText(item.title) &&
          hasMeaningfulText(item.description) &&
          hasMeaningfulText(item.playerBenefit) &&
          hasMeaningfulText(item.detailBody),
      ),
      'Her item title/description/playerBenefit/detailBody dolu',
      'Item metinleri eksik',
    ) && ok;

  const presentationValues = collectPresentationStrings(maxSummary);
  const hasLeak = presentationValues.some(
    (value) =>
      value.includes('undefined') ||
      value.includes('null') ||
      /field_observer|operations_assistant|rank_permission/i.test(value),
  );
  ok =
    assert(
      checks,
      !hasLeak,
      'raw enum veya undefined/null presentation metinlerinde görünmüyor',
      'Presentation metin sızıntısı var',
    ) && ok;

  ok =
    assert(
      checks,
      maxSummary.categoryBlocks.every(
        (block) =>
          block.activeCount <= block.totalCount &&
          block.previewItems.length <= block.items.length,
      ),
      'categoryBlocks toplamları tutarlı',
      'Kategori blok toplamları hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      maxSummary.futureUnlocks.every(
        (item) =>
          hasMeaningfulText(item.unlockRankTitle) || hasMeaningfulText(item.reasonLabel),
      ),
      "Locked item'larda unlockRankTitle veya anlamlı reasonLabel var",
      'Locked item ipucu eksik',
    ) && ok;

  const undefinedSummary = buildAuthorityPermissionPreviewSummary({
    authorityState: undefined,
    day: 2,
  });
  ok =
    assert(
      checks,
      undefinedSummary.currentRankTitle.length > 0,
      'Empty/missing authority state crash üretmiyor',
      'Missing state crash',
    ) && ok;

  const hubDay1 = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: createInitialAuthorityState(1),
    day: 1,
  });
  ok =
    assert(
      checks,
      hubDay1.visible === false,
      'Hub compact model day 1 gürültüsüz gizleniyor',
      'Hub day1 görünür kaldı',
    ) && ok;

  const hubMid = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: {
      ...createInitialAuthorityState(4),
      authorityTrust: 200,
      unlockedPermissionIds: ['basic_operations', 'daily_preparation_authority'],
    },
    day: 4,
  });
  ok =
    assert(
      checks,
      hubMid.visible === (hubMid.nextPermissionTitle != null),
      'Hub compact meaningful next unlock ile görünür',
      'Hub compact görünürlük hatalı',
    ) && ok;

  const profileCompact = buildAuthorityPermissionPreviewCompactSummary({
    authorityState: createInitialAuthorityState(3),
    day: 3,
  });
  ok =
    assert(
      checks,
      profileCompact.ctaLabel === 'İzinleri gör',
      'Profile compact card CTA güvenli',
      'Profile CTA hatalı',
    ) && ok;

  const item = buildAuthorityPermissionPreviewItemForId('district_trust_preview', {
    authorityState: createInitialAuthorityState(3),
    day: 3,
  });
  ok =
    assert(
      checks,
      item != null && item.state === 'next',
      'Tekil item builder rank matrix ile uyumlu',
      'Tekil item builder hatalı',
    ) && ok;

  return { ok, checks };
}
