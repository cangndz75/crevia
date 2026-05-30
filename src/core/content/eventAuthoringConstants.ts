import type { EventPackId } from './eventAuthoringTypes';

export const EVENT_PACK_IDS: readonly EventPackId[] = [
  'pilot_core',
  'district_cumhuriyet',
  'district_merkez',
  'district_sanayi',
  'district_istasyon',
  'district_yesilvadi',
  'post_pilot_light',
  'crisis_pack_future',
  'social_pack_future',
] as const;

export const DISTRICT_EVENT_PACK_IDS: readonly EventPackId[] = [
  'district_cumhuriyet',
  'district_merkez',
  'district_sanayi',
  'district_istasyon',
  'district_yesilvadi',
] as const;

export const FUTURE_ONLY_EVENT_PACK_IDS: readonly EventPackId[] = [
  'crisis_pack_future',
  'social_pack_future',
] as const;

/** İçerik metinlerinde kullanılmamalı. */
export const EVENT_AUTHORING_FORBIDDEN_WORDS = [
  'xp',
  'level up',
  'rank up',
  'kilitli',
  'premium',
  'satın al',
  'paywall',
  'yetkin yetersiz',
  'full mode',
] as const;

/** Post-pilot light loop ile uyumlu günlük üst sınır (mevcut motor). */
export const POST_PILOT_LIGHT_DAILY_EVENT_CAP = 2;

export const POST_PILOT_LIGHT_CURRENT_INVENTORY = {
  anchor: 3,
  side: 4,
} as const;

export const POST_PILOT_LIGHT_EXPANSION_TARGET = {
  anchor: 6,
  side: 8,
} as const;
