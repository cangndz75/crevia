import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import type { LeaderboardPrestigeSummary } from '@/features/leaderboard/utils/leaderboardProfileModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfilePrestigeCardProps = {
  summary: LeaderboardPrestigeSummary;
  onOpenLeaderboard: () => void;
  compact?: boolean;
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
  compact = false,
}: ProfilePrestigeCardProps) {
  const lastLine =
    summary.lastScoreText && summary.lastTitle
      ? `${summary.lastScoreText} · ${summary.lastTitle}`
      : 'İlk pilot sonucun burada görünecek.';

  if (compact) {
    return (
      <View style={[styles.card, styles.cardCompact, shadows.soft]}>
        <View style={styles.compactTop}>
          <View style={styles.head}>
            <View style={styles.iconWrap}>
              <Ionicons name="stats-chart-outline" size={15} color={colors.hubGoldDark} />
            </View>
            <View style={styles.compactHeadCopy}>
              <Text style={styles.title} numberOfLines={1}>
                {PROFILE_UI_COPY.prestigeTitle}
              </Text>
              <Text style={styles.compactScore} numberOfLines={1}>
                {summary.hasAnyScore
                  ? `En iyi skor ${summary.bestScoreText}`
                  : 'Henüz pilot skoru yok'}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onOpenLeaderboard}
            style={({ pressed }) => [styles.ctaCompact, pressed && styles.ctaPressed]}
            accessibilityRole="button"
            accessibilityLabel="Liderliği aç">
            <Text style={styles.ctaText} numberOfLines={1}>
              Liderlik
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </Pressable>
        </View>
        <Text style={styles.compactMeta} numberOfLines={2}>
          {summary.highestTitle} · {summary.bestNeighborhoodName}
        </Text>
        <Text style={styles.lastValue} numberOfLines={1}>
          {lastLine}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="ribbon-outline" size={16} color={colors.hubGoldDark} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          {PROFILE_UI_COPY.prestigeTitle}
        </Text>
      </View>

      <View style={styles.grid}>
        <MiniStat
          label="En İyi Pilot Skoru"
          value={summary.bestScoreText}
          hint="Belediye performans puanı"
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
        <Text style={styles.lastLabel} numberOfLines={1}>
          Son Pilot Sonucu
        </Text>
        <Text style={styles.lastValue} numberOfLines={2}>
          {lastLine}
        </Text>
      </View>

      <Pressable
        onPress={onOpenLeaderboard}
        style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}
        accessibilityRole="button"
        accessibilityLabel="Liderliği aç">
        <Text style={styles.ctaText} numberOfLines={1}>
          Liderliği Aç
        </Text>
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
  cardCompact: {
    padding: spacing.sm,
    gap: 8,
  },
  compactTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    minWidth: 0,
  },
  compactHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  compactScore: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  compactMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  ctaCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.full,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.2)',
    flexShrink: 0,
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
