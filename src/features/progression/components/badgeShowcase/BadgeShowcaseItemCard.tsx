import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';
import type { BadgeShowcaseItem } from '@/core/badges/badgeShowcaseTypes';
import { BadgeShowcaseStatePill } from '@/features/progression/components/badgeShowcase/BadgeShowcaseStatePill';
import {
  BADGE_SHOWCASE_THEME,
  resolveBadgeShowcaseRarityStyle,
} from '@/features/progression/utils/badgeShowcaseTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type BadgeShowcaseItemCardProps = {
  item: BadgeShowcaseItem;
  compact?: boolean;
  onPress?: (item: BadgeShowcaseItem) => void;
};

export function BadgeShowcaseItemCard({
  item,
  compact = false,
  onPress,
}: BadgeShowcaseItemCardProps) {
  const rarityStyle = resolveBadgeShowcaseRarityStyle(item.rarity, item.state);
  const iconName = resolveIoniconForRegistryKey(
    item.state === 'earned' ? item.iconKey : 'circle',
  );

  return (
    <Pressable
      onPress={() => onPress?.(item)}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.statePillLabel}`}
      style={({ pressed }) => [
        styles.card,
        shadows.soft,
        compact && styles.cardCompact,
        {
          backgroundColor: BADGE_SHOWCASE_THEME.cardBg,
          borderColor: rarityStyle.border,
          opacity: item.state === 'locked' ? 0.92 : 1,
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      <View style={[styles.glow, { backgroundColor: rarityStyle.glow }]} />
      <View style={[styles.iconWrap, { backgroundColor: rarityStyle.iconBg }]}>
        <Ionicons name={iconName} size={compact ? 14 : 16} color={rarityStyle.iconColor} />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {!compact ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <BadgeShowcaseStatePill label={item.statePillLabel} state={item.state} />
      {item.progressLabel ? (
        <Text
          style={styles.progress}
          accessibilityLabel={`İlerleme ${item.progressLabel}`}
          numberOfLines={1}>
          {item.progressLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 140,
    width: 156,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 6,
    overflow: 'hidden',
    flexShrink: 0,
  },
  cardCompact: {
    minWidth: 128,
    width: 140,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    lineHeight: 15,
    flexShrink: 1,
  },
  description: {
    fontSize: 10,
    fontWeight: '600',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 13,
    flexShrink: 1,
  },
  progress: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
});
