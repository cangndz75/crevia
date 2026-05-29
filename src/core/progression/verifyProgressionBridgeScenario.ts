import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityState } from '@/core/authority/authorityTypes';
import { createInitialBadgeState } from '@/core/badges/badgeSeed';
import {
  buildProgressionBridgePilotReportLines,
  buildProgressionBridgeSummary,
  progressionPresentationContainsBannedWords,
} from './progressionPresentation';

export type VerifyProgressionBridgeOutcome = {
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

function authorityStateWith(
  overrides: Partial<AuthorityState>,
  day = 7,
): AuthorityState {
  return {
    ...createInitialAuthorityState(day),
    ...overrides,
  };
}

function findPreview(
  summary: ReturnType<typeof buildProgressionBridgeSummary>,
  id: string,
) {
  return summary.previewItems.find((item) => item.id === id);
}

export function verifyProgressionBridgeScenario(): VerifyProgressionBridgeOutcome {
  const checks: string[] = [];
  let ok = true;

  const initialSummary = buildProgressionBridgeSummary({
    authorityState: createInitialAuthorityState(1),
    currentDay: 1,
  });
  const istasyonInitial = findPreview(initialSummary, 'neighborhood_istasyon');
  ok =
    assert(
      checks,
      istasyonInitial?.status === 'locked_preview',
      'Initial authority ile İstasyon locked_preview/önizleme döner',
      'Initial İstasyon preview hatalı',
    ) && ok;

  const trust350Summary = buildProgressionBridgeSummary({
    authorityState: authorityStateWith({ authorityTrust: 350 }),
    currentDay: 3,
  });
  ok =
    assert(
      checks,
      findPreview(trust350Summary, 'neighborhood_istasyon')?.status === 'near',
      'authorityTrust 350+ ise İstasyon near döner',
      '350 trust İstasyon near hatalı',
    ) && ok;

  const opsRankSummary = buildProgressionBridgeSummary({
    authorityState: authorityStateWith({
      authorityTrust: 460,
      formalRankId: 'operations_responsible',
    }),
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      findPreview(opsRankSummary, 'neighborhood_istasyon')?.status === 'completed',
      'formalRankId operations_responsible ise İstasyon completed döner',
      'operations_responsible İstasyon completed hatalı',
    ) && ok;

  const trust900Summary = buildProgressionBridgeSummary({
    authorityState: authorityStateWith({ authorityTrust: 900 }),
    currentDay: 5,
  });
  ok =
    assert(
      checks,
      findPreview(trust900Summary, 'neighborhood_yesilvadi')?.status === 'near',
      'authorityTrust 900+ ise Yeşilvadi near döner',
      '900 trust Yeşilvadi near hatalı',
    ) && ok;

  const unitChiefSummary = buildProgressionBridgeSummary({
    authorityState: authorityStateWith({
      authorityTrust: 1250,
      formalRankId: 'unit_chief',
    }),
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      findPreview(unitChiefSummary, 'neighborhood_yesilvadi')?.status ===
        'completed',
      'formalRankId unit_chief ise Yeşilvadi completed döner',
      'unit_chief Yeşilvadi completed hatalı',
    ) && ok;

  const districtSummary = buildProgressionBridgeSummary({
    authorityState: authorityStateWith({
      authorityTrust: 2600,
      formalRankId: 'district_coordinator',
    }),
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      findPreview(districtSummary, 'operation_scope_main')?.status === 'completed',
      'formalRankId district_coordinator ise Ana Operasyon completed döner',
      'district_coordinator Ana Operasyon completed hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      initialSummary.visible === true,
      'summary visible true döner',
      'Summary visible hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      initialSummary.previewItems.length <= 4 && initialSummary.previewItems.length > 0,
      'previewItems maksimum kontrollü sayıda döner',
      'previewItems sayısı hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProgressionBridgeSummary({ authorityState: undefined }).visible === true,
      'authorityState undefined crash olmaz',
      'Undefined authorityState crash',
    ) && ok;

  ok =
    assert(
      checks,
      buildProgressionBridgeSummary({ badgeState: undefined }).visible === true,
      'badgeState undefined crash olmaz',
      'Undefined badgeState crash',
    ) && ok;

  ok =
    assert(
      checks,
      !progressionPresentationContainsBannedWords(initialSummary),
      'presentation metinlerinde “kilitli”, “premium”, “satın al” geçmez',
      'Yasaklı presentation kelimesi bulundu',
    ) && ok;

  const mainPreviewSummary = buildProgressionBridgeSummary({
    authorityState: createInitialAuthorityState(7),
    badgeState: createInitialBadgeState(7),
    currentDay: 7,
    lastPilotScore: 72,
    selectedDistrictId: 'pilot-district',
  });
  const reportLines = buildProgressionBridgePilotReportLines({
    authorityState: authorityStateWith({ authorityTrust: 364 }),
    currentDay: 7,
  });
  ok =
    assert(
      checks,
      mainPreviewSummary.visible &&
        mainPreviewSummary.primaryPreview != null &&
        reportLines?.scopeLine.includes('Sıradaki kapsam:') === true,
      'MainOperationPreview render path güvenli kalır',
      'MainOperationPreview progression path hatalı',
    ) && ok;

  return { ok, checks };
}
