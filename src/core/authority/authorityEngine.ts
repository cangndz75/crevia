import {
  AUTHORITY_DAILY_GAIN_VALUES,
  AUTHORITY_DOMAIN_SCORE_DELTAS,
  AUTHORITY_PERMISSIONS,
  AUTHORITY_RANKS,
  AUTHORITY_RANK_BY_ID,
} from './authorityConstants';
import {
  clampDomainScore,
  clampTrust,
  createDefaultDomainScores,
} from './authoritySeed';
import type {
  AuthorityDailyGainLine,
  AuthorityDailyGainSnapshot,
  AuthorityEvaluationSnapshot,
  AuthorityPermissionId,
  AuthorityProgress,
  AuthorityRankDefinition,
  AuthorityRankId,
  AuthorityState,
  CalculateDailyAuthorityTrustGainInput,
  EvaluateAuthorityPromotionInput,
} from './authorityTypes';

function resolveUnlockedPermissions(
  trust: number,
  existing: AuthorityPermissionId[],
): AuthorityPermissionId[] {
  const seen = new Set<AuthorityPermissionId>(existing);
  const result = [...existing];

  for (const permission of AUTHORITY_PERMISSIONS) {
    if (trust >= permission.trustThreshold && !seen.has(permission.id)) {
      seen.add(permission.id);
      result.push(permission.id);
    }
  }

  return result;
}

function applyDomainScoreDeltas(
  domainScores: AuthorityState['domainScores'],
  deltas: Partial<AuthorityState['domainScores']>,
): AuthorityState['domainScores'] {
  const next = { ...domainScores };
  for (const [key, delta] of Object.entries(deltas)) {
    if (typeof delta !== 'number') continue;
    const domainKey = key as keyof AuthorityState['domainScores'];
    next[domainKey] = clampDomainScore(next[domainKey] + delta);
  }
  return next;
}

export function calculateAuthorityRankByTrust(
  authorityTrust: number,
): AuthorityRankDefinition {
  let matched = AUTHORITY_RANKS[0]!;
  for (const rank of AUTHORITY_RANKS) {
    if (authorityTrust >= rank.trustThreshold) {
      matched = rank;
    }
  }
  return matched;
}

export function getNextAuthorityRank(
  formalRankId: AuthorityRankId,
): AuthorityRankDefinition | undefined {
  const index = AUTHORITY_RANKS.findIndex((rank) => rank.id === formalRankId);
  if (index < 0 || index >= AUTHORITY_RANKS.length - 1) {
    return undefined;
  }
  return AUTHORITY_RANKS[index + 1];
}

export function calculateAuthorityProgress(
  authorityState: AuthorityState,
): AuthorityProgress {
  const currentRank =
    AUTHORITY_RANK_BY_ID[authorityState.formalRankId] ?? AUTHORITY_RANKS[0]!;
  const nextRank = getNextAuthorityRank(authorityState.formalRankId);

  if (!nextRank) {
    return {
      currentRank,
      nextRank: undefined,
      progressToNextPercent: 100,
      trustRemainingToNext: 0,
    };
  }

  const span = nextRank.trustThreshold - currentRank.trustThreshold;
  const gained = authorityState.authorityTrust - currentRank.trustThreshold;
  const progressToNextPercent =
    span <= 0 ? 100 : Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  const trustRemainingToNext = Math.max(
    0,
    nextRank.trustThreshold - authorityState.authorityTrust,
  );

  return {
    currentRank,
    nextRank,
    progressToNextPercent,
    trustRemainingToNext,
  };
}

