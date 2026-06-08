import { type ReactNode } from 'react';
import { Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import type { MotionKind, MotionSurface } from '@/core/motion';

import { CreviaMotionView } from './CreviaMotionView';

type CreviaAnimatedLineProps = {
  text?: string;
  children?: ReactNode;
  maxLines?: number;
  motionKind?: Extract<MotionKind, 'line_appear' | 'chip_appear'>;
  surface?: MotionSurface;
  index?: number;
  day?: number;
  disabledMotion?: boolean;
  reducedMotion?: boolean;
  style?: StyleProp<TextStyle>;
  containerStyle?: StyleProp<ViewStyle>;
};

export function CreviaAnimatedLine({
  text,
  children,
  maxLines = 2,
  motionKind = 'line_appear',
  surface = 'shared',
  index = 0,
  day,
  disabledMotion = false,
  reducedMotion = false,
  style,
  containerStyle,
}: CreviaAnimatedLineProps) {
  return (
    <CreviaMotionView
      motionKind={motionKind}
      surface={surface}
      index={index}
      day={day}
      disabled={disabledMotion}
      reducedMotion={reducedMotion}
      intensity="subtle"
      style={containerStyle}>
      {children ?? (
        <Text style={style} numberOfLines={maxLines} ellipsizeMode="tail">
          {text}
        </Text>
      )}
    </CreviaMotionView>
  );
}
