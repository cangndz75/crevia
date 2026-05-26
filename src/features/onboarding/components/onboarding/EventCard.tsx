import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';

import {
  EVENT_DECISIONS,
  TUTORIAL_EVENT,
  type EventDecisionOption,
} from '@/features/onboarding/data/onboardingData';
import { onboardingAssets } from '@/features/onboarding/data/onboardingAssets';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';
import { spacing } from '@/ui/theme/spacing';

const TONE_STYLES = {
  mint: {
    bg: 'rgba(126, 223, 162, 0.18)',
    border: onboardingTokens.mint,
    icon: '#2D9B5A',
  },
  blue: {
    bg: 'rgba(123, 167, 255, 0.2)',
    border: onboardingTokens.blue,
    icon: onboardingTokens.primary,
  },
  orange: {
    bg: 'rgba(255, 182, 110, 0.22)',
    border: onboardingTokens.orange,
    icon: '#D97706',
  },
} as const;

type EventCardProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
};

export function EventCard({ selectedDecisionId, onSelectDecision }: EventCardProps) {
  return (
    <Animated.View entering={FadeIn.duration(400).springify()} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.chip}>
          <Ionicons name="megaphone-outline" size={12} color={onboardingTokens.primary} />
          <Text style={styles.chipText}>{TUTORIAL_EVENT.chip}</Text>
        </View>
        <Text style={styles.time}>{TUTORIAL_EVENT.time}</Text>
      </View>

      <View style={styles.hero}>
        <Image source={onboardingAssets.eventHero} style={styles.heroImage} contentFit="cover" />
      </View>

      <Text style={styles.title}>{TUTORIAL_EVENT.title}</Text>
      <Text style={styles.desc}>{TUTORIAL_EVENT.description}</Text>

      <View style={styles.options}>
        {EVENT_DECISIONS.map((option, index) => (
          <DecisionRow
            key={option.id}
            option={option}
            index={index}
            selected={selectedDecisionId === option.id}
            onPress={() => onSelectDecision(option.id)}
          />
        ))}
      </View>
    </Animated.View>
  );
}

function DecisionRow({
  option,
  index,
  selected,
  onPress,
}: {
  option: EventDecisionOption;
  index: number;
  selected: boolean;
  onPress: () => void;
}) {
  const tone = TONE_STYLES[option.tone];

  return (
    <Animated.View entering={FadeInUp.delay(360 + index * 70).springify()}>
      <Pressable
        onPress={onPress}
        style={[
          styles.option,
          { backgroundColor: tone.bg, borderColor: tone.border },
          selected && styles.optionSelected,
        ]}>
        <Ionicons name={option.icon} size={18} color={tone.icon} />
        <View style={styles.optionText}>
          <Text style={styles.optionTitle}>{option.title}</Text>
          <Text style={styles.optionSub}>{option.subtitle}</Text>
        </View>
        {selected ? (
          <Ionicons name="checkmark-circle" size={20} color={onboardingTokens.primary} />
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    maxWidth: 328,
    alignSelf: 'center',
    backgroundColor: onboardingTokens.card,
    borderRadius: onboardingRadii.xl,
    borderWidth: 1,
    borderColor: onboardingTokens.border,
    padding: spacing.lg,
    gap: spacing.sm,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: onboardingRadii.sm,
    backgroundColor: 'rgba(169, 156, 255, 0.2)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '800',
    color: onboardingTokens.primaryDark,
    letterSpacing: 0.5,
  },
  time: {
    fontSize: 12,
    fontWeight: '600',
    color: onboardingTokens.textMuted,
  },
  hero: {
    height: 108,
    borderRadius: onboardingRadii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  desc: {
    fontSize: 13,
    lineHeight: 19,
    color: onboardingTokens.textMuted,
    fontWeight: '500',
  },
  options: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: onboardingRadii.lg,
    borderWidth: 1.5,
  },
  optionSelected: {
    borderWidth: 2.5,
    shadowColor: onboardingTokens.primary,
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  optionText: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: onboardingTokens.textMain,
  },
  optionSub: {
    fontSize: 11,
    color: onboardingTokens.textMuted,
    fontWeight: '500',
  },
});
