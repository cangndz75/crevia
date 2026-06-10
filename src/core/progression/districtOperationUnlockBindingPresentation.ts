import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { MainOperationDistrictStatus } from '@/core/mainOperation/mainOperationTypes';
import { AUTHORITY_RANK_BY_ID } from '@/core/authority/authorityConstants';
import type { AuthorityRankId } from '@/core/authority/authorityTypes';
import type { CreviaDistrictTrustBand } from '@/core/districtTrustRuntime/districtTrustRuntimeTypes';
import type { ProgressionUnlockPreviewStatus } from '@/core/progression/progressionTypes';

import type {
  DistrictUnlockBindingState,
  DistrictUnlockDistrictKind,
  DistrictUnlockPresentationCategory,
  DistrictUnlockRelatedSystem,
} from './districtOperationUnlockBindingTypes';

export const DISTRICT_UNLOCK_CATEGORY_ORDER: Array<
  DistrictUnlockPresentationCategory | 'city_expansion'
> = [
  'pilot_area',
  'trust_sensitive',
  'resource_pressure',
  'crisis_ready',
  'map_expansion',
  'main_operation',
  'city_memory',
];

export const DISTRICT_UNLOCK_CATEGORY_LABELS: Record<
  DistrictUnlockPresentationCategory | 'city_expansion',
  string
> = {
  pilot_area: 'Pilot Bölge',
  trust_sensitive: 'Güven Hassas',
  resource_pressure: 'Kaynak Baskısı',
  crisis_ready: 'Kriz Müdahale',
  map_expansion: 'Harita Açılımları',
  main_operation: 'Ana Operasyon',
  city_memory: 'Şehir Hafızası',
  city_expansion: 'Şehir Açılımı',
};

export const DISTRICT_UNLOCK_CATEGORY_SUBTITLES: Record<
  DistrictUnlockPresentationCategory | 'city_expansion',
  string
> = {
  pilot_area: 'İlk saha kararlarının izlendiği alan',
  trust_sensitive: 'Sosyal nabız ve güven sinyali yoğun mahalleler',
  resource_pressure: 'Kaynak ve lojistik baskısı alanları',
  crisis_ready: 'Kriz müdahale önceliği yüksek bölgeler',
  map_expansion: 'Harita katmanlarıyla birlikte açılan alanlar',
  main_operation: 'Ana operasyon hattına bağlı kapsam',
  city_memory: 'Uzun vadeli karar izleri',
  city_expansion: 'Yetki ve operasyonla birlikte genişleyen şehir',
};

export const DISTRICT_UNLOCK_STATE_PILLS: Record<DistrictUnlockBindingState, string> = {
  active: 'Aktif',
  next: 'Sıradaki',
  locked: 'Kilitli',
};

export const DISTRICT_UNLOCK_EMPTY_STATE = {
  title: 'Şehir açılımları hazırlanıyor',
  body: 'Yetki ilerledikçe mahalle bağları ve ana operasyon kapsamı burada görünür olacak.',
} as const;

export const DISTRICT_UNLOCK_HUB_LINE_PREFIX = 'Sıradaki açılım:';
export const DISTRICT_UNLOCK_PROFILE_CTA = 'Açılımları gör';

const DISTRICT_KIND_MAP: Record<MapDistrictId, DistrictUnlockDistrictKind> = {
  merkez: 'central',
  cumhuriyet: 'residential',
  sanayi: 'industrial',
  istasyon: 'commercial',
  yesilvadi: 'coastal',
};

const DISTRICT_CATEGORY_MAP: Record<MapDistrictId, DistrictUnlockPresentationCategory> = {
  merkez: 'pilot_area',
  cumhuriyet: 'trust_sensitive',
  sanayi: 'resource_pressure',
  istasyon: 'crisis_ready',
  yesilvadi: 'city_memory',
};

const DISTRICT_DISPLAY_TITLES: Record<MapDistrictId, string> = {
  merkez: 'Pilot Bölge',
  cumhuriyet: 'Güven Hassas Mahalle',
  sanayi: 'Kaynak Baskısı Alanı',
  istasyon: 'Geçiş Operasyon Alanı',
  yesilvadi: 'Şehir Hafızası Bölgesi',
};

const DISTRICT_SUBTITLES: Record<MapDistrictId, string> = {
  merkez: 'İlk saha kararlarının etkisi burada izlenir.',
  cumhuriyet: 'Sosyal Nabız kararlarına daha hızlı tepki verir.',
  sanayi: 'Lojistik ve kaynak baskısı burada yoğunlaşır.',
  istasyon: 'Geçiş yoğunluğu ve rota baskısı belirgindir.',
  yesilvadi: 'Uzun vadeli karar izleri burada belirginleşir.',
};

