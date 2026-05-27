import {
  applyPersonnelTaskResult,
  applyEndOfDayPersonnelUpdate,
  calculateTaskFatigueGain,
  calculateTaskSuccessScore,
  clamp,
  getPersonnelStatus,
} from './personnelEngine';
import {
  calculatePersonnelMistakeRisk,
  resolveMistakeRiskLevel,
} from './personnelMistakeRisk';
import { createInitialPersonnelState } from './personnelSeed';
import type { PersonnelTaskInput } from './personnelTypes';

/** Geliştirme doğrulaması — denge regresyonu için hızlı senaryo. */
export function verifyPersonnelScenario(): {
  ok: boolean;
  checks: string[];
} {
  const checks: string[] = [];
  let ok = true;

  const state = createInitialPersonnelState();
  const team = state.teams[0]!;

  const sampleInput: PersonnelTaskInput = {
    team,
    difficulty: 'normal',
    districtId: 'merkez',
    districtDifficulty: 1.1,
    workedHours: 8,
    overtimeHours: 0,
    vehicleConditionPenalty: 0,
    roleMatchScore: 1,
    equipmentSupportActive: false,
    day: 1,
  };

  const fatigue = calculateTaskFatigueGain(sampleInput);
  if (fatigue <= 0 || fatigue > 35) {
    ok = false;
    checks.push(`FAIL fatigue gain=${fatigue}`);
  } else {
    checks.push(`OK fatigue gain=${fatigue}`);
  }

  const score = calculateTaskSuccessScore(sampleInput);
  if (score < 0 || score > 100) {
    ok = false;
    checks.push(`FAIL success score=${score}`);
  } else {
    checks.push(`OK success score=${score}`);
  }

  const mistakeRisk = calculatePersonnelMistakeRisk(sampleInput, score);
  const mistakeLevel = resolveMistakeRiskLevel(mistakeRisk);
  if (mistakeRisk < 0 || mistakeRisk > 28) {
    ok = false;
    checks.push(`FAIL mistake risk=${mistakeRisk}`);
  } else {
    checks.push(`OK mistake risk=${mistakeRisk} (${mistakeLevel})`);
  }

  const { team: afterTask, result: taskResult } = applyPersonnelTaskResult(
    team,
    sampleInput,
    {
      eventId: 'evt-test',
      decisionId: 'dec-test',
    },
  );
  if (
    taskResult.mistakeRisk !== mistakeRisk ||
    taskResult.mistakeRiskLevel !== mistakeLevel
  ) {
    ok = false;
    checks.push('FAIL task result mistake risk mismatch');
  }
  if (afterTask.fatigue <= team.fatigue) {
    ok = false;
    checks.push('FAIL fatigue should increase after task');
  } else {
    checks.push('OK fatigue increases after task');
  }

  const endState = applyEndOfDayPersonnelUpdate(
    { ...state, teams: [afterTask] },
    1,
  );
  const morning = endState.teams[0]!;
  if (morning.fatigue >= afterTask.fatigue) {
    ok = false;
    checks.push('FAIL night recovery should reduce fatigue');
  } else {
    checks.push(`OK morning fatigue=${morning.fatigue}`);
  }

  const status = getPersonnelStatus(morning.fatigue, false, false);
  if (!status) {
    ok = false;
    checks.push('FAIL status missing');
  } else {
    checks.push(`OK status=${status}`);
  }

  const clamped = clamp(150);
  if (clamped !== 100) {
    ok = false;
    checks.push('FAIL clamp max');
  }

  return { ok, checks };
}

export function runVerifyPersonnelScenario(): void {
  const result = verifyPersonnelScenario();
  // eslint-disable-next-line no-console
  console.log('[personnel]', result.ok ? 'PASS' : 'FAIL', result.checks.join(' | '));
}
