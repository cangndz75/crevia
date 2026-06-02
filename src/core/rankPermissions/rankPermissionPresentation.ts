import {
  RANK_PERMISSION_FORBIDDEN_COPY_TERMS,
} from './rankPermissionConstants';
import {
  getCurrentRankPermissionBundle,
  getRankPermissionDefinition,
  resolveRankKeyFromAuthorityState,
} from './rankPermissionMatrix';
import type {
  RankPermissionCategory,
  RankPermissionId,
  RankPermissionPreviewModel,
  RankPermissionStatus,
  RankPermissionUiItem,
} from './rankPermissionTypes';

export type BuildRankPermissionPreviewInput = {
  authorityState?: unknown;
  xp?: number;
  currentTitle?: string;
  compact?: boolean;
};

const CATEGORY_LABELS: Record<RankPermissionCategory, string> = {
  core_operation: 'Operasyon',
  planning: 'Planlama',
  assignment: 'Yönlendirme',
  map_layer: 'Harita Katmanı',
  district: 'Mahalle',
  resource: 'Kaynak',
  crisis: 'Kriz',
  advisor: 'Ece',
  event_content: 'Olay İçeriği',
  operation_era: 'Operasyon Dönemi',
  city_development: 'Şehir Gelişimi',
};

const STATUS_LABELS: Record<RankPermissionStatus, string> = {
  unlocked: 'Açık',
  current: 'Aktif',
  next: 'Sırada',
  locked: 'Yetkiyle açılır',
  future: 'İleride',
};

