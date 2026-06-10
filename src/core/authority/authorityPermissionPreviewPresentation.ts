import type { RankPermissionCategory, RankPermissionId } from '@/core/rankPermissions/rankPermissionTypes';
import { getRankPermissionDefinition, getRankPermissionRankDefinition } from '@/core/rankPermissions/rankPermissionMatrix';

import type {
  AuthorityPermissionCategory,
  AuthorityPermissionImportance,
  AuthorityPermissionPreviewState,
} from './authorityPermissionPreviewTypes';

export const AUTHORITY_PERMISSION_CATEGORY_ORDER: AuthorityPermissionCategory[] = [
  'operations',
  'map',
  'districts',
  'resources',
  'advisor',
  'reports',
  'crisis',
  'story',
  'progression',
];

export const AUTHORITY_PERMISSION_CATEGORY_LABELS: Record<AuthorityPermissionCategory, string> = {
  operations: 'Operasyon',
  map: 'Harita',
  districts: 'Mahalleler',
  resources: 'Kaynaklar',
  advisor: 'Ece',
  reports: 'Raporlar',
  crisis: 'Kriz',
  story: 'Şehir Hafızası',
  progression: 'Kariyer',
};

export const AUTHORITY_PERMISSION_CATEGORY_SUBTITLES: Record<AuthorityPermissionCategory, string> = {
  operations: 'Ana operasyon, plan ve görev derinliği',
  map: 'Harita katmanları ve saha görünürlüğü',
  districts: 'Mahalle güveni ve bölgesel açılım',
  resources: 'Personel, araç ve konteyner dengesi',
  advisor: 'Ece yorumu ve danışmanlık derinliği',
  reports: 'Gün sonu, risk ve arşiv yüzeyleri',
  crisis: 'Kriz masası ve müdahale önceliği',
  story: 'Story chain ve uzun vadeli izler',
  progression: 'Yetki, rozet ve kariyer vitrini',
};

export const AUTHORITY_PERMISSION_STATE_PILLS: Record<AuthorityPermissionPreviewState, string> = {
  active: 'Açık',
  next: 'Sıradaki',
  locked: 'Kilitli',
};

export const AUTHORITY_PERMISSION_REASON_LABELS: Record<AuthorityPermissionPreviewState, string> = {
  active: 'Mevcut yetkinde açık',
  next: 'Bir sonraki yetkide açılır',
  locked: 'İleri yetkide açılır',
};

export const AUTHORITY_PERMISSION_PREVIEW_EMPTY = {
  title: 'Yetki izinleri hazırlanıyor',
  body: 'Yetki ilerledikçe yeni operasyon araçları burada görünür olacak.',
} as const;

export const AUTHORITY_PERMISSION_PREVIEW_HUB_LINE_PREFIX = 'Sıradaki izin:';
export const AUTHORITY_PERMISSION_PREVIEW_PROFILE_CTA = 'İzinleri gör';

const CATEGORY_MAP: Record<RankPermissionCategory, AuthorityPermissionCategory> = {
  core_operation: 'operations',
  planning: 'operations',
  assignment: 'operations',
  map_layer: 'map',
  district: 'districts',
  resource: 'resources',
  crisis: 'crisis',
  advisor: 'advisor',
  event_content: 'story',
  operation_era: 'progression',
  city_development: 'story',
};

const CATEGORY_OVERRIDES: Partial<Record<RankPermissionId, AuthorityPermissionCategory>> = {
  inspect_basic_events: 'reports',
  daily_plan_preview: 'operations',
  resource_pressure_summary: 'resources',
  mini_story_chain_preview: 'story',
  reward_recovery_event_preview: 'progression',
  city_development_preview: 'progression',
};

const SYSTEM_TAGS: Record<AuthorityPermissionCategory, string> = {
  operations: 'Operasyon kararları',
  map: 'Harita katmanı',
  districts: 'Mahalle sistemi',
  resources: 'Kaynak yönetimi',
  advisor: 'Danışman (Ece)',
  reports: 'Rapor & arşiv',
  crisis: 'Kriz yönetimi',
  story: 'Şehir hafızası',
  progression: 'Kariyer progression',
};

const PLAYER_BENEFITS: Partial<Record<RankPermissionId, string>> = {
  inspect_basic_events: 'Kararların etkisini gün sonunda daha erken okursun.',
  daily_plan_preview: 'Sabah planını görerek günü daha bilinçli açarsın.',
  assignment_fit_preview: 'Ekip ve araç uyumunu görev öncesi değerlendirirsin.',
  resource_pressure_summary: 'Kaynak baskısını operasyon öncesi görürsün.',
  district_trust_preview: 'Kararların sosyal etkisini daha erken görürsün.',
  district_memory_trace_preview: 'Mahallede bıraktığın izi takip edersin.',
  district_specific_operations_preview: 'Mahalle karakterine uygun gündem görürsün.',
  map_resource_layer: 'Kaynak baskısını haritada okursun.',
  map_social_layer: 'Sosyal nabzı harita katmanında izlersin.',
  map_crisis_layer: 'Kriz riskini haritada önceliklendirirsin.',
  map_trust_layer: 'Mahalle güvenini haritada karşılaştırırsın.',
  event_family_rotation_preview: 'Benzer olayların dengeli gelişini görürsün.',
  mini_story_chain_preview: 'Kararların kısa olay zincirlerine bağlanır.',
  player_adaptive_event_preview: 'Olay ağırlıkları tarzına göre şekillenir.',
  reward_recovery_event_preview: 'Zor dönem sonrası toparlanma fırsatını görürsün.',
  team_specialization_preview: 'Ekiplerin güçlü alanlarını bilinçli kullanırsın.',
  vehicle_maintenance_window_preview: 'Filo yorgunluğunu planlı yönetirsin.',
  container_network_upgrade_preview: 'Konteyner hattı fırsatlarını erken görürsün.',
  advisor_specialist_notes_preview: 'Ece uzmanlık notlarıyla riski önceden okursun.',
  operation_era_preview: 'Yeni operasyon dönemlerine hazırlıklı girersin.',
  city_development_preview: 'Uzun vadeli şehir gelişimini takip edersin.',
  department_units_preview: 'Büyük operasyon zincirlerine stratejik hazırlanırsın.',
};

