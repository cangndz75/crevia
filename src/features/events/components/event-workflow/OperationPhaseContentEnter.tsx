import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { CreviaMotionView } from '@/shared/motion';

type OperationPhaseContentEnterProps = {
  children: ReactNode;
  reducedMotion?: boolean;
  index?: number;
};

export function OperationPhaseContentEnter({
  children,
  reducedMotion = false,
  index = 2,
}: OperationPhaseContentEnterProps) {
  return (
    <CreviaMotionView
      motionKind="card_enter"
      surface="shared"
      index={index}
      reducedMotion={reducedMotion}
      style={styles.wrap}>
      <View style={styles.inner}>{children}</View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  inner: {
    gap: 12,
  },
});
