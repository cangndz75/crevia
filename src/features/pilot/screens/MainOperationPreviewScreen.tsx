import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildPostPilotPreviewCtaLabel } from '@/core/postPilot';
import {
  buildPostPilotPreviewFooterNote,
  buildPostPilotPreviewScreenCopyLines,
} from '@/core/postPilot/postPilotOperationUxPresentation';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { OperationPreviewAuthorityCard } from '@/features/pilot/components/operation-preview/OperationPreviewAuthorityCard';
import { ProgressionBridgeCard } from '@/features/pilot/components/ProgressionBridgeCard';
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
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);
  const markMainOperationPreviewSeen = useGameStore(
    (s) => s.markMainOperationPreviewSeen,
  );
  const startLightMainOperation = useGameStore((s) => s.startLightMainOperation);
  const preview = useOperationPreviewState({ forcePilotComplete: true });
  const previewMarkedRef = useRef(false);

  const pilotCompleted = pilotStatus === 'completed';
  const primaryLabel = buildPostPilotPreviewCtaLabel(
    pilotCompleted ? 'completed' : 'active',
  );

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

  const handleStartLightOperation = () => {
    if (!pilotCompleted) {
      router.push('/events/pilot-final-report');
      return;
    }
    startLightMainOperation();
    router.replace('/');
  };

  const copyLines = buildPostPilotPreviewScreenCopyLines();

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom }]}>
      <View style={styles.headerWrap}>
        <OperationPreviewHeader
          onBack={handleBack}
          onInfo={handleInfo}
          subtitle={preview.headerSubtitle}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: spacing.xxl + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}>
        <OperationPreviewStatusChips
          chips={preview.chips}
          personalizedChips={preview.personalizedChips}
        />
        <OperationPreviewAuthorityCard summary={preview.authoritySummary} />
        <ProgressionBridgeCard summary={preview.progressionBridgeSummary} />

        <View style={styles.copyCard}>
          {copyLines.map((line) => (
            <Text key={line} style={styles.copyLine} numberOfLines={2}>
              {line}
            </Text>
          ))}
        </View>

        <OperationPreviewRoadmap
          steps={preview.roadmapSteps}
          hint={preview.roadmapHint}
        />
        <OperationPreviewHero
          districtImage={getPilotDistrictHeroImage(districtId)}
          statusRows={preview.heroRows}
          mainOperationLocked={preview.mainLocked}
          personalizedSummary={preview.heroPersonalizedText}
        />
        <OperationPreviewLegacyCard values={preview.legacyValues} />
        <OperationPreviewSystemsGrid cards={preview.systemCards} />
        <OperationPreviewFooterCTA
          primaryLabel={primaryLabel}
          primaryEnabled={pilotCompleted}
          onPrimaryPress={handleStartLightOperation}
          onPilotReport={() => {
            if (router.canGoBack()) {
              router.back();
              return;
            }
            router.push('/reports');
          }}
          onHub={() => router.replace('/')}
          onLeaderboard={() => router.push('/leaderboard')}
          footerNote={buildPostPilotPreviewFooterNote()}
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
  copyCard: {
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  copyLine: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    color: colors.textSecondary,
  },
});
