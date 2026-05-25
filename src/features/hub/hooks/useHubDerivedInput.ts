import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import type { EventCard } from '@/core/models/EventCard';
import type { HubDerivedInput } from '@/features/hub/utils/hubDerived';
import { useGameStore } from '@/store/useGameStore';

type HubDerivedFlat = {
  day: number;
  publicSatisfaction: number;
  budget: number;
  staffMorale: number;
  activeEvents: EventCard[];
  decisionCount: number;
};

/**
 * Hub türetilmiş verileri.
 * useShallow yalnızca üst seviye anahtarları karşılaştırır — metrics iç içe nesne olmamalı.
 */
export function useHubDerivedInput(): HubDerivedInput {
  const flat = useGameStore(
    useShallow(
      (s): HubDerivedFlat => ({
        day: s.gameState.city.day,
        publicSatisfaction: s.gameState.city.publicSatisfaction,
        budget: s.gameState.city.budget,
        staffMorale: s.gameState.city.morale,
        activeEvents: s.gameState.events,
        decisionCount: s.decisionHistory.length,
      }),
    ),
  );

  return useMemo(
    () => ({
      day: flat.day,
      metrics: {
        publicSatisfaction: flat.publicSatisfaction,
        budget: flat.budget,
        staffMorale: flat.staffMorale,
      },
      activeEvents: flat.activeEvents,
      decisionCount: flat.decisionCount,
    }),
    [
      flat.day,
      flat.publicSatisfaction,
      flat.budget,
      flat.staffMorale,
      flat.activeEvents,
      flat.decisionCount,
    ],
  );
}
