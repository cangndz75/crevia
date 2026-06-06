import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import {
  EVENT_DECISIONS,
  type EventDecisionOption,
} from '@/features/onboarding/data/onboardingData';
import { onboardingRadii, onboardingTokens } from '@/features/onboarding/theme/onboardingTokens';

const TONE_STYLES = {
  mint: {
    bg: 'rgba(234, 251, 242, 0.95)',
    border: onboardingTokens.green,
    icon: onboardingTokens.green,
  },
  blue: {
    bg: 'rgba(236, 243, 255, 0.95)',
    border: onboardingTokens.blue,
    icon: onboardingTokens.blue,
  },
  orange: {
    bg: 'rgba(255, 244, 229, 0.95)',
    border: onboardingTokens.orange,
    icon: onboardingTokens.orange,
  },
} as const;

type EventCardProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
};

export function EventCard({ selectedDecisionId, onSelectDecision }: EventCardProps) {
  return (
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
    <Animated.View entering={FadeInUp.delay(index * 70).springify()}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={option.title}
        accessibilityState={{ selected }}
        style={({ pressed }) => [
          styles.option,
          { backgroundColor: tone.bg, borderColor: selected ? tone.border : onboardingTokens.border },
          selected && styles.optionSelected,
          pressed && styles.pressed,
        ]}>
        <View style={[styles.iconWrap, { backgroundColor: tone.border }]}>
          <Ionicons name={option.icon} size={24} color="#FFFFFF" />
        </View>
        <View style={styles.optionText}>
          <View style={styles.optionTitleRow}>
            <Text style={styles.optionTitle} numberOfLines={1} ellipsizeMode="tail">
              {option.title}
            </Text>
            <View style={[styles.badge, { borderColor: tone.border }]}>
              <Text
                style={[styles.badgeText, { color: tone.icon }]}
                numberOfLines={1}
                ellipsizeMode="tail">
                {option.badge}
              </Text>
            </View>
          </View>
          <Text style={styles.optionSub} numberOfLines={2} ellipsizeMode="tail">
            {option.subtitle}
          </Text>
        </View>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'chevron-forward'}
          size={22}
          color={selected ? onboardingTokens.primary : onboardingTokens.textMuted}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 12,
  },
  option: {
    minHeight: 88,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 2,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  optionSelected: {
    shadowColor: onboardingTokens.primary,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 5,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  optionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 19,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  badge: {
    maxWidth: 80,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
    backgroundColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  optionSub: {
    fontSize: 14,
    lineHeight: 19,
    color: onboardingTokens.textMuted,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.8,
  },
});
