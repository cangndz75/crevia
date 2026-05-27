import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { LeaderboardPrestigeSummary } from '@/features/leaderboard/utils/leaderboardProfileModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfilePrestigeCardProps = {
  summary: LeaderboardPrestigeSummary;
  onOpenLeaderboard: () => void;
};

type MiniStatProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
};

function MiniStat({ label, value, hint, accent = false }: MiniStatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text
        style={[styles.statValue, accent && styles.statValueAccent]}
        numberOfLines={2}>
        {value}
      </Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </View>
  );
}

export function ProfilePrestigeCard({
  summary,
  onOpenLeaderboard,
}: ProfilePrestigeCardProps) {
  const lastLine =
    summary.lastScoreText && summary.lastTitle
      ? `${summary.lastScoreText} · ${summary.lastTitle}`
      : 'Pilot tamamlandığında burada görünecek.';

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="ribbon-outline" size={16} color={colors.hubGoldDark} />
        </View>
        <Text style={styles.title}>Yönetici Prestiji</Text>
      </View>

      <View style={styles.grid}>
        <MiniStat
          label="En İyi Pilot Skoru"
          value={summary.bestScoreText}
          hint="En iyi Belediye Performans Puanı"
          accent={summary.hasAnyScore}
        />
        <MiniStat label="En Yüksek Unvan" value={summary.highestTitle} />
        <MiniStat label="En Başarılı Mahalle" value={summary.bestNeighborhoodName} />
        <MiniStat
          label="Tamamlanan Pilot"
          value={String(summary.completedPilotCount)}
          hint="kayıtlı koşu"
        />
      </View>

      <View style={styles.lastRow}>
        <Text style={styles.lastLabel}>Son Pilot Sonucu</Text>
        <Text style={styles.lastValue} numberOfLines={2}>
          {lastLine}
        </Text>
      </View>

      <Pressable
        onPress={onOpenLeaderboard}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
        accessibilityLabel="Liderliği aç">
        <Text style={styles.ctaText}>Liderliği Aç</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.hubGoldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  stat: {
    width: '48%',
    flexGrow: 1,
    minWidth: '46%',
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 10,
    gap: 3,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.15,
    lineHeight: 18,
  },
  statValueAccent: {
    fontSize: 20,
    letterSpacing: -0.4,
    color: colors.primary,
  },
  statHint: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 12,
  },
  lastRow: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4,
  },
  lastLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  lastValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    lineHeight: 17,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.25)',
  },
  ctaPressed: {
    opacity: 0.9,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
});
