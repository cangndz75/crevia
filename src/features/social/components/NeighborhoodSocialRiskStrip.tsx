import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';

import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

import { resolveIoniconForRegistryKey } from '@/core/presentation/creviaIconPresentation';

import type { NeighborhoodSensitivityItem } from '../utils/socialPulsePresentation';
import { SOCIAL_CARD_BORDER } from '../utils/socialLayout';

type Props = {
  neighborhoods: NeighborhoodSensitivityItem[];
};

const CARD_WIDTH = 96;

function SensitivityCard({
  item,
  index,
}: {
  item: NeighborhoodSensitivityItem;
  index: number;
}) {
  const iconName = resolveIoniconForRegistryKey(item.iconKey);

  return (
    <Animated.View
      entering={FadeInRight.delay(index * 50).duration(320)}
      style={[styles.card, shadows.soft]}>
      <View style={[styles.accent, { backgroundColor: item.accentColor }]} />
      <View style={styles.iconRow}>
        <Ionicons name={iconName} size={14} color={item.accentColor} />
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {item.title}
      </Text>
      <Text style={[styles.status, { color: item.accentColor }]} numberOfLines={1}>
        {item.statusLabel}
      </Text>
    </Animated.View>
  );
}

export function NeighborhoodSocialRiskStrip({ neighborhoods }: Props) {
  const items = neighborhoods.slice(0, 5);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Mahalle Duyarlılığı
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={CARD_WIDTH + 8}
        contentContainerStyle={styles.scroll}>
        {items.map((item, index) => (
          <SensitivityCard key={String(item.districtId)} item={item} index={index} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
    paddingHorizontal: spacing.lg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    gap: 8,
    paddingRight: spacing.xl,
  },
  card: {
    width: CARD_WIDTH,
    minWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: SOCIAL_CARD_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    overflow: 'hidden',
  },
  accent: {
    width: 20,
    height: 3,
    borderRadius: 2,
  },
  iconRow: {
    marginTop: 2,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  status: {
    fontSize: 10,
    fontWeight: '700',
  },
});
