import { useRouter, type Href } from 'expo-router';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { useAppTabBarHeight } from '@/components/navigation/CreviaBottomTabBar';
import { ProfileAuthorityMiniCard } from '@/features/profile/components/ProfileAuthorityMiniCard';
import { ProfileBrandHeader } from '@/features/profile/components/ProfileBrandHeader';
import { ProfileIdentitySection } from '@/features/profile/components/ProfileIdentitySection';
import { ProfileRoadmapSection } from '@/features/profile/components/ProfileRoadmapSection';
import { ProfileRoleAdvantagesSection } from '@/features/profile/components/ProfileRoleAdvantagesSection';
import { ProfileStrengthsCard } from '@/features/profile/components/ProfileStrengthsCard';
import { ProfileSummaryCard } from '@/features/profile/components/ProfileSummaryCard';
import {
  buildProfileViewModel,
} from '@/features/profile/utils/profileModel';
import { buildProfileAuthoritySummaryFromPilot } from '@/features/profile/utils/profileAuthorityModel';
import { buildProfileReferenceViewModel, PROFILE_REFERENCE_THEME } from '@/features/profile/utils/profileReferencePresentation';
import { useGameStatus } from '@/store/gameSelectors';
import { useGameStore } from '@/store/useGameStore';
import { spacing } from '@/ui/theme/spacing';

const cityBackdrop = require('@/assets/districts/central/district_central_overview_01.png');

export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useAppTabBarHeight();
  const status = useGameStatus();
  const player = useGameStore((s) => s.gameState.player);
  const pilot = useGameStore((s) => s.gameState.pilot);

  const model = useMemo(
    () => buildProfileViewModel(status, player),
    [status, player],
  );
  const authoritySummary = useMemo(
    () =>
      buildProfileAuthoritySummaryFromPilot(
        pilot.authorityState,
        pilot.currentPilotDay,
      ),
    [pilot.authorityState, pilot.currentPilotDay],
  );
  const referenceModel = useMemo(
    () =>
      buildProfileReferenceViewModel({
        model,
        authoritySummary,
        authorityState: pilot.authorityState,
        pilotDay: pilot.currentPilotDay,
      }),
    [authoritySummary, model, pilot.authorityState, pilot.currentPilotDay],
  );

  const bottomPadding = Math.max(tabBarHeight, insets.bottom + spacing.lg);

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.heroBand}>
          <Image
            source={cityBackdrop}
            style={styles.heroBackdrop}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
          <View style={styles.heroFade} />

          <View style={styles.headerSlot}>
            <ProfileBrandHeader notificationCount={referenceModel.identity.notificationCount} />
          </View>

          <Animated.View entering={FadeInDown.duration(320).delay(20)} style={styles.identitySlot}>
            <ProfileIdentitySection identity={referenceModel.identity} />
          </Animated.View>
        </View>

        <View style={styles.body}>
          <Animated.View entering={FadeIn.duration(280).delay(60)}>
            <ProfileSummaryCard summary={referenceModel.summary} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(280).delay(90)} style={styles.dualRow}>
            <ProfileAuthorityMiniCard
              authorityMini={referenceModel.authorityMini}
              onDetailsPress={() => router.push('/progression' as Href)}
            />
            <ProfileStrengthsCard
              strengths={referenceModel.strengths}
              onSeeAllPress={() => router.push('/progression' as Href)}
            />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(280).delay(120)}>
            <ProfileRoleAdvantagesSection items={referenceModel.roleAdvantages} />
          </Animated.View>

          <Animated.View entering={FadeIn.duration(280).delay(150)}>
            <ProfileRoadmapSection
              nodes={referenceModel.roadmap}
              summary={referenceModel.roadmapSummary}
              onSeeFullRoadmapPress={() => router.push('/progression' as Href)}
            />
          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PROFILE_REFERENCE_THEME.screenBg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  heroBand: {
    position: 'relative',
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: 12,
    minHeight: 386,
  },
  heroBackdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  heroFade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(252, 249, 242, 0.72)',
  },
  headerSlot: {
    position: 'relative',
    zIndex: 1,
    paddingBottom: spacing.sm,
  },
  identitySlot: {
    position: 'relative',
    zIndex: 1,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: 12,
    paddingTop: 2,
  },
  dualRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'stretch',
  },
});
