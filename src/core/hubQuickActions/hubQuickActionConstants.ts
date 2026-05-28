import type {
  HubQuickActionDefinition,
  HubQuickActionId,
} from './hubQuickActionTypes';

export const HUB_QUICK_ACTION_MAX_RECORDS = 12;

/** Saha nöbeti — eşleşen kararlarda küçük başarı bonusu */
export const FIELD_DUTY_SUCCESS_BONUS = 4;

/** Saha nöbeti — eşleşen kararlarda aksaklık riski azaltımı */
export const FIELD_DUTY_RISK_REDUCTION = 2;

/** Rota hazırlığı — eşleşen kararlarda yük artışı azaltımı */
export const ROUTE_PREPARATION_LOAD_REDUCTION = 4;

/** Rota hazırlığı — eşleşen kararlarda operasyon riski azaltımı */
export const ROUTE_PREPARATION_RISK_REDUCTION = 2;

/** Rota hazırlığı — eşleşen kararlarda rota verimliliği bonusu */
export const ROUTE_PREPARATION_ROUTE_BONUS = 4;

/** Mahalle turu — bilgi/keşif avantajı (preview-only, metrik uygulanmaz) */
export const NEIGHBORHOOD_PATROL_INSIGHT_BONUS = 3;

/** Mahalle turu — risk görünürlüğü (preview-only) */
export const NEIGHBORHOOD_PATROL_RISK_VISIBILITY_BONUS = 1;

export const NEIGHBORHOOD_PATROL_FOCUS_VALUES = [
  'container_check',
  'complaint_check',
  'route_check',
  'social_check',
  'general_check',
] as const;

export const NEIGHBORHOOD_PATROL_SOURCE_VALUES = [
  'active_event',
  'container_pressure',
  'social_pressure',
  'vehicle_pressure',
  'fallback',
] as const;

export const NEIGHBORHOOD_PATROL_SIGNAL_TONE_VALUES = [
  'info',
  'warning',
  'positive',
] as const;

export const SOCIAL_RESPONSE_TYPE_VALUES = [
  'clarify',
  'empathize',
  'inform',
  'deescalate',
] as const;

export const SOCIAL_RESPONSE_SOURCE_VALUES = [
  'active_topic',
  'social_pressure',
  'active_event',
  'fallback',
] as const;

export const NEIGHBORHOOD_PATROL_SIGNAL_CATEGORY_VALUES = [
  'container',
  'complaint',
  'route',
  'social',
  'general',
] as const;

export const ROUTE_PREPARATION_FOCUS_VALUES = [
  'waste_route',
  'response_route',
  'maintenance_route',
  'general_route',
] as const;

export const ROUTE_PREPARATION_SOURCE_VALUES = [
  'active_event',
  'container_pressure',
  'vehicle_pressure',
  'fallback',
] as const;

export const HUB_QUICK_ACTION_IDS: readonly HubQuickActionId[] = [
  'field_duty',
  'route_preparation',
  'neighborhood_patrol',
  'social_response',
] as const;

export const HUB_QUICK_ACTION_DEFINITIONS: Record<
  HubQuickActionId,
  HubQuickActionDefinition
> = {
  field_duty: {
    id: 'field_duty',
    title: 'Saha Nöbeti',
    subtitle: 'Bugün bir ekibi öncelikli göreve hazırla.',
    targetLabel: 'Saha ekibi',
    iconName: 'people-outline',
    defaultResultLine: 'Bugünkü saha önceliği hazırlandı.',
    defaultDetailLine:
      'Bir sonraki personel entegrasyonunda ilgili ekip/mahalle avantajı buraya bağlanacak.',
  },
  route_preparation: {
    id: 'route_preparation',
    title: 'Rota Hazırlığı',
    subtitle: 'Araç ve rota hazırlığını güne göre netleştir.',
    targetLabel: 'Rota planı',
    iconName: 'navigate-outline',
    defaultResultLine: 'Bugünkü rota hazırlığı kayda alındı.',
    defaultDetailLine:
      'Bir sonraki araç/konteyner entegrasyonunda rota avantajı buraya bağlanacak.',
  },
  neighborhood_patrol: {
    id: 'neighborhood_patrol',
    title: 'Mahalle Turu',
    subtitle: 'Riskli mahallede kısa saha kontrolü başlat.',
    targetLabel: 'Mahalle turu',
    iconName: 'walk-outline',
    defaultResultLine: 'Saha turu planı oluşturuldu.',
    defaultDetailLine:
      'Eşleşen mahalle kararlarında ek saha bilgisi gösterilir.',
  },
  social_response: {
    id: 'social_response',
    title: 'Sosyal Yanıt',
    subtitle: 'Aktif gündem için kısa açıklama hazırlığı yap.',
    targetLabel: 'Sosyal gündem',
    iconName: 'chatbubble-ellipses-outline',
    defaultResultLine: 'Kısa sosyal yanıt hazırlığı kayda alındı.',
    defaultDetailLine:
      'Sosyal yayılımı ve yanlış bilgi riskini küçük ölçekte azaltır.',
  },
};

export const HUB_QUICK_ACTION_STATUS_LABELS: Record<
  import('./hubQuickActionTypes').HubQuickActionStatus,
  string
> = {
  available: 'Hazır',
  used: 'Kullanıldı',
  locked: 'Kilitli',
  disabled: 'Pasif',
};

export function isHubQuickActionId(value: unknown): value is HubQuickActionId {
  return (
    typeof value === 'string' &&
    (HUB_QUICK_ACTION_IDS as readonly string[]).includes(value)
  );
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${String(value)}`);
}