const NEXT_MOTIVATION =
  'Terfiyle birlikte operasyon derinliği ve şehir tepkisi güçlenir.';

export function mapRankPermissionToShowcaseCategory(
  permissionId: RankPermissionId,
  category: RankPermissionCategory,
): AuthorityPermissionCategory {
  return CATEGORY_OVERRIDES[permissionId] ?? CATEGORY_MAP[category] ?? 'operations';
}

export function buildAuthorityPermissionCategoryLabel(
  category: AuthorityPermissionCategory,
): string {
  return AUTHORITY_PERMISSION_CATEGORY_LABELS[category] ?? 'Operasyon';
}

export function buildAuthorityPermissionStatePill(
  state: AuthorityPermissionPreviewState,
): string {
  return AUTHORITY_PERMISSION_STATE_PILLS[state];
}

export function buildAuthorityPermissionReasonLabel(
  state: AuthorityPermissionPreviewState,
): string {
  return AUTHORITY_PERMISSION_REASON_LABELS[state];
}

export function buildAuthorityPermissionSystemTag(
  category: AuthorityPermissionCategory,
): string {
  return SYSTEM_TAGS[category];
}

export function buildAuthorityPermissionPlayerBenefit(
  permissionId: RankPermissionId,
  state: AuthorityPermissionPreviewState,
): string {
  const custom = PLAYER_BENEFITS[permissionId];
  if (custom) {
    return custom;
  }
  if (state === 'next') {
    return 'Bir sonraki terfiyle operasyon araçların genişler.';
  }
  if (state === 'locked') {
    return 'İleri yetkide daha karmaşık şehir kararlarını yönetirsin.';
  }
  return 'Mevcut yetkinle bu sistemi bugün kullanabilirsin.';
}

export function buildAuthorityPermissionUnlockRankTitle(
  permissionId: RankPermissionId,
): string | undefined {
  const definition = getRankPermissionDefinition(permissionId);
  if (!definition) {
    return undefined;
  }
  return getRankPermissionRankDefinition(definition.requiredRankKey)?.title;
}

export function resolveAuthorityPermissionImportance(
  playerFacingPriority: number,
): AuthorityPermissionImportance {
  if (playerFacingPriority <= 12) {
    return 'major';
  }
  if (playerFacingPriority <= 22) {
    return 'standard';
  }
  return 'minor';
}

export function buildAuthorityPermissionPreviewHeadline(
  activeCount: number,
  hasNextUnlock: boolean,
): string {
  if (activeCount === 0) {
    return AUTHORITY_PERMISSION_PREVIEW_EMPTY.title;
  }
  if (hasNextUnlock) {
    return 'Bir sonraki terfi yeni operasyon araçları açacak';
  }
  if (activeCount >= 8) {
    return 'Yetkin genişledikçe şehir daha fazla tepki verir';
  }
  return 'Saha kontrolün büyüyor';
}

export function buildAuthorityPermissionPreviewSubline(activeCount: number): string {
  if (activeCount === 0) {
    return AUTHORITY_PERMISSION_PREVIEW_EMPTY.body;
  }
  if (activeCount < 4) {
    return 'Açılan izinler bugün kullanabildiğin sistemleri, sıradakiler ise yaklaşan terfinin etkisini gösterir.';
  }
  return 'Yetki seviyesi yalnızca unvan değildir; harita, rapor, danışman ve operasyon derinliğini etkiler.';
}

export function buildAuthorityPermissionPrestigeLabel(
  activeCount: number,
  progressRatio: number,
): string {
  if (activeCount === 0) {
    return 'Yetki yolculuğu başlıyor';
  }
  if (progressRatio >= 0.75) {
    return 'Terfi eşiğine yakınsın';
  }
  if (activeCount >= 6) {
    return 'Genişleyen operasyon yetkisi';
  }
  return 'Açılan ilk izinler aktif';
}

export function buildAuthorityPermissionPromotionHint(
  nextRankTitle?: string,
  nextItemTitle?: string,
): string | undefined {
  if (!nextRankTitle || !nextItemTitle) {
    return undefined;
  }
  return `${nextRankTitle} olduğunda ${nextItemTitle} ${NEXT_MOTIVATION}`;
}

export function buildAuthorityPermissionDetailBody(
  state: AuthorityPermissionPreviewState,
  description: string,
  playerBenefit: string,
  unlockRankTitle?: string,
): string {
  const parts = [description, playerBenefit];
  if (state !== 'active' && unlockRankTitle) {
    parts.push(`${unlockRankTitle} seviyesinde görünür olur.`);
  }
  return parts.join(' ');
}
