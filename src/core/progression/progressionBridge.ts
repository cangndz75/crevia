import { AUTHORITY_RANK_BY_ID, AUTHORITY_RANKS } from '@/core/authority/authorityConstants';
import { createInitialAuthorityState, normalizeAuthorityState } from '@/core/authority/authoritySeed';
import type { AuthorityRankId, AuthorityState } from '@/core/authority/authorityTypes';
import { createInitialBadgeState, normalizeBadgeState } from '@/core/badges/badgeSeed';
import type { BadgeState } from '@/core/badges/badgeTypes';

import type {
  BuildProgressionBridgeSummaryInput,
  ProgressionUnlockPreview,
  ProgressionUnlockPreviewStatus,
  ProgressionUnlockPreviewType,
} from './progressionTypes';

type ProgressionPreviewDefinition = {
  id: string;
  type: ProgressionUnlockPreviewType;
  title: string;
  subtitle: string;
  requiredRankId: AuthorityRankId;
  requiredTrust: number;
  nearTrust: number;
  reasonLine: string;
};

export const PROGRESSION_PREVIEW_DEFINITIONS: ProgressionPreviewDefinition[] = [
  {
    id: 'neighborhood_istasyon',
    type: 'neighborhood',
    title: 'İstasyon Mahallesi Önizlemesi',
    subtitle: 'Yeni mahalle sorumluluğu',
    requiredRankId: 'operations_responsible',
    requiredTrust: 450,
    nearTrust: 350,
    reasonLine:
      'Operasyon Sorumlusu yetkisiyle yeni mahalle sorumluluğu gündeme gelir.',
  },
  {
    id: 'neighborhood_yesilvadi',
    type: 'neighborhood',
    title: 'Yeşilvadi Operasyon Önizlemesi',
    subtitle: 'Geniş saha planlaması',
    requiredRankId: 'unit_chief',
    requiredTrust: 1200,
    nearTrust: 900,
    reasonLine: 'Birim Şefi kapsamı daha geniş saha planlamasını açar.',
  },
  {
    id: 'operation_scope_main',
    type: 'operation_scope',
    title: 'Ana Operasyon Kapsamı',
    subtitle: 'Şehir ölçeği operasyon',
    requiredRankId: 'district_coordinator',
    requiredTrust: 2500,
    nearTrust: 1800,
    reasonLine: 'Bölge Koordinatörü yetkisi ana operasyon kapsamını büyütür.',
  },
  {
    id: 'system_crisis_desk',
    type: 'system',
    title: 'Kriz Masası Önizlemesi',
    subtitle: 'Üst düzey kriz koordinasyonu',
    requiredRankId: 'deputy_director',
    requiredTrust: 4500,
    nearTrust: 3500,
    reasonLine:
      'Daire Başkan Yardımcısı kapsamı kriz masası kararlarını görünür kılar.',
  },
];

const MAX_PREVIEW_ITEMS = 4;

export function getAuthorityRankIndex(rankId: AuthorityRankId): number {
  const index = AUTHORITY_RANKS.findIndex((rank) => rank.id === rankId);
  return index >= 0 ? index : 0;
}

export function isAuthorityRankAtLeast(
  currentRankId: AuthorityRankId,
  requiredRankId: AuthorityRankId,
): boolean {
  return (
    getAuthorityRankIndex(currentRankId) >= getAuthorityRankIndex(requiredRankId)
  );
}

export function resolveProgressionPreviewStatus(
  authorityState: AuthorityState,
  definition: ProgressionPreviewDefinition,
): ProgressionUnlockPreviewStatus {
  if (isAuthorityRankAtLeast(authorityState.formalRankId, definition.requiredRankId)) {
    return 'completed';
  }

  const pendingRankId =
    authorityState.lastEvaluation?.pendingPromotionRankId ??
    authorityState.pendingPromotionRankId;
  if (
    authorityState.lastEvaluation?.evaluationStatus === 'promotion_candidate' &&
    pendingRankId === definition.requiredRankId
  ) {
    return 'available_preview';
  }

  if (authorityState.authorityTrust >= definition.nearTrust) {
    return 'near';
  }

  return 'locked_preview';
}

