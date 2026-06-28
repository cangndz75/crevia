import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { PlanBriefingStepperItem } from '@/features/events/utils/eventPlanBriefingPresentation';

type PlanlaProgressStepperProps = {
  steps: PlanBriefingStepperItem[];
  accessibilityLabel: string;
  reducedMotion?: boolean;
};

export function PlanlaProgressStepper({
  steps,
  accessibilityLabel,
  reducedMotion = false,
}: PlanlaProgressStepperProps) {
  return (
    <View
      style={styles.wrap}
      accessibilityRole="summary"
      accessibilityLabel={accessibilityLabel}>
      <View style={styles.row}>
        {steps.map((step, index) => (
          <StepItem
            key={step.label}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            reducedMotion={reducedMotion}
          />
        ))}
      </View>
    </View>
  );
}

function StepItem({
  step,
  index,
  isLast,
  reducedMotion,
}: {
  step: PlanBriefingStepperItem;
  index: number;
  isLast: boolean;
  reducedMotion: boolean;
}) {
  const isCompleted = step.state === 'completed';
  const isActive = step.state === 'active';
  const connectorProgress = useSharedValue(reducedMotion ? 1 : 0);
  const checkScale = useSharedValue(reducedMotion ? 1 : 0.8);
  const activeScale = useSharedValue(reducedMotion ? 1 : 0.92);
  const fadeOpacity = useSharedValue(reducedMotion ? 1 : 0);

  useEffect(() => {
    const baseDelay = index * 80;
    if (reducedMotion) {
      connectorProgress.value = isCompleted ? 1 : 0;
      checkScale.value = 1;
      activeScale.value = 1;
      fadeOpacity.value = 1;
      return;
    }

    fadeOpacity.value = withDelay(baseDelay, withTiming(1, { duration: 200 }));

    if (isCompleted) {
      checkScale.value = withDelay(baseDelay + 40, withSpring(1, { damping: 14, stiffness: 220 }));
      connectorProgress.value = withDelay(baseDelay + 60, withTiming(1, { duration: 240 }));
    }

    if (isActive) {
      activeScale.value = withDelay(
        baseDelay + 80,
        reducedMotion
          ? withTiming(1, { duration: 180 })
          : withSequence(
              withSpring(1.06, { damping: 10, stiffness: 240 }),
              withSpring(1, { damping: 14, stiffness: 200 }),
            ),
      );
    }
  }, [
    activeScale,
    checkScale,
    connectorProgress,
    fadeOpacity,
    index,
    isActive,
    isCompleted,
    reducedMotion,
  ]);

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
  }));

  const circleAnimStyle = useAnimatedStyle(() => {
    if (isCompleted) {
      return { transform: [{ scale: checkScale.value }] };
    }
    if (isActive) {
      return { transform: [{ scale: activeScale.value }] };
    }
    return { transform: [{ scale: 1 }] };
  });

  const connectorStyle = useAnimatedStyle(() => ({
    opacity: isCompleted ? connectorProgress.value : 0.35,
    transform: [{ scaleX: isCompleted ? connectorProgress.value : 1 }],
  }));

  return (
    <Animated.View style={[styles.stepItem, fadeStyle]}>
      <View style={styles.stepTop}>
        <Animated.View
          style={[
            styles.circle,
            isCompleted && styles.circleCompleted,
            isActive && styles.circleActive,
            !isCompleted && !isActive && styles.circleUpcoming,
            circleAnimStyle,
          ]}>
          {isCompleted ? (
            <Ionicons name="checkmark" size={13} color="#FFFFFF" />
          ) : (
            <Text
              style={[
                styles.stepNumber,
                (isActive || isCompleted) && styles.stepNumberActive,
              ]}>
              {index + 1}
            </Text>
          )}
        </Animated.View>
        {!isLast ? (
          <Animated.View
            style={[
              styles.connector,
              isCompleted ? styles.connectorDone : styles.connectorFuture,
              connectorStyle,
            ]}
          />
        ) : null}
      </View>
      <Text
        style={[
          styles.label,
          isActive && styles.labelActive,
          isCompleted && styles.labelCompleted,
        ]}
        numberOfLines={1}>
        {step.label}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding,
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    minHeight: 52,
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    minWidth: 0,
  },
  stepTop: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 30,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  circleCompleted: {
    backgroundColor: eventDetail.teal,
    borderWidth: 0,
  },
  circleActive: {
    backgroundColor: eventDetail.teal,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: eventDetail.teal,
    shadowOpacity: 0.22,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  circleUpcoming: {
    backgroundColor: 'rgba(107, 125, 120, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(107, 125, 120, 0.18)',
  },
  stepNumber: {
    fontSize: 11,
    fontWeight: '900',
    color: eventDetail.textMuted,
  },
  stepNumberActive: {
    color: '#FFFFFF',
  },
  connector: {
    position: 'absolute',
    left: '58%',
    right: '-42%',
    top: 13,
    height: 2,
    borderRadius: 1,
    transformOrigin: 'left center',
  },
  connectorDone: {
    backgroundColor: eventDetail.teal,
  },
  connectorFuture: {
    backgroundColor: 'rgba(107, 125, 120, 0.22)',
    borderStyle: 'dashed',
  },
  label: {
    marginTop: 6,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: eventDetail.textMuted,
    textAlign: 'center',
    maxWidth: 72,
  },
  labelActive: {
    color: eventDetail.tealDark,
    fontWeight: '900',
  },
  labelCompleted: {
    color: eventDetail.tealDark,
    fontWeight: '800',
  },
});
