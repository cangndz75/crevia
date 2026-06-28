import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedProgressBar } from '@/features/progression/components/authorities/AnimatedProgressBar';
import type { GrowthHeaderModel } from '@/features/progression/utils/growthScreenPresentation';
import { growth } from '@/features/progression/theme/growthScreenTokens';
import { hubAssets } from '@/features/hub/utils/hubAssets';
import { HeaderAvatar } from '@/ui/components/game-header/HeaderAvatar';
import { spacing } from '@/ui/theme/spacing';

type GrowthScreenHeaderProps = {
  model: GrowthHeaderModel;
};

export function GrowthScreenHeader({ model }: GrowthScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={[growth.canvas, growth.canvasMid, growth.canvasDeep]}
      style={[styles.outer, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Ionicons name="shield" size={18} color={growth.gold} />
          <View style={styles.titleCopy}>
            <Text style={styles.title}>{model.title}</Text>
            <Text style={styles.subtitle}>{model.subtitle}</Text>
          </View>
        </View>

        <Pressable
          style={styles.resourcePill}
          accessibilityRole="button"
          accessibilityLabel={`Kaynak ${model.resourceLabel}`}>
          <Ionicons name="cube" size={14} color={growth.gold} />
          <Text style={styles.resourceText}>{model.resourceLabel}</Text>
          <Text style={styles.resourceSuffix}>Kaynak</Text>
          <Ionicons name="chevron-forward" size={14} color={growth.textSoft} />
        </Pressable>
      </View>

      <View style={styles.playerRow}>
        <View style={styles.avatarWrap}>
          <HeaderAvatar size={52} borderColor={growth.goldBorder} />
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{model.level}</Text>
          </View>
        </View>

        <View style={styles.playerCopy}>
          <Text style={styles.playerName}>{model.playerName}</Text>
          <Text style={styles.playerRole}>{model.role}</Text>
          <Text style={styles.playerMeta}>{model.metaLine}</Text>
        </View>

        <View style={styles.nextRewardCard}>
          <Text style={styles.nextRewardLabel}>{model.nextReward.label}</Text>
          <Text style={styles.nextRewardTitle}>{model.nextReward.title}</Text>
          <AnimatedProgressBar
            progress={model.nextReward.progress}
            color={growth.mint}
            trackColor={growth.track}
            height={5}
          />
          <Text style={styles.nextRewardXp}>
            {model.nextReward.xpCurrent} / {model.nextReward.xpTarget} XP
          </Text>
          <Image
            source={hubAssets.day1Plan.progressChest}
            style={styles.rewardThumb}
            contentFit="contain"
          />
        </View>
      </View>

      <View style={styles.xpRow}>
        <Text style={styles.xpLabel}>XP</Text>
        <View style={styles.xpTrack}>
          <AnimatedProgressBar
            progress={model.xpProgress}
            color={growth.mint}
            trackColor={growth.track}
            height={6}
          />
        </View>
        <Text style={styles.xpValue}>
          {model.xp} / {model.xpTarget}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  outer: {
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  titleLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    minWidth: 0,
  },
  titleCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: growth.gold,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
    lineHeight: 18,
  },
  resourcePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: growth.card,
    borderRadius: growth.radiusChip,
    borderWidth: 1,
    borderColor: growth.goldBorder,
    paddingHorizontal: 10,
    paddingVertical: 8,
    minHeight: growth.minTouch,
    maxWidth: '42%',
    flexShrink: 0,
  },
  resourceText: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.text,
  },
  resourceSuffix: {
    fontSize: 11,
    fontWeight: '600',
    color: growth.textSoft,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  levelBadge: {
    position: 'absolute',
    left: -2,
    bottom: -2,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: growth.gold,
    borderWidth: 2,
    borderColor: growth.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: growth.canvas,
  },
  playerCopy: {
    flex: 1,
    minWidth: 120,
    gap: 2,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '800',
    color: growth.text,
  },
  playerRole: {
    fontSize: 13,
    fontWeight: '600',
    color: growth.textSoft,
  },
  playerMeta: {
    fontSize: 12,
    fontWeight: '600',
    color: growth.textMuted,
  },
  nextRewardCard: {
    width: '100%',
    backgroundColor: growth.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: growth.borderGold,
    padding: 12,
    gap: 6,
    position: 'relative',
    overflow: 'hidden',
    minHeight: 88,
  },
  nextRewardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: growth.gold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  nextRewardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: growth.text,
    paddingRight: 56,
  },
  nextRewardXp: {
    fontSize: 12,
    fontWeight: '700',
    color: growth.mint,
  },
  rewardThumb: {
    position: 'absolute',
    right: 8,
    top: 8,
    width: 48,
    height: 48,
  },
  xpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: growth.glass,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: growth.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  xpLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: growth.mint,
    width: 24,
  },
  xpTrack: {
    flex: 1,
    minWidth: 0,
  },
  xpValue: {
    fontSize: 13,
    fontWeight: '700',
    color: growth.textSoft,
    minWidth: 64,
    textAlign: 'right',
  },
});
