import type { PersonnelCompetencyKey, PersonnelState, PersonnelTeam } from './personnelTypes';
import { getPersonnelStatus, getPersonnelWarnings } from './personnelEngine';

function competencies(
  values: Record<PersonnelCompetencyKey, number>,
): Record<PersonnelCompetencyKey, number> {
  return values;
}

function createTeam(partial: Omit<PersonnelTeam, 'warningTags' | 'status'>): PersonnelTeam {
  const team: PersonnelTeam = {
    ...partial,
    status: getPersonnelStatus(partial.fatigue, false, false),
    warningTags: [],
  };
  team.warningTags = getPersonnelWarnings(team);
  return team;
}

export function createInitialPersonnelTeams(): PersonnelTeam[] {
  return [
    createTeam({
      id: 'team-cleaning-a',
      name: 'Temizlik Ekibi A',
      role: 'cleaning',
      fatigue: 22,
      morale: 68,
      efficiency: 72,
      experience: 35,
      currentDistrictId: null,
      assignedTaskId: null,
      todayWorkedHours: 0,
      overtimeHours: 0,
      consecutiveHeavyDays: 0,
      consecutiveOvertimeDays: 0,
      lastRestDay: null,
      districtFamiliarity: { merkez: 40, sanayi: 18 },
      completedTasks: 0,
      failedTasks: 0,
      consecutiveDistrictDays: 0,
      lastDistrictId: null,
      moraleDeltaToday: 0,
      sentExhaustedLastTask: false,
      restMode: null,
      competencies: competencies({
        waste_collection: 78,
        market_cleanup: 72,
        container_maintenance: 34,
        complaint_response: 46,
        crisis_coordination: 38,
        route_operation: 48,
      }),
    }),
    createTeam({
      id: 'team-driver-b',
      name: 'Sürücü Ekibi B',
      role: 'driver',
      fatigue: 28,
      morale: 62,
      efficiency: 70,
      experience: 42,
      currentDistrictId: null,
      assignedTaskId: null,
      todayWorkedHours: 0,
      overtimeHours: 0,
      consecutiveHeavyDays: 0,
      consecutiveOvertimeDays: 0,
      lastRestDay: null,
      districtFamiliarity: { merkez: 28, liman: 22 },
      completedTasks: 0,
      failedTasks: 0,
      consecutiveDistrictDays: 0,
      lastDistrictId: null,
      moraleDeltaToday: 0,
      sentExhaustedLastTask: false,
      restMode: null,
      competencies: competencies({
        waste_collection: 58,
        market_cleanup: 40,
        container_maintenance: 30,
        complaint_response: 36,
        crisis_coordination: 34,
        route_operation: 84,
      }),
    }),
    createTeam({
      id: 'team-maintenance-c',
      name: 'Bakım Ekibi C',
      role: 'maintenance',
      fatigue: 18,
      morale: 70,
      efficiency: 74,
      experience: 38,
      currentDistrictId: null,
      assignedTaskId: null,
      todayWorkedHours: 0,
      overtimeHours: 0,
      consecutiveHeavyDays: 0,
      consecutiveOvertimeDays: 0,
      lastRestDay: null,
      districtFamiliarity: { sanayi: 32, merkez: 20 },
      completedTasks: 0,
      failedTasks: 0,
      consecutiveDistrictDays: 0,
      lastDistrictId: null,
      moraleDeltaToday: 0,
      sentExhaustedLastTask: false,
      restMode: null,
      competencies: competencies({
        waste_collection: 38,
        market_cleanup: 34,
        container_maintenance: 86,
        complaint_response: 38,
        crisis_coordination: 44,
        route_operation: 46,
      }),
    }),
    createTeam({
      id: 'team-field-supervisor',
      name: 'Saha Sorumlusu',
      role: 'field_supervisor',
      fatigue: 24,
      morale: 66,
      efficiency: 76,
      experience: 48,
      currentDistrictId: null,
      assignedTaskId: null,
      todayWorkedHours: 0,
      overtimeHours: 0,
      consecutiveHeavyDays: 0,
      consecutiveOvertimeDays: 0,
      lastRestDay: null,
      districtFamiliarity: { merkez: 52, sanayi: 24 },
      completedTasks: 0,
      failedTasks: 0,
      consecutiveDistrictDays: 0,
      lastDistrictId: null,
      moraleDeltaToday: 0,
      sentExhaustedLastTask: false,
      restMode: null,
      competencies: competencies({
        waste_collection: 36,
        market_cleanup: 34,
        container_maintenance: 42,
        complaint_response: 82,
        crisis_coordination: 84,
        route_operation: 50,
      }),
    }),
  ];
}

export function createInitialPersonnelState(): PersonnelState {
  return {
    teams: createInitialPersonnelTeams(),
    dayAssignments: [],
    equipmentSupportUntilDay: null,
    eventCooldowns: {},
    lastProcessedDay: 0,
    motivationUsedByTeamId: {},
    equipmentSupportUsedDay: null,
    dayIncidents: [],
  };
}