export function computeProgressionPreviewPercent(
  authorityTrust: number,
  requiredTrust: number,
  status: ProgressionUnlockPreviewStatus,
): number {
  if (status === 'completed') {
    return 100;
  }
  if (requiredTrust <= 0) {
    return 0;
  }
  return Math.max(0, Math.min(99, Math.round((authorityTrust / requiredTrust) * 100)));
}

export function buildProgressionUnlockPreview(
  authorityState: AuthorityState,
  definition: ProgressionPreviewDefinition,
): ProgressionUnlockPreview {
  const status = resolveProgressionPreviewStatus(authorityState, definition);
  return {
    id: definition.id,
    type: definition.type,
    title: definition.title,
    subtitle: definition.subtitle,
    status,
    requiredRankId: definition.requiredRankId,
    requiredTrust: definition.requiredTrust,
    progressPercent: computeProgressionPreviewPercent(
      authorityState.authorityTrust,
      definition.requiredTrust,
      status,
    ),
    reasonLine: definition.reasonLine,
  };
}

export function buildAllProgressionUnlockPreviews(
  authorityState: AuthorityState,
): ProgressionUnlockPreview[] {
  return PROGRESSION_PREVIEW_DEFINITIONS.map((definition) =>
    buildProgressionUnlockPreview(authorityState, definition),
  ).slice(0, MAX_PREVIEW_ITEMS);
}

export function selectPrimaryProgressionPreview(
  previews: ProgressionUnlockPreview[],
): ProgressionUnlockPreview | undefined {
  const priority: ProgressionUnlockPreviewStatus[] = [
    'available_preview',
    'near',
    'locked_preview',
    'completed',
  ];

  for (const status of priority) {
    const match = previews.find((preview) => preview.status === status);
    if (match) {
      return match;
    }
  }

  return previews[0];
}

export function buildProgressionNextActionLine(
  primaryPreview: ProgressionUnlockPreview | undefined,
  authorityState: AuthorityState,
): string {
  if (!primaryPreview?.requiredRankId || primaryPreview.requiredTrust == null) {
    return 'Yetki güvenin arttıkça yeni kapsamlar gündeme gelir.';
  }

  if (primaryPreview.status === 'completed') {
    const nextPreview = PROGRESSION_PREVIEW_DEFINITIONS.map((definition) =>
      buildProgressionUnlockPreview(authorityState, definition),
    ).find((preview) => preview.status !== 'completed');

    if (!nextPreview?.requiredRankId || nextPreview.requiredTrust == null) {
      return 'Mevcut kapsam değerlendirmesi tamamlandı.';
    }

    const rankLabel =
      AUTHORITY_RANK_BY_ID[nextPreview.requiredRankId]?.label ?? 'Sonraki yetki';
    const remaining = Math.max(
      0,
      nextPreview.requiredTrust - authorityState.authorityTrust,
    );
    return `${rankLabel} için ${remaining} güven kaldı.`;
  }

  const rankLabel =
    AUTHORITY_RANK_BY_ID[primaryPreview.requiredRankId]?.label ?? 'Sonraki yetki';
  const remaining = Math.max(
    0,
    primaryPreview.requiredTrust - authorityState.authorityTrust,
  );
  return `${rankLabel} için ${remaining} güven kaldı.`;
}

export function normalizeProgressionBridgeInput(
  input: BuildProgressionBridgeSummaryInput,
): {
  authorityState: AuthorityState;
  badgeState: BadgeState;
  currentDay: number;
} {
  const currentDay = Math.max(1, input.currentDay ?? 1);
  return {
    authorityState: normalizeAuthorityState(
      input.authorityState ?? createInitialAuthorityState(currentDay),
      currentDay,
    ),
    badgeState: normalizeBadgeState(
      input.badgeState ?? createInitialBadgeState(currentDay),
      currentDay,
    ),
    currentDay,
  };
}
