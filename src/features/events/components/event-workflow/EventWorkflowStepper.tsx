import { StyleSheet, Text, View } from 'react-native';

import {
  OPERATION_WORKFLOW_STEPS,
  type OperationWorkflowStepId,
} from '@/features/events/utils/eventWorkflowPresentation';
import { eventDetail } from '@/features/events/theme/eventDetailTokens';

type EventWorkflowStepperProps = {
  activeStep: OperationWorkflowStepId;
  /** Plan ekranında daha az dikey yer kaplar */
  compact?: boolean;
};

function stepIndex(step: OperationWorkflowStepId): number {
  return OPERATION_WORKFLOW_STEPS.findIndex((s) => s.id === step);
}

export function EventWorkflowStepper({
  activeStep,
  compact = false,
}: EventWorkflowStepperProps) {
  const activeIdx = stepIndex(activeStep);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={styles.track}>
        {OPERATION_WORKFLOW_STEPS.map((step, index) => {
          const active = index === activeIdx;
          const past = index < activeIdx;
          const stepNumber = index + 1;

          return (
            <View key={step.id} style={[styles.stepCol, compact && styles.stepColCompact]}>
              <View style={[styles.nodeRow, compact && styles.nodeRowCompact]}>
                <View
                  style={[
                    styles.node,
                    compact && styles.nodeCompact,
                    active && styles.nodeActive,
                    past && styles.nodePast,
                    !active && !past && styles.nodeInactive,
                  ]}>
                  <Text
                    style={[
                      styles.nodeNumber,
                      compact && styles.nodeNumberCompact,
                      active && styles.nodeNumberActive,
                      past && styles.nodeNumberPast,
                      !active && !past && styles.nodeNumberInactive,
                    ]}>
                    {stepNumber}
                  </Text>
                </View>
                {index < OPERATION_WORKFLOW_STEPS.length - 1 ? (
                  <View
                    style={[
                      styles.connector,
                      (past || active) && styles.connectorActive,
                    ]}
                  />
                ) : null}
              </View>
              <Text
                style={[
                  styles.label,
                  compact && styles.labelCompact,
                  active && styles.labelActive,
                ]}
                numberOfLines={1}>
                {step.label}
              </Text>
              {active ? (
                <View style={[styles.activeUnderline, compact && styles.activeUnderlineCompact]} />
              ) : (
                <View style={[styles.underlineSpacer, compact && styles.underlineSpacerCompact]} />
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
  },
  wrapCompact: {
    marginVertical: -2,
  },
  track: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    minWidth: 56,
  },
  stepColCompact: {
    minWidth: 52,
  },
  nodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 32,
  },
  nodeRowCompact: {
    height: 26,
  },
  node: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  nodeActive: {
    backgroundColor: eventDetail.tealDark,
  },
  nodePast: {
    backgroundColor: eventDetail.teal,
  },
  nodeInactive: {
    backgroundColor: '#D4DAD8',
    borderWidth: 0,
  },
  nodeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  nodeNumber: {
    fontSize: 12,
    fontWeight: '800',
  },
  nodeNumberCompact: {
    fontSize: 11,
  },
  nodeNumberActive: {
    color: '#FFFFFF',
  },
  nodeNumberPast: {
    color: '#FFFFFF',
  },
  nodeNumberInactive: {
    color: '#FFFFFF',
  },
  connector: {
    position: 'absolute',
    left: '58%',
    right: '-42%',
    top: 13,
    height: 0,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(107, 125, 120, 0.35)',
    zIndex: 0,
  },
  connectorActive: {
    borderColor: 'rgba(11, 107, 97, 0.45)',
    borderStyle: 'solid',
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: eventDetail.tealDark,
    fontWeight: '800',
  },
  labelCompact: {
    marginTop: 4,
    fontSize: 9,
  },
  activeUnderline: {
    marginTop: 4,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: eventDetail.teal,
  },
  underlineSpacer: {
    marginTop: 4,
    height: 3,
  },
  activeUnderlineCompact: {
    marginTop: 2,
    width: 24,
    height: 2,
  },
  underlineSpacerCompact: {
    marginTop: 2,
    height: 2,
  },
});
