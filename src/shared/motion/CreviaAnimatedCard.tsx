import { type ReactNode } from 'react';
import {
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { MotionIntensity, MotionKind, MotionSurface } from '@/core/motion';

import { CreviaMotionView } from './CreviaMotionView';

type CreviaAnimatedCardProps = {
  children: ReactNode;
  motionKind?: Extract<MotionKind, 'card_enter' | 'compact_card_enter' | 'report_section_enter' | 'result_emphasis' | 'onboarding_step_transition'>;
  surface?: MotionSurface;
  index?: number;
  disabled?: boolean;
  reducedMotion?: boolean;
  intensity?: MotionIntensity;
  day?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
};

export function CreviaAnimatedCard({
  children,
  motionKind = 'card_enter',
  surface = 'shared',
  index = 0,
  disabled = false,
  reducedMotion = false,
  intensity = 'standard',
  day,
  style,
}: CreviaAnimatedCardProps) {
  return (
    <CreviaMotionView
      motionKind={motionKind}
      surface={surface}
      index={index}
      disabled={disabled}
      reducedMotion={reducedMotion}
      intensity={intensity}
      day={day}
      style={style}>
      {children}
    </CreviaMotionView>
  );
}
