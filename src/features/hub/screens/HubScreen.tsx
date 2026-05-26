import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HubCriticalEventCard } from '@/features/hub/components/HubCriticalEventCard';
import { HubPilotContextCard } from '@/features/hub/components/HubPilotContextCard';
import { HubPilotReportBanner } from '@/features/hub/components/HubPilotReportBanner';
import { HubDailyGoalCard } from '@/features/hub/components/HubDailyGoalCard';
import { HubHeader } from '@/features/hub/components/HubHeader';
import { HubMetricsGrid } from '@/features/hub/components/HubMetricsGrid';
import { HubQuickActions } from '@/features/hub/components/HubQuickActions';
import { HubRegionPulseSection } from '@/features/hub/components/HubRegionPulseSection';
import { HubStatusSummaryCard } from '@/features/hub/components/HubStatusSummaryCard';
import { selectActiveEvents, useGameStore } from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
  const eventCount = useGameStore(selectActiveEvents).length;
  const scale = useSharedValue(1);

  const handleEndDay = () => {
    endCurrentDay();
    router.push('/reports');
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value < 1 ? 0.92 : 1,
  }));

  return (
    <AppScreen
      safeEdges={['left', 'right']}
      contentStyle={styles.content}
      style={styles.screen}>
      <HubHeader />

      <View style={styles.body}>
        <HubStatusSummaryCard />
        <HubMetricsGrid />
        <HubRegionPulseSection />
        <HubPilotContextCard />
        <HubPilotReportBanner />
        <HubCriticalEventCard />
        <HubQuickActions />
        <HubDailyGoalCard />

        {eventCount > 1 && (
          <Pressable
            onPress={() => router.push('/events')}
            style={styles.moreEventsLink}>
            <Text style={styles.moreEventsText}>
              +{eventCount - 1} bekleyen olay daha
            </Text>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.hubGoldDark}
            />
          </Pressable>
        )}

        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          onPress={handleEndDay}
          style={[styles.endDayButton, animatedStyle]}>
          <Ionicons name="moon-outline" size={18} color={colors.textPrimary} />
          <Text style={styles.endDayText}>Günü Bitir</Text>
        </AnimatedPressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.hubCream,
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
  body: {
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  moreEventsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  moreEventsText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.hubGoldDark,
  },
  endDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  endDayText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
  },
});
