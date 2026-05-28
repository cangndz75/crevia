import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import {
  buildPilotCompletionSummary,
  type PilotCompletionSummary,
} from '@/core/pilotCompletion';
import {
  selectDecisionHistory,
  selectLastDailyReport,
  useGameStore,
} from '@/store/useGameStore';

export function usePilotCompletionSummary(): PilotCompletionSummary {
  const slice = useGameStore(
    useShallow((s) => ({
      gameState: s.gameState,
      decisionHistory: s.decisionHistory,
      dailyPriorityByDay: s.dailyPriorityByDay,
      dailyGoalsByDay: s.dailyGoalsByDay,
      lastDailyReport: s.lastDailyReport,
      lastPilotScore: s.lastPilotScore,
      snapshots: s.snapshots,
    })),
  );

  return useMemo(
    () =>
      buildPilotCompletionSummary({
        gameState: slice.gameState,
        decisionHistory: slice.decisionHistory,
        dailyPriorityByDay: slice.dailyPriorityByDay,
        dailyGoalsByDay: slice.dailyGoalsByDay,
        lastDailyReport: slice.lastDailyReport,
        lastPilotScore: slice.lastPilotScore,
        snapshots: slice.snapshots,
      }),
    [slice],
  );
}

export function useReportPilotCompletionSummary(
  reportDay: number,
): PilotCompletionSummary | null {
  const summary = usePilotCompletionSummary();
  const gameState = useGameStore((s) => s.gameState);

  return useMemo(() => {
    if (reportDay < 7 && gameState.pilot.status !== 'completed') {
      return null;
    }
    if (reportDay < 7) {
      return null;
    }
    return summary.isCompleted ? summary : null;
  }, [reportDay, gameState.pilot.status, summary]);
}

export { selectLastDailyReport };