const DISTRICT_BENEFITS: Record<MapDistrictId, string> = {
  merkez: 'Kararlarının güven ve kaynak etkisini erken görürsün.',
  cumhuriyet: 'Kriz öncesi güven risklerini daha erken fark edersin.',
  sanayi: 'Kaynak baskısını operasyon öncesi okursun.',
  istasyon: 'Geçiş ve rota kararlarının etkisini daha net izlersin.',
  yesilvadi: 'Kararların sonraki günlerin anlatısını da etkiler.',
};

const DISTRICT_ACTIVE_HINTS: Record<MapDistrictId, string> = {
  merkez: 'Günlük operasyonları tamamladıkça bu bölgedeki sinyaller güçlenir.',
  cumhuriyet: 'Mahalle güvenini dengede tutarak etkiyi yönetebilirsin.',
  sanayi: 'Rota ve kaynak kararları bu bölgede daha görünür olur.',
  istasyon: 'Geçiş saatlerindeki kararlar hızlı yankı bulur.',
  yesilvadi: 'Sakin tempo burada uzun vadeli iz bırakır.',
};

const DISTRICT_NEXT_HINTS: Record<MapDistrictId, string> = {
  merkez: 'Pilot kararları tamamlandıkça merkez kapsamı güçlenir.',
  cumhuriyet: 'Güven sinyallerini dengede tutarak yaklaşabilirsin.',
  sanayi: 'Ana operasyon ilerledikçe sanayi hattı aktifleşir.',
  istasyon: 'Yetki eşiği ve ana operasyon ilerlemesiyle yaklaşır.',
  yesilvadi: 'Şehir hafızası ve operasyon derinliği arttıkça açılır.',
};

const DISTRICT_LOCKED_HINTS: Record<MapDistrictId, string> = {
  merkez: 'Pilot bölge zaten erken açılır.',
  cumhuriyet: 'Güven izleme derinleştikçe görünür olur.',
  sanayi: 'Kaynak baskısı operasyonları derinleşince açılır.',
  istasyon: 'İstasyon kapsamı yetki ve ana operasyonla birlikte gelir.',
  yesilvadi: 'Story chain ve city archive etkileri güçlendikçe görünür olur.',
};

const DISTRICT_SYSTEMS_FIXED: Record<MapDistrictId, DistrictUnlockRelatedSystem[]> = {
  merkez: ['district_trust', 'main_operations', 'reports', 'map_layers'],
  cumhuriyet: ['district_trust', 'district_operations', 'advisor', 'reports'],
  sanayi: ['district_operations', 'map_layers', 'main_operations', 'reports'],
  istasyon: ['main_operations', 'map_layers', 'authority', 'district_operations'],
  yesilvadi: ['story_chains', 'city_archive', 'district_trust', 'reports'],
};

const TRUST_BAND_LABELS: Record<CreviaDistrictTrustBand, string> = {
  fragile: 'Hassas',
  strained: 'Baskı altında',
  watch: 'İzleniyor',
  stable: 'Dengede',
  trusted: 'Güçlü',
  improving: 'Toparlanıyor',
  recovering: 'İyileşiyor',
};

const PROGRESSION_AUTHORITY_REQUIREMENTS: Partial<Record<MapDistrictId, AuthorityRankId>> = {
  istasyon: 'operations_responsible',
  yesilvadi: 'unit_chief',
};

export function mapDistrictIdToKind(districtId: MapDistrictId): DistrictUnlockDistrictKind {
  return DISTRICT_KIND_MAP[districtId] ?? 'unknown';
}

export function mapDistrictIdToCategory(
  districtId: MapDistrictId,
): DistrictUnlockPresentationCategory {
  return DISTRICT_CATEGORY_MAP[districtId] ?? 'pilot_area';
}

export function buildDistrictUnlockTitle(districtId: MapDistrictId): string {
  return DISTRICT_DISPLAY_TITLES[districtId] ?? 'Şehir Açılımı';
}

export function buildDistrictUnlockDetailTitle(districtId: MapDistrictId): string {
  return DISTRICT_DISPLAY_TITLES[districtId] ?? 'Mahalle bağlantısı';
}

export function buildDistrictUnlockStatePill(state: DistrictUnlockBindingState): string {
  return DISTRICT_UNLOCK_STATE_PILLS[state];
}

export function buildDistrictUnlockCategoryLabel(
  category: DistrictUnlockPresentationCategory | 'city_expansion',
): string {
  return DISTRICT_UNLOCK_CATEGORY_LABELS[category] ?? 'Şehir Açılımı';
}

export function buildTrustBandLabel(band?: CreviaDistrictTrustBand): string | undefined {
  if (!band) return undefined;
  return TRUST_BAND_LABELS[band];
}

export function mapMainOperationStatusToBindingState(
  status: MainOperationDistrictStatus,
): DistrictUnlockBindingState {
  if (status === 'active') return 'active';
  if (status === 'agenda' || status === 'preview') return 'next';
  return 'locked';
}

