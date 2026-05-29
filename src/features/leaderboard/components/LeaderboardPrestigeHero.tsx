import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import type { LeaderboardHeroModel } from '@/features/leaderboard/utils/leaderboardPresentation';
import { LEADERBOARD_UI_COPY } from '@/features/leaderboard/utils/leaderboardPresentation';
import { colors } from '@/ui/theme/colors';
import { radius } from '@/ui/theme/radius';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

type Props = {
  model: LeaderboardHeroModel;
};

export function LeaderboardPrestigeHero({ model }: Props) {
  return (
    <Animated.View entering={FadeInDown.duration(400).springify()} style={styles.wrap}>
      <LinearGradient
        colors={['#FFFFFF', '#FAFFFE', '#F2FBF9']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.card, shadows.soft]}>
        <Text style={styles.kicker} numberOfLines={1}>
          {LEADERBOARD_UI_COPY.cityPrestige}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {model.subtitle}
        </Text>

        <View style={styles.scoreRow}>
          <View style={styles.scoreCol}>
            <Text style={styles.scoreLabel} numberOfLines={1}>
              {LEADERBOARD_UI_COPY.bestPilot}
            </Text>
            <Text style={styles.scoreValue} numberOfLines={1}>
              {model.bestScoreLabel}
            </Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipLabel} numberOfLines={1}>
              {LEADERBOARD_UI_COPY.officialDuty}
            </Text>
            <Text style={styles.chipValue} numberOfLines={1}>
              {model.titleChip}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    gap: 8,
    minWidth: 0,
  },
  kicker: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    lineHeight: 17,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    minWidth: 0,
  },
  scoreCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  scoreValue: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.textPrimary,
    letterSpacing: -0.4,
  },
  chip: {
    maxWidth: '46%',
    flexShrink: 1,
    minWidth: 0,
    alignSelf: 'center',
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
    borderWidth: 1,
    borderColor: 'rgba(26,143,138,0.14)',
  },
  chipLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  chipValue: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
  },
});
