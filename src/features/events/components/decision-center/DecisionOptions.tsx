import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import type { DecisionAffordabilityCheck } from '@/core/economy/economyAffordability';
import { getDecisionStyleConfig } from '@/features/events/utils/eventPresentation';
import type { EventDecision } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function HorizontalDecisionButton({
  decision,
  selected,
  onSelect,
  affordability,
}: {
  decision: EventDecision;
  selected: boolean;
  onSelect: () => void;
  affordability?: DecisionAffordabilityCheck;
}) {
  const scale = useSharedValue(1);
  const styleConfig = getDecisionStyleConfig(decision.style);
  const insufficient =
    affordability != null && affordability.cost > 0 && !affordability.canAfford;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={insufficient ? undefined : onSelect}
      disabled={insufficient}
      onPressIn={() => {
        if (!insufficient) {
          scale.value = withSpring(0.96, { damping: 18, stiffness: 320 });
        }
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 18, stiffness: 320 });
      }}
      style={[
        animStyle,
        styles.option,
        selected && !insufficient && styles.optionSelected,
        insufficient && styles.optionInsufficient,
        {
          borderColor: selected && !insufficient ? styleConfig.accent : colors.border,
          backgroundColor: selected && !insufficient ? '#FAFFFE' : colors.surface,
        },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: insufficient }}>
      <View style={[styles.iconWrap, { backgroundColor: styleConfig.muted }]}>
        <Ionicons
          name={styleConfig.icon}
          size={22}
          color={styleConfig.accent}
        />
      </View>
      <Text style={styles.optionTitle} numberOfLines={2}>
        {decision.title}
      </Text>
      {decision.recommended && !insufficient ? (
        <View style={styles.recommendedDot} />
      ) : null}
      {insufficient && affordability ? (
        <Text style={styles.insufficientHint} numberOfLines={2}>
          Kaynak yetersiz{'\n'}Eksik: {affordability.formattedMissingSource} Kaynak
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

type DecisionOptionsProps = {
  decisions: EventDecision[];
  selectedId: string | null;
  onSelect: (decisionId: string) => void;
  affordabilityByDecisionId?: Record<string, DecisionAffordabilityCheck>;
};

export function DecisionOptions({
  decisions,
  selectedId,
  onSelect,
  affordabilityByDecisionId,
}: DecisionOptionsProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>KARAR SEÇENEKLERİ</Text>
      <View style={styles.row}>
        {decisions.map((decision) => (
          <HorizontalDecisionButton
            key={decision.id}
            decision={decision}
            selected={selectedId === decision.id}
            onSelect={() => onSelect(decision.id)}
            affordability={affordabilityByDecisionId?.[decision.id]}
          />
        ))}
      </View>
      <View style={styles.dots}>
        {decisions.map((d) => (
          <View
            key={d.id}
            style={[
              styles.dot,
              selectedId === d.id && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    color: colors.hubGoldDark,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  option: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.sm,
    minHeight: 96,
  },
  optionSelected: {
    borderWidth: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  optionInsufficient: {
    opacity: 0.65,
    backgroundColor: colors.backgroundAlt,
  },
  insufficientHint: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.warning,
    textAlign: 'center',
    lineHeight: 12,
    paddingHorizontal: 2,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    lineHeight: 15,
    paddingHorizontal: 2,
  },
  recommendedDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: colors.surface,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 14,
  },
});
