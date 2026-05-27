import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { selectPersonnelTeamCards } from '@/core/personnel/personnelSelectors';
import { useGameStore, selectPersonnelState } from '@/store/useGameStore';

export function usePersonnelTeams() {
  const personnelState = useGameStore(selectPersonnelState);
  const currentDay = useGameStore((s) => s.gameState.city.day);
  const neighborhoods = useGameStore(useShallow((s) => s.neighborhoods));

  const districtNames = useMemo(
    () => Object.fromEntries(neighborhoods.map((n) => [n.id, n.name])),
    [neighborhoods],
  );

  return useMemo(
    () => selectPersonnelTeamCards(personnelState, districtNames, currentDay),
    [currentDay, districtNames, personnelState],
  );
}
