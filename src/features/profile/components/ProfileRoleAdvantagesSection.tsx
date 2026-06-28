import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { creviaAssets } from '@/core/assets/creviaAssets';
import type { ProfileRoleAdvantageItem } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { PROFILE_UI_COPY } from '@/features/profile/utils/profileScreenPresentation';
import { radius } from '@/ui/theme/radius';
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
    <View style={[styles.card, shadows.card]}>
      <View style={styles.head}>
        <Ionicons name="shield" size={16} color="#F7D77B" />
        <Text style={styles.title} numberOfLines={1}>
          {PROFILE_UI_COPY.roleAdvantagesTitle}
        </Text>
      </View>

      <View style={styles.list}>
        {items.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.item}>
            <Image
              source={advantageImages[item.imageKey]}
              style={styles.itemArt}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.itemCopy}>
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.itemDescription} numberOfLines={2}>
                {item.description}
              </Text>
            </View>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: PROFILE_REFERENCE_THEME.tealDark,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: spacing.md,
    gap: spacing.sm,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0,
  },
  list: {
    gap: 9,
  },
  item: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FBF9F2',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.46)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    minWidth: 0,
  },
  itemArt: {
    width: 54,
    height: 54,
    flexShrink: 0,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  itemTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: PROFILE_REFERENCE_THEME.textPrimary,
  },
  itemDescription: {
    fontSize: 10,
    fontWeight: '600',
    color: PROFILE_REFERENCE_THEME.textSecondary,
    lineHeight: 13,
  },
  chevron: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: '#B8A04C',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
