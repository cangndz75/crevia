import type { MapDistrictReactionKind } from '@/core/mapReactions/mapReactionTypes';

import type {
  MapDistrictMotionIntensity,
  MapDistrictMotionKind,
  MapDistrictMotionRepeatPolicy,
  MapDistrictMotionTone,
} from './mapReactionMotionTypes';

export const MAP_REACTION_MOTION_FORBIDDEN_WORDS = [
  'gps',
  'canlı takip',
  'plaka',
  'gerçek konum',
  'rota çiziliyor',
  'yapay zeka',
  'online oyuncu',
  'resmi belediye',
  'panik',
  'alarm',
  'felaket',
  'premium',
  'kilitli',
  'pack',
  'metadata',
  'runtime',
] as const;

export const MAP_REACTION_MOTION_LABELS = {
  mapReaction: 'Harita tepkisi',
  recoveryTrace: 'Toparlanma izi',
  riskRing: 'Risk halkası',
  socialSignal: 'Sosyal sinyal',
  fieldCapacity: 'Saha kapasitesi',
  journalTrace: 'Günlük izi',
  operationScope: 'Operasyon kapsamı',
} as const;

export const MAP_REACTION_MOTION_DURATION_MS = {
  low: 1200,
  medium: 1600,
  high: 2000,
  journalFlash: 900,
  bubblePop: 700,
} as const;

export const MAP_REACTION_MOTION_MAX_ANIMATED_CUES = {
  day1: 0,
  day2to3: 1,
  day4to7: 2,
  day8plus: 3,
  day8plusHighlighted: 3,
} as const;

export type ReactionMotionMapping = {
  motionKind: MapDistrictMotionKind;
  tone: MapDistrictMotionTone;
  intensity: MapDistrictMotionIntensity;
  repeatPolicy: MapDistrictMotionRepeatPolicy;
  accessibilityLabel: string;
  reducedMotionFallbackLabel: string;
};

export const REACTION_KIND_MOTION_MAP: Record<MapDistrictReactionKind, ReactionMotionMapping> = {
  trust_pulse: {
    motionKind: 'trust_ping',
    tone: 'positive',
    intensity: 'medium',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Harita tepkisi: güven nabzı',
    reducedMotionFallbackLabel: 'Harita tepkisi: güven nabzı',
  },
  risk_ring: {
    motionKind: 'risk_ring',
    tone: 'warning',
    intensity: 'medium',
    repeatPolicy: 'limited',
    accessibilityLabel: 'Risk halkası: izleme sinyali',
    reducedMotionFallbackLabel: 'Risk halkası: izleme sinyali',
  },
  recovery_glow: {
    motionKind: 'recovery_glow',
    tone: 'recovery',
    intensity: 'low',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Toparlanma izi',
    reducedMotionFallbackLabel: 'Toparlanma izi',
  },
  social_bubble: {
    motionKind: 'social_bubble_pop',
    tone: 'social',
    intensity: 'low',
    repeatPolicy: 'once',
    accessibilityLabel: 'Sosyal sinyal',
    reducedMotionFallbackLabel: 'Sosyal sinyal',
  },
  route_pressure_marker: {
    motionKind: 'resource_marker_breathe',
    tone: 'resource',
    intensity: 'medium',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Saha kapasitesi: rota baskısı',
    reducedMotionFallbackLabel: 'Saha kapasitesi: rota baskısı',
  },
  container_pressure_marker: {
    motionKind: 'resource_marker_breathe',
    tone: 'warning',
    intensity: 'medium',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Saha kapasitesi: konteyner izi',
    reducedMotionFallbackLabel: 'Saha kapasitesi: konteyner izi',
  },
  resource_fatigue_marker: {
    motionKind: 'risk_ring',
    tone: 'warning',
    intensity: 'low',
    repeatPolicy: 'limited',
    accessibilityLabel: 'Risk halkası: kaynak yorgunluğu',
    reducedMotionFallbackLabel: 'Risk halkası: kaynak yorgunluğu',
  },
  resource_presence_marker: {
    motionKind: 'resource_marker_breathe',
    tone: 'resource',
    intensity: 'low',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Saha kapasitesi',
    reducedMotionFallbackLabel: 'Saha kapasitesi',
  },
  team_capacity_marker: {
    motionKind: 'resource_marker_breathe',
    tone: 'resource',
    intensity: 'medium',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Saha kapasitesi: ekip temposu',
    reducedMotionFallbackLabel: 'Saha kapasitesi: ekip temposu',
  },
  vehicle_capacity_marker: {
    motionKind: 'resource_marker_breathe',
    tone: 'resource',
    intensity: 'medium',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Saha kapasitesi: araç kapasitesi',
    reducedMotionFallbackLabel: 'Saha kapasitesi: araç kapasitesi',
  },
  crisis_watch_ring: {
    motionKind: 'risk_ring',
    tone: 'warning',
    intensity: 'high',
    repeatPolicy: 'limited',
    accessibilityLabel: 'Risk halkası: kriz izleme',
    reducedMotionFallbackLabel: 'Risk halkası: kriz izleme',
  },
  operation_scope_marker: {
    motionKind: 'operation_scope_ring',
    tone: 'neutral',
    intensity: 'low',
    repeatPolicy: 'subtle_loop',
    accessibilityLabel: 'Operasyon kapsamı',
    reducedMotionFallbackLabel: 'Operasyon kapsamı',
  },
  journal_trace: {
    motionKind: 'journal_trace_flash',
    tone: 'neutral',
    intensity: 'low',
    repeatPolicy: 'once',
    accessibilityLabel: 'Günlük izi',
    reducedMotionFallbackLabel: 'Günlük izi',
  },
  content_pack_marker: {
    motionKind: 'soft_pulse',
    tone: 'neutral',
    intensity: 'low',
    repeatPolicy: 'limited',
    accessibilityLabel: 'Harita tepkisi: operasyon odağı',
    reducedMotionFallbackLabel: 'Harita tepkisi: operasyon odağı',
  },
  active_route_hint: {
    motionKind: 'static_indicator',
    tone: 'resource',
    intensity: 'low',
    repeatPolicy: 'disabled',
    accessibilityLabel: 'Harita tepkisi: aktif rota izi',
    reducedMotionFallbackLabel: 'Harita tepkisi: aktif rota izi',
  },
  fallback: {
    motionKind: 'static_indicator',
    tone: 'neutral',
    intensity: 'low',
    repeatPolicy: 'disabled',
    accessibilityLabel: 'Harita tepkisi',
    reducedMotionFallbackLabel: 'Harita tepkisi',
  },
};

export const RESOURCE_MARKER_REACTION_KINDS = new Set<MapDistrictReactionKind>([
  'route_pressure_marker',
  'container_pressure_marker',
  'resource_fatigue_marker',
  'resource_presence_marker',
  'team_capacity_marker',
  'vehicle_capacity_marker',
  'active_route_hint',
]);

export const JOURNAL_TRACE_HINT_LINE = 'Günlüğe işlendi';

export const SOCIAL_BUBBLE_DEFAULT_LINE = 'Mahallede görünür hizmet fark edildi.';
