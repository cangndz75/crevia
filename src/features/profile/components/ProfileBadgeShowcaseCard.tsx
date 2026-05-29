import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import type { BadgeRarity } from '@/core/badges/badgeTypes';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import type {
  ProfileBadgeIconKey,
  ProfileBadgeShowcaseItem,
  ProfileBadgeShowcaseSummary,
} from '@/features/profile/utils/profileBadgeModel';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type ProfileBadgeShowcaseCardProps = {
  summary: ProfileBadgeShowcaseSummary;
};

type RarityStyle = {
  tileBg: string;
  tileBorder: string;
  iconBg: string;
  iconColor: string;
};

function resolveRarityStyle(rarity: BadgeRarity, earned: boolean): RarityStyle {
  if (!earned) {
    return {
      tileBg: colors.backgroundAlt,
      tileBorder: colors.border,
      iconBg: colors.surface,
      iconColor: colors.textSecondary,
    };
  }

  switch (rarity) {
    case 'uncommon':
      return {
        tileBg: colors.primaryMuted,
        tileBorder: 'rgba(26,143,138,0.22)',
        iconBg: 'rgba(26,143,138,0.14)',
        iconColor: colors.primary,
      };
    case 'rare':
      return {
        tileBg: colors.hubGoldMuted,
        tileBorder: 'rgba(212,160,23,0.28)',
        iconBg: 'rgba(245,183,49,0.22)',
        iconColor: colors.hubGoldDark,
      };
    case 'epic':
      return {
        tileBg: colors.purpleMuted,
        tileBorder: 'rgba(123,91,184,0.24)',
        iconBg: 'rgba(123,91,184,0.12)',
        iconColor: colors.purple,
      };
    default:
      return {
        tileBg: colors.surface,
        tileBorder: colors.border,
        iconBg: colors.backgroundAlt,
        iconColor: colors.textPrimary,
      };
  }
}

function BadgeTile({ item }: { item: ProfileBadgeShowcaseItem }) {
  const style = resolveRarityStyle(item.rarity, item.earned);

  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: style.tileBg,
          borderColor: style.tileBorder,
          opacity: item.earned ? 1 : 0.82,
        },
      ]}>
      <View style={[styles.tileIcon, { backgroundColor: style.iconBg }]}>
        <Ionicons
          name={item.earned ? item.iconKey : 'ellipse-outline'}
          size={14}
          color={style.iconColor}
        />
      </View>
      <Text style={styles.tileTitle} numberOfLines={2}>
        {item.title}
      </Text>
      {item.progressLabel ? (
        <Text style={styles.tileProgress} numberOfLines={1}>
          {item.progressLabel}
        </Text>
      ) : !item.earned ? (
        <Text style={styles.tileLocked} numberOfLines={1}>
          {PROFILE_UI_COPY.queued}
        </Text>
      ) : null}
    </View>
  );
}

export function ProfileBadgeShowcaseCard({ summary }: ProfileBadgeShowcaseCardProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <View style={styles.iconWrap}>
          <Ionicons name="medal-outline" size={16} color={colors.hubGoldDark} />
        </View>
        <View style={styles.headText}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {PROFILE_UI_COPY.badgesTitle}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            Operasyon kariyerinde kazandığın başarılar
          </Text>
        </View>
      </View>

      <View style={styles.countRow}>
        <Text style={styles.countValue} numberOfLines={1}>
          {summary.earnedCount} / {summary.totalCount} kazanıldı
        </Text>
        <Text style={styles.countPercent}>%{summary.completionPercent}</Text>
      </View>

      {summary.latestBadge ? (
        <View style={styles.latestBlock}>
          <Text style={styles.latestLabel} numberOfLines={1}>
            {PROFILE_UI_COPY.latestEarned}
          </Text>
          <Text style={styles.latestTitle} numberOfLines={1}>
            {summary.latestBadge.title}
          </Text>
          <Text style={styles.latestMeta} numberOfLines={1}>
            {summary.latestBadge.rarityLabel} · {summary.latestBadge.categoryLabel}
          </Text>
        </View>
      ) : null}

      {summary.showcaseItems.length > 0 ? (
        <View style={styles.grid}>
          {summary.showcaseItems.map((item) => (
            <View key={item.id} style={styles.gridCell}>
              <BadgeTile item={item} />
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const TILE_GAP = 8;

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
    alignItems: 'flex-start',
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
  headText: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    lineHeight: 15,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  countValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  countPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  latestBlock: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 2,
  },
  latestLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.25,
    textTransform: 'uppercase',
  },
  latestTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.hubGoldDark,
  },
  latestMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -TILE_GAP / 2,
  },
  gridCell: {
    width: '50%',
    paddingHorizontal: TILE_GAP / 2,
    paddingBottom: TILE_GAP,
    minWidth: 0,
  },
  tile: {
    minHeight: 72,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 8,
    gap: 4,
  },
  tileIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    lineHeight: 14,
  },
  tileProgress: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
  tileLocked: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
