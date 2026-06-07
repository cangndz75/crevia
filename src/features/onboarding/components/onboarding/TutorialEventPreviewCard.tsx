import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { TUTORIAL_EVENT } from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

type TutorialEventPreviewCardProps = {
  compact?: boolean;
};

export function TutorialEventPreviewCard({ compact = false }: TutorialEventPreviewCardProps) {
  return (
    <Animated.View
      entering={FadeInDown.delay(60).duration(380)}
      style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.topRow}>
        <View style={styles.chip}>
          <Ionicons name="alert-circle-outline" size={12} color={onboardingTokens.primary} />
          <Text style={styles.chipText}>{TUTORIAL_EVENT.chip}</Text>
        </View>
        <Text style={styles.time}>{TUTORIAL_EVENT.time}</Text>
      </View>

      <Text
        style={[styles.title, compact && styles.titleCompact]}
        numberOfLines={1}
        ellipsizeMode="tail">
        {TUTORIAL_EVENT.title}
      </Text>
      <Text
        style={[styles.description, compact && styles.descriptionCompact]}
        numberOfLines={compact ? 2 : 3}
        ellipsizeMode="tail">
        {TUTORIAL_EVENT.description}
      </Text>

      <View style={styles.advisorRow}>
        <View style={styles.advisorIcon}>
          <Ionicons name="bulb-outline" size={14} color={onboardingTokens.primary} />
        </View>
        <Text
          style={[styles.advisorText, compact && styles.advisorTextCompact]}
          numberOfLines={compact ? 1 : 2}
          ellipsizeMode="tail">
          {TUTORIAL_EVENT.advisorTip}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.xl,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: 14,
    gap: 8,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardCompact: {
    padding: 10,
    gap: 6,
    borderRadius: onboardingRadii.lg,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: onboardingTokens.lavender,
  },
  chipText: {
    fontSize: 10,
    fontWeight: '900',
    color: onboardingTokens.primary,
    letterSpacing: 0.4,
  },
  time: {
    fontSize: 11,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  titleCompact: {
    fontSize: 16,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  descriptionCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  advisorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 2,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: onboardingTokens.border,
  },
  advisorIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: onboardingTokens.lavender,
    flexShrink: 0,
  },
  advisorText: {
    flex: 1,
    minWidth: 0,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    color: onboardingTokens.textMain,
  },
  advisorTextCompact: {
    fontSize: 11,
    lineHeight: 15,
  },
});
