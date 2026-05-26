import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

type ProgressDotsProps = {
  current: number;
  total: number;
  showCounter?: boolean;
};

function Dot({ active, done }: { active: boolean; done: boolean }) {
  const animStyle = useAnimatedStyle(() => ({
    width: withSpring(active ? 22 : 8, { damping: 18, stiffness: 200 }),
    opacity: withSpring(done ? 0.55 : 1),
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        (active || done) && styles.dotFilled,
        animStyle,
      ]}
    />
  );
}

export function ProgressDots({ current, total, showCounter = true }: ProgressDotsProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          return <Dot key={step} active={step === current} done={step < current} />;
        })}
      </View>
      {showCounter ? (
        <Text style={styles.counter}>
          {current} / {total}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D8D4F0',
  },
  dotFilled: {
    backgroundColor: onboardingTokens.primary,
  },
  counter: {
    fontSize: 11,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
});
