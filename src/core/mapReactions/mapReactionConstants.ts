import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  MapDistrictReactionKind,
  MapDistrictReactionPulseStyle,
  MapDistrictReactionTone,
} from './mapReactionTypes';

export const MAP_REACTION_LITE_DISTRICT_IDS: readonly MapDistrictId[] = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;

export const MAP_REACTION_LITE_MAX_COPY_LENGTH = 88;

export const MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_COMPACT = 1;
export const MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_EARLY = 3;
export const MAP_REACTION_LITE_MAX_VISIBLE_REACTIONS_STANDARD_LATE = 4;

export const MAP_REACTION_LITE_FORBIDDEN_WORDS = [
  'pack',
  'metadata',
  'runtime',
  'activation',
  'candidate',
  'variant',
  'premium',
  'kilitli',
  'satın al',
  'kaçırma',
  'ödül kazan',
  'başarısız oldun',
  'panik',
  'felaket',
  'viral',
  'trend oldu',
  'gps',
  'canlı takip',
  'koordinat',
  'plaka',
  'personel adı',
  'tekil araç',
  'vehicle_route_pack_one',
  'container_environment_pack_one',
  'district_pack_one',
] as const;

export const MAP_REACTION_KIND_LABELS: Record<MapDistrictReactionKind, string> = {
  trust_pulse: 'Güven nabzı',
  risk_ring: 'İzleme halkası',
  recovery_glow: 'Toparlanma',
  social_bubble: 'Sosyal iz',
  route_pressure_marker: 'Rota baskısı',
  container_pressure_marker: 'Konteyner izi',
  resource_fatigue_marker: 'Kaynak yorgunluğu',
  resource_presence_marker: 'Saha kapasitesi',
  team_capacity_marker: 'Ekip temposu',
  vehicle_capacity_marker: 'Araç kapasitesi',
  crisis_watch_ring: 'Kriz izleme',
  operation_scope_marker: 'Operasyon kapsamı',
  journal_trace: 'Günlük izi',
  content_pack_marker: 'Operasyon odağı',
  active_route_hint: 'Aktif rota',
  fallback: 'Mahalle dengesi',
};

export const MAP_REACTION_KIND_PULSE: Record<MapDistrictReactionKind, MapDistrictReactionPulseStyle> = {
  trust_pulse: 'soft',
  risk_ring: 'ring',
  recovery_glow: 'glow',
  social_bubble: 'bubble',
  route_pressure_marker: 'ring',
  container_pressure_marker: 'ring',
  resource_fatigue_marker: 'soft',
  resource_presence_marker: 'soft',
  team_capacity_marker: 'soft',
  vehicle_capacity_marker: 'ring',
  crisis_watch_ring: 'ring',
  operation_scope_marker: 'glow',
  journal_trace: 'bubble',
  content_pack_marker: 'soft',
  active_route_hint: 'soft',
  fallback: 'none',
};

export const MAP_REACTION_KIND_TONE: Record<MapDistrictReactionKind, MapDistrictReactionTone> = {
  trust_pulse: 'positive',
  risk_ring: 'risk',
  recovery_glow: 'recovery',
  social_bubble: 'positive',
  route_pressure_marker: 'watch',
  container_pressure_marker: 'watch',
  resource_fatigue_marker: 'watch',
  resource_presence_marker: 'operation',
  team_capacity_marker: 'operation',
  vehicle_capacity_marker: 'operation',
  crisis_watch_ring: 'watch',
  operation_scope_marker: 'operation',
  journal_trace: 'neutral',
  content_pack_marker: 'operation',
  active_route_hint: 'neutral',
  fallback: 'neutral',
};

export const MAP_REACTION_KIND_ICON: Record<MapDistrictReactionKind, string> = {
  trust_pulse: 'heart-outline',
  risk_ring: 'alert-circle-outline',
  recovery_glow: 'sunny-outline',
  social_bubble: 'chatbubble-outline',
  route_pressure_marker: 'navigate-outline',
  container_pressure_marker: 'cube-outline',
  resource_fatigue_marker: 'battery-half-outline',
  resource_presence_marker: 'people-outline',
  team_capacity_marker: 'walk-outline',
  vehicle_capacity_marker: 'bus-outline',
  crisis_watch_ring: 'shield-outline',
  operation_scope_marker: 'map-outline',
  journal_trace: 'book-outline',
  content_pack_marker: 'flag-outline',
  active_route_hint: 'git-branch-outline',
  fallback: 'location-outline',
};

export const MAP_REACTION_LITE_DISTRICT_LABELS: Record<MapDistrictId, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

export const MAP_REACTION_LITE_DISTRICT_FALLBACK_LINES: Record<MapDistrictId, string> = {
  merkez: 'Merkez koordinasyon hattı sakin tempo içinde.',
  cumhuriyet: 'Cumhuriyet çevresi günlük operasyon izinde.',
  sanayi: 'Sanayi hattı rutin tempo içinde.',
  istasyon: 'İstasyon aktarma hattı dengeli.',
  yesilvadi: 'Yeşilvadi çevre hattı sakin.',
};

export const MAP_REACTION_LITE_FALLBACK_GLOBAL =
  'Harita sakin; seçili mahallede küçük operasyon izleri görünebilir.';

export const MAP_REACTION_SIGNAL_STATUS_WEIGHT: Record<string, number> = {
  critical: 4,
  strained: 3,
  watch: 2,
  busy: 1,
  stable: 0,
};

export const MAP_REACTION_KIND_PRIORITY_SCORE: Record<MapDistrictReactionKind, number> = {
  crisis_watch_ring: 100,
  risk_ring: 95,
  route_pressure_marker: 90,
  vehicle_capacity_marker: 88,
  team_capacity_marker: 86,
  resource_fatigue_marker: 84,
  resource_presence_marker: 82,
  container_pressure_marker: 80,
  active_route_hint: 78,
  operation_scope_marker: 76,
  content_pack_marker: 74,
  journal_trace: 72,
  social_bubble: 70,
  trust_pulse: 68,
  recovery_glow: 66,
  fallback: 10,
};
