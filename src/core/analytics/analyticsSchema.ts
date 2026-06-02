import {
  ANALYTICS_SCHEMA_VERSION,
  BASE_REQUIRED_PAYLOAD_KEYS,
  FORBIDDEN_ANALYTICS_PAYLOAD_KEYS,
} from './analyticsConstants';
import { assertNoForbiddenPayloadKeys, findForbiddenAnalyticsKeys } from './analyticsPrivacy';
import type {
  AnalyticsAuditFinding,
  AnalyticsAuditResult,
  AnalyticsEventDefinition,
  AnalyticsEventName,
  AnalyticsEventPayload,
  AnalyticsEventPayloadBase,
  AnalyticsPayloadValue,
  AnalyticsValidationResult,
} from './analyticsTypes';

function mergeKeys(...groups: string[][]): string[] {
  return [...new Set(groups.flat())];
}

function defineEvent(
  def: Omit<AnalyticsEventDefinition, 'enabledInDev' | 'enabledInProduction' | 'privacyLevel'> & {
    privacyLevel?: AnalyticsEventDefinition['privacyLevel'];
    enabledInDev?: boolean;
    enabledInProduction?: boolean;
  },
): AnalyticsEventDefinition {
  const required = mergeKeys([...BASE_REQUIRED_PAYLOAD_KEYS], def.requiredPayloadKeys);
  const allowed = mergeKeys(required, def.allowedPayloadKeys);
  return {
    ...def,
    requiredPayloadKeys: required,
    allowedPayloadKeys: allowed,
    privacyLevel: def.privacyLevel ?? 'safe',
    enabledInDev: def.enabledInDev ?? true,
    enabledInProduction: def.enabledInProduction ?? true,
  };
}

const HUB_DAY_KEYS = ['day', 'accessMode', 'pilotDay', 'source', 'isFirstSession', 'isTutorial'];
const EVENT_FLOW_KEYS = [
  'day',
  'accessMode',
  'districtId',
  'eventType',
  'eventCategory',
  'optionId',
  'decisionType',
  'assignmentFitBand',
  'resultBand',
  'source',
];
const FULL_OP_KEYS = [
  'day',
  'seasonDay',
  'accessMode',
  'districtId',
  'source',
  'hasCrisisAction',
  'hasSeasonEnd',
];
const REPORT_KEYS = [
  'day',
  'pilotDay',
  'seasonDay',
  'accessMode',
  'ratingBand',
  'resourceStatusBand',
  'crisisRiskBand',
  'assignmentFitBand',
  'hasSeasonEnd',
];

