import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityEvaluationSnapshot, AuthorityState } from '@/core/authority/authorityTypes';

import {
  buildHubAuthorityChipSummary,
  buildHubAuthorityChipSummaryFromPilot,
} from './hubAuthorityModel';

export type VerifyHubAuthorityOutcome = {
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

function evaluationSnapshot(
  status: AuthorityEvaluationSnapshot['evaluationStatus'],
  promoted = false,
): AuthorityEvaluationSnapshot {
  return {
    day: 7,
    pilotScore: 75,
    trustAtEvaluation: 360,
    previousFormalRankId: 'field_coordinator',
    evaluationStatus: status,
    promoted,
    summaryLines: [],
  };
}

export function verifyHubAuthorityScenario(): VerifyHubAuthorityOutcome {
  const checks: string[] = [];
  let ok = true;

  const initial = buildHubAuthorityChipSummary(createInitialAuthorityState(1));
  ok =
    assert(
      checks,
      initial.rankLabel === 'Saha Koordinatörü',
      'Initial state chip modeli Saha Koordinatörü döner',
      'Initial rank hatalı',
    ) && ok;

  const lowTrust = buildHubAuthorityChipSummary({
    ...createInitialAuthorityState(3),
    authorityTrust: 100,
  });
  const highTrust = buildHubAuthorityChipSummary({
    ...createInitialAuthorityState(3),
    authorityTrust: 300,
  });
  ok =
    assert(
      checks,
      highTrust.progressPercent > lowTrust.progressPercent,
      'authorityTrust arttıkça progressPercent doğru gelir',
      'Progress percent artışı hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummary({
        ...createInitialAuthorityState(7),
        authorityTrust: 360,
        lastEvaluation: evaluationSnapshot('promotion_candidate'),
      }).accentLine === 'Terfi adaylığı izleniyor',
      'promotion_candidate durumunda doğru kısa etiket',
      'promotion_candidate etiketi hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummary({
        ...createInitialAuthorityState(7),
        authorityTrust: 460,
        formalRankId: 'operations_responsible',
        lastEvaluation: evaluationSnapshot('promoted', true),
      }).accentLine === 'Yeni görevlendirme aktif',
      'promoted durumunda doğru kısa etiket',
      'promoted etiketi hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummary({
        ...createInitialAuthorityState(7),
        authorityTrust: 9000,
        formalRankId: 'department_director',
      }).progressLine === 'En üst görev seviyesi',
      'nextRank yoksa güvenli metin döner',
      'En üst seviye metni hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummary(undefined).rankLabel === 'Saha Koordinatörü',
      'authorityState undefined iken model crash olmaz',
      'Undefined fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildHubAuthorityChipSummaryFromPilot(undefined, 1).rankLabel.length > 0,
      'HubScreen render path authorityState olmadan güvenli kalır',
      'Pilot fallback hatalı',
    ) && ok;

  const trust364: AuthorityState = {
    ...createInitialAuthorityState(7),
    authorityTrust: 364,
  };
  const chip364 = buildHubAuthorityChipSummary(trust364, 7);
  ok =
    assert(
      checks,
      chip364.progressPercent === 81 &&
        chip364.progressLine.includes('Operasyon Sorumlusu'),
      '364 trust ile progress ve next rank doğru',
      '364 trust chip hesabı hatalı',
    ) && ok;

  return { ok, checks };
}
