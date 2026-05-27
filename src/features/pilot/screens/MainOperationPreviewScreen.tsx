import { useRouter } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { OperationPreviewFooterCTA } from '@/features/pilot/components/operation-preview/OperationPreviewFooterCTA';
import { OperationPreviewHeader } from '@/features/pilot/components/operation-preview/OperationPreviewHeader';
import { OperationPreviewHero } from '@/features/pilot/components/operation-preview/OperationPreviewHero';
import { OperationPreviewLegacyCard } from '@/features/pilot/components/operation-preview/OperationPreviewLegacyCard';
import { OperationPreviewRoadmap } from '@/features/pilot/components/operation-preview/OperationPreviewRoadmap';
import { OperationPreviewStatusChips } from '@/features/pilot/components/operation-preview/OperationPreviewStatusChips';
import { OperationPreviewSystemsGrid } from '@/features/pilot/components/operation-preview/OperationPreviewSystemsGrid';
import { useOperationPreviewState } from '@/features/pilot/hooks/useOperationPreviewState';
import { useGameStore } from '@/store/useGameStore';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

/**
 * Anasayfa / pilot raporu → "Ana Operasyon Önizlemesi" (yakında açılacak).
 * Alt menü Operasyon sekmesi ayrı: EventsDecisionCenterScreen.
 */
export function MainOperationPreviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const districtId = useGameStore((s) => s.gameState.pilot.selectedDistrictId);
  const preview = useOperationPreviewState({ forcePilotComplete: true });

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
      'Şehir ölçeğindeki ana operasyon modu henüz açılmadı. Günlük kararlar için alttaki Operasyon sekmesini kullan.',
    );
  };

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.headerWrap}>
        <OperationPreviewHeader onBack={handleBack} onInfo={handleInfo} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <OperationPreviewStatusChips chips={preview.chips} />
        <OperationPreviewRoadmap
          steps={preview.roadmapSteps}
          hint={preview.roadmapHint}
        />
        <OperationPreviewHero
          districtImage={getPilotDistrictHeroImage(districtId)}
          statusRows={preview.heroRows}
          mainOperationLocked={preview.mainLocked}
        />
        <OperationPreviewLegacyCard values={preview.legacyValues} />
        <OperationPreviewSystemsGrid cards={preview.systemCards} />
        <OperationPreviewFooterCTA
          onPilotReport={() => router.push('/events/pilot-final-report')}
          onNormalOperation={() => router.replace('/events')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerWrap: {
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
});
