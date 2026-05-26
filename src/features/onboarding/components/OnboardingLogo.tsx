import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { onboardingTheme } from '@/features/onboarding/theme/onboardingTheme';
import { spacing } from '@/ui/theme/spacing';

export function OnboardingLogo() {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconBadge}>
        <Ionicons name="business" size={18} color={onboardingTheme.success} />
        <Ionicons
          name="leaf"
          size={14}
          color={onboardingTheme.success}
          style={styles.leaf}
        />
      </View>
      <Text style={styles.wordmark}>Crevia</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: onboardingTheme.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  wordmark: {
    fontSize: 22,
    fontWeight: '800',
    color: onboardingTheme.navy,
    letterSpacing: -0.5,
  },
});
