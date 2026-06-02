import type { AuthorityRankId } from '@/core/authority/authorityTypes';

import {
  REQUIRED_RANK_PERMISSION_IDS,
} from './rankPermissionConstants';
import type {
  RankPermissionBundle,
  RankPermissionDefinition,
  RankPermissionId,
  RankPermissionRankDefinition,
  RankPermissionRankKey,
  RankPermissionStatus,
  RankPermissionUiItem,
} from './rankPermissionTypes';

export const RANK_PERMISSION_RANKS: readonly RankPermissionRankDefinition[] = [
  {
    rankKey: 'field_observer',
    title: 'Saha Gözlemcisi',
    subtitle: 'Temel olay inceleme',
    order: 1,
    authorityMin: 0,
    authorityMax: 149,
    summary: 'Oyuncu temel olayları okur ve rapor etkisini görmeye başlar.',
    permissionIds: ['inspect_basic_events'],
  },
  {
    rankKey: 'operations_assistant',
    title: 'Operasyon Asistanı',
    subtitle: 'Günlük plan desteği',
    order: 2,
    authorityMin: 150,
    authorityMax: 449,
    summary: 'Günlük plan önizlemesi ve kısa Ece notları öne çıkar.',
    permissionIds: ['daily_plan_preview', 'advisor_specialist_notes_preview'],
  },
  {
    rankKey: 'field_coordinator',
    title: 'Saha Koordinatörü',
    subtitle: 'Atama ve kaynak görünürlüğü',
    order: 3,
    authorityMin: 450,
    authorityMax: 899,
    summary: 'Saha ataması uyumu ve kaynak baskısı oyuncuya daha net anlatılır.',
    permissionIds: ['assignment_fit_preview', 'resource_pressure_summary'],
  },
  {
    rankKey: 'district_supervisor',
    title: 'Bölge Sorumlusu',
    subtitle: 'Mahalle güveni ve hafıza izi',
    order: 4,
    authorityMin: 900,
    authorityMax: 1199,
    summary: 'Mahalle trust, hafıza izi ve mahalle özel operasyon preview gündeme gelir.',
    permissionIds: [
      'district_trust_preview',
      'district_memory_trace_preview',
      'district_specific_operations_preview',
    ],
  },
  {
    rankKey: 'operations_supervisor',
    title: 'Operasyon Sorumlusu',
    subtitle: 'Kriz ve bakım pencereleri',
    order: 5,
    authorityMin: 1200,
    authorityMax: 2499,
    summary: 'Kriz, araç bakım penceresi, ekip uzmanlığı ve konteyner ağı preview güçlenir.',
    permissionIds: [
      'map_crisis_layer',
      'team_specialization_preview',
      'vehicle_maintenance_window_preview',
      'container_network_upgrade_preview',
    ],
  },
  {
    rankKey: 'city_operations_manager',
    title: 'Şehir Operasyon Yöneticisi',
    subtitle: 'Harita katmanları ve olay aileleri',
    order: 6,
    authorityMin: 2500,
    authorityMax: 4499,
    summary: 'Harita kaynak/sosyal/trust katmanları ve olay family preview açılır.',
    permissionIds: [
      'map_resource_layer',
      'map_social_layer',
      'map_trust_layer',
      'event_family_rotation_preview',
      'mini_story_chain_preview',
    ],
  },
  {
    rankKey: 'strategy_coordinator',
    title: 'Strateji Koordinatörü',
    subtitle: 'Operation era ve adaptif olaylar',
    order: 7,
    authorityMin: 4500,
    authorityMax: 7499,
    summary: 'Operation era, oyuncu tarzına uyarlanan olaylar ve recovery ağırlıkları görünür olur.',
    permissionIds: [
      'operation_era_preview',
      'player_adaptive_event_preview',
      'reward_recovery_event_preview',
    ],
  },
  {
    rankKey: 'chief_operations_director',
    title: 'Baş Operasyon Direktörü',
    subtitle: 'Şehir gelişimi ve departmanlar',
    order: 8,
    authorityMin: 7500,
    summary: 'Şehir gelişimi, departman birimleri ve büyük operasyon zincirleri preview edilir.',
    permissionIds: ['city_development_preview', 'department_units_preview'],
  },
] as const;