const SHORT_DESCRIPTIONS: Record<RankPermissionId, string> = {
  inspect_basic_events: 'Olay bağlamı ve karar etkisi raporda görünür olur.',
  daily_plan_preview: 'Sabah planı ve operasyon odağı daha erken anlatılır.',
  assignment_fit_preview: 'Ekip, araç ve karar uyumu görev öncesi görünür.',
  resource_pressure_summary: 'Filo, personel ve konteyner baskısı kısa özetlenir.',
  district_trust_preview: 'Mahalle güveni karar etkisine bağlanır.',
  district_memory_trace_preview: 'Önceki kararların mahallede bıraktığı iz görünür.',
  district_specific_operations_preview: 'Mahalle karakterine özel operasyon gündemi görünür.',
  map_resource_layer: 'Kaynak baskısı harita üzerinde özetlenir.',
  map_social_layer: 'Sosyal nabız haritada ayrı katman olur.',
  map_crisis_layer: 'Kriz riski haritada operasyon önceliği olur.',
  map_trust_layer: 'Mahalle güveni haritada karşılaştırmalı görünür.',
  event_family_rotation_preview: 'Benzer olay tipleri dengeli döngüyle gelir.',
  mini_story_chain_preview: 'Kararlar kısa olay zincirlerine bağlanır.',
  player_adaptive_event_preview: 'Olay ağırlıkları karar tarzına göre şekillenir.',
  reward_recovery_event_preview: 'Zor dönem sonrası geri dönüş fırsatı işaretlenir.',
  team_specialization_preview: 'Ekiplerin güçlü operasyon türleri görünür.',
  vehicle_maintenance_window_preview: 'Filo yorgunluğu ve bakım zamanı işaretlenir.',
  container_network_upgrade_preview: 'Konteyner hattı geliştirme fırsatları görünür.',
  advisor_specialist_notes_preview: 'Ece kısa uzmanlık notlarıyla sıradaki riski açıklar.',
  operation_era_preview: 'Yeni tema ve kapsam dönemleri kariyere bağlanır.',
  city_development_preview: 'Uzun dönem şehir gelişimi kararlarla bağlanır.',
  department_units_preview: 'Departman yönetimi büyük operasyon zincirine hazırlanır.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readAuthorityTrust(authorityState: unknown): number | undefined {
  if (!isRecord(authorityState)) return undefined;
  const value = authorityState.authorityTrust;
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function pickPrimaryCategory(items: readonly RankPermissionUiItem[]): RankPermissionCategory {
  return items[0]?.category ?? 'core_operation';
}

function buildAxisLine(item: RankPermissionUiItem | undefined): string {
  if (!item) {
    return 'Operasyon kariyerinde sıradaki açılım yetki ve ünvan ilerlemesiyle görünür olur.';
  }
  const permission = getRankPermissionDefinition(item.id);
  switch (permission?.unlockAxis) {
    case 'resource_stability':
      return `${item.title} kaynak istikrarı ile güçlenir.`;
    case 'district_trust':
      return `${item.title} mahalle güveniyle açılır.`;
    case 'crisis_control':
      return `${item.title} kriz kontrolü güçlendikçe gündeme gelir.`;
    case 'operation_era':
      return `${item.title} operasyon dönemi ilerledikçe gündeme gelir.`;
    case 'xp':
      return `${item.title} XP ve oyuncu tarzı ilerledikçe gündeme gelir.`;
    case 'rank':
      return `${item.title} bir sonraki ünvanla gündeme gelir.`;
    case 'authority':
    default:
      return `${item.title} yetkiyle açılır.`;
  }
}

export function buildPermissionCategoryLabel(category: RankPermissionCategory): string {
  return CATEGORY_LABELS[category] ?? 'Operasyon';
}

export function buildPermissionStatusLabel(status: RankPermissionStatus): string {
  return STATUS_LABELS[status] ?? 'Yetkiyle açılır';
}

export function buildPermissionShortDescription(permissionId: RankPermissionId): string {
  return SHORT_DESCRIPTIONS[permissionId] ?? 'Operasyon kariyerinde yeni kapsam açar.';
}

function withShortDescriptions(items: RankPermissionUiItem[]): RankPermissionUiItem[] {
  return items.map((item) => ({
    ...item,
    description: buildPermissionShortDescription(item.id),
  }));
}

export function buildRankPermissionPreviewModel(
  input: BuildRankPermissionPreviewInput = {},
): RankPermissionPreviewModel {
  const currentRankKey = resolveRankKeyFromAuthorityState(input.authorityState);
  const authorityTrust = readAuthorityTrust(input.authorityState);
  const bundle = getCurrentRankPermissionBundle({
    currentRankKey,
    authorityTrust,
    xp: input.xp,
    currentTitle: input.currentTitle,
  });
  const unlockedPermissions = withShortDescriptions(bundle.unlockedPermissions);
  const nextPermissions = withShortDescriptions(bundle.nextPermissions);
  const futurePermissions = withShortDescriptions(bundle.futurePermissions);
  const compactItems = nextPermissions.slice(0, 3);
  const nextTitle = bundle.nextRank?.title ?? 'Uzun Vadeli Operasyon Kariyeri';

  return {
    ...bundle,
    unlockedPermissions,
    nextPermissions,
    futurePermissions,
    progressLine: `${bundle.currentRank.title}: ${bundle.currentRank.summary}`,
    nextUnlockLine: compactItems.length > 0
      ? `${nextTitle} olduğunda ${compactItems[0]!.title} sırada.`
      : 'Operasyon kariyerinde yeni açılımlar dönemsel performansla genişler.',
    primaryCategoryFocus: pickPrimaryCategory(compactItems.length > 0 ? compactItems : unlockedPermissions),
    compactItems,
  };
}

export function buildCompactRankUnlockLine(
  input: BuildRankPermissionPreviewInput = {},
): string {
  const model = buildRankPermissionPreviewModel(input);
  const item = model.compactItems[0] ?? model.futurePermissions[0];
  if (!model.nextRank || !item) {
    return 'Operasyon kariyerinde yeni yetkiler authority, XP ve kaynak istikrarıyla genişler.';
  }
  return `${model.nextRank.title} olduğunda ${item.title} görünür olacak.`;
}

export function buildNextPermissionChips(
  input: BuildRankPermissionPreviewInput = {},
): RankPermissionUiItem[] {
  return buildRankPermissionPreviewModel(input).compactItems.slice(0, 3);
}

export function buildRankPermissionAxisLine(
  input: BuildRankPermissionPreviewInput = {},
): string {
  const model = buildRankPermissionPreviewModel(input);
  return buildAxisLine(model.compactItems[0] ?? model.futurePermissions[0]);
}

export function containsForbiddenRankPermissionCopy(text: string): boolean {
  const normalized = text.toLocaleLowerCase('tr-TR');
  return RANK_PERMISSION_FORBIDDEN_COPY_TERMS.some((term) =>
    normalized.includes(term.toLocaleLowerCase('tr-TR')),
  );
}
