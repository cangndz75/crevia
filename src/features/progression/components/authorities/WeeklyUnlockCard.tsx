import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { AUTHORITY_THEME } from '@/features/progression/components/authorities/theme';
import { AUTHORITY_COLLECTION_THEME } from '@/features/progression/utils/authorityCollectionPresentation';
import type { WeeklyUnlockItem } from '@/features/progression/utils/authoritiesScreenModel';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type WeeklyUnlockCardProps = {
  item: WeeklyUnlockItem;
  index: number;
};

export function WeeklyUnlockCard({ item, index }: WeeklyUnlockCardProps) {
  const palette = AUTHORITY_THEME[item.theme];

  return (
    <Animated.View
      entering={FadeInUp.delay(60 + index * 50).duration(320)}
      style={[styles.card, shadows.card]}>
      <View style={[styles.iconWrap, { backgroundColor: palette.muted }]}>
        <Ionicons name={item.icon} size={22} color={palette.main} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={styles.description} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={[styles.percentPill, { backgroundColor: palette.pillBg }]}>
        <Text style={[styles.percentText, { color: palette.pillText }]} numberOfLines={1}>
          {item.percentLabel}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    flexBasis: '48%',
    minWidth: 0,
    backgroundColor: AUTHORITY_COLLECTION_THEME.cardBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AUTHORITY_COLLECTION_THEME.border,
    padding: spacing.md,
    gap: 6,
    minHeight: 158,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: AUTHORITY_COLLECTION_THEME.textPrimary,
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  description: {
    fontSize: 13,
    fontWeight: '500',
    color: AUTHORITY_COLLECTION_THEME.textSecondary,
    lineHeight: 18,
    flexShrink: 1,
  },
  percentPill: {
    alignSelf: 'flex-start',
    marginTop: 'auto',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  percentText: {
    fontSize: 11,
    fontWeight: '800',
  },
});
