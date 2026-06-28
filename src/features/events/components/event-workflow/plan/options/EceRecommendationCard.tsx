import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanOptionsPresentation } from '@/features/events/utils/eventPlanOptionsPresentation';
import { shadows } from '@/ui/theme/shadows';

type EceRecommendationCardProps = {
  recommendation: EventPlanOptionsPresentation['eceRecommendation'];
  reducedMotion?: boolean;
};

export function EceRecommendationCard({
  recommendation,
  reducedMotion = false,
}: EceRecommendationCardProps) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : 10);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withDelay(220, withTiming(1, { duration: 220 }));
    translateY.value = withDelay(220, withTiming(0, { duration: 220 }));
  }, [opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[styles.wrap, shadows.soft, animatedStyle]}
      accessibilityRole="text"
      accessibilityLabel={recommendation.accessibilityLabel}>
      <View style={styles.avatar}>
        <Ionicons name="person-circle-outline" size={28} color={eventDetail.tealDark} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>{recommendation.title}</Text>
        <Text style={styles.body}>{recommendation.body}</Text>
      </View>
      <Ionicons name="sparkles-outline" size={16} color={eventDetail.teal} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: eventDetail.screenPadding,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(11, 107, 97, 0.12)',
    backgroundColor: 'rgba(255,255,255,0.92)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: eventDetail.tealDark,
  },
  body: {
    fontSize: 13,
    fontWeight: '500',
    color: eventDetail.textMuted,
    lineHeight: 18,
  },
});
