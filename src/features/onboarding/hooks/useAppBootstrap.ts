import { useCallback, useEffect, useState } from 'react';

import { DAY1_ROLE } from '@/core/content/day1Seed';
import {
  DEFAULT_PILOT_DISTRICT_ID,
  type PilotDistrictId,
} from '@/core/models/DistrictProfile';
import {
  isOnboardingStarterDecisionId,
  type OnboardingStarterDecisionId,
} from '@/core/onboarding/onboardingStarterDecision';
import { breadcrumbOfflineResumeWarning } from '@/core/crashPerformance/crashBreadcrumbs';
import { checkConnectivity, subscribeConnectivity } from '@/core/onboarding/connectivity';
import {
  isOnboardingComplete,
  setOnboardingComplete,
} from '@/core/onboarding/onboardingStorage';
import { selectHasHydrated, useGameStore } from '@/store/useGameStore';

/** CREVIA logosunun en az bu kadar görünmesi (ms) */
export const MIN_SPLASH_MS = 1600;

export type AppBootstrapPhase =
  | 'loading'
  | 'offline'
  | 'onboarding'
  | 'ready';

export function useAppBootstrap() {
  const [phase, setPhase] = useState<AppBootstrapPhase>('loading');
  const [gateOpen, setGateOpen] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const hasHydrated = useGameStore(selectHasHydrated);

  const resolvePhase = useCallback(async () => {
    setGateOpen(false);
    setPhase('loading');

    const startedAt = Date.now();
    const online = await checkConnectivity();

    if (!online) {
      const elapsed = Date.now() - startedAt;
      const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
      await new Promise((r) => setTimeout(r, wait));
      breadcrumbOfflineResumeWarning({ scenario: 'connectivity_offline', status: 'blocked' });
      setPhase('offline');
      setGateOpen(true);
      return;
    }

    const completed = await isOnboardingComplete();
    const elapsed = Date.now() - startedAt;
    const wait = Math.max(0, MIN_SPLASH_MS - elapsed);
    await new Promise((r) => setTimeout(r, wait));

    if (completed) {
      const store = useGameStore.getState();
      if (store._hasHydrated && store.gameState?.city) {
        breadcrumbOfflineResumeWarning({
          scenario: 'hydrated_save_resume',
          status: 'ready',
        });
      }
    }

    setPhase(completed ? 'ready' : 'onboarding');
    setGateOpen(true);
  }, []);

  useEffect(() => {
    void resolvePhase();

    const unsubscribe = subscribeConnectivity((online) => {
      if (!online) {
        setGateOpen(true);
        setPhase('offline');
        return;
      }
      void resolvePhase();
    });

    return unsubscribe;
  }, [resolvePhase]);

  const retryConnection = useCallback(async () => {
    setRetrying(true);
    try {
      await resolvePhase();
    } finally {
      setRetrying(false);
    }
  }, [resolvePhase]);

  /** Onboarding biter — bayrak yazılır, pilot bölge ve ilk karar store'a işlenir. */
  const completeOnboarding = useCallback(
    async (payload?: {
      districtId?: PilotDistrictId;
      starterDecision?: OnboardingStarterDecisionId;
    }) => {
      const districtId = payload?.districtId ?? DEFAULT_PILOT_DISTRICT_ID;
      const starterDecision = payload?.starterDecision ?? 'fast';

      await setOnboardingComplete();

      const store = useGameStore.getState();
      const hydratedSaveExists =
        store._hasHydrated &&
        store.gameState?.city &&
        store.gameState.player.role === DAY1_ROLE;

      if (!hydratedSaveExists) {
        store.initializeDay1();
      }

      store.startPilotDistrict(districtId);

      if (isOnboardingStarterDecisionId(starterDecision)) {
        store.applyOnboardingStarterDecision(starterDecision);
      }

      setPhase('ready');
      setGateOpen(true);
    },
    [],
  );

  const effectiveGateOpen = gateOpen && hasHydrated;

  return {
    phase,
    gateOpen: effectiveGateOpen,
    retrying,
    retryConnection,
    completeOnboarding,
  };
}
