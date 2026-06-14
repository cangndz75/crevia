import type { AuthorityState } from '@/core/authority/authorityTypes';
import { normalizeAuthorityState } from '@/core/authority/authoritySeed';
import {
  getRankPermissionDefinition,
  getRankPermissionRankDefinition,
  isPermissionPreviewUnlocked,
  RANK_PERMISSION_RANKS,
} from '@/core/rankPermissions/rankPermissionMatrix';
import type {
  RankPermissionId,
  RankPermissionRankKey,
  RankPermissionStatus,
} from '@/core/rankPermissions/rankPermissionTypes';

import type {
  AuthorityGameplayAffectsSurface,
  AuthorityGameplayPresentationContext,
  AuthorityGameplayUnlockId,
  AuthorityGameplayUnlockProfile,
  AuthorityGameplayUnlockStatus,
  AuthorityGameplayVisibilityLevel,
  BuildAuthorityGameplayPresentationContextInput,
} from './authorityGameplayUnlockTypes';

type UnlockDefinition = {
  id: AuthorityGameplayUnlockId;
  rankPermissionId: RankPermissionId;
  title: string;
  affects: AuthorityGameplayAffectsSurface[];
  canSeeLine: string;
  betterDecisionLine: string;
  affectedPhaseLine: string;
  playerBenefitLine: string;
  unlockedLine: string;
  lockedReason: string;
};

const UNLOCK_DEFINITIONS: UnlockDefinition[] = [
  {
    id: 'assignment_fit_preview',
    rankPermissionId: 'assignment_fit_preview',
    title: 'Atama Uyumu Önizlemesi',
    affects: ['dispatch', 'field'],
    canSeeLine: 'Ekip ve araç uyum nedenlerini.',
    betterDecisionLine: 'Riskli atamadan önce yorulmuş ekipleri fark edersin.',
    affectedPhaseLine: 'Yönlendir / Sahada',
    playerBenefitLine: 'Atama uyumunu görev öncesi daha net okursun.',
    unlockedLine: 'Ekip yorgunluğu ve araç uygunluğu ayrıştırılmış görünür.',
    lockedReason: 'Saha Koordinatörü yetkisinde açılır.',
  },
  {
    id: 'district_trust_preview',
    rankPermissionId: 'district_trust_preview',
    title: 'Mahalle Güveni Önizlemesi',
    affects: ['inspect', 'plan'],
    canSeeLine: 'Mahalle güveninin karara hassasiyetini.',
    betterDecisionLine:
      'Sosyal tepki yerine kalıcı güveni ne zaman seçmen gerektiğini anlarsın.',
    affectedPhaseLine: 'İncele / Planla',
    playerBenefitLine: 'Mahalle güven etkisini karar öncesi görürsün.',
    unlockedLine: 'Güven hassasiyeti ve sosyal tepki bağlantısı netleşir.',
    lockedReason: 'Bölge Sorumlusu yetkisinde açılır.',
  },
  {
    id: 'resource_pressure_summary',
    rankPermissionId: 'resource_pressure_summary',
    title: 'Kaynak Baskısı Özeti',
    affects: ['plan', 'inspect'],
    canSeeLine: 'Personel, araç ve konteyner baskısı ayrımını.',
    betterDecisionLine: 'Hızlı müdahale ile kaynak maliyetini daha bilinçli tartarsın.',
    affectedPhaseLine: 'Planla',
    playerBenefitLine: 'Kaynak baskısı plan seçiminde ayrışır.',
    unlockedLine: 'Araç, personel ve ağ baskısı ayrı etiketlerle görünür.',
    lockedReason: 'Saha Koordinatörü yetkisinde açılır.',
  },
  {
    id: 'tomorrow_risk_preview',
    rankPermissionId: 'advisor_specialist_notes_preview',
    title: 'Yarın Riski Önizlemesi',
    affects: ['inspect', 'plan'],
    canSeeLine: 'Seçimin yarınki rota, kaynak ve sosyal baskıya etkisini.',
    betterDecisionLine: 'Bugünkü hızlı çözümün yarına taşıyacağı riski önceden okursun.',
    affectedPhaseLine: 'İncele / Planla',
    playerBenefitLine: 'Yarın etkisi karar öncesi daha okunur olur.',
    unlockedLine: 'Yarın riski rota, kaynak veya sosyal baskı olarak ayrışır.',
    lockedReason: 'Operasyon Asistanı yetkisinde açılır.',
  },
  {
    id: 'vehicle_maintenance_preview',
    rankPermissionId: 'vehicle_maintenance_window_preview',
    title: 'Araç Bakım Penceresi',
    affects: ['dispatch', 'field', 'hub'],
    canSeeLine: 'Filo yorgunluğu ve bakım penceresini.',
    betterDecisionLine: 'Aracı zorlamadan önce bakım riskini görürsün.',
    affectedPhaseLine: 'Yönlendir / Merkez',
    playerBenefitLine: 'Bakım penceresi operasyon öncesi işaretlenir.',
    unlockedLine: 'Araç baskısı ve bakım riski ayrı okunur.',
    lockedReason: 'Operasyon Sorumlusu yetkisinde açılır.',
  },
  {
    id: 'team_specialization_preview',
    rankPermissionId: 'team_specialization_preview',
    title: 'Ekip Uzmanlığı Önizlemesi',
    affects: ['dispatch', 'field', 'hub'],
    canSeeLine: 'Ekiplerin güçlü olduğu operasyon türlerini.',
    betterDecisionLine: 'Yanlış ekibi göreve göndermeden önce uzmanlık uyumunu görürsün.',
    affectedPhaseLine: 'Yönlendir / Merkez',
    playerBenefitLine: 'Ekip uzmanlığı atama kararını destekler.',
    unlockedLine: 'Ekip uzmanlığı uyumu daha görünür.',
    lockedReason: 'Operasyon Sorumlusu yetkisinde açılır.',
  },
  {
    id: 'map_trust_layer',
    rankPermissionId: 'map_trust_layer',
    title: 'Güven Harita Katmanı',
    affects: ['map'],
    canSeeLine: 'Hangi mahallede güven hassas olduğunu haritada.',
    betterDecisionLine: 'Mahalle seçiminde güven baskısını önceden görürsün.',
    affectedPhaseLine: 'Harita',
    playerBenefitLine: 'Mahalle güveni harita katmanında okunur.',
    unlockedLine: 'Güven katmanı haritada karşılaştırılabilir.',
    lockedReason: 'Şehir Operasyon Yöneticisi yetkisinde açılır.',
  },
  {
    id: 'map_resource_layer',
    rankPermissionId: 'map_resource_layer',
    title: 'Kaynak Harita Katmanı',
    affects: ['map'],
    canSeeLine: 'Hangi bölgenin kaynak baskısı yarattığını haritada.',
    betterDecisionLine: 'Kaynak dağılımını haritadan okuyarak plan yaparsın.',
    affectedPhaseLine: 'Harita',
    playerBenefitLine: 'Kaynak baskısı harita üzerinde özetlenir.',
    unlockedLine: 'Kaynak katmanı haritada görünür.',
    lockedReason: 'Şehir Operasyon Yöneticisi yetkisinde açılır.',
  },
  {
    id: 'district_memory_trace',
    rankPermissionId: 'district_memory_trace_preview',
    title: 'Mahalle Hafıza İzi',
    affects: ['hub', 'profile'],
    canSeeLine: 'Önceki kararların mahallede bıraktığı izi.',
    betterDecisionLine: 'Geçmiş kararların bugünkü fırsatı nasıl şekillendirdiğini anlarsın.',
    affectedPhaseLine: 'Merkez / Profil',
    playerBenefitLine: 'Mahalle hafıza izi görünür olur.',
    unlockedLine: 'Hafıza izi mahalle bağlamında okunur.',
    lockedReason: 'Bölge Sorumlusu yetkisinde açılır.',
  },
];

