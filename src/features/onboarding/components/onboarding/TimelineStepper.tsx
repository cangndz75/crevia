import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ROADMAP_DAYS, ROADMAP_HIGHLIGHT_DAY } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

export function TimelineStepper() {
  const lineProgress = useSharedValue(0);

  useEffect(() => {
    lineProgress.value = withTiming(1, { duration: 900 });
  }, [lineProgress]);

  const lineStyle = useAnimatedStyle(() => ({
    width: `${(lineProgress.value * 100 * ROADMAP_HIGHLIGHT_DAY) / ROADMAP_DAYS.length}%`,
  }));

  return (
    <View style={styles.wrap}>
      <View style={styles.daysRow}>
        {ROADMAP_DAYS.map((day, index) => {
          const active = day.day <= ROADMAP_HIGHLIGHT_DAY;
          const highlighted = day.day === ROADMAP_HIGHLIGHT_DAY;
          return (
            <Animated.View
              key={day.id}
              entering={FadeInUp.delay(index * 55).springify()}
              style={styles.dayItem}>
              <View
                style={[
                  styles.dayCard,
                  active && styles.dayCardActive,
                  highlighted && styles.dayCardHighlight,
                ]}>
                <Text style={[styles.dayNum, active && styles.dayNumActive]}>{day.day}</Text>
                <Ionicons
                  name={day.icon}
                  size={14}
                  color={active ? onboardingTokens.primary : onboardingTokens.textMuted}
                />
              </View>
              <Text style={styles.dayLabel} numberOfLines={2}>
                {day.label}
              </Text>
            </Animated.View>
          );
        })}
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.trackFill, lineStyle]} />
        <View style={styles.dotsRow}>
          {ROADMAP_DAYS.map((day) => (
            <View
              key={day.id}
              style={[
                styles.dot,
                day.day <= ROADMAP_HIGHLIGHT_DAY && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 2,
  },
  dayItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: 0,
  },
  dayCard: {
    width: 40,
    height: 44,
    borderRadius: onboardingRadii.sm,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayCardActive: {
    backgroundColor: 'rgba(169, 156, 255, 0.25)',
  },
  dayCardHighlight: {
    borderColor: onboardingTokens.primary,
    borderWidth: 2,
    transform: [{ scale: 1.06 }],
  },
  dayNum: {
    fontSize: 9,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  dayNumActive: {
    color: onboardingTokens.primary,
  },
  dayLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: onboardingTokens.textMain,
    textAlign: 'center',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E4E0F8',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: onboardingTokens.primary,
    borderRadius: 3,
    opacity: 0.35,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#D0CAEF',
  },
  dotActive: {
    backgroundColor: onboardingTokens.primary,
  },
});
