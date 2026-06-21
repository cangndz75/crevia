import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { hubAssets } from '@/features/hub/utils/hubAssets';
import { centerSummaryTokens as tokens } from '@/features/hub/theme/centerCitySummaryTokens';
import type { CenterCitySummaryIllustrationKey } from '@/features/hub/utils/centerCitySummaryPresentation';

type CenterSummaryHeroIllustrationProps = {
  illustrationKey: CenterCitySummaryIllustrationKey;
  title: string;
  subtitle?: string;
  compact?: boolean;
};

export function CenterSummaryHeroIllustration({
  illustrationKey,
  title,
  subtitle,
  compact = false,
}: CenterSummaryHeroIllustrationProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = illustrationKey !== 'none' && !imageFailed;

  return (
    <View style={styles.wrap} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {showImage ? (
        <Image
          source={hubAssets.centerSummaryHero}
          style={styles.image}
          contentFit="cover"
          transition={180}
          onError={() => setImageFailed(true)}
        />
      ) : (
        <LinearGradient
          colors={[tokens.colors.heroFallbackStart, tokens.colors.heroFallbackEnd]}
          style={StyleSheet.absoluteFill}
        />
      )}

      <LinearGradient
        colors={[
          'rgba(248, 243, 230, 0.94)',
          'rgba(248, 243, 230, 0.5)',
          'rgba(248, 243, 230, 0.05)',
        ]}
        locations={[0, 0.45, 1]}
        style={styles.overlay}
      />

      <View style={styles.copy}>
        <Text
          style={[styles.title, compact && styles.titleCompact]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: tokens.layout.heroHeight,
    borderTopLeftRadius: tokens.radius.hero,
    borderTopRightRadius: tokens.radius.hero,
    overflow: 'hidden',
    backgroundColor: tokens.colors.creamBg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: undefined,
    height: undefined,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  copy: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 18,
    lineHeight: 22,
    fontWeight: '900',
    color: tokens.colors.deepGreen,
  },
  titleCompact: {
    fontSize: 17,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '600',
    color: tokens.colors.muted,
  },
  subtitleCompact: {
    fontSize: 11,
    lineHeight: 14,
  },
});
