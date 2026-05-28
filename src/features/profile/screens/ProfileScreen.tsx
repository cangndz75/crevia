import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, type Href } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { buildLeaderboardPrestigeSummary } from '@/features/leaderboard/utils/leaderboardProfileModel';
import { ProfileAuthorityCard } from '@/features/profile/components/ProfileAuthorityCard';
import { ProfileBadgeShowcaseCard } from '@/features/profile/components/ProfileBadgeShowcaseCard';
import { OperationSummaryCard } from '@/features/profile/components/OperationSummaryCard';
import { OperatorBadgeRow } from '@/features/profile/components/OperatorBadgeRow';
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard';
import { ProfileMenuSection } from '@/features/profile/components/ProfileMenuSection';
import { ProfileNavHeader } from '@/features/profile/components/ProfileNavHeader';
import { ProfilePrestigeCard } from '@/features/profile/components/ProfilePrestigeCard';
import { ProfileXpCard } from '@/features/profile/components/ProfileXpCard';
import {
  buildProfileBadges,
  buildProfileViewModel,
  buildTodayStatusLines,
} from '@/features/profile/utils/profileModel';
import { buildProfileAuthoritySummaryFromPilot } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { shadows } from '@/ui/theme/shadows';
import { spacing } from '@/ui/theme/spacing';

const HERO_GRADIENT = [colors.headerTealDark, '#1A7F7B', '#2BB5A8'] as const;

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const status = useGameStatus();
  const player = useGameStore((s) => s.gameState.player);
  const pilot = useGameStore((s) => s.gameState.pilot);
  const bestPilotScores = useGameStore((s) => s.bestPilotScores);
  const lastPilotScore = useGameStore((s) => s.lastPilotScore);

  const prestigeSummary = useMemo(
    () => buildLeaderboardPrestigeSummary(bestPilotScores, lastPilotScore),
    [bestPilotScores, lastPilotScore],
  );

  const model = useMemo(
    () => buildProfileViewModel(status, player),
    [status, player],
  );
  const badges = useMemo(() => buildProfileBadges(model), [model]);
  const todayLines = useMemo(() => buildTodayStatusLines(model), [model]);
  const authoritySummary = useMemo(
    () =>
      buildProfileAuthoritySummaryFromPilot(
        pilot.authorityState,
        pilot.currentPilotDay,
      ),
    [pilot.authorityState, pilot.currentPilotDay],
  );
  const badgeShowcaseSummary = useMemo(
    () =>
      buildProfileBadgeShowcaseSummary(
        pilot.badgeState,
        pilot.currentPilotDay,
      ),
    [pilot.badgeState, pilot.currentPilotDay],
  );

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 12) + spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <LinearGradient
          colors={[...HERO_GRADIENT]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}>
          <View style={styles.heroOrbRight} />
          <View style={styles.heroOrbLeft} />

          <View style={styles.heroInner}>
            <ProfileNavHeader
              onBack={() => router.back()}
              notificationCount={model.notificationCount}
            />

            <Animated.View entering={FadeInDown.duration(360).delay(30)}>
              <ProfileHeroCard model={model} />
            </Animated.View>

            <Animated.View entering={FadeInDown.duration(400).delay(90)}>
              <ProfileXpCard model={model} />
            </Animated.View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View
            entering={FadeIn.duration(300).delay(120)}
            style={[styles.floatingPanel, shadows.card]}>
            <OperationSummaryCard model={model} statusLines={todayLines} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(130)}>
            <ProfileAuthorityCard summary={authoritySummary} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(135)}>
            <ProfileBadgeShowcaseCard summary={badgeShowcaseSummary} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(140)}>
            <ProfilePrestigeCard
              summary={prestigeSummary}
              onOpenLeaderboard={() => router.push('/leaderboard' as Href)}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(160)}>
            <OperatorBadgeRow badges={badges} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(300).delay(200)}>
            <ProfileMenuSection />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.hubCream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  hero: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: spacing.lg,
  },
  heroOrbRight: {
    position: 'absolute',
    top: -24,
    right: -40,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  heroOrbLeft: {
    position: 'absolute',
    bottom: 48,
    left: -56,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(245,183,49,0.14)',
  },
  heroInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    zIndex: 1,
  },
  body: {
    marginTop: -10,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  floatingPanel: {
    borderRadius: 22,
  },
});
