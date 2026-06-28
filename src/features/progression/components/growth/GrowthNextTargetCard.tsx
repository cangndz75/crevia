import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import type { GrowthNextTargetModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { hubAssets } from '@/features/hub/utils/hubAssets';

type GrowthNextTargetCardProps = {
  model: GrowthNextTargetModel;
};

export function GrowthNextTargetCard({ model }: GrowthNextTargetCardProps) {
  return (
    <View style={[styles.card, growth.shadow]}>
      <Text style={styles.sectionTitle}>{model.title}</Text>

      <View style={styles.body}>
        <View style={styles.imageFrame}>
          <Image
            source={hubAssets.day1Plan.mahalleThumb}
            style={styles.image}
            contentFit="cover"
          />
        </View>

        <View style={styles.copy}>
          <Text style={styles.rewardTitle}>{model.rewardTitle}</Text>
          <Text style={styles.description}>{model.description}</Text>
          <AnimatedProgressBar
            progress={model.progress}
            color={growth.mint}
            trackColor={growth.track}
            height={6}
          />
          <Text style={styles.xpLabel}>
            {model.xpCurrent} / {model.xpTarget} XP
          </Text>
        </View>

        <View style={styles.rewardBox}>
          <Text style={styles.rewardBoxLabel}>Ödül</Text>
          <Ionicons name="flash" size={14} color={growth.gold} />
          <Text style={styles.rewardBoxValue}>{model.rewardXpLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: growth.card,
    borderRadius: growth.radiusCard,
    borderWidth: 1,
    borderColor: growth.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: growth.text,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minWidth: 0,
  },
  imageFrame: {
    width: 56,
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: growth.cardSolid,
    borderWidth: 1,
    borderColor: growth.borderGold,
    flexShrink: 0,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: growth.text,
    lineHeight: 20,
  },
  description: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    lineHeight: 18,
  },
  xpLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: growth.mint,
  },
  rewardBox: {
    width: 64,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: growth.cardSolid,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: growth.goldBorder,
    paddingVertical: 10,
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  rewardBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: growth.textMuted,
    textTransform: 'uppercase',
  },
  rewardBoxValue: {
    fontSize: 13,
    fontWeight: '900',
    color: growth.gold,
    textAlign: 'center',
  },
});
