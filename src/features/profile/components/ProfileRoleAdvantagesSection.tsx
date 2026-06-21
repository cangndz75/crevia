import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ProfileRoleAdvantageItem } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const advantageImages = {
  clipboard: creviaAssets.reports.icons.dailyTaskCoin,
  map: creviaAssets.map.icons.cityRoutePin,
  crate: creviaAssets.containers.serviceBins,
} as const;

type ProfileRoleAdvantagesSectionProps = {
  items: ProfileRoleAdvantageItem[];
};

export function ProfileRoleAdvantagesSection({ items }: ProfileRoleAdvantagesSectionProps) {
  return (
    <View style={[styles.card, shadows.soft]}>
      <View style={styles.head}>
        <Ionicons name="trophy" size={15} color={PROFILE_REFERENCE_THEME.goldDark} />
        <Text style={styles.title}>{PROFILE_UI_COPY.roleAdvantagesTitle}</Text>
      </View>

      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.id} style={styles.item}>
            <Image
              source={advantageImages[item.imageKey]}
              style={styles.itemArt}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PROFILE_REFERENCE_THEME.cardBg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PROFILE_REFERENCE_THEME.cardBorder,
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  list: {
    gap: 10,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#F8FCFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(26, 143, 138, 0.08)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    minWidth: 0,
  },
  itemArt: {
    width: 40,
    height: 40,
    flexShrink: 0,
  },
  itemTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: PROFILE_REFERENCE_THEME.textPrimary,
    lineHeight: 18,
    minWidth: 0,
  },
});
