import type { CreviaStoryChainKind } from './storyChainTypes';
import type { PersistentStoryChainStepKind } from './storyChainPersistentTypes';

export const STORY_CHAIN_PERSISTENT_MAX_AGE_DAYS = 5;

export const STORY_CHAIN_PERSISTENT_FORBIDDEN_TERMS = [
  'quest',
  'mission',
  'gps',
  'canlı takip',
  'canli takip',
  'gerçek vatandaş',
  'gercek vatandas',
  'resmi belediye',
  'panik',
  'felaket',
  'viral',
  'premium',
  'kilitli',
  'pack',
  'metadata',
  'runtime',
  'openai',
  ' ai ',
] as const;

export const STORY_CHAIN_PERSISTENT_STEP_ORDER: readonly PersistentStoryChainStepKind[] = [
  'trigger',
  'follow_up',
  'pressure_shift',
  'recovery_window',
  'prevention_check',
  'closure',
] as const;

export const STORY_CHAIN_KIND_TO_DOMAIN: Record<CreviaStoryChainKind, string> = {
  route_pressure_chain: 'vehicle_route',
  container_recovery_chain: 'container',
  social_trust_chain: 'social_trust',
  crisis_watch_chain: 'crisis_adjacent',
  district_recovery_chain: 'recovery',
  visible_service_chain: 'visible_service',
  resource_fatigue_chain: 'resource_pressure',
  operation_followup_chain: 'operation_era',
};

export const STORY_CHAIN_KIND_START_LABELS: Record<CreviaStoryChainKind, string> = {
  route_pressure_chain: 'Rota baskısı takip çizgisi başladı.',
  container_recovery_chain: 'Konteyner çevresi toparlanma adımı izleniyor.',
  social_trust_chain: 'Sosyal güven takip çizgisi açıldı.',
  crisis_watch_chain: 'Kriz önleme takip çizgisi aktif.',
  district_recovery_chain: 'Mahalle toparlanma adımı başladı.',
  visible_service_chain: 'Görünür hizmet izi devam ediyor.',
  resource_fatigue_chain: 'Kaynak dengesi takip çizgisi açıldı.',
  operation_followup_chain: 'Operasyon takip çizgisi başladı.',
};

export function maxActiveChainsForDay(day: number): number {
  if (day <= 1) return 0;
  if (day <= 3) return 1;
  if (day <= 7) return 2;
  return 3;
}