export const RANK_PERMISSION_DEFINITIONS: readonly RankPermissionDefinition[] = [
  {
    id: 'inspect_basic_events',
    title: 'Temel Olay İnceleme',
    shortLabel: 'Olay İnceleme',
    description: 'Olay bağlamı, karar etkisi ve gün sonu rapor izi görünür olur.',
    category: 'core_operation',
    unlockAxis: 'authority',
    requiredRankKey: 'field_observer',
    requiredAuthorityMin: 0,
    isPreviewOnly: true,
    playerFacingPriority: 10,
    iconKey: 'search-outline',
    tone: 'neutral',
  },
  {
    id: 'daily_plan_preview',
    title: 'Günlük Plan Önizlemesi',
    shortLabel: 'Plan Önizleme',
    description: 'Sabah planı ve operasyon odağı oyuncuya daha erken anlatılır.',
    category: 'planning',
    unlockAxis: 'authority',
    requiredRankKey: 'operations_assistant',
    requiredAuthorityMin: 150,
    isPreviewOnly: true,
    playerFacingPriority: 20,
    iconKey: 'calendar-outline',
    tone: 'neutral',
  },
  {
    id: 'advisor_specialist_notes_preview',
    title: 'Ece Uzmanlık Notları',
    shortLabel: 'Ece Notları',
    description: 'Ece sıradaki risk ve fırsatı kısa uzmanlık notuyla özetler.',
    category: 'advisor',
    unlockAxis: 'authority',
    requiredRankKey: 'operations_assistant',
    requiredAuthorityMin: 150,
    isPreviewOnly: true,
    playerFacingPriority: 21,
    iconKey: 'chatbubble-outline',
    tone: 'neutral',
  },
  {
    id: 'assignment_fit_preview',
    title: 'Atama Uyumu Önizlemesi',
    shortLabel: 'Atama Uyumu',
    description: 'Ekip, araç ve karar uyumu görev öncesi daha net görünür.',
    category: 'assignment',
    unlockAxis: 'authority',
    requiredRankKey: 'field_coordinator',
    requiredAuthorityMin: 450,
    isPreviewOnly: true,
    playerFacingPriority: 30,
    iconKey: 'people-outline',
    tone: 'positive',
  },
  {
    id: 'resource_pressure_summary',
    title: 'Kaynak Baskısı Özeti',
    shortLabel: 'Kaynak Baskısı',
    description: 'Filo, personel ve konteyner baskısı kısa özet olarak görünür.',
    category: 'resource',
    unlockAxis: 'resource_stability',
    requiredRankKey: 'field_coordinator',
    requiredAuthorityMin: 450,
    isPreviewOnly: true,
    playerFacingPriority: 31,
    iconKey: 'construct-outline',
    tone: 'warning',
  },
  {
    id: 'district_trust_preview',
    title: 'Mahalle Güveni Önizlemesi',
    shortLabel: 'Mahalle Güveni',
    description: 'Mahalle güveni ve sosyal tepki karar etkisine bağlanır.',
    category: 'district',
    unlockAxis: 'district_trust',
    requiredRankKey: 'district_supervisor',
    requiredAuthorityMin: 900,
    isPreviewOnly: true,
    playerFacingPriority: 40,
    iconKey: 'heart-outline',
    tone: 'positive',
  },
  {
    id: 'district_memory_trace_preview',
    title: 'Mahalle Hafıza İzi',
    shortLabel: 'Hafıza İzi',
    description: 'Önceki kararların mahalle algısında bıraktığı iz görünür olur.',
    category: 'district',
    unlockAxis: 'district_trust',
    requiredRankKey: 'district_supervisor',
    requiredAuthorityMin: 900,
    isPreviewOnly: true,
    playerFacingPriority: 41,
    iconKey: 'time-outline',
    tone: 'neutral',
  },
  {
    id: 'district_specific_operations_preview',
    title: 'Mahalle Özel Operasyon Önizlemesi',
    shortLabel: 'Mahalle Operasyonu',
    description: 'Mahalle karakterine göre özel operasyon gündemi öne çıkar.',
    category: 'district',
    unlockAxis: 'district_trust',
    requiredRankKey: 'district_supervisor',
    requiredAuthorityMin: 900,
    isPreviewOnly: true,
    playerFacingPriority: 42,
    iconKey: 'location-outline',
    tone: 'neutral',
  },
  {
    id: 'map_crisis_layer',
    title: 'Kriz Harita Katmanı',
    shortLabel: 'Kriz Katmanı',
    description: 'Kriz riski haritada operasyon önceliği olarak işaretlenir.',
    category: 'map_layer',
    unlockAxis: 'crisis_control',
    requiredRankKey: 'operations_supervisor',
    requiredAuthorityMin: 1200,
    isPreviewOnly: true,
    playerFacingPriority: 50,
    iconKey: 'warning-outline',
    tone: 'warning',
  },
  {
    id: 'team_specialization_preview',
    title: 'Ekip Uzmanlığı Önizlemesi',
    shortLabel: 'Ekip Uzmanlığı',
    description: 'Ekiplerin güçlü olduğu operasyon türleri daha görünür hale gelir.',
    category: 'resource',
    unlockAxis: 'rank',
    requiredRankKey: 'operations_supervisor',
    requiredAuthorityMin: 1200,
    isPreviewOnly: true,
    playerFacingPriority: 51,
    iconKey: 'person-add-outline',
    tone: 'positive',
  },
  {
    id: 'vehicle_maintenance_window_preview',
    title: 'Araç Bakım Penceresi',
    shortLabel: 'Araç Bakımı',
    description: 'Filo yorgunluğu ve bakım zamanı operasyon öncesi işaretlenir.',
    category: 'resource',
    unlockAxis: 'resource_stability',
    requiredRankKey: 'operations_supervisor',
    requiredAuthorityMin: 1200,
    isPreviewOnly: true,
    playerFacingPriority: 52,
    iconKey: 'car-outline',
    tone: 'warning',
  },
  {
    id: 'container_network_upgrade_preview',
    title: 'Konteyner Ağı Geliştirme',
    shortLabel: 'Konteyner Ağı',
    description: 'Konteyner hattı geliştirme fırsatları kaynak istikrarıyla görünür.',
    category: 'resource',
    unlockAxis: 'resource_stability',
    requiredRankKey: 'operations_supervisor',
    requiredAuthorityMin: 1200,
    isPreviewOnly: true,
    playerFacingPriority: 53,
    iconKey: 'cube-outline',
    tone: 'positive',
  },
  {
    id: 'map_resource_layer',
    title: 'Kaynak Harita Katmanı',
    shortLabel: 'Kaynak Katmanı',
    description: 'Araç, ekip ve konteyner baskısı harita üzerinde özetlenir.',
    category: 'map_layer',
    unlockAxis: 'resource_stability',
    requiredRankKey: 'city_operations_manager',
    requiredAuthorityMin: 2500,
    isPreviewOnly: true,
    playerFacingPriority: 60,
    iconKey: 'map-outline',
    tone: 'neutral',
  },
  {
    id: 'map_social_layer',
    title: 'Sosyal Harita Katmanı',
    shortLabel: 'Sosyal Katman',
    description: 'Sosyal nabız ve şikayet ısısı haritada ayrı katman olur.',
    category: 'map_layer',
    unlockAxis: 'district_trust',
    requiredRankKey: 'city_operations_manager',
    requiredAuthorityMin: 2500,
    isPreviewOnly: true,
    playerFacingPriority: 61,
    iconKey: 'chatbubble-ellipses-outline',
    tone: 'neutral',
  },
  {
    id: 'map_trust_layer',
    title: 'Mahalle Trust Katmanı',
    shortLabel: 'Trust Katmanı',
    description: 'Mahalle güveni şehir haritasında karşılaştırmalı görünür.',
    category: 'map_layer',
    unlockAxis: 'district_trust',
    requiredRankKey: 'city_operations_manager',
    requiredAuthorityMin: 2500,
    isPreviewOnly: true,
    playerFacingPriority: 62,
    iconKey: 'shield-checkmark-outline',
    tone: 'positive',
  },
  {
    id: 'event_family_rotation_preview',
    title: 'Olay Ailesi Rotasyonu',
    shortLabel: 'Olay Ailesi',
    description: 'Benzer olay tipleri dengeli döngüler halinde gündeme gelir.',
    category: 'event_content',
    unlockAxis: 'operation_era',
    requiredRankKey: 'city_operations_manager',
    requiredAuthorityMin: 2500,
    isPreviewOnly: true,
    playerFacingPriority: 63,
    iconKey: 'repeat-outline',
    tone: 'neutral',
  },
  {
    id: 'mini_story_chain_preview',
    title: 'Mini Hikaye Zinciri',
    shortLabel: 'Mini Zincir',
    description: 'Kararların kısa olay zincirlerine bağlanması preview edilir.',
    category: 'event_content',
    unlockAxis: 'operation_era',
    requiredRankKey: 'city_operations_manager',
    requiredAuthorityMin: 2500,
    isPreviewOnly: true,
    playerFacingPriority: 64,
    iconKey: 'git-branch-outline',
    tone: 'neutral',
  },
  {
    id: 'operation_era_preview',
    title: 'Operation Era Önizlemesi',
    shortLabel: 'Operation Era',
    description: 'Yeni tema ve kapsam dönemleri operasyon kariyerine bağlanır.',
    category: 'operation_era',
    unlockAxis: 'operation_era',
    requiredRankKey: 'strategy_coordinator',
    requiredAuthorityMin: 4500,
    isPreviewOnly: true,
    playerFacingPriority: 70,
    iconKey: 'compass-outline',
    tone: 'positive',
  },
  {
    id: 'player_adaptive_event_preview',
    title: 'Oyuncuya Uyarlanan Olaylar',
    shortLabel: 'Adaptif Olay',
    description: 'Olay ağırlıkları oyuncu karar tarzına göre öncelik kazanır.',
    category: 'event_content',
    unlockAxis: 'xp',
    requiredRankKey: 'strategy_coordinator',
    requiredAuthorityMin: 4500,
    isPreviewOnly: true,
    playerFacingPriority: 71,
    iconKey: 'sparkles-outline',
    tone: 'positive',
  },
  {
    id: 'reward_recovery_event_preview',
    title: 'Toparlanma ve Ödül Olayları',
    shortLabel: 'Toparlanma Olayı',
    description: 'Zor dönemlerden sonra geri dönüş fırsatları daha net işaretlenir.',
    category: 'event_content',
    unlockAxis: 'xp',
    requiredRankKey: 'strategy_coordinator',
    requiredAuthorityMin: 4500,
    isPreviewOnly: true,
    playerFacingPriority: 72,
    iconKey: 'refresh-circle-outline',
    tone: 'positive',
  },
  {
    id: 'city_development_preview',
    title: 'Şehir Gelişimi Önizlemesi',
    shortLabel: 'Şehir Gelişimi',
    description: 'Uzun dönem şehir gelişimi operasyon kararlarına bağlanır.',
    category: 'city_development',
    unlockAxis: 'operation_era',
    requiredRankKey: 'chief_operations_director',
    requiredAuthorityMin: 7500,
    isPreviewOnly: true,
    playerFacingPriority: 80,
    iconKey: 'business-outline',
    tone: 'positive',
  },
  {
    id: 'department_units_preview',
    title: 'Departman Birimleri Önizlemesi',
    shortLabel: 'Departmanlar',
    description: 'Birim ve departman yönetimi büyük operasyon zincirlerine hazırlanır.',
    category: 'city_development',
    unlockAxis: 'rank',
    requiredRankKey: 'chief_operations_director',
    requiredAuthorityMin: 7500,
    isPreviewOnly: true,
    playerFacingPriority: 81,
    iconKey: 'layers-outline',
    tone: 'neutral',
  },
] as const;