export function mapProgressionPreviewStatusToBindingState(
  status: ProgressionUnlockPreviewStatus,
): DistrictUnlockBindingState {
  if (status === 'completed') return 'active';
  if (status === 'available_preview' || status === 'near') return 'next';
  return 'locked';
}

export function buildDistrictUnlockReason(
  state: DistrictUnlockBindingState,
  districtId: MapDistrictId,
): string {
  if (state === 'active') return 'Mevcut yetkinde açık';
  if (state === 'next') {
    const rankId = PROGRESSION_AUTHORITY_REQUIREMENTS[districtId];
    if (rankId) {
      const label = AUTHORITY_RANK_BY_ID[rankId]?.label ?? 'Sonraki yetki';
      return `${label} eşiğinde görünür olur`;
    }
    return 'Bir sonraki operasyon aşamasında görünür olur';
  }
  return 'İleri operasyon derinliğinde açılır';
}

export function buildDistrictUnlockHint(
  state: DistrictUnlockBindingState,
  districtId: MapDistrictId,
): string {
  if (state === 'active') {
    return DISTRICT_ACTIVE_HINTS[districtId] ?? 'Bu bölgede saha sinyalleri izlenir.';
  }
  if (state === 'next') {
    return DISTRICT_NEXT_HINTS[districtId] ?? 'Yetki ve operasyon ilerlemesiyle yaklaşır.';
  }
  return DISTRICT_LOCKED_HINTS[districtId] ?? 'Operasyon derinleştikçe bu alan yoluna girer.';
}

export function buildDistrictPlayerBenefit(
  state: DistrictUnlockBindingState,
  districtId: MapDistrictId,
): string {
  const base = DISTRICT_BENEFITS[districtId] ?? 'Yeni bölge daha fazla sinyal ve karar derinliği açar.';
  if (state === 'locked') {
    return `${base} İleri aşamada daha karmaşık şehir kararlarına yaklaşırsın.`;
  }
  return base;
}

export function buildDistrictSubtitle(districtId: MapDistrictId): string {
  return DISTRICT_SUBTITLES[districtId] ?? 'Saha etkisi izlenen operasyon alanı.';
}

export function buildDistrictRelatedSystems(districtId: MapDistrictId): DistrictUnlockRelatedSystem[] {
  return DISTRICT_SYSTEMS_FIXED[districtId] ?? ['district_operations'];
}

export function buildDistrictAuthorityRequirementLabel(
  districtId: MapDistrictId,
  state: DistrictUnlockBindingState,
): string | undefined {
  if (state === 'active') return undefined;
  const rankId = PROGRESSION_AUTHORITY_REQUIREMENTS[districtId];
  if (!rankId) return undefined;
  return `Yetki: ${AUTHORITY_RANK_BY_ID[rankId]?.label ?? 'Sonraki seviye'}`;
}

export function buildDistrictOperationRequirementLabel(
  state: DistrictUnlockBindingState,
  isPostPilot: boolean,
): string | undefined {
  if (state === 'active') return undefined;
  if (!isPostPilot) return 'Pilot operasyonları tamamlandıkça yaklaşır';
  return 'Ana operasyon ilerlemesiyle açılır';
}

export function buildDistrictUnlockHeadline(
  activeCount: number,
  hasNext: boolean,
  isPostPilot: boolean,
): string {
  if (activeCount === 0) return DISTRICT_UNLOCK_EMPTY_STATE.title;
  if (hasNext && isPostPilot) return 'Ana operasyonlar şehirde yeni bağlar kurar';
  if (hasNext) return 'Yetkin arttıkça yeni mahalle bağları görünür olur';
  if (activeCount >= 3) return 'Şehir açıldıkça kararların derinleşir';
  return 'Mahalleler yalnızca harita noktası değil, karar hafızasıdır';
}

export function buildDistrictUnlockSubline(activeCount: number): string {
  if (activeCount === 0) return DISTRICT_UNLOCK_EMPTY_STATE.body;
  if (activeCount < 3) {
    return 'Aktif mahalleler bugün etkileyebildiğin alanları, sıradakiler ise yaklaşan şehir açılımını gösterir.';
  }
  return 'Mahalle açılımları yetki, güven, kaynak baskısı ve ana operasyon ilerlemesiyle birlikte görünür olur.';
}

export function buildDistrictUnlockPhaseLabel(
  currentDay: number,
  isPostPilot: boolean,
  accessMode?: string,
): string {
  if (!isPostPilot) return `Pilot · Gün ${currentDay}`;
  if (accessMode === 'full') return 'Ana Operasyon · Tam Kapsam';
  if (accessMode === 'limited') return 'Ana Operasyon · Sınırlı Gündem';
  return `Operasyon · Gün ${currentDay}`;
}

export function buildDistrictUnlockDetailBody(
  state: DistrictUnlockBindingState,
  subtitle: string,
  unlockHint: string,
  playerBenefit: string,
): string {
  return [subtitle, unlockHint, playerBenefit].join(' ');
}
