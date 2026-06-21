import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionStatePill } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionStatePill';
import {
  AUTHORITY_PERMISSION_PREVIEW_THEME,
  resolveAuthorityPermissionStateStyle,
} from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionItemCardProps = {
  item: AuthorityPermissionPreviewItem;
  compact?: boolean;
  grid?: boolean;
  onPress?: (item: AuthorityPermissionPreviewItem) => void;
};

function resolveIconName(
  item: AuthorityPermissionPreviewItem,
): keyof typeof Ionicons.glyphMap {
  if (item.state === 'locked') {
    return 'lock-closed-outline';
  }
  if (item.iconKey && item.iconKey in Ionicons.glyphMap) {
    return item.iconKey as keyof typeof Ionicons.glyphMap;
  }
  return 'people-outline';
}

function resolveSubtitle(item: AuthorityPermissionPreviewItem): string {
  if (item.state === 'active') {
    return item.playerBenefit || item.reasonLabel;
  }
  if (item.state === 'next') {
    return item.reasonLabel || 'Sonraki seviye ile açılır';
  }
  return item.unlockRankTitle
    ? `Sonraki seviye ile açılır`
    : item.reasonLabel || 'Sonraki seviye ile açılır';
}

export function AuthorityPermissionItemCard({
  item,
  compact = false,
  grid = false,
  onPress,
}: AuthorityPermissionItemCardProps) {
  const stateStyle = resolveAuthorityPermissionStateStyle(item.state);
  const subtitle = resolveSubtitle(item);

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
          borderColor: stateStyle.border,
          backgroundColor: '#FFFEFA',
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      {item.state === 'active' ? (
        <View style={styles.statusCorner}>
          <Ionicons name="checkmark" size={12} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={[styles.iconWrap, { backgroundColor: '#F0F2F0' }]}>
        <Ionicons
          name={resolveIconName(item)}
          size={compact ? 16 : 18}
          color="#8A9094"
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <Text
        style={[
          styles.subtitle,
          item.state === 'active' ? styles.subtitleActive : styles.subtitleMuted,
        ]}
        numberOfLines={2}>
        {subtitle}
      </Text>

      <AuthorityPermissionStatePill label={item.statePillLabel} state={item.state} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minWidth: 148,
    width: 164,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: 8,
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
    minWidth: 136,
    width: 148,
  },
  pressed: {
    opacity: 0.92,
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
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    lineHeight: 18,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    flexShrink: 1,
  },
  subtitleActive: {
    color: '#2D6A6A',
  },
  subtitleMuted: {
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
  },
});
