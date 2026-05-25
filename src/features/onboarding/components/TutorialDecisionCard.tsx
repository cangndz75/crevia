import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TutorialDecision } from '@/features/onboarding/content/onboardingContent';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type TutorialDecisionCardProps = {
  decision: TutorialDecision;
  selected: boolean;
  onPress: () => void;
};

const DECISION_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'extra-crew': 'rocket-outline',
  'normal-route': 'swap-horizontal-outline',
  'container-plan': 'shield-outline',
};

export function TutorialDecisionCard({
  decision,
  selected,
  onPress,
}: TutorialDecisionCardProps) {
  const icon = DECISION_ICONS[decision.id] ?? 'ellipse-outline';

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.iconWrap, selected && styles.iconWrapSelected]}>
        <Ionicons
          name={icon}
          size={20}
          color={selected ? colors.primary : colors.textSecondary}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.header}>
          <Text style={[styles.title, selected && styles.titleSelected]}>
            {decision.title}
          </Text>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={22}
            color={selected ? colors.primary : colors.border}
          />
        </View>
        <Text style={styles.description}>{decision.description}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.985 }],
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrapSelected: {
    backgroundColor: `${colors.primary}18`,
    borderColor: colors.primary,
  },
  body: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  titleSelected: {
    color: colors.primary,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
