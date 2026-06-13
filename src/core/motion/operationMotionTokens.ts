/** Operasyon faz motion süreleri — verify-safe, RN import yok. */

export const OPERATION_MOTION_SCAN_MS = 700;
export const OPERATION_MOTION_SCAN_MIN_MS = 600;
export const OPERATION_MOTION_SCAN_MAX_MS = 900;
export const OPERATION_MOTION_FINDING_REVEAL_MS = 160;
export const OPERATION_MOTION_FINDING_STAGGER_MS = 45;
export const OPERATION_MOTION_PLAN_SELECT_MS = 180;
export const OPERATION_MOTION_DISPATCH_MS = 600;
export const OPERATION_MOTION_DISPATCH_MIN_MS = 500;
export const OPERATION_MOTION_DISPATCH_MAX_MS = 700;
export const OPERATION_MOTION_DISPATCH_SENT_MS = 200;
export const OPERATION_MOTION_FIELD_PROGRESS_MS = 1100;
export const OPERATION_MOTION_FIELD_PROGRESS_MIN_MS = 900;
export const OPERATION_MOTION_FIELD_PROGRESS_MAX_MS = 1400;
export const OPERATION_MOTION_FIELD_STEP_REVEAL_MS = 200;
export const OPERATION_MOTION_FIELD_REDUCED_MS = 100;
export const OPERATION_MOTION_FIELD_MICRO_REVEAL_MS = 220;
export const OPERATION_MOTION_FIELD_COMPLETE_HIGHLIGHT_MS = 260;
export const OPERATION_MOTION_RESULT_OUTCOME_MS = 200;
export const OPERATION_MOTION_RESULT_STAGGER_MS = 150;
export const OPERATION_MOTION_RESULT_TOTAL_MS = 1500;
export const OPERATION_MOTION_RESULT_REDUCED_MS = 100;
export const OPERATION_MOTION_RESULT_ACTION_MS = 200;
export const OPERATION_MOTION_REDUCED_MAX_MS = 150;

export function operationMotionPlanSelectDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_PLAN_SELECT_MS;
}

export function operationMotionDispatchDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_DISPATCH_MS;
}

export function operationMotionDispatchSentDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_DISPATCH_SENT_MS;
}

export function operationMotionScanDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_SCAN_MS;
}

export function operationMotionFindingRevealTiming(
  index: number,
  reducedMotion: boolean,
): { durationMs: number; delayMs: number; enabled: boolean } {
  if (reducedMotion) {
    return { durationMs: 0, delayMs: 0, enabled: false };
  }
  return {
    durationMs: OPERATION_MOTION_FINDING_REVEAL_MS,
    delayMs: index * OPERATION_MOTION_FINDING_STAGGER_MS,
    enabled: true,
  };
}

export function operationMotionFieldAutoCompleteDurationMs(reducedMotion: boolean): number {
  return reducedMotion ? OPERATION_MOTION_FIELD_REDUCED_MS : OPERATION_MOTION_FIELD_PROGRESS_MS;
}

export function operationMotionFieldReducedAutoCompleteDurationMs(
  reducedMotion: boolean,
): number {
  return reducedMotion ? OPERATION_MOTION_FIELD_REDUCED_MS : OPERATION_MOTION_FIELD_PROGRESS_MS;
}

export function operationMotionFieldStepDurationMs(reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.round(OPERATION_MOTION_FIELD_PROGRESS_MS / 5);
}

export function operationMotionFieldCompleteHighlightMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_FIELD_COMPLETE_HIGHLIGHT_MS;
}

export function operationMotionFieldMicroRevealMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_FIELD_MICRO_REVEAL_MS;
}

export function operationMotionResultRevealStaggerMs(reducedMotion: boolean): number {
  return reducedMotion ? 0 : OPERATION_MOTION_RESULT_STAGGER_MS;
}

export function operationMotionResultRevealTotalMs(reducedMotion: boolean): number {
  return reducedMotion ? OPERATION_MOTION_RESULT_REDUCED_MS : OPERATION_MOTION_RESULT_TOTAL_MS;
}
