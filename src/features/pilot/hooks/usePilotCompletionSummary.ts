import { useMemo } from 'react';

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
  const gameState = useGameStore((s) => s.gameState);
  const decisionHistory = useGameStore(selectDecisionHistory);
  const dailyPriorityByDay = useGameStore((s) => s.dailyPriorityByDay);
  const dailyGoalsByDay = useGameStore((s) => s.dailyGoalsByDay);
  const lastDailyReport = useGameStore(selectLastDailyReport);
  const lastPilotScore = useGameStore((s) => s.lastPilotScore);
  const snapshots = useGameStore((s) => s.snapshots);

  return useMemo(
    () =>
      buildPilotCompletionSummary({
        gameState,
        decisionHistory,
        dailyPriorityByDay,
        dailyGoalsByDay,
        lastDailyReport,
        lastPilotScore,
        snapshots,
      }),
    [
      gameState,
      decisionHistory,
      dailyPriorityByDay,
      dailyGoalsByDay,
      lastDailyReport,
      lastPilotScore,
      snapshots,
    ],
  );
}

export function useReportPilotCompletionSummary(
  reportDay: number,
): PilotCompletionSummary | null {
  const summary = usePilotCompletionSummary();
  const pilotStatus = useGameStore((s) => s.gameState.pilot.status);

  return useMemo(() => {
    if (reportDay < 7 && pilotStatus !== 'completed') {
      return null;
    }
    if (reportDay < 7) {
      return null;
    }
    return summary.isCompleted ? summary : null;
  }, [reportDay, pilotStatus, summary]);
}

export { selectLastDailyReport };