export function calculateDailyAuthorityTrustGain(
  input: CalculateDailyAuthorityTrustGainInput,
  authorityState: AuthorityState,
): AuthorityDailyGainSnapshot {
  const trustBefore = authorityState.authorityTrust;
  const lines: AuthorityDailyGainLine[] = [];
  const domainScoreDeltas: Partial<AuthorityState['domainScores']> = {};

  const addLine = (line: AuthorityDailyGainLine) => {
    lines.push(line);
    const deltas = AUTHORITY_DOMAIN_SCORE_DELTAS[line.source];
    if (!deltas) return;
    for (const [key, delta] of Object.entries(deltas)) {
      if (typeof delta !== 'number') continue;
      const domainKey = key as keyof AuthorityState['domainScores'];
      domainScoreDeltas[domainKey] = (domainScoreDeltas[domainKey] ?? 0) + delta;
    }
  };

  if (input.mainEventResolved) {
    addLine({
      source: 'main_event_resolved',
      delta: AUTHORITY_DAILY_GAIN_VALUES.mainEventResolved,
      label: 'Ana olay çözüldü',
    });
  }

  const sideCount = Math.max(0, input.sideEventsResolvedCount ?? 0);
  if (sideCount > 0) {
    const sideGain = Math.min(
      sideCount * AUTHORITY_DAILY_GAIN_VALUES.sideEventResolvedEach,
      AUTHORITY_DAILY_GAIN_VALUES.sideEventResolvedDailyMax,
    );
    addLine({
      source: 'side_event_resolved',
      delta: sideGain,
      label: `${Math.min(sideCount, 2)} yan olay çözüldü`,
    });
  }

  const goalsCompleted = Math.max(0, input.dailyGoalsCompletedCount ?? 0);
  if (goalsCompleted > 0) {
    const goalGain = Math.min(
      goalsCompleted * AUTHORITY_DAILY_GAIN_VALUES.dailyGoalCompletedEach,
      AUTHORITY_DAILY_GAIN_VALUES.dailyGoalCompletedDailyMax,
    );
    addLine({
      source: 'daily_goal_completed',
      delta: goalGain,
      label: `${goalsCompleted} günlük hedef tamamlandı`,
    });
  }

  if (input.criticalRiskClosedWithoutGrowth) {
    addLine({
      source: 'critical_risk_closed',
      delta: AUTHORITY_DAILY_GAIN_VALUES.criticalRiskClosed,
      label: 'Kritik risk büyümeden kapandı',
    });
  }

  if (input.budgetNotSeriouslyDamaged) {
    addLine({
      source: 'budget_stable',
      delta: AUTHORITY_DAILY_GAIN_VALUES.budgetStable,
      label: 'Bütçe dengesi korundu',
    });
  }

  if (input.personnelMoraleMaintained) {
    addLine({
      source: 'personnel_morale_maintained',
      delta: AUTHORITY_DAILY_GAIN_VALUES.personnelMoraleMaintained,
      label: 'Personel morali korundu',
    });
  }

  if (input.socialPulseBalanced) {
    addLine({
      source: 'social_pulse_balanced',
      delta: AUTHORITY_DAILY_GAIN_VALUES.socialPulseBalanced,
      label: 'Sosyal nabız dengede kaldı',
    });
  }

  if (input.butterflyFollowUpWellManaged) {
    addLine({
      source: 'butterfly_followup_managed',
      delta: AUTHORITY_DAILY_GAIN_VALUES.butterflyFollowUpManaged,
      label: 'Karar yankısı iyi yönetildi',
    });
  }

  if (input.criticalEventUnresolved) {
    addLine({
      source: 'critical_event_unresolved',
      delta: AUTHORITY_DAILY_GAIN_VALUES.criticalEventUnresolved,
      label: 'Kritik olay çözülemedi',
    });
  }

  if (input.budgetSeverelyDropped) {
    addLine({
      source: 'budget_severe_drop',
      delta: AUTHORITY_DAILY_GAIN_VALUES.budgetSevereDrop,
      label: 'Bütçe sert düştü',
    });
  }

  if (input.personnelMoraleSeverelyDropped) {
    addLine({
      source: 'personnel_morale_severe_drop',
      delta: AUTHORITY_DAILY_GAIN_VALUES.personnelMoraleSevereDrop,
      label: 'Personel morali sert düştü',
    });
  }

  if (input.socialCrisisGrew) {
    addLine({
      source: 'social_crisis_grew',
      delta: AUTHORITY_DAILY_GAIN_VALUES.socialCrisisGrew,
      label: 'Sosyal kriz büyüdü',
    });
  }

  const rawNetGain = lines.reduce((sum, line) => sum + line.delta, 0);
  const trustAfter = clampTrust(trustBefore + rawNetGain);
  const netGain = trustAfter - trustBefore;

  const previousPermissions = new Set(authorityState.unlockedPermissionIds);
  const nextPermissions = resolveUnlockedPermissions(
    trustAfter,
    authorityState.unlockedPermissionIds,
  );
  const newlyUnlockedPermissionIds = nextPermissions.filter(
    (id) => !previousPermissions.has(id),
  );

  return {
    day: input.day,
    trustBefore,
    trustAfter,
    netGain,
    lines,
    domainScoreDeltas,
    newlyUnlockedPermissionIds,
  };
}

export function applyDailyAuthorityTrustGain(
  authorityState: AuthorityState,
  gainSnapshot: AuthorityDailyGainSnapshot,
  day: number,
): AuthorityState {
  const trustAfter = clampTrust(gainSnapshot.trustAfter);
  const nextPermissions = resolveUnlockedPermissions(
    trustAfter,
    authorityState.unlockedPermissionIds,
  );

  const historyEntry = {
    day,
    type: 'daily_gain' as const,
    trustDelta: gainSnapshot.netGain,
    trustAfter,
    formalRankId: authorityState.formalRankId,
    note:
      gainSnapshot.netGain === 0
        ? 'Yetki Güveni değişmedi'
        : `Yetki Güveni +${gainSnapshot.netGain}`,
  };

  const permissionHistoryEntries = gainSnapshot.newlyUnlockedPermissionIds.map(
    (permissionId) => ({
      day,
      type: 'permission_unlock' as const,
      trustAfter,
      formalRankId: authorityState.formalRankId,
      note: permissionId,
    }),
  );

  return {
    ...authorityState,
    authorityTrust: trustAfter,
    formalRankId: authorityState.formalRankId,
    unlockedPermissionIds: nextPermissions,
    domainScores: applyDomainScoreDeltas(
      authorityState.domainScores,
      gainSnapshot.domainScoreDeltas,
    ),
    history: [
      ...authorityState.history,
      historyEntry,
      ...permissionHistoryEntries,
    ],
    lastDailyGain: gainSnapshot,
    lastUpdatedDay: day,
  };
}

