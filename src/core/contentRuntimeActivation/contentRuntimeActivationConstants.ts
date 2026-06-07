import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import type { ContentRuntimeActivationPackId } from './contentRuntimeActivationTypes';

export const CONTENT_RUNTIME_ACTIVATION_FIRST_DAY = POST_PILOT_FIRST_OPERATION_DAY;

export const CONTENT_RUNTIME_ACTIVATION_PILOT_MAX_DAY = 7;

export const CONTENT_RUNTIME_ACTIVATION_LITE_PACK_IDS: readonly ContentRuntimeActivationPackId[] = [
  'district_pack_one',
  'vehicle_route_pack_one',
  'container_environment_pack_one',
] as const;

export const CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_LIGHT = 1;

export const CONTENT_RUNTIME_ACTIVATION_MAX_CANDIDATES_FULL = 2;

export const CONTENT_RUNTIME_ACTIVATION_MAX_DOMAINS_MENTION = 2;

export const CONTENT_RUNTIME_ACTIVATION_FAMILY_COOLDOWN_DAYS = 2;

export const CONTENT_RUNTIME_ACTIVATION_DISTRICT_DOMAIN_COOLDOWN_DAYS = 1;

export const CONTENT_RUNTIME_ACTIVATION_FORBIDDEN_WORDS = [
  'premium',
  'kilitli',
  'satın al',
  'kaçırma',
  'fırsat',
  'paywall',
  'full mode',
  'xp',
] as const;

export const CONTENT_RUNTIME_ACTIVATION_PRESENTATION_HINTS = {
  main_operation_scope: 'Ana operasyon kapsamı',
  district_focus: 'Mahalle odağı',
  route_pressure: 'Rota baskısı',
  container_area: 'Konteyner çevresi',
  recovery_opportunity: 'Toparlanma fırsatı',
} as const;

export const CONTENT_RUNTIME_ACTIVATION_PACK_LABELS: Record<ContentRuntimeActivationPackId, string> = {
  district_pack_one: 'Mahalle Operasyonu',
  vehicle_route_pack_one: 'Rota / Araç',
  container_environment_pack_one: 'Konteyner / Çevre',
};

export const CONTENT_RUNTIME_ACTIVATION_PRIORITY_DISTRICTS = [
  'merkez',
  'cumhuriyet',
  'sanayi',
  'istasyon',
  'yesilvadi',
] as const;
