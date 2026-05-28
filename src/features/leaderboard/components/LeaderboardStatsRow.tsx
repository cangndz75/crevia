import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { LeaderboardScreenStats } from '@/features/leaderboard/hooks/useLeaderboardScreenData';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type LeaderboardStatsRowProps = {
  stats: LeaderboardScreenStats;
};

function StatCard({
  icon,
  iconColor,
  iconBg,
  value,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  value: string;
  label: string;
}) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={18} color={iconColor} />
      </View>
      <Text style={styles.value} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label} numberOfLines={2}>
        {label}
      </Text>
    </View>
  );
}

export function LeaderboardStatsRow({ stats }: LeaderboardStatsRowProps) {
  return (
    <View style={styles.row}>
      <StatCard
        icon="people"
        iconColor={colors.primary}
        iconBg={colors.primaryMuted}
        value={stats.totalParticipants.toLocaleString('tr-TR')}
        label="Toplam Katılımcı"
      />
      <StatCard
        icon="bar-chart"
        iconColor={colors.success}
        iconBg={colors.successMuted}
        value={`+${stats.weeklyRise.toLocaleString('tr-TR')}`}
        label="Bu Hafta Yükseliş"
      />
      <StatCard
        icon="shield"
        iconColor={colors.purple}
        iconBg={colors.purpleMuted}
        value={stats.playerTitle}
        label="Unvan"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
    minHeight: 88,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  label: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 12,
  },
});
