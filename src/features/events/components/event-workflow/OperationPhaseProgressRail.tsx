import { StyleSheet, Text, View } from 'react-native';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { OperationPhaseProgressPresentation } from '@/features/events/utils/operationPhaseTransitionPresentation';
import { CreviaMotionView } from '@/shared/motion';

type OperationPhaseProgressRailProps = {
  progress: OperationPhaseProgressPresentation;
  reducedMotion?: boolean;
};

const DOT_COLORS = {
  completed: eventDetail.success,
  active: '#C58B18',
  pending: 'rgba(107, 125, 120, 0.35)',
};

export function OperationPhaseProgressRail({
  progress,
  reducedMotion = false,
}: OperationPhaseProgressRailProps) {
  return (
    <CreviaMotionView
      motionKind="line_appear"
      surface="shared"
      index={0}
      reducedMotion={reducedMotion}
      style={styles.wrap}>
      <Text style={styles.phaseLabel} numberOfLines={1}>
        {progress.phaseLabel}
      </Text>
      <View style={styles.dotRow}>
        {progress.items.map((item) => (
          <View
            key={item.id}
            style={[
              styles.dot,
              item.status === 'completed' && { backgroundColor: DOT_COLORS.completed },
              item.status === 'active' && { backgroundColor: DOT_COLORS.active },
              item.status === 'pending' && { backgroundColor: DOT_COLORS.pending },
            ]}
            accessibilityLabel={`${item.label} ${item.status}`}
          />
        ))}
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingBottom: 8,
    gap: 6,
  },
  phaseLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: eventDetail.tealDark,
  },
  dotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
