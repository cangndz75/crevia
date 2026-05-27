import {
  getCompetencyScoreModifier,
  getTeamCompetencyScore,
} from './personnelCompetency';
import {
  applyPersonnelTaskResult,
  applyEndOfDayPersonnelUpdate,
  buildPersonnelTaskInput,
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
import type { PersonnelCompetencyKey, PersonnelTaskInput } from './personnelTypes';

function findTeam(state: ReturnType<typeof createInitialPersonnelState>, id: string) {
  const team = state.teams.find((t) => t.id === id);
  if (!team) throw new Error(`team not found: ${id}`);
  return team;
}

function buildCompetencyTaskInput(
  team: ReturnType<typeof findTeam>,
  requiredCompetency: PersonnelCompetencyKey,
  overrides?: Partial<PersonnelTaskInput>,
): PersonnelTaskInput {
  const competencyScore = getTeamCompetencyScore(team, requiredCompetency);
  return {
    team,
    difficulty: 'normal',
    districtId: 'merkez',
    districtDifficulty: 1.0,
    workedHours: 8,
    overtimeHours: 0,
    vehicleConditionPenalty: 0,
    roleMatchScore: 0.55,
    equipmentSupportActive: false,
    day: 1,
    requiredCompetency,
    competencyScore,
    ...overrides,
  };
}

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
    requiredCompetency: 'waste_collection',
    competencyScore: getTeamCompetencyScore(team, 'waste_collection'),
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
  } else {
    checks.push('OK clamp max');
  }

  // --- Competency scenarios ---
  const maintenanceTeam = findTeam(state, 'team-maintenance-c');
  const cleaningTeam = findTeam(state, 'team-cleaning-a');
  const fieldTeam = findTeam(state, 'team-field-supervisor');
  const driverTeam = findTeam(state, 'team-driver-b');

  const maintContainerInput = buildCompetencyTaskInput(
    maintenanceTeam,
    'container_maintenance',
  );
  const maintModifier = getCompetencyScoreModifier(
    maintContainerInput.competencyScore!,
  );
  const maintScore = calculateTaskSuccessScore(maintContainerInput);
  const maintRisk = calculatePersonnelMistakeRisk(maintContainerInput, maintScore);
  const maintBaselineInput = buildCompetencyTaskInput(maintenanceTeam, 'market_cleanup');
  const maintBaselineScore = calculateTaskSuccessScore(maintBaselineInput);
  const maintBaselineRisk = calculatePersonnelMistakeRisk(
    maintBaselineInput,
    maintBaselineScore,
  );

  if (maintModifier <= 0 || maintScore <= maintBaselineScore) {
    ok = false;
    checks.push(
      `FAIL scenario1 maintenance+container: mod=${maintModifier} score=${maintScore}`,
    );
  } else if (maintRisk >= maintBaselineRisk) {
    ok = false;
    checks.push(
      `FAIL scenario1 maintenance risk should drop: ${maintRisk} vs ${maintBaselineRisk}`,
    );
  } else {
    checks.push(
      `OK scenario1 maintenance+container mod=+${maintModifier} score=${maintScore} risk=${maintRisk}`,
    );
  }

  const cleanContainerInput = buildCompetencyTaskInput(
    cleaningTeam,
    'container_maintenance',
  );
  const cleanModifier = getCompetencyScoreModifier(
    cleanContainerInput.competencyScore!,
  );
  const cleanContainerScore = calculateTaskSuccessScore(cleanContainerInput);
  const cleanContainerRisk = calculatePersonnelMistakeRisk(
    cleanContainerInput,
    cleanContainerScore,
  );
  const cleanStrongInput = buildCompetencyTaskInput(cleaningTeam, 'waste_collection');
  const cleanStrongScore = calculateTaskSuccessScore(cleanStrongInput);

  if (cleanModifier >= 0 || cleanContainerScore >= cleanStrongScore) {
    ok = false;
    checks.push(
      `FAIL scenario2 cleaning+container: mod=${cleanModifier} weak=${cleanContainerScore} strong=${cleanStrongScore}`,
    );
  } else {
    checks.push(
      `OK scenario2 cleaning+container mod=${cleanModifier} score=${cleanContainerScore} risk=${cleanContainerRisk}`,
    );
  }

  const fieldComplaintInput = buildCompetencyTaskInput(fieldTeam, 'complaint_response');
  const fieldComplaintScore = calculateTaskSuccessScore(fieldComplaintInput);
  const fieldWeakInput = buildCompetencyTaskInput(fieldTeam, 'waste_collection');
  const fieldWeakScore = calculateTaskSuccessScore(fieldWeakInput);

  if (fieldComplaintScore <= fieldWeakScore) {
    ok = false;
    checks.push(
      `FAIL scenario3 field+complaint: ${fieldComplaintScore} vs weak ${fieldWeakScore}`,
    );
  } else {
    checks.push(`OK scenario3 field+complaint score=${fieldComplaintScore}`);
  }

  const driverRouteInput = buildCompetencyTaskInput(driverTeam, 'route_operation');
  const driverRouteScore = calculateTaskSuccessScore(driverRouteInput);
  const driverWeakInput = buildCompetencyTaskInput(driverTeam, 'crisis_coordination');
  const driverWeakScore = calculateTaskSuccessScore(driverWeakInput);

  if (driverRouteScore <= driverWeakScore) {
    ok = false;
    checks.push(
      `FAIL scenario4 driver+route: ${driverRouteScore} vs weak ${driverWeakScore}`,
    );
  } else {
    checks.push(`OK scenario4 driver+route score=${driverRouteScore}`);
  }

  // Preview/apply: buildPersonnelTaskInput competency wiring
  const wiredInput = buildPersonnelTaskInput({
    team: maintenanceTeam,
    event: {
      id: 'evt-maint',
      title: 'Konteyner bakım arızası',
      description: 'Konteyner arıza ve tamir müdahalesi',
      category: 'maintenance',
      contextTag: 'konteyner bakım',
      district: 'merkez',
      neighborhoodId: 'merkez',
      riskLevel: 'medium',
      urgencyHours: 8,
      decisions: [],
      previewEffects: {
        publicSatisfaction: 0,
        risk: 0,
        xp: 0,
      },
    },
    decision: {
      id: 'dec-maint',
      title: 'Arıza tamir',
      description: 'Konteyner bakım ve tamir',
      style: 'balanced',
      effects: {
        publicSatisfaction: 0,
        budget: 0,
        morale: 0,
        risk: 0,
        xp: 0,
      },
    },
    resources: {
      availableStaff: 12,
      availableVehicles: 6,
      overtimeHours: 0,
    },
    equipmentSupportActive: false,
    day: 1,
  });

  if (wiredInput.requiredCompetency !== 'container_maintenance') {
    ok = false;
    checks.push(
      `FAIL competency infer: ${wiredInput.requiredCompetency}`,
    );
  } else {
    checks.push('OK competency infer from event keywords');
  }

  return { ok, checks };
}

export function runVerifyPersonnelScenario(): void {
  const result = verifyPersonnelScenario();
  // eslint-disable-next-line no-console
  console.log('[personnel]', result.ok ? 'PASS' : 'FAIL', result.checks.join(' | '));
}
