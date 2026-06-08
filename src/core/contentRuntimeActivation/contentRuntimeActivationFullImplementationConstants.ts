import type { ContentRuntimeActivationMode, ContentRuntimeActivationPackId } from './contentRuntimeActivationTypes';

export const CONTENT_RUNTIME_ACTIVATION_FULL_FAMILY_COOLDOWN_DAYS = 3;

export const CONTENT_RUNTIME_ACTIVATION_FULL_COPY_CLUSTER_COOLDOWN_DAYS = 2;

export const CONTENT_RUNTIME_ACTIVATION_FULL_DISTRICT_WINDOW_DAYS = 2;

export const CONTENT_RUNTIME_ACTIVATION_FULL_DISTRICT_WINDOW_MAX = 2;

export const CONTENT_RUNTIME_ACTIVATION_FULL_CRISIS_WINDOW_DAYS = 3;

export const CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIGHT = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIMITED = 2;

export const CONTENT_RUNTIME_ACTIVATION_FULL_STORY_TRIGGER_MAX_PER_DAY = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_REPORT_PACK_CONTINUITY_MAX = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_HUB_PACK_LINE_MAX = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_MAP_JOURNAL_TRACE_MAX = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_SOCIAL_ENRICHMENT_MAX = 1;

export const CONTENT_RUNTIME_ACTIVATION_FULL_FUTURE_MAX_PACK_ORIGIN = 3;

export const CONTENT_RUNTIME_ACTIVATION_LIMITED_FULL_PACK_IDS: readonly ContentRuntimeActivationPackId[] = [
  'district_pack_one',
  'vehicle_route_pack_one',
  'container_environment_pack_one',
  'social_trust_pack_one',
] as const;

export const CONTENT_RUNTIME_ACTIVATION_LIMITED_RISK_PACK_IDS: readonly ContentRuntimeActivationPackId[] = [
  'crisis_adjacent_pack_one',
] as const;

export const CONTENT_RUNTIME_ACTIVATION_PLAYER_CHIP_LABELS: Record<
  ContentRuntimeActivationPackId,
  string
> = {
  district_pack_one: 'Mahalle izi',
  vehicle_route_pack_one: 'Rota dengesi',
  container_environment_pack_one: 'Konteyner çevresi',
  social_trust_pack_one: 'Sosyal güven',
  crisis_adjacent_pack_one: 'Risk sinyali',
};

export const CONTENT_RUNTIME_ACTIVATION_IMPLEMENTATION_FORBIDDEN_TERMS = [
  'pack',
  'metadata',
  'runtime',
  'full activation',
  'activation',
  'limited_full',
  'AI',
  'premium',
  'kilitli',
] as const;

export function resolveMaxPackOriginForMode(
  mode: ContentRuntimeActivationMode,
  day: number,
): number {
  if (day <= 1 || (day >= 2 && day <= 7)) return 0;
  if (mode === 'off' || mode === 'preview') return 0;
  if (mode === 'lite') return 1;
  if (mode === 'limited_full') return 2;
  return 1;
}

export function resolveArchiveWriteCap(mode: ContentRuntimeActivationMode): number {
  if (mode === 'limited_full') return CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIMITED;
  if (mode === 'lite') return CONTENT_RUNTIME_ACTIVATION_FULL_ARCHIVE_MAX_LIGHT;
  return 0;
}
