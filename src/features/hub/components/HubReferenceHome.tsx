// @refresh reset
import { StatusBar } from 'expo-status-bar';
import { type ReactNode } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';

import { CenterCitySummaryCard } from '@/features/hub/components/CenterCitySummaryCard';
import { CenterDailyRewardRoute } from '@/features/hub/components/CenterDailyRewardRoute';
import { CenterHomeHeader } from '@/features/hub/components/CenterHomeHeader';
import { CenterLowerDashboard } from '@/features/hub/components/CenterLowerDashboard';
import { CenterMotionEnter } from '@/features/hub/components/CenterMotionEnter';
import { HubActiveTaskCardStack } from '@/features/hub/components/HubActiveTaskCardStack';
import type { CenterHomePresentation } from '@/features/hub/utils/centerHomePresentation';
import { isCenterModuleRenderable } from '@/features/hub/utils/centerHomePresentation';
import { resolveCenterSectionGap } from '@/features/hub/utils/centerLayoutTokens';
import { useAppTabBarHeight } from '@/ui/components/AnimatedTabBar';
import { gameUi } from '@/ui/theme/gameUiTokens';
import { useCreviaReducedMotion } from '@/shared/motion';

type HubReferenceHomeProps = {
  presentation: CenterHomePresentation;
  scrollFooter?: ReactNode;
};

function useLayoutMetrics() {
  const { width } = useWindowDimensions();
  const tabBarHeight = useAppTabBarHeight();
  return {
    compact: width < 370,
    bottomPadding: tabBarHeight + 28,
    sectionGap: resolveCenterSectionGap(width < 370),
  };
}

export function HubReferenceHome({ presentation, scrollFooter }: HubReferenceHomeProps) {
  const { bottomPadding, sectionGap } = useLayoutMetrics();
  const reducedMotion = useCreviaReducedMotion();
  const hubDay = Number(
    presentation.headerSummary.resourceChips.find((chip) => chip.id === 'day')?.valueText ?? '1',
  );
  const hubMotionEnabled = hubDay >= 8;
  const { visibilityFlags } = presentation;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomPadding }]}>
        {isCenterModuleRenderable(visibilityFlags.header) ? (
          <CenterHomeHeader header={presentation.headerSummary} />
        ) : null}

        <View style={[styles.body, { gap: sectionGap }]}>
          {isCenterModuleRenderable(visibilityFlags.citySummary) ? (
            <CenterCitySummaryCard summary={presentation.citySummary} />
          ) : null}

          {isCenterModuleRenderable(visibilityFlags.dailyReward) ? (
            <CenterDailyRewardRoute
              reward={presentation.dailyReward}
              visibility={presentation.dailyReward.visibility}
              reducedMotion={reducedMotion}
            />
          ) : null}

          {isCenterModuleRenderable(visibilityFlags.activeTarget) ? (
            <HubActiveTaskCardStack
              activeTarget={presentation.activeTarget}
              visibility={presentation.activeTarget.visibility}
              reducedMotion={reducedMotion}
            />
          ) : null}

          <CenterMotionEnter
            index={3}
            day={hubDay}
            reducedMotion={reducedMotion}
            hubMotionEnabled={hubMotionEnabled}
            disabled={!hubMotionEnabled}>
            <CenterLowerDashboard presentation={presentation} reducedMotion={reducedMotion} />
          </CenterMotionEnter>

          {scrollFooter ? <View style={styles.scrollFooter}>{scrollFooter}</View> : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: gameUi.colors.backgroundCream,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: gameUi.spacing.cardGap,
  },
  body: {
    paddingHorizontal: gameUi.spacing.screenHorizontal,
    minWidth: 0,
  },
  scrollFooter: {
    paddingTop: 4,
  },
});
