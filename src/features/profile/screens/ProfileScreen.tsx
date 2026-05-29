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
import { OperatorBadgeRow } from '@/features/profile/components/OperatorBadgeRow';
import { ProfileHeroCard } from '@/features/profile/components/ProfileHeroCard';
import { ProfileMenuSection } from '@/features/profile/components/ProfileMenuSection';
import { ProfileNavHeader } from '@/features/profile/components/ProfileNavHeader';
import { ProfilePrestigeCard } from '@/features/profile/components/ProfilePrestigeCard';
import { ProfileXpCard } from '@/features/profile/components/ProfileXpCard';
import {
  buildProfileBadges,
  buildProfileViewModel,
} from '@/features/profile/utils/profileModel';
import { buildProfileAuthoritySummaryFromPilot } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileBadgeShowcaseSummary } from '@/features/profile/utils/profileBadgeModel';
import { buildProfileScreenLayoutModel } from '@/features/profile/utils/profileScreenPresentation';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
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
  const operatorBadges = useMemo(() => buildProfileBadges(model), [model]);
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

  const layout = useMemo(
    () =>
      buildProfileScreenLayoutModel({
        model,
        authoritySummary,
        badgeSummary: badgeShowcaseSummary,
        prestigeSummary,
      }),
    [model, authoritySummary, badgeShowcaseSummary, prestigeSummary],
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
          <View style={styles.heroInner}>
            <ProfileNavHeader
              onBack={() => router.back()}
              notificationCount={model.notificationCount}
            />

            <Animated.View entering={FadeInDown.duration(320).delay(20)}>
              <ProfileHeroCard
                model={model}
                careerLine={layout.heroCareerLine}
                rankChip={authoritySummary.rankLabel}
              />
            </Animated.View>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(280).delay(80)}>
            <ProfileAuthorityCard summary={authoritySummary} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(280).delay(100)}>
            <ProfileBadgeShowcaseCard summary={badgeShowcaseSummary} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(280).delay(120)}>
            <ProfilePrestigeCard
              summary={prestigeSummary}
              compact={layout.prestigeCompact}
              onOpenLeaderboard={() => router.push('/leaderboard' as Href)}
            />
          </Animated.View>

          {layout.showOperatorBadgeRow ? (
            <Animated.View entering={FadeIn.duration(280).delay(140)}>
              <OperatorBadgeRow badges={operatorBadges} compact />
            </Animated.View>
          ) : null}

          {layout.showXpProgress ? (
            <Animated.View entering={FadeIn.duration(280).delay(160)}>
              <ProfileXpCard model={model} compact />
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeIn.duration(280).delay(180)}>
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
    paddingBottom: spacing.md,
  },
  heroOrbRight: {
    position: 'absolute',
    top: -20,
    right: -36,
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroInner: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    zIndex: 1,
  },
  body: {
    marginTop: -6,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
});
