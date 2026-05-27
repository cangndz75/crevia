import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/ui/theme/colors';

import type { TutorialTargetKey } from './tutorialTypes';

type TutorialTargetProps = {
  targetKey: TutorialTargetKey;
  highlighted: boolean;
  children: ReactNode;
};

export function TutorialTarget({
  targetKey,
  highlighted,
  children,
}: TutorialTargetProps) {
  return (
    <View
      style={[styles.wrap, highlighted && styles.highlighted]}
      accessibilityLabel={targetKey}
      collapsable={false}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
  },
  highlighted: {
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
});
