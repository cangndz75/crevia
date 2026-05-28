import { createInitialAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityEvaluationSnapshot, AuthorityState } from '@/core/authority/authorityTypes';

import {
  buildProfileAuthoritySummary,
  getAuthorityRankLabel,
} from './profileAuthorityModel';

export type VerifyProfileAuthorityOutcome = {
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

export function verifyProfileAuthorityScenario(): VerifyProfileAuthorityOutcome {
  const checks: string[] = [];
  let ok = true;

  const initialSummary = buildProfileAuthoritySummary(createInitialAuthorityState(1));
  ok =
    assert(
      checks,
      initialSummary.rankLabel === 'Saha Koordinatörü',
      'Initial authorityState ile kart modeli Saha Koordinatörü döner',
      'Initial rank hatalı',
    ) && ok;

  const trust364State: AuthorityState = {
    ...createInitialAuthorityState(7),
    authorityTrust: 364,
    domainScores: {
      operations: 72,
      publicTrust: 55,
      resources: 48,
      personnel: 50,
      crisis: 44,
    },
  };
  const trust364Summary = buildProfileAuthoritySummary(trust364State, 7);
  ok =
    assert(
      checks,
      trust364Summary.nextRankLabel === 'Operasyon Sorumlusu' &&
        trust364Summary.remainingTrustLabel === '86 güven kaldı' &&
        trust364Summary.progressPercent === 81,
      '364 trust ile next rank ve kalan güven doğru',
      '364 trust hesabı hatalı',
    ) && ok;

  const topRankState: AuthorityState = {
    ...createInitialAuthorityState(7),
    authorityTrust: 8000,
    formalRankId: 'department_director',
  };
  const topSummary = buildProfileAuthoritySummary(topRankState, 7);
  ok =
    assert(
      checks,
      topSummary.nextRankLabel === 'En üst görev seviyesi',
      'nextRank yoksa güvenli metin döner',
      'En üst seviye metni hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary({ domainScores: null }, 1).strongestDomainLabel ===
        'Henüz ölçülmedi',
      'domainScores bozuk olsa crash olmaz',
      'domainScores fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary(createInitialAuthorityState(1)).evaluationLabel.includes(
        'Pilot tamamlandığında',
      ),
      'lastEvaluation yoksa doğru fallback metni',
      'Evaluation fallback hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary({
        ...createInitialAuthorityState(7),
        lastEvaluation: evaluationSnapshot('promoted', true),
      }).evaluationLabel === 'Yeni görevlendirme açıldı.',
      'promoted durumu doğru label',
      'promoted label hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary({
        ...createInitialAuthorityState(7),
        lastEvaluation: evaluationSnapshot('promotion_candidate'),
      }).evaluationLabel === 'Terfi adaylığı oluştu.',
      'promotion_candidate durumu doğru label',
      'promotion_candidate label hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary({
        ...createInitialAuthorityState(7),
        lastEvaluation: evaluationSnapshot('watching'),
      }).evaluationLabel === 'Üst yönetim izlemeye aldı.',
      'watching durumu doğru label',
      'watching label hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary({
        ...createInitialAuthorityState(7),
        lastEvaluation: evaluationSnapshot('stable'),
      }).evaluationLabel === 'Görev yetkin korunuyor.',
      'stable durumu doğru label',
      'stable label hatalı',
    ) && ok;

  const duplicatePermissionsState: AuthorityState = {
    ...createInitialAuthorityState(7),
    authorityTrust: 360,
    unlockedPermissionIds: [
      'basic_operations',
      'basic_operations',
      'daily_preparation_authority',
      'field_priority_note',
    ],
  };
  ok =
    assert(
      checks,
      buildProfileAuthoritySummary(duplicatePermissionsState).unlockedPermissionCountLabel ===
        '3 / 7 izin',
      'unlockedPermissionIds duplicate olsa unique count gösterilir',
      'Permission count hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildProfileAuthoritySummary(undefined).rankLabel === getAuthorityRankLabel('field_coordinator'),
      'ProfileScreen authorityState undefined iken crash olmaz',
      'Undefined authorityState fallback hatalı',
    ) && ok;

  return { ok, checks };
}
