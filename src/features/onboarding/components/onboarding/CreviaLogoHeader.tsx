import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

export function CreviaLogoHeader() {
  return (
    <Animated.View entering={FadeInDown.duration(500)} style={styles.wrap}>
      <View style={styles.iconBadge}>
        <Ionicons name="business" size={16} color={onboardingTokens.primary} />
        <Ionicons name="leaf" size={12} color={onboardingTokens.mint} style={styles.leaf} />
      </View>
      <Text style={styles.wordmark}>Crevia</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaf: {
    position: 'absolute',
    bottom: 5,
    right: 5,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '300',
    color: onboardingTokens.textMain,
    letterSpacing: -0.8,
    fontStyle: 'italic',
  },
});
