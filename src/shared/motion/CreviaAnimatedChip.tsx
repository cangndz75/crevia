import { type ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import type { MotionKind, MotionSurface } from '@/core/motion';

import { CreviaMotionView } from './CreviaMotionView';

type CreviaAnimatedChipProps = {
  label?: string;
  children?: ReactNode;
  motionKind?: Extract<MotionKind, 'chip_appear' | 'line_appear'>;
  surface?: MotionSurface;
  index?: number;
  disabledMotion?: boolean;
  reducedMotion?: boolean;
  tone?: 'neutral' | 'success' | 'watch';
  style?: StyleProp<ViewStyle>;
};

export function CreviaAnimatedChip({
  label,
  children,
  motionKind = 'chip_appear',
  surface = 'shared',
  index = 0,
  disabledMotion = false,
  reducedMotion = false,
  tone = 'neutral',
  style,
}: CreviaAnimatedChipProps) {
  return (
    <CreviaMotionView
      motionKind={motionKind}
      surface={surface}
      index={index}
      disabled={disabledMotion}
      reducedMotion={reducedMotion}
      intensity="subtle"
      style={[styles.chip, styles[tone], style]}>
      {children ?? (
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {label}
        </Text>
      )}
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 0,
    flexShrink: 1,
  },
  neutral: {},
  success: {},
  watch: {},
  label: {
    flexShrink: 1,
    minWidth: 0,
  },
});
