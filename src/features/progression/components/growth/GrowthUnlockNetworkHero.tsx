import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { GrowthUnlockHeroModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';

type GrowthUnlockNetworkHeroProps = GrowthUnlockHeroModel & {
  onCtaPress?: () => void;
};

export function GrowthUnlockNetworkHero({
  title,
  subtitle,
  ctaLabel,
  onCtaPress,
}: GrowthUnlockNetworkHeroProps) {
  return (
    <LinearGradient
      colors={[growth.canvasDeep, growth.cardSolid]}
      style={[styles.card, growth.shadow]}>
      <Image
        source={getPilotDistrictHeroImage('central')}
        style={styles.mapBg}
        contentFit="cover"
      />
      <LinearGradient
        colors={['rgba(4,25,24,0.92)', 'rgba(4,25,24,0.72)', 'rgba(4,25,24,0.95)']}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.copy}>
        <View style={styles.iconBadge}>
          <Ionicons name="git-network-outline" size={20} color={growth.gold} />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Pressable
        onPress={onCtaPress}
        style={styles.cta}
        accessibilityRole="button"
        accessibilityLabel={ctaLabel}>
        <Text style={styles.ctaText}>{ctaLabel}</Text>
        <Ionicons name="chevron-forward" size={16} color={growth.canvas} />
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: growth.radiusCard,
    borderWidth: 1,
    borderColor: growth.borderGold,
    minHeight: 168,
    overflow: 'hidden',
    padding: 16,
    justifyContent: 'space-between',
    gap: 14,
  },
  mapBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  copy: {
    gap: 8,
    zIndex: 1,
    maxWidth: '88%',
  },
  iconBadge: {
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
    fontSize: 20,
    fontWeight: '900',
    color: growth.text,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    lineHeight: 18,
  },
  cta: {
    zIndex: 1,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: growth.minTouch,
    borderRadius: growth.radiusChip,
    backgroundColor: growth.gold,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '800',
    color: growth.canvas,
  },
});
