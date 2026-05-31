import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainOperationHeroUnlockCard } from '@/features/pilot/components/main-operation-preview/MainOperationHeroUnlockCard';
import { MainOperationInsightColumns } from '@/features/pilot/components/main-operation-preview/MainOperationInsightColumns';
import { MainOperationPreviewActions } from '@/features/pilot/components/main-operation-preview/MainOperationPreviewActions';
import { MainOperationPreviewHeader } from '@/features/pilot/components/main-operation-preview/MainOperationPreviewHeader';
import { MainOperationRoadmapStrip } from '@/features/pilot/components/main-operation-preview/MainOperationRoadmapStrip';
import { MainOperationStatusCards } from '@/features/pilot/components/main-operation-preview/MainOperationStatusCards';
import { MainOperationSystemsGrid } from '@/features/pilot/components/main-operation-preview/MainOperationSystemsGrid';
import { useOperationPreviewState } from '@/features/pilot/hooks/useOperationPreviewState';
import {
  buildMainOperationPreviewUiModel,
} from '@/features/pilot/utils/mainOperationPreviewUiModel';
import { MAIN_OP_PREVIEW_COLORS } from '@/features/pilot/utils/mainOperationPreviewTheme';
import { useGameStore } from '@/store/useGameStore';
import { ANIMATED_TAB_BAR_HEIGHT } from '@/ui/components/AnimatedTabBar';

/**
 * Anasayfa / pilot raporu → "Ana Operasyon Önizlemesi" (yakında açılacak).
 * Alt menü Operasyon sekmesi ayrı: EventsDecisionCenterScreen.
 */
export function MainOperationPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const districtId = useGameStore((s) => s.gameState.pilot.selectedDistrictId);
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const markMainOperationPreviewSeen = useGameStore(
    (s) => s.markMainOperationPreviewSeen,
  );
  const preview = useOperationPreviewState({ forcePilotComplete: true });
  const previewMarkedRef = useRef(false);

  const ui = useMemo(
    () => buildMainOperationPreviewUiModel(preview, districtId),
    [preview, districtId],
  );

  const pilotCompleted = pilotStatus === 'completed';

  useEffect(() => {
    if (!pilotCompleted || previewMarkedRef.current) {
      return;
    }
    previewMarkedRef.current = true;
    markMainOperationPreviewSeen();
  }, [markMainOperationPreviewSeen, pilotCompleted]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleInfo = () => {
    Alert.alert(
      'Ana Operasyon Önizlemesi',
      'Şehir ölçeğindeki ana operasyon hazırlığı kademeli açılır. Günlük kararlar için alttaki Operasyon sekmesini kullan.',
    );
  };

  const handlePilotReport = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.push('/reports');
  };

  const bottomPadding = insets.bottom + ANIMATED_TAB_BAR_HEIGHT + 24;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 12,
            paddingBottom: bottomPadding,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <MainOperationPreviewHeader
          subtitle={ui.headerSubtitle}
          onBack={handleBack}
          onInfo={handleInfo}
        />

        <MainOperationStatusCards cards={ui.statusCards} />

        <MainOperationInsightColumns
          authoritySummary={ui.authoritySummary}
          scopeRows={ui.scopeRows}
          authorityDecorImage={ui.authorityDecorImage}
          scopeDecorImage={ui.scopeDecorImage}
        />

        <MainOperationHeroUnlockCard
          cityImage={ui.heroCityImage}
          badgeImage={ui.heroBadgeImage}
        />

        <MainOperationSystemsGrid cards={ui.systemCards} />

        <MainOperationRoadmapStrip steps={ui.roadmapSteps} />

        <MainOperationPreviewActions
          onLeaderboard={() => router.push('/leaderboard')}
          onAchievements={() => router.push('/progression')}
          onPilotReport={handlePilotReport}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: MAIN_OP_PREVIEW_COLORS.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 14,
  },
});
