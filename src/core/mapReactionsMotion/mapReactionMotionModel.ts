import { normalizeMapDistrictId } from '@/core/districts/districtIdentityPresentation';
import type { MapDistrictId } from '@/core/districts/districtIdentityTypes';
import type { MapReactionLiteModel } from '@/core/mapReactions/mapReactionTypes';
import { POST_PILOT_FIRST_OPERATION_DAY } from '@/core/postPilot/postPilotEventConstants';

import {
  JOURNAL_TRACE_HINT_LINE,
  MAP_REACTION_MOTION_DURATION_MS,
  MAP_REACTION_MOTION_FORBIDDEN_WORDS,
  MAP_REACTION_MOTION_MAX_ANIMATED_CUES,
  REACTION_KIND_MOTION_MAP,
  RESOURCE_MARKER_REACTION_KINDS,
  SOCIAL_BUBBLE_DEFAULT_LINE,
} from './mapReactionMotionConstants';
import type {
  MapDistrictMotionCue,
  MapDistrictMotionPriority,
  MapReactionMotionInput,
  MapReactionMotionModel,
  MapReactionMotionSourceSignals,
  MapReactionMotionVisibility,
} from './mapReactionMotionTypes';

function resolveDistrictId(input: MapReactionMotionInput): MapDistrictId {
  const raw = input.selectedDistrictId ?? 'merkez';
  return normalizeMapDistrictId(raw) ?? 'merkez';
}

export function mapReactionMotionContainsForbiddenWords(text: string | null | undefined): boolean {
  if (!text?.trim()) return false;
  const normalized = text.toLocaleLowerCase('tr-TR');
  return MAP_REACTION_MOTION_FORBIDDEN_WORDS.some((word) => normalized.includes(word));
}

export function buildMapReactionMotionVisibility(
  input: MapReactionMotionInput = {},
): MapReactionMotionVisibility {
  const day = input.day ?? 1;
  if (day <= 1) return 'hidden';
  if (day <= 3) return 'subtle';
  if (input.accessMode === 'full' && day >= POST_PILOT_FIRST_OPERATION_DAY) {
    return 'highlighted';
  }
  if (day >= POST_PILOT_FIRST_OPERATION_DAY) return 'standard';
  return 'standard';
}

function maxAnimatedCuesForDay(
  day: number,
  visibility: MapReactionMotionVisibility,
): number {
  if (day <= 1) return MAP_REACTION_MOTION_MAX_ANIMATED_CUES.day1;
  if (day <= 3) return MAP_REACTION_MOTION_MAX_ANIMATED_CUES.day2to3;
  if (day < POST_PILOT_FIRST_OPERATION_DAY) {
    return MAP_REACTION_MOTION_MAX_ANIMATED_CUES.day4to7;
  }
  if (visibility === 'highlighted') {
    return MAP_REACTION_MOTION_MAX_ANIMATED_CUES.day8plusHighlighted;
  }
  return MAP_REACTION_MOTION_MAX_ANIMATED_CUES.day8plus;
}

function toMotionPriority(priority?: string): MapDistrictMotionPriority {
  if (priority === 'high') return 'high';
  if (priority === 'medium') return 'medium';
  return 'low';
}

function isAnimatedMotionKind(motionKind: MapDistrictMotionCue['motionKind']): boolean {
  return motionKind !== 'static_indicator';
}

function reactionToCue(
  reaction: NonNullable<MapReactionMotionInput['reactions']>[number],
  reducedMotionMode: boolean,
): MapDistrictMotionCue {
  const mapping = REACTION_KIND_MOTION_MAP[reaction.kind];
  const intensity = reaction.intensity ?? mapping.intensity;
  const durationMs =
    reaction.kind === 'journal_trace'
      ? MAP_REACTION_MOTION_DURATION_MS.journalFlash
      : reaction.kind === 'social_bubble'
        ? MAP_REACTION_MOTION_DURATION_MS.bubblePop
        : intensity === 'high'
          ? MAP_REACTION_MOTION_DURATION_MS.high
          : intensity === 'medium'
            ? MAP_REACTION_MOTION_DURATION_MS.medium
            : MAP_REACTION_MOTION_DURATION_MS.low;

  const motionKind = reducedMotionMode ? 'static_indicator' : mapping.motionKind;
  const shouldAnimate =
    !reducedMotionMode &&
    isAnimatedMotionKind(motionKind) &&
    mapping.repeatPolicy !== 'disabled' &&
    (reaction.shouldAnimate ?? true);

  return {
    districtId: reaction.districtId,
    reactionKind: reaction.kind,
    motionKind,
    tone: mapping.tone,
    intensity,
    durationMs,
    repeatPolicy: reducedMotionMode ? 'disabled' : mapping.repeatPolicy,
    accessibilityLabel: mapping.accessibilityLabel,
    reducedMotionFallbackLabel: mapping.reducedMotionFallbackLabel,
    shouldAnimate,
    priority: toMotionPriority(reaction.priority),
  };
}

