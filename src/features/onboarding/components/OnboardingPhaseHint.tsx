import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

type OnboardingPhaseHintProps = {
  text: string;
};

/** Kısa faz rehberi — Day 1 operasyon akışında, karar kartlarını şişirmez. */
export function OnboardingPhaseHint({ text }: OnboardingPhaseHintProps) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="information-circle-outline" size={14} color={colors.primary} />
      <Text style={styles.text} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: 'rgba(11, 107, 97, 0.08)',
    borderRadius: 10,
    minWidth: 0,
    flexShrink: 1,
  },
  text: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
  },
});
