import { AUTHORITY_PERMISSION_BY_ID, AUTHORITY_RANK_BY_ID } from './authorityConstants';
import { calculateAuthorityProgress, getNextAuthorityRank } from './authorityEngine';
import { createInitialAuthorityState } from './authoritySeed';
import type {
  AuthorityDailyGainSnapshot,
  AuthorityEvaluationSnapshot,
  AuthorityPermissionId,
  AuthorityRankId,
  AuthorityState,
} from './authorityTypes';

export type PilotAuthorityCompletionPresentation = {
  authorityTitle: string;
  authoritySubtitle: string;
  authorityLines: string[];
};

export type OperationPreviewAuthoritySummary = {
  currentRankLabel: string;
  evaluationLabel: string;
  mainOperationRequirementLabel: string;
};

export function buildAuthorityRankLabel(rankId: AuthorityRankId): string {
  return AUTHORITY_RANK_BY_ID[rankId]?.label ?? 'Saha Koordinatörü';
}

export function buildAuthorityTrustLabel(trust: number): string {
  return `Yetki Güveni ${Math.max(0, Math.round(trust))}`;
}

export function buildAuthorityProgressLabel(authorityState: AuthorityState): string {
  const progress = calculateAuthorityProgress(authorityState);
  if (!progress.nextRank) {
    return `${progress.currentRank.label} — en üst değerlendirme seviyesindesin.`;
  }
  return `${progress.nextRank.label} değerlendirmesi için %${progress.progressToNextPercent} ilerleme.`;
}

export function buildAuthorityDailySummaryLines(
  gainSnapshot: AuthorityDailyGainSnapshot | undefined,
  authorityState: AuthorityState,
): string[] {
  if (!gainSnapshot) {
    return [];
  }

  const lines: string[] = [];

  if (gainSnapshot.netGain === 0) {
    lines.push('Yetki Güveni değişmedi.');
    lines.push('Üst yönetim bugünkü operasyon etkisini izlemeye aldı.');
  } else if (gainSnapshot.netGain > 0) {
    lines.push(`Yetki Güveni +${gainSnapshot.netGain}`);
    const topPositive = gainSnapshot.lines.find((line) => line.delta > 0);
    if (topPositive?.source === 'main_event_resolved') {
      lines.push('Operasyon kararların üst yönetim güvenini artırdı.');
    } else if (topPositive?.source === 'daily_goal_completed') {
      lines.push('Günlük hedef performansın üst yönetimde olumlu iz bıraktı.');
    } else if (topPositive?.source === 'butterfly_followup_managed') {
      lines.push('Karar yankısı yönetimi üst yönetim güvenini güçlendirdi.');
    } else {
      lines.push('Günlük operasyon etkin üst yönetim radarında.');
    }
  } else {
    lines.push(`Yetki Güveni ${gainSnapshot.netGain}`);
    lines.push('Zorlu gün üst yönetim güvenini zedeledi.');
  }

  lines.push(buildAuthorityProgressLabel(authorityState));

  if (gainSnapshot.newlyUnlockedPermissionIds.length > 0) {
    const unlockLines = buildAuthorityPermissionUnlockLines(
      gainSnapshot.newlyUnlockedPermissionIds,
    );
    lines.push(...unlockLines.slice(0, 1));
  }

  return lines.slice(0, 3);
}

export function buildAuthorityEvaluationLines(
  evaluation: AuthorityEvaluationSnapshot | undefined,
): string[] {
  if (!evaluation) {
    return [];
  }
  return evaluation.summaryLines.slice(0, 3);
}

export function buildAuthorityPermissionUnlockLines(
  permissionIds: AuthorityPermissionId[],
): string[] {
  return permissionIds.map((permissionId) => {
    const permission = AUTHORITY_PERMISSION_BY_ID[permissionId];
    return permission
      ? `Yeni yetki kaydı açıldı: ${permission.label}.`
      : 'Yeni yetki kaydı açıldı.';
  });
}

export function buildDay1AuthoritySummaryLines(): string[] {
  return [
    'Yetki Güveni sistemi aktif.',
    'Resmi unvanın günlük değişmez; gün sonunda güven puanı güncellenir.',
  ];
}

export function buildPilotAuthorityCompletionPresentation(
  evaluation: AuthorityEvaluationSnapshot | undefined,
  authorityState: AuthorityState,
): PilotAuthorityCompletionPresentation | null {
  if (!evaluation) {
    return null;
  }

  if (evaluation.promoted && evaluation.nextFormalRankId) {
    return {
      authorityTitle: 'Yeni Görevlendirme Açıldı',
      authoritySubtitle: buildAuthorityRankLabel(evaluation.nextFormalRankId),
      authorityLines: [
        'Pilot bölgedeki karar disiplinin daha geniş operasyon yetkisi getirdi.',
      ],
    };
  }

  if (evaluation.evaluationStatus === 'promotion_candidate') {
    const targetRankId =
      evaluation.pendingPromotionRankId ??
      getNextAuthorityRank(authorityState.formalRankId)?.id ??
      'operations_responsible';
    return {
      authorityTitle: 'Terfi Adaylığı Oluştu',
      authoritySubtitle: `${buildAuthorityRankLabel(targetRankId)} için değerlendirmeye alındın.`,
      authorityLines: [
        'Bir sonraki başarılı dönemde resmi görevlendirme açılabilir.',
      ],
    };
  }

  return {
    authorityTitle: 'Yetki Değerlendirmesi',
    authoritySubtitle: `${buildAuthorityRankLabel(authorityState.formalRankId)} görevin korunuyor.`,
    authorityLines: [
      evaluation.evaluationStatus === 'watching' ||
      evaluation.evaluationStatus === 'stable'
        ? 'Operasyon Sorumlusu değerlendirmesi için ilerleme devam ediyor.'
        : buildAuthorityProgressLabel(authorityState),
    ],
  };
}

export function buildOperationPreviewAuthoritySummary(
  authorityState: AuthorityState | undefined,
  day: number,
): OperationPreviewAuthoritySummary {
  const state = authorityState ?? createInitialAuthorityState(day);
  const evaluation = state.lastEvaluation;
  let evaluationLabel = 'Üst yönetim değerlendirmesi bekleniyor';

  if (evaluation?.promoted) {
    evaluationLabel = 'Yeni görevlendirme onaylandı';
  } else if (evaluation?.evaluationStatus === 'promotion_candidate') {
    evaluationLabel = 'Terfi adaylığı oluştu';
  } else if (evaluation?.evaluationStatus === 'watching') {
    evaluationLabel = 'Performans izleniyor';
  } else if (evaluation) {
    evaluationLabel = 'Değerlendirme tamamlandı';
  }

  return {
    currentRankLabel: buildAuthorityRankLabel(state.formalRankId),
    evaluationLabel,
    mainOperationRequirementLabel: `${buildAuthorityRankLabel('district_coordinator')} yetkisi gerekecek`,
  };
}
