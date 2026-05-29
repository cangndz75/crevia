import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { LeaderboardDynamicAvatar } from '@/features/leaderboard/components/LeaderboardDynamicAvatar';
import type { LeaderboardPodiumModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  podium: LeaderboardPodiumModel[];
};

const TONE_STYLES = {
  gold: {
    cardBg: '#FFFBF0',
    border: 'rgba(212,160,23,0.28)',
    rankBg: colors.hubGoldMuted,
    rankText: colors.hubGoldDark,
    avatarSize: 56,
    lift: 10,
  },
  teal: {
    cardBg: colors.surface,
    border: colors.border,
    rankBg: colors.primaryMuted,
    rankText: colors.primary,
    avatarSize: 48,
    lift: 0,
  },
  mint: {
    cardBg: colors.surface,
    border: colors.border,
    rankBg: '#E6F7F4',
    rankText: '#2BB5A8',
    avatarSize: 48,
    lift: 0,
  },
} as const;

function PodiumCard({
  item,
  delay,
}: {
  item: LeaderboardPodiumModel;
  delay: number;
}) {
  const tone = TONE_STYLES[item.tone];

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(360)}
      style={[
        styles.card,
        shadows.soft,
        {
          backgroundColor: tone.cardBg,
          borderColor: tone.border,
          marginTop: tone.lift,
          flex: item.rank === 1 ? 1.08 : 1,
        },
      ]}>
      <View style={[styles.rankBadge, { backgroundColor: tone.rankBg }]}>
        <Text style={[styles.rankText, { color: tone.rankText }]}>{item.rank}</Text>
      </View>
      <LeaderboardDynamicAvatar avatar={item.avatar} size={tone.avatarSize} />
      <Text style={styles.name} numberOfLines={1}>
        {item.displayName}
      </Text>
      <Text style={styles.title} numberOfLines={1}>
        {item.titleLabel}
      </Text>
      <Text style={styles.region} numberOfLines={1}>
        {item.subtitle}
      </Text>
      <Text style={styles.score} numberOfLines={1}>
        {item.scoreLabel}
      </Text>
      {item.badgeCountLabel ? (
        <Text style={styles.prestigeTag} numberOfLines={1}>
          {item.badgeCountLabel}
        </Text>
      ) : null}
    </Animated.View>
  );
}

export function LeaderboardPodiumStrip({ podium }: Props) {
  if (podium.length === 0) {
    return null;
  }

  const ordered: LeaderboardPodiumModel[] = [];
  const second = podium.find((p) => p.rank === 2);
  const first = podium.find((p) => p.rank === 1);
  const third = podium.find((p) => p.rank === 3);
  if (second) ordered.push(second);
  if (first) ordered.push(first);
  if (third) ordered.push(third);
  const fallback = podium.filter((p) => !ordered.includes(p));
  const layout = [...ordered, ...fallback];

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle} numberOfLines={1}>
        Pilot Prestiji
      </Text>
      <View style={styles.row}>
        {layout.map((item, index) => (
          <PodiumCard key={item.rank} item={item} delay={index * 70} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    minWidth: 0,
  },
  card: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    fontSize: 11,
    fontWeight: '900',
  },
  name: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center',
    width: '100%',
  },
  title: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
  region: {
    fontSize: 9,
    fontWeight: '600',
    color: colors.textSecondary,
    textAlign: 'center',
    width: '100%',
  },
  score: {
    fontSize: 10,
    fontWeight: '900',
    color: colors.primary,
    marginTop: 2,
  },
  prestigeTag: {
    fontSize: 8,
    fontWeight: '700',
    color: colors.hubGoldDark,
    marginTop: 1,
  },
});
