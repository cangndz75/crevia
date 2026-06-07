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
    selectedBg: 'rgba(220, 248, 234, 1)',
  },
  blue: {
    bg: 'rgba(236, 243, 255, 0.95)',
    border: onboardingTokens.blue,
    icon: onboardingTokens.blue,
    selectedBg: 'rgba(224, 236, 255, 1)',
  },
  orange: {
    bg: 'rgba(255, 244, 229, 0.95)',
    border: onboardingTokens.orange,
    icon: onboardingTokens.orange,
    selectedBg: 'rgba(255, 236, 214, 1)',
  },
} as const;

type EventCardProps = {
  selectedDecisionId: string | null;
  onSelectDecision: (id: string) => void;
  compact?: boolean;
};

export function EventCard({
  selectedDecisionId,
  onSelectDecision,
  compact = false,
}: EventCardProps) {
  return (
    <View style={[styles.options, compact && styles.optionsCompact]}>
      <Text style={[styles.sectionLabel, compact && styles.sectionLabelCompact]}>
        Aksiyon seç
      </Text>
      {EVENT_DECISIONS.map((option, index) => (
        <DecisionRow
          key={option.id}
          option={option}
          index={index}
          selected={selectedDecisionId === option.id}
          onPress={() => onSelectDecision(option.id)}
          compact={compact}
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
  compact = false,
}: {
  option: EventDecisionOption;
  index: number;
  selected: boolean;
  onPress: () => void;
  compact?: boolean;
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
          compact && styles.optionCompact,
          {
            backgroundColor: selected ? tone.selectedBg : tone.bg,
            borderColor: selected ? tone.border : onboardingTokens.border,
          },
          selected && styles.optionSelected,
          pressed && styles.pressed,
        ]}>
        <View style={styles.optionHeader}>
          <View
            style={[
              styles.iconWrap,
              compact && styles.iconWrapCompact,
              { backgroundColor: tone.border },
            ]}>
            <Ionicons name={option.icon} size={compact ? 20 : 22} color="#FFFFFF" />
          </View>

          <View style={styles.optionText}>
            <View style={styles.optionTitleRow}>
              <Text
                style={[styles.optionTitle, compact && styles.optionTitleCompact]}
                numberOfLines={1}
                ellipsizeMode="tail">
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
            <Text
              style={[styles.optionSub, compact && styles.optionSubCompact]}
              numberOfLines={compact ? 1 : 2}
              ellipsizeMode="tail">
              {option.subtitle}
            </Text>
          </View>

          <View
            style={[
              styles.radio,
              selected && { borderColor: tone.border, backgroundColor: tone.border },
            ]}>
            {selected ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
          </View>
        </View>

        {selected ? (
          <View style={styles.impacts}>
            {option.impacts.map((impact) => (
              <View
                key={`${option.id}-${impact.label}`}
                style={[
                  styles.impactChip,
                  impact.positive && styles.impactChipPositive,
                ]}>
                <Text style={styles.impactLabel}>{impact.label}</Text>
                <Text
                  style={[
                    styles.impactValue,
                    impact.positive && styles.impactValuePositive,
                  ]}>
                  {impact.value}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  options: {
    gap: 10,
  },
  optionsCompact: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: onboardingTokens.textMuted,
    letterSpacing: 0.2,
    marginBottom: 2,
  },
  sectionLabelCompact: {
    fontSize: 12,
    marginBottom: 0,
  },
  option: {
    borderRadius: onboardingRadii.lg,
    borderWidth: 2,
    padding: 12,
    gap: 10,
    shadowColor: onboardingTokens.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  optionCompact: {
    padding: 10,
    gap: 8,
    borderRadius: onboardingRadii.md,
  },
  optionSelected: {
    shadowColor: onboardingTokens.primary,
    shadowOpacity: 0.14,
    shadowRadius: 16,
    elevation: 4,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconWrapCompact: {
    width: 40,
    height: 40,
    borderRadius: 13,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  optionTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: 17,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  optionTitleCompact: {
    fontSize: 15,
  },
  badge: {
    maxWidth: 76,
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
    fontSize: 13,
    lineHeight: 18,
    color: onboardingTokens.textMuted,
    fontWeight: '600',
  },
  optionSubCompact: {
    fontSize: 12,
    lineHeight: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: onboardingTokens.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    backgroundColor: '#FFFFFF',
  },
  impacts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 2,
  },
  impactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderWidth: 1,
    borderColor: onboardingTokens.border,
  },
  impactChipPositive: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderColor: 'rgba(41,185,111,0.2)',
  },
  impactValue: {
    fontSize: 11,
    fontWeight: '900',
    color: onboardingTokens.textMain,
  },
  impactValuePositive: {
    color: onboardingTokens.green,
  },
  impactLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: onboardingTokens.textMuted,
  },
  pressed: {
    opacity: 0.86,
  },
});
