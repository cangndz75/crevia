export type PersonnelRole =
  | 'cleaning'
  | 'driver'
  | 'maintenance'
  | 'field_supervisor';

export type PersonnelCompetencyKey =
  | 'waste_collection'
  | 'market_cleanup'
  | 'container_maintenance'
  | 'complaint_response'
  | 'crisis_coordination'
  | 'route_operation';

export type PersonnelTeamStatus =
  | 'idle'
  | 'assigned'
  | 'resting'
  | 'tired'
  | 'risky'
  | 'exhausted';

export type PersonnelWarningTag =
  | 'overtime_yesterday'
  | 'risky_fatigue'
  | 'low_morale'
  | 'exhausted_warning'
  | 'district_expert'
  | 'light_task_recommended'
  | 'rest_recommended'
  | 'routine_burnout'
  | 'role_mismatch'
  | 'consecutive_heavy';

export type TaskDifficulty = 'light' | 'normal' | 'hard' | 'crisis';

export type TaskOutcome = 'success' | 'partial' | 'weak' | 'failed';

export type PersonnelMistakeRiskLevel = 'low' | 'medium' | 'high';

export type PersonnelIncidentType =
  | 'task_delay'
  | 'incomplete_resolution'
  | 'weak_communication'
  | 'route_inefficiency'
  | 'maintenance_recheck'
  | 'coordination_gap';

export type PersonnelIncidentSeverity = 'minor' | 'moderate';

export type PersonnelIncidentCause =
  | 'fatigue'
  | 'morale'
  | 'experience'
  | 'role_mismatch'
  | 'combined';

export type PersonnelOperationalIncident = {
  day: number;
  teamId: string;
  teamName: string;
  type: PersonnelIncidentType;
  severity: PersonnelIncidentSeverity;
  cause: PersonnelIncidentCause;
  reportLine: string;
  riskScore: number;
};

export type RestActionType =
  | 'light_duty'
  | 'full_rest'
  | 'motivation'
  | 'equipment_support';

/** Gün içi dinlenme modu — gece sonunda sıfırlanır. */
export type PersonnelRestMode = 'light_duty' | 'full_rest';

export type PersonnelTeam = {
  id: string;
  name: string;
  role: PersonnelRole;
  fatigue: number;
  morale: number;
  efficiency: number;
  experience: number;
  currentDistrictId: string | null;
  assignedTaskId: string | null;
  status: PersonnelTeamStatus;
  todayWorkedHours: number;
  overtimeHours: number;
  consecutiveHeavyDays: number;
  consecutiveOvertimeDays: number;
  lastRestDay: number | null;
  districtFamiliarity: Record<string, number>;
  completedTasks: number;
  failedTasks: number;
  warningTags: PersonnelWarningTag[];
  /** Aynı mahallede üst üste yoğun gün sayacı */
  consecutiveDistrictDays: number;
  lastDistrictId: string | null;
  /** Gün içi moral değişim toplamı (sınırlama için) */
  moraleDeltaToday: number;
  /** Son görevde tükenmiş halde gönderildi mi */
  sentExhaustedLastTask: boolean;
  /** Tam dinlenme veya hafif görev planı */
  restMode: PersonnelRestMode | null;
  competencies: Record<PersonnelCompetencyKey, number>;
};

export type PersonnelDayAssignment = {
  day: number;
  teamId: string;
  eventId: string;
  decisionId: string;
  districtId: string;
  difficulty: TaskDifficulty;
  outcome: TaskOutcome;
  successScore: number;
  fatigueGain: number;
  moraleDelta: number;
};

export type PersonnelTaskInput = {
  team: PersonnelTeam;
  difficulty: TaskDifficulty;
  districtId: string;
  districtDifficulty: number;
  workedHours: number;
  overtimeHours: number;
  vehicleConditionPenalty: number;
  weatherPenalty?: number;
  roleMatchScore: number;
  equipmentSupportActive: boolean;
  day: number;
  requiredCompetency?: PersonnelCompetencyKey;
  competencyScore?: number;
};

export type PersonnelTaskResult = {
  fatigueGain: number;
  moraleDelta: number;
  successScore: number;
  outcome: TaskOutcome;
  familiarityGain: number;
  experienceGain: number;
  failedTask: boolean;
  operationalIncidentRisk: boolean;
  mistakeRisk: number;
  mistakeRiskLevel: PersonnelMistakeRiskLevel;
  operationalIncident: PersonnelOperationalIncident | null;
};

export type PersonnelState = {
  teams: PersonnelTeam[];
  dayAssignments: PersonnelDayAssignment[];
  equipmentSupportUntilDay: number | null;
  eventCooldowns: Record<string, number>;
  lastProcessedDay: number;
  /** Ekip başına motivasyon kullanım günü */
  motivationUsedByTeamId: Record<string, number>;
  /** Ekipman desteği bu gün kullanıldı mı */
  equipmentSupportUsedDay: number | null;
  /** Gün içi operasyonel aksaklıklar — gece sonunda sıfırlanır */
  dayIncidents?: PersonnelOperationalIncident[];
};

export type PersonnelDayReport = {
  day: number;
  summaryLines: string[];
  warnings: string[];
  highlights: string[];
  incidentLines: string[];
  mostFatiguedTeamId: string | null;
  moraleRisingTeamIds: string[];
  moraleFallingTeamIds: string[];
  riskyTeamIds: string[];
};

export type PersonnelTeamCardView = {
  id: string;
  name: string;
  role: PersonnelRole;
  roleLabel: string;
  fatigue: number;
  morale: number;
  status: PersonnelTeamStatus;
  statusLabel: string;
  todayWorkedHours: number;
  readinessText: string;
  warningLabels: string[];
  fatigueBandLabel: string;
  restModeLabel: string | null;
  supportTag: string | null;
  strongestCompetencyLabel: string | null;
  weakestCompetencyLabel: string | null;
};
