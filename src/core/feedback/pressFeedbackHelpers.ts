export const PRESS_SCALE_ACTIVE = 0.98;
export const PRESS_OPACITY_ACTIVE = 0.88;
export const PRESS_MUTED_OPACITY = 0.55;

export type PressFeedbackOptions = {
  pressed: boolean;
  disabled?: boolean;
};

export type PressFeedbackViewStyle = {
  opacity?: number;
  transform?: { scale: number }[];
};

export function getPressFeedbackStyle({
  pressed,
  disabled,
}: PressFeedbackOptions): PressFeedbackViewStyle {
  if (disabled) {
    return { opacity: PRESS_MUTED_OPACITY };
  }
  if (pressed) {
    return {
      opacity: PRESS_OPACITY_ACTIVE,
      transform: [{ scale: PRESS_SCALE_ACTIVE }],
    };
  }
  return {};
}

export function decisionOptionCardAllowsPressFeedback(insufficient: boolean): boolean {
  return !insufficient;
}
