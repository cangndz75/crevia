import { getPilotDayPlan } from '@/core/content/pilotDayPlan';
import type { PilotDayPlan } from '@/core/models/PilotDayPlan';
import type { PilotGameState } from '@/core/models/PilotGameState';

export function getCurrentPilotDayPlan(
  pilot: PilotGameState,
): PilotDayPlan | undefined {
  return getPilotDayPlan(pilot.currentPilotDay);
}
