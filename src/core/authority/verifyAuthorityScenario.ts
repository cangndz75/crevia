import { buildDailyReport } from '@/core/game/buildDailyReport';
import { normalizePersistedSave, SAVE_VERSION } from '@/store/gamePersist';
import { createDay1Seed } from '@/core/content/day1Seed';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialPersonnelState } from '@/core/personnel/personnelSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';
import { createInitialPlayerProgress } from '@/core/xp/levelProgress';

import {
  applyAuthorityEvaluation,
  applyDailyAuthorityTrustGain,
  calculateDailyAuthorityTrustGain,
  evaluateAuthorityPromotion,
} from './authorityEngine';
import {
  buildAuthorityDailySummaryLines,
  buildDay1AuthoritySummaryLines,
} from './authorityPresentation';
import {
  createInitialAuthorityState,
  normalizeAuthorityState,
  normalizePersistedAuthorityState,
} from './authoritySeed';
import type { AuthorityState } from './authorityTypes';

export type VerifyAuthorityOutcome = {
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

export function verifyAuthorityScenario(): VerifyAuthorityOutcome {
  const checks: string[] = [];
  let ok = true;

  const initial = createInitialAuthorityState(1);
  ok =
    assert(
      checks,
      initial.formalRankId === 'field_coordinator' && initial.authorityTrust === 0,
      'Initial state Saha Koordinatörü ve 0 trust',
      'Initial state hatalı',
    ) && ok;

  const gainInput = {
    day: 1,
    mainEventResolved: true,
    sideEventsResolvedCount: 2,
    dailyGoalsCompletedCount: 2,
    budgetNotSeriouslyDamaged: true,
    personnelMoraleMaintained: true,
    socialPulseBalanced: true,
  };
  const gainSnapshot = calculateDailyAuthorityTrustGain(gainInput, initial);
  ok =
    assert(
      checks,
      gainSnapshot.netGain > 0,
      'Günlük gain authorityTrust artırır',
      'Günlük gain artışı başarısız',
    ) && ok;

  const afterGain = applyDailyAuthorityTrustGain(initial, gainSnapshot, 1);
  ok =
    assert(
      checks,
      afterGain.formalRankId === 'field_coordinator',
      'Günlük gain formalRankId değiştirmez',
      'formalRankId günlük gain ile değişti',
    ) && ok;

  const negativeGainSnapshot = calculateDailyAuthorityTrustGain(
    {
      day: 2,
      criticalEventUnresolved: true,
      budgetSeverelyDropped: true,
      personnelMoraleSeverelyDropped: true,
      socialCrisisGrew: true,
    },
    { ...afterGain, authorityTrust: 10 },
  );
  const afterNegative = applyDailyAuthorityTrustGain(
    { ...afterGain, authorityTrust: 10 },
    negativeGainSnapshot,
    2,
  );
  ok =
    assert(
      checks,
      afterNegative.authorityTrust >= 0,
      'authorityTrust 0 altına düşmez',
      'authorityTrust negatif oldu',
    ) && ok;

  const highTrustState: AuthorityState = {
    ...afterGain,
    authorityTrust: 360,
    unlockedPermissionIds: ['basic_operations'],
  };
  const unlockGain = calculateDailyAuthorityTrustGain(
    { day: 3, mainEventResolved: true },
    highTrustState,
  );
  const afterUnlock = applyDailyAuthorityTrustGain(highTrustState, unlockGain, 3);
  ok =
    assert(
      checks,
      afterUnlock.unlockedPermissionIds.includes('promotion_review_eligible'),
      'Permission unlock threshold geçince eklenir',
      'Permission unlock başarısız',
    ) && ok;

  const duplicateState: AuthorityState = {
    ...afterUnlock,
    unlockedPermissionIds: [...afterUnlock.unlockedPermissionIds],
  };
  const duplicateGain = calculateDailyAuthorityTrustGain(
    { day: 4, mainEventResolved: true },
    duplicateState,
  );
  const afterDuplicate = applyDailyAuthorityTrustGain(
    duplicateState,
    duplicateGain,
    4,
  );
  const uniqueCount = new Set(afterDuplicate.unlockedPermissionIds).size;
  ok =
    assert(
      checks,
      uniqueCount === afterDuplicate.unlockedPermissionIds.length,
      'Aynı permission duplicate eklenmez',
      'Duplicate permission bulundu',
    ) && ok;

  const clampState: AuthorityState = {
    ...afterDuplicate,
    domainScores: {
      operations: 98,
      publicTrust: 99,
      resources: 97,
      personnel: 96,
      crisis: 95,
    },
  };
  const clampGain = calculateDailyAuthorityTrustGain(
    {
      day: 5,
      mainEventResolved: true,
      sideEventsResolvedCount: 2,
      dailyGoalsCompletedCount: 2,
      criticalRiskClosedWithoutGrowth: true,
      butterflyFollowUpWellManaged: true,
    },
    clampState,
  );
  const afterClamp = applyDailyAuthorityTrustGain(clampState, clampGain, 5);
  ok =
    assert(
      checks,
      Object.values(afterClamp.domainScores).every(
        (score) => score >= 0 && score <= 100,
      ),
      'domainScores 0-100 clamp edilir',
      'domainScores clamp hatası',
    ) && ok;

  const evalState: AuthorityState = {
    ...createInitialAuthorityState(7),
    authorityTrust: 400,
  };
  const evaluation = evaluateAuthorityPromotion({
    authorityState: evalState,
    pilotScore: 60,
    day: 7,
  });
  ok =
    assert(
      checks,
      !evaluation.promoted && evaluation.nextFormalRankId == null,
      'evaluateAuthorityPromotion şart sağlanmadan formalRank değiştirmez',
      'Evaluation formalRank değiştirdi',
    ) && ok;

  const promotedEvaluation = evaluateAuthorityPromotion({
    authorityState: { ...evalState, authorityTrust: 460 },
    pilotScore: 75,
    day: 7,
  });
  const afterEvaluation = applyAuthorityEvaluation(
    { ...evalState, authorityTrust: 460 },
    promotedEvaluation,
  );
  ok =
    assert(
      checks,
      promotedEvaluation.promoted &&
        afterEvaluation.formalRankId === 'operations_responsible',
      'applyAuthorityEvaluation şart sağlanırsa formalRankId günceller',
      'applyAuthorityEvaluation terfi başarısız',
    ) && ok;

  const bundle = createDay1Seed();
  const hydrated = normalizePersistedSave({
    saveVersion: 7,
    gameState: bundle.gameState,
    neighborhoods: bundle.neighborhoods,
    resources: bundle.resources,
    eventPool: bundle.eventPool,
    decisionHistory: [],
    snapshots: [],
    playerProgress: createInitialPlayerProgress(),
    updatedAt: new Date().toISOString(),
  });
  const normalizedAuthority = normalizePersistedAuthorityState(
    hydrated?.gameState.pilot.authorityState,
    1,
  );
  ok =
    assert(
      checks,
      hydrated != null &&
        hydrated.saveVersion === SAVE_VERSION &&
        normalizedAuthority.formalRankId === 'field_coordinator',
      `Persist normalize eksik state'i tamamlar (v${SAVE_VERSION})`,
      'Persist normalize başarısız',
    ) && ok;

  const report = buildDailyReport({
    day: 2,
    metrics: {
      publicSatisfaction: 55,
      staffMorale: 58,
      budget: 80_000,
    },
    decisionHistory: [],
    activeEvents: [],
    resolvedEventIds: [],
    snapshots: [],
    containerState: createInitialContainerState(2),
    vehicleState: createInitialVehicleState(2),
    personnelReport: null,
    socialPulseState: createInitialSocialPulseState(2),
  });
  const authorityState = applyDailyAuthorityTrustGain(
    createInitialAuthorityState(2),
    calculateDailyAuthorityTrustGain(
      { day: 2, mainEventResolved: true, dailyGoalsCompletedCount: 1 },
      createInitialAuthorityState(2),
    ),
    2,
  );
  const authoritySummaryLines = buildAuthorityDailySummaryLines(
    authorityState.lastDailyGain,
    authorityState,
  );
  ok =
    assert(
      checks,
      authorityState.lastDailyGain != null && authoritySummaryLines.length > 0,
      'DailyReport authorityDailyGain snapshot üretir',
      'DailyReport authority snapshot başarısız',
    ) && ok;

  const day1Lines = buildDay1AuthoritySummaryLines();
  ok =
    assert(
      checks,
      day1Lines.length >= 2 && day1Lines.every((line) => line.length > 0),
      'Day 1 tutorial raporunda authoritySummaryLines güvenli',
      'Day 1 authority summary hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      normalizeAuthorityState(null, 1).authorityTrust === 0,
      'normalizeAuthorityState fallback güvenli',
      'normalizeAuthorityState fallback hatalı',
    ) && ok;

  return { ok, checks };
}