function meetsOperationsResponsiblePromotion(
  authorityTrust: number,
  pilotScore: number,
): boolean {
  return (
    (authorityTrust >= 450 && pilotScore >= 70) ||
    (authorityTrust >= 380 && pilotScore >= 85)
  );
}

export function evaluateAuthorityPromotion(
  input: EvaluateAuthorityPromotionInput,
): AuthorityEvaluationSnapshot {
  const { authorityState, pilotScore, day } = input;
  const nextRank = getNextAuthorityRank(authorityState.formalRankId);
  const trustAtEvaluation = authorityState.authorityTrust;
  const previousFormalRankId = authorityState.formalRankId;

  if (!nextRank) {
    return {
      day,
      pilotScore,
      trustAtEvaluation,
      previousFormalRankId,
      evaluationStatus: 'stable',
      promoted: false,
      summaryLines: ['Mevcut resmi unvan en üst seviyede.'],
    };
  }

  if (nextRank.id === 'operations_responsible') {
    const promoted = meetsOperationsResponsiblePromotion(
      trustAtEvaluation,
      pilotScore,
    );

    if (promoted) {
      return {
        day,
        pilotScore,
        trustAtEvaluation,
        previousFormalRankId,
        nextFormalRankId: nextRank.id,
        evaluationStatus: 'promoted',
        pendingPromotionRankId: undefined,
        promoted: true,
        summaryLines: [
          `${nextRank.label} değerlendirmesi olumlu tamamlandı.`,
          'Resmi unvan güncellenebilir.',
        ],
      };
    }

    if (trustAtEvaluation >= 350) {
      return {
        day,
        pilotScore,
        trustAtEvaluation,
        previousFormalRankId,
        nextFormalRankId: undefined,
        evaluationStatus: 'promotion_candidate',
        pendingPromotionRankId: 'operations_responsible',
        promoted: false,
        summaryLines: [
          `${nextRank.label} değerlendirmesi için adaylık oluştu.`,
          'Pilot skoru veya Yetki Güveni eşiği henüz tam sağlanmadı.',
        ],
      };
    }

    const evaluationStatus =
      trustAtEvaluation >= 200 ? 'watching' : 'stable';

    return {
      day,
      pilotScore,
      trustAtEvaluation,
      previousFormalRankId,
      evaluationStatus,
      promoted: false,
      summaryLines: [
        evaluationStatus === 'watching'
          ? 'Üst yönetim performansını izlemeye aldı.'
          : 'Resmi unvan değerlendirmesi stabil seyrediyor.',
      ],
    };
  }

  const promoted =
    trustAtEvaluation >= nextRank.trustThreshold && pilotScore >= 70;

  if (promoted) {
    return {
      day,
      pilotScore,
      trustAtEvaluation,
      previousFormalRankId,
      nextFormalRankId: nextRank.id,
      evaluationStatus: 'promoted',
      promoted: true,
      summaryLines: [`${nextRank.label} değerlendirmesi olumlu tamamlandı.`],
    };
  }

  if (trustAtEvaluation >= nextRank.trustThreshold * 0.75) {
    return {
      day,
      pilotScore,
      trustAtEvaluation,
      previousFormalRankId,
      evaluationStatus: 'promotion_candidate',
      pendingPromotionRankId: nextRank.id,
      promoted: false,
      summaryLines: [`${nextRank.label} için değerlendirme adaylığı oluştu.`],
    };
  }

  return {
    day,
    pilotScore,
    trustAtEvaluation,
    previousFormalRankId,
    evaluationStatus: 'watching',
    promoted: false,
    summaryLines: ['Resmi unvan değerlendirmesi devam ediyor.'],
  };
}

export function applyAuthorityEvaluation(
  authorityState: AuthorityState,
  evaluationSnapshot: AuthorityEvaluationSnapshot,
): AuthorityState {
  const nextFormalRankId =
    evaluationSnapshot.promoted && evaluationSnapshot.nextFormalRankId
      ? evaluationSnapshot.nextFormalRankId
      : authorityState.formalRankId;

  const historyEntry = {
    day: evaluationSnapshot.day,
    type: 'evaluation' as const,
    trustAfter: authorityState.authorityTrust,
    formalRankId: nextFormalRankId,
    note: evaluationSnapshot.promoted
      ? `Terfi: ${nextFormalRankId}`
      : evaluationSnapshot.evaluationStatus,
  };

  return {
    ...authorityState,
    formalRankId: nextFormalRankId,
    evaluationStatus: evaluationSnapshot.promoted
      ? 'promoted'
      : evaluationSnapshot.evaluationStatus,
    pendingPromotionRankId: evaluationSnapshot.promoted
      ? undefined
      : evaluationSnapshot.pendingPromotionRankId,
    lastEvaluation: evaluationSnapshot,
    history: [...authorityState.history, historyEntry],
    lastUpdatedDay: evaluationSnapshot.day,
  };
}

export { createDefaultDomainScores, resolveUnlockedPermissions };