export const ANALYTICS_EVENT_DEFINITIONS: AnalyticsEventDefinition[] = [
  defineEvent({
    name: 'app_opened',
    description: 'Uygulama açıldı.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'session_started',
    description: 'Oturum başladı.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode', 'isFirstSession'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'day_started',
    description: 'Şehir günü başladı.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'first_guide_seen',
    description: 'İlk 10 dakika rehberi görüldü.',
    surface: 'hub',
    funnelIds: ['first_session'],
    requiredPayloadKeys: ['day', 'accessMode', 'isTutorial'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'advisor_hint_requested',
    description: 'Danışman ipucu istendi.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: [...HUB_DAY_KEYS, 'source'],
  }),
  defineEvent({
    name: 'daily_plan_seen',
    description: 'Günlük operasyon planı görüldü.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: [...HUB_DAY_KEYS, 'districtId'],
  }),
  defineEvent({
    name: 'daily_plan_confirmed',
    description: 'Günlük operasyon planı onaylandı.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: [...HUB_DAY_KEYS, 'districtId', 'optionId', 'source'],
  }),
  defineEvent({
    name: 'first_event_opened',
    description: 'İlk olay kartı açıldı.',
    surface: 'event_plan',
    funnelIds: ['first_session'],
    requiredPayloadKeys: ['day', 'accessMode', 'eventType'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'decision_selected',
    description: 'Karar seçeneği seçildi.',
    surface: 'event_plan',
    funnelIds: ['first_session', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'optionId', 'decisionType'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'assignment_seen',
    description: 'Atama paneli görüldü.',
    surface: 'event_dispatch',
    funnelIds: ['first_session', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'eventType'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'assignment_confirmed',
    description: 'Saha ataması onaylandı.',
    surface: 'event_dispatch',
    funnelIds: ['first_session', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'eventType', 'assignmentFitBand'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'field_phase_started',
    description: 'Saha fazı başladı.',
    surface: 'event_field',
    funnelIds: ['first_session'],
    requiredPayloadKeys: ['day', 'accessMode', 'eventType'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'event_completed',
    description: 'Olay tamamlandı.',
    surface: 'event_result',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode', 'resultBand'],
    allowedPayloadKeys: EVENT_FLOW_KEYS,
  }),
  defineEvent({
    name: 'report_opened',
    description: 'Gün sonu raporu açıldı.',
    surface: 'report',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'hub_returned',
    description: 'Rapor sonrası Operasyon Merkezine dönüldü.',
    surface: 'hub',
    funnelIds: ['first_session', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'pilot_day_started',
    description: 'Pilot günü başladı.',
    surface: 'hub',
    funnelIds: ['pilot_completion', 'retention'],
    requiredPayloadKeys: ['day', 'pilotDay', 'accessMode'],
    allowedPayloadKeys: [...HUB_DAY_KEYS, 'pilotDay'],
  }),
  defineEvent({
    name: 'pilot_day_completed',
    description: 'Pilot günü tamamlandı.',
    surface: 'report',
    funnelIds: ['pilot_completion', 'retention'],
    requiredPayloadKeys: ['day', 'pilotDay', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'day7_report_opened',
    description: 'Gün 7 pilot kapanış raporu açıldı.',
    surface: 'report',
    funnelIds: ['pilot_completion'],
    requiredPayloadKeys: ['day', 'pilotDay', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'pilot_completion_seen',
    description: 'Pilot tamamlanma kartı görüldü.',
    surface: 'report',
    funnelIds: ['pilot_completion', 'post_pilot_offer'],
    requiredPayloadKeys: ['day', 'pilotDay', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'post_pilot_offer_opened',
    description: 'Post-pilot teklif ekranı açıldı.',
    surface: 'post_pilot_offer',
    funnelIds: ['pilot_completion', 'post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'pilotDay'],
  }),
  defineEvent({
    name: 'post_pilot_offer_primary_cta_pressed',
    description: 'Ana Operasyon teklif CTA basıldı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode', 'ctaId'],
    allowedPayloadKeys: ['day', 'accessMode', 'ctaId', 'source'],
  }),
  defineEvent({
    name: 'limited_continue_selected',
    description: 'Sınırlı gündem seçildi.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'limited_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source'],
  }),
  defineEvent({
    name: 'main_operation_mock_purchase_started',
    description: 'Mock tam erişim satın alma başladı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'main_operation_mock_purchase_completed',
    description: 'Mock tam erişim satın alma tamamlandı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'access_restore_pressed',
    description: 'Erişim geri yükleme denendi.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source'],
  }),
  defineEvent({
    name: 'main_operation_day_started',
    description: 'Ana operasyon günü başladı.',
    surface: 'hub',
    funnelIds: ['full_main_operation', 'retention'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode'],
    allowedPayloadKeys: FULL_OP_KEYS,
  }),
  defineEvent({
    name: 'season_goal_card_seen',
    description: 'Sezon hedef kartı görüldü.',
    surface: 'hub',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode'],
    allowedPayloadKeys: FULL_OP_KEYS,
  }),
  defineEvent({
    name: 'season_goal_detail_opened',
    description: 'Sezon hedef detay sheet açıldı.',
    surface: 'hub',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'optionId'],
  }),
  defineEvent({
    name: 'operational_resources_card_seen',
    description: 'Saha kaynakları kartı görüldü.',
    surface: 'hub',
    funnelIds: ['operational_resources', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'resourceStatusBand'],
  }),
  defineEvent({
    name: 'operational_resources_detail_opened',
    description: 'Saha kaynakları detay sheet açıldı.',
    surface: 'hub',
    funnelIds: ['operational_resources', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'resourceStatusBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'resourceStatusBand', 'tabId'],
  }),
  defineEvent({
    name: 'map_resource_overlay_seen',
    description: 'Harita kaynak overlay görüldü.',
    surface: 'map',
    funnelIds: ['operational_resources', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'resourceStatusBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'resourceStatusBand', 'districtId'],
  }),
  defineEvent({
    name: 'map_crisis_overlay_seen',
    description: 'Harita kriz overlay görüldü.',
    surface: 'map',
    funnelIds: ['crisis_management', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'crisisRiskBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'crisisRiskBand', 'districtId'],
  }),
  defineEvent({
    name: 'micro_decision_seen',
    description: 'Canlı operasyon kararı görüldü.',
    surface: 'event_field',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'eventType'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'eventType', 'optionId'],
  }),
  defineEvent({
    name: 'micro_decision_resolved',
    description: 'Canlı operasyon kararı çözüldü.',
    surface: 'event_field',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'optionId'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'eventType', 'optionId', 'resultBand'],
  }),
  defineEvent({
    name: 'crisis_desk_seen',
    description: 'Kriz masası kartı görüldü.',
    surface: 'hub',
    funnelIds: ['crisis_management', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'crisisRiskBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'crisisRiskBand', 'hasCrisisAction'],
  }),
  defineEvent({
    name: 'crisis_action_sheet_opened',
    description: 'Kriz hamle sheet açıldı.',
    surface: 'hub',
    funnelIds: ['crisis_management', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'crisisRiskBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'crisisRiskBand', 'optionId'],
  }),
  defineEvent({
    name: 'crisis_action_selected',
    description: 'Kriz hamlesi seçildi.',
    surface: 'hub',
    funnelIds: ['crisis_management', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'crisisRiskBand', 'optionId'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'crisisRiskBand', 'optionId', 'source'],
  }),
  defineEvent({
    name: 'crisis_action_processed',
    description: 'Kriz hamlesi gün sonu işlendi.',
    surface: 'hub',
    funnelIds: ['crisis_management', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode', 'crisisRiskBand'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'crisisRiskBand', 'hasCrisisAction'],
  }),
  defineEvent({
    name: 'season_end_seen',
    description: 'Dönemsel operasyon değerlendirme kartı görüldü.',
    surface: 'report',
    funnelIds: ['season_end', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'ratingBand'],
    allowedPayloadKeys: [...REPORT_KEYS, 'ratingBand', 'hasSeasonEnd'],
  }),
  defineEvent({
    name: 'season_end_detail_opened',
    description: 'Dönemsel operasyon detay sheet açıldı.',
    surface: 'report',
    funnelIds: ['season_end', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'ratingBand'],
    allowedPayloadKeys: [...REPORT_KEYS, 'ratingBand', 'hasSeasonEnd', 'ctaId'],
  }),
  defineEvent({
    name: 'report_primary_impact_seen',
    description: 'Rapor birincil etki bölümü görüldü.',
    surface: 'report',
    funnelIds: ['retention', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_daily_plan_seen',
    description: 'Rapor günlük plan etkisi görüldü.',
    surface: 'report',
    funnelIds: ['retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_assignment_seen',
    description: 'Rapor atama dengesi görüldü.',
    surface: 'report',
    funnelIds: ['retention', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'assignmentFitBand'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_resources_seen',
    description: 'Rapor saha kaynakları görüldü.',
    surface: 'report',
    funnelIds: ['operational_resources', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode', 'resourceStatusBand'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_crisis_seen',
    description: 'Rapor kriz özeti görüldü.',
    surface: 'report',
    funnelIds: ['crisis_management', 'retention'],
    requiredPayloadKeys: ['day', 'accessMode', 'crisisRiskBand'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_micro_decision_seen',
    description: 'Rapor canlı karar özeti görüldü.',
    surface: 'report',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_main_operation_seen',
    description: 'Rapor ana operasyon sezon kartı görüldü.',
    surface: 'report',
    funnelIds: ['full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'accessMode'],
    allowedPayloadKeys: REPORT_KEYS,
  }),
  defineEvent({
    name: 'report_season_end_seen',
    description: 'Rapor dönemsel operasyon değerlendirme kartı görüldü.',
    surface: 'report',
    funnelIds: ['season_end', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'seasonDay', 'ratingBand'],
    allowedPayloadKeys: [...REPORT_KEYS, 'ratingBand', 'hasSeasonEnd'],
  }),
  defineEvent({
    name: 'tab_changed',
    description: 'Sekme değişti.',
    surface: 'hub',
    funnelIds: ['retention'],
    requiredPayloadKeys: ['day', 'tabId'],
    allowedPayloadKeys: ['day', 'accessMode', 'tabId', 'source'],
  }),
  defineEvent({
    name: 'map_opened',
    description: 'Harita ekranı açıldı.',
    surface: 'map',
    funnelIds: ['retention', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: [...FULL_OP_KEYS, 'districtId'],
  }),
  defineEvent({
    name: 'social_pulse_opened',
    description: 'Sosyal nabız ekranı açıldı.',
    surface: 'social',
    funnelIds: ['retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'profile_opened',
    description: 'Profil ekranı açıldı.',
    surface: 'profile',
    funnelIds: ['retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'leaderboard_opened',
    description: 'Liderlik tablosu açıldı.',
    surface: 'leaderboard',
    funnelIds: ['retention'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: HUB_DAY_KEYS,
  }),
  defineEvent({
    name: 'iap_product_list_loaded',
    description: 'Mağaza ürün listesi yüklendi.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'ctaId'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_purchase_started',
    description: 'Gerçek IAP satın alma başladı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode', 'ctaId'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'ctaId', 'optionId'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_purchase_completed',
    description: 'Gerçek IAP satın alma tamamlandı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer', 'full_main_operation'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'ctaId', 'resultBand'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_purchase_failed',
    description: 'Gerçek IAP satın alma başarısız.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode', 'resultBand'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'resultBand', 'ctaId'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_restore_started',
    description: 'Erişim geri yükleme başladı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_restore_completed',
    description: 'Erişim geri yükleme tamamlandı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'resultBand'],
    privacyLevel: 'restricted',
  }),
  defineEvent({
    name: 'iap_restore_not_found',
    description: 'Geri yüklenecek erişim bulunamadı.',
    surface: 'post_pilot_offer',
    funnelIds: ['post_pilot_offer'],
    requiredPayloadKeys: ['day', 'accessMode'],
    allowedPayloadKeys: ['day', 'accessMode', 'source', 'resultBand'],
    privacyLevel: 'restricted',
  }),
];

const DEFINITION_BY_NAME = new Map<AnalyticsEventName, AnalyticsEventDefinition>(
  ANALYTICS_EVENT_DEFINITIONS.map((d) => [d.name, d]),
);

export function getAnalyticsEventDefinition(
  eventName: AnalyticsEventName,
): AnalyticsEventDefinition | undefined {
  return DEFINITION_BY_NAME.get(eventName);
}

function isPayloadValuePresent(value: AnalyticsPayloadValue): boolean {
  return value !== undefined && value !== null;
}

export function validateAnalyticsEventPayload(
  payload: AnalyticsEventPayload,
): AnalyticsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const def = getAnalyticsEventDefinition(payload.eventName);
  if (!def) {
    errors.push(`Unknown event: ${payload.eventName}`);
    return { valid: false, errors, warnings };
  }

  if (payload.schemaVersion !== ANALYTICS_SCHEMA_VERSION) {
    errors.push(
      `schemaVersion mismatch: expected ${ANALYTICS_SCHEMA_VERSION}, got ${payload.schemaVersion}`,
    );
  }

  if (payload.surface !== def.surface) {
    warnings.push(`surface mismatch: payload ${payload.surface}, def ${def.surface}`);
  }

  for (const key of def.requiredPayloadKeys) {
    if (!isPayloadValuePresent(payload[key])) {
      errors.push(`Missing required key: ${key}`);
    }
  }

  const forbidden = findForbiddenAnalyticsKeys(payload);
  for (const key of forbidden) {
    errors.push(`Forbidden key: ${key}`);
  }

  for (const key of Object.keys(payload)) {
    if (!def.allowedPayloadKeys.includes(key)) {
      warnings.push(`Key not in allowlist: ${key}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function sanitizeAnalyticsPayload(
  payload: AnalyticsEventPayload,
): AnalyticsEventPayload {
  const def = getAnalyticsEventDefinition(payload.eventName);
  const allowed = new Set(def?.allowedPayloadKeys ?? []);
  const sanitized: AnalyticsEventPayload = {
    eventName: payload.eventName,
    surface: payload.surface,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
  };

  for (const [key, value] of Object.entries(payload)) {
    if (FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(key as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number])) {
      continue;
    }
    if (def && !allowed.has(key)) {
      continue;
    }
    sanitized[key] = value;
  }

  return sanitized;
}

export function buildAnalyticsPayload(
  eventName: AnalyticsEventName,
  base: Omit<AnalyticsEventPayloadBase, 'eventName' | 'schemaVersion'>,
  extra: Record<string, AnalyticsPayloadValue> = {},
): AnalyticsEventPayload {
  const def = getAnalyticsEventDefinition(eventName);
  const surface = base.surface ?? def?.surface ?? 'hub';
  return sanitizeAnalyticsPayload({
    ...base,
    ...extra,
    eventName,
    surface,
    schemaVersion: ANALYTICS_SCHEMA_VERSION,
    timestampMs: base.timestampMs ?? Date.now(),
  });
}

export { assertNoForbiddenPayloadKeys, findForbiddenAnalyticsKeys } from './analyticsPrivacy';

export function validateAnalyticsEventDefinitions(): AnalyticsAuditResult {
  const findings: AnalyticsAuditFinding[] = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  const push = (
    id: string,
    severity: AnalyticsAuditFinding['severity'],
    message: string,
    recommendation: string,
  ) => {
    findings.push({ id, severity, message, recommendation });
    if (severity === 'pass') passCount += 1;
    else if (severity === 'warn') warnCount += 1;
    else failCount += 1;
  };

  const names = ANALYTICS_EVENT_DEFINITIONS.map((d) => d.name);
  const unique = new Set(names);
  if (unique.size === names.length) {
    push('event_names_unique', 'pass', 'Event names unique', 'Keep registry in sync');
  } else {
    push('event_names_unique', 'fail', 'Duplicate event names', 'Remove duplicates');
  }

  for (const def of ANALYTICS_EVENT_DEFINITIONS) {
    if (!def.description.trim()) {
      push(`desc_${def.name}`, 'fail', `${def.name} missing description`, 'Add description');
    }
    if (def.funnelIds.length === 0) {
      push(`funnel_${def.name}`, 'fail', `${def.name} has no funnels`, 'Assign funnelIds');
    }
    if (def.requiredPayloadKeys.length === 0) {
      push(`required_${def.name}`, 'fail', `${def.name} has no required keys`, 'Add required keys');
    }

    for (const key of def.requiredPayloadKeys) {
      if (!def.allowedPayloadKeys.includes(key)) {
        push(
          `allow_cover_${def.name}_${key}`,
          'fail',
          `${def.name}: required key ${key} not allowed`,
          'Add to allowedPayloadKeys',
        );
      }
    }

    for (const key of def.allowedPayloadKeys) {
      if (
        FORBIDDEN_ANALYTICS_PAYLOAD_KEYS.includes(
          key as (typeof FORBIDDEN_ANALYTICS_PAYLOAD_KEYS)[number],
        )
      ) {
        push(
          `forbidden_allowed_${def.name}_${key}`,
          'fail',
          `${def.name} allows forbidden key ${key}`,
          'Remove from allowlist',
        );
      }
    }
  }

  if (failCount === 0 && passCount === 0) {
    push('definitions_ok', 'pass', 'Event definitions validated', 'Maintain on new events');
    passCount += 1;
  }

  let health: AnalyticsAuditResult['health'] = 'PASS';
  if (failCount > 0) health = 'FAIL';
  else if (warnCount > 0) health = 'WARN';

  return {
    health,
    checkedCount: findings.length,
    passCount,
    warnCount,
    failCount,
    findings,
  };
}
