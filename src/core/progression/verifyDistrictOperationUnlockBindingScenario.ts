import { SAVE_VERSION } from '@/store/gamePersist';
import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import { createFullMainOperationSeasonState } from '@/core/mainOperation/mainOperationState';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  buildDistrictOperationUnlockBindingCompactSummary,
  buildDistrictOperationUnlockBindingSummary,
  buildDistrictUnlockBindingItemForId,
} from './districtOperationUnlockBindingModel';

export type VerifyDistrictOperationUnlockBindingOutcome = {
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

function collectStrings(
  summary: ReturnType<typeof buildDistrictOperationUnlockBindingSummary>,
): string[] {
  const values: string[] = [
    summary.headline,
    summary.subline,
    summary.currentPhaseLabel,
    summary.currentAuthorityLabel,
    summary.emptyState.title,
    summary.emptyState.body,
    summary.recommendedNextStep?.title ?? '',
    summary.recommendedNextStep?.hint ?? '',
  ];

  for (const item of summary.allDistrictItems) {
    values.push(
      item.title,
      item.subtitle,
      item.unlockReason,
      item.unlockHint,
      item.playerBenefit,
      item.detailTitle,
      item.detailBody,
      item.trustLabel ?? '',
      item.pressureLabel ?? '',
      item.authorityRequirementLabel ?? '',
      item.operationRequirementLabel ?? '',
    );
  }

  for (const link of summary.mainOperationLinks) {
    values.push(link.title, link.subtitle, link.unlockReason, link.playerBenefit, link.detailBody);
  }

  for (const block of summary.categoryBlocks) {
    values.push(block.title, block.subtitle);
  }

  return values.filter((v) => v.length > 0);
}

export function verifyDistrictOperationUnlockBindingScenario(): VerifyDistrictOperationUnlockBindingOutcome {
  const checks: string[] = [];
  let ok = true;

  ok =
    assert(
      checks,
      SAVE_VERSION === 25,
      'SAVE_VERSION değişmedi (25)',
      `SAVE_VERSION beklenmeyen: ${SAVE_VERSION}`,
    ) && ok;

  const day1 = buildDistrictOperationUnlockBindingSummary({ currentDay: 1 });
  ok =
    assert(
      checks,
      day1.allDistrictItems.length === 5,
      'DistrictOperationUnlockBinding summary üretilebiliyor',
      'Summary üretilemedi',
    ) && ok;

  ok =
    assert(
      checks,
      day1.activeDistricts.every((item) => item.state === 'active'),
      'activeDistricts sadece active state içeriyor',
      'activeDistricts state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day1.nextDistricts.every((item) => item.state === 'next'),
      'nextDistricts sadece next state içeriyor',
      'nextDistricts state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day1.lockedDistricts.every((item) => item.state === 'locked'),
      'lockedDistricts sadece locked state içeriyor',
      'lockedDistricts state hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day1.allDistrictItems.every(
        (item) =>
          hasMeaningfulText(item.title) &&
          hasMeaningfulText(item.subtitle) &&
          hasMeaningfulText(item.unlockReason) &&
          hasMeaningfulText(item.unlockHint) &&
          hasMeaningfulText(item.playerBenefit) &&
          hasMeaningfulText(item.detailBody),
      ),
      'Her district item metin alanları dolu',
      'District item metinleri eksik',
    ) && ok;

  ok =
    assert(
      checks,
      day1.allDistrictItems.every((item) => item.relatedSystems.length > 0),
      'Related systems boşsa güvenli fallback var',
      'Related systems eksik',
    ) && ok;

  ok =
    assert(
      checks,
      hasMeaningfulText(day1.currentPhaseLabel) &&
        hasMeaningfulText(day1.currentAuthorityLabel),
      'currentPhaseLabel ve currentAuthorityLabel boş değil',
      'Phase/authority label eksik',
    ) && ok;

  ok =
    assert(
      checks,
      day1.mainOperationLinks.length > 0,
      'Main operation links güvenli üretiliyor',
      'Main operation links eksik',
    ) && ok;

  ok =
    assert(
      checks,
      day1.currentPhaseLabel.includes('Pilot'),
      'Day 1 pilot dönem fallback crash üretmiyor',
      'Day 1 fallback hatalı',
    ) && ok;

  const day10 = buildDistrictOperationUnlockBindingSummary({
    currentDay: 10,
    authorityState: createInitialAuthorityState(10),
    mainOperationSeason: createFullMainOperationSeasonState(POST_PILOT_FIRST_OPERATION_DAY),
  });
  ok =
    assert(
      checks,
      day10.mainOperationLinks.some((link) => link.id === 'main_op_open_ended'),
      'Day 8+ open-ended main operation link üretiyor',
      'Open-ended main operation link eksik',
    ) && ok;

  const missingAuthority = buildDistrictOperationUnlockBindingSummary({
    authorityState: undefined,
    currentDay: 2,
  });
  ok =
    assert(
      checks,
      hasMeaningfulText(missingAuthority.currentAuthorityLabel),
      'Authority eksikse empty state güvenli',
      'Missing authority crash',
    ) && ok;

  const noTrustInput = buildDistrictOperationUnlockBindingSummary({ currentDay: 3 });
  const trustLeak = noTrustInput.allDistrictItems.some(
    (item) => item.trustLabel === 'undefined' || item.trustLabel === 'null',
  );
  ok =
    assert(
      checks,
      !trustLeak,
      'District trust verisi eksikse trustLabel UI sızıntısı yok',
      'trustLabel sızıntısı',
    ) && ok;

  ok =
    assert(
      checks,
      day10.categoryBlocks.every(
        (block) =>
          block.activeCount <= block.totalCount &&
          block.previewItems.length <= block.items.length,
      ),
      'categoryBlocks activeCount/totalCount tutarlı',
      'Kategori blok toplamları hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      day10.lockedDistricts.every((item) => hasMeaningfulText(item.unlockHint)),
      "locked item'larda unlockHint boş değil",
      'Locked unlockHint eksik',
    ) && ok;

  ok =
    assert(
      checks,
      day10.nextDistricts.every(
        (item) =>
          hasMeaningfulText(item.unlockHint) && hasMeaningfulText(item.playerBenefit),
      ),
      "next item'larda unlockHint ve playerBenefit anlamlı",
      'Next item metinleri eksik',
    ) && ok;

  const presentationValues = collectStrings(day10);
  ok =
    assert(
      checks,
      !presentationValues.some((v) => v.includes('undefined') || v.includes('null')),
      'Presentation metinlerinde undefined/null görünmüyor',
      'Presentation sızıntısı',
    ) && ok;

  const hubDay1 = buildDistrictOperationUnlockBindingCompactSummary({ currentDay: 1 });
  ok =
    assert(
      checks,
      hubDay1.visible === false,
      'Hub compact meaningful next unlock yoksa gizlenebiliyor',
      'Hub day1 görünür kaldı',
    ) && ok;

  const hubMid = buildDistrictOperationUnlockBindingCompactSummary({ currentDay: 4 });
  ok =
    assert(
      checks,
      hubMid.ctaLabel === 'Açılımları gör',
      'Profile/compact CTA güvenli',
      'Compact CTA hatalı',
    ) && ok;

  const merkez = buildDistrictUnlockBindingItemForId('merkez', { currentDay: 2 });
  ok =
    assert(
      checks,
      merkez?.state === 'active',
      'Tekil district item builder çalışıyor',
      'Tekil item builder hatalı',
    ) && ok;

  return { ok, checks };
}
