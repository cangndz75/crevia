import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import {
  TIMELINE_STEPS,
  type EventTimelineStatus,
} from '@/features/events/utils/eventDetailDecisionUtils';

type EventStatusTimelineProps = {
  activeStatus: EventTimelineStatus;
};

function StepNode({
  active,
  isReview,
}: {
  active: boolean;
  isReview: boolean;
}) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!active || !isReview) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 900 }),
        withTiming(1, { duration: 900 }),
      ),
      -1,
      true,
    );
  }, [active, isReview, pulse]);

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (active) {
    return (
      <Animated.View style={[styles.activeOuter, glowStyle]}>
        <View style={styles.activeInner}>
          {isReview ? (
            <Ionicons name="search" size={12} color={eventDetail.tealDark} />
          ) : (
            <View style={styles.activeDot} />
          )}
        </View>
      </Animated.View>
    );
  }

  return <View style={styles.inactiveNode} />;
}

export function EventStatusTimeline({ activeStatus }: EventStatusTimelineProps) {
  const foundIndex = TIMELINE_STEPS.findIndex((s) => s.status === activeStatus);
  const activeIndex = foundIndex >= 0 ? foundIndex : 1;

  return (
    <View style={styles.wrap}>
      <View style={styles.trackRow}>
        {TIMELINE_STEPS.map((step, index) => {
          const active = index === activeIndex;
          const past = index < activeIndex;
          const isLast = index === TIMELINE_STEPS.length - 1;

          return (
            <View key={step.status} style={styles.stepCol}>
              <View style={styles.nodeRow}>
                {!isLast ? (
                  <View
                    style={[
                      styles.connector,
                      (past || active) && styles.connectorActive,
                    ]}
                  />
                ) : null}
                <StepNode
                  active={active}
                  isReview={step.status === 'review' && active}
                />
              </View>
              <Text
                style={[styles.label, active && styles.labelActive]}
                numberOfLines={1}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: eventDetail.screenPadding - 4,
    marginTop: 4,
  },
  trackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stepCol: {
    flex: 1,
    alignItems: 'center',
    minWidth: 52,
  },
  nodeRow: {
    width: '100%',
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    position: 'absolute',
    left: '50%',
    right: '-50%',
    top: 13,
    height: 2,
    backgroundColor: 'rgba(6, 63, 59, 0.12)',
    zIndex: 0,
  },
  connectorActive: {
    backgroundColor: eventDetail.teal,
    opacity: 0.45,
  },
  inactiveNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: 'rgba(6, 63, 59, 0.18)',
    backgroundColor: eventDetail.card,
    zIndex: 1,
  },
  activeOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: eventDetail.mint,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.25)',
    zIndex: 1,
    shadowColor: eventDetail.teal,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 3,
  },
  activeInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: eventDetail.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: eventDetail.teal,
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
});
