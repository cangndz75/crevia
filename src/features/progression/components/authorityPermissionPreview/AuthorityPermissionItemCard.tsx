import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { AuthorityPermissionPreviewItem } from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionDisplayPill } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionDisplayPill';
import type {
  AuthorityPermissionDisplayState,
  AuthorityPermissionGridItem,
} from '@/features/progression/utils/authorityPermissionsTabPresentation';
import {
  AUTHORITY_PERMISSION_PREVIEW_THEME,
  resolveAuthorityPermissionDisplayStyle,
} from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionItemCardProps = {
  item: AuthorityPermissionPreviewItem | AuthorityPermissionGridItem;
  compact?: boolean;
  grid?: boolean;
  onPress?: (item: AuthorityPermissionPreviewItem) => void;
};

function resolveDisplayState(
  item: AuthorityPermissionPreviewItem | AuthorityPermissionGridItem,
): AuthorityPermissionDisplayState {
  if ('displayState' in item) {
    return item.displayState;
  }
  if (item.state === 'active') return 'open';
  if (item.state === 'next') return 'next';
  return 'locked';
}

function resolveIconName(
  item: AuthorityPermissionPreviewItem | AuthorityPermissionGridItem,
  displayState: AuthorityPermissionDisplayState,
): keyof typeof Ionicons.glyphMap {
  if (displayState === 'locked') {
    return 'lock-closed-outline';
  }
  if (item.iconKey && item.iconKey in Ionicons.glyphMap) {
    return item.iconKey as keyof typeof Ionicons.glyphMap;
  }
  return 'people-outline';
}

export function AuthorityPermissionItemCard({
  item,
  compact = false,
  grid = false,
  onPress,
}: AuthorityPermissionItemCardProps) {
  const displayState = resolveDisplayState(item);
  const displayStyle = resolveAuthorityPermissionDisplayStyle(displayState);

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
          borderColor: displayStyle.border,
          backgroundColor: '#FFFFFF',
          opacity: displayStyle.cardOpacity,
        },
        pressed && onPress ? styles.pressed : null,
      ]}>
      <View style={styles.menuBtn} pointerEvents="none">
        <Ionicons name="ellipsis-horizontal" size={14} color="#B0B5B8" />
      </View>

      <View style={[styles.iconWrap, { backgroundColor: '#F3F5F4' }]}>
        <Ionicons
          name={resolveIconName(item, displayState)}
          size={compact ? 18 : 20}
          color={displayState === 'locked' ? '#B0B5B8' : '#5C6368'}
        />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>

      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>

      <AuthorityPermissionDisplayPill label={item.statePillLabel} displayState={displayState} />
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
  menuBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    padding: 2,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
    lineHeight: 18,
    flexShrink: 1,
    paddingRight: 16,
  },
  description: {
    fontSize: 11,
    fontWeight: '500',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    lineHeight: 15,
    flexShrink: 1,
  },
});
