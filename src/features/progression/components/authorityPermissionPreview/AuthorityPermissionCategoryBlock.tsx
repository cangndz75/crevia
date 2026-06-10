import { StyleSheet, Text, View } from 'react-native';

import type {
  AuthorityPermissionPreviewCategoryBlock as AuthorityPermissionPreviewCategoryBlockModel,
  AuthorityPermissionPreviewItem,
} from '@/core/authority/authorityPermissionPreviewTypes';
import { AuthorityPermissionItemCard } from '@/features/progression/components/authorityPermissionPreview/AuthorityPermissionItemCard';
import { AUTHORITY_PERMISSION_PREVIEW_THEME } from '@/features/progression/utils/authorityPermissionPreviewTheme';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { spacing } from '@/ui/theme/spacing';

type AuthorityPermissionCategoryBlockProps = {
  block: AuthorityPermissionPreviewCategoryBlockModel;
  onItemPress?: (item: AuthorityPermissionPreviewItem) => void;
};

export function AuthorityPermissionCategoryBlock({
  block,
  onItemPress,
}: AuthorityPermissionCategoryBlockProps) {
  return (
    <View style={styles.block}>
      <View style={styles.head}>
        <View style={styles.headText}>
          <Text style={styles.title}>{block.title}</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {block.subtitle}
          </Text>
        </View>
        <Text style={styles.count}>
          {block.activeCount}/{block.totalCount}
        </Text>
      </View>
      <View style={styles.grid}>
        {block.previewItems.map((item) => (
          <AuthorityPermissionItemCard
            key={item.id}
            item={item}
            compact
            onPress={onItemPress}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: AUTHORITY_PERMISSION_PREVIEW_THEME.cardBg,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: AUTHORITY_PERMISSION_PREVIEW_THEME.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  headText: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textPrimary,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: AUTHORITY_PERMISSION_PREVIEW_THEME.textSecondary,
    lineHeight: 15,
  },
  count: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
