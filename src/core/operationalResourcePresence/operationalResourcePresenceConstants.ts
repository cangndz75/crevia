import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';

import type {
  TeamGroupKind,
  TeamGroupStatus,
  VehicleGroupKind,
  VehicleGroupStatus,
} from './operationalResourcePresenceTypes';

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_COPY_LENGTH = 96;

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_MAX_VISIBLE_GROUPS = 4;

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_HUB_MAX_LINES = 2;

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_DETAIL_MAX_LINES = 2;

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_FORBIDDEN_WORDS = [
  'gps',
  'canlı takip',
  'koordinat',
  'plaka',
  'personel adı',
  'tekil araç',
  'pack',
  'metadata',
  'runtime',
  'activation',
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
  'vehicle_route_pack_one',
  'container_environment_pack_one',
  'district_pack_one',
] as const;

export const TEAM_GROUP_DEFINITIONS: Record<
  TeamGroupKind,
  { label: string; iconKey: string; fallbackLine: string }
> = {
  cleanup_team: {
    label: 'Temizlik Ekibi',
    iconKey: 'leaf',
    fallbackLine: 'Temizlik ekibi günlük hizmet temposunu destekliyor.',
  },
  route_team: {
    label: 'Rota Destek Ekibi',
    iconKey: 'navigate',
    fallbackLine: 'Rota destek ekibi hat dengesini izliyor.',
  },
  container_team: {
    label: 'Konteyner Ekibi',
    iconKey: 'factory',
    fallbackLine: 'Konteyner ekibi görünür hizmet etkisini destekliyor.',
  },
  support_team: {
    label: 'Saha Destek Ekibi',
    iconKey: 'megaphone',
    fallbackLine: 'Saha destek ekibi mahalle temposunu dengelemeye çalışıyor.',
  },
  rapid_response_team: {
    label: 'Hızlı Müdahale Ekibi',
    iconKey: 'flash',
    fallbackLine: 'Hızlı müdahale ekibi hazır, tempo izleniyor.',
  },
  coordination_team: {
    label: 'Koordinasyon Ekibi',
    iconKey: 'people',
    fallbackLine: 'Koordinasyon ekibi saha akışını bir arada tutuyor.',
  },
};

export const VEHICLE_GROUP_DEFINITIONS: Record<
  VehicleGroupKind,
  { label: string; iconKey: string; fallbackLine: string }
> = {
  light_service_vehicle: {
    label: 'Hafif Hizmet Araçları',
    iconKey: 'bus',
    fallbackLine: 'Hafif hizmet araçlarında yorgunluk düşük.',
  },
  route_support_vehicle: {
    label: 'Rota Destek Araçları',
    iconKey: 'navigate',
    fallbackLine: 'Rota destek araçları hat dengesini taşıyor.',
  },
  container_vehicle: {
    label: 'Konteyner Aracı Grubu',
    iconKey: 'cube',
    fallbackLine: 'Konteyner aracı grubu çevresel hizmeti destekliyor.',
  },
  field_support_vehicle: {
    label: 'Saha Destek Araçları',
    iconKey: 'construct',
    fallbackLine: 'Saha destek araçları günlük kapasiteyi tamamlıyor.',
  },
  maintenance_watch_vehicle: {
    label: 'Bakım İzleme Grubu',
    iconKey: 'build',
    fallbackLine: 'Bakım izleme sürüyor; kapasite yeterli görünüyor.',
  },
};

export const TEAM_GROUP_STATUS_LABELS: Record<TeamGroupStatus, string> = {
  ready: 'Hazır',
  assigned: 'Sahada',
  busy: 'Yoğun',
  fatigued: 'Yorgunluk izleniyor',
  recovering: 'Toparlanıyor',
  watch: 'İzleme notunda',
};

export const VEHICLE_GROUP_STATUS_LABELS: Record<VehicleGroupStatus, string> = {
  ready: 'Hazır',
  assigned: 'Sahada',
  route_pressure: 'Rota baskısı',
  fatigue_watch: 'Yorgunluk izleniyor',
  maintenance_watch: 'Bakım izleme',
  limited: 'Sınırlı kapasite',
};

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_DISTRICT_LABELS: Record<MapDistrictId, string> = {
  merkez: 'Merkez',
  cumhuriyet: 'Cumhuriyet',
  sanayi: 'Sanayi',
  istasyon: 'İstasyon',
  yesilvadi: 'Yeşilvadi',
};

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_FALLBACK_LINE =
  'Saha kapasitesi dengeli; ekip ve araç grupları rutin tempo içinde.';

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_HUB_TITLE = 'Saha Kaynakları';

export const OPERATIONAL_RESOURCE_PRESENCE_LITE_HUB_CTA = 'Kaynakları Gör';

export const TEAM_GROUP_ORDER: TeamGroupKind[] = [
  'route_team',
  'cleanup_team',
  'container_team',
  'rapid_response_team',
  'support_team',
  'coordination_team',
];

export const VEHICLE_GROUP_ORDER: VehicleGroupKind[] = [
  'route_support_vehicle',
  'light_service_vehicle',
  'container_vehicle',
  'field_support_vehicle',
  'maintenance_watch_vehicle',
];

export const OPERATIONAL_RESOURCE_PRESENCE_SIGNAL_STATUS_WEIGHT: Record<string, number> = {
  critical: 4,
  strained: 3,
  watch: 2,
  busy: 1,
  stable: 0,
};
