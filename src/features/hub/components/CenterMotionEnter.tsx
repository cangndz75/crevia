import { type ReactNode } from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';

import { MOTION_DENSITY_CAPS } from '@/core/motion';
import { CreviaAnimatedCard } from '@/shared/motion';

type CenterMotionEnterProps = {
  children: ReactNode;
  index: number;
  reducedMotion?: boolean;
  day?: number;
  hubMotionEnabled?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function CenterMotionEnter({
  children,
  index,
  reducedMotion = false,
  day,
  hubMotionEnabled = true,
  disabled,
  style,
}: CenterMotionEnterProps) {
  const capped = index >= MOTION_DENSITY_CAPS.hub.maxAnimatedItems;
  const isDisabled = disabled ?? (!hubMotionEnabled || capped);

  return (
    <CreviaAnimatedCard
      surface="hub"
      motionKind="compact_card_enter"
      index={index}
      disabled={isDisabled}
      reducedMotion={reducedMotion}
      day={day}
      style={style}>
      {children}
    </CreviaAnimatedCard>
  );
}
