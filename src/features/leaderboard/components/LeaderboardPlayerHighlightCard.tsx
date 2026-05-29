import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { LeaderboardDynamicAvatar } from '@/features/leaderboard/components/LeaderboardDynamicAvatar';
import type { LeaderboardPlayerHighlightModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { LEADERBOARD_UI_COPY } from '@/features/leaderboard/utils/leaderboardPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  model: LeaderboardPlayerHighlightModel;
};

export function LeaderboardPlayerHighlightCard({ model }: Props) {
  if (!model.visible) {
    return null;
  }

  return (
    <Animated.View
      entering={FadeInUp.delay(180).duration(320)}
      style={[styles.card, shadows.soft]}>
      <LeaderboardDynamicAvatar avatar={model.avatar} size={44} highlighted />
      <View style={styles.copy}>
        <View style={styles.topRow}>
          <Text style={styles.title} numberOfLines={1}>
            {model.title}
          </Text>
          <Text style={styles.rank} numberOfLines={1}>
            {model.rankLabel}
          </Text>
        </View>
        <Text style={styles.score} numberOfLines={1}>
          {model.scoreLabel}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {model.titleLabel} · {model.regionLabel}
        </Text>
      </View>
      <View style={styles.pill}>
        <Text style={styles.pillText} numberOfLines={1}>
          {LEADERBOARD_UI_COPY.yourRank}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: spacing.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.22)',
    minWidth: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minWidth: 0,
  },
  title: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    minWidth: 0,
  },
  rank: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.textPrimary,
    flexShrink: 0,
  },
  score: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  meta: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  pill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    flexShrink: 0,
    maxWidth: '34%',
  },
  pillText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary,
  },
});
