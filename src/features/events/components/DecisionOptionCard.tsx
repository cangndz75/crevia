import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ImpactStatGrid } from '@/features/events/components/ImpactStatGrid';
import { EventDecision } from '@/core/models/EventCard';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';
import { typography } from '@/ui/theme/typography';

type DecisionOptionCardProps = {
  decision: EventDecision;
  selected: boolean;
  onSelect: () => void;
};

export function DecisionOptionCard({
  decision,
  selected,
  onSelect,
}: DecisionOptionCardProps) {
  return (
    <Pressable
      onPress={onSelect}
      style={({ pressed }) => [
        styles.card,
        shadows.card,
        selected && styles.cardSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.header}>
        <Text style={styles.title}>{decision.title}</Text>
        {decision.recommended ? (
          <View style={styles.recommended}>
            <Ionicons name="star" size={10} color={colors.primary} />
            <Text style={styles.recommendedText}>ÖNERİLEN</Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.description}>{decision.description}</Text>

      <ImpactStatGrid
        effects={decision.effects}
        costs={decision.costs}
        qualitative
      />

      {decision.delayHint ? (
        <View style={styles.hint}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.warning}
          />
          <Text style={styles.hintText}>Yarın etkisi olabilir</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FAFFFE',
  },
  pressed: {
    opacity: 0.96,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: {
    ...typography.subtitle,
    flex: 1,
    fontSize: 17,
  },
  recommended: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
    color: colors.primary,
  },
  description: {
    ...typography.caption,
    lineHeight: 20,
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -spacing.xs,
  },
  hintText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.warning,
  },
});
