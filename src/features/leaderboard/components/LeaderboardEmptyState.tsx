import { StyleSheet, Text, View } from 'react-native';

import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardEmptyStateProps = {
  message: string;
  ctaLabel: string;
  onGoHub: () => void;
};

export function LeaderboardEmptyState({
  message,
  ctaLabel,
  onGoHub,
}: LeaderboardEmptyStateProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <Text style={styles.eyebrow} numberOfLines={1}>
        Pilot Prestiji
      </Text>
      <Text style={styles.title} numberOfLines={2}>
        {message}
      </Text>
      <GameButton title={ctaLabel} onPress={onGoHub} style={styles.button} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 10,
    minWidth: 0,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.35,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    lineHeight: 20,
  },
  button: {
    marginTop: 2,
  },
});
