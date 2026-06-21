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
  grid?: boolean;
  onPress?: (item: BadgeShowcaseItem) => void;
};

export function BadgeShowcaseItemCard({
  item,
  compact = false,
  grid = false,
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
        grid && styles.cardGrid,
        compact && !grid && styles.cardCompact,
        shadows.soft,
        {
          backgroundColor: '#FFFEFA',
          borderColor: item.state === 'earned' ? rarityStyle.border : BADGE_SHOWCASE_THEME.border,
          opacity: item.state === 'locked' ? 0.92 : 1,
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      {item.state === 'earned' ? (
        <View style={styles.statusCorner}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={[styles.iconWrap, { backgroundColor: '#F0F2F0' }]}>
        <Ionicons
          name={item.state === 'locked' ? 'lock-closed-outline' : iconName}
          size={compact ? 16 : 18}
          color="#8A9094"
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

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
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
    overflow: 'hidden',
    flexShrink: 0,
    position: 'relative',
  },
  cardGrid: {
    width: '48%',
    minWidth: 0,
    flexGrow: 1,
    flexBasis: '47%',
  },
  cardCompact: {
    minWidth: 128,
    width: 140,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  statusCorner: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2D6A6A',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: BADGE_SHOWCASE_THEME.textPrimary,
    lineHeight: 18,
    flexShrink: 1,
  },
  description: {
    fontSize: 11,
    fontWeight: '600',
    color: BADGE_SHOWCASE_THEME.textSecondary,
    lineHeight: 15,
    flexShrink: 1,
  },
  progress: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
  },
});
