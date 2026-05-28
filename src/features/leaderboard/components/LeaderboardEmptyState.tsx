import { StyleSheet, Text, View } from 'react-native';

import { GameButton } from '@/ui/components/GameButton';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardEmptyStateProps = {
  onGoHub: () => void;
};

export function LeaderboardEmptyState({ onGoHub }: LeaderboardEmptyStateProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <Text style={styles.eyebrow}>Kişisel sıralama</Text>
      <Text style={styles.title}>Pilot bölgeyi tamamla, unvanını ve BPP skorunu gör</Text>
      <Text style={styles.body}>
        Yukarıdaki sıralama bölgesel mock veridir. Pilot tamamlandığında kendi
        satırın listede vurgulanır.
      </Text>
      <GameButton title="Merkeze Dön" onPress={onGoHub} style={styles.button} />
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
    gap: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    lineHeight: 20,
  },
  body: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  button: {
    marginTop: 4,
  },
});
