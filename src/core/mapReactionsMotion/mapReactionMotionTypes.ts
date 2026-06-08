import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { MapDistrictReactionKind } from '@/core/mapReactions/mapReactionTypes';

export type MapReactionMotionVisibility = 'hidden' | 'subtle' | 'standard' | 'highlighted';

export type MapDistrictMotionKind =
  | 'soft_pulse'
  | 'risk_ring'
  | 'recovery_glow'
  | 'trust_ping'
  | 'social_bubble_pop'
  | 'journal_trace_flash'
  | 'operation_scope_ring'
  | 'resource_marker_breathe'
  | 'static_indicator';

export type MapDistrictMotionTone =
  | 'positive'
  | 'warning'
  | 'recovery'
  | 'social'
  | 'resource'
  | 'neutral';

export type MapDistrictMotionIntensity = 'low' | 'medium' | 'high';

export type MapDistrictMotionRepeatPolicy = 'once' | 'limited' | 'subtle_loop' | 'disabled';

export type MapDistrictMotionPriority = 'low' | 'medium' | 'high';

export type MapDistrictMotionCue = {
  districtId: MapDistrictId;
  reactionKind: MapDistrictReactionKind;
  motionKind: MapDistrictMotionKind;
  tone: MapDistrictMotionTone;
  intensity: MapDistrictMotionIntensity;
  durationMs: number;
  repeatPolicy: MapDistrictMotionRepeatPolicy;
  accessibilityLabel: string;
  reducedMotionFallbackLabel: string;
  shouldAnimate: boolean;
  priority: MapDistrictMotionPriority;
};

export type MapBubbleMotionCue = {
  districtId: MapDistrictId;
  shortLine: string;
  accessibilityLabel: string;
  shouldAnimate: boolean;
};

export type MapJournalMotionCue = {
  districtId: MapDistrictId;
  hintLine: string;
  accessibilityLabel: string;
  shouldAnimate: boolean;
};

export type MapOperationScopeMotionCue = {
  districtIds: MapDistrictId[];
  accessibilityLabel: string;
  shouldAnimate: boolean;
};

export type MapReactionMotionSourceSignals = {
  hasTrustPulse: boolean;
  hasRiskRing: boolean;
  hasRecoveryGlow: boolean;
  hasSocialBubble: boolean;
  hasJournalTrace: boolean;
  hasOperationScope: boolean;
  hasResourceMarker: boolean;
};

export type MapReactionMotionModel = {
  day: number;
  visibility: MapReactionMotionVisibility;
  selectedDistrictMotion?: MapDistrictMotionCue;
  globalMotionCues: MapDistrictMotionCue[];
  bubbleCue?: MapBubbleMotionCue;
  journalCue?: MapJournalMotionCue;
  operationScopeCue?: MapOperationScopeMotionCue;
  reducedMotionMode: boolean;
  maxAnimatedCues: number;
  animatedCueCount: number;
  sourceSignals: MapReactionMotionSourceSignals;
  duplicateKey: string;
};

export type MapReactionMotionInput = {
  day?: number;
  selectedDistrictId?: MapDistrictId | string | null;
  accessMode?: 'none' | 'limited' | 'full';
  reducedMotionMode?: boolean;
  reactions?: Array<{
    districtId: MapDistrictId;
    districtName?: string;
    kind: MapDistrictReactionKind;
    intensity?: 'low' | 'medium' | 'high';
    priority?: 'low' | 'medium' | 'high';
    shortLine?: string;
    shouldAnimate?: boolean;
  }>;
  visibility?: 'hidden' | 'compact' | 'standard';
  suppressJournalText?: boolean;
  suppressSocialText?: boolean;
  suppressResourceText?: boolean;
};
