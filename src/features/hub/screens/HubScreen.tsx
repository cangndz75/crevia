import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { ActiveEventsSection } from '@/features/hub/components/ActiveEventsSection';
import { CrisisQueuePreview } from '@/features/hub/components/CrisisQueuePreview';
import { DailyMissionsSection } from '@/features/hub/components/DailyMissionsSection';
import { HubHeader } from '@/features/hub/components/HubHeader';
import { RiskPressureCard } from '@/features/hub/components/RiskPressureCard';
import { useGameStore } from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function HubScreen() {
  const router = useRouter();
  const endCurrentDay = useGameStore((s) => s.endCurrentDay);
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
    <AppScreen safeEdges={['left', 'right']} contentStyle={styles.content}>
      <HubHeader />
      <View style={styles.body}>
        <RiskPressureCard />
        <CrisisQueuePreview />
        <DailyMissionsSection />
        <ActiveEventsSection />

        <AnimatedPressable
          onPressIn={() => {
            scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
          }}
          onPressOut={() => {
            scale.value = withSpring(1, { damping: 15, stiffness: 300 });
          }}
          onPress={handleEndDay}
          style={[styles.endDayButton, animatedStyle]}>
          <Ionicons name="flag-outline" size={20} color={colors.textInverse} />
          <Text style={styles.endDayText}>Günü Bitir</Text>
        </AnimatedPressable>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    gap: 0,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: 28,
    paddingBottom: spacing.xxl,
  },
  endDayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: 16,
    ...shadows.soft,
  },
  endDayText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
