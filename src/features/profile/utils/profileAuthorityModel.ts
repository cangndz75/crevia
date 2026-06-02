import {
  AUTHORITY_PERMISSIONS,
  AUTHORITY_RANK_BY_ID,
} from '@/core/authority/authorityConstants';
import { calculateAuthorityProgress } from '@/core/authority/authorityEngine';
import {
  buildAuthorityRankLabel,
  buildAuthorityTrustLabel,
} from '@/core/authority/authorityPresentation';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import {
  buildNextPermissionChips,
  buildRankPermissionAxisLine,
  type RankPermissionUiItem,
} from '@/core/rankPermissions';
import type {
  AuthorityDomainKey,
  AuthorityEvaluationSnapshot,
  AuthorityState,
} from '@/core/authority/authorityTypes';

export type ProfileAuthorityEvaluationTone = 'positive' | 'neutral' | 'warning';

export type ProfileAuthoritySummary = {
  rankLabel: string;
  authorityTrustLabel: string;
  nextRankLabel: string;
  progressPercent: number;
  remainingTrustLabel: string;
  progressSubtitle: string;
  strongestDomainLabel: string;
  unlockedPermissionCountLabel: string;
  evaluationLabel: string;
  evaluationTone: ProfileAuthorityEvaluationTone;
  nextUnlockLine: string;
  nextPermissionChips: RankPermissionUiItem[];
};

const DOMAIN_LABELS: Record<AuthorityDomainKey, string> = {
  operations: 'Operasyon',
  publicTrust: 'Halk Güveni',
  resources: 'Kaynaklar',
  personnel: 'Personel',
  crisis: 'Kriz',
};

const DEFAULT_DAY = 1;

function resolveStrongestDomainLabel(
  domainScores: AuthorityState['domainScores'] | undefined,
): string {
  if (!domainScores || typeof domainScores !== 'object') {
    return 'Henüz ölçülmedi';
  }

  const entries = Object.entries(domainScores).filter(
    ([, value]) => typeof value === 'number' && Number.isFinite(value),
  ) as Array<[AuthorityDomainKey, number]>;

  if (entries.length === 0) {
    return 'Henüz ölçülmedi';
  }

  const allDefault =
    entries.every(([, value]) => value === 50) && entries.length === 5;
  if (allDefault) {
    return 'Henüz ölçülmedi';
  }

  const [strongestKey] = entries.reduce<[AuthorityDomainKey, number]>(
    (best, current) => (current[1] > best[1] ? current : best),
    entries[0]!,
  );

  return DOMAIN_LABELS[strongestKey] ?? 'Operasyon';
}

function countUniquePermissions(
  permissionIds: AuthorityState['unlockedPermissionIds'] | undefined,
): number {
  if (!Array.isArray(permissionIds)) {
    return 0;
  }
  return new Set(permissionIds).size;
}

function resolveEvaluationPresentation(
  evaluation: AuthorityEvaluationSnapshot | undefined,
): Pick<ProfileAuthoritySummary, 'evaluationLabel' | 'evaluationTone'> {
  if (!evaluation) {
    return {
      evaluationLabel: 'Pilot tamamlandığında resmi değerlendirme oluşacak.',
      evaluationTone: 'neutral',
    };
  }

  if (evaluation.promoted) {
    return {
      evaluationLabel: 'Yeni görevlendirme açıldı.',
      evaluationTone: 'positive',
    };
  }

  switch (evaluation.evaluationStatus) {
    case 'promotion_candidate':
      return {
        evaluationLabel: 'Terfi adaylığı oluştu.',
        evaluationTone: 'positive',
      };
    case 'watching':
      return {
        evaluationLabel: 'Üst yönetim izlemeye aldı.',
        evaluationTone: 'warning',
      };
    case 'stable':
      return {
        evaluationLabel: 'Görev yetkin korunuyor.',
        evaluationTone: 'neutral',
      };
    case 'promoted':
      return {
        evaluationLabel: 'Yeni görevlendirme açıldı.',
        evaluationTone: 'positive',
      };
    default:
      return {
        evaluationLabel: 'Görev yetkin korunuyor.',
        evaluationTone: 'neutral',
      };
  }
}

export function buildProfileAuthoritySummary(
  authorityStateInput: unknown,
  day: number = DEFAULT_DAY,
): ProfileAuthoritySummary {
  const authorityState = normalizeAuthorityState(
    authorityStateInput ?? createInitialAuthorityState(day),
    day,
  );
  const progress = calculateAuthorityProgress(authorityState);
  const totalPermissions = AUTHORITY_PERMISSIONS.length;
  const unlockedCount = countUniquePermissions(authorityState.unlockedPermissionIds);
  const evaluationPresentation = resolveEvaluationPresentation(
    authorityState.lastEvaluation,
  );
  const nextPermissionChips = buildNextPermissionChips({
    authorityState,
    currentTitle: authorityState.formalRankId,
    compact: true,
  });
  const nextUnlockLine = buildRankPermissionAxisLine({
    authorityState,
    currentTitle: authorityState.formalRankId,
    compact: true,
  });

  const rankLabel = buildAuthorityRankLabel(authorityState.formalRankId);
  const authorityTrustLabel = buildAuthorityTrustLabel(authorityState.authorityTrust);

  if (!progress.nextRank) {
    return {
      rankLabel,
      authorityTrustLabel,
      nextRankLabel: 'En üst görev seviyesi',
      progressPercent: 100,
      remainingTrustLabel: '0 güven kaldı',
      progressSubtitle: 'En üst resmi görev seviyesindesin.',
      strongestDomainLabel: resolveStrongestDomainLabel(authorityState.domainScores),
      unlockedPermissionCountLabel: `${unlockedCount} / ${totalPermissions} izin`,
      nextUnlockLine,
      nextPermissionChips,
      ...evaluationPresentation,
    };
  }

  const nextRankLabel = progress.nextRank.label;
  const remainingTrust = progress.trustRemainingToNext;
  const remainingTrustLabel = `${remainingTrust} güven kaldı`;
  const progressSubtitle = `${nextRankLabel} değerlendirmesi için ${remainingTrust} güven kaldı.`;

  return {
    rankLabel,
    authorityTrustLabel,
    nextRankLabel,
    progressPercent: progress.progressToNextPercent,
    remainingTrustLabel,
    progressSubtitle,
    strongestDomainLabel: resolveStrongestDomainLabel(authorityState.domainScores),
    unlockedPermissionCountLabel: `${unlockedCount} / ${totalPermissions} izin`,
    nextUnlockLine,
    nextPermissionChips,
    ...evaluationPresentation,
  };
}

export function buildProfileAuthoritySummaryFromPilot(
  pilotAuthorityState: unknown,
  pilotDay: number,
): ProfileAuthoritySummary {
  const safeDay = Math.max(1, pilotDay);
  return buildProfileAuthoritySummary(pilotAuthorityState, safeDay);
}

/** Verify helper — beklenen next rank label. */
export function getAuthorityRankLabel(rankId: keyof typeof AUTHORITY_RANK_BY_ID): string {
  return AUTHORITY_RANK_BY_ID[rankId]?.label ?? 'Saha Koordinatörü';
}
