export type GameplayLoopQaScenarioId =
  | 'day1_pilot_start'
  | 'day3_pilot_consequence'
  | 'day7_pilot_transition'
  | 'day8_first_strategic'
  | 'day8_low_data'
  | 'day10_mixed_city'
  | 'day12_high_pressure'
  | 'reduced_motion'
  | 'save_resume_smoke';

export type GameplayLoopQaScenarioSnapshot = {
  id: GameplayLoopQaScenarioId;
  day: number;
  visibleSurfaceCount: number;
  duplicateLineCount: number;
  eceLineCount: number;
  continuationCardCount: number;
  reportNoteCount: number;
  mapAnimatedCount: number;
  mapStrongCount: number;
  cityRhythmVisible: boolean;
  day8StrategicVisible: boolean;
  warnings: string[];
};

export type GameplayLoopQaOutcome = {
  ok: boolean;
  warn: boolean;
  checks: string[];
  snapshots: GameplayLoopQaScenarioSnapshot[];
};