const RANK_BY_KEY = new Map(RANK_PERMISSION_RANKS.map((rank) => [rank.rankKey, rank]));
const PERMISSION_BY_ID = new Map(RANK_PERMISSION_DEFINITIONS.map((permission) => [permission.id, permission]));

const AUTHORITY_RANK_TO_PERMISSION_RANK: Record<AuthorityRankId, RankPermissionRankKey> = {
  field_coordinator: 'field_coordinator',
  operations_responsible: 'operations_supervisor',
  unit_chief: 'city_operations_manager',
  district_coordinator: 'strategy_coordinator',
  deputy_director: 'strategy_coordinator',
  department_director: 'chief_operations_director',
};

export function getRankPermissionDefinition(
  permissionId: RankPermissionId,
): RankPermissionDefinition | undefined {
  return PERMISSION_BY_ID.get(permissionId);
}

export function getRankPermissionRankDefinition(
  rankKey: RankPermissionRankKey,
): RankPermissionRankDefinition | undefined {
  return RANK_BY_KEY.get(rankKey);
}

export function getRankPermissionOrder(rankKey: RankPermissionRankKey): number {
  return getRankPermissionRankDefinition(rankKey)?.order ?? 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isRankPermissionRankKey(value: unknown): value is RankPermissionRankKey {
  return typeof value === 'string' && RANK_BY_KEY.has(value as RankPermissionRankKey);
}

function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function resolveRankByAuthorityTrust(authorityTrust: number | undefined): RankPermissionRankKey {
  if (authorityTrust == null) return 'field_observer';
  let matched = RANK_PERMISSION_RANKS[0]!;
  for (const rank of RANK_PERMISSION_RANKS) {
    if ((rank.authorityMin ?? 0) <= authorityTrust) {
      matched = rank;
    }
  }
  return matched.rankKey;
}

export function resolveRankKeyFromAuthorityState(authorityState: unknown): RankPermissionRankKey {
  if (!isRecord(authorityState)) {
    return 'field_observer';
  }

  const formalRankId = authorityState.formalRankId;
  if (typeof formalRankId === 'string' && formalRankId in AUTHORITY_RANK_TO_PERMISSION_RANK) {
    return AUTHORITY_RANK_TO_PERMISSION_RANK[formalRankId as AuthorityRankId];
  }

  const directRank = authorityState.currentRank ?? authorityState.rankKey;
  if (isRankPermissionRankKey(directRank)) {
    return directRank;
  }

  return resolveRankByAuthorityTrust(readNumber(authorityState.authorityTrust));
}

function getNextRank(currentRank: RankPermissionRankDefinition): RankPermissionRankDefinition | undefined {
  return RANK_PERMISSION_RANKS.find((rank) => rank.order === currentRank.order + 1);
}

function buildUiItem(
  permission: RankPermissionDefinition,
  status: RankPermissionStatus,
): RankPermissionUiItem {
  return {
    id: permission.id,
    title: permission.shortLabel,
    description: permission.description,
    status,
    category: permission.category,
    iconKey: permission.iconKey,
    tone: permission.tone,
  };
}

export function isPermissionPreviewUnlocked(input: {
  permissionId: RankPermissionId;
  currentRankKey?: RankPermissionRankKey;
  authorityTrust?: number;
}): RankPermissionStatus {
  const permission = getRankPermissionDefinition(input.permissionId);
  const currentRank = getRankPermissionRankDefinition(
    input.currentRankKey ?? resolveRankByAuthorityTrust(input.authorityTrust),
  );
  if (!permission || !currentRank) return 'future';

  const requiredOrder = getRankPermissionOrder(permission.requiredRankKey);
  if (requiredOrder < currentRank.order) return 'unlocked';
  if (requiredOrder === currentRank.order) return 'current';
  if (requiredOrder === currentRank.order + 1) return 'next';
  return 'future';
}

export function getCurrentRankPermissionBundle(input: {
  currentRankKey?: RankPermissionRankKey;
  authorityTrust?: number;
  xp?: number;
  currentTitle?: string;
}): RankPermissionBundle {
  const rankKey = input.currentRankKey ?? resolveRankByAuthorityTrust(input.authorityTrust);
  const currentRank = getRankPermissionRankDefinition(rankKey) ?? RANK_PERMISSION_RANKS[0]!;
  const nextRank = getNextRank(currentRank);

  const unlockedPermissions: RankPermissionUiItem[] = [];
  const nextPermissions: RankPermissionUiItem[] = [];
  const futurePermissions: RankPermissionUiItem[] = [];

  for (const permission of RANK_PERMISSION_DEFINITIONS) {
    const status = isPermissionPreviewUnlocked({
      permissionId: permission.id,
      currentRankKey: currentRank.rankKey,
      authorityTrust: input.authorityTrust,
    });
    const item = buildUiItem(permission, status);
    if (status === 'unlocked' || status === 'current') {
      unlockedPermissions.push(item);
    } else if (status === 'next') {
      nextPermissions.push(item);
    } else {
      futurePermissions.push(item);
    }
  }

  const sortByPriority = (a: RankPermissionUiItem, b: RankPermissionUiItem) =>
    (getRankPermissionDefinition(a.id)?.playerFacingPriority ?? 999) -
    (getRankPermissionDefinition(b.id)?.playerFacingPriority ?? 999);

  return {
    currentRank,
    nextRank,
    unlockedPermissions: unlockedPermissions.sort(sortByPriority),
    nextPermissions: nextPermissions.sort(sortByPriority),
    futurePermissions: futurePermissions.sort(sortByPriority),
  };
}

export function validateRankPermissionMatrixReferences(): string[] {
  const errors: string[] = [];
  const permissionIds = new Set(RANK_PERMISSION_DEFINITIONS.map((permission) => permission.id));
  for (const id of REQUIRED_RANK_PERMISSION_IDS) {
    if (!permissionIds.has(id)) {
      errors.push(`Missing required permission definition: ${id}`);
    }
  }
  for (const rank of RANK_PERMISSION_RANKS) {
    for (const id of rank.permissionIds) {
      if (!permissionIds.has(id)) {
        errors.push(`Rank ${rank.rankKey} references missing permission ${id}`);
      }
    }
  }
  return errors;
}
