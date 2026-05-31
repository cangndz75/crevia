import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildMainOperationPackModel, buildPostPilotOfferViewModel } from '@/core/monetization';
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import { shouldRouteToPostPilotOffer } from '@/core/monetization/monetizationEngine';
import { MainOperationPackFeatureList } from '@/features/postPilot/components/MainOperationPackFeatureList';
import { PostPilotAccessChoiceCard } from '@/features/postPilot/components/PostPilotAccessChoiceCard';
import { PostPilotOfferHeroCard } from '@/features/postPilot/components/PostPilotOfferHeroCard';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';

export function PostPilotOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const markSeen = useGameStore((s) => s.markMainOperationOfferSeen);
  const mockPurchase = useGameStore((s) => s.mockPurchaseMainOperationPack);
  const continueLimited = useGameStore((s) => s.continueWithLimitedAgenda);
  const restoreAccess = useGameStore((s) => s.restoreMainOperationAccessPlaceholder);
  const seenRef = useRef(false);

  const model = useMemo(
    () =>
      buildPostPilotOfferViewModel(gameState, monetization, {
        isDev: __DEV__,
      }),
    [gameState, monetization],
  );

  const pack = useMemo(
    () => buildMainOperationPackModel(gameState),
    [gameState],
  );

  const canShowOffer = useMemo(
    () => shouldRouteToPostPilotOffer(gameState, monetization) || model.isFullAccess,
    [gameState, monetization, model.isFullAccess],
  );

  useEffect(() => {
    if (!canShowOffer || seenRef.current) return;
    seenRef.current = true;
    markSeen();
  }, [canShowOffer, markSeen]);

  const goHub = () => {
    router.replace('/');
  };

  const handlePrimary = () => {
    if (model.isFullAccess) {
      goHub();
      return;
    }
    mockPurchase();
    Alert.alert('Ana Operasyon', MONETIZATION_COPY.mockUnlockFeedback, [
      { text: 'Operasyon Merkezine Git', onPress: goHub },
    ]);
  };

  const handleSecondary = () => {
    continueLimited();
    goHub();
  };

  if (!canShowOffer && gameState.pilot.status !== 'completed') {
    return (
      <GameScreenShell screenTitle="Ana Operasyon" contentStyle={styles.empty}>
        <View />
      </GameScreenShell>
    );
  }

  return (
    <GameScreenShell screenTitle="Ana Operasyon" contentStyle={styles.shell}>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 180 },
        ]}
        showsVerticalScrollIndicator={false}>
        <PostPilotOfferHeroCard model={model} />
        <MainOperationPackFeatureList
          packTitle={pack.title}
          packSubtitle={pack.subtitle}
          packDescription={pack.description}
          featureRows={model.featureRows}
        />
      </ScrollView>
      <View style={styles.footer}>
        <PostPilotAccessChoiceCard
          model={model}
          onPrimary={handlePrimary}
          onSecondary={handleSecondary}
          onRestore={restoreAccess}
        />
      </View>
    </GameScreenShell>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#F5F3EA',
  },
  empty: {
    flex: 1,
    backgroundColor: '#F5F3EA',
  },
  scroll: {
    padding: 16,
    gap: 14,
    minWidth: 0,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'rgba(245, 243, 234, 0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 63, 59, 0.06)',
  },
});