function countAnimatedCues(cues: MapDistrictMotionCue[]): number {
  return cues.filter((cue) => cue.shouldAnimate).length;
}

function applyAnimatedCap(
  cues: MapDistrictMotionCue[],
  maxAnimated: number,
): MapDistrictMotionCue[] {
  let animatedUsed = 0;
  return cues.map((cue) => {
    if (!cue.shouldAnimate) return cue;
    if (animatedUsed >= maxAnimated) {
      return {
        ...cue,
        shouldAnimate: false,
        motionKind: 'static_indicator',
        repeatPolicy: 'disabled',
      };
    }
    animatedUsed += 1;
    return cue;
  });
}

function buildSourceSignals(cues: MapDistrictMotionCue[]): MapReactionMotionSourceSignals {
  const kinds = new Set(cues.map((c) => c.reactionKind));
  return {
    hasTrustPulse: kinds.has('trust_pulse'),
    hasRiskRing: kinds.has('risk_ring') || kinds.has('crisis_watch_ring'),
    hasRecoveryGlow: kinds.has('recovery_glow'),
    hasSocialBubble: kinds.has('social_bubble'),
    hasJournalTrace: kinds.has('journal_trace'),
    hasOperationScope: kinds.has('operation_scope_marker'),
    hasResourceMarker: [...RESOURCE_MARKER_REACTION_KINDS].some((k) => kinds.has(k)),
  };
}

