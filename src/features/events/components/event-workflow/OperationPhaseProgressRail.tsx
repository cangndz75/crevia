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
      <View style={styles.stepRow}>
        {progress.items.map((item, index) => {
          const active = item.status === 'active';
          const completed = item.status === 'completed';
          return (
            <View key={item.id} style={styles.stepItem}>
              <View
                style={[
                  styles.stepCircle,
                  completed && styles.stepCircleCompleted,
                  active && styles.stepCircleActive,
                ]}
                accessibilityLabel={`${item.label} ${item.status}`}>
                <Text
                  style={[
                    styles.stepNumber,
                    (active || completed) && styles.stepNumberActive,
                  ]}>
                  {index + 1}
                </Text>
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  active && styles.stepLabelActive,
                ]}
                numberOfLines={1}>
                {item.label}
              </Text>
              {index < progress.items.length - 1 ? (
                <View
                  style={[
                    styles.stepConnector,
                    completed && styles.stepConnectorDone,
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </CreviaMotionView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingBottom: 6,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  stepItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 0,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(107, 125, 120, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(107, 125, 120, 0.18)',
  },
  stepCircleCompleted: {
    backgroundColor: DOT_COLORS.completed,
    borderColor: DOT_COLORS.completed,
  },
  stepCircleActive: {
    backgroundColor: eventDetail.teal,
    borderColor: '#FFFFFF',
  },
  stepNumber: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: '900',
    color: eventDetail.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 30,
    maxWidth: 58,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: '800',
    color: eventDetail.textMuted,
    textAlign: 'left',
  },
  stepLabelActive: {
    color: eventDetail.tealDark,
    fontWeight: '900',
  },
  stepConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 5,
    marginRight: 9,
    borderRadius: 2,
    backgroundColor: 'rgba(107, 125, 120, 0.20)',
  },
  stepConnectorDone: {
    backgroundColor: DOT_COLORS.completed,
  },
});
