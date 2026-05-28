import { buildDailyReport } from '@/core/game/buildDailyReport';
import type { DailyReport } from '@/core/models/DailyReport';
import { createInitialContainerState } from '@/core/containers/containerSeed';
import { createInitialSocialPulseState } from '@/core/social/socialSeed';
import { createInitialVehicleState } from '@/core/vehicles/vehicleSeed';

import {
  applyAuthorityEvaluation,
  applyDailyAuthorityTrustGain,
  calculateDailyAuthorityTrustGain,
  evaluateAuthorityPromotion,
} from './authorityEngine';
import {
  buildOperationPreviewAuthoritySummary,
  buildPilotAuthorityCompletionPresentation,
} from './authorityPresentation';
import {
  isPilotAuthorityEvaluationApplied,
  mergeAuthorityEvaluationIntoDailyReport,
  processPilotCompletionAuthority,
  resolvePilotAuthorityEvaluationScore,
} from './authorityPilotCompletion';
import { createInitialAuthorityState } from './authoritySeed';
import type { AuthorityState } from './authorityTypes';

export type VerifyAuthorityPilotCompletionOutcome = {
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

function baseState(trust: number): AuthorityState {
  return {
    ...createInitialAuthorityState(7),
    authorityTrust: trust,
    lastUpdatedDay: 7,
  };
}

export function verifyAuthorityPilotCompletionScenario(): VerifyAuthorityPilotCompletionOutcome {
  const checks: string[] = [];
  let ok = true;

  const initial = createInitialAuthorityState(1);
  const gainSnapshot = calculateDailyAuthorityTrustGain(
    { day: 1, mainEventResolved: true },
    initial,
  );
  const afterGain = applyDailyAuthorityTrustGain(initial, gainSnapshot, 1);
  ok =
    assert(
      checks,
      afterGain.formalRankId === 'field_coordinator',
      'Günlük gain formalRankId değiştirmiyor',
      'Günlük gain formalRankId değiştirdi',
    ) && ok;

  const promotedEvaluation = evaluateAuthorityPromotion({
    authorityState: baseState(460),
    pilotScore: 75,
    day: 7,
  });
  const promotedState = applyAuthorityEvaluation(
    baseState(460),
    promotedEvaluation,
  );
  ok =
    assert(
      checks,
      promotedState.formalRankId === 'operations_responsible',
      'Pilot final şart sağlanınca formalRankId güncelleniyor',
      'Pilot final terfi uygulanmadı',
    ) && ok;

  ok =
    assert(
      checks,
      evaluateAuthorityPromotion({
        authorityState: baseState(460),
        pilotScore: 75,
        day: 7,
      }).promoted,
      'authorityTrust >= 450 && pilotScore >= 70 terfi açar',
      '450/70 terfi kuralı başarısız',
    ) && ok;

  ok =
    assert(
      checks,
      evaluateAuthorityPromotion({
        authorityState: baseState(390),
        pilotScore: 88,
        day: 7,
      }).promoted,
      'authorityTrust >= 380 && pilotScore >= 85 terfi açar',
      '380/85 terfi kuralı başarısız',
    ) && ok;

  const candidateEvaluation = evaluateAuthorityPromotion({
    authorityState: baseState(360),
    pilotScore: 60,
    day: 7,
  });
  const candidateState = applyAuthorityEvaluation(
    baseState(360),
    candidateEvaluation,
  );
  ok =
    assert(
      checks,
      candidateEvaluation.evaluationStatus === 'promotion_candidate' &&
        candidateState.formalRankId === 'field_coordinator',
      '350+ trust düşük skorda promotion_candidate, formalRankId sabit',
      'promotion_candidate kuralı başarısız',
    ) && ok;

  const lowEvaluation = evaluateAuthorityPromotion({
    authorityState: baseState(120),
    pilotScore: 55,
    day: 7,
  });
  ok =
    assert(
      checks,
      lowEvaluation.evaluationStatus === 'stable' ||
        lowEvaluation.evaluationStatus === 'watching',
      'Düşük trust stable/watching kalıyor',
      'Düşük trust durumu hatalı',
    ) && ok;

  const firstRun = processPilotCompletionAuthority({
    authorityState: baseState(460),
    pilotScore: 75,
    pilotRunId: 'run-1',
    evaluationDay: 7,
  });
  const secondRun = processPilotCompletionAuthority({
    authorityState: firstRun.authorityState,
    pilotScore: 75,
    pilotRunId: 'run-1',
    evaluationDay: 7,
  });
  ok =
    assert(
      checks,
      secondRun.alreadyApplied &&
        firstRun.authorityState.history.filter((entry) => entry.type === 'evaluation')
          .length ===
          secondRun.authorityState.history.filter((entry) => entry.type === 'evaluation')
            .length,
      'completePilot iki kez çağrılırsa duplicate promotion/history oluşmuyor',
      'Idempotency başarısız',
    ) && ok;

  const day7Report: DailyReport = {
    day: 7,
    title: 'Gün 7 Tamamlandı',
    stats: [],
    rewardTitle: 'Pilot',
  };
  const mergedReport = mergeAuthorityEvaluationIntoDailyReport(
    day7Report,
    firstRun.evaluation,
    firstRun.evaluationLines,
  );
  ok =
    assert(
      checks,
      mergedReport?.authorityEvaluation?.day === 7 &&
        (mergedReport?.authorityEvaluationLines?.length ?? 0) > 0,
      'Day 7 report authorityEvaluation snapshot içeriyor',
      'Day 7 report snapshot başarısız',
    ) && ok;

  const previewSummary = buildOperationPreviewAuthoritySummary(undefined, 7);
  ok =
    assert(
      checks,
      previewSummary.currentRankLabel.length > 0 &&
        previewSummary.mainOperationRequirementLabel.includes('Bölge Koordinatörü'),
      'MainOperationPreview authorityState yokken crash etmiyor',
      'Preview fallback başarısız',
    ) && ok;

  const emptyPresentation = buildPilotAuthorityCompletionPresentation(undefined, initial);
  ok =
    assert(
      checks,
      emptyPresentation == null,
      'ReportPilotCompletionCard authorityEvaluation yokken güvenli render',
      'Boş authority presentation hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      resolvePilotAuthorityEvaluationScore({ finalResult: { score: 82 } as never }) === 82,
      'Pilot skoru finalResult önceliği',
      'Pilot skoru çözümlemesi hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      isPilotAuthorityEvaluationApplied(firstRun.authorityState, 7, 'run-1'),
      'Pilot evaluation applied kontrolü çalışıyor',
      'isPilotAuthorityEvaluationApplied hatalı',
    ) && ok;

  ok =
    assert(
      checks,
      buildDailyReport({
        day: 7,
        metrics: { publicSatisfaction: 55, staffMorale: 58, budget: 80_000 },
        decisionHistory: [],
        activeEvents: [],
        resolvedEventIds: [],
        snapshots: [],
        containerState: createInitialContainerState(7),
        vehicleState: createInitialVehicleState(7),
        socialPulseState: createInitialSocialPulseState(7),
      }).day === 7,
      'Daily report builder Day 7 uyumlu',
      'Daily report builder hatası',
    ) && ok;

  return { ok, checks };
}
