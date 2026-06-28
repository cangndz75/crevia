import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { GrowthRecentAuthorityCard } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { GrowthSectionHeader } from '@/features/progression/components/growth/GrowthSectionHeader';
import type { ProgressionIconName } from '@/core/content/progressionRoadmap';

type GrowthRecentAuthoritiesStripProps = {
  items: GrowthRecentAuthorityCard[];
};

function resolveIcon(icon: ProgressionIconName): keyof typeof Ionicons.glyphMap {
  if (icon in Ionicons.glyphMap) return icon as keyof typeof Ionicons.glyphMap;
  return 'shield-checkmark-outline';
}

export function GrowthRecentAuthoritiesStrip({ items }: GrowthRecentAuthoritiesStripProps) {
  return (
    <View style={styles.wrap}>
      <GrowthSectionHeader title="Son Açılan Yetkiler" actionLabel="Tümünü Gör" />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.strip}
        decelerationRate="fast"
        snapToInterval={168}>
        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <View style={styles.checkBadge}>
              <Ionicons name="checkmark" size={12} color={growth.canvas} />
            </View>
            <View style={styles.iconWrap}>
              <Ionicons name={resolveIcon(item.icon)} size={20} color={growth.gold} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.unlocked}>{item.unlockedLabel}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const CARD_WIDTH = 156;

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  strip: {
    gap: 10,
    paddingRight: 4,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: growth.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: growth.border,
    padding: 14,
    gap: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  checkBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: growth.mint,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: growth.mintMuted,
    borderWidth: 1,
    borderColor: growth.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: growth.text,
    lineHeight: 19,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    lineHeight: 17,
  },
  unlocked: {
    fontSize: 12,
    fontWeight: '700',
    color: growth.mint,
    marginTop: 2,
  },
});
