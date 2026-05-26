import { useRouter } from 'expo-router';
import { Alert, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useShallow } from 'zustand/react/shallow';

import { OperationPreviewFooterCTA } from '@/features/pilot/components/operation-preview/OperationPreviewFooterCTA';
import { OperationPreviewHeader } from '@/features/pilot/components/operation-preview/OperationPreviewHeader';
import { OperationPreviewHero } from '@/features/pilot/components/operation-preview/OperationPreviewHero';
import { OperationPreviewLegacyCard } from '@/features/pilot/components/operation-preview/OperationPreviewLegacyCard';
import { OperationPreviewRoadmap } from '@/features/pilot/components/operation-preview/OperationPreviewRoadmap';
import { OperationPreviewStatusChips } from '@/features/pilot/components/operation-preview/OperationPreviewStatusChips';
import { OperationPreviewSystemsGrid } from '@/features/pilot/components/operation-preview/OperationPreviewSystemsGrid';
import { getPilotDistrictHeroImage } from '@/features/hub/utils/hubAssets';
import { useGameStore } from '@/store/useGameStore';
import { AppScreen } from '@/ui/components/AppScreen';
import { colors } from '@/ui/theme/colors';
import { spacing } from '@/ui/theme/spacing';

function formatCurrency(amount: number): string {
  return `₺${Math.round(amount).toLocaleString('tr-TR')}`;
}

export function MainOperationPreviewScreen() {
  const router = useRouter();
  const { districtId, city } = useGameStore(
    useShallow((s) => ({
      districtId: s.gameState.pilot.selectedDistrictId,
      city: s.gameState.city,
    })),
  );

  const districtImage = getPilotDistrictHeroImage(districtId);

  const legacyValues = {
    trust: `%${city.publicSatisfaction}`,
    budget: formatCurrency(city.budget),
    morale: `%${city.morale}`,
    risk: `${city.riskScore}/100`,
  };

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
      'Pilot bölge tamamlandı. Ana operasyon modu ilerleyen güncellemelerde açılacak; kararların başlangıç dengene yansıyacak.',
    );
  };

  const goPilotReport = () => {
    router.push('/events/pilot-final-report');
  };

  return (
    <AppScreen
      safeEdges={['left', 'right']}
      style={styles.screen}
      contentStyle={styles.content}>
      <Animated.View entering={FadeIn.duration(280)}>
        <OperationPreviewHeader onBack={handleBack} onInfo={handleInfo} />
      </Animated.View>

      <OperationPreviewStatusChips />
      <OperationPreviewRoadmap />
      <OperationPreviewHero districtImage={districtImage} />
      <OperationPreviewLegacyCard values={legacyValues} />
      <OperationPreviewSystemsGrid />
      <OperationPreviewFooterCTA onPilotReport={goPilotReport} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: colors.hubCream,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 0,
    gap: spacing.lg,
  },
});
