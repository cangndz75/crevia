import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { ProfileAuthoritySummary } from '@/features/profile/utils/profileAuthorityModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileAuthorityCardProps = {
  summary: ProfileAuthoritySummary;
};

type MiniStatProps = {
  label: string;
  value: string;
};

function MiniStat({ label, value }: MiniStatProps) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={2} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

function evaluationToneColor(tone: ProfileAuthoritySummary['evaluationTone']): string {
  switch (tone) {
    case 'positive':
      return colors.success;
    case 'warning':
      return colors.warning;
    default:
      return colors.textSecondary;
  }
}

export function ProfileAuthorityCard({ summary }: ProfileAuthorityCardProps) {
  const evaluationColor = evaluationToneColor(summary.evaluationTone);

  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={16} color={colors.secondary} />
        </View>
        <Text style={styles.cardTitle}>Yetki Durumu</Text>
      </View>

      <View style={styles.mainBlock}>
        <Text style={styles.sectionLabel}>Resmi Görev</Text>
        <Text style={styles.rankLabel} numberOfLines={2} adjustsFontSizeToFit>
          {summary.rankLabel}
        </Text>
        <Text style={styles.progressSubtitle} numberOfLines={2}>
          {summary.progressSubtitle}
        </Text>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressMetaLabel}>Sonraki Görev</Text>
          <Text style={styles.progressMetaValue} numberOfLines={1}>
            {summary.nextRankLabel}
          </Text>
        </View>
        <Text style={styles.progressPercent}>%{summary.progressPercent}</Text>
      </View>

      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: `${Math.min(100, Math.max(0, summary.progressPercent))}%` },
          ]}
        />
      </View>

      <View style={styles.grid}>
        <MiniStat
          label="Yetki Güveni"
          value={summary.authorityTrustLabel.replace('Yetki Güveni ', '')}
        />
        <MiniStat label="Güçlü Alan" value={summary.strongestDomainLabel} />
        <MiniStat label="Açılan İzin" value={summary.unlockedPermissionCountLabel} />
        <MiniStat label="Kalan Güven" value={summary.remainingTrustLabel} />
      </View>

      <View style={styles.evaluationRow}>
        <Text style={styles.evaluationLabel}>Üst Yönetim Değerlendirmesi</Text>
        <View style={styles.evaluationBadge}>
          <Ionicons
            name="document-text-outline"
            size={13}
            color={evaluationColor}
          />
          <Text
            style={[styles.evaluationText, { color: evaluationColor }]}
            numberOfLines={2}>
            {summary.evaluationLabel}
          </Text>
        </View>
      </View>
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
    backgroundColor: colors.secondaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  mainBlock: {
    gap: 4,
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  rankLabel: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  progressSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  progressMeta: {
    flex: 1,
    gap: 2,
  },
  progressMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  progressMetaValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.secondary,
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
  evaluationRow: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 6,
  },
  evaluationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  evaluationBadge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  evaluationText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
});
