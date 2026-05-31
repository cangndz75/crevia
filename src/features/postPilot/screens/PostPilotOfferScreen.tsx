import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  createAnalyticsEvent,
  trackAnalyticsEvent,
} from '@/core/analytics/analyticsTracker';
import type { AnalyticsAccessMode } from '@/core/analytics/analyticsTypes';
import {
  IAP_OFFER_COPY,
  IAP_STATUS_COPY,
  MAIN_OPERATION_IAP_PRODUCT_ID,
  MOCK_PURCHASE_ANALYTICS_BRIDGE,
} from '@/core/iap/iapProductConstants';
import {
  fetchIapProducts,
  getActiveIapEntitlements,
  initializeIapRuntime,
  purchaseIapProduct,
  restoreIapPurchases,
  shouldUseMockPurchaseForOfferScreen,
  shouldUseRevenueCatPurchaseForOfferScreen,
} from '@/core/iap/iapRuntimeService';
import { shouldUnlockMainOperationFromEntitlement } from '@/core/iap/iapEntitlementMapping';
import { buildMainOperationPackModel, buildPostPilotOfferViewModel } from '@/core/monetization';
import { MONETIZATION_COPY } from '@/core/monetization/monetizationConstants';
import {
  getPostPilotAccessMode,
  shouldRouteToPostPilotOffer,
} from '@/core/monetization/monetizationEngine';
import { MainOperationPackFeatureList } from '@/features/postPilot/components/MainOperationPackFeatureList';
import { PostPilotAccessChoiceCard } from '@/features/postPilot/components/PostPilotAccessChoiceCard';
import { PostPilotOfferHeroCard } from '@/features/postPilot/components/PostPilotOfferHeroCard';
import { useGameStore } from '@/store/useGameStore';
import { GameScreenShell } from '@/ui/components/GameScreenShell';

function toAnalyticsAccessMode(
  mode: ReturnType<typeof getPostPilotAccessMode>,
): AnalyticsAccessMode {
  if (mode === 'full') return 'post_pilot_full';
  if (mode === 'limited' || mode === 'offer') return 'post_pilot_limited';
  return 'pilot';
}

