import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionStatePill } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionStatePill';
import {
  AUTHORITY_PERMISSION_PREVIEW_THEME,
  resolveAuthorityPermissionStateStyle,
} from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionItemCardProps = {
  item: AuthorityPermissionPreviewItem;
  compact?: boolean;
  onPress?: (item: AuthorityPermissionPreviewItem) => void;
};

function resolveIconName(iconKey?: string): keyof typeof Ionicons.glyphMap {
  if (iconKey && iconKey in Ionicons.glyphMap) {
    return iconKey as keyof typeof Ionicons.glyphMap;
  }
  return 'shield-outline';
}

export function AuthorityPermissionItemCard({
  item,
  compact = false,
  onPress,
}: AuthorityPermissionItemCardProps) {
  const stateStyle = resolveAuthorityPermissionStateStyle(item.state);

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
          borderColor: stateStyle.border,
          backgroundColor: AUTHORITY_PERMISSION_PREVIEW_THEME.cardBg,
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      <View style={[styles.iconWrap, { backgroundColor: stateStyle.pillBg }]}>
        <Ionicons
          name={resolveIconName(item.iconKey)}
          size={compact ? 14 : 16}
          color={stateStyle.pillText}
        />
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {!compact ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
      <AuthorityPermissionStatePill label={item.statePillLabel} state={item.state} />
      {item.unlockRankTitle && item.state !== 'active' ? (
        <Text style={styles.unlockRank} numberOfLines={1}>
          {item.unlockRankTitle}
        </Text>
      ) : null}
      {!compact && item.playerBenefit ? (
        <Text style={styles.benefit} numberOfLines={2}>
          {item.playerBenefit}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    width: 164,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.sm,
    gap: 6,
    flexShrink: 0,
  },
  cardCompact: {
    minWidth: 136,
    width: 148,
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
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
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    lineHeight: 15,
    flexShrink: 1,
  },
  description: {
    fontSize: 10,
    fontWeight: '600',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    lineHeight: 13,
    flexShrink: 1,
  },
  unlockRank: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  benefit: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.primary,
    lineHeight: 13,
  },
});
