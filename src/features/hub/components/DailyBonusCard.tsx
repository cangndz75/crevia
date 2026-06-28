import { useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import type { StreakNode } from '@/features/hub/utils/centerLowerDashboardPresentation';
import {
  centerLowerPalette,
  centerLowerPanelShadow,
} from '@/features/hub/utils/centerLowerDashboardTokens';

export type DailyBonusCardProps = {
  title?: string;
  subtitle?: string;
  nodes: StreakNode[];
  rewardAmount: number;
  currentDay?: number;
  reducedMotion?: boolean;
};

function BonusNode({
  node,
  reducedMotion,
}: {
  node: StreakNode;
  reducedMotion?: boolean;
}) {
  const glow = useSharedValue(0.14);

  useEffect(() => {
    if (reducedMotion || node.state !== 'active') {
      glow.value = node.state === 'active' ? 0.2 : 0.14;
      return;
    }
    glow.value = withRepeat(
      withTiming(0.32, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow, node.state, reducedMotion]);

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value,
  }));

  return (
    <View style={styles.bonusNodeWrap}>
      <Animated.View
        style={[
          styles.bonusNode,
          node.state === 'claimed' ? styles.bonusNodeClaimed : undefined,
          node.state === 'active' ? styles.bonusNodeActive : undefined,
          node.state === 'active' ? glowStyle : undefined,
        ]}>
        <Ionicons
          name={
            node.state === 'locked'
              ? 'lock-closed'
              : node.state === 'claimed'
                ? 'checkmark'
                : 'sparkles'
          }
          size={11}
          color={node.state === 'locked' ? centerLowerPalette.mutedLight : centerLowerPalette.tealDeep}
        />
      </Animated.View>
      <Text style={styles.bonusNodeText} numberOfLines={1}>
        {node.value}
      </Text>
    </View>
  );
}

export function DailyBonusCard({
  title = 'GÜNLÜK SERİ',
  subtitle = 'Merkez disiplinini koru.',
  nodes,
  rewardAmount,
  reducedMotion,
}: DailyBonusCardProps) {
  return (
    <LinearGradient
      colors={[centerLowerPalette.tealDeep, centerLowerPalette.tealPanel, '#234F47']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.bonusCard}>
      <View style={styles.bonusGlow} />
      <View style={styles.bonusCopy}>
        <Text style={styles.bonusEyebrow} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.bonusSubtitle} numberOfLines={2}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.bonusNodes}>
        {nodes.map((node) => (
          <BonusNode key={node.id} node={node} reducedMotion={reducedMotion} />
        ))}
      </View>
      <View style={styles.rewardWrap}>
        <View style={styles.rewardChest}>
          <Ionicons name="cube" size={18} color={centerLowerPalette.goldSoft} />
        </View>
        <View style={styles.rewardAmount}>
          <Ionicons name="diamond" size={12} color="#D7C8FF" />
          <Text style={styles.rewardAmountText}>{rewardAmount}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bonusCard: {
    minHeight: 76,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.22)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
    ...centerLowerPanelShadow,
  },
  bonusGlow: {
    position: 'absolute',
    left: -18,
    top: -24,
    width: 96,
    height: 96,
    borderRadius: 999,
    backgroundColor: 'rgba(157,242,210,0.10)',
  },
  bonusCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  bonusEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
    color: centerLowerPalette.goldSoft,
  },
  bonusSubtitle: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: centerLowerPalette.mutedLight,
  },
  bonusNodes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  bonusNodeWrap: {
    alignItems: 'center',
    gap: 3,
  },
  bonusNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    shadowColor: '#D7C8FF',
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  bonusNodeClaimed: {
    backgroundColor: centerLowerPalette.goldSoft,
    borderColor: centerLowerPalette.gold,
  },
  bonusNodeActive: {
    borderColor: '#D7C8FF',
  },
  bonusNodeText: {
    fontSize: 9,
    fontWeight: '900',
    color: centerLowerPalette.mutedLight,
  },
  rewardWrap: {
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
  },
  rewardChest: {
    width: 34,
    height: 30,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,227,175,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,227,175,0.28)',
  },
  rewardAmount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  rewardAmountText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#D7C8FF',
  },
});