function mapStatusToUnlockStatus(
  visibility: AuthorityGameplayVisibilityLevel,
): AuthorityGameplayUnlockStatus {
  if (visibility === 'detailed') return 'available';
  if (visibility === 'teaser') return 'preview';
  return 'locked';
}

function rankKeyFromAuthorityTrust(authorityTrust: number): RankPermissionRankKey {
  for (let index = RANK_PERMISSION_RANKS.length - 1; index >= 0; index -= 1) {
    const rank = RANK_PERMISSION_RANKS[index]!;
    if (authorityTrust >= (rank.authorityMin ?? 0)) {
      return rank.rankKey;
    }
  }
  return 'field_observer';
}

function resolvePermissionStatus(
  permissionId: RankPermissionId,
  authorityState: AuthorityState,
): RankPermissionStatus {
  const trustRankKey = rankKeyFromAuthorityTrust(authorityState.authorityTrust);
  return isPermissionPreviewUnlocked({
    permissionId,
    currentRankKey: trustRankKey,
    authorityTrust: authorityState.authorityTrust,
  });
}

export function resolveGameplayVisibilityLevel(
  permissionId: RankPermissionId,
  authorityState: AuthorityState | null | undefined,
  day = 1,
  isDay1LearningEvent = false,
): AuthorityGameplayVisibilityLevel {
  if (!authorityState) {
    return day === 1 || isDay1LearningEvent ? 'summary' : 'summary';
  }

  const normalized = normalizeAuthorityState(authorityState, day);
  const status = resolvePermissionStatus(permissionId, normalized);

  if (day === 1 || isDay1LearningEvent) {
    return status === 'unlocked' || status === 'current' ? 'summary' : 'summary';
  }

  if (status === 'unlocked' || status === 'current') {
    return 'detailed';
  }
  if (status === 'next') {
    return 'teaser';
  }
  return 'summary';
}

