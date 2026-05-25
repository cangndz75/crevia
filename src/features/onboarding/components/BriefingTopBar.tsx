import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { OnboardingProgressDots } from '@/features/onboarding/components/OnboardingProgressDots';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type BriefingTopBarProps = {
  onBack?: () => void;
  currentStep?: number;
  totalSteps?: number;
  phaseLabel?: string;
};

export function BriefingTopBar({
  onBack,
  currentStep = 4,
  totalSteps = 4,
  phaseLabel = 'Günün Başlangıcı',
}: BriefingTopBarProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Geri">
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>

        <View style={styles.center}>
          <OnboardingProgressDots
            current={currentStep}
            total={totalSteps}
            phaseLabel={phaseLabel}
          />
        </View>

        <View style={styles.iconBtn}>
          <Ionicons name="stats-chart-outline" size={20} color={colors.textSecondary} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    zIndex: 1,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
  },
});
