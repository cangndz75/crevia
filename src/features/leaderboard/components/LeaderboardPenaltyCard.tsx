import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardPenalty } from '@/core/leaderboard/leaderboardTypes';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardPenaltyCardProps = {
  penalties: LeaderboardPenalty[];
};

export function LeaderboardPenaltyCard({ penalties }: LeaderboardPenaltyCardProps) {
  const hasPenalties = penalties.length > 0;
  const visible = hasPenalties ? penalties.slice(0, 3) : [];

  return (
    <View style={[styles.card, shadows.soft]}>
      <Text style={styles.title}>
        {hasPenalties ? 'Skoru etkileyen konular' : 'Performans notu'}
      </Text>

      {hasPenalties ? (
        <View style={styles.list}>
          {visible.map((penalty) => (
            <View key={penalty.key} style={styles.item}>
              <View style={styles.itemHead}>
                <Text style={styles.itemLabel}>{penalty.label}</Text>
                <Text style={styles.itemAmount}>-{penalty.amount}</Text>
              </View>
              <Text style={styles.itemReason}>{penalty.reason}</Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.cleanBox}>
          <Text style={styles.cleanTitle}>Kritik ceza yok</Text>
          <Text style={styles.cleanBody}>Pilot süreç temiz tamamlandı.</Text>
        </View>
      )}
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
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  list: {
    gap: 8,
  },
  item: {
    backgroundColor: colors.warningMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(232,155,46,0.22)',
    padding: 10,
    gap: 4,
  },
  itemHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  itemLabel: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  itemAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.warning,
  },
  itemReason: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  cleanBox: {
    backgroundColor: colors.successMuted,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(59,175,122,0.2)',
    padding: 12,
    gap: 4,
  },
  cleanTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.success,
  },
  cleanBody: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