function dedupeIds(ids: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function buildAuthorityGameplayUnlockProfile(
  definition: UnlockDefinition,
  authorityState: AuthorityState | null | undefined,
  day = 1,
  isDay1LearningEvent = false,
): AuthorityGameplayUnlockProfile {
  const normalized = authorityState ? normalizeAuthorityState(authorityState, day) : null;
  const visibilityLevel = resolveGameplayVisibilityLevel(
    definition.rankPermissionId,
    normalized,
    day,
    isDay1LearningEvent,
  );
  const status = mapStatusToUnlockStatus(visibilityLevel);
  const rankDef = getRankPermissionDefinition(definition.rankPermissionId);
  const requiredRank = rankDef
    ? getRankPermissionRankDefinition(rankDef.requiredRankKey)
    : undefined;

  return {
    id: definition.id,
    title: definition.title,
    status,
    requiredRankId: requiredRank?.rankKey,
    requiredPermissionId: definition.rankPermissionId,
    visibilityLevel,
    affects: definition.affects,
    playerBenefitLine: definition.playerBenefitLine,
    lockedReason: status !== 'available' ? definition.lockedReason : undefined,
    unlockedLine: status === 'available' ? definition.unlockedLine : undefined,
    canSeeLine: definition.canSeeLine,
    betterDecisionLine: definition.betterDecisionLine,
    affectedPhaseLine: definition.affectedPhaseLine,
    unlockConditionLine: requiredRank?.title
      ? `${requiredRank.title} yetkisi`
      : definition.lockedReason,
    sourceLabel: 'Authority gameplay unlock',
    sourceIds: dedupeIds([
      definition.id,
      definition.rankPermissionId,
      requiredRank?.rankKey ?? '',
      visibilityLevel,
    ]),
  };
}

export function buildAuthorityGameplayUnlockProfiles(
  input: BuildAuthorityGameplayPresentationContextInput = {},
): AuthorityGameplayUnlockProfile[] {
  const day = input.day ?? 1;
  const authorityState = input.authorityState ?? null;
  return UNLOCK_DEFINITIONS.map((definition) =>
    buildAuthorityGameplayUnlockProfile(
      definition,
      authorityState,
      day,
      input.isDay1LearningEvent,
    ),
  );
}

export function buildAuthorityGameplayPresentationContext(
  input: BuildAuthorityGameplayPresentationContextInput = {},
): AuthorityGameplayPresentationContext {
  const profiles = buildAuthorityGameplayUnlockProfiles(input);
  const visibilityByUnlock: Partial<
    Record<AuthorityGameplayUnlockId, AuthorityGameplayVisibilityLevel>
  > = {};

  for (const profile of profiles) {
    visibilityByUnlock[profile.id] = profile.visibilityLevel;
  }

  return {
    day: input.day,
    isDay1LearningEvent: input.isDay1LearningEvent,
    visibilityByUnlock,
    profiles,
  };
}

export function getGameplayVisibility(
  context: AuthorityGameplayPresentationContext | undefined,
  unlockId: AuthorityGameplayUnlockId,
): AuthorityGameplayVisibilityLevel {
  return context?.visibilityByUnlock[unlockId] ?? 'summary';
}

export function isGameplayUnlockDetailed(
  context: AuthorityGameplayPresentationContext | undefined,
  unlockId: AuthorityGameplayUnlockId,
): boolean {
  return getGameplayVisibility(context, unlockId) === 'detailed';
}

export const RANK_PERMISSION_TO_GAMEPLAY_UNLOCK: Partial<
  Record<RankPermissionId, AuthorityGameplayUnlockId>
> = {
  assignment_fit_preview: 'assignment_fit_preview',
  district_trust_preview: 'district_trust_preview',
  resource_pressure_summary: 'resource_pressure_summary',
  advisor_specialist_notes_preview: 'tomorrow_risk_preview',
  vehicle_maintenance_window_preview: 'vehicle_maintenance_preview',
  team_specialization_preview: 'team_specialization_preview',
  map_trust_layer: 'map_trust_layer',
  map_resource_layer: 'map_resource_layer',
  district_memory_trace_preview: 'district_memory_trace',
};

export function mapRankPermissionToGameplayUnlockId(
  permissionId: RankPermissionId,
): AuthorityGameplayUnlockId | undefined {
  return RANK_PERMISSION_TO_GAMEPLAY_UNLOCK[permissionId];
}

export function getCoreGameplayUnlockProfiles(
  profiles: AuthorityGameplayUnlockProfile[],
): AuthorityGameplayUnlockProfile[] {
  const coreIds = new Set([
    'assignment_fit_preview',
    'district_trust_preview',
    'resource_pressure_summary',
    'tomorrow_risk_preview',
  ]);
  return profiles.filter((profile) => coreIds.has(profile.id));
}