export function buildMapReactionMotionModel(
  input: MapReactionMotionInput = {},
): MapReactionMotionModel {
  const day = input.day ?? 1;
  const selectedId = resolveDistrictId(input);
  const reducedMotionMode = input.reducedMotionMode ?? false;
  const visibility = buildMapReactionMotionVisibility(input);
  const maxAnimatedCues = maxAnimatedCuesForDay(day, visibility);

  if (visibility === 'hidden' || day <= 1 || !input.reactions?.length) {
    return {
      day,
      visibility,
      globalMotionCues: [],
      reducedMotionMode,
      maxAnimatedCues,
      animatedCueCount: 0,
      sourceSignals: buildSourceSignals([]),
      duplicateKey: 'hidden',
    };
  }

  let reactions = input.reactions;

  if (visibility === 'subtle') {
    reactions = reactions.filter((r) => r.districtId === selectedId);
  }

  let journalCount = 0;
  let socialCount = 0;
  let resourceAnimatedCount = 0;

  const draftCues: MapDistrictMotionCue[] = [];
  for (const reaction of reactions) {
    if (reaction.kind === 'journal_trace') {
      if (journalCount >= 1) continue;
      journalCount += 1;
    }
    if (reaction.kind === 'social_bubble') {
      if (socialCount >= 1) continue;
      socialCount += 1;
    }
    if (RESOURCE_MARKER_REACTION_KINDS.has(reaction.kind)) {
      if (resourceAnimatedCount >= 1 && !reducedMotionMode) {
        const cue = reactionToCue({ ...reaction, shouldAnimate: false }, reducedMotionMode);
        draftCues.push(cue);
        continue;
      }
      if (!reducedMotionMode) resourceAnimatedCount += 1;
    }
    draftCues.push(reactionToCue(reaction, reducedMotionMode));
  }

  let globalMotionCues = applyAnimatedCap(draftCues, maxAnimatedCues);

  if (day <= 3) {
    globalMotionCues = globalMotionCues.filter((c) => c.districtId === selectedId);
    globalMotionCues = applyAnimatedCap(globalMotionCues, maxAnimatedCues);
  }

  const selectedDistrictMotion =
    globalMotionCues.find((c) => c.districtId === selectedId) ?? globalMotionCues[0];

  const journalReaction = reactions.find((r) => r.kind === 'journal_trace');
  const socialReaction = reactions.find((r) => r.kind === 'social_bubble');
  const scopeReactions = reactions.filter((r) => r.kind === 'operation_scope_marker');

  const journalCue =
    journalReaction && day >= 2 && !input.suppressJournalText
      ? {
          districtId: journalReaction.districtId,
          hintLine: JOURNAL_TRACE_HINT_LINE,
          accessibilityLabel: 'Günlük izi: günlüğe işlendi',
          shouldAnimate:
            !reducedMotionMode &&
            globalMotionCues.some(
              (c) => c.reactionKind === 'journal_trace' && c.shouldAnimate,
            ),
        }
      : undefined;

  const bubbleCue =
    socialReaction && day >= 2 && !input.suppressSocialText
      ? {
          districtId: socialReaction.districtId,
          shortLine: socialReaction.shortLine?.trim() || SOCIAL_BUBBLE_DEFAULT_LINE,
          accessibilityLabel: 'Sosyal sinyal',
          shouldAnimate:
            !reducedMotionMode &&
            globalMotionCues.some(
              (c) => c.reactionKind === 'social_bubble' && c.shouldAnimate,
            ),
        }
      : undefined;

  const operationScopeCue =
    scopeReactions.length > 0 && day >= POST_PILOT_FIRST_OPERATION_DAY
      ? {
          districtIds: [...new Set(scopeReactions.map((r) => r.districtId))],
          accessibilityLabel: 'Operasyon kapsamı',
          shouldAnimate:
            !reducedMotionMode &&
            globalMotionCues.some(
              (c) => c.reactionKind === 'operation_scope_marker' && c.shouldAnimate,
            ),
        }
      : undefined;

  const animatedCueCount = countAnimatedCues(globalMotionCues);

  return {
    day,
    visibility,
    selectedDistrictMotion,
    globalMotionCues,
    bubbleCue,
    journalCue,
    operationScopeCue,
    reducedMotionMode,
    maxAnimatedCues,
    animatedCueCount,
    sourceSignals: buildSourceSignals(globalMotionCues),
    duplicateKey: [
      selectedId,
      selectedDistrictMotion?.reactionKind ?? 'none',
      animatedCueCount,
    ].join(':'),
  };
}

export function buildMapReactionMotionModelFromLite(
  reactionModel: MapReactionLiteModel | null | undefined,
  params: {
    selectedDistrictId?: MapDistrictId | string | null;
    accessMode?: 'none' | 'limited' | 'full';
    reducedMotionMode?: boolean;
    suppressJournalText?: boolean;
    suppressSocialText?: boolean;
    suppressResourceText?: boolean;
  } = {},
): MapReactionMotionModel {
  if (!reactionModel || reactionModel.visibility === 'hidden') {
    return buildMapReactionMotionModel({
      day: reactionModel?.day ?? 1,
      selectedDistrictId: params.selectedDistrictId,
      accessMode: params.accessMode,
      reducedMotionMode: params.reducedMotionMode,
    });
  }

  return buildMapReactionMotionModel({
    day: reactionModel.day,
    selectedDistrictId: params.selectedDistrictId,
    accessMode: params.accessMode,
    reducedMotionMode: params.reducedMotionMode,
    visibility: reactionModel.visibility,
    suppressJournalText: params.suppressJournalText,
    suppressSocialText: params.suppressSocialText,
    suppressResourceText: params.suppressResourceText,
    reactions: reactionModel.reactions.map((r) => ({
      districtId: r.districtId,
      districtName: r.districtName,
      kind: r.kind,
      intensity: r.intensity,
      priority: r.priority,
      shortLine: r.shortLine,
      shouldAnimate: r.shouldAnimate,
    })),
  });
}

export function shouldShowMapReactionMotion(
  model: MapReactionMotionModel | null | undefined,
): boolean {
  if (!model || model.visibility === 'hidden') return false;
  return (
    model.globalMotionCues.length > 0 ||
    Boolean(model.bubbleCue) ||
    Boolean(model.journalCue) ||
    Boolean(model.operationScopeCue)
  );
}