export function PostPilotOfferScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gameState = useGameStore((s) => s.gameState);
  const monetization = useGameStore((s) => s.monetization);
  const markSeen = useGameStore((s) => s.markMainOperationOfferSeen);
  const mockPurchase = useGameStore((s) => s.mockPurchaseMainOperationPack);
  const applyIapEntitlement = useGameStore((s) => s.applyIapEntitlementToMonetization);
  const continueLimited = useGameStore((s) => s.continueWithLimitedAgenda);
  const seenRef = useRef(false);
  const entitlementSyncRef = useRef(false);

  const [isIapLoading, setIsIapLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [iapErrorMessage, setIapErrorMessage] = useState<string | undefined>();
  const [iapStatusMessage, setIapStatusMessage] = useState<string | undefined>();
  const [priceLabel, setPriceLabel] = useState<string | undefined>();
  const [productDisplayLabel, setProductDisplayLabel] = useState<string>(
    IAP_OFFER_COPY.title,
  );

  const currentDay = Math.max(
    gameState.city.day,
    gameState.pilot.currentPilotDay,
  );
  const accessMode = toAnalyticsAccessMode(
    getPostPilotAccessMode(gameState, monetization),
  );
  const useMockPurchase = shouldUseMockPurchaseForOfferScreen();
  const useRealPurchase = shouldUseRevenueCatPurchaseForOfferScreen();
  const iapBusy = isPurchasing || isRestoring;

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

  const trackOfferEvent = useCallback(
    (
      eventName: Parameters<typeof createAnalyticsEvent>[0],
      extra: Record<string, string | number | boolean | undefined> = {},
    ) => {
      trackAnalyticsEvent(
        createAnalyticsEvent(eventName, {
          surface: 'post_pilot_offer',
          day: currentDay,
          pilotDay: gameState.pilot.currentPilotDay,
          accessMode,
        }, extra),
      );
    },
    [accessMode, currentDay, gameState.pilot.currentPilotDay],
  );

  useEffect(() => {
    if (!canShowOffer || seenRef.current) return;
    seenRef.current = true;
    markSeen();
    trackOfferEvent(MOCK_PURCHASE_ANALYTICS_BRIDGE.offerOpened);
  }, [canShowOffer, markSeen, trackOfferEvent]);

  useEffect(() => {
    let cancelled = false;

    const bootstrapIap = async () => {
      setIsIapLoading(true);
      setIapErrorMessage(undefined);
      try {
        const status = await initializeIapRuntime();
        const list = await fetchIapProducts();
        if (cancelled) return;

        const mainProduct = list.products.find(
          (p) => p.productId === MAIN_OPERATION_IAP_PRODUCT_ID,
        );
        if (mainProduct) {
          setProductDisplayLabel(mainProduct.title);
          if (mainProduct.priceLabel) {
            setPriceLabel(mainProduct.priceLabel);
          }
        }

        trackOfferEvent('iap_product_list_loaded', {
          source: list.source === 'revenuecat' ? 'revenuecat' : 'mock',
        });

        if (
          status.mode === 'revenuecat' &&
          status.configured &&
          !entitlementSyncRef.current &&
          !model.isFullAccess
        ) {
          entitlementSyncRef.current = true;
          const entitlements = await getActiveIapEntitlements(currentDay);
          const active = entitlements.find(shouldUnlockMainOperationFromEntitlement);
          if (active && !cancelled) {
            applyIapEntitlement(active);
            setIapStatusMessage(IAP_OFFER_COPY.accessActive);
          }
        }
      } catch {
        if (!cancelled) {
          setIapErrorMessage(IAP_STATUS_COPY.purchaseFailed);
        }
      } finally {
        if (!cancelled) {
          setIsIapLoading(false);
        }
      }
    };

    if (canShowOffer) {
      void bootstrapIap();
    } else {
      setIsIapLoading(false);
    }

    return () => {
      cancelled = true;
    };
  }, [
    applyIapEntitlement,
    canShowOffer,
    currentDay,
    model.isFullAccess,
    trackOfferEvent,
  ]);

  const goHub = () => {
    router.replace('/');
  };

  const completeFullAccess = (message: string) => {
    setIapStatusMessage(message);
    setIapErrorMessage(undefined);
    Alert.alert('Ana Operasyon', message, [
      { text: 'Operasyon Merkezine Git', onPress: goHub },
    ]);
  };

  const handlePrimary = async () => {
    if (model.isFullAccess) {
      goHub();
      return;
    }
    if (iapBusy || isIapLoading) {
      return;
    }

    trackOfferEvent(MOCK_PURCHASE_ANALYTICS_BRIDGE.primaryCta, {
      ctaId: 'primary_unlock',
      source: useRealPurchase ? 'revenuecat' : 'mock',
    });

    if (useMockPurchase) {
      trackOfferEvent(MOCK_PURCHASE_ANALYTICS_BRIDGE.purchaseStarted, {
        source: 'mock',
      });
      mockPurchase();
      trackOfferEvent(MOCK_PURCHASE_ANALYTICS_BRIDGE.purchaseCompleted, {
        source: 'mock',
      });
      completeFullAccess(MONETIZATION_COPY.mockUnlockFeedback);
      return;
    }

    if (!useRealPurchase) {
      setIapErrorMessage(IAP_STATUS_COPY.purchaseFailed);
      return;
    }

    setIsPurchasing(true);
    setIapErrorMessage(undefined);
    setIapStatusMessage(IAP_OFFER_COPY.accessChecking);
    trackOfferEvent('iap_purchase_started', {
      ctaId: 'primary_unlock',
      source: 'revenuecat',
    });

    const result = await purchaseIapProduct(
      MAIN_OPERATION_IAP_PRODUCT_ID,
      currentDay,
    );
    setIsPurchasing(false);

    if (result.status === 'completed' && result.entitlement) {
      applyIapEntitlement(result.entitlement);
      trackOfferEvent('iap_purchase_completed', {
        source: 'revenuecat',
        resultBand: 'completed',
      });
      completeFullAccess(result.message);
      return;
    }

    if (result.status === 'cancelled') {
      setIapStatusMessage(undefined);
      setIapErrorMessage(undefined);
      return;
    }

    if (result.status === 'pending') {
      setIapStatusMessage(result.message);
      return;
    }

    trackOfferEvent('iap_purchase_failed', {
      source: 'revenuecat',
      resultBand: 'failed',
    });
    setIapStatusMessage(undefined);
    setIapErrorMessage(result.message);
  };

  const handleRestore = async () => {
    if (iapBusy || isIapLoading || model.isFullAccess) {
      return;
    }

    setIsRestoring(true);
    setIapErrorMessage(undefined);
    setIapStatusMessage(IAP_OFFER_COPY.accessChecking);
    trackOfferEvent('iap_restore_started', {
      source: useRealPurchase ? 'revenuecat' : 'mock',
    });

    const result = await restoreIapPurchases(currentDay);
    setIsRestoring(false);

    if (result.status === 'restored' && result.entitlement) {
      applyIapEntitlement(result.entitlement);
      trackOfferEvent('iap_restore_completed', {
        source: 'revenuecat',
        resultBand: 'restored',
      });
      completeFullAccess(result.message);
      return;
    }

    trackOfferEvent('iap_restore_not_found', {
      source: useRealPurchase ? 'revenuecat' : 'mock',
      resultBand: result.status === 'failed' ? 'failed' : 'not_found',
    });
    setIapStatusMessage(undefined);
    setIapErrorMessage(result.message);
  };

  const handleSecondary = () => {
    trackOfferEvent(MOCK_PURCHASE_ANALYTICS_BRIDGE.limitedContinue, {
      source: 'post_pilot_offer',
    });
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

  const primaryDisabled =
    iapBusy || isIapLoading || (!useMockPurchase && !useRealPurchase && !model.isFullAccess);

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
          onPrimary={() => {
            void handlePrimary();
          }}
          onSecondary={handleSecondary}
          onRestore={() => {
            void handleRestore();
          }}
          primaryDisabled={primaryDisabled}
          restoreDisabled={iapBusy || isIapLoading || model.isFullAccess}
          statusMessage={iapStatusMessage}
          errorMessage={iapErrorMessage}
          priceLabel={priceLabel}
          productDisplayLabel={productDisplayLabel}
          isPurchasing={isPurchasing}
          isRestoring={isRestoring}
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
