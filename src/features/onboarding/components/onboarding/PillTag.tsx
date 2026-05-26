import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

type PillTagProps = {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function PillTag({ label, icon }: PillTagProps) {
  return (
    <View style={styles.pill}>
      {icon ? (
        <Ionicons name={icon} size={13} color={onboardingTokens.textMuted} />
      ) : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: onboardingRadii.pill,
    backgroundColor: onboardingTokens.card,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
});
