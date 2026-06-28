import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { eventDetail } from '@/features/events/theme/eventDetailTokens';
import type { EventPlanBriefingPresentation } from '@/features/events/utils/eventPlanBriefingPresentation';

type PlanlaHeaderProps = {
  header: EventPlanBriefingPresentation['header'];
  compact?: boolean;
  reducedMotion?: boolean;
  onBack?: () => void;
};

export function PlanlaHeader({
  header,
  compact = false,
  reducedMotion = false,
  onBack,
}: PlanlaHeaderProps) {
  const opacity = useSharedValue(reducedMotion ? 1 : 0);
  const translateY = useSharedValue(reducedMotion ? 0 : -8);

  useEffect(() => {
    if (reducedMotion) return;
    opacity.value = withTiming(1, { duration: 220 });
    translateY.value = withTiming(0, { duration: 220 });
  }, [opacity, reducedMotion, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.header, animatedStyle]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.backButtonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Geri dön"
          hitSlop={6}>
          <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
        </Pressable>
      ) : (
        <View style={styles.backButton}>
          <Ionicons name="chevron-back" size={21} color={eventDetail.tealDark} />
        </View>
      )}
      <View style={styles.titleBlock}>
        <Text style={[styles.title, compact && styles.titleCompact]}>{header.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {header.subtitle}
        </Text>
      </View>
      <View style={styles.backSpacer} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 52,
    paddingHorizontal: eventDetail.screenPadding,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(6, 63, 59, 0.08)',
  },
  backButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  backSpacer: {
    width: 44,
  },
  titleBlock: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  title: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: '900',
    color: eventDetail.textDark,
  },
  titleCompact: {
    fontSize: 20,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: eventDetail.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
